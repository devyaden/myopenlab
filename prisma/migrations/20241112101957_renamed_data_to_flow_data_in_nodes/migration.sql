/*
  Warnings:

  - You are about to drop the column `data` on the `nodes` table. All the data in the column will be lost.
  - Added the required column `flow_data` to the `nodes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `node_id` to the `nodes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "nodes" DROP COLUMN "data",
ADD COLUMN     "flow_data" JSONB NOT NULL,
ADD COLUMN     "node_id" TEXT NOT NULL;
