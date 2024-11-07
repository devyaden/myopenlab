-- AlterTable
ALTER TABLE "custom_columns" ADD COLUMN     "related_canvas_id" INTEGER,
ADD COLUMN     "related_column_id" INTEGER;

-- AddForeignKey
ALTER TABLE "custom_columns" ADD CONSTRAINT "custom_columns_related_canvas_id_fkey" FOREIGN KEY ("related_canvas_id") REFERENCES "canvas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
