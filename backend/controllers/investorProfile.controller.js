import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toNullableTrimmedString(value) {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  return v.length ? v : null;
}

/**
 * Get investor profile (own) with stats and KYC documents
 * GET /api/investor/profile
 */
export async function getInvestorProfile(req, res) {
  try {
    const investorId = req.auth.id;

    const [user, wallet, profile, investments, kycDocs] = await Promise.all([
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
      prisma.wallet.upsert({
        where: { userId: investorId },
        update: {},
        create: { userId: investorId },
        select: {
          id: true,
          balance: true,
        },
      }),
      prisma.investorProfile.findUnique({
        where: { userId: investorId },
        select: {
          dateOfBirth: true,
          gender: true,
          panNumber: true,
          aadhaarNumber: true,
          resAddressLine1: true,
          resAddressLine2: true,
          address: true,
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

    let sourceOfFunds = [];
    if (profile?.sourceOfFunds) {
      try {
        const parsed = JSON.parse(profile.sourceOfFunds);
        if (Array.isArray(parsed)) sourceOfFunds = parsed;
      } catch {
        sourceOfFunds = [];
      }
    }

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
        profile: {
          dateOfBirth: profile?.dateOfBirth ?? '',
          gender: profile?.gender ?? '',
          panNumber: profile?.panNumber ?? '',
          aadhaarNumber: profile?.aadhaarNumber ?? '',
          resAddressLine1: profile?.resAddressLine1 ?? '',
          resAddressLine2: profile?.resAddressLine2 ?? '',
          address: profile?.address ?? '',
          city: profile?.city ?? '',
          state: profile?.state ?? '',
          zipCode: profile?.zipCode ?? '',
          permAddressLine1: profile?.permAddressLine1 ?? '',
          permAddressLine2: profile?.permAddressLine2 ?? '',
          permCity: profile?.permCity ?? '',
          permState: profile?.permState ?? '',
          permPincode: profile?.permPincode ?? '',
        },
        bankDetails: {
          bankName: profile?.bankName ?? '',
          accountHolderName: profile?.accountHolderName ?? '',
          accountNumber: profile?.accountNumber ?? '',
          routingNumber: profile?.routingNumber ?? '',
          swiftCode: profile?.swiftCode ?? '',
          accountType: profile?.accountType ?? '',
          upiId: profile?.upiId ?? '',
        },
        kycDetails: {
          annualIncome: profile?.annualIncome ?? '',
          occupation: profile?.occupation ?? '',
          sourceOfFunds,
          riskAppetite: profile?.riskAppetite ?? '',
        },
        kycImages: {
          panCardImage: profile?.panCardImage ?? '',
          aadhaarImage: profile?.aadhaarImage ?? '',
          bankProofImage: profile?.bankProofImage ?? '',
          selfieImage: profile?.selfieImage ?? '',
        },
        stats: {
          total_investments: totalInvested?.toString?.() ?? totalInvested,
          active_projects: activeProjects,
        },
        wallet: {
          id: wallet.id,
          balance: wallet.balance?.toString?.() ?? wallet.balance,
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

/**
 * Get investor identity basics for KYC prefill
 * GET /api/investor/profile/identity
 */
export async function getInvestorIdentity(req, res) {
  try {
    const investorId = req.auth.id;
    const user = await prisma.user.findUnique({
      where: { id: investorId },
      select: {
        id: true,
        fullName: true,
        email: true,
        mobileNumber: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    return res.json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
      },
    });
  } catch (err) {
    console.error('getInvestorIdentity:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch investor identity.' });
  }
}

/**
 * Update investor personal details
 * PATCH /api/investor/profile
 */
export async function updateInvestorProfile(req, res) {
  try {
    const investorId = req.auth.id;
    const {
      fullName,
      email,
      mobileNumber,
      address,
      city,
      state,
      zipCode,
      pincode,
    } = req.body ?? {};

    const userUpdateData = {};
    const profileUpdateData = {};

    const nextFullName = toNullableTrimmedString(fullName);
    if (nextFullName) userUpdateData.fullName = nextFullName;

    const nextEmail = toNullableTrimmedString(email);
    if (nextEmail) {
      if (!EMAIL_REGEX.test(nextEmail)) {
        return res.status(400).json({ success: false, message: 'Invalid email format.' });
      }
      userUpdateData.email = nextEmail;
    }

    const nextMobile = toNullableTrimmedString(mobileNumber);
    if (nextMobile) userUpdateData.mobileNumber = nextMobile;

    profileUpdateData.address = toNullableTrimmedString(address) ?? null;
    profileUpdateData.city = toNullableTrimmedString(city) ?? null;
    profileUpdateData.state = toNullableTrimmedString(state) ?? null;
    profileUpdateData.zipCode = toNullableTrimmedString(zipCode ?? pincode) ?? null;

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: investorId },
          data: userUpdateData,
        });
      }

      await tx.investorProfile.upsert({
        where: { userId: investorId },
        create: {
          userId: investorId,
          ...profileUpdateData,
        },
        update: profileUpdateData,
      });
    });

    res.json({ success: true, message: 'Personal details updated successfully.' });
  } catch (err) {
    console.error('updateInvestorProfile:', err);
    if (err?.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email or mobile number already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to update personal details.' });
  }
}

/**
 * Update investor bank details
 * PATCH /api/investor/profile/bank
 */
export async function updateInvestorBankDetails(req, res) {
  try {
    const investorId = req.auth.id;
    const {
      bankName,
      accountHolderName,
      accountHolder,
      accountNumber,
      routingNumber,
      routing,
      ifscCode,
      swiftCode,
      swift,
    } = req.body ?? {};

    const updateData = {
      bankName: toNullableTrimmedString(bankName) ?? null,
      accountHolderName: toNullableTrimmedString(accountHolderName ?? accountHolder) ?? null,
      accountNumber: toNullableTrimmedString(accountNumber) ?? null,
      routingNumber: toNullableTrimmedString(routingNumber ?? routing ?? ifscCode) ?? null,
      swiftCode: toNullableTrimmedString(swiftCode ?? swift) ?? null,
    };

    await prisma.investorProfile.upsert({
      where: { userId: investorId },
      create: {
        userId: investorId,
        ...updateData,
      },
      update: updateData,
    });

    res.json({ success: true, message: 'Bank details updated successfully.' });
  } catch (err) {
    console.error('updateInvestorBankDetails:', err);
    res.status(500).json({ success: false, message: 'Failed to update bank details.' });
  }
}

/**
 * Change investor password
 * POST /api/investor/change-password
 */
export async function changeInvestorPassword(req, res) {
  try {
    const investorId = req.auth.id;
    const currentRaw = req.body?.currentPassword ?? req.body?.oldPassword;
    const newRaw = req.body?.newPassword;
    const confirmRaw = req.body?.confirmPassword ?? req.body?.confirmNewPassword;
    const currentPassword = typeof currentRaw === 'string' ? currentRaw.trim() : '';
    const newPassword = typeof newRaw === 'string' ? newRaw.trim() : '';
    const confirmPassword = typeof confirmRaw === 'string' ? confirmRaw.trim() : '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirm password do not match.' });
    }

    const investor = await prisma.user.findUnique({
      where: { id: investorId },
      select: { id: true, password: true },
    });

    if (!investor) {
      return res.status(404).json({ success: false, message: 'Investor not found.' });
    }

    const validCurrentPassword =
      (await bcrypt.compare(currentPassword, investor.password)) ||
      investor.password === currentPassword;
    if (!validCurrentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: investorId },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changeInvestorPassword:', err);
    res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
}
