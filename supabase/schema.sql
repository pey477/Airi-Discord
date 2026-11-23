-- Airi conversation memory.
-- Run this in the SQL Editor of the Supabase project dedicated to Airi.
create table if not exists public.airi_conversations (
  guild_id text not null,
  user_id text not null,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint airi_conversations_pkey primary key (guild_id, user_id),
  constraint airi_conversations_history_is_array check (jsonb_typeof(history) = 'array')
);

alter table public.airi_conversations enable row level security;

-- Only the trusted bot backend may read or write conversation history.
revoke all on table public.airi_conversations from anon, authenticated;
grant all on table public.airi_conversations to service_role;
