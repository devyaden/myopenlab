/*
  Warnings:

  - You are about to drop the column `parent_id` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the column `workspace_id` on the `canvas` table. All the data in the column will be lost.
  - You are about to drop the `canvas_collaborator` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `canvas_link` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `canvas_snapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `node_reference` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `folder_id` to the `canvas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "canvas" DROP CONSTRAINT "canvas_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "canvas_collaborator" DROP CONSTRAINT "canvas_collaborator_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "canvas_collaborator" DROP CONSTRAINT "canvas_collaborator_user_id_fkey";

-- DropForeignKey
ALTER TABLE "canvas_link" DROP CONSTRAINT "canvas_link_source_id_fkey";

-- DropForeignKey
ALTER TABLE "canvas_link" DROP CONSTRAINT "canvas_link_target_id_fkey";

-- DropForeignKey
ALTER TABLE "canvas_snapshot" DROP CONSTRAINT "canvas_snapshot_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "node_reference" DROP CONSTRAINT "node_reference_host_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "node_reference" DROP CONSTRAINT "node_reference_ref_canvas_id_fkey";

-- DropIndex
DROP INDEX "canvas_created_at_idx";

-- DropIndex
DROP INDEX "canvas_parent_id_idx";

-- DropIndex
DROP INDEX "canvas_workspace_id_idx";

-- AlterTable
ALTER TABLE "canvas" DROP COLUMN "parent_id",
DROP COLUMN "version",
DROP COLUMN "workspace_id",
ADD COLUMN     "folder_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "canvas_collaborator";

-- DropTable
DROP TABLE "canvas_link";

-- DropTable
DROP TABLE "canvas_snapshot";

-- DropTable
DROP TABLE "node_reference";

-- DropEnum
DROP TYPE "collaborator_role";

-- DropEnum
DROP TYPE "link_type";

-- DropEnum
DROP TYPE "reference_type";

-- CreateTable
CREATE TABLE "folders" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_connections" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "label" TEXT,
    "metadata" JSONB,
    "source_canvas_id" INTEGER NOT NULL,
    "target_canvas_id" INTEGER NOT NULL,
    "folder_id" INTEGER NOT NULL,

    CONSTRAINT "node_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "folders_user_id_idx" ON "folders"("user_id");

-- CreateIndex
CREATE INDEX "node_connections_source_canvas_id_idx" ON "node_connections"("source_canvas_id");

-- CreateIndex
CREATE INDEX "node_connections_target_canvas_id_idx" ON "node_connections"("target_canvas_id");

-- CreateIndex
CREATE INDEX "node_connections_folder_id_idx" ON "node_connections"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "node_connections_source_canvas_id_target_canvas_id_source_n_key" ON "node_connections"("source_canvas_id", "target_canvas_id", "source_node_id", "target_node_id");

-- CreateIndex
CREATE INDEX "canvas_folder_id_idx" ON "canvas"("folder_id");

-- AddForeignKey
ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_connections" ADD CONSTRAINT "node_connections_source_canvas_id_fkey" FOREIGN KEY ("source_canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_connections" ADD CONSTRAINT "node_connections_target_canvas_id_fkey" FOREIGN KEY ("target_canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_connections" ADD CONSTRAINT "node_connections_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
