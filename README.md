# FellowshipRing

A wearable PPG (photoplethysmography) monitoring system composed of custom Arduino-based firmware, a React web application, and a Supabase backend.

## Architecture Overview

This repository is a monorepo containing three major components:

```
┌────────────────┐        ┌──────────────────┐        ┌────────────────┐
│  Firmware       │        │  Web Application  │        │  Supabase       │
│  (Arduino /     │──BLE/──▶│  (React + Vite +  │──REST──▶│  (Postgres,     │
│  PlatformIO)    │  USB   │   TypeScript)     │  /RPC  │   Auth, Storage)│
└────────────────┘        └──────────────────┘        └────────────────┘
```

- **firmware/** — Embedded firmware for the wearable device, built with [PlatformIO](https://platformio.org/). Handles sensor sampling (PPG), on-device signal processing, and communication with the host application.
- **web/** — A React (Vite + TypeScript) single-page application used to configure devices, visualize PPG data, and manage user accounts. Organized using a feature-first structure.
- **supabase/** — Backend-as-a-service configuration, including database schema/migrations, edge functions, and Row Level Security (RLS) policies.
- **scripts/** — Repository-level automation and tooling scripts (build, release, data export, etc.).
- **docs/** — Project documentation: architecture, hardware, API, and setup guides.
- **.github/workflows/** — CI/CD pipelines for linting, building, and testing each component.

## Repository Structure

```
project-root/
├── README.md
├── LICENSE
├── .gitignore
├── .editorconfig
├── package.json
├── docs/
├── firmware/
├── web/
├── supabase/
├── scripts/
└── .github/workflows/
```

## Getting Started

See [docs/setup.md](docs/setup.md) for detailed setup instructions for each component.

## Documentation

- [Architecture](docs/architecture.md)
- [Hardware](docs/hardware.md)
- [API](docs/api.md)
- [Setup](docs/setup.md)

## License

See [LICENSE](LICENSE).
