/*
  Warnings:

  - Added the required column `target_column` to the `rollups` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "rollups" ADD COLUMN     "target_column" TEXT NOT NULL,
ALTER COLUMN "target_column_id" DROP NOT NULL;
