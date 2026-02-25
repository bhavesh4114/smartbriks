-- Add new project workflow status
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';

-- Extend projects table for builder submission fields
ALTER TABLE "projects"
ADD COLUMN IF NOT EXISTS "project_duration_months" INTEGER,
ADD COLUMN IF NOT EXISTS "key_features" TEXT;

-- Store multiple project images
CREATE TABLE IF NOT EXISTS "project_images" (
  "id" SERIAL NOT NULL,
  "project_id" INTEGER NOT NULL,
  "image_url" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "project_images_project_id_idx" ON "project_images"("project_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_images_project_id_fkey'
  ) THEN
    ALTER TABLE "project_images"
    ADD CONSTRAINT "project_images_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
