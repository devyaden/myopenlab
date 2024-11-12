/*
  Warnings:

  - Added the required column `flow_data` to the `canvases` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "canvases" ADD COLUMN     "description" TEXT,
ADD COLUMN     "flow_data" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "folders" ADD COLUMN     "description" TEXT;
