import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { signToken } from '../utils/jwt.js';

const SALT_ROUNDS = 12;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register Builder
 * POST /api/auth/builder/register
 */
export async function registerBuilder(req, res) {
  try {
    const { companyName, contactPerson, email, mobileNumber, password } = req.body;

    if (!companyName || !contactPerson || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'companyName, contactPerson, email, mobileNumber and password are required.',
      });
    }

    const existing = await prisma.builder.findFirst({
      where: { OR: [{ email }, { mobileNumber }] },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A builder with this email or mobile number already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const builder = await prisma.builder.create({
      data: {
        companyName,
        contactPerson,
        email,
        mobileNumber,
        password: hashedPassword,
        role: 'BUILDER',
      },
    });

    const token = signToken({
      id: builder.id,
      email: builder.email,
      role: 'BUILDER',
      type: 'builder',
    });

    res.status(201).json({
      success: true,
      message: 'Builder registered successfully.',
      data: {
        id: builder.id,
        companyName: builder.companyName,
        contactPerson: builder.contactPerson,
        email: builder.email,
        mobileNumber: builder.mobileNumber,
        role: builder.role,
        kycStatus: builder.kycStatus,
        isApproved: builder.isApproved,
      },
      token,
    });
  } catch (err) {
    console.error('registerBuilder:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
}

/**
 * Register Investor
 * POST /api/auth/investor/register
 */
export async function registerInvestor(req, res) {
  try {
    const { fullName, email, mobileNumber, password } = req.body;

    if (!fullName || !email || !mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email, mobileNumber and password are required.',
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    const existingInvestor = await prisma.user.findFirst({
      where: { OR: [{ email }, { mobileNumber }] },
    });
    if (existingInvestor) {
      return res.status(400).json({
        success: false,
        message: 'An investor with this email or mobile number already exists.',
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const investor = await prisma.user.create({
      data: {
        fullName,
        email,
        mobileNumber,
        password: hashedPassword,
        kycStatus: 'PENDING',
      },
    });

    const token = signToken({
      id: investor.id,
      email: investor.email,
      role: 'INVESTOR',
      type: 'investor',
    });

    res.status(201).json({
      success: true,
      message: 'Investor registered successfully',
      token,
      data: {
        id: investor.id,
        fullName: investor.fullName,
        email: investor.email,
        role: investor.role,
      },
    });
  } catch (err) {
    console.error('registerInvestor:', err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
}

/**
 * Unified Login (Investor, Builder, Admin)
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, token, data: { id, email, role, ... } }
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // 1. Try User table (INVESTOR or ADMIN)
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is inactive.' });
      }
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      const userPayload = {
        id: user.id,
        role: user.role,
        ...(user.role === 'INVESTOR' && { fullName: user.fullName }),
      };
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userPayload,
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
          kycStatus: user.kycStatus,
        },
      });
    }

    // 2. Try Builder table
    const builder = await prisma.builder.findUnique({ where: { email } });
    if (builder) {
      const valid = await bcrypt.compare(password, builder.password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
      const token = signToken({ id: builder.id, email: builder.email, role: 'BUILDER' });
      return res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: builder.id,
          role: 'BUILDER',
          companyName: builder.companyName,
        },
        data: {
          id: builder.id,
          companyName: builder.companyName,
          contactPerson: builder.contactPerson,
          email: builder.email,
          mobileNumber: builder.mobileNumber,
          role: 'BUILDER',
          kycStatus: builder.kycStatus,
          isApproved: builder.isApproved,
        },
      });
    }

    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
}

/**
 * Login Builder
 * POST /api/auth/builder/login
 */
export async function loginBuilder(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const builder = await prisma.builder.findUnique({ where: { email } });
    if (!builder) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, builder.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = signToken({
      id: builder.id,
      email: builder.email,
      role: 'BUILDER',
      type: 'builder',
    });

    res.json({
      success: true,
      data: {
        id: builder.id,
        companyName: builder.companyName,
        contactPerson: builder.contactPerson,
        email: builder.email,
        mobileNumber: builder.mobileNumber,
        role: builder.role,
        kycStatus: builder.kycStatus,
        isApproved: builder.isApproved,
      },
      token,
    });
  } catch (err) {
    console.error('loginBuilder:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
}

/**
 * Login Investor
 * POST /api/auth/investor/login
 * Body: { identifier: "email OR mobileNumber", password }
 */
export async function loginInvestor(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'identifier and password are required.',
      });
    }

    const investor = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { mobileNumber: identifier },
        ],
      },
    });

    if (!investor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile or password',
      });
    }

    const passwordMatches = await bcrypt.compare(password, investor.password);
    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/mobile or password',
      });
    }

    if (!investor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive.',
      });
    }

    const token = signToken({
      id: investor.id,
      email: investor.email,
      role: 'INVESTOR',
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: investor.id,
        fullName: investor.fullName,
        email: investor.email,
      },
    });
  } catch (err) {
    console.error('loginInvestor:', err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
}
