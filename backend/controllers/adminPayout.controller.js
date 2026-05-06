import prisma from '../utils/prisma.js';
import { ensureProjectFundRelease } from '../utils/builderFunds.js';
import { getProjectAccounting, toDecimal } from '../utils/accounting.js';

function toNumber(value) {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
}

/**
 * GET /api/admin/payouts
 * List all payouts (Admin)
 */
export async function listPayouts(req, res) {
  try {
    const [payouts, investorWithdrawals, builderReleasePayments, pendingProjects] = await Promise.all([
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
      prisma.withdrawal.findMany({
        include: {
          investor: { select: { id: true, fullName: true } },
          project: {
            select: {
              id: true,
              title: true,
              builder: { select: { id: true, companyName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.findMany({
        where: {
          paymentMethod: 'ADMIN_RELEASE',
          userId: null,
        },
        include: {
          builder: { select: { id: true, companyName: true } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.project.findMany({
        where: { projectStatus: 'PENDING_APPROVAL' },
        include: {
          builder: { select: { id: true, companyName: true } },
          investments: { select: { investedAmount: true } },
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

    const withdrawalRows = investorWithdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      project: withdrawal.project?.title ?? 'Unknown Project',
      investor: withdrawal.investor?.fullName ?? 'Investor',
      builder: withdrawal.project?.builder?.companyName ?? 'Builder',
      amount: withdrawal.amount?.toString?.() ?? withdrawal.amount,
      date: withdrawal.createdAt,
      status:
        withdrawal.status === 'APPROVED'
          ? 'Paid'
          : withdrawal.status === 'REJECTED'
          ? 'Rejected'
          : 'Pending',
      type: 'investor_withdrawal',
    }));

    const paymentProjectIds = new Set(builderReleasePayments.map((payment) => payment.projectId));

    const requestRows = builderReleasePayments.map((payment) => {
      return {
        id: payment.id,
        project: payment.project?.title ?? 'Unknown Project',
        investor: payment.builder?.companyName ?? 'Builder',
        amount: payment.amount?.toString?.() ?? payment.amount,
        date: payment.createdAt,
        status: payment.paymentStatus === 'SUCCESS' ? 'Paid' : 'Pending',
        type: 'builder_release',
      };
    });

    const fallbackRows = pendingProjects
      .filter((project) => !paymentProjectIds.has(project.id))
      .map((project) => {
        const raisedAmount = project.investments.reduce(
          (sum, inv) => sum + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
          0
        );

        return {
          id: project.id,
          project: project.title,
          investor: project.builder?.companyName ?? 'Builder',
          amount: raisedAmount,
          date: project.updatedAt ?? project.createdAt,
          status: 'Pending',
          type: 'builder_release',
        };
      });

    const rows = [...requestRows, ...fallbackRows, ...withdrawalRows, ...paidRows].sort(
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
 * POST /api/admin/payouts/:id/approve
 */
export async function approvePayout(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid payout id.' });
    }

    const payout = await prisma.payment.findFirst({
      where: {
        id,
        paymentMethod: 'ADMIN_RELEASE',
        userId: null,
      },
      include: {
        project: {
          include: {
            investments: { select: { investedAmount: true } },
          },
        },
      },
    });

    let projectId = payout?.projectId ?? id;
    let builderId = payout?.builderId ?? null;
    let gatewayResponse = payout?.gatewayResponse || {};

    if (!payout) {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          investments: { select: { investedAmount: true } },
        },
      });

      if (!project || project.projectStatus !== 'PENDING_APPROVAL') {
        return res.status(404).json({ success: false, message: 'Payout request not found.' });
      }

      const raised = project.investments.reduce(
        (sum, inv) => sum + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
        0
      );
      const totalValue = toNumber(project.totalValue?.toString?.() ?? project.totalValue);
      if (raised < totalValue) {
        return res.status(400).json({
          success: false,
          message: 'Project funding is not complete yet.',
        });
      }

      const createdRelease = await prisma.$transaction(async (tx) => {
        return ensureProjectFundRelease(tx, {
          projectId: project.id,
          builderId: project.builderId,
          amount: raised,
        });
      });

      projectId = createdRelease.projectId;
      builderId = createdRelease.builderId;
      gatewayResponse = createdRelease.gatewayResponse || {};
    } else if (payout.paymentStatus === 'SUCCESS') {
      return res.json({ success: true, message: 'Payout already approved.' });
    }

    await prisma.$transaction(async (tx) => {
      const release = await tx.payment.findFirst({
        where: {
          projectId,
          builderId,
          paymentMethod: 'ADMIN_RELEASE',
          userId: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (release) {
        await tx.payment.update({
          where: { id: release.id },
          data: {
            paymentStatus: 'SUCCESS',
            gatewayResponse: {
              ...gatewayResponse,
              approved_at: new Date().toISOString(),
              approved_by_role: 'ADMIN',
            },
          },
        });
      }

      await tx.project.update({
        where: { id: projectId },
        data: {
          projectStatus: 'FUNDED',
          approvedAt: new Date(),
          rejectionReason: null,
        },
      });
    });

    return res.json({
      success: true,
      message: 'Payout approved and credited to builder wallet.',
    });
  } catch (err) {
    console.error('approvePayout:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve payout.' });
  }
}

/**
 * POST /api/admin/withdrawals/:id/approve
 */
export async function approveWithdrawal(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal id.' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, builderId: true } },
      },
    });

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }
    if (withdrawal.status === 'APPROVED') {
      return res.json({ success: true, message: 'Withdrawal already approved.' });
    }
    if (withdrawal.status === 'REJECTED') {
      return res.status(400).json({ success: false, message: 'Rejected withdrawal cannot be approved.' });
    }

    const accounting = await getProjectAccounting(prisma, withdrawal.projectId);
    const requestedAmount = toDecimal(withdrawal.amount);
    if (requestedAmount.greaterThan(accounting.remainingBalance)) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal amount exceeds available builder balance.',
        data: {
          totalFundsRaised: accounting.totalFundsRaised.toString(),
          totalPayoutGiven: accounting.totalPayoutGiven.toString(),
          remainingBalance: accounting.remainingBalance.toString(),
          requestedAmount: requestedAmount.toString(),
        },
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.walletTransaction.updateMany({
        where: {
          metadata: { path: ['withdrawalId'], equals: id },
        },
        data: { status: 'SUCCESS' },
      });
    });

    return res.json({
      success: true,
      message: 'Withdrawal approved and counted as investor payout.',
    });
  } catch (err) {
    console.error('approveWithdrawal:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve withdrawal.' });
  }
}

/**
 * POST /api/admin/withdrawals/:id/reject
 */
export async function rejectWithdrawal(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal id.' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
    }
    if (withdrawal.status === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Approved withdrawal cannot be rejected.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.withdrawal.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await tx.walletTransaction.updateMany({
        where: {
          metadata: { path: ['withdrawalId'], equals: id },
        },
        data: { status: 'FAILED' },
      });
    });

    return res.json({ success: true, message: 'Withdrawal rejected.' });
  } catch (err) {
    console.error('rejectWithdrawal:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject withdrawal.' });
  }
}
