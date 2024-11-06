-- CreateTable
CREATE TABLE "custom_columns" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "validation" JSONB,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canvas_id" INTEGER NOT NULL,

    CONSTRAINT "custom_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "node_custom_data" (
    "id" SERIAL NOT NULL,
    "node_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canvas_id" INTEGER NOT NULL,
    "column_id" INTEGER NOT NULL,

    CONSTRAINT "node_custom_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_columns_canvas_id_idx" ON "custom_columns"("canvas_id");

-- CreateIndex
CREATE INDEX "node_custom_data_canvas_id_idx" ON "node_custom_data"("canvas_id");

-- CreateIndex
CREATE INDEX "node_custom_data_column_id_idx" ON "node_custom_data"("column_id");

-- CreateIndex
CREATE UNIQUE INDEX "node_custom_data_node_id_column_id_key" ON "node_custom_data"("node_id", "column_id");

-- AddForeignKey
ALTER TABLE "custom_columns" ADD CONSTRAINT "custom_columns_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_custom_data" ADD CONSTRAINT "node_custom_data_canvas_id_fkey" FOREIGN KEY ("canvas_id") REFERENCES "canvas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "node_custom_data" ADD CONSTRAINT "node_custom_data_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "custom_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
