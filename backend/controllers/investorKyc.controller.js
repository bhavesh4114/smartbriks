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

    const existingPending = await prisma.kYC.findFirst({
      where: {
        userId: investorId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active KYC submission awaiting verification. Only one active KYC per investor.',
      });
    }

    const kycDocs = [];
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
        kycDocs.push({
          userId: investorId,
          documentType: doc.type,
          documentNumber: doc.number,
          documentImage: `kyc/${first.filename}`,
          status: 'PENDING',
        });
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

    await prisma.$transaction([
      prisma.kYC.createMany({ data: kycDocs }),
      prisma.user.update({
        where: { id: investorId },
        data: { kycStatus: 'PENDING' },
      }),
    ]);

    res.status(201).json({
      success: true,
      message: 'KYC submitted successfully. Awaiting verification',
      status: 'PENDING',
    });
  } catch (err) {
    console.error('submitInvestorKyc:', err);
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
    const user = await prisma.user.findUnique({
      where: { id: investorId },
      select: { kycStatus: true },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({
      success: true,
      kycStatus: user.kycStatus,
    });
  } catch (err) {
    console.error('getInvestorKycStatus:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch KYC status.' });
  }
}
