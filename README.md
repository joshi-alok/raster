# Raster

A design system in the Swiss International Style: a strict grid, plain type, and two themes (Alpine and Zürich), each with light and dark modes. Every component works in plain HTML with CSS, and in React.

| Package | What it is |
|---|---|
| [`@rasterdesign/css`](packages/css) | The stylesheet. Components as classes; works without JavaScript. |
| [`@rasterdesign/react`](packages/react) | React components on React Aria, styled by `@rasterdesign/css`. |
| [`@rasterdesign/tokens`](packages/tokens) | Tokens as CSS, JSON and design-tool files, plus the theme checks. |

Documentation: the docs site (see `apps/docs`), with a Get started page.

## Develop

Node 22 and pnpm 10 (`corepack enable`). Docker runs the browser tests.

    pnpm install
    pnpm build
    pnpm verify        # build, lint, typecheck, unit tests, pack check, browser tests
    pnpm baselines     # regenerate screenshot baselines (Linux, in Docker)

Changes that users of the packages will notice need a changeset: `pnpm changeset`. See RELEASING.md.

## Licence

MIT
