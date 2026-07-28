-- Grants required table-level privileges for authenticated/anon roles.
-- RLS policies alone do not grant access; PostgreSQL requires explicit
-- GRANTs on the tables before row-level security policies are evaluated.

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on
  confession_entries,
  addiction_assessments,
  guidance_records,
  reading_plans,
  guided_prayers
to authenticated;

-- Ensure future tables created in the public schema automatically receive
-- the same privileges without requiring a follow-up migration.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
