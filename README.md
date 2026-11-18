# vexel

[![Proudly Vibe Coded - Molten Ember](https://vibecoded.fyi/badges/terminal/main/proudly-vibe-coded-molten-ember.svg)](https://vibecoded.fyi/)

A live-coding playground for 2D graphics and math plots. Write JavaScript on the left, see it on an infinite, pannable and zoomable canvas on the right. Code re-runs as you type, and any sketch can be exported as a standalone HTML file.

Built with SvelteKit and CodeMirror.

## Running

```sh
npm install
npm run dev       # start the dev server
npm run build     # production build
npm run check     # type-check
```

## Install and offline use

Vexel is an installable PWA. When served over HTTPS (or from `localhost`), the browser offers to install it, and after the first visit the whole app works without a network: a service worker (`src/service-worker/index.ts`) caches every built file, and your code is saved in the browser. A new deployment installs its own cache in the background and takes over once the old version's tabs are closed. In dev (`npm run dev`) only the static files are cached, so test offline behavior with `npm run build` and `npm run preview`.

## Using it

- Draw in world coordinates: `(0, 0)` is the origin and **Y grows upward**.
- Call `animate((t, dt) => { ... })` to draw every frame, or `animate(fn, 0.5)` to call it every half second. Without `animate`, the code re-runs whenever the view changes.
- The sketch runs in a sandboxed iframe. Errors show below the editor, and your code is saved in the browser automatically.
- **Screenshot** (the camera button above the preview) saves the sketch as a PNG with a small Vexel badge in the corner; `screenshot()` does the same from code.
- **Export HTML** (the download button above the preview) downloads a self-contained page with its own pan, zoom, sliders and helpers.
- The **Examples** menu loads ready-made sketches (shapes, plots, a phase portrait, the Mandelbrot set, charts, interactive toys). Their comments explain the helpers they use.
- The in-app **Help** has every helper with an example and a ▶ button that loads it into the editor and runs it, `Ctrl + Space` autocompletes them, and resting the pointer on a helper's name in the editor shows its docs and example.

```js
animate((t) => {
  clear()
  grid()
  axes()
  circle(cos(t) * 60, sin(t) * 60, 10, palette(0))
})
```

## Help

### Globals

| Name | Description |
|---|---|
| `canvas`, `ctx` | The canvas and its 2D context, already set up for the world camera. |
| `view` | Visible world area: `x, y, zoom, left, top, right, bottom, width, height`. |
| `mouse` | Pointer in world coordinates: `x, y, down`, and `clicked` (true for one frame after a click on the sketch). |
| `frame` | `n` (frame index), `time` and `dt` (seconds), `fps` (smoothed). |
| `sin, cos, PI, ...` | Every `Math` function and constant is global, except `log`, which prints (use `Math.log` for the natural logarithm), and `random`, which is seeded (use `Math.random` for unseeded numbers). |

### Helpers

Arguments always come in the same order: geometry first, then colors, then size or line width, then extras. Instead of the style arguments you can pass one object: `line(0, 0, 50, 50, { color: 'red', width: 3 })`, `circle(0, 0, 40, { stroke: 'white', width: px(2) })`, `ellipse(0, 0, 60, 30, { fill: 'teal', rotation: 0.5 })`. Stroked helpers also take `dash: [on, off]` in screen pixels. Text helpers (`text`, `label`, `textBox`, `dims`) take `font`, `weight` and `italic`.

Left-out styles fall back to the current `ctx` styles, and helpers never change them. Each run starts with light ink and lines 1 screen pixel wide.

**Canvas, guides and view**

| Helper | Description |
|---|---|
| `clear(color?)` | Fill the canvas with a color, or make it transparent. |
| `grid(step?, color?, major?)` | Minor lines every `step` (default 10), major lines every `major` (default `5 * step`, `0` for none). |
| `axes(color?)` | X and Y axes through the origin, with value labels. `axes({ color, xLabel, yLabel, step })` names the axes and sets the label spacing. |
| `fit(x, y, w, h)` | Frame a world rectangle (bottom-left corner `x, y`) once per run. |
| `px(n?)` | `n` screen pixels in world units, for zoom-independent widths and sizes. |

**Shapes**

| Helper | Description |
|---|---|
| `point(x, y, color?, size?)` | Filled dot. |
| `points(points, color?, size?)` | A dot at every `[x, y]`. |
| `line(x1, y1, x2, y2, color?, lineWidth?)` | Line segment. |
| `polyline(points, color?, lineWidth?, closed?)` | Connected lines. |
| `curve(x1, y1, cx, cy, x2, y2, color?, lineWidth?)` | Quadratic Bezier curve. |
| `circle(x, y, radius, fill?, stroke?, lineWidth?)` | Circle. |
| `ellipse(x, y, rx, ry, fill?, stroke?, lineWidth?, rotation?)` | Ellipse, optionally rotated (radians). |
| `arc(x, y, radius, start, end, color?, lineWidth?)` | Stroked arc from angle `start` to `end` (radians, counterclockwise). |
| `poly(points, fill?, stroke?, lineWidth?)` | Closed, filled polygon. |
| `rect(x, y, w, h, fill?, stroke?, lineWidth?)` | Rectangle from its bottom-left corner. |
| `text(str, x, y, color?, size?, align?)` | Text in world units. |
| `trail(id, x, y, color?, n?)` | Fading line through the last `n` positions. |
| `arrow(x1, y1, x2, y2, color?, lineWidth?, head?)` | Line with a filled arrowhead; `head` in screen pixels. |
| `bezier(x1, y1, c1x, c1y, c2x, c2y, x2, y2, color?, lineWidth?)` | Cubic Bezier curve. |
| `spline(points, color?, lineWidth?, closed?)` | Smooth curve through the points. |
| `wedge(x, y, radius, start, end, fill?, stroke?, lineWidth?)` | Pie slice. |
| `label(str, x, y, color?, size?, align?)` | Text at a world point, sized in screen pixels. |
| `textBox(str, x, y, color?, size?, align?)` | Multi-line text on a backdrop, in screen pixels; `x, y` is the top-left corner. |
| `dims(x1, y1, x2, y2, text?, color?, offset?)` | Dimension line with arrows and a label (default: the length). |
| `font(family?, weight?, italic?)` | Font for the text helpers for the rest of the run: a name or `'sans'`, `'serif'`, `'mono'`, `'rounded'`; `font()` resets. |
| `loadFont(name, url?)` | Load a web font from Google Fonts by name, or from a font file URL; true once ready, then redraws. |
| `image(src, x, y, w?, h?)` | Picture with its bottom-left corner at `x, y`. |
| `transform(fn, { x, y, rotate, scale })` | Call `fn` with the world moved, rotated and scaled. |

**Plots**

| Helper | Description |
|---|---|
| `plot(f, color?, lineWidth?, from?, to?)` | Graph of `y = f(x)`. |
| `plotParam(fx, fy, color?, lineWidth?, from?, to?)` | Parametric curve `x = fx(t), y = fy(t)`, t from 0 to 2π by default. |
| `plotPolar(f, color?, lineWidth?)` | Graph of `r = f(theta)` for theta from 0 to 2π. |
| `contour(f, level?, color?, lineWidth?)` | Curve where `f(x, y) = level`. |
| `field(f, step?, color?, lineWidth?)` | Vector field; `f(x, y)` returns `[dx, dy]`. |
| `heat(f, ramp?, cell?)` | Color the view by `f(x, y)` in 0..1. Draw it first. `cell` is the cell size in screen pixels; `1` samples every pixel. |
| `scatter(points, ramp?, size?)` | Dots from `[x, y, value]` points, colored by value. |
| `bars(list, width?, color?)` | Bar chart from numbers. |
| `hist(list, bins?, color?)` | Histogram of numbers; returns the counts. |

Ramps for `heat` and `scatter`: `'viridis'` (default), `'magma'`, `'inferno'`, `'plasma'`, `'cividis'` (color-blind safe), `'turbo'`, `'hot'` and `'gray'` for values from low to high; `'coolwarm'` for values on both sides of a middle (0.5 is neutral); `'vexel'`, the brand sunflower ramp (dark blue, green, gold), from low to high. Or pass a function `t => color`.

**Colors**

| Helper | Description |
|---|---|
| `palette(i)` | The i-th color of the 16-color Sunflower palette (wraps around). `palette(0)` is the brand gold; neighbors differ strongly, and the first 8 stay distinct for red-green color blindness. |
| `hsl(h, s, l, a?)` | Color string: `h` in degrees, `s` and `l` in 0-100. |
| `rgb(r, g, b, a?)` | Color string: `r, g, b` in 0-255. |
| `mix(c1, c2, t?)` | Blend two colors. |
| `alpha(color, a)` | The color with its opacity multiplied by `a`. |
| `ramp(name, t)` | The color at `t` (0..1) of a ramp. |

**Vectors** (points and vectors are `[x, y]` arrays)

| Helper | Description |
|---|---|
| `add(a, b)`, `sub(a, b)`, `scale(v, k)` | Vector arithmetic. |
| `dot(a, b)`, `len(v)`, `norm(v)` | Dot product, length, unit vector. |
| `dist(a, b)` | Distance between points, or `dist(x1, y1, x2, y2)`. |
| `rot(v, angle, around?)` | Rotate around a point (default the origin). |
| `angle(v)`, `polar(r, theta)` | Direction of a vector, and a vector from a direction. |
| `intersect(a1, a2, b1, b2)` | Where two segments cross, or `null`. |

**Numbers and ranges**

| Helper | Description |
|---|---|
| `range(a, b, step?)` | Numbers from `a` up to, not including, `b`. `range(n)` counts from 0 to `n - 1`. |
| `linspace(a, b, n)` | `n` evenly spaced numbers from `a` to `b`, both included. |
| `bounds(points)` | `[x, y, w, h]` around a list of `[x, y]` points, for `fit(...bounds(points))`. |
| `normalize(list)` | The list rescaled to 0..1. |
| `lerp(a, b, t)` | The value `t` of the way from `a` to `b`. |
| `grid2d(cols, rows, fn)` | Call `fn(col, row, i)` for every cell; returns the results. |
| `clamp(x, lo?, hi?)` | `x` limited to `lo..hi` (default 0..1). |
| `map(x, a1, b1, a2?, b2?)` | `x` rescaled from `a1..b1` to `a2..b2` (default 0..1). |
| `smoothstep(a, b, x)` | Smooth 0-to-1 step between `a` and `b`. |
| `ease(t, kind?)` | Easing: `'linear'`, `'in'`, `'out'`, `'inOut'`, `'sine'`, `'back'`, `'elastic'`, `'bounce'`. |
| `noise(x, y?, z?)` | Seeded Perlin noise in 0..1; scale inputs down, e.g. `noise(x / 50, y / 50)`. |
| `random(a?, b?)` | Seeded random: `0..1`, `0..b`, `a..b`, or an item of a list. Same on every re-run. |
| `seed(n)` | Restart `random` and `gauss` from seed `n` (every run starts from 1). |
| `gauss(mean?, sd?)` | Seeded normally distributed number (default mean 0, sd 1). |
| `once(fn, key?)` | Call `fn` the first time, then return its cached result on later frames and re-runs. |

**Data**

| Helper | Description |
|---|---|
| `file(name, format?)` | File control: pick or drop a CSV, TSV, JSON or text file; returns the parsed data, or `null` until there is one. Kept across reloads and included in exports. |
| `load(url, format?, { every? })` | Fetch and parse a URL; `null` while loading. `{ every: seconds }` refreshes it. The server must allow cross-origin requests. |
| `csvParse(text, { header?, delimiter?, typed? })` | CSV text to objects (with `.columns`) or arrays; numbers and booleans are converted. |
| `parse(text, format, options?)` | Parse `'json'`, `'csv'`, `'tsv'`, `'text'` or `'lines'`. |

Data helpers return `null` until the data arrives and then re-run the sketch, so start with `if (!rows) return hud('loading')`.

**Interaction and overlays**

| Helper | Description |
|---|---|
| `slider(name, min, max, value?, step?)` | Slider; returns its value. |
| `toggle(name, value?)` | Checkbox; returns a boolean. |
| `select(name, options, value?)` | Chooser; returns the chosen option. |
| `button(name)` | Button; true for the one frame after it is clicked. |
| `slider2d(name, min?, max?, value?)` | X/Y pad; returns `[x, y]` (default -1..1). |
| `swatch(name, value?)` | Palette color picker; returns the chosen color. |
| `number(name, value?, step?, min?, max?)` | Number field: click `-`/`+` or drag to scrub. |
| `pause(on?)`, `step()` | Pause, resume or toggle animation; step one frame while paused. |
| `every(seconds, fn?, key?)` | In `animate`: true once every `seconds`, and calls `fn` when it is. |
| `drag(id, x, y, r?, color?)` | Draggable handle; returns its `[x, y]`, which survives re-runs and edits. `r` is in screen pixels. |
| `lockView(pan?, zoom?)` | Stop the user panning and/or zooming (both locked by default); `lockView(true, false)` locks only pan. |
| `key(name)` | True while a key is held, e.g. `'ArrowLeft'`, `'a'`, `'Space'`. |
| `hover(x, y, r)` | True while the pointer is within `r` world units of a point. |
| `hud(...lines)` | Text in the top-left corner for this frame. |
| `legend(entries, title?)` | Legend under the hud: `[[label, color], ...]` or `{ label: color }`. |
| `colorbar(ramp?, min?, max?, title?)` | Color bar for a ramp with its value range. |
| `screenshot(name?)` | Save the canvas as a PNG after this frame, without controls, with the Vexel badge. |
| `log(...values)` | Print to the console panel under the editor (also catches `console.log`, `warn`, `error`). |

Sliders, toggles, selects, buttons and `hud` are drawn in screen pixels on top of the sketch, so they ignore pan and zoom, and their values survive re-runs. Call `clear()` first in animated sketches so they don't smear. Click the preview to give it keyboard focus for `key`.

### Shortcuts

| Keys | Action |
|---|---|
| `Cmd/Ctrl + Enter` | Run now |
| Wheel / trackpad scroll | Pan |
| Middle or right drag, `Space` + drag | Pan |
| `Alt`/`Option` + drag | Zoom to the selected area (`Esc` cancels) |
| `Alt`/`Option` + click | Zoom out 2x around the point |
| Pinch / `Ctrl` + wheel | Zoom at the cursor |
| `+` / `-` | Zoom in / out |
| `Ctrl + Space` | Autocomplete |
| `F1` | Open the help |

## License

Licensed under either of

- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or
  http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

at your option.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in the work by you, as defined in the Apache-2.0 license, shall be
dual licensed as above, without any additional terms or conditions.
