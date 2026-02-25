import prisma from '../utils/prisma.js';

function serializeProject(p) {
  const totalValue = Number(p.totalValue?.toString?.() ?? p.totalValue ?? 0);
  const raised = Array.isArray(p.investments)
    ? p.investments.reduce((sum, i) => sum + Number(i.investedAmount?.toString?.() ?? i.investedAmount ?? 0), 0)
    : 0;
  const progress = totalValue > 0 ? Math.min(100, (raised / totalValue) * 100) : 0;
  return {
    id: p.id,
    projectName: p.title,
    location: p.location,
    expectedRoi: p.expectedROI?.toString?.() ?? '0',
    projectDuration: p.projectDurationMonths,
    required: totalValue,
    raised,
    progress,
    minimumInvestment: p.minInvestment?.toString?.() ?? '0',
    description: p.description,
    status: p.projectStatus,
    builder: p.builder ? { id: p.builder.id, companyName: p.builder.companyName } : null,
    images: Array.isArray(p.images) ? p.images.map((img) => img.imageUrl) : [],
    approvedAt: p.approvedAt ?? null,
  };
}

function parseAmenities(keyFeatures) {
  if (!keyFeatures || typeof keyFeatures !== 'string') return [];
  return keyFeatures
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildTimeline(progress) {
  const pct = Math.max(0, Math.min(100, Number(progress || 0)));
  return [
    {
      phase: 'Foundation',
      status: pct >= 100 ? 'Completed' : pct >= 25 ? 'In Progress' : 'Pending',
      progress: pct >= 100 ? 100 : Math.min(100, pct * 4),
    },
    {
      phase: 'Structure',
      status: pct >= 75 ? 'Completed' : pct >= 35 ? 'In Progress' : 'Pending',
      progress: pct < 25 ? 0 : Math.min(100, (pct - 25) * 1.33),
    },
    {
      phase: 'Interiors',
      status: pct >= 95 ? 'Completed' : pct >= 55 ? 'In Progress' : 'Pending',
      progress: pct < 50 ? 0 : Math.min(100, (pct - 50) * 2),
    },
    {
      phase: 'Handover',
      status: pct >= 100 ? 'Completed' : pct >= 80 ? 'In Progress' : 'Pending',
      progress: pct < 75 ? 0 : Math.min(100, (pct - 75) * 4),
    },
  ];
}

function serializeProjectDetails(p) {
  const totalProjectCost = Number(p.totalValue?.toString?.() ?? p.totalValue ?? 0);
  const fundsRaised = Array.isArray(p.investments)
    ? p.investments.reduce((sum, i) => sum + Number(i.investedAmount?.toString?.() ?? i.investedAmount ?? 0), 0)
    : 0;
  const progressPercentage =
    totalProjectCost > 0 ? Math.min(100, (fundsRaised / totalProjectCost) * 100) : 0;

  const amenities = parseAmenities(p.keyFeatures);
  const timeline = buildTimeline(progressPercentage);

  return {
    id: p.id,
    project_name: p.title,
    location: p.location,
    builder_name: p.builder?.companyName ?? 'Unknown Builder',
    description: p.description,
    expected_roi: Number(p.expectedROI?.toString?.() ?? p.expectedROI ?? 0),
    project_duration: p.projectDurationMonths ?? null,
    minimum_investment: Number(p.minInvestment?.toString?.() ?? p.minInvestment ?? 0),
    total_project_cost: totalProjectCost,
    funds_raised: fundsRaised,
    progress_percentage: progressPercentage,
    start_date: p.startDate ?? null,
    end_date: p.endDate ?? null,
    images: Array.isArray(p.images) ? p.images.map((img) => img.imageUrl) : [],
    amenities,
    timeline,
    // camelCase compatibility keys
    projectName: p.title,
    builderName: p.builder?.companyName ?? 'Unknown Builder',
    expectedRoi: Number(p.expectedROI?.toString?.() ?? p.expectedROI ?? 0),
    projectDuration: p.projectDurationMonths ?? null,
    minimumInvestment: Number(p.minInvestment?.toString?.() ?? p.minInvestment ?? 0),
    totalProjectCost,
    fundsRaised,
    progressPercentage,
    startDate: p.startDate ?? null,
    endDate: p.endDate ?? null,
  };
}

/**
 * GET /api/investor/projects
 * Only APPROVED projects for investor listings.
 */
export async function listApprovedProjectsForInvestor(req, res) {
  try {
    const projects = await prisma.project.findMany({
      where: { projectStatus: 'APPROVED' },
      include: {
        builder: { select: { id: true, companyName: true } },
        investments: { select: { investedAmount: true } },
        images: { select: { imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: projects.map(serializeProject),
    });
  } catch (err) {
    console.error('listApprovedProjectsForInvestor:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch projects.' });
  }
}

/**
 * GET /api/investor/projects/:projectId
 * Investor can access only approved projects.
 */
export async function getApprovedProjectDetailsForInvestor(req, res) {
  try {
    const rawProjectId = req.params.projectId;
    const projectId = Number.parseInt(rawProjectId, 10);
    if (!Number.isInteger(projectId)) {
      console.warn('getApprovedProjectDetailsForInvestor: invalid projectId param', {
        rawProjectId,
      });
      return res.status(400).json({ success: false, message: 'Invalid project id.' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        builder: { select: { id: true, companyName: true } },
        investments: { select: { investedAmount: true } },
        images: { select: { imageUrl: true } },
      },
    });

    if (!project) {
      console.warn('getApprovedProjectDetailsForInvestor: project not found', {
        projectId,
        requestedBy: req.auth?.id,
        role: req.auth?.role,
      });
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (project.projectStatus !== 'APPROVED') {
      console.warn('getApprovedProjectDetailsForInvestor: project not approved', {
        projectId,
        status: project.projectStatus,
        requestedBy: req.auth?.id,
        role: req.auth?.role,
      });
      return res.status(403).json({ success: false, message: 'Project is not available for investors.' });
    }

    console.log('getApprovedProjectDetailsForInvestor: success', {
      projectId,
      status: project.projectStatus,
      requestedBy: req.auth?.id,
    });

    return res.json({
      success: true,
      data: serializeProjectDetails(project),
      project: serializeProjectDetails(project),
    });
  } catch (err) {
    console.error('getApprovedProjectDetailsForInvestor:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch project details.' });
  }
}
