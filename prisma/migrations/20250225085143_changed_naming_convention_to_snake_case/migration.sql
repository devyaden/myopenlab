/*
  Warnings:

  - You are about to drop the column `createdAt` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the column `folderId` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the column `canvasId` on the `canvas_data` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `canvas_data` table. All the data in the column will be lost.
  - You are about to drop the column `canvasId` on the `canvas_history` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `canvas_history` table. All the data in the column will be lost.
  - You are about to drop the column `canvasId` on the `canvas_settings` table. All the data in the column will be lost.
  - You are about to drop the column `gridSize` on the `canvas_settings` table. All the data in the column will be lost.
  - You are about to drop the column `showGrid` on the `canvas_settings` table. All the data in the column will be lost.
  - You are about to drop the column `showRulers` on the `canvas_settings` table. All the data in the column will be lost.
  - You are about to drop the column `snapToGrid` on the `canvas_settings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `canvas_settings` table. All the data in the column will be lost.
  - You are about to drop the column `canvasId` on the `canvas_share` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `canvas_share` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `canvas_share` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `canvas_share` table. All the data in the column will be lost.
  - You are about to drop the column `canvasId` on the `column_definition` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `column_definition` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `column_definition` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `folder` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `folder` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `folder` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `folder` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[canvas_id]` on the table `canvas_data` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[canvas_id]` on the table `canvas_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[canvas_id,user_id]` on the table `canvas_share` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `canvas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canvas_id` to the `canvas_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canvas_id` to the `canvas_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canvas_id` to the `canvas_settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canvas_id` to the `canvas_share` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `canvas_share` table without a default value. This is not possible if the table is not empty.
  - Added the required column `canvas_id` to the `column_definition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `folder` table without a default value. This is not possible if the table is not empty.

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
DROP INDEX "canvas_data_canvasId_key";

-- DropIndex
DROP INDEX "canvas_settings_canvasId_key";

-- DropIndex
DROP INDEX "canvas_share_canvasId_userId_key";

-- AlterTable
ALTER TABLE "canvas" DROP COLUMN "createdAt",
DROP COLUMN "folderId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "folder_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "canvas_data" DROP COLUMN "canvasId",
DROP COLUMN "updatedAt",
ADD COLUMN     "canvas_id" UUID NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "canvas_history" DROP COLUMN "canvasId",
DROP COLUMN "createdAt",
ADD COLUMN     "canvas_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "canvas_settings" DROP COLUMN "canvasId",
DROP COLUMN "gridSize",
DROP COLUMN "showGrid",
DROP COLUMN "showRulers",
DROP COLUMN "snapToGrid",
DROP COLUMN "updatedAt",
ADD COLUMN     "canvas_id" UUID NOT NULL,
ADD COLUMN     "grid_size" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "show_grid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "show_rulers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "snap_to_grid" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "canvas_share" DROP COLUMN "canvasId",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "canvas_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "column_definition" DROP COLUMN "canvasId",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "canvas_id" UUID NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "folder" DROP COLUMN "createdAt",
DROP COLUMN "parentId",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "parent_id" UUID,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "canvas_data_canvas_id_key" ON "canvas_data"("canvas_id");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_settings_canvas_id_key" ON "canvas_settings"("canvas_id");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_share_canvas_id_user_id_key" ON "canvas_share"("canvas_id", "user_id");

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder" ADD CONSTRAINT "folder_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_data" ADD CONSTRAINT "canvas_data_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_history" ADD CONSTRAINT "canvas_history_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "column_definition" ADD CONSTRAINT "column_definition_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_settings" ADD CONSTRAINT "canvas_settings_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_share" ADD CONSTRAINT "canvas_share_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_share" ADD CONSTRAINT "canvas_share_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
