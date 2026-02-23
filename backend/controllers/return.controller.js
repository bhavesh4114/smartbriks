import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Builder triggers profit distribution.
 * Calculates each investor's share based on ownership and creates investor return records.
 * POST /api/returns/distribute
 */
export async function distributeReturns(req, res) {
  try {
    const builderId = req.auth.id;
    const { projectId, totalProfit } = req.body;

    const projId = parseInt(projectId, 10);
    if (Number.isNaN(projId) || totalProfit == null || Number(totalProfit) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid projectId and positive totalProfit are required.',
      });
    }

    const project = await prisma.project.findFirst({
      where: { id: projId, builderId },
      include: {
        investments: {
          where: { investmentStatus: 'ACTIVE' },
          include: { user: { select: { id: true } } },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const totalShares = Number(project.totalShares);
    if (totalShares <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Project has no shares to distribute.',
      });
    }

    const profit = new Decimal(totalProfit);
    const distribution = await prisma.$transaction(async (tx) => {
      const dist = await tx.returnDistribution.create({
        data: {
          projectId: projId,
          totalProfit: profit,
        },
      });

      for (const inv of project.investments) {
        const shareRatio = new Decimal(inv.sharesPurchased).div(totalShares);
        const amount = profit.mul(shareRatio);
        await tx.userReturn.create({
          data: {
            returnDistributionId: dist.id,
            userId: inv.userId,
            amount,
          },
        });
      }

      return dist;
    });

    const investorReturnRecords = await prisma.userReturn.findMany({
      where: { returnDistributionId: distribution.id },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    res.status(201).json({
      success: true,
      message: 'Profit distribution completed.',
      data: {
        id: distribution.id,
        projectId: distribution.projectId,
        totalProfit: distribution.totalProfit?.toString?.() ?? distribution.totalProfit,
        distributionDate: distribution.distributionDate,
        investorReturns: investorReturnRecords.map((ur) => ({
          investorId: ur.userId,
          investor: ur.user,
          amount: ur.amount?.toString?.() ?? ur.amount,
          creditedAt: ur.creditedAt,
        })),
      },
    });
  } catch (err) {
    console.error('distributeReturns:', err);
    res.status(500).json({ success: false, message: 'Failed to distribute returns.' });
  }
}

/**
 * List distributions for a project (Builder)
 * GET /api/returns/project/:projectId
 */
export async function getDistributionsByProject(req, res) {
  try {
    const builderId = req.auth.id;
    const projectId = parseInt(req.params.projectId, 10);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, builderId },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const distributions = await prisma.returnDistribution.findMany({
      where: { projectId },
      include: {
        _count: { select: { userReturns: true } },
      },
      orderBy: { distributionDate: 'desc' },
    });

    res.json({
      success: true,
      data: distributions.map((d) => ({
        id: d.id,
        projectId: d.projectId,
        totalProfit: d.totalProfit?.toString?.() ?? d.totalProfit,
        distributionDate: d.distributionDate,
        investorReturnsCount: d._count?.userReturns ?? 0,
      })),
    });
  } catch (err) {
    console.error('getDistributionsByProject:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch distributions.' });
  }
}
