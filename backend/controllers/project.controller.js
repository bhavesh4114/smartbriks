import prisma from '../utils/prisma.js';
import { Decimal } from '@prisma/client/runtime/library';

function parseNumberInput(value) {
  if (value == null || value === '') return null;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function normalizeFeatures(value) {
  if (!value) return '';
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
}

/**
 * Create project from builder form
 * POST /api/builder/projects
 * multipart/form-data
 */
export async function createBuilderProject(req, res) {
  try {
    const builderId = req.auth.id;
    const status = req.body.status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'DRAFT';
    const projectName = (req.body.project_name || '').trim();
    const location = (req.body.location || '').trim();
    const description = (req.body.project_description || '').trim();
    const totalProjectCost = parseNumberInput(req.body.total_project_cost);
    const expectedRoi = parseNumberInput(req.body.expected_roi);
    const projectDuration = parseNumberInput(req.body.project_duration);
    const minimumInvestment = parseNumberInput(req.body.minimum_investment);
    const keyFeatures = normalizeFeatures(req.body.key_features);

    const builder = await prisma.builder.findUnique({
      where: { id: builderId },
      select: { kycStatus: true, isApproved: true },
    });

    if (!builder) {
      return res.status(404).json({ success: false, message: 'Builder not found.' });
    }

    if (status === 'PENDING_APPROVAL' && !(builder.isApproved || builder.kycStatus === 'VERIFIED')) {
      return res.status(403).json({
        success: false,
        message: 'Only verified builders can submit projects for approval.',
      });
    }

    if (status === 'PENDING_APPROVAL') {
      if (!projectName || !location || totalProjectCost == null || expectedRoi == null || projectDuration == null || minimumInvestment == null) {
        return res.status(400).json({
          success: false,
          message: 'project_name, location, total_project_cost, expected_roi, project_duration and minimum_investment are required.',
        });
      }
    }

    const totalValue = new Decimal(totalProjectCost ?? 0);
    const minInvestment = new Decimal(minimumInvestment ?? 0);
    const roi = new Decimal(expectedRoi ?? 0);
    const totalShares = minInvestment.gt(0) ? Number(totalValue.div(minInvestment).toDecimalPlaces(0, 1)) : 1;
    const safeTotalShares = Number.isFinite(totalShares) && totalShares > 0 ? totalShares : 1;
    const pricePerShare = safeTotalShares > 0 ? totalValue.div(safeTotalShares) : totalValue;

    const files = Array.isArray(req.files) ? req.files : [];
    const imageRows = files
      .filter((f) => f?.filename)
      .map((f) => ({ imageUrl: `projects/${f.filename}` }));

    const project = await prisma.project.create({
      data: {
        builderId,
        title: projectName || 'Untitled Draft',
        description: description || 'Draft project',
        location: location || 'TBD',
        totalValue,
        totalShares: safeTotalShares,
        pricePerShare,
        minInvestment,
        expectedROI: roi,
        projectStatus: status,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectionReason: null,
        projectDurationMonths: projectDuration != null ? Math.max(0, Math.floor(projectDuration)) : null,
        keyFeatures: keyFeatures || null,
        images: imageRows.length ? { create: imageRows } : undefined,
      },
      include: { images: true },
    });

    return res.status(201).json({
      success: true,
      message: status === 'DRAFT' ? 'Project saved as draft.' : 'Project submitted for approval.',
      data: serializeProject(project),
    });
  } catch (err) {
    console.error('createBuilderProject:', err);
    return res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
}

/**
 * Create project (Builder only)
 * POST /api/projects
 */
export async function createProject(req, res) {
  try {
    const builderId = req.auth.id;
    const {
      title,
      description,
      location,
      totalValue,
      totalShares,
      pricePerShare,
      minInvestment,
      expectedROI,
      projectStatus = 'DRAFT',
      startDate,
      endDate,
    } = req.body;

    if (!title || !description || !location || totalValue == null || totalShares == null) {
      return res.status(400).json({
        success: false,
        message: 'title, description, location, totalValue and totalShares are required.',
      });
    }

    const price = pricePerShare != null ? new Decimal(pricePerShare) : new Decimal(totalValue).div(totalShares);
    const minInv = minInvestment != null ? new Decimal(minInvestment) : price;
    const roi = expectedROI != null ? new Decimal(expectedROI) : new Decimal(0);

    const normalizedStatus = projectStatus === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : projectStatus;
    const project = await prisma.project.create({
      data: {
        builderId,
        title,
        description,
        location,
        totalValue: new Decimal(totalValue),
        totalShares: Number(totalShares),
        pricePerShare: price,
        minInvestment: minInv,
        expectedROI: roi,
        projectStatus: normalizedStatus || 'DRAFT',
        approvedAt: normalizedStatus === 'APPROVED' ? new Date() : null,
        rejectionReason: null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Project created.',
      data: serializeProject(project),
    });
  } catch (err) {
    console.error('createProject:', err);
    res.status(500).json({ success: false, message: 'Failed to create project.' });
  }
}

/**
 * Update project (Builder, own only)
 * PATCH /api/projects/:id
 */
export async function updateProject(req, res) {
  try {
    const builderId = req.auth.id;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const existing = await prisma.project.findFirst({
      where: { id, builderId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    if (!['DRAFT', 'REJECTED'].includes(existing.projectStatus)) {
      return res.status(403).json({
        success: false,
        message: 'Project can only be edited while in DRAFT or REJECTED status.',
      });
    }

    const allowed = [
      'title', 'description', 'location', 'totalValue', 'totalShares',
      'pricePerShare', 'minInvestment', 'expectedROI', 'projectStatus',
      'startDate', 'endDate',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (['totalValue', 'pricePerShare', 'minInvestment', 'expectedROI'].includes(key)) {
          updates[key] = new Decimal(req.body[key]);
        } else if (['startDate', 'endDate'].includes(key)) {
          updates[key] = req.body[key] ? new Date(req.body[key]) : null;
        } else if (key === 'totalShares') {
          updates[key] = Number(req.body[key]);
        } else {
          updates[key] = req.body[key];
        }
      }
    }

    const project = await prisma.project.update({
      where: { id },
      data: updates,
    });

    res.json({
      success: true,
      message: 'Project updated.',
      data: serializeProject(project),
    });
  } catch (err) {
    console.error('updateProject:', err);
    res.status(500).json({ success: false, message: 'Failed to update project.' });
  }
}

/**
 * Delete project (Builder, own only)
 * DELETE /api/projects/:id
 */
export async function deleteProject(req, res) {
  try {
    const builderId = req.auth.id;
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const existing = await prisma.project.findFirst({
      where: { id, builderId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project deleted.' });
  } catch (err) {
    console.error('deleteProject:', err);
    res.status(500).json({ success: false, message: 'Failed to delete project.' });
  }
}

/**
 * List active projects (for investors to browse)
 * GET /api/projects?status=ACTIVE
 */
export async function listProjects(req, res) {
  try {
    const status = req.query.status || 'APPROVED';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.projectStatus = status;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          images: { select: { imageUrl: true } },
          builder: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
            },
          },
          _count: { select: { investments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects.map((p) => ({
        ...serializeProject(p),
        builder: p.builder,
        investmentCount: p._count?.investments ?? 0,
      })),
      pagination: { page, limit, total },
    });
  } catch (err) {
    console.error('listProjects:', err);
    res.status(500).json({ success: false, message: 'Failed to list projects.' });
  }
}

/**
 * Get single project by ID (for investors)
 * GET /api/projects/:id
 */
export async function getProjectById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        images: { select: { imageUrl: true } },
        builder: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            kycStatus: true,
          },
        },
        _count: { select: { investments: true } },
      },
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({
      success: true,
      data: {
        ...serializeProject(project),
        builder: project.builder,
        investmentCount: project._count?.investments ?? 0,
      },
    });
  } catch (err) {
    console.error('getProjectById:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch project.' });
  }
}

function serializeProject(p) {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    location: p.location,
    totalValue: p.totalValue?.toString?.() ?? p.totalValue,
    totalShares: p.totalShares,
    pricePerShare: p.pricePerShare?.toString?.() ?? p.pricePerShare,
    minInvestment: p.minInvestment?.toString?.() ?? p.minInvestment,
    expectedROI: p.expectedROI?.toString?.() ?? p.expectedROI,
    projectStatus: p.projectStatus,
    builderId: p.builderId,
    projectDurationMonths: p.projectDurationMonths ?? null,
    keyFeatures: p.keyFeatures ?? null,
    approvedAt: p.approvedAt ?? null,
    rejectionReason: p.rejectionReason ?? null,
    images: Array.isArray(p.images) ? p.images.map((img) => img.imageUrl) : [],
    startDate: p.startDate,
    endDate: p.endDate,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
