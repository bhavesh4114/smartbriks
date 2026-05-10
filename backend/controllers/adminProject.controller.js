import prisma from '../utils/prisma.js';

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function serializeProjectForAdmin(p) {
  const required = toNum(p.totalValue?.toString?.() ?? p.totalValue);
  const raised = toNum(p._sumInvested ?? 0);
  const progress = required > 0 ? Math.min(100, (raised / required) * 100) : 0;
  return {
    id: p.id,
    projectName: p.title,
    builder: p.builder?.companyName ?? 'Unknown',
    required,
    raised,
    progress,
    status: p.projectStatus,
    rejectionReason: p.rejectionReason ?? null,
    approvedAt: p.approvedAt ?? null,
    createdAt: p.createdAt,
  };
}

function serializeProjectDetailsForAdmin(p) {
  const row = serializeProjectForAdmin(p);
  return {
    ...row,
    description: p.description,
    location: p.location,
    totalShares: p.totalShares,
    pricePerShare: p.pricePerShare?.toString?.() ?? p.pricePerShare,
    minInvestment: p.minInvestment?.toString?.() ?? p.minInvestment,
    expectedROI: p.expectedROI?.toString?.() ?? p.expectedROI,
    projectDurationMonths: p.projectDurationMonths,
    keyFeatures: p.keyFeatures,
    startDate: p.startDate,
    endDate: p.endDate,
    builderDetails: p.builder
      ? {
          id: p.builder.id,
          companyName: p.builder.companyName,
          email: p.builder.email,
          mobileNumber: p.builder.mobileNumber,
        }
      : null,
    images: Array.isArray(p.images) ? p.images.map((img) => img.imageUrl) : [],
    investments: Array.isArray(p.investments)
      ? p.investments.map((inv) => ({
          id: inv.id,
          amount: inv.investedAmount?.toString?.() ?? inv.investedAmount,
          sharesPurchased: inv.sharesPurchased,
          status: inv.investmentStatus,
          createdAt: inv.createdAt,
          investor: inv.user?.fullName ?? 'Investor',
        }))
      : [],
  };
}

/**
 * GET /api/admin/projects
 */
export async function listAdminProjects(req, res) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        builder: { select: { id: true, companyName: true } },
        investments: { select: { investedAmount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = projects.map((p) => {
      const sumInvested = p.investments.reduce((acc, i) => acc + toNum(i.investedAmount?.toString?.() ?? i.investedAmount), 0);
      return serializeProjectForAdmin({ ...p, _sumInvested: sumInvested });
    });

    const totalProjects = rows.length;
    const activeProjects = rows.filter((p) => p.status === 'APPROVED').length;
    const pendingProjects = rows.filter((p) => p.status === 'PENDING_APPROVAL').length;

    return res.json({
      success: true,
      data: rows,
      stats: {
        totalProjects,
        activeProjects,
        pendingProjects,
      },
    });
  } catch (err) {
    console.error('listAdminProjects:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
}

/**
 * GET /api/admin/projects/:id
 */
export async function getAdminProjectDetails(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        builder: {
          select: {
            id: true,
            companyName: true,
            email: true,
            mobileNumber: true,
          },
        },
        images: { select: { imageUrl: true } },
        investments: {
          include: {
            user: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const sumInvested = project.investments.reduce(
      (acc, i) => acc + toNum(i.investedAmount?.toString?.() ?? i.investedAmount),
      0
    );

    return res.json({
      success: true,
      data: serializeProjectDetailsForAdmin({ ...project, _sumInvested: sumInvested }),
    });
  } catch (err) {
    console.error('getAdminProjectDetails:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch project details.' });
  }
}

/**
 * POST /api/admin/projects/:id/approve
 */
export async function approveProject(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Only pending projects can be approved.' });
    }

    await prisma.project.update({
      where: { id },
      data: {
        projectStatus: 'APPROVED',
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    return res.json({ success: true, message: 'Project approved.' });
  } catch (err) {
    console.error('approveProject:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve project.' });
  }
}

/**
 * POST /api/admin/projects/:id/reject
 * Body: { reason: string }
 */
export async function rejectProject(req, res) {
  try {
    const id = Number(req.params.id);
    const reason = req.body?.reason?.trim();
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'PENDING_APPROVAL') {
      return res.status(400).json({ success: false, message: 'Only pending projects can be rejected.' });
    }

    await prisma.project.update({
      where: { id },
      data: {
        projectStatus: 'REJECTED',
        approvedAt: null,
        rejectionReason: reason,
      },
    });

    return res.json({ success: true, message: 'Project rejected.' });
  } catch (err) {
    console.error('rejectProject:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject project.' });
  }
}
