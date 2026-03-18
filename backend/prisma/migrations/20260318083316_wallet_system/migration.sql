-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "builders" ADD COLUMN     "account_holder_name" TEXT,
ADD COLUMN     "account_number" TEXT,
ADD COLUMN     "address_line_1" TEXT,
ADD COLUMN     "address_line_2" TEXT,
ADD COLUMN     "auth_person_email" TEXT,
ADD COLUMN     "auth_person_mobile" TEXT,
ADD COLUMN     "auth_person_name" TEXT,
ADD COLUMN     "auth_person_pan" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "cancelled_cheque_image" TEXT,
ADD COLUMN     "cin_llpin_image" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "company_pan" TEXT,
ADD COLUMN     "company_pan_image" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "designation" TEXT,
ADD COLUMN     "gst_certificate_image" TEXT,
ADD COLUMN     "gst_number" TEXT,
ADD COLUMN     "id_proof_image" TEXT,
ADD COLUMN     "ifsc_code" TEXT,
ADD COLUMN     "official_email" TEXT,
ADD COLUMN     "official_mobile" TEXT,
ADD COLUMN     "pincode" TEXT,
ADD COLUMN     "rera_certificate_image" TEXT,
ADD COLUMN     "rera_number" TEXT,
ADD COLUMN     "same_as_site_office" BOOLEAN,
ADD COLUMN     "selfie_with_id_image" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "year_of_establishment" TEXT;

-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "external_ref" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "date_of_birth" TEXT,
    "gender" TEXT,
    "pan_number" TEXT,
    "aadhaar_number" TEXT,
    "res_address_line_1" TEXT,
    "res_address_line_2" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "perm_address_line_1" TEXT,
    "perm_address_line_2" TEXT,
    "perm_city" TEXT,
    "perm_state" TEXT,
    "perm_pincode" TEXT,
    "bank_name" TEXT,
    "account_holder_name" TEXT,
    "account_number" TEXT,
    "routing_number" TEXT,
    "swift_code" TEXT,
    "account_type" TEXT,
    "upi_id" TEXT,
    "annual_income" TEXT,
    "occupation" TEXT,
    "source_of_funds" TEXT,
    "risk_appetite" TEXT,
    "pan_card_image" TEXT,
    "aadhaar_image" TEXT,
    "bank_proof_image" TEXT,
    "selfie_image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_external_ref_key" ON "wallet_transactions"("external_ref");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_status_idx" ON "wallet_transactions"("status");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_user_id_key" ON "investor_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
