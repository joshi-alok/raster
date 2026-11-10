# Releasing Raster

## Every change
Run `pnpm changeset` for anything users of the packages will notice. Pick patch, minor or major; the three packages share one version, so one entry covers them all.

## A release
When changesets reach `main` and CI passes there, the Release workflow opens a "Version packages" PR. It runs only after CI succeeds on a push to `main`, so a commit with failing checks never publishes. CI does not run on the Version PR itself, because the action opens it with `GITHUB_TOKEN`; its checks run once it is merged, before anything is published. Merging it bumps the version, writes each package's CHANGELOG.md, and publishes to npm with provenance (trusted publishing, no token). Tags `@raster/<name>@<version>` mark each release.

## First-time setup (done once)
1. GitHub: the public repository `joshi-alok/raster`.
2. Cloudflare: an API token with "Workers Scripts: Edit" on the account, saved as the `CLOUDFLARE_API_TOKEN` secret; the account id as `CLOUDFLARE_ACCOUNT_ID`; the workers.dev subdomain as the `WORKERS_SUBDOMAIN` variable.
3. npm: the `raster` organisation; a first manual publish (`npm login`, `pnpm build`, `node scripts/publish.mjs`), because trusted publishing can only be set up for a package that exists; then for each package, npmjs.com → Settings → Trusted publishing → GitHub Actions: repository `joshi-alok/raster`, workflow `release.yml`.

## Baselines
Screenshot baselines are Linux only. After a visual change: `pnpm baselines`, look at the changed images, and commit them.
