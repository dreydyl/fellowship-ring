-- Core schema for confession entries, addiction assessments, recovery
-- guidance, AI-curated reading plans, and guided prayers.

create extension if not exists "pgcrypto";

create type assessment_source as enum ('self_report', 'ai');

-- Confession entries -------------------------------------------------------

create table confession_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index confession_entries_user_id_created_at_idx
  on confession_entries (user_id, created_at desc);

alter table confession_entries enable row level security;

create policy "Users can view their own confession entries"
  on confession_entries for select
  using (user_id = auth.uid());

create policy "Users can insert their own confession entries"
  on confession_entries for insert
  with check (user_id = auth.uid());

create policy "Users can update their own confession entries"
  on confession_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own confession entries"
  on confession_entries for delete
  using (user_id = auth.uid());

-- Addiction assessments ------------------------------------------------------

create table addiction_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source assessment_source not null,
  severity_level int not null check (severity_level between 1 and 5),
  addiction_type text,
  notes text,
  based_on_entry_id uuid references confession_entries (id) on delete set null,
  created_at timestamptz not null default now()
);

create index addiction_assessments_user_id_created_at_idx
  on addiction_assessments (user_id, created_at desc);

alter table addiction_assessments enable row level security;

create policy "Users can view their own addiction assessments"
  on addiction_assessments for select
  using (user_id = auth.uid());

create policy "Users can insert their own addiction assessments"
  on addiction_assessments for insert
  with check (user_id = auth.uid());

create policy "Users can update their own addiction assessments"
  on addiction_assessments for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own addiction assessments"
  on addiction_assessments for delete
  using (user_id = auth.uid());

-- Recovery guidance ----------------------------------------------------------

create table guidance_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  confession_entry_id uuid not null references confession_entries (id) on delete cascade,
  assessment_id uuid references addiction_assessments (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now()
);

create index guidance_records_user_id_created_at_idx
  on guidance_records (user_id, created_at desc);

alter table guidance_records enable row level security;

create policy "Users can view their own guidance records"
  on guidance_records for select
  using (user_id = auth.uid());

create policy "Users can insert their own guidance records"
  on guidance_records for insert
  with check (user_id = auth.uid());

create policy "Users can update their own guidance records"
  on guidance_records for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own guidance records"
  on guidance_records for delete
  using (user_id = auth.uid());

-- AI-curated reading plans ---------------------------------------------------

create table reading_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  confession_entry_id uuid not null references confession_entries (id) on delete cascade,
  title text not null,
  description text,
  plan_json jsonb not null,
  created_at timestamptz not null default now()
);

create index reading_plans_user_id_created_at_idx
  on reading_plans (user_id, created_at desc);

alter table reading_plans enable row level security;

create policy "Users can view their own reading plans"
  on reading_plans for select
  using (user_id = auth.uid());

create policy "Users can insert their own reading plans"
  on reading_plans for insert
  with check (user_id = auth.uid());

create policy "Users can update their own reading plans"
  on reading_plans for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own reading plans"
  on reading_plans for delete
  using (user_id = auth.uid());

-- Guided prayers --------------------------------------------------------------

create table guided_prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  confession_entry_id uuid not null references confession_entries (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index guided_prayers_user_id_created_at_idx
  on guided_prayers (user_id, created_at desc);

alter table guided_prayers enable row level security;

create policy "Users can view their own guided prayers"
  on guided_prayers for select
  using (user_id = auth.uid());

create policy "Users can insert their own guided prayers"
  on guided_prayers for insert
  with check (user_id = auth.uid());

create policy "Users can update their own guided prayers"
  on guided_prayers for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own guided prayers"
  on guided_prayers for delete
  using (user_id = auth.uid());
