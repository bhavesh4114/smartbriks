import prisma from '../utils/prisma.js';

function toNumber(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET /api/admin/investors
 */
export async function listInvestors(req, res) {
  try {
    const investors = await prisma.user.findMany({
      where: { role: 'INVESTOR' },
      select: {
        id: true,
        fullName: true,
        email: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = await prisma.investment.groupBy({
      by: ['userId'],
      _sum: { investedAmount: true },
      _count: { projectId: true },
    });

    const investmentMap = new Map(
      grouped.map((g) => [
        g.userId,
        {
          totalInvested: toNumber(g._sum?.investedAmount?.toString?.() ?? g._sum?.investedAmount),
          totalProjects: g._count?.projectId ?? 0,
        },
      ])
    );

    const rows = investors.map((u) => {
        const agg = investmentMap.get(u.id) ?? { totalInvested: 0, totalProjects: 0 };
        return {
          id: u.id,
          name: u.fullName,
          email: u.email,
          total_invested_amount: agg.totalInvested,
          total_projects_invested: agg.totalProjects,
          kyc_status: u.kycStatus,
          account_status: u.isActive ? 'ACTIVE' : 'BLOCKED',
          created_at: u.createdAt,
        };
      });

    return res.json({
      success: true,
      investors: rows,
      data: rows,
    });
  } catch (err) {
    console.error('listInvestors:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investors.' });
  }
}

/**
 * GET /api/admin/investors/:id
 */
export async function getInvestorDetails(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid investor id.' });
    }

    const investor = await prisma.user.findFirst({
      where: { id, role: 'INVESTOR' },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
        role: true,
        kycStatus: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            dateOfBirth: true,
            gender: true,
            panNumber: true,
            aadhaarNumber: true,
            resAddressLine1: true,
            resAddressLine2: true,
            city: true,
            state: true,
            zipCode: true,
            permAddressLine1: true,
            permAddressLine2: true,
            permCity: true,
            permState: true,
            permPincode: true,
            bankName: true,
            accountHolderName: true,
            accountNumber: true,
            routingNumber: true,
            swiftCode: true,
            accountType: true,
            upiId: true,
            annualIncome: true,
            occupation: true,
            sourceOfFunds: true,
            riskAppetite: true,
            panCardImage: true,
            aadhaarImage: true,
            bankProofImage: true,
            selfieImage: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        kyc: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            documentType: true,
            documentNumber: true,
            documentImage: true,
            status: true,
            rejectionReason: true,
            verifiedAt: true,
            createdAt: true,
          },
        },
        investments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            projectId: true,
            investedAmount: true,
            sharesPurchased: true,
            investmentStatus: true,
            createdAt: true,
            project: {
              select: {
                title: true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    const totalInvested = investor.investments.reduce((sum, inv) => {
      const amt = Number(inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);

    return res.json({
      success: true,
      data: {
        ...investor,
        summary: {
          totalInvested,
          totalProjects: investor.investments.length,
        },
      },
    });
  } catch (err) {
    console.error('getInvestorDetails:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investor details.' });
  }
}

/**
 * GET /api/admin/investors/stats
 */
export async function getInvestorStats(req, res) {
  try {
    const [totalInvestors, activeInvestors, pendingKyc, blockedInvestors] = await Promise.all([
      prisma.user.count({ where: { role: 'INVESTOR' } }),
      prisma.user.count({ where: { role: 'INVESTOR', isActive: true } }),
      prisma.user.count({ where: { role: 'INVESTOR', kycStatus: 'PENDING' } }),
      prisma.user.count({ where: { role: 'INVESTOR', isActive: false } }),
    ]);

    const stats = {
      total_investors: totalInvestors,
      active_investors: activeInvestors,
      pending_kyc: pendingKyc,
      blocked_investors: blockedInvestors,
    };

    return res.json({
      success: true,
      stats,
      data: stats,
    });
  } catch (err) {
    console.error('getInvestorStats:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investor stats.' });
  }
}

/**
 * POST /api/admin/investors/:id/verify
 */
export async function verifyInvestor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid investor id.' });
    }

    const investor = await prisma.user.findFirst({
      where: { id, role: 'INVESTOR' },
      select: { id: true },
    });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { kycStatus: 'VERIFIED', isActive: true },
      });
      const latestKyc = await tx.kYC.findFirst({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (latestKyc) {
        await tx.kYC.update({
          where: { id: latestKyc.id },
          data: { status: 'VERIFIED', rejectionReason: null, verifiedAt: new Date() },
        });
      }
    });

    return res.json({ success: true, message: 'Investor verified.' });
  } catch (err) {
    console.error('verifyInvestor:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify investor.' });
  }
}

/**
 * POST /api/admin/investors/:id/reject
 * Body: { reason?: string }
 */
export async function rejectInvestor(req, res) {
  try {
    const id = Number(req.params.id);
    const reason = req.body?.reason?.trim() || null;
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid investor id.' });
    }

    const investor = await prisma.user.findFirst({
      where: { id, role: 'INVESTOR' },
      select: { id: true },
    });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { kycStatus: 'REJECTED' },
      });
      const latestKyc = await tx.kYC.findFirst({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (latestKyc) {
        await tx.kYC.update({
          where: { id: latestKyc.id },
          data: { status: 'REJECTED', rejectionReason: reason, verifiedAt: null },
        });
      }
    });

    return res.json({ success: true, message: 'Investor rejected.' });
  } catch (err) {
    console.error('rejectInvestor:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject investor.' });
  }
}

/**
 * POST /api/admin/investors/:id/block
 */
export async function blockInvestor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid investor id.' });
    }
    const investor = await prisma.user.findFirst({
      where: { id, role: 'INVESTOR' },
      select: { id: true },
    });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return res.json({ success: true, message: 'Investor blocked.' });
  } catch (err) {
    console.error('blockInvestor:', err);
    return res.status(500).json({ success: false, message: 'Failed to block investor.' });
  }
}

/**
 * POST /api/admin/investors/:id/unblock
 */
export async function unblockInvestor(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid investor id.' });
    }
    const investor = await prisma.user.findFirst({
      where: { id, role: 'INVESTOR' },
      select: { id: true },
    });
    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }
    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
    return res.json({ success: true, message: 'Investor unblocked.' });
  } catch (err) {
    console.error('unblockInvestor:', err);
    return res.status(500).json({ success: false, message: 'Failed to unblock investor.' });
  }
}
