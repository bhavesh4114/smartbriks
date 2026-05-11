import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../utils/prisma.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';

function toNumber(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

async function ensureWallet(userId) {
  return prisma.wallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: new Decimal(0) },
  });
}

export async function getWallet(req, res) {
  try {
    const userId = req.auth.id;
    const wallet = await ensureWallet(userId);

    return res.json({
      success: true,
      data: {
        walletId: wallet.id,
        balance: wallet.balance.toString(),
      },
    });
  } catch (err) {
    console.error('getWallet:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch wallet.' });
  }
}

export async function getWalletTransactions(req, res) {
  try {
    const userId = req.auth.id;
    const wallet = await ensureWallet(userId);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
    ]);

    return res.json({
      success: true,
      data: rows.map((row) => ({
        id: row.id,
        amount: row.amount.toString(),
        type: row.type,
        description: row.description,
        status: row.status,
        createdAt: row.createdAt,
        externalRef: row.externalRef,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('getWalletTransactions:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch wallet transactions.' });
  }
}

/**
 * POST /api/investor/add-money
 * Body: { amount }
 * - If Razorpay configured: creates order + pending wallet transaction
 * - Otherwise (non-production): mock credit success
 */
export async function addMoney(req, res) {
  try {
    const userId = req.auth.id;
    const amount = toNumber(req.body?.amount);
    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }
    if (amount > 1_000_000) {
      return res.status(400).json({ success: false, message: 'Amount exceeds top-up limit.' });
    }

    const wallet = await ensureWallet(userId);
    const razorpayClient = getRazorpayClient();

    if (!razorpayClient) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ success: false, message: 'Payment gateway not configured.' });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: new Decimal(amount) } },
        });
        const txn = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: new Decimal(amount),
            type: 'CREDIT',
            description: 'Top-up (Mock)',
            status: 'SUCCESS',
            externalRef: `MOCK_TOPUP_${userId}_${Date.now()}`,
            metadata: { mode: 'mock' },
          },
        });
        return { updatedWallet, txn };
      });

      return res.status(201).json({
        success: true,
        message: 'Wallet top-up successful (mock).',
        data: {
          transactionId: result.txn.id,
          balance: result.updatedWallet.balance.toString(),
          mode: 'mock',
        },
      });
    }

    const order = await razorpayClient.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `topup_${userId}_${Date.now()}`,
      notes: { user_id: String(userId), purpose: 'wallet_topup' },
    });

    const txn = await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: new Decimal(amount),
        type: 'CREDIT',
        description: 'Top-up',
        status: 'PENDING',
        externalRef: order.id,
        metadata: { provider: 'razorpay', order_id: order.id },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Top-up order created.',
      data: {
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        transactionId: txn.id,
        mode: 'razorpay',
      },
    });
  } catch (err) {
    console.error('addMoney:', err);
    return res.status(500).json({ success: false, message: 'Failed to create top-up.' });
  }
}

/**
 * POST /api/investor/add-money/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function verifyAddMoney(req, res) {
  try {
    const userId = req.auth.id;
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body ?? {};

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: 'Invalid verification payload.' });
    }
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Payment gateway not configured.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const wallet = await ensureWallet(userId);
    const pendingTxn = await prisma.walletTransaction.findFirst({
      where: {
        walletId: wallet.id,
        externalRef: orderId,
      },
    });
    if (!pendingTxn) {
      return res.status(404).json({ success: false, message: 'Top-up transaction not found.' });
    }
    if (pendingTxn.status === 'SUCCESS') {
      const currentWallet = await prisma.wallet.findUnique({ where: { id: wallet.id } });
      return res.json({
        success: true,
        message: 'Top-up already verified.',
        data: { balance: currentWallet?.balance?.toString?.() ?? '0' },
      });
    }
    if (pendingTxn.status === 'FAILED') {
      return res.status(400).json({ success: false, message: 'Top-up transaction has failed.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: pendingTxn.amount } },
      });
      await tx.walletTransaction.update({
        where: { id: pendingTxn.id },
        data: {
          status: 'SUCCESS',
          metadata: {
            ...(pendingTxn.metadata || {}),
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
          },
        },
      });
      return updatedWallet;
    });

    return res.json({
      success: true,
      message: 'Wallet top-up successful.',
      data: { balance: result.balance.toString() },
    });
  } catch (err) {
    console.error('verifyAddMoney:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify top-up.' });
  }
}

/**
 * POST /api/investor/invest
 * Body: { projectId, amount }
 */
export async function investFromWallet(req, res) {
  try {
    const userId = req.auth.id;
    const projectId = parseInt(req.body?.projectId, 10);
    const amount = toNumber(req.body?.amount);

    if (!Number.isInteger(projectId) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid projectId and amount are required.' });
    }

    const [investor, wallet, project] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isActive: true, kycStatus: true },
      }),
      ensureWallet(userId),
      prisma.project.findUnique({
        where: { id: projectId },
        include: { investments: { select: { investedAmount: true } } },
      }),
    ]);

    if (!investor || investor.role !== 'INVESTOR') {
      return res.status(403).json({ success: false, message: 'Only investors can invest.' });
    }
    if (!investor.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is inactive.' });
    }
    if (investor.kycStatus !== 'VERIFIED') {
      return res.status(403).json({ success: false, message: 'Complete KYC before investing.' });
    }
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!['APPROVED', 'ACTIVE'].includes(project.projectStatus)) {
      return res.status(400).json({ success: false, message: 'Project is not open for investment.' });
    }

    const minInvestment = toNumber(project.minInvestment?.toString?.() ?? project.minInvestment);
    if (amount < minInvestment) {
      return res.status(400).json({ success: false, message: `Minimum investment is ${minInvestment}.` });
    }

    const totalValue = toNumber(project.totalValue?.toString?.() ?? project.totalValue);
    const fundsRaised = project.investments.reduce(
      (sum, inv) => sum + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
      0
    );
    const remaining = Math.max(0, totalValue - fundsRaised);
    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Investment exceeds remaining funding. Remaining: ${remaining}.`,
      });
    }

    const pricePerShare = new Decimal(project.pricePerShare);
    const decimalAmount = new Decimal(amount);
    const sharesPurchased = Math.floor(Number(decimalAmount.div(pricePerShare)));
    if (sharesPurchased < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount is too low to purchase at least one share.',
      });
    }
    const actualAmount = pricePerShare.mul(sharesPurchased);

    const existing = await prisma.investment.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already invested in this project.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const debitWallet = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: actualAmount },
        },
        data: { balance: { decrement: actualAmount } },
      });
      if (debitWallet.count !== 1) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      const investment = await tx.investment.create({
        data: {
          userId,
          projectId,
          investedAmount: actualAmount,
          sharesPurchased,
          investmentStatus: 'ACTIVE',
        },
      });

      const txn = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: actualAmount,
          type: 'DEBIT',
          description: `Investment in project #${projectId}`,
          status: 'SUCCESS',
          externalRef: `INVEST_${investment.id}`,
          metadata: { projectId, investmentId: investment.id },
        },
      });

      await createNotification(tx, {
        userId,
        type: 'success',
        title: 'Investment Confirmed',
        message: `Your investment of ₹${actualAmount.toString()} in ${project.title} has been confirmed.`,
        metadata: { event: 'BUY', projectId, investmentId: investment.id },
      });
      await createNotification(tx, {
        builderId: project.builderId,
        type: 'success',
        title: 'New Investment Received',
        message: `An investor bought shares worth ₹${actualAmount.toString()} in ${project.title}.`,
        metadata: { event: 'BUY', projectId, investmentId: investment.id },
      });
      await notifyAdmins(tx, {
        type: 'info',
        title: 'New Investment',
        message: `Investment of ₹${actualAmount.toString()} received for ${project.title}.`,
        metadata: { event: 'BUY', projectId, investmentId: investment.id },
      });

      const aggregate = await tx.investment.aggregate({
        where: { projectId, investmentStatus: 'ACTIVE' },
        _sum: { investedAmount: true },
      });
      const raisedNow = toNumber(
        aggregate._sum.investedAmount?.toString?.() ?? aggregate._sum.investedAmount
      );
      if (raisedNow >= totalValue) {
        await tx.project.update({
          where: { id: projectId },
          data: {
            projectStatus: 'PENDING_APPROVAL',
            rejectionReason: null,
          },
        });
        await createNotification(tx, {
          builderId: project.builderId,
          type: 'success',
          title: 'Funding Goal Reached',
          message: `${project.title} is fully funded and sent for admin approval.`,
          metadata: { event: 'FUNDING_FULL', projectId },
        });
        await notifyAdmins(tx, {
          type: 'warning',
          title: 'Funding Approval Pending',
          message: `${project.title} is fully funded and ready for payout review.`,
          metadata: { event: 'FUNDING_FULL', projectId },
        });
      }

      const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
      return { investment, txn, wallet: updatedWallet };
    });

    return res.status(201).json({
      success: true,
      message: 'Investment successful.',
      data: {
        investmentId: result.investment.id,
        investedAmount: result.investment.investedAmount.toString(),
        sharesPurchased: result.investment.sharesPurchased,
        balance: result.wallet?.balance?.toString?.() ?? '0',
      },
    });
  } catch (err) {
    if (err?.message === 'INSUFFICIENT_BALANCE') {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }
    console.error('investFromWallet:', err);
    return res.status(500).json({ success: false, message: 'Failed to process investment.' });
  }
}
