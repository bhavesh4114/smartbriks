import prisma from '../utils/prisma.js';

/**
 * List pending KYC submissions (investor + builder) for admin
 * GET /api/admin/kyc/pending
 */
export async function listPendingInvestorKyc(req, res) {
  try {
    const list = await prisma.kYC.findMany({
      where: {
        status: 'PENDING',
        OR: [{ userId: { not: null } }, { builderId: { not: null } }],
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, mobileNumber: true, kycStatus: true },
        },
        builder: {
          select: { id: true, companyName: true, contactPerson: true, email: true, mobileNumber: true, kycStatus: true },
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
        builder: k.builder,
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
      where: { id, OR: [{ userId: { not: null } }, { builderId: { not: null } }] },
    });
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found.' });
    }
    if (kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'KYC is not pending.' });
    }

    const ops = [
      prisma.kYC.update({
        where: { id },
        data: { status: 'VERIFIED', verifiedAt: new Date(), rejectionReason: null },
      }),
    ];

    if (kyc.userId) {
      ops.push(
        prisma.user.update({
          where: { id: kyc.userId },
          data: { kycStatus: 'VERIFIED' },
        })
      );
    }
    if (kyc.builderId) {
      ops.push(
        prisma.builder.update({
          where: { id: kyc.builderId },
          data: { kycStatus: 'VERIFIED', isApproved: true },
        })
      );
    }

    await prisma.$transaction(ops);

    const subject = kyc.builderId ? 'Builder' : 'Investor';
    res.json({
      success: true,
      message: `KYC approved. ${subject} dashboard will show approved status.`,
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
    const reason = req.body?.reason?.trim();
    if (!Number.isInteger(id)) {
      return res.status(400).json({ success: false, message: 'Invalid KYC id.' });
    }
    const kyc = await prisma.kYC.findFirst({
      where: { id, OR: [{ userId: { not: null } }, { builderId: { not: null } }] },
    });
    if (!kyc) {
      return res.status(404).json({ success: false, message: 'KYC record not found.' });
    }
    if (kyc.builderId && !reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }
    if (kyc.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'KYC is not pending.' });
    }

    const ops = [
      prisma.kYC.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason ?? null, verifiedAt: null },
      }),
    ];

    if (kyc.userId) {
      ops.push(
        prisma.user.update({
          where: { id: kyc.userId },
          data: { kycStatus: 'REJECTED' },
        })
      );
    }
    if (kyc.builderId) {
      ops.push(
        prisma.builder.update({
          where: { id: kyc.builderId },
          data: { kycStatus: 'REJECTED', isApproved: false },
        })
      );
    }

    await prisma.$transaction(ops);

    res.json({
      success: true,
      message: 'KYC rejected.',
    });
  } catch (err) {
    console.error('rejectInvestorKyc:', err);
    res.status(500).json({ success: false, message: 'Failed to reject KYC.' });
  }
}
