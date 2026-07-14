#!/usr/bin/env bash
# build.sh
#
# Builds production artifacts for the web application.
#
# TODO: Extend to also build firmware (`pio run`) once a target board
# is configured in firmware/platformio.ini.
#
# Usage: ./scripts/build.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Building web app"
cd "$REPO_ROOT/web"
npm run build
