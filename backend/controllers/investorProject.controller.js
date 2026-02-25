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
