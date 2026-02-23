import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Invest in a project (Investor)
 * POST /api/investments
 */
export async function invest(req, res) {
  try {
    const investorId = req.investor?.id ?? req.auth.id;
    const { projectId, amount, paymentId } = req.body;

    const projId = parseInt(projectId, 10);
    if (Number.isNaN(projId) || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid projectId and positive amount are required.',
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projId },
    });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (project.projectStatus !== 'ACTIVE' && project.projectStatus !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Project is not open for investment.',
      });
    }

    const investAmount = new Decimal(amount);
    const pricePerShare = new Decimal(project.pricePerShare);
    const minInvestment = new Decimal(project.minInvestment);

    if (investAmount.lt(minInvestment)) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment is ${minInvestment.toString()}.`,
      });
    }

    const sharesPurchased = Math.floor(Number(investAmount.div(pricePerShare)));
    if (sharesPurchased < 1) {
      return res.status(400).json({
        success: false,
        message: 'Amount is too low to purchase at least one share.',
      });
    }

    const existing = await prisma.investment.findUnique({
      where: {
        userId_projectId: { userId: investorId, projectId: projId },
      },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You already have an investment in this project. Use update or add separately.',
      });
    }

    const actualAmount = pricePerShare.mul(sharesPurchased);

    const investment = await prisma.$transaction(async (tx) => {
      const inv = await tx.investment.create({
        data: {
          userId: investorId,
          projectId: projId,
          investedAmount: actualAmount,
          sharesPurchased,
          investmentStatus: 'ACTIVE',
        },
      });
      if (paymentId) {
        await tx.payment.updateMany({
          where: {
            id: parseInt(paymentId, 10),
            userId: investorId,
            projectId: projId,
          },
          data: { paymentStatus: 'SUCCESS' },
        });
      }
      return inv;
    });

    res.status(201).json({
      success: true,
      message: 'Investment recorded.',
      data: serializeInvestment(investment),
    });
  } catch (err) {
    console.error('invest:', err);
    res.status(500).json({ success: false, message: 'Failed to create investment.' });
  }
}

/**
 * Get investor portfolio (projects invested in)
 * GET /api/investments/portfolio
 */
export async function getPortfolio(req, res) {
  try {
    const investorId = req.investor?.id ?? req.auth.id;

    const investments = await prisma.investment.findMany({
      where: { userId: investorId, investmentStatus: 'ACTIVE' },
      include: {
        project: {
          include: {
            builder: {
              select: {
                id: true,
                companyName: true,
                contactPerson: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: investments.map((i) => ({
        ...serializeInvestment(i),
        project: {
          id: i.project.id,
          title: i.project.title,
          location: i.project.location,
          projectStatus: i.project.projectStatus,
          totalShares: i.project.totalShares,
          expectedROI: i.project.expectedROI?.toString?.() ?? i.project.expectedROI,
          builder: i.project.builder,
        },
      })),
    });
  } catch (err) {
    console.error('getPortfolio:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio.' });
  }
}

/**
 * Get returns & profits for investor
 * GET /api/investments/returns
 */
export async function getMyReturns(req, res) {
  try {
    const investorId = req.investor?.id ?? req.auth.id;

    const investorReturns = await prisma.userReturn.findMany({
      where: { userId: investorId },
      include: {
        returnDistribution: {
          include: {
            project: {
              select: {
                id: true,
                title: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: { creditedAt: 'desc' },
    });

    res.json({
      success: true,
      data: investorReturns.map((ur) => ({
        id: ur.id,
        amount: ur.amount?.toString?.() ?? ur.amount,
        creditedAt: ur.creditedAt,
        project: ur.returnDistribution?.project,
        distributionDate: ur.returnDistribution?.distributionDate,
      })),
    });
  } catch (err) {
    console.error('getMyReturns:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch returns.' });
  }
}

function serializeInvestment(i) {
  return {
    id: i.id,
    investorId: i.userId,
    projectId: i.projectId,
    investedAmount: i.investedAmount?.toString?.() ?? i.investedAmount,
    sharesPurchased: i.sharesPurchased,
    investmentStatus: i.investmentStatus,
    createdAt: i.createdAt,
  };
}
