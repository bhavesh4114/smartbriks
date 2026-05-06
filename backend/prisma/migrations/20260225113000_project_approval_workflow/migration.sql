-- Extend project status workflow
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- Project approval fields
ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
