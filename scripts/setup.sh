#!/usr/bin/env bash
# setup.sh
#
# One-time/repeatable setup for local development on macOS/Linux:
# installs web app dependencies. Extend this script as additional
# setup steps (e.g., Supabase CLI, PlatformIO) are needed.
#
# Usage: ./scripts/setup.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Installing web app dependencies"
(cd "$REPO_ROOT/web" && npm install)

# TODO: Install/verify PlatformIO CLI for firmware development.
# TODO: Install/verify Supabase CLI for backend development.

echo "==> Setup complete"
