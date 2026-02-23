import prisma from '../utils/prisma.js';

/**
 * Submit KYC (Investor or Builder)
 * POST /api/kyc
 */
export async function submitKyc(req, res) {
  try {
    const role = req.auth.role;
    const investorId = role === 'INVESTOR' ? (req.investor?.id ?? req.auth.id) : null;
    const builderId = role === 'BUILDER' ? req.auth.id : null;
    const { documentType, documentNumber, documentImage } = req.body;

    if (!documentType || !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentNumber are required.',
      });
    }

    const kyc = await prisma.kYC.create({
      data: {
        userId: investorId || undefined,
        builderId: builderId || undefined,
        documentType,
        documentNumber,
        documentImage: documentImage || null,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      message: 'KYC submission received.',
      data: {
        id: kyc.id,
        documentType: kyc.documentType,
        status: kyc.status,
        createdAt: kyc.createdAt,
      },
    });
  } catch (err) {
    console.error('submitKyc:', err);
    res.status(500).json({ success: false, message: 'Failed to submit KYC.' });
  }
}

/**
 * Get my KYC status and submissions
 * GET /api/kyc/me
 */
export async function getMyKyc(req, res) {
  try {
    const role = req.auth.role;
    const investorId = role === 'INVESTOR' ? (req.investor?.id ?? req.auth.id) : null;
    const builderId = role === 'BUILDER' ? req.auth.id : null;

    const where = investorId ? { userId: investorId } : { builderId };
    const submissions = await prisma.kYC.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const latest = submissions[0];
    const kycStatus = latest?.status ?? 'PENDING';

    res.json({
      success: true,
      data: {
        kycStatus,
        submissions: submissions.map((s) => ({
          id: s.id,
          documentType: s.documentType,
          status: s.status,
          verifiedAt: s.verifiedAt,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (err) {
    console.error('getMyKyc:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC.' });
  }
}
