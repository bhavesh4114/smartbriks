import prisma from '../utils/prisma.js';

/**
 * GET /api/admin/documents
 * List KYC documents (Admin)
 */
export async function listDocuments(req, res) {
  try {
    const docs = await prisma.kYC.findMany({
      include: {
        builder: { select: { id: true, companyName: true } },
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: docs.map((doc) => ({
        id: doc.id,
        name: doc.documentType || 'Document',
        owner: doc.builder?.companyName || doc.user?.fullName || 'Unknown',
        ownerId: doc.builder?.id ?? doc.user?.id ?? null,
        ownerType: doc.builderId ? 'BUILDER' : doc.userId ? 'INVESTOR' : 'UNKNOWN',
        type: doc.documentType || 'KYC',
        status: doc.status,
        date: doc.createdAt,
        documentImage: doc.documentImage,
        documentNumber: doc.documentNumber,
      })),
    });
  } catch (err) {
    console.error('listDocuments (admin):', err);
    res.status(500).json({ success: false, message: 'Failed to fetch documents.' });
  }
}
