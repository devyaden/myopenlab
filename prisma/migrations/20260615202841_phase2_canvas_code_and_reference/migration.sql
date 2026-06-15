-- Phase 2 (Operating Model Engine): stable ids & the cross-reference spine.
-- Written idempotently (IF NOT EXISTS) so it is safe to apply via
-- `prisma db execute` and harmless if re-run. The runtime uses the Supabase JS
-- client (not the Prisma client), so no client regeneration is required.

-- 2b: human-readable code on a canvas, unique per user (the "workspace").
-- Nullable; Postgres treats NULLs as distinct, so many code-less canvases per
-- user are allowed while non-null codes must be unique per user.
ALTER TABLE "canvas" ADD COLUMN IF NOT EXISTS "code" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "canvas_user_id_code_key"
  ON "canvas" ("user_id", "code");

-- 2c: lightweight typed references between artifacts. `from`/`to` can point at a
-- canvas (and optionally a node within it) or be resolved by a human code.
CREATE TABLE IF NOT EXISTS "reference" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL,
  "from_canvas" UUID NOT NULL,
  "from_node"   TEXT,
  "to_canvas"   UUID,
  "to_node"     TEXT,
  "to_code"     TEXT,
  "type"        TEXT NOT NULL,
  "created_at"  TIMESTAMP(3) NOT NULL DEFAULT now(),
  CONSTRAINT "reference_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reference_from_canvas_fkey" FOREIGN KEY ("from_canvas")
    REFERENCES "canvas" ("id") ON DELETE CASCADE,
  CONSTRAINT "reference_to_canvas_fkey" FOREIGN KEY ("to_canvas")
    REFERENCES "canvas" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "reference_user_id_idx" ON "reference" ("user_id");
CREATE INDEX IF NOT EXISTS "reference_from_canvas_idx" ON "reference" ("from_canvas");
CREATE INDEX IF NOT EXISTS "reference_to_canvas_idx" ON "reference" ("to_canvas");
CREATE INDEX IF NOT EXISTS "reference_to_code_idx" ON "reference" ("to_code");
