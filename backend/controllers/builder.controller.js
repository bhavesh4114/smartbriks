import prisma from '../utils/prisma.js';

/**
 * Get enriched builder profile (own)
 * GET /api/builder/profile
 */
export async function getBuilderProfile(req, res) {
  try {
    const builderId = req.auth.id;

    const [builder, projectCount, investmentAgg] = await Promise.all([
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
    ]);

    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    const verified = builder.isApproved || builder.kycStatus === 'VERIFIED';
    const fundsRaised = investmentAgg?._sum?.investedAmount ?? 0;

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
          funds_raised: fundsRaised?.toString?.() ?? "0",
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
    const projects = await prisma.project.findMany({
      where: { builderId },
      include: {
        images: { select: { imageUrl: true } },
        _count: { select: { investments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: projects });
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

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          totalValue: project.totalValue,
          totalShares: project.totalShares,
          projectStatus: project.projectStatus,
        },
        investments: project.investments,
      },
    });
  } catch (err) {
    console.error('getProjectInvestments:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch investments.' });
  }
}
