import prisma from '../utils/prisma.js';

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
          builder: { select: { companyName: true } },
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

    const requestRows = pendingProjectRequests.map((project) => {
      const raised = project.investments.reduce(
        (sum, inv) => sum + Number(inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0),
        0
      );
      return {
        id: `REQ-${project.id}`,
        project: project.title,
        investor: project.builder?.companyName ?? 'Builder',
        amount: raised,
        date: project.updatedAt ?? project.createdAt,
        status: 'Pending',
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
