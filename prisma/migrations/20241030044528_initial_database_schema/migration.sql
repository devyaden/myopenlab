-- CreateEnum
CREATE TYPE "collaborator_role" AS ENUM ('VIEWER', 'EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "link_type" AS ENUM ('REFERENCE', 'EMBED', 'DEPENDENCY', 'HIERARCHY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "reference_type" AS ENUM ('EMBED', 'LINK', 'SYNC', 'MIRROR');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "auth_id" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_edited" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flow_data" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "workspace_id" INTEGER,
    "parent_id" INTEGER,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "canvas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_link" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "link_type" "link_type" NOT NULL DEFAULT 'REFERENCE',
    "metadata" JSONB,
    "source_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "source_node_id" INTEGER NOT NULL,
    "target_node_id" INTEGER NOT NULL,

    CONSTRAINT "canvas_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_reference" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "host_node_id" INTEGER NOT NULL,
    "ref_node_id" INTEGER NOT NULL,
    "ref_type" "reference_type" NOT NULL DEFAULT 'EMBED',
    "metadata" JSONB,
    "host_canvas_id" INTEGER NOT NULL,
    "ref_canvas_id" INTEGER NOT NULL,

    CONSTRAINT "node_reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_snapshot" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "flow_data" JSONB NOT NULL,
    "version" INTEGER NOT NULL,
    "canvas_id" INTEGER NOT NULL,

    CONSTRAINT "canvas_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "canvas_collaborator" (
    "id" SERIAL NOT NULL,
    "role" "collaborator_role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "canvas_id" INTEGER NOT NULL,

    CONSTRAINT "canvas_collaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE INDEX "canvas_user_id_idx" ON "canvas"("user_id");

-- CreateIndex
CREATE INDEX "canvas_workspace_id_idx" ON "canvas"("workspace_id");

-- CreateIndex
CREATE INDEX "canvas_parent_id_idx" ON "canvas"("parent_id");

-- CreateIndex
CREATE INDEX "canvas_created_at_idx" ON "canvas"("created_at");

-- CreateIndex
CREATE INDEX "canvas_link_source_id_idx" ON "canvas_link"("source_id");

-- CreateIndex
CREATE INDEX "canvas_link_target_id_idx" ON "canvas_link"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_link_source_id_target_id_source_node_id_target_node__key" ON "canvas_link"("source_id", "target_id", "source_node_id", "target_node_id");

-- CreateIndex
CREATE INDEX "node_reference_host_canvas_id_idx" ON "node_reference"("host_canvas_id");

-- CreateIndex
CREATE INDEX "node_reference_ref_canvas_id_idx" ON "node_reference"("ref_canvas_id");

-- CreateIndex
CREATE UNIQUE INDEX "node_reference_host_canvas_id_host_node_id_ref_canvas_id_re_key" ON "node_reference"("host_canvas_id", "host_node_id", "ref_canvas_id", "ref_node_id");

-- CreateIndex
CREATE INDEX "canvas_snapshot_canvas_id_idx" ON "canvas_snapshot"("canvas_id");

-- CreateIndex
CREATE INDEX "canvas_snapshot_created_at_idx" ON "canvas_snapshot"("created_at");

-- CreateIndex
CREATE INDEX "canvas_collaborator_canvas_id_idx" ON "canvas_collaborator"("canvas_id");

-- CreateIndex
CREATE INDEX "canvas_collaborator_user_id_idx" ON "canvas_collaborator"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "canvas_collaborator_user_id_canvas_id_key" ON "canvas_collaborator"("user_id", "canvas_id");

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "canvas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas" ADD CONSTRAINT "canvas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_link" ADD CONSTRAINT "canvas_link_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_link" ADD CONSTRAINT "canvas_link_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_reference" ADD CONSTRAINT "node_reference_host_canvas_id_fkey" FOREIGN KEY ("host_canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_reference" ADD CONSTRAINT "node_reference_ref_canvas_id_fkey" FOREIGN KEY ("ref_canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_snapshot" ADD CONSTRAINT "canvas_snapshot_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_collaborator" ADD CONSTRAINT "canvas_collaborator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "canvas_collaborator" ADD CONSTRAINT "canvas_collaborator_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
