# @raster/react

Raster's React components, built on React Aria for accessibility and styled by `@raster/css`.
Every component is a client component; the bundle starts with `"use client"`, so it works in
React Server Components frameworks. React 19 is required.

## Install

    npm install @raster/react @raster/css @fontsource-variable/geist @fontsource-variable/geist-mono

## Use

```tsx
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@raster/css";
import { Button } from "@raster/react";

export function SaveButton() {
  return <Button variant="primary">Save</Button>;
}
```

Set the theme on a root element: `<html data-theme="alpine">` or `data-theme="zurich"`, and
optionally `data-mode="light"` or `"dark"`.

## Links

- Documentation: the Raster docs site, Get started page
- Repository: https://github.com/joshi-alok/raster

MIT licence.
