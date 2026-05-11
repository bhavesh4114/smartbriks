-- CreateTable
CREATE TABLE "project_timelines" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_timelines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_timelines_project_id_stage_key" ON "project_timelines"("project_id", "stage");

-- CreateIndex
CREATE INDEX "project_timelines_project_id_idx" ON "project_timelines"("project_id");

-- AddForeignKey
ALTER TABLE "project_timelines" ADD CONSTRAINT "project_timelines_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
