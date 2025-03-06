/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "company_email" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "company_sector" TEXT,
ADD COLUMN     "company_size" TEXT,
ADD COLUMN     "user_position" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
