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
    const files = req.files || {};

    if (!documentType || !documentNumber) {
      return res.status(400).json({
        success: false,
        message: 'documentType and documentNumber are required.',
      });
    }

    const hasFiles = Object.values(files).some((list) => Array.isArray(list) && list.length > 0);
    if (!hasFiles) {
      return res.status(400).json({
        success: false,
        message: 'At least one document file is required.',
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

    await prisma.$transaction([
      prisma.kYC.createMany({
        data: [
          {
            key: 'companyPanFile',
            type: 'COMPANY_PAN_CARD',
            number: req.body.companyPan?.trim() || documentNumber || 'PENDING',
          },
          {
            key: 'gstCertificateFile',
            type: 'GST_CERTIFICATE',
            number: req.body.gstNumber?.trim() || 'PENDING',
          },
          {
            key: 'reraCertificateFile',
            type: 'RERA_CERTIFICATE',
            number: req.body.reraNumber?.trim() || 'PENDING',
          },
          {
            key: 'cancelledChequeFile',
            type: 'CANCELLED_CHEQUE',
            number: req.body.accountNumber?.trim() || 'PENDING',
          },
          {
            key: 'idProofFile',
            type: 'AUTHORIZED_PERSON_ID',
            number: req.body.authPersonPan?.trim() || 'PENDING',
          },
          {
            key: 'selfieWithIdFile',
            type: 'AUTHORIZED_PERSON_SELFIE',
            number: req.body.authPersonPan?.trim() || 'PENDING',
          },
        ]
          .map((doc) => {
            const list = Array.isArray(files[doc.key]) ? files[doc.key] : [];
            const first = list[0];
            if (!first?.filename) return null;
            return {
              builderId,
              documentType: doc.type,
              documentNumber: doc.number,
              documentImage: `kyc/${first.filename}`,
              status: 'PENDING',
            };
          })
          .filter(Boolean),
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
