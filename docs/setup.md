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
# TODO: supabase init
# TODO: supabase start
# TODO: supabase db push
```

## Environment Variables

Copy `web/.env.example` to `web/.env` and fill in your Supabase project URL and anon key.

## TODO

- [ ] Document PlatformIO board configuration.
- [ ] Document Supabase project provisioning steps.
- [ ] Document local development workflow across all three components.
