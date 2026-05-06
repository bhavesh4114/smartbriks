import prisma from '../utils/prisma.js';
import { serializeProjectTimelineForInvestor } from '../utils/projectTimeline.js';

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
  const normalized = keyFeatures
    .replace(/\r\n/g, '\n')
    .replace(/[|;•]/g, ',')
    .replace(/\n+/g, ',');

  const directSplit = normalized
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (directSplit.length > 1) {
    return directSplit;
  }

  const knownAmenities = [
    'Swimming Pool',
    'Gymnasium',
    'Children Play Area',
    'Garden',
    'Club House',
    '24x7 Security',
    '24/7 Security',
    'Parking Facility',
    'CCTV Surveillance',
    'Power Backup',
    'Lift',
    'Jogging Track',
    'Community Hall',
    'Indoor Games',
    'Landscape Garden',
    'Visitor Parking',
    'Fire Safety',
  ];

  const source = normalized.replace(/\s+/g, ' ').trim();
  const extracted = [];
  let remaining = source;

  for (const amenity of knownAmenities) {
    const pattern = new RegExp(amenity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (pattern.test(remaining)) {
      extracted.push(amenity);
      remaining = remaining.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  if (extracted.length > 0) {
    return extracted;
  }

  return directSplit;
}

function serializeProjectDetails(p) {
  const totalProjectCost = Number(p.totalValue?.toString?.() ?? p.totalValue ?? 0);
  const fundsRaised = Array.isArray(p.investments)
    ? p.investments.reduce((sum, i) => sum + Number(i.investedAmount?.toString?.() ?? i.investedAmount ?? 0), 0)
    : 0;
  const progressPercentage =
    totalProjectCost > 0 ? Math.min(100, (fundsRaised / totalProjectCost) * 100) : 0;

  const amenities = parseAmenities(p.keyFeatures);
  const timeline = serializeProjectTimelineForInvestor(p.timeline || []);

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
    investment_list: Array.isArray(p.investments)
      ? p.investments.map((inv) => ({
          name: inv.user?.fullName ?? 'Investor',
          amount: inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0,
          date: inv.createdAt,
        }))
      : [],
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
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
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
 * Investor can access approved projects, and also non-approved projects
 * where they already have an investment.
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
        investments: {
          select: {
            investedAmount: true,
            createdAt: true,
            user: { select: { fullName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        images: { select: { imageUrl: true } },
        timeline: {
          orderBy: { createdAt: 'asc' },
        },
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

    const isPubliclyVisible = project.projectStatus === 'APPROVED';
    if (!isPubliclyVisible) {
      const investorId = req.auth?.id;
      const alreadyInvested = investorId
        ? await prisma.investment.findFirst({
            where: { projectId, userId: investorId },
            select: { id: true },
          })
        : null;

      if (!alreadyInvested) {
        console.warn('getApprovedProjectDetailsForInvestor: project blocked for non-investor access', {
          projectId,
          status: project.projectStatus,
          requestedBy: req.auth?.id,
          role: req.auth?.role,
        });
        return res.status(403).json({ success: false, message: 'Project is not available for investors.' });
      }
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
