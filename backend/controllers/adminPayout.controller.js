import prisma from '../utils/prisma.js';

/**
 * GET /api/admin/payouts
 * List all payouts (Admin)
 */
export async function listPayouts(req, res) {
  try {
    const payouts = await prisma.userReturn.findMany({
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
    });

    res.json({
      success: true,
      data: payouts.map((p) => ({
        id: p.id,
        project: p.returnDistribution?.project?.title ?? 'Unknown Project',
        investor: p.user?.fullName ?? 'Investor',
        amount: p.amount?.toString?.() ?? p.amount,
        date: p.returnDistribution?.distributionDate ?? p.creditedAt,
        status: 'Paid',
      })),
    });
  } catch (err) {
    console.error('listPayouts (admin):', err);
    res.status(500).json({ success: false, message: 'Failed to fetch payouts.' });
  }
}
