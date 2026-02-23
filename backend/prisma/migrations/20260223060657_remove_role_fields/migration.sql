/*
  Warnings:

  - You are about to drop the column `role` on the `builders` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "builders" DROP COLUMN "role";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role";
