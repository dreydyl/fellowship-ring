-- profiles was created in 0003_profiles.sql, before the 0004_grants.sql
-- migration ran, and was never added to that migration's explicit table
-- list. `alter default privileges` in 0004 only applies to tables
-- created after it runs, so profiles was left without the base
-- Postgres grants the `authenticated` role needs (RLS policies alone
-- don't grant access).

grant select, insert, update, delete on profiles to authenticated;
