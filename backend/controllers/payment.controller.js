import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import Razorpay from 'razorpay';
import crypto from 'crypto';

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Create payment record (Investor or Builder)
 * POST /api/payments
 */
export async function createPayment(req, res) {
  try {
    const { projectId, amount, paymentMethod, transactionId, gatewayResponse } = req.body;
    const role = req.auth.role;
    const investorId = role === 'INVESTOR' ? (req.investor?.id ?? req.auth.id) : null;
    const builderId = role === 'BUILDER' ? req.auth.id : null;

    const projId = parseInt(projectId, 10);
    if (Number.isNaN(projId) || amount == null || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid projectId and positive amount are required.',
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projId },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: investorId || undefined,
        builderId: builderId || undefined,
        projectId: projId,
        amount: new Decimal(amount),
        paymentStatus: 'PENDING',
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        transactionId: transactionId || null,
        gatewayResponse: gatewayResponse || undefined,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Payment record created.',
      data: serializePayment(payment),
    });
  } catch (err) {
    console.error('createPayment:', err);
    res.status(500).json({ success: false, message: 'Failed to create payment.' });
  }
}

/**
 * Link payment to investment (update payment status and optionally create/update investment)
 * PATCH /api/payments/:id/link-investment
 */
export async function linkPaymentToInvestment(req, res) {
  try {
    const paymentId = parseInt(req.params.id, 10);
    const investorId = req.investor?.id ?? req.auth.id;
    if (Number.isNaN(paymentId)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID.' });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: investorId },
    });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }
    if (payment.paymentStatus !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be linked.',
      });
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { paymentStatus: 'SUCCESS' },
    });

    res.json({
      success: true,
      message: 'Payment linked successfully.',
      data: serializePayment({ ...payment, paymentStatus: 'SUCCESS' }),
    });
  } catch (err) {
    console.error('linkPaymentToInvestment:', err);
    res.status(500).json({ success: false, message: 'Failed to link payment.' });
  }
}

/**
 * List payments for current investor or builder
 * GET /api/payments
 */
export async function listPayments(req, res) {
  try {
    const role = req.auth.role;
    const investorId = role === 'INVESTOR' ? (req.investor?.id ?? req.auth.id) : null;
    const builderId = role === 'BUILDER' ? req.auth.id : null;

    const where = {};
    if (investorId) where.userId = investorId;
    if (builderId) where.builderId = builderId;
    if (!investorId && !builderId) {
      return res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0 } });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    res.json({
      success: true,
      data: payments.map((p) => ({
        ...serializePayment(p),
        project: p.project,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('listPayments:', err);
    res.status(500).json({ success: false, message: 'Failed to list payments.' });
  }
}

function serializePayment(p) {
  return {
    id: p.id,
    investorId: p.userId,
    builderId: p.builderId,
    projectId: p.projectId,
    amount: p.amount?.toString?.() ?? p.amount,
    paymentStatus: p.paymentStatus,
    paymentMethod: p.paymentMethod,
    transactionId: p.transactionId,
    createdAt: p.createdAt,
  };
}

function toNumber(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * POST /api/investor/create-order
 * Body: { projectId, amount }
 */
export async function createInvestorOrder(req, res) {
  try {
    const razorpayClient = getRazorpayClient();
    if (!razorpayClient) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay is not configured.',
      });
    }

    const investorId = req.investor?.id ?? req.auth.id;
    const { projectId, amount } = req.body;
    const projId = Number.parseInt(projectId, 10);
    const investAmount = toNumber(amount);

    if (!Number.isInteger(projId) || investAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid projectId and positive amount are required.',
      });
    }

    const investor = await prisma.user.findUnique({
      where: { id: investorId },
      select: { role: true, isActive: true, kycStatus: true, fullName: true, email: true },
    });
    if (!investor || investor.role !== 'INVESTOR') {
      return res.status(403).json({ success: false, message: 'Only investors can invest.' });
    }
    if (!investor.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is blocked.' });
    }
    if (investor.kycStatus !== 'VERIFIED') {
      return res.status(403).json({ success: false, message: 'Only verified investors can invest.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projId },
      include: { investments: { select: { investedAmount: true } } },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Project is not open for investment.' });
    }

    const minInvestment = toNumber(project.minInvestment?.toString?.() ?? project.minInvestment);
    if (investAmount < minInvestment) {
      return res.status(400).json({ success: false, message: `Minimum investment is ${minInvestment}.` });
    }

    const totalValue = toNumber(project.totalValue?.toString?.() ?? project.totalValue);
    const fundsRaised = project.investments.reduce(
      (sum, i) => sum + toNumber(i.investedAmount?.toString?.() ?? i.investedAmount),
      0
    );
    const remaining = Math.max(0, totalValue - fundsRaised);
    if (remaining <= 0) {
      return res.status(400).json({ success: false, message: 'Project is already fully funded.' });
    }
    if (investAmount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Investment exceeds remaining funding. Remaining: ${remaining}.`,
      });
    }

    const existing = await prisma.investment.findUnique({
      where: { userId_projectId: { userId: investorId, projectId: projId } },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an investment in this project.',
      });
    }

    const amountPaise = Math.round(investAmount * 100);
    const order = await razorpayClient.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `inv_${investorId}_${projId}_${Date.now()}`,
      notes: {
        investor_id: String(investorId),
        project_id: String(projId),
      },
    });

    await prisma.payment.create({
      data: {
        userId: investorId,
        projectId: projId,
        amount: new Decimal(investAmount),
        paymentStatus: 'PENDING',
        paymentMethod: 'RAZORPAY',
        transactionId: order.id,
        gatewayResponse: {
          provider: 'razorpay',
          order_id: order.id,
          amount: investAmount,
          currency: 'INR',
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    console.error('createInvestorOrder:', err);
    return res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
}

/**
 * POST /api/investor/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, projectId, amount }
 */
export async function verifyInvestorPayment(req, res) {
  try {
    const investorId = req.investor?.id ?? req.auth.id;
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      projectId,
      amount,
    } = req.body;

    const projId = Number.parseInt(projectId, 10);
    const investAmount = toNumber(amount);
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !Number.isInteger(projId) || investAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment verification payload.' });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ success: false, message: 'Razorpay is not configured.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }

    const investor = await prisma.user.findUnique({
      where: { id: investorId },
      select: { role: true, isActive: true, kycStatus: true },
    });
    if (!investor || investor.role !== 'INVESTOR') {
      return res.status(403).json({ success: false, message: 'Only investors can invest.' });
    }
    if (!investor.isActive) {
      return res.status(403).json({ success: false, message: 'Your account is blocked.' });
    }
    if (investor.kycStatus !== 'VERIFIED') {
      return res.status(403).json({ success: false, message: 'Only verified investors can invest.' });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: razorpayOrderId,
        userId: investorId,
        projectId: projId,
      },
    });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment order not found.' });
    }
    if (payment.paymentStatus === 'SUCCESS') {
      return res.json({ success: true, message: 'Payment already verified.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projId },
      include: { investments: { select: { investedAmount: true } } },
    });
    if (!project || project.projectStatus !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Project is not open for investment.' });
    }

    const minInvestment = toNumber(project.minInvestment?.toString?.() ?? project.minInvestment);
    if (investAmount < minInvestment) {
      return res.status(400).json({ success: false, message: `Minimum investment is ${minInvestment}.` });
    }

    const totalValue = toNumber(project.totalValue?.toString?.() ?? project.totalValue);
    const fundsRaised = project.investments.reduce(
      (sum, i) => sum + toNumber(i.investedAmount?.toString?.() ?? i.investedAmount),
      0
    );
    const remaining = Math.max(0, totalValue - fundsRaised);
    if (investAmount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Investment exceeds remaining funding. Remaining: ${remaining}.`,
      });
    }

    const pricePerShare = new Decimal(project.pricePerShare);
    const decimalAmount = new Decimal(investAmount);
    const sharesPurchased = Math.floor(Number(decimalAmount.div(pricePerShare)));
    if (sharesPurchased < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount is too low to purchase at least one share.',
      });
    }

    const actualAmount = pricePerShare.mul(sharesPurchased);

    const result = await prisma.$transaction(async (tx) => {
      const existingInvestment = await tx.investment.findUnique({
        where: { userId_projectId: { userId: investorId, projectId: projId } },
      });
      if (existingInvestment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            paymentStatus: 'SUCCESS',
            paymentMethod: 'RAZORPAY',
            gatewayResponse: {
              ...(payment.gatewayResponse || {}),
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: razorpayPaymentId,
              razorpay_signature: razorpaySignature,
            },
          },
        });
        return { investment: existingInvestment, alreadyExisted: true };
      }

      const investment = await tx.investment.create({
        data: {
          userId: investorId,
          projectId: projId,
          investedAmount: actualAmount,
          sharesPurchased,
          investmentStatus: 'ACTIVE',
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: 'SUCCESS',
          paymentMethod: 'RAZORPAY',
          transactionId: razorpayPaymentId,
          gatewayResponse: {
            ...(payment.gatewayResponse || {}),
            razorpay_order_id: razorpayOrderId,
            razorpay_payment_id: razorpayPaymentId,
            razorpay_signature: razorpaySignature,
          },
        },
      });

      const refreshed = await tx.investment.aggregate({
        where: { projectId: projId, investmentStatus: 'ACTIVE' },
        _sum: { investedAmount: true },
      });
      const newRaised = toNumber(refreshed._sum.investedAmount?.toString?.() ?? refreshed._sum.investedAmount);
      if (newRaised >= totalValue) {
        await tx.project.update({
          where: { id: projId },
          data: { projectStatus: 'FUNDED' },
        });
      }

      return { investment, alreadyExisted: false };
    });

    return res.json({
      success: true,
      message: result.alreadyExisted ? 'Payment verified.' : 'Payment verified and investment recorded.',
      data: {
        investmentId: result.investment.id,
        projectId: projId,
      },
    });
  } catch (err) {
    console.error('verifyInvestorPayment:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
}
