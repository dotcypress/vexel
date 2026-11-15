# vexel

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
- **Export HTML** (above the preview) downloads a self-contained page with its own pan, zoom, sliders and helpers.
- The **Examples** menu loads ready-made sketches (shapes, plots, a phase portrait, the Mandelbrot set, charts, interactive toys). Their comments explain the helpers they use.
- The in-app **Help** has every helper with an example and a ▶ button that loads it into the editor and runs it, and `Ctrl + Space` autocompletes them.

```js
animate((t) => {
  clear('#282c34')
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
| `mouse` | Pointer in world coordinates: `x, y, down`. |
| `frame` | `n` (frame index), `time` and `dt` (seconds), `fps` (smoothed). |
| `sin, cos, PI, ...` | Every `Math` function and constant is global, except `log`, which prints (use `Math.log` for the natural logarithm). |

### Helpers

Optional arguments fall back to the current `ctx` styles and never change them.

**Canvas, guides and view**

| Helper | Description |
|---|---|
| `clear(color?)` | Fill the canvas with a color, or make it transparent. |
| `grid(step?, color?, major?)` | Minor lines every `step` (default 10), major lines every `major` (default `5 * step`, `0` for none). |
| `axes(color?)` | X and Y axes through the origin, with value labels. |
| `fit(x, y, w, h)` | Frame a world rectangle (bottom-left corner `x, y`) once per run. |
| `px(n?)` | `n` screen pixels in world units, for zoom-independent widths and sizes. |

**Shapes**

| Helper | Description |
|---|---|
| `point(x, y, size?, color?)` | Filled dot. |
| `points([[x, y], ...], size?, color?)` | Many dots. |
| `line(x1, y1, x2, y2, color?, lineWidth?)` | Line segment. |
| `polyline([[x, y], ...], color?, lineWidth?, closed?)` | Connected lines. |
| `curve(x1, y1, cx, cy, x2, y2, color?, lineWidth?)` | Quadratic Bezier curve. |
| `circle(x, y, radius, fill?, stroke?, lineWidth?)` | Circle. |
| `rect(x, y, w, h, fill?, stroke?, lineWidth?)` | Rectangle from its bottom-left corner. |
| `text(str, x, y, color?, size?, align?)` | Text in world units. |
| `trail(id, x, y, n?, color?)` | Fading line through the last `n` positions. |

**Plots**

| Helper | Description |
|---|---|
| `plot(f, color?, lineWidth?, from?, to?)` | Graph of `y = f(x)`. |
| `plotPolar(f, color?, lineWidth?)` | Graph of `r = f(theta)` for theta from 0 to 2π. |
| `contour(f, level?, color?, lineWidth?)` | Curve where `f(x, y) = level`. |
| `field(f, step?, color?)` | Vector field; `f(x, y)` returns `[dx, dy]`. |
| `heat(f, ramp?)` | Color the view by `f(x, y)` in 0..1. Draw it first. |
| `scatter(list, size?, ramp?)` | Dots from `[x, y, value]`, colored by value. |
| `bars(list, width?, color?)` | Bar chart from numbers. |
| `hist(list, bins?)` | Histogram of numbers; returns the counts. |

Ramps for `heat` and `scatter`: `'viridis'` (default), `'magma'`, `'inferno'`, `'plasma'`, `'cividis'` (color-blind safe), `'turbo'`, `'hot'` and `'gray'` for values from low to high; `'coolwarm'` for values on both sides of a middle (0.5 is neutral); `'vexel'`, the logo gradient. Or pass a function `t => color`.

**Colors**

| Helper | Description |
|---|---|
| `palette(i)` | The i-th color of a 16-color palette (wraps around). |
| `hsl(h, s, l, a?)` | Color string: `h` in degrees, `s` and `l` in 0-100. |
| `rgb(r, g, b, a?)` | Color string: `r, g, b` in 0-255. |

**Numbers and ranges**

| Helper | Description |
|---|---|
| `range(a, b, step?)` | Numbers from `a` up to, not including, `b`. `range(n)` counts from 0 to `n - 1`. |
| `linspace(a, b, n)` | `n` evenly spaced numbers from `a` to `b`, both included. |
| `bounds(points)` | `[x, y, w, h]` around a list of `[x, y]` points, for `fit(...bounds(points))`. |
| `normalize(list)` | The list rescaled to 0..1. |
| `lerp(a, b, t)` | The value `t` of the way from `a` to `b`. |

**Interaction and overlays**

| Helper | Description |
|---|---|
| `slider(name, min, max, value?, step?)` | Slider; returns its value. |
| `toggle(name, value?)` | Checkbox; returns a boolean. |
| `select(name, options, value?)` | Chooser; returns the chosen option. |
| `key(name)` | True while a key is held, e.g. `'ArrowLeft'`, `'a'`, `'Space'`. |
| `hover(x, y, r)` | True while the pointer is within `r` of a point. |
| `hud(...lines)` | Text in the top-left corner for this frame. |
| `log(...values)` | Print to the console panel under the editor (also catches `console.log`, `warn`, `error`). |

Sliders, toggles, selects and `hud` are drawn in screen pixels on top of the sketch, so they ignore pan and zoom, and their values survive re-runs. Call `clear()` first in animated sketches so they don't smear. Click the preview to give it keyboard focus for `key`.

### Shortcuts

| Keys | Action |
|---|---|
| `Cmd/Ctrl + Enter` | Run now |
| Wheel / trackpad scroll | Pan |
| Middle or right drag, `Space` + drag | Pan |
| Pinch / `Ctrl` + wheel | Zoom at the cursor |
| `+` / `-` | Zoom in / out |
| `0` | Reset view |
| `Ctrl + Space` | Autocomplete |

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
