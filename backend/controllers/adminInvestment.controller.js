import prisma from '../utils/prisma.js';

/**
 * GET /api/admin/investments
 * List all investments (Admin)
 */
export async function listInvestments(req, res) {
  try {
    const investments = await prisma.investment.findMany({
      include: {
        user: { select: { id: true, fullName: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: investments.map((inv) => ({
        id: inv.id,
        investor: inv.user?.fullName ?? 'Investor',
        project: inv.project?.title ?? 'Unknown Project',
        amount: inv.investedAmount?.toString?.() ?? inv.investedAmount,
        date: inv.createdAt,
      })),
    });
  } catch (err) {
    console.error('listInvestments (admin):', err);
    res.status(500).json({ success: false, message: 'Failed to fetch investments.' });
  }
}
