<script lang="ts">
  import { tick } from 'svelte';
  import { highlight } from './highlight';

  let {
    open = $bindable(false),
    onload
  }: {
    open?: boolean;
    /** Replace the editor's code with an example. */
    onload: (code: string, title: string) => void;
  } = $props();

  function load(code: string, title: string) {
    onload(code, title);
    open = false;
  }

  let dialog: HTMLDialogElement;
  let search = $state<HTMLInputElement>();
  let body = $state<HTMLDivElement>();
  let query = $state('');
  let copied = $state<string | null>(null);

  $effect(() => {
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      query = '';
      dialog.showModal();
      tick().then(() => search?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  // Esc clears the search first, and closes the dialog only when it is empty.
  function onSearchKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && query) {
      e.preventDefault();
      e.stopPropagation();
      query = '';
    }
  }

  function jump(id: string) {
    body?.querySelector('#' + id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  async function copy(code: string, key: string) {
    await navigator.clipboard.writeText(code);
    copied = key;
    setTimeout(() => {
      if (copied === key) {
        copied = null;
      }
    }, 1200);
  }

  const slug = (title: string) => 'help-' + title.toLowerCase().replace(/[^a-z]+/g, '-');
  const helperName = (signature: string) => signature.match(/^[\w.]+/)?.[0] ?? signature;

  function onBackdropClick(e: MouseEvent) {
    // Clicks on the dialog element itself (outside the panel) hit the backdrop.
    if (e.target === dialog) open = false;
  }

  type Helper = { signature: string; text: string; example: string };
  type Category = { title: string; note?: string; helpers: Helper[] };

  const quickStart = [
    'animate((t) => {',
    "  clear('#282c34')",
    '  grid()',
    '  axes()',
    '  circle(cos(t) * 60, sin(t) * 60, 10, palette(0))',
    '})'
  ].join('\n');

  const categories: Category[] = [
    {
      title: 'Canvas and view',
      helpers: [
        {
          signature: 'clear(color?)',
          text: 'Fill the whole canvas with a color, or make it transparent if omitted.',
          example: "clear('#282c34')"
        },
        {
          signature: 'grid(step?, color?, major?)',
          text: 'Grid lines across the visible area. step is the minor spacing in world units (default 10); major is the major spacing (default 5 * step, 0 or false for none). Minor lines are drawn at half opacity. Call it after clear().',
          example: "grid(10, 'rgba(255,255,255,0.25)', 50)"
        },
        {
          signature: 'axes(color?)',
          text: 'X and Y axes through the origin, with value labels. Call it after clear().',
          example: 'axes()'
        },
        {
          signature: 'fit(x, y, w, h)',
          text: 'Frame a world rectangle in the view, with a small margin. x, y is the bottom-left corner. Applies once per run and again when the arguments change, so you can still pan and zoom afterwards.',
          example: 'fit(-100, -100, 200, 200)'
        },
        {
          signature: 'px(n?)',
          text: 'n screen pixels expressed in world units (default 1). Pass it as a lineWidth or size to keep it the same on screen at any zoom.',
          example: "circle(0, 0, 40, false, 'white', px(2))"
        },
        {
          signature: 'lockView(pan?, zoom?)',
          text: 'Stops the user from moving the view: wheel, pinch, drag-to-pan, Alt+drag and the zoom keys, and hides the zoom and Reset buttons. pan and zoom both default to true, so lockView() locks both; lockView(true, false) locks only pan (the wheel then zooms around the center) and lockView(false, true) only zoom. fit() can still move the camera. The lock lasts until the code changes.',
          example: "lockView()\nfit(-100, -100, 200, 200)\nclear('#282c34')\ngrid()\ncircle(0, 0, 60, palette(2))\nhud('try to scroll or zoom')"
        }
      ]
    },
    {
      title: 'Shapes',
      note: 'fill is a color, or omitted/true for ctx.fillStyle, or false/null for no fill. stroke is a color, or true for ctx.strokeStyle; leave it out for no outline. As an object, { fill } fills and { stroke } outlines: circle(0, 0, 40, { stroke: \'white\', width: px(2) }).',
      helpers: [
        {
          signature: 'point(x, y, color?, size?)',
          text: 'Filled dot. size is the diameter (default 4).',
          example: "point(0, 0, 'tomato', 12)"
        },
        {
          signature: 'points(points, color?, size?)',
          text: 'A dot at every [x, y] in points.',
          example: 'points([[0, 0], [20, 10], [40, 30]], palette(1), 6)'
        },
        {
          signature: 'line(x1, y1, x2, y2, color?, lineWidth?)',
          text: 'Line segment.',
          example: 'line(-50, -50, 50, 50, palette(2), 2)'
        },
        {
          signature: 'polyline(points, color?, lineWidth?, closed?)',
          text: 'Lines through the [x, y] points in order. closed = true joins the ends.',
          example: "polyline([[0, 0], [40, 80], [80, 0]], 'white', 2, true)"
        },
        {
          signature: 'curve(x1, y1, cx, cy, x2, y2, color?, lineWidth?)',
          text: 'Quadratic Bezier curve from x1, y1 to x2, y2, pulled toward the control point cx, cy.',
          example: 'curve(-50, 0, 0, 80, 50, 0, palette(5), 2)'
        },
        {
          signature: 'circle(x, y, radius, fill?, stroke?, lineWidth?)',
          text: 'Circle centered at x, y.',
          example: "circle(0, 0, 40, 'hotpink', 'white', 2)"
        },
        {
          signature: 'ellipse(x, y, rx, ry, fill?, stroke?, lineWidth?, rotation?)',
          text: 'Ellipse centered at x, y with horizontal radius rx and vertical radius ry, rotated counterclockwise by rotation radians.',
          example: "ellipse(0, 0, 60, 30, palette(2), 'white', 2, PI / 6)"
        },
        {
          signature: 'arc(x, y, radius, start, end, color?, lineWidth?)',
          text: 'Part of a circle outline from angle start to end in radians, counterclockwise (clockwise when end < start).',
          example: 'arc(0, 0, 40, 0, PI * 1.5, palette(1), 4)'
        },
        {
          signature: 'rect(x, y, w, h, fill?, stroke?, lineWidth?)',
          text: 'Rectangle with its bottom-left corner at x, y, extending w to the right and h up.',
          example: 'rect(-40, -20, 80, 40, palette(3))'
        },
        {
          signature: 'poly(points, fill?, stroke?, lineWidth?)',
          text: 'Closed polygon through the [x, y] points, filled and/or stroked like circle().',
          example: "poly([[-40, -30], [40, -30], [0, 40]], palette(5), 'white', 2)"
        },
        {
          signature: 'text(str, x, y, color?, size?, align?)',
          text: "Text centered vertically at x, y. size is in world units (default 14). align is 'left' (default), 'center' or 'right'.",
          example: "text('Hello', 0, 0, 'white', 24, 'center')"
        },
        {
          signature: 'trail(id, x, y, color?, n?)',
          text: 'Remembers the last n positions (default 50) under id and draws them as a line that fades out. Call it once per frame, e.g. inside animate.',
          example: [
            'animate((t) => {',
            '  clear()',
            '  const x = cos(t) * 60, y = sin(t * 1.5) * 60',
            "  trail('orbit', x, y, palette(1), 80)",
            "  point(x, y, 'white', 8)",
            '})'
          ].join('\n')
        }
      ]
    },
    {
      title: 'Plots',
      note: "heat paints opaque cells over the whole view, so call it right after clear() and draw everything else on top. Ramps for heat and scatter: viridis (default), magma, inferno, plasma, cividis (color-blind safe), turbo, hot and gray for values from low to high; coolwarm for values on both sides of a middle (0.5 is neutral); vexel, the logo gradient. Or pass a function t => color.",
      helpers: [
        {
          signature: 'plot(f, color?, lineWidth?, from?, to?)',
          text: 'Graph of y = f(x) over the visible x range, or from..to. Leaves gaps where f is not a finite number.',
          example: 'plot((x) => 40 * sin(x / 20), palette(0), 2)'
        },
        {
          signature: 'plotParam(fx, fy, color?, lineWidth?, from?, to?)',
          text: 'Parametric curve x = fx(t), y = fy(t) for t from from to to (default 0 to 2*PI), with the interval last like plot. Leaves gaps where either is not a finite number.',
          example: 'plotParam((t) => 60 * sin(3 * t), (t) => 60 * sin(2 * t), palette(3), 2, 0, 2 * PI)'
        },
        {
          signature: 'plotPolar(f, color?, lineWidth?)',
          text: 'Graph of r = f(theta) for theta from 0 to 2*PI. Leaves gaps where f is not a finite number.',
          example: 'plotPolar((a) => 50 + 20 * cos(5 * a), palette(4), 2)'
        },
        {
          signature: 'contour(f, level?, color?, lineWidth?)',
          text: 'Draws the curve where f(x, y) = level (default 0), including every separate branch. Handy for circles, level sets and other implicit curves.',
          example: 'contour((x, y) => hypot(x, y) - 50, 0, palette(2), px(2))'
        },
        {
          signature: 'field(f, step?, color?, lineWidth?)',
          text: 'Vector field: f(x, y) returns [dx, dy] and an arrow is drawn every step world units (default 20). Arrows are as long as the vector but capped just below step; scale your vectors to taste.',
          example: 'field((x, y) => [-y, x], 20, palette(5))'
        },
        {
          signature: 'heat(f, ramp?, cell?)',
          text: "Colors the view by f(x, y), which returns a number from 0 to 1 (clamped). ramp is the name of a colormap ('viridis' by default) or a function t => color; the Plots note above lists the names. f is called once per square cell; cell sets its size in screen pixels (by default about 8 to 10, so the view holds about 10,000 cells). A cell of 1 samples every pixel: sharp, but much slower.",
          example: "heat((x, y) => 0.5 + 0.5 * sin(hypot(x, y) / 15), 'magma', 2)"
        },
        {
          signature: 'scatter(points, ramp?, size?)',
          text: "Dots from [x, y, value] points, colored by value (0 to 1, clamped) with a ramp, as in heat. size is the diameter (default 4).",
          example: "scatter(range(200).map((i) => [i - 100, 40 * sin(i / 10), i / 200]), 'turbo', 6)"
        },
        {
          signature: 'bars(list, width?, color?)',
          text: 'Bar chart from a list of numbers: bar i fills the slot from i * width (default 10) and is as tall as its value, in world units. color is one color or a function (i, value) => color.',
          example: 'bars([30, 80, 55, 120, 90], 20, (i) => palette(i))'
        },
        {
          signature: 'hist(list, bins?, color?)',
          text: 'Histogram of a list of numbers in bins (default 10) between their smallest and largest value. x is the data value and a bar is as tall as its count, in world units. Returns the counts.',
          example: 'hist(range(500).map(() => 100 * (random() + random() + random()) / 3), 20, palette(0))'
        }
      ]
    },
    {
      title: 'Colors',
      helpers: [
        {
          signature: 'palette(i)',
          text: 'The i-th color of a built-in 16-color palette. Wraps around, so any integer works.',
          example: 'circle(0, 0, 30, palette(2))'
        },
        {
          signature: 'hsl(h, s, l, a?)',
          text: 'Color string. h is degrees, s and l are 0-100, a is 0-1 (default 1).',
          example: 'point(0, 0, hsl(200, 80, 60), 20)'
        },
        {
          signature: 'rgb(r, g, b, a?)',
          text: 'Color string. r, g, b are 0-255, a is 0-1 (default 1).',
          example: 'rect(0, 0, 50, 50, rgb(255, 120, 0, 0.5))'
        }
      ]
    },
    {
      title: 'Numbers and random',
      note: 'range excludes its end (like Python) while linspace includes both ends (like NumPy).',
      helpers: [
        {
          signature: 'range(a, b, step?)',
          text: 'Numbers from a up to, but not including, b in steps of step (default 1). range(n) counts from 0 to n - 1. A negative step counts down; a step pointing away from b gives an empty list.',
          example: 'points(range(-100, 101, 20).map((x) => [x, x * x / 100]), palette(0), 6)'
        },
        {
          signature: 'linspace(a, b, n)',
          text: 'n evenly spaced numbers from a to b, both included. Handy for sampling a curve.',
          example: 'polyline(linspace(0, PI * 2, 60).map((a) => [cos(a) * 50, sin(a) * 50]), palette(2), 2, true)'
        },
        {
          signature: 'lerp(a, b, t)',
          text: 'The value t of the way from a to b: lerp(10, 20, 0.5) is 15. t is not clamped, so values outside 0..1 extrapolate.',
          example: "circle(lerp(-80, 80, 0.25), 0, 20, hsl(lerp(200, 320, 0.25), 80, 60))"
        },
        {
          signature: 'normalize(list)',
          text: 'The list rescaled so its smallest number becomes 0 and its largest 1. All-equal lists become all 0, and entries that are not finite numbers become NaN. Good for scatter and heat values.',
          example: "const ys = range(40).map((i) => sin(i / 5) * 30 + i)\nscatter(ys.map((y, i) => [i * 5, y, normalize(ys)[i]]), 'viridis', 6)"
        },
        {
          signature: 'bounds(points)',
          text: 'The rectangle around [[x, y], ...] as [x, y, w, h], with x, y the bottom-left corner. Pass it straight to fit. Points that are not finite are ignored; an empty list gives [0, 0, 0, 0].',
          example: "const pts = range(30).map((i) => [i * 8, 40 * sin(i / 4)])\npoints(pts, 6, palette(1))\nfit(...bounds(pts))"
        },
        {
          signature: 'random(a?, b?)',
          text: 'Seeded random number: random() is 0..1, random(b) is 0..b, random(a, b) is a..b, and random(list) picks an item. The sequence restarts on every run, so panning or moving a slider redraws the same picture.',
          example: "const colors = [palette(0), palette(4), palette(6)]\nrange(200).forEach(() => {\n  point(random(-150, 150), random(-100, 100), random(colors), random(2, 8))\n})"
        },
        {
          signature: 'seed(n)',
          text: 'Restarts random() and gauss() from seed n, for a different but still repeatable sequence. Every run starts from seed 1.',
          example: "seed(slider('seed', 1, 100, 1, 1))\nrange(30).forEach(() => {\n  const x = random(-150, 150)\n  const y = random(-100, 100)\n  circle(x, y, random(5, 25), hsl(random(360), 70, 60, 0.6))\n})"
        },
        {
          signature: 'gauss(mean?, sd?)',
          text: 'Seeded normally distributed number with the given mean (default 0) and standard deviation (default 1). Most values land within 2 sd of the mean.',
          example: "clear('#282c34')\naxes()\nhist(range(2000).map(() => gauss(100, 25)), 30)\nfit(0, -10, 200, 280)"
        }
      ]
    },
    {
      title: 'Animation and state',
      helpers: [
        {
          signature: 'every(seconds, fn?, key?)',
          text: 'Use inside animate. True once every given number of seconds (the first time one period in), and calls fn when it is. Calls with the same period and function share a timer; pass a key to tell them apart.',
          example: "let hue = 0\nanimate(() => {\n  every(0.5, () => (hue += 40))\n  clear('#282c34')\n  circle(0, 0, 60, hsl(hue, 80, 60))\n})"
        },
        {
          signature: 'once(fn, key?)',
          text: 'Calls fn the first time and returns the same result after that: on later frames, and when panning, zooming or a control re-runs the sketch. Use it for expensive setup or state that should survive re-runs. Editing the code starts over. Without a key, functions with identical source share a result; pass a key to tell them apart.',
          example: "const stars = once(() =>\n  range(300).map(() => [Math.random() * 400 - 200, Math.random() * 300 - 150])\n)\nclear('#14161b')\npoints(stars, 3, 'white')\nhud('pan around: the stars stay put')"
        }
      ]
    },
    {
      title: 'Controls',
      note: 'slider, toggle, select and button are drawn in the top-right corner in screen pixels, on top of the sketch, so they ignore pan and zoom. Call clear() first in animated sketches so they do not smear. Slider, toggle and select values survive re-runs.',
      helpers: [
        {
          signature: 'slider(name, min, max, value?, step?)',
          text: 'Adds a slider to the top-right of the preview and returns its current value (default min).',
          example: "const r = slider('radius', 5, 100, 40)\ncircle(0, 0, r, palette(0))"
        },
        {
          signature: 'toggle(name, value?)',
          text: 'Adds a checkbox next to the sliders and returns whether it is on (default off).',
          example: "if (toggle('grid', true)) {\n  grid()\n}"
        },
        {
          signature: 'select(name, options, value?)',
          text: 'Adds a chooser next to the sliders and returns the chosen option, which can be any value. Click its left half to go back and its right half to go forward. value is the initial option (default: the first).',
          example: "const ramp = select('ramp', ['viridis', 'plasma', 'coolwarm'])\nheat((x, y) => 0.5 + 0.5 * sin(x / 20), ramp)"
        },
        {
          signature: 'button(name)',
          text: 'Adds a button to the control panel. Returns true for the one frame after it is clicked (or the one re-run, in a sketch without animate).',
          example: "let n = 0\nanimate(() => {\n  if (button('add a dot')) {\n    n++\n  }\n  clear('#282c34')\n  range(n).forEach((i) => circle(i * 30 - 150, 0, 10, palette(i)))\n})"
        }
      ]
    },
    {
      title: 'Mouse and keyboard',
      note: 'Click the preview first to give it keyboard focus.',
      helpers: [
        {
          signature: 'mouse.clicked',
          text: 'True for the one frame after the left button goes down on the sketch. Clicks on controls do not count.',
          example: "const dots = []\nanimate(() => {\n  if (mouse.clicked) {\n    dots.push([mouse.x, mouse.y])\n  }\n  clear('#282c34')\n  points(dots, palette(2), 12)\n  hud('click to add dots')\n})"
        },
        {
          signature: 'key(name)',
          text: "True while the key is held, e.g. 'ArrowLeft', 'a' or 'Space'. Click the preview first to give it keyboard focus.",
          example: [
            'let x = 0',
            'animate(() => {',
            '  clear()',
            "  if (key('ArrowRight')) {",
            '    x += 2',
            '  }',
            '  circle(x, 0, 10, palette(1))',
            '})'
          ].join('\n')
        },
        {
          signature: 'hover(x, y, r)',
          text: 'True while the pointer is within r world units of x, y (r scales with zoom, unlike drag). Sketches without animate re-run when the result changes.',
          example: 'circle(0, 0, 30, hover(0, 0, 30) ? palette(1) : palette(0))'
        },
        {
          signature: 'drag(id, x, y, r?, color?)',
          text: 'A round handle the user can drag with the left button, starting at x, y. Returns its current [x, y]. The position survives re-runs and code edits; rename the id to start over. r is the radius in screen pixels (default 8), so handles keep their size at any zoom, unlike hover. Handles are drawn on top of the sketch, like the controls.',
          example: "const [ax, ay] = drag('a', -80, -40, 8, palette(0))\nconst [bx, by] = drag('b', 80, 40, 8, palette(1))\nclear('#282c34')\ngrid()\nline(ax, ay, bx, by, 'white', px(2))\nhud('length ' + hypot(bx - ax, by - ay).toFixed(1))"
        }
      ]
    },
    {
      title: 'Output',
      helpers: [
        {
          signature: 'hud(...lines)',
          text: 'Shows text in the top-left corner for this frame. Each argument is a line; an object prints key: value lines.',
          example: 'hud({ fps: frame.fps, x: mouse.x, y: mouse.y })'
        },
        {
          signature: 'log(...values)',
          text: 'Prints values to the console panel under the editor, separated by spaces. Objects and arrays are shown as JSON. console.log, info, warn and error end up there too. Identical consecutive lines are folded into a counter, the panel clears on every run, and in exported pages log prints to the browser console.',
          example: "log('mouse', mouse.x, mouse.y)"
        }
      ]
    }
  ];

  const searching = $derived(query.trim() !== '');

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return categories;
    }
    return categories
      .map((category) => ({
        ...category,
        helpers: category.helpers.filter((h) => (h.signature + ' ' + h.text).toLowerCase().includes(q))
      }))
      .filter((category) => category.helpers.length);
  });

  const shortcuts: [string, string][] = [
    ['F1', 'Open this help'],
    ['Cmd/Ctrl + Enter', 'Run now (the code also re-runs as you type)'],
    ['Wheel / trackpad scroll', 'Pan'],
    ['Middle or right drag, Space + drag', 'Pan'],
    ['Alt/Option + drag', 'Zoom to the selected area (Esc cancels)'],
    ['Alt/Option + click', 'Zoom out 2x around the point'],
    ['Pinch / Ctrl + wheel', 'Zoom at the cursor'],
    ['+  /  -', 'Zoom in / out'],
    ['Ctrl + Space', 'Autocomplete']
  ];
</script>

{#snippet loadIcon()}
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path fill="currentColor" d="M4 2.2v11.6a.6.6 0 0 0 .92.5l9-5.8a.6.6 0 0 0 0-1l-9-5.8A.6.6 0 0 0 4 2.2z" />
  </svg>
{/snippet}

{#snippet copyIcon(done: boolean)}
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    {#if done}
      <path d="m3 8.5 3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    {:else}
      <rect x="5.5" y="5.5" width="8" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v6.5A1.5 1.5 0 0 0 4 11h.5" fill="none" stroke="currentColor" stroke-width="1.4" />
    {/if}
  </svg>
{/snippet}

{#snippet example(code: string, title: string)}
  <div class="example-wrap">
    <pre class="example"><code>{@html highlight(code)}</code></pre>
    <div class="tools">
      <button
        class="tool"
        onclick={() => copy(code, title)}
        title={copied === title ? 'Copied' : 'Copy to the clipboard'}
        aria-label="Copy the {title} example"
      >
        {@render copyIcon(copied === title)}
      </button>
      <button
        class="tool run"
        onclick={() => load(code, title)}
        title="Replace the editor's code with this example and run it"
        aria-label="Load the {title} example into the editor and run it"
      >
        {@render loadIcon()}
      </button>
    </div>
  </div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} onclose={() => (open = false)} onclick={onBackdropClick}>
  <div class="panel">
    <header>
      <h2>Help</h2>
      <input
        bind:this={search}
        bind:value={query}
        class="search"
        type="search"
        placeholder="Search helpers…"
        aria-label="Search helpers"
        onkeydown={onSearchKey}
      />
      <button class="close" onclick={() => (open = false)} aria-label="Close help">✕</button>
    </header>

    <div class="columns">
      <nav class="toc" aria-label="Help sections">
        {#if !searching}
          <button onclick={() => jump('help-basics')}>Basics</button>
          <button onclick={() => jump('help-globals')}>Globals</button>
        {/if}
        {#each filtered as category (category.title)}
          <button onclick={() => jump(slug(category.title))}>
            {category.title}
            <span class="count">{category.helpers.length}</span>
          </button>
        {/each}
        {#if !searching}
          <button onclick={() => jump('help-shortcuts')}>Shortcuts</button>
        {/if}
      </nav>

      <div class="body" bind:this={body}>
        {#if !searching}
          <section id="help-basics">
            <h3>Basics</h3>
            <p>
              The canvas is infinite: draw in world coordinates, where <code>(0, 0)</code> is the
              origin and Y grows upward, like in a math plot. Pan and zoom the preview to explore.
            </p>
            <p>
              Call <code>animate((t, dt) =&gt; &#123; … &#125;)</code> to draw every frame:
              <code>t</code> is seconds since the run started, <code>dt</code> seconds since the last
              call. <code>animate(fn, 0.5)</code> calls <code>fn</code> every half second instead.
              Without <code>animate</code>, the code re-runs whenever the view or a control changes.
            </p>
            <p>
              Every helper takes its arguments in the same order: geometry first, then colors,
              then size or line width, then extras. Instead of the style arguments you can pass
              one object, for example <code>line(0, 0, 50, 50, &#123; color: 'red', width: 3 &#125;)</code>
              or <code>ellipse(0, 0, 60, 30, &#123; fill: 'teal', rotation: 0.5 &#125;)</code>.
            </p>
            <p>
              Left-out styles fall back to the current <code>ctx</code> styles, and helpers never
              change them. Each run starts with light ink and lines 1 screen pixel wide.
            </p>
            {@render example(quickStart, 'quick start')}
            <p>
              The <strong>Examples</strong> menu in the header has ready-made sketches; each card lists
              the helpers it uses.
            </p>
          </section>

          <section id="help-globals">
            <h3>Globals</h3>
            <dl>
              <dt><code>canvas</code>, <code>ctx</code></dt>
              <dd>The canvas and its 2D context, already set up for the world camera.</dd>
              <dt><code>view</code></dt>
              <dd>
                Visible world area:
                <code>x, y, zoom, left, top, right, bottom, width, height</code>.
              </dd>
              <dt><code>mouse</code></dt>
              <dd>
                Pointer in world coordinates: <code>x, y, down</code>, and <code>clicked</code>,
                true for the one frame after a click on the sketch.
              </dd>
              <dt><code>frame</code></dt>
              <dd>
                <code>n</code> (frame index), <code>time</code> and <code>dt</code> (seconds),
                <code>fps</code> (smoothed).
              </dd>
              <dt><code>sin, cos, PI, …</code></dt>
              <dd>
                Every <code>Math</code> function and constant is global, except <code>log</code>,
                which prints (use <code>Math.log</code>), and <code>random</code>, which is seeded
                (use <code>Math.random</code> for unseeded numbers).
              </dd>
            </dl>
          </section>
        {/if}

        {#each filtered as category (category.title)}
          <section id={slug(category.title)}>
            <h3>{category.title}</h3>
            {#if category.note && !searching}
              <p class="note">{category.note}</p>
            {/if}
            {#each category.helpers as helper (helper.signature)}
              {@const name = helperName(helper.signature)}
              <div class="entry">
                <code class="signature"
                  ><span class="name">{name}</span><span class="params"
                    >{helper.signature.slice(name.length)}</span
                  ></code
                >
                <p class="description">{helper.text}</p>
                {@render example(helper.example, helper.signature)}
              </div>
            {/each}
          </section>
        {:else}
          <p class="empty">No helpers match “{query}”.</p>
        {/each}

        {#if !searching}
          <section id="help-shortcuts">
            <h3>Shortcuts</h3>
            <dl class="keys">
              {#each shortcuts as [keys, text] (keys)}
                <dt><kbd>{keys}</kbd></dt>
                <dd>{text}</dd>
              {/each}
            </dl>
          </section>
        {/if}
      </div>
    </div>
  </div>
</dialog>

<style>
  dialog {
    width: min(960px, calc(100vw - 32px));
    height: min(820px, calc(100vh - 64px));
    padding: 0;
    color: var(--text);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  }
  dialog::backdrop {
    background: rgba(5, 6, 10, 0.6);
  }
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    margin: 0;
    font-size: 15px;
  }
  .search {
    flex: 1;
    max-width: 360px;
    margin-left: auto;
    padding: 6px 10px;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font: inherit;
    outline: none;
  }
  .search:focus {
    border-color: var(--accent);
  }
  .columns {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .toc {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 190px;
    flex-shrink: 0;
    padding: 10px 8px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }
  .toc button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    color: var(--muted);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
  }
  .toc button:hover {
    color: var(--text);
    background: var(--bg);
  }
  .count {
    color: var(--muted);
    font-size: 11px;
    opacity: 0.7;
  }
  @media (max-width: 720px) {
    .toc {
      display: none;
    }
  }
  .empty {
    padding: 32px 0;
    color: var(--muted);
    text-align: center;
  }
  .close {
    padding: 2px 8px;
    color: var(--muted);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
  }
  .close:hover {
    color: var(--text);
    border-color: var(--border);
  }
  .body {
    flex: 1;
    padding: 4px 20px 24px;
    overflow: auto;
  }
  section {
    scroll-margin-top: 8px;
  }
  h3 {
    margin: 20px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  p {
    margin: 6px 0;
    line-height: 1.5;
  }
  .note {
    color: var(--muted);
    font-size: 12px;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 16px;
    margin: 6px 0;
  }
  dt,
  dd {
    margin: 0;
  }
  dd {
    color: var(--muted);
  }
  .entry {
    margin: 10px 0 14px;
  }
  .signature {
    display: block;
    overflow-wrap: anywhere;
  }
  .signature .name {
    color: #61afef;
    font-weight: 600;
  }
  .signature .params {
    color: var(--muted);
  }
  .description {
    margin: 2px 0 4px;
    color: var(--muted);
  }
  .example-wrap {
    position: relative;
    margin: 4px 0 0;
  }
  .example {
    margin: 0;
    padding: 6px 72px 6px 10px;
    overflow-x: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
  .tools {
    position: absolute;
    top: 5px;
    right: 6px;
    display: flex;
    gap: 4px;
  }
  .tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 22px;
    padding: 0;
    color: var(--muted);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
  }
  .tool:hover {
    color: var(--text);
    border-color: var(--accent);
  }
  .tool.run:hover {
    color: #fff;
    background: var(--accent);
  }
  .example code {
    color: var(--text);
    white-space: pre-wrap;
  }
  /* Colors match the editor's One Dark theme. */
  .example :global(.tok-comment) {
    color: #7d8799;
    font-style: italic;
  }
  .example :global(.tok-string) {
    color: #98c379;
  }
  .example :global(.tok-number),
  .example :global(.tok-constant) {
    color: #d19a66;
  }
  .example :global(.tok-keyword) {
    color: #c678dd;
  }
  .example :global(.tok-function) {
    color: #61afef;
  }
  .example :global(.tok-operator) {
    color: #56b6c2;
  }
  code,
  kbd {
    font: 12px ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  }
  code {
    color: #c8d0ff;
  }
  kbd {
    padding: 1px 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
</style>
