-- AlterTable
ALTER TABLE "column_definition" ADD COLUMN     "related_canvas_id" UUID,
ADD COLUMN     "relation_row_ids" TEXT[],
ADD COLUMN     "rollup_column_id" UUID;

-- AddForeignKey
ALTER TABLE "column_definition" ADD CONSTRAINT "column_definition_related_canvas_id_fkey" FOREIGN KEY ("related_canvas_id") REFERENCES "canvas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "column_definition" ADD CONSTRAINT "column_definition_rollup_column_id_fkey" FOREIGN KEY ("rollup_column_id") REFERENCES "column_definition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
