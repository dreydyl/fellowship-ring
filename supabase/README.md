# Supabase

Backend configuration for FellowshipRing: database schema, migrations, RLS policies, and edge functions.

## Structure

- `migrations/` — SQL migration files managed by the Supabase CLI.
- `functions/` — Supabase Edge Functions.
- `config.toml` — Supabase CLI project configuration.

## TODO

- [ ] Run `supabase init` to scaffold CLI configuration (if not already present).
- [ ] Define database schema and initial migration.
- [ ] Define RLS policies for user data.
- [ ] Implement edge functions as needed.
