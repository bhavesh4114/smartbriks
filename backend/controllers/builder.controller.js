import prisma from '../utils/prisma.js';
import { getBuilderReleasedFunds } from '../utils/builderFunds.js';
import { decimalToString, getBuilderAccounting } from '../utils/accounting.js';
import { buildProjectTimeline } from '../utils/projectTimeline.js';

/**
 * Get enriched builder profile (own)
 * GET /api/builder/profile
 */
export async function getBuilderProfile(req, res) {
  try {
    const builderId = req.auth.id;

    const [builder, projectCount, investmentAgg, accounting, releasedFunds] = await Promise.all([
      prisma.builder.findUnique({
        where: { id: builderId },
        select: {
          id: true,
          companyName: true,
          email: true,
          mobileNumber: true,
          createdAt: true,
          kycStatus: true,
          isApproved: true,
        },
      }),
      prisma.project.count({ where: { builderId } }),
      prisma.investment.aggregate({
        where: { project: { builderId } },
        _sum: { investedAmount: true },
      }),
      getBuilderAccounting(prisma, builderId),
      getBuilderReleasedFunds(prisma, builderId),
    ]);

    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    const verified = builder.isApproved || builder.kycStatus === 'VERIFIED';
    const fundsRaised = accounting.totalFundsRaised ?? investmentAgg?._sum?.investedAmount ?? 0;

    return res.json({
      success: true,
      data: {
        basic_info: {
          id: builder.id,
          email: builder.email,
          created_at: builder.createdAt,
        },
        company_details: {
          company_name: builder.companyName,
          registration_number: null,
          phone: builder.mobileNumber,
          address: null,
        },
        profile_info: {
          logo: null,
          verified,
          member_since: builder.createdAt,
        },
        stats: {
          total_projects: projectCount,
          funds_raised: decimalToString(fundsRaised),
          totalFundsRaised: decimalToString(fundsRaised),
          totalPayoutGiven: decimalToString(accounting.totalPayoutGiven),
          remainingBalance: decimalToString(accounting.remainingBalance),
          wallet_balance: releasedFunds?.toString?.() ?? "0",
        },
        bank_information: {
          bank_name: null,
          account_holder_name: null,
          account_number_masked: null,
          routing_or_ifsc: null,
        },
      },
    });
  } catch (err) {
    console.error('getBuilderProfile:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch builder profile.' });
  }
}

/**
 * Get builder profile (own)
 * GET /api/builders/me
 */
export async function getMe(req, res) {
  try {
    const builderId = req.auth.id;
    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
      select: {
        id: true,
        companyName: true,
        contactPerson: true,
        email: true,
        mobileNumber: true,
        role: true,
        kycStatus: true,
        isApproved: true,
        createdAt: true,
      },
    });
    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }
    res.json({ success: true, data: builder });
  } catch (err) {
    console.error('getMe (builder):', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
}

/**
 * View own projects
 * GET /api/builders/projects
 */
export async function getMyProjects(req, res) {
  try {
    const builderId = req.auth.id;
    const [projects, investmentAgg] = await Promise.all([
      prisma.project.findMany({
        where: { builderId },
        include: {
          images: { select: { imageUrl: true } },
          _count: { select: { investments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.investment.groupBy({
        by: ['projectId'],
        where: { project: { builderId } },
        _sum: { investedAmount: true },
        _count: { _all: true },
      }),
    ]);

    const aggByProjectId = new Map(
      investmentAgg.map((row) => [
        row.projectId,
        {
          totalInvested: row?._sum?.investedAmount ?? 0,
          investmentCount: row?._count?._all ?? 0,
        },
      ]),
    );

    const data = projects.map((project) => {
      const agg = aggByProjectId.get(project.id);
      const totalInvested = agg?.totalInvested ?? 0;
      return {
        ...project,
        totalInvested: totalInvested?.toString?.() ?? totalInvested,
        investmentCount: agg?.investmentCount ?? project._count?.investments ?? 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('getMyProjects:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
}

/**
 * View investments on own projects
 * GET /api/builders/projects/:projectId/investments
 */
export async function getProjectInvestments(req, res) {
  try {
    const builderId = req.auth.id;
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, builderId },
      include: {
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
        investments: {
          include: {
            user: { // Prisma relation: investor details
              select: {
                id: true,
                fullName: true,
                email: true,
                mobileNumber: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const totalInvested = (project.investments || []).reduce((sum, inv) => {
      const amt = Number(inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
    const totalValue = Number(project.totalValue?.toString?.() ?? project.totalValue ?? 0);
    const progress = totalValue > 0 ? Math.min(100, (totalInvested / totalValue) * 100) : 0;

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          location: project.location,
          totalValue: project.totalValue,
          totalShares: project.totalShares,
          projectStatus: project.projectStatus,
          constructionProgress: project.constructionProgress,
          totalInvested: totalInvested?.toString?.() ?? totalInvested,
          investorCount: project.investments?.length ?? 0,
          progress,
          timeline: buildProjectTimeline(project.timeline || []),
        },
        investments: project.investments.map((inv) => ({
          id: inv.id,
          investedAmount: inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0,
          createdAt: inv.createdAt,
          user: inv.user,
        })),
      },
    });
  } catch (err) {
    console.error('getProjectInvestments:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch investments.' });
  }
}

/**
 * View investors across own projects
 * GET /api/builders/investors
 */
export async function getBuilderInvestors(req, res) {
  try {
    const builderId = req.auth.id;
    const investments = await prisma.investment.findMany({
      where: { project: { builderId } },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNumber: true,
            createdAt: true,
            isActive: true,
          },
        },
        project: { select: { id: true } },
      },
    });

    const byUser = new Map();
    for (const inv of investments) {
      const user = inv.user;
      if (!user) continue;
      const key = user.id;
      if (!byUser.has(key)) {
        byUser.set(key, {
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: user.mobileNumber,
          joinDate: user.createdAt,
          status: user.isActive ? 'Active' : 'Blocked',
          totalInvested: 0,
          projectIds: new Set(),
        });
      }
      const row = byUser.get(key);
      const amt = Number(inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0);
      row.totalInvested += Number.isFinite(amt) ? amt : 0;
      if (inv.project?.id) row.projectIds.add(inv.project.id);
    }

    const investors = Array.from(byUser.values()).map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      totalInvested: row.totalInvested?.toString?.() ?? row.totalInvested,
      projects: row.projectIds.size,
      joinDate: row.joinDate,
      status: row.status,
    }));

    const totalInvested = investors.reduce((sum, inv) => {
      const amt = Number(inv.totalInvested ?? 0);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);
    const totalInvestors = investors.length;
    const activeInvestors = investors.filter((inv) => inv.status === 'Active').length;
    const avgInvestment = totalInvestors > 0 ? totalInvested / totalInvestors : 0;

    return res.json({
      success: true,
      data: {
        investors,
        stats: {
          total_investors: totalInvestors,
          active_investors: activeInvestors,
          total_invested: totalInvested?.toString?.() ?? totalInvested,
          avg_investment: avgInvestment?.toString?.() ?? avgInvestment,
        },
      },
    });
  } catch (err) {
    console.error('getBuilderInvestors:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investors.' });
  }
}

/**
 * Builder dashboard data
 * GET /api/builder/dashboard
 */
export async function getBuilderDashboard(req, res) {
  try {
    const builderId = req.auth.id;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      totalProjects,
      activeProjects,
      projectStatusCounts,
      investorDistinct,
      fundsAgg,
      accounting,
      releasedFunds,
      recentInvestments,
      recentProjectsRaw,
      recentInvestorsRaw,
    ] = await Promise.all([
      prisma.project.count({ where: { builderId } }),
      prisma.project.count({ where: { builderId, projectStatus: 'ACTIVE' } }),
      prisma.project.groupBy({
        by: ['projectStatus'],
        where: { builderId },
        _count: { _all: true },
      }),
      prisma.investment.findMany({
        where: { project: { builderId } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      prisma.investment.aggregate({
        where: { project: { builderId } },
        _sum: { investedAmount: true },
      }),
      getBuilderAccounting(prisma, builderId),
      getBuilderReleasedFunds(prisma, builderId),
      prisma.investment.findMany({
        where: {
          project: { builderId },
          createdAt: { gte: start, lte: now },
        },
        select: { investedAmount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.project.findMany({
        where: { builderId },
        include: {
          investments: { select: { investedAmount: true } },
          _count: { select: { investments: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.investment.findMany({
        where: { project: { builderId } },
        include: {
          user: { select: { fullName: true } },
          project: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
    ]);

    const statusBucket = { Active: 0, Completed: 0, Pending: 0 };
    for (const row of projectStatusCounts) {
      const status = row.projectStatus;
      const count = row._count?._all ?? 0;
      if (['ACTIVE', 'APPROVED', 'FUNDED'].includes(status)) statusBucket.Active += count;
      else if (status === 'COMPLETED') statusBucket.Completed += count;
      else if (['PENDING_APPROVAL', 'DRAFT'].includes(status)) statusBucket.Pending += count;
    }

    const monthKeys = [];
    const monthLabels = [];
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthKeys.push(key);
      monthLabels.push(d.toLocaleString('en-IN', { month: 'short' }));
    }

    const raisedByMonth = new Map(monthKeys.map((k) => [k, 0]));
    for (const inv of recentInvestments) {
      const d = new Date(inv.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (raisedByMonth.has(key)) {
        const prev = raisedByMonth.get(key) || 0;
        const amt = Number(inv.investedAmount ?? 0);
        raisedByMonth.set(key, prev + (Number.isFinite(amt) ? amt : 0));
      }
    }

    const funding = monthKeys.map((key, index) => {
      const raised = raisedByMonth.get(key) || 0;
      const target = Math.round(raised * 1.1);
      return {
        month: monthLabels[index],
        raised,
        target,
      };
    });

    const fundsRaised = accounting.totalFundsRaised ?? fundsAgg?._sum?.investedAmount ?? 0;
    const totalPayoutGiven = accounting.totalPayoutGiven ?? 0;
    const remainingBalance = accounting.remainingBalance ?? 0;

    const recentProjects = recentProjectsRaw.map((project) => {
      const totalInvested = (project.investments || []).reduce((sum, inv) => {
        const amt = Number(inv.investedAmount ?? 0);
        return sum + (Number.isFinite(amt) ? amt : 0);
      }, 0);
      return {
        id: project.id,
        name: project.title,
        status: project.projectStatus,
        investors: project._count?.investments ?? 0,
        totalValue: project.totalValue?.toString?.() ?? project.totalValue,
        totalInvested: totalInvested?.toString?.() ?? totalInvested,
      };
    });

    const recentInvestors = recentInvestorsRaw.map((inv) => ({
      name: inv.user?.fullName ?? 'Unknown Investor',
      amount: inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0,
      project: inv.project?.title ?? 'Unknown Project',
      createdAt: inv.createdAt,
    }));

    return res.json({
      success: true,
      data: {
        stats: {
          total_projects: totalProjects,
          total_investors: investorDistinct.length,
          funds_raised: decimalToString(fundsRaised),
          totalFundsRaised: decimalToString(fundsRaised),
          totalPayoutGiven: decimalToString(totalPayoutGiven),
          remainingBalance: decimalToString(remainingBalance),
          wallet_balance: releasedFunds?.toString?.() ?? '0',
          active_projects: activeProjects,
        },
        project_status: [
          { name: 'Active', value: statusBucket.Active },
          { name: 'Completed', value: statusBucket.Completed },
          { name: 'Pending', value: statusBucket.Pending },
        ],
        funding,
        recent_projects: recentProjects,
        recent_investors: recentInvestors,
      },
    });
  } catch (err) {
    console.error('getBuilderDashboard:', err);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard data.' });
  }
}
