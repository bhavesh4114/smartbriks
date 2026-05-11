import prisma from '../utils/prisma.js';

function toNum(value) {
  const n = Number(value?.toString?.() ?? value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function timeAgo(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return 'just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export async function getAdminDashboard(req, res) {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalInvestors,
      totalBuilders,
      totalAdmins,
      totalProjects,
      walletAgg,
      investments,
      returns,
      projectsByMonth,
      recentInvestments,
      pendingProjects,
      pendingInvestorKyc,
      pendingBuilderKyc,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'INVESTOR' } }),
      prisma.builder.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.project.count(),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.investment.findMany({
        where: { createdAt: { gte: start, lte: now } },
        select: { investedAmount: true, createdAt: true },
      }),
      prisma.userReturn.findMany({
        where: { creditedAt: { gte: start, lte: now } },
        select: { amount: true, creditedAt: true },
      }),
      prisma.project.findMany({
        where: { createdAt: { gte: start, lte: now } },
        select: { createdAt: true },
      }),
      prisma.investment.findMany({
        include: {
          user: { select: { fullName: true } },
          project: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.project.findMany({
        where: { projectStatus: 'PENDING_APPROVAL' },
        include: { builder: { select: { companyName: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      }),
      prisma.kYC.findMany({
        where: { userId: { not: null }, status: 'PENDING' },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.kYC.findMany({
        where: { builderId: { not: null }, status: 'PENDING' },
        include: { builder: { select: { companyName: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    const monthRows = [];
    const byMonth = new Map();
    for (let i = 0; i < 6; i += 1) {
      const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = monthKey(date);
      const row = {
        month: date.toLocaleString('en-IN', { month: 'short' }),
        investments: 0,
        payouts: 0,
        projects: 0,
      };
      byMonth.set(key, row);
      monthRows.push(row);
    }

    for (const inv of investments) {
      const row = byMonth.get(monthKey(new Date(inv.createdAt)));
      if (row) row.investments += toNum(inv.investedAmount);
    }
    for (const payout of returns) {
      const row = byMonth.get(monthKey(new Date(payout.creditedAt)));
      if (row) row.payouts += toNum(payout.amount);
    }
    for (const project of projectsByMonth) {
      const row = byMonth.get(monthKey(new Date(project.createdAt)));
      if (row) row.projects += 1;
    }

    const pendingApprovals = [
      ...pendingBuilderKyc.map((row) => ({
        type: 'Builder',
        name: row.builder?.companyName ?? 'Builder KYC',
        item: 'KYC Approval',
        time: timeAgo(row.createdAt),
      })),
      ...pendingProjects.map((row) => ({
        type: 'Project',
        name: row.title,
        item: row.builder?.companyName ? `Project Approval - ${row.builder.companyName}` : 'Project Approval',
        time: timeAgo(row.updatedAt),
      })),
      ...pendingInvestorKyc.map((row) => ({
        type: 'Investor',
        name: row.user?.fullName ?? 'Investor KYC',
        item: 'KYC Approval',
        time: timeAgo(row.createdAt),
      })),
    ].slice(0, 5);

    return res.json({
      success: true,
      data: {
        stats: {
          totalInvestors,
          totalBuilders,
          totalAdmins,
          totalProjects,
          walletBalance: walletAgg._sum.balance?.toString?.() ?? '0',
        },
        monthly: monthRows,
        userDistribution: [
          { name: 'Investors', value: totalInvestors, color: '#10b981' },
          { name: 'Builders', value: totalBuilders, color: '#f59e0b' },
          { name: 'Admins', value: totalAdmins, color: '#0f3460' },
        ],
        recentInvestments: recentInvestments.map((inv) => ({
          investor: inv.user?.fullName ?? 'Investor',
          project: inv.project?.title ?? 'Unknown Project',
          amount: inv.investedAmount?.toString?.() ?? inv.investedAmount,
          time: timeAgo(inv.createdAt),
        })),
        pendingApprovals,
      },
    });
  } catch (err) {
    console.error('getAdminDashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to load admin dashboard.' });
  }
}
