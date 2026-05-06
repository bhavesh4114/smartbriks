CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "withdrawals" (
    "id" SERIAL NOT NULL,
    "investor_id" INTEGER NOT NULL,
    "project_id" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "withdrawals_investor_id_idx" ON "withdrawals"("investor_id");
CREATE INDEX "withdrawals_project_id_idx" ON "withdrawals"("project_id");
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
