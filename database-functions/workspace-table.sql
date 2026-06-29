-- Workspace settings: one per user (v1). Holds the workspace name plus the
-- code/function naming conventions and default fonts that Settings → Workspace
-- edits and the agent/editor can read. Mirrors prisma/schema.prisma (model
-- Workspace). Idempotent: safe to run repeatedly. Owner-scoped via RLS, matching
-- the explore_* / agent_* table convention so routes can use the cookie client.

create table if not exists public.workspace (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null default 'My workspace',
  -- code/function naming conventions (e.g. department prefixes, code format)
  conventions   jsonb not null default '{}'::jsonb,
  -- default fonts for new artifacts (display / body / mono)
  default_fonts jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id)
);

create index if not exists workspace_user_idx on public.workspace (user_id);

-- Row Level Security ---------------------------------------------------------
alter table public.workspace enable row level security;

drop policy if exists workspace_owner on public.workspace;
create policy workspace_owner on public.workspace
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotent backfill: a default workspace for every existing user that lacks one.
-- Re-running inserts nothing (the NOT EXISTS guard + the unique(user_id) constraint).
insert into public.workspace (user_id, name)
select u.id, 'My workspace'
from auth.users u
where not exists (
  select 1 from public.workspace w where w.user_id = u.id
);
