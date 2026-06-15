-- Phase 3 (Operating Model Engine): reliable embed refresh.
-- Add `canvas_data` to the Supabase realtime publication so a document's live
-- flow/table embeds can refresh when their source canvas changes in another tab
-- or client. Written idempotently (guarded) so it is safe to apply via
-- `prisma db execute` and harmless if re-run.
--
-- NOTE: the in-app event bus + focus refresh in the editor are the same-tab
-- guarantee; this realtime channel is the cross-tab/cross-client enhancement
-- and is a no-op for the app if the project's realtime is disabled.

DO $$
BEGIN
  -- The publication exists on Supabase projects; guard in case it doesn't.
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'canvas_data'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_data;
    END IF;
  END IF;
END $$;

-- Realtime change payloads need the full row to deliver the changed columns.
ALTER TABLE public.canvas_data REPLICA IDENTITY FULL;
