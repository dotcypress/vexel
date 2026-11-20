# Project Overview

Vexel is a live-coding playground for 2D graphics and math plots. You write JavaScript in a CodeMirror editor on the left, and it renders on an infinite pan/zoom canvas on the right. It is a SvelteKit app (Svelte 5 runes) that runs entirely in the browser and can be installed as an offline PWA.

## Commands

```sh
npm install
npm run dev       # dev server
npm run build     # static build into docs/ (committed; served as the site)
npm run preview   # serve the production build (use this to test offline/service worker)
npm run check     # svelte-kit sync + svelte-check type-check
```

There is no test suite and no linter. `npm run check` is the only automated check.

## Build and deploy specifics

- `adapter-static` writes the build to `docs/`, and `docs/` is committed to git. Release commits include a regenerated `docs/`.
- `bundleStrategy: "inline"` inlines the whole app into `docs/index.html`.
- Production builds use Terser with `drop_console`, which strips `console.*` from app code.
- `vite.config.ts` forces runes mode for every Svelte file outside node_modules.
- `src/routes/+layout.ts` sets `ssr = false` and `prerender = true`.
- `package.json` defines subpath imports: `#lib` and `#lib/*` point to `src/lib`.
- The service worker (`src/service-worker/index.ts`) caches only static files in dev. After a build it caches every built file, so test offline behavior with `build` + `preview`.

## Architecture

**Sketch runtime (`src/lib/runtime.ts`)** is the core. `RUNTIME` is a large template string of plain ES5-style JavaScript. It is not TypeScript and is not type-checked. It runs *inside* the preview iframe and defines every sketch helper (`circle`, `plot`, `slider`, `animate`, ...). `buildPreviewDoc(code, options)` wraps it in a full HTML document and injects the user code as `var CODE = ...`. The same function produces both:
- the live preview: the `srcdoc` of a `sandbox="allow-scripts"` iframe in `Preview.svelte`.
- the standalone **Export HTML** file (`standalone: true`). This file has its own pan/zoom, sliders and embedded files, plus the Vexel badge, all set up by `setupStandalone()` inside RUNTIME.

Because RUNTIME is a template string, any backticks or `${` inside it must be escaped.

**Host ↔ iframe protocol.** `Preview.svelte` owns the camera (pan/zoom), mouse and keyboard input, and the file pickers. It forwards them to the iframe with `postMessage({ source: 'vexel', type, ... })`, using types such as `camera`, `mouse`, `sliders`, `files`, `file`, `screenshot` and `keyreset`. The iframe posts back `ready`, `ok`, `error`, `log`, `slider`, `cursor`, `lock`, `pickfile`, `filestore`, `screenshot` and others. A new host↔sketch feature usually needs changes on both sides: the message handling in RUNTIME and in `Preview.svelte`.

**Adding or changing a helper means updating all of these together:**
1. The implementation in `RUNTIME` (`src/lib/runtime.ts`).
2. `src/lib/helpData.ts`: the Help dialog entry (signature, text, runnable example). The editor's hover docs (`hoverDocs.ts`) are built from it.
3. `src/lib/completionData.ts`: the autocomplete entries (`SKETCH`, plus member lists for `view`, `mouse`, `frame` and `ctx`).
4. The "Help" tables in README.md.
5. Any examples in `src/lib/examples.ts` that use it.

Helper conventions, from the README:
- Arguments go in this order: geometry, then colors, then size or line width, then extras.
- A single options object (`{ color, fill, stroke, width, dash, font, ... }`) can replace the style arguments.
- Helpers never change `ctx` styles.
- World Y grows upward.
- `random`, `noise` and `gauss` are seeded.
- `log` prints to the console panel; it is not `Math.log`.

**App shell (`src/routes/+page.svelte`).** It lays out the editor/preview split and auto-saves `{ code, splitPct }` to localStorage. It also handles:
- share links (`#s=...`): the user's previous code is kept aside for a one-click restore.
- `?embed` mode: only the preview is shown, and the saved code is never touched.

**Sharing (`src/lib/share.ts`).** The code is deflate-raw compressed and base64url-encoded into the URL fragment with a `z` prefix. Browsers without `CompressionStream` get an uncompressed `u` fallback. Nothing is uploaded.

**Other components:**
- `Editor.svelte`: CodeMirror setup with completions, hover docs and highlighting.
- `Examples.svelte` + `examples.ts`: the grouped example sketches.
- `Help.svelte`: the in-app help.
- `Console.svelte`: the log and error panel.
