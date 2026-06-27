-- Exploration Mode: read-only governance Q&A persistence. Deliberately SEPARATE
-- from the agent_* tables so a future explorer-only role's data is isolated and
-- can be access-scoped independently. No proposals table — exploration is read-only.
--
-- Written idempotently so it is safe to apply via `prisma db execute` and harmless
-- if re-run (the runtime uses the Supabase client, not Prisma migrate).

CREATE TABLE IF NOT EXISTS "explore_conversation" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "title" TEXT,
  "compacted_through_ordinal" INTEGER,
  "summary" TEXT,
  "scope_label" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "explore_conversation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "explore_conversation_user_id_updated_at_idx"
  ON "explore_conversation" ("user_id", "updated_at");

CREATE TABLE IF NOT EXISTS "explore_message" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "role" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "cache_read_tokens" INTEGER,
  "billable_tokens" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "explore_message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "explore_message_conversation_id_created_at_idx"
  ON "explore_message" ("conversation_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'explore_message_conversation_id_fkey'
  ) THEN
    ALTER TABLE "explore_message"
      ADD CONSTRAINT "explore_message_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "explore_conversation" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Row Level Security: owner-only, mirroring the agent_* tables. The chat route
-- accepts a client-supplied conversationId, so RLS (not just app-layer filtering)
-- is what isolates one user's exploration conversations from another's.
ALTER TABLE "explore_conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "explore_message"      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS explore_conversation_owner ON "explore_conversation";
CREATE POLICY explore_conversation_owner ON "explore_conversation"
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS explore_message_owner ON "explore_message";
CREATE POLICY explore_message_owner ON "explore_message"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "explore_conversation" c
      WHERE c.id = "explore_message".conversation_id AND c.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM "explore_conversation" c
      WHERE c.id = "explore_message".conversation_id AND c.user_id = auth.uid()
    )
  );
