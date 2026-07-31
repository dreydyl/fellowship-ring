-- Tracks each AI-generation call that consumes a user's rate-limit
-- "credit" (see supabase/functions/_shared/rateLimiter.ts). Users are
-- limited to a small number of Gloo AI generations per rolling 24h
-- window; writing confession entries themselves is never limited.
--
-- Only edge functions (via the service-role client) read/write this
-- table — there is no end-user-facing UI for it, so RLS is enabled
-- with no policies: the service role bypasses RLS entirely (see
-- 0005_service_role_grants.sql), while `authenticated`/`anon` get no
-- access at all.

create table ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index ai_usage_events_user_id_created_at_idx
  on ai_usage_events (user_id, created_at);

alter table ai_usage_events enable row level security;
