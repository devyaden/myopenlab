/*
  Warnings:

  - The primary key for the `canvas_data` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `canvas_data` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "canvas_data" DROP CONSTRAINT "canvas_data_pkey",
DROP COLUMN "id";

-- AlterTable
ALTER TABLE "folder" DROP COLUMN "email";
