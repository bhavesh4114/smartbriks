-- AlterTable
ALTER TABLE "builders" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'BUILDER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'INVESTOR';
