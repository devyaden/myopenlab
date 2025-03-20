-- CreateTable
CREATE TABLE "document_data" (
    "lexical_state" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "canvas_id" UUID NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "document_data_canvas_id_key" ON "document_data"("canvas_id");

-- AddForeignKey
ALTER TABLE "document_data" ADD CONSTRAINT "document_data_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
