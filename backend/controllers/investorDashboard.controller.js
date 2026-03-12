import prisma from '../utils/prisma.js';

function toNumber(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function getInvestorDashboard(req, res) {
  try {
    const investorId = req.auth.id;

    const [user, investments, returns] = await Promise.all([
      prisma.user.findUnique({
        where: { id: investorId },
        select: {
          id: true,
          fullName: true,
          kycStatus: true,
        },
      }),
      prisma.investment.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          investedAmount: true,
          investmentStatus: true,
          createdAt: true,
          projectId: true,
          project: {
            select: {
              title: true,
              expectedROI: true,
            },
          },
        },
      }),
      prisma.userReturn.findMany({
        where: { userId: investorId },
        orderBy: { creditedAt: 'desc' },
        select: {
          amount: true,
          creditedAt: true,
          returnDistribution: {
            select: {
              project: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    const totalInvested = investments.reduce(
      (sum, inv) => sum + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
      0
    );

    const activeProjectIds = new Set(
      investments.filter((inv) => inv.investmentStatus === 'ACTIVE').map((inv) => inv.projectId)
    );
    const activeProjects = activeProjectIds.size;

    const totalReturns = returns.reduce(
      (sum, r) => sum + toNumber(r.amount?.toString?.() ?? r.amount),
      0
    );

    const monthlyTotals = new Map();
    for (const inv of investments) {
      const date = new Date(inv.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const prev = monthlyTotals.get(monthKey) ?? 0;
      monthlyTotals.set(monthKey, prev + toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount));
    }

    const sortedMonths = [...monthlyTotals.keys()].sort();
    let cumulative = 0;
    const growth = sortedMonths.map((key) => {
      cumulative += monthlyTotals.get(key) ?? 0;
      const [year, month] = key.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      const label = d.toLocaleString('en-US', { month: 'short' });
      return { month: label, value: cumulative };
    });

    const activeInvestments = investments
      .filter((inv) => inv.investmentStatus === 'ACTIVE')
      .slice(-5)
      .reverse()
      .map((inv) => ({
        id: inv.id,
        name: inv.project?.title ?? 'Project',
        invested: toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount),
        roi: `${toNumber(inv.project?.expectedROI?.toString?.() ?? inv.project?.expectedROI)}%`,
        status: 'Active',
      }));

    const notifications = [
      ...returns.slice(0, 3).map((r, i) => ({
        id: `ret-${i}`,
        title: 'Payout Received',
        message: `${toNumber(r.amount?.toString?.() ?? r.amount)} credited from ${r.returnDistribution?.project?.title ?? 'project'}`,
        time: new Date(r.creditedAt).toLocaleDateString(),
        type: 'success',
      })),
      ...investments
        .slice(-3)
        .reverse()
        .map((inv, i) => ({
          id: `inv-${i}`,
          title: 'Investment Added',
          message: `${toNumber(inv.investedAmount?.toString?.() ?? inv.investedAmount)} in ${inv.project?.title ?? 'project'}`,
          time: new Date(inv.createdAt).toLocaleDateString(),
          type: 'info',
        })),
    ].slice(0, 5);

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          kycStatus: user.kycStatus,
        },
        stats: {
          totalInvested,
          activeProjects,
          totalReturns,
          pendingPayouts: 0,
        },
        growth: growth.length ? growth : [{ month: 'No Data', value: 0 }],
        activeInvestments,
        notifications,
      },
    });
  } catch (err) {
    console.error('getInvestorDashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investor dashboard.' });
  }
}

