# setup.ps1
#
# One-time/repeatable setup for local development on Windows:
# installs web app dependencies. Extend this script as additional
# setup steps (e.g., Supabase CLI, PlatformIO) are needed.
#
# Usage: ./scripts/setup.ps1

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==> Installing web app dependencies"
Push-Location (Join-Path $RepoRoot "web")
try {
    npm install
}
finally {
    Pop-Location
}

# TODO: Install/verify PlatformIO CLI for firmware development.
# TODO: Install/verify Supabase CLI for backend development.

Write-Host "==> Setup complete"
