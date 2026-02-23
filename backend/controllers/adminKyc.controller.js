import prisma from '../utils/prisma.js';

/**
 * List pending investor KYC submissions (for admin)
 * GET /api/admin/kyc/pending
 */
export async function listPendingInvestorKyc(req, res) {
  try {
    const list = await prisma.kYC.findMany({
      where: {
        userId: { not: null },
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, mobileNumber: true, kycStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: list.map((k) => ({
        id: k.id,
        documentType: k.documentType,
        documentNumber: k.documentNumber,
        documentImage: k.documentImage,
        status: k.status,
        createdAt: k.createdAt,
        user: k.user,
      })),
    });
  } catch (err) {
    console.error('listPendingInvestorKyc:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch pending KYC.' });
  }
}

/**
 * Approve investor KYC
 * PATCH /api/admin/kyc/:id/approve
 */
export async function approveInvestorKyc(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid KYC id.' });
    }
    const kyc = await prisma.kYC.findFirst({
      where: { id, userId: { not: null } },
    });
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found.' });
    }
    if (kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'KYC is not pending.' });
    }
    await prisma.$transaction([
      prisma.kYC.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date() },
      }),
      prisma.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'VERIFIED' },
      }),
    ]);
    res.json({
      success: true,
      message: 'KYC approved. Investor dashboard will show approved status.',
    });
  } catch (err) {
    console.error('approveInvestorKyc:', err);
    res.status(500).json({ success: false, message: 'Failed to approve KYC.' });
  }
}

/**
 * Reject investor KYC
 * PATCH /api/admin/kyc/:id/reject
 * Body: { reason?: string }
 */
export async function rejectInvestorKyc(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid KYC id.' });
    }
    const kyc = await prisma.kYC.findFirst({
      where: { id, userId: { not: null } },
    });
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found.' });
    }
    if (kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'KYC is not pending.' });
    }
    await prisma.$transaction([
      prisma.kYC.update({
        where: { id },
        data: { status: 'REJECTED' },
      }),
      prisma.user.update({
        where: { id: kyc.userId },
        data: { kycStatus: 'REJECTED' },
      }),
    ]);
    res.json({
      success: true,
      message: 'KYC rejected.',
    });
  } catch (err) {
    console.error('rejectInvestorKyc:', err);
    res.status(500).json({ success: false, message: 'Failed to reject KYC.' });
  }
}
