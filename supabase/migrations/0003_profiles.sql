-- Adds a per-user profile that tracks current addiction severity/type,
-- separate from the historical addiction_assessments log. Used to
-- pre-populate the self-report form and to give AI features (guidance,
-- reading plans, prayers) a single current-state lookup instead of
-- always querying the latest assessment.

create table profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_severity_level int check (current_severity_level between 1 and 5),
  current_addiction_type text,
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (user_id = auth.uid());

create policy "Users can insert their own profile"
  on profiles for insert
  with check (user_id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
