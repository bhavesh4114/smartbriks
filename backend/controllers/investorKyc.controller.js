import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../utils/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '../uploads/investor-kyc');

/**
 * Save base64 image to disk; returns relative path or null.
 */
function saveBase64Image(base64, prefix = 'selfie') {
  if (!base64 || typeof base64 !== 'string') return null;
  const match = base64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const data = Buffer.from(match[2], 'base64');
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filepath, data);
  return `investor-kyc/${filename}`;
}

/**
 * Submit Investor KYC
 * POST /api/investor/kyc
 * Body (JSON): personal details, address, bank, income, selfieImage (base64 or path)
 * Protected: investor only
 */
export async function submitInvestorKyc(req, res) {
  try {
    const investorId = req.auth.id;
    const body = req.body || {};

    const documentType = body.documentType?.trim() || 'KYC_SUBMISSION';
    const documentNumber =
      body.documentNumber?.trim() ||
      body.personalDetails?.pan?.trim()?.toUpperCase() ||
      body.pan?.trim()?.toUpperCase() ||
      'PENDING';

    const files = req.files || {};
    const hasFiles = Object.values(files).some((list) => Array.isArray(list) && list.length > 0);

    let documentImage = body.documentImage || body.selfieImage || null;
    if (!hasFiles && documentImage && typeof documentImage === 'string' && documentImage.startsWith('data:image')) {
      const saved = saveBase64Image(documentImage, 'selfie');
      if (saved) documentImage = saved;
    }

    const existingPending = await prisma.kYC.findMany({
      where: {
        userId: investorId,
        status: 'PENDING',
      },
      select: { id: true },
    });

    const kycDocs = [];
    const kycDocImages = {
      panCardImage: null,
      aadhaarImage: null,
      bankProofImage: null,
      selfieImage: null,
    };
    if (hasFiles) {
      const map = [
        { key: 'panCardFile', type: 'INVESTOR_PAN_CARD', number: body.pan?.trim()?.toUpperCase() || documentNumber },
        { key: 'aadhaarFile', type: 'INVESTOR_AADHAAR_CARD', number: body.aadhaar?.trim() || 'PENDING' },
        { key: 'bankProofFile', type: 'BANK_PROOF', number: body.accountNumber?.trim() || 'PENDING' },
        { key: 'selfieFile', type: 'INVESTOR_SELFIE', number: body.pan?.trim()?.toUpperCase() || documentNumber },
      ];
      for (const doc of map) {
        const list = Array.isArray(files[doc.key]) ? files[doc.key] : [];
        const first = list[0];
        if (!first?.filename) continue;
        const docImagePath = `kyc/${first.filename}`;
        kycDocs.push({
          userId: investorId,
          documentType: doc.type,
          documentNumber: doc.number,
          documentImage: docImagePath,
          status: 'PENDING',
        });
        if (doc.key === 'panCardFile') kycDocImages.panCardImage = docImagePath;
        if (doc.key === 'aadhaarFile') kycDocImages.aadhaarImage = docImagePath;
        if (doc.key === 'bankProofFile') kycDocImages.bankProofImage = docImagePath;
        if (doc.key === 'selfieFile') kycDocImages.selfieImage = docImagePath;
      }
    } else if (documentImage) {
      kycDocs.push({
        userId: investorId,
        documentType,
        documentNumber,
        documentImage: documentImage || null,
        status: 'PENDING',
      });
    }

    if (!kycDocs.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one KYC document is required.',
      });
    }

    const normalize = (v) => (typeof v === 'string' ? v.trim() || null : null);
    const normalizeOptional = (v) => {
      if (typeof v !== 'string') return undefined;
      const cleaned = v.trim();
      return cleaned.length ? cleaned : null;
    };
    const bodyHas = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const firstBodyValue = (...keys) => {
      for (const key of keys) {
        if (bodyHas(key)) return body[key];
      }
      return undefined;
    };
    const setIfDefined = (obj, key, value) => {
      if (value !== undefined) obj[key] = value;
    };

    const userUpdateData = {
      kycStatus: 'PENDING',
    };

    const nextFullName = normalize(body.fullName ?? body.personalDetails?.fullName);
    const nextEmail = normalize(body.email ?? body.personalDetails?.email);
    const nextMobile = normalize(body.mobile ?? body.mobileNumber ?? body.personalDetails?.mobile);

    if (nextFullName) userUpdateData.fullName = nextFullName;
    if (nextEmail) userUpdateData.email = nextEmail;
    if (nextMobile) userUpdateData.mobileNumber = nextMobile;

    const sourceOfFundsRaw = body.sourceOfFunds;
    let sourceOfFunds = [];
    if (Array.isArray(sourceOfFundsRaw)) {
      sourceOfFunds = sourceOfFundsRaw;
    } else if (typeof sourceOfFundsRaw === 'string') {
      const raw = sourceOfFundsRaw.trim();
      if (raw.startsWith('[')) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) sourceOfFunds = parsed;
        } catch {
          sourceOfFunds = [];
        }
      } else {
        sourceOfFunds = raw.split(',').map((x) => x.trim()).filter(Boolean);
      }
    }

    const profileData = {};
    const resAddressLine1 = normalizeOptional(firstBodyValue('resAddressLine1'));
    const resAddressLine2 = normalizeOptional(firstBodyValue('resAddressLine2'));
    const resCity = normalizeOptional(firstBodyValue('resCity', 'city'));
    const resState = normalizeOptional(firstBodyValue('resState', 'state'));
    const resPincode = normalizeOptional(firstBodyValue('resPincode', 'zipCode', 'pincode'));
    const permAddressLine1 = normalizeOptional(firstBodyValue('permAddressLine1'));
    const permAddressLine2 = normalizeOptional(firstBodyValue('permAddressLine2'));
    const permCity = normalizeOptional(firstBodyValue('permCity'));
    const permState = normalizeOptional(firstBodyValue('permState'));
    const permPincode = normalizeOptional(firstBodyValue('permPincode'));

    setIfDefined(profileData, 'dateOfBirth', normalizeOptional(body.dateOfBirth));
    setIfDefined(profileData, 'gender', normalizeOptional(body.gender));
    setIfDefined(profileData, 'panNumber', normalizeOptional(body.pan));
    setIfDefined(profileData, 'aadhaarNumber', normalizeOptional(body.aadhaar));
    setIfDefined(profileData, 'resAddressLine1', resAddressLine1);
    setIfDefined(profileData, 'resAddressLine2', resAddressLine2);
    setIfDefined(profileData, 'address', resAddressLine1 ?? normalizeOptional(firstBodyValue('address')));
    setIfDefined(profileData, 'city', resCity);
    setIfDefined(profileData, 'state', resState);
    setIfDefined(profileData, 'zipCode', resPincode);
    setIfDefined(profileData, 'permAddressLine1', permAddressLine1 ?? resAddressLine1);
    setIfDefined(profileData, 'permAddressLine2', permAddressLine2 ?? resAddressLine2);
    setIfDefined(profileData, 'permCity', permCity ?? resCity);
    setIfDefined(profileData, 'permState', permState ?? resState);
    setIfDefined(profileData, 'permPincode', permPincode ?? resPincode);
    setIfDefined(profileData, 'bankName', normalizeOptional(body.bankName));
    setIfDefined(profileData, 'accountHolderName', normalizeOptional(body.accountHolderName));
    setIfDefined(profileData, 'accountNumber', normalizeOptional(body.accountNumber));
    setIfDefined(profileData, 'routingNumber', normalizeOptional(body.ifscCode ?? body.routingNumber ?? body.routing));
    setIfDefined(profileData, 'swiftCode', normalizeOptional(body.swiftCode ?? body.swift ?? body.ifscCode));
    setIfDefined(profileData, 'accountType', normalizeOptional(body.accountType));
    setIfDefined(profileData, 'upiId', normalizeOptional(body.upiId));
    setIfDefined(profileData, 'annualIncome', normalizeOptional(body.annualIncome));
    setIfDefined(profileData, 'occupation', normalizeOptional(body.occupation));
    if (sourceOfFunds.length) setIfDefined(profileData, 'sourceOfFunds', JSON.stringify(sourceOfFunds));
    setIfDefined(profileData, 'riskAppetite', normalizeOptional(body.riskAppetite));
    setIfDefined(profileData, 'panCardImage', kycDocImages.panCardImage);
    setIfDefined(profileData, 'aadhaarImage', kycDocImages.aadhaarImage);
    setIfDefined(profileData, 'bankProofImage', kycDocImages.bankProofImage);
    setIfDefined(profileData, 'selfieImage', kycDocImages.selfieImage ?? normalizeOptional(documentImage));

    await prisma.$transaction(async (tx) => {
      if (existingPending.length > 0) {
        await tx.kYC.deleteMany({
          where: {
            userId: investorId,
            status: 'PENDING',
          },
        });
      }

      await tx.kYC.createMany({ data: kycDocs });
      await tx.user.update({
        where: { id: investorId },
        data: userUpdateData,
      });
      const existingProfile = await tx.investorProfile.findUnique({
        where: { userId: investorId },
        select: {
          panCardImage: true,
          aadhaarImage: true,
          bankProofImage: true,
          selfieImage: true,
        },
      });

      const allDocs = await tx.kYC.findMany({
        where: { userId: investorId },
        orderBy: { createdAt: 'desc' },
        select: { documentType: true, documentImage: true },
      });

      const latestByType = (docType) =>
        allDocs.find((doc) => doc.documentType === docType && doc.documentImage)?.documentImage || null;

      const mergedProfileData = {
        ...profileData,
        panCardImage:
          profileData.panCardImage ??
          latestByType('INVESTOR_PAN_CARD') ??
          existingProfile?.panCardImage ??
          null,
        aadhaarImage:
          profileData.aadhaarImage ??
          latestByType('INVESTOR_AADHAAR_CARD') ??
          existingProfile?.aadhaarImage ??
          null,
        bankProofImage:
          profileData.bankProofImage ??
          latestByType('BANK_PROOF') ??
          existingProfile?.bankProofImage ??
          null,
        selfieImage:
          profileData.selfieImage ??
          latestByType('INVESTOR_SELFIE') ??
          latestByType('KYC_SUBMISSION') ??
          existingProfile?.selfieImage ??
          null,
      };

      const missingRequired = [];
      if (!mergedProfileData.panCardImage) missingRequired.push('PAN card');
      if (!mergedProfileData.aadhaarImage) missingRequired.push('Aadhaar');
      if (!mergedProfileData.bankProofImage) missingRequired.push('Bank proof');
      if (!mergedProfileData.selfieImage) missingRequired.push('Selfie');
      if (missingRequired.length > 0) {
        const e = new Error(`Missing required KYC document images: ${missingRequired.join(', ')}`);
        e.statusCode = 400;
        throw e;
      }

      await tx.investorProfile.upsert({
        where: { userId: investorId },
        create: {
          userId: investorId,
          ...mergedProfileData,
        },
        update: mergedProfileData,
      });
    });

    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully. Awaiting verification',
      status: 'PENDING',
    });
  } catch (err) {
    console.error('submitInvestorKyc:', err);
    if (err?.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        message: err.message || 'Failed to submit KYC.',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC.',
    });
  }
}

/**
 * Get current investor KYC status (from User.kycStatus)
 * GET /api/investor/kyc/status
 */
export async function getInvestorKycStatus(req, res) {
  try {
    const investorId = req.auth.id;
    const [user, latestRejected] = await Promise.all([
      prisma.user.findUnique({
      where: { id: investorId },
      select: { kycStatus: true },
      }),
      prisma.kYC.findFirst({
        where: {
          userId: investorId,
          status: 'REJECTED',
          rejectionReason: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { rejectionReason: true },
      }),
    ]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      kycStatus: user.kycStatus,
      rejectionReason: latestRejected?.rejectionReason ?? '',
    });
  } catch (err) {
    console.error('getInvestorKycStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status.' });
  }
}
