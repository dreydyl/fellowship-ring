# Web Application

React + Vite + TypeScript single-page application for FellowshipRing.

## Folder Structure (feature-first)

- `src/app/` — Application shell: router configuration, providers, global layout.
- `src/assets/` — Static assets (images, icons, fonts).
- `src/components/` — Reusable, feature-agnostic UI components.
- `src/features/` — Feature-specific modules (auth, dashboard, ppg, settings), each owning its own components/hooks/logic.
- `src/hooks/` — Reusable, cross-feature React hooks.
- `src/lib/` — Third-party client configuration (e.g., Supabase client).
- `src/services/` — API/service layer for communicating with Supabase and other backends.
- `src/styles/` — Global styles.
- `src/types/` — Shared TypeScript types/interfaces.
- `src/utils/` — Generic utility functions.

## Scripts

- `npm run dev` — Start the Vite dev server.
- `npm run build` — Type-check and build for production.
- `npm run preview` — Preview the production build.
- `npm run lint` — Run ESLint.

## Environment Variables

Copy `.env.example` to `.env` and set your Supabase project URL and anon key.

## TODO

- [ ] Implement authentication logic in `features/auth`.
- [ ] Implement dashboard visualizations in `features/dashboard`.
- [ ] Implement PPG data handling in `features/ppg`.
- [ ] Implement settings management in `features/settings`.
