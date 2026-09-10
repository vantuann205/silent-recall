#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.compact/bin:$HOME/.local/bin:$PATH"
export NEXT_PUBLIC_MIDNIGHT_NETWORK="${NEXT_PUBLIC_MIDNIGHT_NETWORK:-preprod}"
export NEXT_PUBLIC_ENABLE_DEMO=false

# A Git checkout contains no generated contract or proving assets.
if ! command -v compact >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 --fail --silent --show-error --location \
    https://github.com/midnightntwrk/compact/releases/download/compact-v0.5.2/compact-installer.sh | sh
fi
compact update 0.31.1
npx --yes pnpm@10.30.3 contract:compile
npx --yes pnpm@10.30.3 build
