#!/usr/bin/env bash
# dev.sh
#
# Starts the web application development server.
#
# TODO: Extend to optionally start `supabase start` and/or a PlatformIO
# monitor session in parallel once those workflows are established.
#
# Usage: ./scripts/dev.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Starting web app dev server"
cd "$REPO_ROOT/web"
npm run dev
