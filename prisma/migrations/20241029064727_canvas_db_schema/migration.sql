-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "LinkType" AS ENUM ('REFERENCE', 'EMBED', 'DEPENDENCY', 'HIERARCHY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReferenceType" AS ENUM ('EMBED', 'LINK', 'SYNC', 'MIRROR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "auth_id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canvas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_edited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flow_data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "workspace_id" TEXT,
    "parent_id" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Canvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasLink" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "link_type" "LinkType" NOT NULL DEFAULT 'REFERENCE',
    "metadata" JSONB,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,

    CONSTRAINT "CanvasLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeReference" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "host_node_id" TEXT NOT NULL,
    "ref_node_id" TEXT NOT NULL,
    "ref_type" "ReferenceType" NOT NULL DEFAULT 'EMBED',
    "metadata" JSONB,
    "host_canvas_id" TEXT NOT NULL,
    "ref_canvas_id" TEXT NOT NULL,

    CONSTRAINT "NodeReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasSnapshot" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flow_data" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "canvas_id" TEXT NOT NULL,

    CONSTRAINT "CanvasSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanvasCollaborator" (
    "id" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "canvas_id" TEXT NOT NULL,

    CONSTRAINT "CanvasCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_auth_id_key" ON "User"("auth_id");

-- CreateIndex
CREATE INDEX "Canvas_user_id_idx" ON "Canvas"("user_id");

-- CreateIndex
CREATE INDEX "Canvas_workspace_id_idx" ON "Canvas"("workspace_id");

-- CreateIndex
CREATE INDEX "Canvas_parent_id_idx" ON "Canvas"("parent_id");

-- CreateIndex
CREATE INDEX "Canvas_created_at_idx" ON "Canvas"("created_at");

-- CreateIndex
CREATE INDEX "CanvasLink_source_id_idx" ON "CanvasLink"("source_id");

-- CreateIndex
CREATE INDEX "CanvasLink_target_id_idx" ON "CanvasLink"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "CanvasLink_source_id_target_id_source_node_id_target_node_i_key" ON "CanvasLink"("source_id", "target_id", "source_node_id", "target_node_id");

-- CreateIndex
CREATE INDEX "NodeReference_host_canvas_id_idx" ON "NodeReference"("host_canvas_id");

-- CreateIndex
CREATE INDEX "NodeReference_ref_canvas_id_idx" ON "NodeReference"("ref_canvas_id");

-- CreateIndex
CREATE UNIQUE INDEX "NodeReference_host_canvas_id_host_node_id_ref_canvas_id_ref_key" ON "NodeReference"("host_canvas_id", "host_node_id", "ref_canvas_id", "ref_node_id");

-- CreateIndex
CREATE INDEX "CanvasSnapshot_canvas_id_idx" ON "CanvasSnapshot"("canvas_id");

-- CreateIndex
CREATE INDEX "CanvasSnapshot_created_at_idx" ON "CanvasSnapshot"("created_at");

-- CreateIndex
CREATE INDEX "CanvasCollaborator_canvas_id_idx" ON "CanvasCollaborator"("canvas_id");

-- CreateIndex
CREATE INDEX "CanvasCollaborator_user_id_idx" ON "CanvasCollaborator"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "CanvasCollaborator_user_id_canvas_id_key" ON "CanvasCollaborator"("user_id", "canvas_id");

-- AddForeignKey
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Canvas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Canvas" ADD CONSTRAINT "Canvas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasLink" ADD CONSTRAINT "CanvasLink_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasLink" ADD CONSTRAINT "CanvasLink_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeReference" ADD CONSTRAINT "NodeReference_host_canvas_id_fkey" FOREIGN KEY ("host_canvas_id") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeReference" ADD CONSTRAINT "NodeReference_ref_canvas_id_fkey" FOREIGN KEY ("ref_canvas_id") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasSnapshot" ADD CONSTRAINT "CanvasSnapshot_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasCollaborator" ADD CONSTRAINT "CanvasCollaborator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CanvasCollaborator" ADD CONSTRAINT "CanvasCollaborator_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "Canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
