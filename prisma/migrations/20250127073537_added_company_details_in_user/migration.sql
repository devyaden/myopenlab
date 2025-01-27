/*
  Warnings:

  - Added the required column `username` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company_email" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "company_sector" TEXT,
ADD COLUMN     "company_size" TEXT,
ADD COLUMN     "user_position" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;
