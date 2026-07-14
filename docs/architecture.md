# Architecture

> TODO: Expand with detailed system architecture diagrams and rationale.

## Overview

FellowshipRing is composed of three cooperating systems:

1. **Firmware** (`firmware/`) — Runs on the wearable device, samples PPG sensor data, and transmits it to the web application.
2. **Web Application** (`web/`) — A React/TypeScript SPA that authenticates users, receives/visualizes device data, and manages settings.
3. **Supabase Backend** (`supabase/`) — Provides authentication, Postgres storage, RLS policies, and edge functions.

## Data Flow

```
Device (PPG sensor) → Firmware → Web App → Supabase (Auth/DB/Storage)
```

## Component Responsibilities

- **Firmware**: sensor sampling, signal preprocessing, transport (BLE/USB serial).
- **Web App**: device pairing UI, data visualization, account/settings management.
- **Supabase**: user identity, persisted data, server-side business rules (edge functions).

## TODO

- [ ] Document communication protocol between firmware and web app.
- [ ] Document Supabase schema and RLS policies.
- [ ] Add sequence diagrams for key workflows (pairing, data sync, auth).
