import prisma from '../utils/prisma.js';

/**
 * Submit Builder KYC
 * POST /api/builder/kyc
 * multipart/form-data: documentType, documentNumber, documentImage (file)
 * Protected: builder only
 */
export async function submitBuilderKyc(req, res) {
  try {
    const builderId = req.auth.id;
    const documentType = req.body.documentType?.trim();
    const documentNumber = req.body.documentNumber?.trim();
    const file = req.file;

    if (!documentType || !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentNumber are required.',
      });
    }

    if (!file || !file.filename) {
      return res.status(400).json({
        success: false,
        message: 'documentImage file is required.',
      });
    }

    const existingPending = await prisma.kYC.findFirst({
      where: {
        builderId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active KYC submission awaiting approval. Only one active KYC per builder.',
      });
    }

    const documentImagePath = `kyc/${file.filename}`;

    await prisma.$transaction([
      prisma.kYC.create({
        data: {
          builderId,
          documentType,
          documentNumber,
          documentImage: documentImagePath,
          status: 'PENDING',
        },
      }),
      prisma.builder.update({
        where: { id: builderId },
        data: { kycStatus: 'PENDING', isApproved: false },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'KYC submitted. Awaiting admin approval.',
    });
  } catch (err) {
    console.error('submitBuilderKyc:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC.',
    });
  }
}

/**
 * Get current builder KYC status
 * GET /api/builder/kyc/status
 * Protected: builder only
 */
export async function getBuilderKycStatus(req, res) {
  try {
    const builderId = req.auth.id;

    const [builder, latestKyc] = await Promise.all([
      prisma.builder.findUnique({
        where: { id: builderId },
        select: { kycStatus: true },
      }),
      prisma.kYC.findFirst({
        where: { builderId },
        orderBy: { createdAt: 'desc' },
        select: { status: true, rejectionReason: true, createdAt: true, verifiedAt: true },
      }),
    ]);

    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    const effectiveStatus = latestKyc?.status ?? builder.kycStatus;

    res.json({
      success: true,
      kycStatus: effectiveStatus,
      rejectionReason: latestKyc?.status === 'REJECTED' ? latestKyc.rejectionReason ?? '' : '',
      submittedAt: latestKyc?.createdAt ?? null,
      approvedAt: latestKyc?.status === 'VERIFIED' ? latestKyc.verifiedAt ?? null : null,
    });
  } catch (err) {
    console.error('getBuilderKycStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status.' });
  }
}
