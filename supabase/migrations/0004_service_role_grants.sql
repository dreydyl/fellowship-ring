-- Ensure the service_role (used by edge functions' admin client) has
-- full table/sequence privileges on the public schema. Local dev
-- databases created purely from migrations (without the standard
-- Supabase bootstrap) can be missing these grants, which causes
-- PostgREST/admin-client queries to fail with "permission denied"
-- even though service_role bypasses RLS.

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
