-- Phase 5d (Operating Model Engine): the Employee/Org directory.
-- A directory is an ordinary Table canvas (canvas_type = 'table') that the user
-- has designated as a roster of people or roles. `directory_kind` marks it:
--   'person' → a people directory (rows are employees)
--   'role'   → a roles directory (rows are positions)
--   NULL     → a normal canvas (the default for everything that exists today)
--
-- This lets @person / @role mentions resolve to a real roster row and record a
-- typed (person/role) cross-reference targeting (to_canvas = directory,
-- to_node = the row's node id) via the existing `reference` spine — no new table.
--
-- Written idempotently so it is safe to apply via `prisma db execute` and
-- harmless if re-run (NOT `migrate dev`, which could offer a destructive reset
-- on a DB with data — the runtime uses the Supabase client, not Prisma).

ALTER TABLE "canvas" ADD COLUMN IF NOT EXISTS "directory_kind" TEXT;
