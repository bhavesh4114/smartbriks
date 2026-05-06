import prisma from '../utils/prisma.js';
import { ensureProjectFundRelease } from '../utils/builderFunds.js';

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
    const [payouts, builderReleasePayments, pendingProjects] = await Promise.all([
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

    const rows = [...requestRows, ...fallbackRows, ...paidRows].sort(
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
