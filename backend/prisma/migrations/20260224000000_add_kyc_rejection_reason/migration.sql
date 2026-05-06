-- Add rejection reason for KYC records (used by admin reject flow and builder status page)
ALTER TABLE "kyc"
ADD COLUMN "rejection_reason" TEXT;
