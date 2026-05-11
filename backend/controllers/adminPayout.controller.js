import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';
import { ensureProjectFundRelease } from '../utils/builderFunds.js';
import { createNotification, notifyAdmins } from '../utils/notifications.js';

function toNum(value) {
  const n = Number(value?.toString?.() ?? value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function payoutCalculation(project) {
  const investments = project.investments ?? [];
  const raised = investments.reduce(
    (sum, inv) => sum + toNum(inv.investedAmount),
    0
  );
  const required = toNum(project.totalValue);
  const roiPercent = toNum(project.expectedROI);
  const totalProfitAmount = (raised * roiPercent) / 100;
  const investorProfitAmount = (totalProfitAmount * 70) / 100;
  const builderProfitAmount = (totalProfitAmount * 25) / 100;
  const platformProfitAmount = (totalProfitAmount * 5) / 100;
  const totalInvestorReturn = raised + investorProfitAmount;
  const investorReturns = investments.map((inv) => {
    const investedAmount = toNum(inv.investedAmount);
    const ownershipRatio = raised > 0 ? investedAmount / raised : 0;
    const profitAmount = investorProfitAmount * ownershipRatio;
    return {
      investorId: inv.userId,
      investorName: inv.user?.fullName ?? 'Investor',
      investedAmount,
      profitAmount,
      payoutAmount: investedAmount + profitAmount,
    };
  });

  return {
    requiredAmount: required,
    raisedAmount: raised,
    roiPercent,
    roiAmount: totalProfitAmount,
    totalProfitAmount,
    investorProfitAmount,
    builderProfitAmount,
    platformProfitAmount,
    totalInvestorReturn,
    builderPayoutAmount: builderProfitAmount,
    adminProfitAmount: platformProfitAmount,
    netAfterRoiReserve: platformProfitAmount,
    investorReturns,
    progress: required > 0 ? Math.min(100, (raised / required) * 100) : 0,
    isFullyFunded: required > 0 && raised >= required,
    isConstructionComplete: project.projectStatus === 'COMPLETED' || toNum(project.constructionProgress) >= 100,
  };
}

/**
 * GET /api/admin/payouts
 * List all payouts (Admin)
 */
export async function listPayouts(req, res) {
  try {
    const [payouts, pendingProjectRequests] = await Promise.all([
      prisma.userReturn.findMany({
        include: {
          user: { select: { id: true, fullName: true } },
          returnDistribution: {
            select: {
              distributionDate: true,
              project: { select: { id: true, title: true } },
            },
          },
        },
        orderBy: { creditedAt: 'desc' },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { projectStatus: 'COMPLETED' },
            { constructionProgress: { gte: 100 } },
          ],
          rejectionReason: null,
          returns: { none: {} },
        },
        include: {
          builder: { select: { companyName: true, email: true, mobileNumber: true } },
          investments: {
            where: { investmentStatus: 'ACTIVE' },
            select: {
              userId: true,
              investedAmount: true,
              user: { select: { fullName: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const paidRows = payouts.map((p) => ({
      id: `PAID-${p.id}`,
      project: p.returnDistribution?.project?.title ?? 'Unknown Project',
      investor: p.user?.fullName ?? 'Investor',
      amount: p.amount?.toString?.() ?? p.amount,
      date: p.returnDistribution?.distributionDate ?? p.creditedAt,
      status: 'Paid',
    }));

    const requestRows = pendingProjectRequests.flatMap((project) => {
      const calc = payoutCalculation(project);
      if (!calc.isConstructionComplete || calc.raisedAmount <= 0) return [];
      return {
        id: project.id,
        rowId: `REQ-${project.id}`,
        type: 'REQUEST',
        project: project.title,
        investor: project.builder?.companyName ?? 'Builder',
        amount: calc.builderPayoutAmount,
        date: project.updatedAt ?? project.createdAt,
        status: 'Pending',
        projectStatus: project.projectStatus,
        constructionProgress: project.constructionProgress ?? 0,
        builderEmail: project.builder?.email ?? '',
        builderMobile: project.builder?.mobileNumber ?? '',
        ...calc,
      };
    });

    const rows = [...requestRows, ...paidRows].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error('listPayouts (admin):', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts.' });
  }
}

/**
 * POST /api/admin/payouts/:projectId/approve
 */
export async function approvePayoutRequest(req, res) {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        returns: { select: { id: true }, take: 1 },
        investments: {
          where: { investmentStatus: 'ACTIVE' },
          select: {
            id: true,
            userId: true,
            investedAmount: true,
            user: { select: { fullName: true } },
          },
        },
      },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.returns?.length) {
      return res.status(400).json({ success: false, message: 'Project settlement is already completed.' });
    }

    const calc = payoutCalculation(project);
    if (!calc.isConstructionComplete) {
      return res.status(400).json({ success: false, message: 'Project construction progress is not 100% yet.' });
    }
    if (calc.raisedAmount <= 0 || project.investments.length === 0) {
      return res.status(400).json({ success: false, message: 'Project has no active investments to settle.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const distribution = await tx.returnDistribution.create({
        data: {
          projectId,
          totalProfit: new Decimal(calc.investorProfitAmount),
        },
      });

      const investorRows = [];
      for (const inv of project.investments) {
        const investedAmount = new Decimal(inv.investedAmount);
        const profitAmount = investedAmount.div(calc.raisedAmount).mul(calc.investorProfitAmount);
        const payoutAmount = investedAmount.plus(profitAmount);

        const wallet = await tx.wallet.upsert({
          where: { userId: inv.userId },
          update: {},
          create: { userId: inv.userId, balance: new Decimal(0) },
        });

        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: payoutAmount } },
        });

        const userReturn = await tx.userReturn.create({
          data: {
            returnDistributionId: distribution.id,
            userId: inv.userId,
            amount: payoutAmount,
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: payoutAmount,
            type: 'CREDIT',
            description: `Project settlement: ${project.title}`,
            status: 'SUCCESS',
            externalRef: `SETTLEMENT_${projectId}_${inv.userId}`,
            metadata: {
              projectId,
              investmentId: inv.id,
              returnDistributionId: distribution.id,
              userReturnId: userReturn.id,
              investedAmount: investedAmount.toString(),
              profitAmount: profitAmount.toString(),
              totalProfitAmount: calc.totalProfitAmount,
              investorProfitSharePercent: 70,
              builderProfitSharePercent: 25,
              platformProfitSharePercent: 5,
              roiPercent: calc.roiPercent,
            },
          },
        });

        await createNotification(tx, {
          userId: inv.userId,
          type: 'success',
          title: 'Profit Credited',
          message: `₹${payoutAmount.toString()} credited to your wallet for ${project.title}.`,
          metadata: {
            event: 'PROFIT_CREDITED',
            projectId,
            investmentId: inv.id,
            profitAmount: profitAmount.toString(),
            payoutAmount: payoutAmount.toString(),
          },
        });

        investorRows.push({
          investorId: inv.userId,
          investorName: inv.user?.fullName ?? 'Investor',
          investedAmount: investedAmount.toString(),
          profitAmount: profitAmount.toString(),
          payoutAmount: payoutAmount.toString(),
          walletBalance: updatedWallet.balance.toString(),
        });
      }

      const releasePayment = await ensureProjectFundRelease(tx, {
        projectId,
        builderId: project.builderId,
        amount: new Decimal(calc.builderPayoutAmount),
      });

      await tx.payment.update({
        where: { id: releasePayment.id },
        data: {
          paymentStatus: 'SUCCESS',
          gatewayResponse: {
            ...(releasePayment.gatewayResponse || {}),
            settlement_distribution_id: distribution.id,
            settled_at: new Date().toISOString(),
          },
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: projectId },
        data: {
          projectStatus: 'COMPLETED',
          rejectionReason: null,
        },
      });

      await createNotification(tx, {
        builderId: project.builderId,
        type: 'success',
        title: 'Builder Profit Released',
        message: `₹${new Decimal(calc.builderPayoutAmount).toString()} profit released for ${project.title}.`,
        metadata: { event: 'BUILDER_PROFIT_RELEASED', projectId, amount: calc.builderPayoutAmount },
      });
      await notifyAdmins(tx, {
        type: 'success',
        title: 'Settlement Completed',
        message: `${project.title} settlement completed. Platform profit ₹${new Decimal(calc.platformProfitAmount).toString()}.`,
        metadata: {
          event: 'SETTLEMENT_APPROVED',
          projectId,
          investorProfitAmount: calc.investorProfitAmount,
          builderProfitAmount: calc.builderProfitAmount,
          platformProfitAmount: calc.platformProfitAmount,
        },
      });

      return { distribution, investorRows, updatedProject };
    });

    return res.json({
      success: true,
      message: 'Project settlement completed. Investor wallets credited and builder payout released.',
      data: {
        ...calc,
        distributionId: result.distribution.id,
        investorReturns: result.investorRows,
      },
    });
  } catch (err) {
    console.error('approvePayoutRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve payout request.' });
  }
}

/**
 * POST /api/admin/payouts/:projectId/deny
 * Body: { reason?: string }
 */
export async function denyPayoutRequest(req, res) {
  try {
    const projectId = Number(req.params.projectId);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!Number.isInteger(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        investments: {
          where: { investmentStatus: 'ACTIVE' },
          select: { userId: true, investedAmount: true, user: { select: { fullName: true } } },
        },
      },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    const calc = payoutCalculation(project);
    if (!calc.isConstructionComplete) {
      return res.status(400).json({ success: false, message: 'Project construction progress is not 100% yet.' });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { rejectionReason: reason || 'Payout request denied by admin.' },
    });

    await prisma.$transaction(async (tx) => {
      await createNotification(tx, {
        builderId: project.builderId,
        type: 'warning',
        title: 'Settlement Denied',
        message: `${project.title} settlement was denied. Reason: ${reason || 'Payout request denied by admin.'}`,
        metadata: { event: 'SETTLEMENT_DENIED', projectId },
      });
      await notifyAdmins(tx, {
        type: 'warning',
        title: 'Settlement Denied',
        message: `${project.title} settlement was denied.`,
        metadata: { event: 'SETTLEMENT_DENIED', projectId },
      });
    });

    return res.json({ success: true, message: 'Payout request denied.' });
  } catch (err) {
    console.error('denyPayoutRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to deny payout request.' });
  }
}
