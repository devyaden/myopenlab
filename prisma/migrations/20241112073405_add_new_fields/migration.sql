/*
  Warnings:

  - You are about to drop the column `description` on the `folders` table. All the data in the column will be lost.
  - You are about to drop the column `auth_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `canvas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `custom_columns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `node_connections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `node_custom_data` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "column_type" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'RELATION', 'ROLLUP');

-- CreateEnum
CREATE TYPE "rollup_type" AS ENUM ('COUNT', 'SUM', 'AVERAGE', 'MIN', 'MAX');

-- DropForeignKey
ALTER TABLE "canvas" DROP CONSTRAINT "canvas_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "canvas" DROP CONSTRAINT "canvas_user_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_columns" DROP CONSTRAINT "custom_columns_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "custom_columns" DROP CONSTRAINT "custom_columns_related_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "node_connections" DROP CONSTRAINT "node_connections_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "node_connections" DROP CONSTRAINT "node_connections_source_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "node_connections" DROP CONSTRAINT "node_connections_target_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "node_custom_data" DROP CONSTRAINT "node_custom_data_canvas_id_fkey";

-- DropForeignKey
ALTER TABLE "node_custom_data" DROP CONSTRAINT "node_custom_data_column_id_fkey";

-- DropIndex
DROP INDEX "users_auth_id_key";

-- AlterTable
ALTER TABLE "folders" DROP COLUMN "description",
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "auth_id",
ALTER COLUMN "updated_at" DROP DEFAULT;

-- DropTable
DROP TABLE "canvas";

-- DropTable
DROP TABLE "custom_columns";

-- DropTable
DROP TABLE "node_connections";

-- DropTable
DROP TABLE "node_custom_data";

-- CreateTable
CREATE TABLE "canvases" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "column_order" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nodes" (
    "id" SERIAL NOT NULL,
    "canvas_id" INTEGER NOT NULL,
    "position" JSONB NOT NULL,
    "data" JSONB NOT NULL,
    "custom_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "columns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "canvas_id" INTEGER NOT NULL,
    "data_type" "column_type" NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollups" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "canvas_id" INTEGER NOT NULL,
    "relation_id" INTEGER NOT NULL,
    "target_column_id" INTEGER NOT NULL,
    "aggregation" "rollup_type" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rollups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Relation',
    "source_canvas_id" INTEGER NOT NULL,
    "target_canvas_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "canvases_folder_id_idx" ON "canvases"("folder_id");

-- CreateIndex
CREATE INDEX "nodes_canvas_id_idx" ON "nodes"("canvas_id");

-- CreateIndex
CREATE INDEX "columns_canvas_id_idx" ON "columns"("canvas_id");

-- CreateIndex
CREATE INDEX "rollups_canvas_id_idx" ON "rollups"("canvas_id");

-- CreateIndex
CREATE INDEX "rollups_relation_id_idx" ON "rollups"("relation_id");

-- CreateIndex
CREATE INDEX "relations_source_canvas_id_idx" ON "relations"("source_canvas_id");

-- CreateIndex
CREATE INDEX "relations_target_canvas_id_idx" ON "relations"("target_canvas_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "canvases" ADD CONSTRAINT "canvases_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "columns" ADD CONSTRAINT "columns_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollups" ADD CONSTRAINT "rollups_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollups" ADD CONSTRAINT "rollups_relation_id_fkey" FOREIGN KEY ("relation_id") REFERENCES "relations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_source_canvas_id_fkey" FOREIGN KEY ("source_canvas_id") REFERENCES "canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relations" ADD CONSTRAINT "relations_target_canvas_id_fkey" FOREIGN KEY ("target_canvas_id") REFERENCES "canvases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
