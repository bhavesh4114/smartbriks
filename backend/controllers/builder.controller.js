import prisma from '../utils/prisma.js';

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
