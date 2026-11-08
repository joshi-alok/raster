# @raster/css

The stylesheet of Raster, a design system in the Swiss International Style. Components are plain
classes (`sw-button`, `sw-card`, …) that work in HTML with no JavaScript. The tokens are inlined,
so this one file is all a page needs. It ships two themes, Alpine and Zürich, each with light and
dark modes.

## Install

    npm install @raster/css @fontsource-variable/geist @fontsource-variable/geist-mono

## Use

```js
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "@raster/css"; // or "@raster/css/raster.min.css"
import "@raster/css/motion.css"; // optional: scroll and entrance motion
```

```html
<html data-theme="alpine" data-mode="light">
  <button type="button" class="sw-button" data-variant="primary">Save</button>
</html>
```

`data-theme` is `alpine` or `zurich`. Leave out `data-mode` to follow the system setting.

## Links

- Documentation: the Raster docs site, Get started page
- Repository: https://github.com/joshi-alok/raster

MIT licence.
