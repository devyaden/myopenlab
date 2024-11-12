/*
  Warnings:

  - Added the required column `key` to the `columns` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "columns" ADD COLUMN     "key" TEXT NOT NULL;
