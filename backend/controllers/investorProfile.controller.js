import prisma from '../utils/prisma.js';

/**
 * Get investor profile (own) with stats and KYC documents
 * GET /api/investor/profile
 */
export async function getInvestorProfile(req, res) {
  try {
    const investorId = req.auth.id;

    const [user, investments, kycDocs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: investorId },
        select: {
          id: true,
          fullName: true,
          email: true,
          mobileNumber: true,
          createdAt: true,
          kycStatus: true,
          isActive: true,
        },
      }),
      prisma.investment.findMany({
        where: { userId: investorId },
        select: {
          investedAmount: true,
          investmentStatus: true,
          projectId: true,
        },
      }),
      prisma.kYC.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          documentType: true,
          documentNumber: true,
          documentImage: true,
          status: true,
          createdAt: true,
          verifiedAt: true,
          rejectionReason: true,
        },
      }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    const totalInvested = investments.reduce((sum, inv) => {
      const amt = Number(inv.investedAmount?.toString?.() ?? inv.investedAmount ?? 0);
      return sum + (Number.isFinite(amt) ? amt : 0);
    }, 0);

    const activeProjects = new Set(
      investments.filter((i) => i.investmentStatus === 'ACTIVE').map((i) => i.projectId)
    ).size;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobileNumber: user.mobileNumber,
          createdAt: user.createdAt,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
        },
        stats: {
          total_investments: totalInvested?.toString?.() ?? totalInvested,
          active_projects: activeProjects,
        },
        kyc_documents: kycDocs.map((d) => ({
          id: d.id,
          documentType: d.documentType,
          documentNumber: d.documentNumber,
          documentImage: d.documentImage,
          status: d.status,
          createdAt: d.createdAt,
          verifiedAt: d.verifiedAt,
          rejectionReason: d.rejectionReason,
        })),
      },
    });
  } catch (err) {
    console.error('getInvestorProfile:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch investor profile.' });
  }
}
