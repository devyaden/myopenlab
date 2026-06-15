-- Workspace AI Agent tables: conversations, messages, and file attachments.
-- Apply in Supabase (SQL editor / migration). Mirrors prisma/schema.prisma.
-- All rows are scoped to the owning user; RLS enforces isolation in addition to
-- the server-side user_id filtering done in the API routes.

create table if not exists public.agent_conversation (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  canvas_id   uuid,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists agent_conversation_user_updated_idx
  on public.agent_conversation (user_id, updated_at desc);

create table if not exists public.agent_message (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversation (id) on delete cascade,
  role            text not null,           -- 'user' | 'assistant'
  content         jsonb not null,          -- array of Anthropic content blocks
  created_at      timestamptz not null default now()
);

create index if not exists agent_message_conversation_created_idx
  on public.agent_message (conversation_id, created_at);

create table if not exists public.agent_attachment (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.agent_conversation (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  storage_path    text not null,
  public_url      text not null,
  file_name       text not null,
  media_type      text not null,
  kind            text not null,           -- image | pdf | text | docx
  extracted_text  text,
  created_at      timestamptz not null default now()
);

create index if not exists agent_attachment_conversation_idx
  on public.agent_attachment (conversation_id);

-- Row Level Security ---------------------------------------------------------

alter table public.agent_conversation enable row level security;
alter table public.agent_message      enable row level security;
alter table public.agent_attachment   enable row level security;

-- Conversations: owner-only.
drop policy if exists agent_conversation_owner on public.agent_conversation;
create policy agent_conversation_owner on public.agent_conversation
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages: accessible when the parent conversation belongs to the user.
drop policy if exists agent_message_owner on public.agent_message;
create policy agent_message_owner on public.agent_message
  for all using (
    exists (
      select 1 from public.agent_conversation c
      where c.id = agent_message.conversation_id and c.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.agent_conversation c
      where c.id = agent_message.conversation_id and c.user_id = auth.uid()
    )
  );

-- Attachments: owner-only.
drop policy if exists agent_attachment_owner on public.agent_attachment;
create policy agent_attachment_owner on public.agent_attachment
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
