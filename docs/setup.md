# Setup

> TODO: Expand with detailed, verified setup steps for each component.

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [PlatformIO](https://platformio.org/install) (CLI or IDE extension)
- A [Supabase](https://supabase.com/) account and project
- [Supabase CLI](https://supabase.com/docs/guides/cli)

## Firmware Setup

```bash
cd firmware
# TODO: pio run
# TODO: pio run --target upload
```

## Web App Setup

```bash
cd web
npm install
npm run dev
```

## Supabase Setup

```bash
cd supabase
supabase start                       # local stack (Postgres, Auth, Studio, edge runtime)
supabase link --project-ref <ref>    # one-time: link to a remote project
supabase db push                     # apply migrations/*.sql to the linked project
supabase functions deploy <name>     # deploy an individual edge function
```

Required edge function secrets (Gloo AI + YouVersion) are documented in
[`supabase/functions/.env.example`](../supabase/functions/.env.example). For
local development, copy it to `supabase/functions/.env` and fill in real
values; `supabase functions serve` reads that file automatically. For a
remote project, set them with `supabase secrets set KEY=value`.

## Environment Variables

Copy `web/.env.example` to `web/.env` and fill in your Supabase project URL,
anon key, and YouVersion app key.

## TODO

- [ ] Document PlatformIO board configuration.
- [ ] Document Supabase project provisioning steps.
- [ ] Document local development workflow across all three components.
