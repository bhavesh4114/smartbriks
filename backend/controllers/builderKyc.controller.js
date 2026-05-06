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
    const body = req.body || {};
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

    const normalize = (v) => (typeof v === 'string' ? v.trim() || null : null);

    const docImageMap = {
      companyPanImage: null,
      gstCertificateImage: null,
      cinLlpinImage: null,
      reraCertificateImage: null,
      cancelledChequeImage: null,
      idProofImage: null,
      selfieWithIdImage: null,
    };

    const kycDocs = [
      {
        key: 'companyPanFile',
        type: 'COMPANY_PAN_CARD',
        number: normalize(body.companyPan) || documentNumber || 'PENDING',
        imageField: 'companyPanImage',
      },
      {
        key: 'gstCertificateFile',
        type: 'GST_CERTIFICATE',
        number: normalize(body.gstNumber) || 'PENDING',
        imageField: 'gstCertificateImage',
      },
      {
        key: 'cinLlpinFile',
        type: 'CIN_LLPIN_DOCUMENT',
        number: normalize(body.cinLlpinNumber) || 'PENDING',
        imageField: 'cinLlpinImage',
      },
      {
        key: 'reraCertificateFile',
        type: 'RERA_CERTIFICATE',
        number: normalize(body.reraNumber) || 'PENDING',
        imageField: 'reraCertificateImage',
      },
      {
        key: 'cancelledChequeFile',
        type: 'CANCELLED_CHEQUE',
        number: normalize(body.accountNumber) || 'PENDING',
        imageField: 'cancelledChequeImage',
      },
      {
        key: 'idProofFile',
        type: 'AUTHORIZED_PERSON_ID',
        number: normalize(body.authPersonPan) || 'PENDING',
        imageField: 'idProofImage',
      },
      {
        key: 'selfieWithIdFile',
        type: 'AUTHORIZED_PERSON_SELFIE',
        number: normalize(body.authPersonPan) || 'PENDING',
        imageField: 'selfieWithIdImage',
      },
    ]
      .map((doc) => {
        const list = Array.isArray(files[doc.key]) ? files[doc.key] : [];
        const first = list[0];
        if (!first?.filename) return null;
        const imagePath = `kyc/${first.filename}`;
        docImageMap[doc.imageField] = imagePath;
        return {
          builderId,
          documentType: doc.type,
          documentNumber: doc.number,
          documentImage: imagePath,
          status: 'PENDING',
        };
      })
      .filter(Boolean);

    const builderUpdateData = {
      kycStatus: 'PENDING',
      isApproved: false,
      companyName: normalize(body.companyName) || undefined,
      businessType: normalize(body.businessType),
      yearOfEstablishment: normalize(body.yearOfEstablishment),
      companyPan: normalize(body.companyPan),
      gstNumber: normalize(body.gstNumber),
      officialEmail: normalize(body.officialEmail),
      officialMobile: normalize(body.officialMobile),
      addressLine1: normalize(body.addressLine1),
      addressLine2: normalize(body.addressLine2),
      city: normalize(body.city),
      state: normalize(body.state),
      pincode: normalize(body.pincode),
      country: normalize(body.country),
      sameAsSiteOffice: body.sameAsSiteOffice === 'true' || body.sameAsSiteOffice === true,
      reraNumber: normalize(body.reraNumber),
      accountHolderName: normalize(body.accountHolderName),
      bankName: normalize(body.bankName),
      accountNumber: normalize(body.accountNumber),
      ifscCode: normalize(body.ifscCode),
      authPersonName: normalize(body.authPersonName),
      designation: normalize(body.designation),
      authPersonMobile: normalize(body.authPersonMobile),
      authPersonEmail: normalize(body.authPersonEmail),
      authPersonPan: normalize(body.authPersonPan),
      companyPanImage: docImageMap.companyPanImage,
      gstCertificateImage: docImageMap.gstCertificateImage,
      cinLlpinImage: docImageMap.cinLlpinImage,
      reraCertificateImage: docImageMap.reraCertificateImage,
      cancelledChequeImage: docImageMap.cancelledChequeImage,
      idProofImage: docImageMap.idProofImage,
      selfieWithIdImage: docImageMap.selfieWithIdImage,
    };

    await prisma.$transaction([
      prisma.kYC.createMany({ data: kycDocs }),
      prisma.builder.update({
        where: { id: builderId },
        data: builderUpdateData,
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

    const [builder, latestKyc, latestRejected] = await Promise.all([
      prisma.builder.findUnique({
        where: { id: builderId },
        select: { kycStatus: true },
      }),
      prisma.kYC.findFirst({
        where: { builderId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true, verifiedAt: true },
      }),
      prisma.kYC.findFirst({
        where: {
          builderId,
          status: 'REJECTED',
          rejectionReason: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { rejectionReason: true },
      }),
    ]);

    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    const effectiveStatus = builder.kycStatus;

    res.json({
      success: true,
      kycStatus: effectiveStatus,
      rejectionReason: effectiveStatus === 'REJECTED' ? latestRejected?.rejectionReason ?? '' : '',
      submittedAt: latestKyc?.createdAt ?? null,
      approvedAt: effectiveStatus === 'VERIFIED' ? latestKyc?.verifiedAt ?? null : null,
    });
  } catch (err) {
    console.error('getBuilderKycStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status.' });
  }
}
