-- Phase F (Token Economy): plan-keyed token limits, per-turn usage capture, the
-- daily spend table, and conversation auto-compaction fields.
--
-- Written idempotently so it is safe to apply via `prisma db execute` and harmless
-- if re-run (the runtime uses the Supabase client, not Prisma migrate).

-- F2: a stable plan key on subscriptions → PLAN_LIMITS profile (free/pro_monthly/…).
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "plan_key" TEXT;

-- F1: per-turn token usage on the assistant message. input_tokens on the latest
-- assistant turn ≈ the conversation's current context size (the meter number).
ALTER TABLE "agent_message" ADD COLUMN IF NOT EXISTS "input_tokens" INTEGER;
ALTER TABLE "agent_message" ADD COLUMN IF NOT EXISTS "output_tokens" INTEGER;
ALTER TABLE "agent_message" ADD COLUMN IF NOT EXISTS "cache_read_tokens" INTEGER;
ALTER TABLE "agent_message" ADD COLUMN IF NOT EXISTS "billable_tokens" INTEGER;

-- F4: auto-compaction bookkeeping on the conversation.
ALTER TABLE "agent_conversation" ADD COLUMN IF NOT EXISTS "compacted_through_ordinal" INTEGER;
ALTER TABLE "agent_conversation" ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- F2b: daily token spend per user (monthly = SUM over the month's rows).
CREATE TABLE IF NOT EXISTS "ai_token_usage" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "day" TEXT NOT NULL,
  "input_tokens" INTEGER NOT NULL DEFAULT 0,
  "output_tokens" INTEGER NOT NULL DEFAULT 0,
  "cache_read_tokens" INTEGER NOT NULL DEFAULT 0,
  "billable_tokens" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ai_token_usage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ai_token_usage_user_id_day_key"
  ON "ai_token_usage" ("user_id", "day");
CREATE INDEX IF NOT EXISTS "ai_token_usage_user_id_idx"
  ON "ai_token_usage" ("user_id");
