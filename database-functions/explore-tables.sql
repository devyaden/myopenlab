-- Exploration Mode tables: read-only governance Q&A conversations + messages.
-- Apply in Supabase (SQL editor / migration). Mirrors prisma/schema.prisma and
-- prisma/migrations/20260627_explore_mode/migration.sql. Deliberately SEPARATE
-- from the agent_* tables so a future explorer-only role's data is isolated and
-- can be access-scoped independently. No proposals table — exploration never writes.
-- All rows are owner-scoped; RLS enforces isolation in addition to the server-side
-- filtering in the API routes (which accept a client-supplied conversationId).

create table if not exists public.explore_conversation (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  title       text,
  compacted_through_ordinal int,
  summary     text,
  scope_label text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists explore_conversation_user_updated_idx
  on public.explore_conversation (user_id, updated_at desc);

create table if not exists public.explore_message (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.explore_conversation (id) on delete cascade,
  role            text not null,           -- 'user' | 'assistant'
  content         jsonb not null,          -- array of Anthropic content blocks
  input_tokens      int,
  output_tokens     int,
  cache_read_tokens int,
  billable_tokens   int,
  created_at      timestamptz not null default now()
);

create index if not exists explore_message_conversation_created_idx
  on public.explore_message (conversation_id, created_at);

-- Row Level Security ---------------------------------------------------------

alter table public.explore_conversation enable row level security;
alter table public.explore_message      enable row level security;

drop policy if exists explore_conversation_owner on public.explore_conversation;
create policy explore_conversation_owner on public.explore_conversation
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists explore_message_owner on public.explore_message;
create policy explore_message_owner on public.explore_message
  for all using (
    exists (
      select 1 from public.explore_conversation c
      where c.id = explore_message.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.explore_conversation c
      where c.id = explore_message.conversation_id and c.user_id = auth.uid()
    )
  );
