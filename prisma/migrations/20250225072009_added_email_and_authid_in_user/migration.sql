/*
  Warnings:

  - You are about to drop the `Canvas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CanvasData` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CanvasHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CanvasSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CanvasShare` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ColumnDefinition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Canvas" DROP CONSTRAINT "Canvas_folderId_fkey";

-- DropForeignKey
ALTER TABLE "Canvas" DROP CONSTRAINT "Canvas_userId_fkey";

-- DropForeignKey
ALTER TABLE "CanvasData" DROP CONSTRAINT "CanvasData_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "CanvasHistory" DROP CONSTRAINT "CanvasHistory_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "CanvasSettings" DROP CONSTRAINT "CanvasSettings_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "CanvasShare" DROP CONSTRAINT "CanvasShare_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "CanvasShare" DROP CONSTRAINT "CanvasShare_userId_fkey";

-- DropForeignKey
ALTER TABLE "ColumnDefinition" DROP CONSTRAINT "ColumnDefinition_canvasId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- DropTable
DROP TABLE "Canvas";

-- DropTable
DROP TABLE "CanvasData";

-- DropTable
DROP TABLE "CanvasHistory";

-- DropTable
DROP TABLE "CanvasSettings";

-- DropTable
DROP TABLE "CanvasShare";

-- DropTable
DROP TABLE "ColumnDefinition";

-- DropTable
DROP TABLE "Folder";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "auth_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "auth_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "parentId" INTEGER,

    CONSTRAINT "folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "folderId" INTEGER,

    CONSTRAINT "canvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_data" (
    "id" SERIAL NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "styles" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_history" (
    "id" SERIAL NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "canvas_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "column_definition" (
    "id" SERIAL NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "column_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_settings" (
    "id" SERIAL NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "showGrid" BOOLEAN NOT NULL DEFAULT true,
    "showRulers" BOOLEAN NOT NULL DEFAULT false,
    "snapToGrid" BOOLEAN NOT NULL DEFAULT true,
    "gridSize" INTEGER NOT NULL DEFAULT 15,
    "theme" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_share" (
    "id" SERIAL NOT NULL,
    "canvasId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canvas_share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_id_key" ON "user"("auth_id");

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
