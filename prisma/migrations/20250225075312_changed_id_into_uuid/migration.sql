/*
  Warnings:

  - The primary key for the `canvas` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `folderId` column on the `canvas` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `canvas_data` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `canvas_history` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `canvas_settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `canvas_share` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `column_definition` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `folder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `parentId` column on the `folder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `auth_id` on the `user` table. All the data in the column will be lost.
  - Changed the type of `id` on the `canvas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `canvas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `canvas_data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `canvasId` on the `canvas_data` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `canvas_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `canvasId` on the `canvas_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `canvas_settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `canvasId` on the `canvas_settings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `canvas_share` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `canvasId` on the `canvas_share` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `canvas_share` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `column_definition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `canvasId` on the `column_definition` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `folder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `folder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "canvas" DROP CONSTRAINT "canvas_folderId_fkey";

-- DropForeignKey
ALTER TABLE "canvas" DROP CONSTRAINT "canvas_userId_fkey";

-- DropForeignKey
ALTER TABLE "canvas_data" DROP CONSTRAINT "canvas_data_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "canvas_history" DROP CONSTRAINT "canvas_history_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "canvas_settings" DROP CONSTRAINT "canvas_settings_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "canvas_share" DROP CONSTRAINT "canvas_share_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "canvas_share" DROP CONSTRAINT "canvas_share_userId_fkey";

-- DropForeignKey
ALTER TABLE "column_definition" DROP CONSTRAINT "column_definition_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "folder" DROP CONSTRAINT "folder_parentId_fkey";

-- DropForeignKey
ALTER TABLE "folder" DROP CONSTRAINT "folder_userId_fkey";

-- DropIndex
DROP INDEX "user_auth_id_key";

-- AlterTable
ALTER TABLE "canvas" DROP CONSTRAINT "canvas_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "folderId",
ADD COLUMN     "folderId" UUID,
ADD CONSTRAINT "canvas_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "canvas_data" DROP CONSTRAINT "canvas_data_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "canvasId",
ADD COLUMN     "canvasId" UUID NOT NULL,
ADD CONSTRAINT "canvas_data_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "canvas_history" DROP CONSTRAINT "canvas_history_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "canvasId",
ADD COLUMN     "canvasId" UUID NOT NULL,
ADD CONSTRAINT "canvas_history_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "canvas_settings" DROP CONSTRAINT "canvas_settings_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "canvasId",
ADD COLUMN     "canvasId" UUID NOT NULL,
ADD CONSTRAINT "canvas_settings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "canvas_share" DROP CONSTRAINT "canvas_share_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "canvasId",
ADD COLUMN     "canvasId" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "canvas_share_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "column_definition" DROP CONSTRAINT "column_definition_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "canvasId",
ADD COLUMN     "canvasId" UUID NOT NULL,
ADD CONSTRAINT "column_definition_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "folder" DROP CONSTRAINT "folder_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "parentId",
ADD COLUMN     "parentId" UUID,
ADD CONSTRAINT "folder_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
DROP COLUMN "auth_id",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_data_canvasId_key" ON "canvas_data"("canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_settings_canvasId_key" ON "canvas_settings"("canvasId");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_share_canvasId_userId_key" ON "canvas_share"("canvasId", "userId");

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_data" ADD CONSTRAINT "canvas_data_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_history" ADD CONSTRAINT "canvas_history_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "column_definition" ADD CONSTRAINT "column_definition_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_settings" ADD CONSTRAINT "canvas_settings_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_share" ADD CONSTRAINT "canvas_share_canvasId_fkey" FOREIGN KEY ("canvasId") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_share" ADD CONSTRAINT "canvas_share_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
