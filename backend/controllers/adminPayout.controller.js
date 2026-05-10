import prisma from '../utils/prisma.js';

function toNum(value) {
  const n = Number(value?.toString?.() ?? value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function payoutCalculation(project) {
  const raised = project.investments.reduce(
    (sum, inv) => sum + toNum(inv.investedAmount),
    0
  );
  const required = toNum(project.totalValue);
  const roiPercent = toNum(project.expectedROI);
  const roiAmount = (raised * roiPercent) / 100;
  const totalInvestorReturn = raised + roiAmount;
  const netAfterRoiReserve = Math.max(0, raised - roiAmount);

  return {
    requiredAmount: required,
    raisedAmount: raised,
    roiPercent,
    roiAmount,
    totalInvestorReturn,
    builderPayoutAmount: raised,
    netAfterRoiReserve,
    progress: required > 0 ? Math.min(100, (raised / required) * 100) : 0,
    isFullyFunded: required > 0 && raised >= required,
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
        where: { projectStatus: 'PENDING_APPROVAL' },
        include: {
          builder: { select: { companyName: true, email: true, mobileNumber: true } },
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

    const requestRows = pendingProjectRequests.flatMap((project) => {
      const calc = payoutCalculation(project);
      if (!calc.isFullyFunded) return [];
      return {
        id: project.id,
        rowId: `REQ-${project.id}`,
        type: 'REQUEST',
        project: project.title,
        investor: project.builder?.companyName ?? 'Builder',
        amount: calc.builderPayoutAmount,
        date: project.updatedAt ?? project.createdAt,
        status: 'Pending',
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
      include: { investments: { select: { investedAmount: true } } },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Only pending payout requests can be approved.' });
    }

    const calc = payoutCalculation(project);
    if (!calc.isFullyFunded) {
      return res.status(400).json({ success: false, message: 'Project is not fully funded yet.' });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectStatus: 'FUNDED',
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    return res.json({
      success: true,
      message: 'Payout request approved.',
      data: calc,
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
      include: { investments: { select: { investedAmount: true } } },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Only pending payout requests can be denied.' });
    }

    const calc = payoutCalculation(project);
    if (!calc.isFullyFunded) {
      return res.status(400).json({ success: false, message: 'Project is not fully funded yet.' });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        projectStatus: 'APPROVED',
        rejectionReason: reason || 'Payout request denied by admin.',
      },
    });

    return res.json({ success: true, message: 'Payout request denied.' });
  } catch (err) {
    console.error('denyPayoutRequest:', err);
    return res.status(500).json({ success: false, message: 'Failed to deny payout request.' });
  }
}
