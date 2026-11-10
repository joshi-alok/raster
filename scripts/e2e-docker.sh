#!/bin/sh
# Runs the browser tests inside Playwright's Linux image, at the version the docs pin, so local
# screenshots match CI's pixels. With no arguments it runs the docs and studio suites; with
# arguments it runs only the docs suite and passes them to Playwright (e.g. --update-snapshots,
# -g "pattern", --project=visual). node_modules inside the container live in named volumes, so the
# host's macOS binaries and the container's Linux ones never mix.
set -eu
cd "$(dirname "$0")/.."

# `pnpm e2e -- …` passes the `--` through; Playwright would read it as the end of its options.
if [ "${1:-}" = "--" ]; then shift; fi

VERSION=$(node -p "require('./apps/docs/package.json').devDependencies['@playwright/test']")
IMAGE="mcr.microsoft.com/playwright:v${VERSION}-noble"

# One volume per workspace package, whether or not the host has installed it yet, so pnpm in the
# container never writes into the host's tree. The store and corepack's pnpm download are cached.
VOLUMES="-v raster-pnpm-store:/pnpm-store -v raster-corepack:/corepack -v raster-node_modules:/work/node_modules"
for dir in packages/* apps/*; do
  [ -f "$dir/package.json" ] || continue
  VOLUMES="$VOLUMES -v raster-$(echo "$dir" | tr '/' '-')-node_modules:/work/$dir/node_modules"
done

# shellcheck disable=SC2086
exec docker run --rm --init --ipc=host \
  -v "$PWD":/work -w /work $VOLUMES \
  -e COREPACK_HOME=/corepack -e COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
  "$IMAGE" sh -c '
    set -e
    # Node 25 and later no longer bundle corepack, so install it into its volume once. Enabling only
    # pnpm leaves the yarn in the image alone.
    [ -x /corepack/cli/node_modules/.bin/corepack ] ||
      npm install --prefix /corepack/cli --cache /corepack/npm-cache --no-audit --no-fund --no-update-notifier corepack@0.36.0
    /corepack/cli/node_modules/.bin/corepack enable pnpm --install-directory /usr/local/bin
    pnpm install --frozen-lockfile --store-dir /pnpm-store --config.confirmModulesPurge=false
    pnpm build
    if [ "$#" -gt 0 ]; then
      pnpm --filter @rasterdesign/docs exec playwright test "$@"
    else
      pnpm --filter @rasterdesign/docs exec playwright test
      pnpm --filter @rasterdesign/studio exec playwright test
    fi
  ' sh "$@"
