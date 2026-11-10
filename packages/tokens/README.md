# @rasterdesign/tokens

Raster's design tokens: two themes, Alpine and Zürich, each with light and dark modes, plus type,
space, radius and motion scales. They ship as CSS custom properties, as JSON, and as a small
library with the themes and the contrast checks that keep them accessible. Most sites want
`@rasterdesign/css`, which already includes these tokens.

## Install

    npm install @rasterdesign/tokens

## Use

```js
import "@rasterdesign/tokens/tokens.css"; // custom properties only, no components
```

```ts
import { checkTheme, themes, tokensJson } from "@rasterdesign/tokens";

for (const theme of themes) console.log(theme.name, checkTheme(theme).length, "contrast violations");
const json = tokensJson(); // the same data as "@rasterdesign/tokens/tokens.json"
```

## Links

- Documentation: the Raster docs site, Get started page
- Repository: https://github.com/joshi-alok/raster

MIT licence.
