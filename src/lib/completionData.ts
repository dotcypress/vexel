import { snippetCompletion, type Completion } from '@codemirror/autocomplete';

// Snippet placeholders use the CodeMirror syntax: ${name} or ${}.
function fn(label: string, params: string, info: string, snippet?: string): Completion {
  return {
    ...snippetCompletion(snippet ?? label + '(${})', {
      label,
      type: 'function',
      detail: '(' + params + ')',
      info
    }),
    boost: 2
  };
}

// Sketch globals, mirrored from the runtime in runtime.ts.
export const SKETCH: Completion[] = [
  {
    ...snippetCompletion('animate((t, dt) => {\n\t${}\n});', {
      label: 'animate',
      type: 'function',
      detail: '(fn, interval?)',
      info: 'Calls fn(t, dt) every frame, or every interval seconds if given: t is seconds since the run started, dt is seconds since the last call.'
    }),
    boost: 3
  },
  { label: 'canvas', type: 'variable', info: 'The HTMLCanvasElement.' },
  { label: 'ctx', type: 'variable', info: 'CanvasRenderingContext2D, already set to the world camera.' },
  {
    label: 'view',
    type: 'variable',
    info: 'Visible world area: { x, y, zoom, left, top, right, bottom, width, height }.'
  },
  { label: 'mouse', type: 'variable', info: 'Pointer in world coordinates: { x, y, down, clicked }. clicked is true for one frame after a click on the sketch.' },
  {
    label: 'frame',
    type: 'variable',
    info: 'Frame info: { n, time, dt, fps }. n is the frame index, time and dt are in seconds.'
  },

  fn('clear', 'color?', 'Fill the whole canvas with color, or make it transparent if omitted.'),
  fn('point', 'x, y, color?, size?', 'Filled dot. size is the diameter (default 4).', 'point(${x}, ${y})'),
  fn('line', 'x1, y1, x2, y2, color?, lineWidth?', 'Line segment.', 'line(${x1}, ${y1}, ${x2}, ${y2})'),
  fn('points', 'points, color?, size?', 'A dot at every [x, y] in points.', 'points(${points})'),
  fn(
    'polyline',
    'points, color?, lineWidth?, closed?',
    'Lines through the [x, y] points in order. closed = true joins the ends.',
    'polyline(${points})'
  ),
  fn(
    'circle',
    'x, y, radius, fill?, stroke?, lineWidth?',
    'fill: color, omit/true for ctx.fillStyle, false/null for none. stroke: color, true for ctx.strokeStyle, omit for none.',
    'circle(${x}, ${y}, ${radius})'
  ),
  fn(
    'ellipse',
    'x, y, rx, ry, fill?, stroke?, lineWidth?, rotation?',
    'Ellipse centered at x, y with radii rx, ry, rotated by rotation radians. fill and stroke work like circle().',
    'ellipse(${x}, ${y}, ${rx}, ${ry})'
  ),
  fn(
    'arc',
    'x, y, radius, start, end, color?, lineWidth?',
    'Stroked arc of a circle from angle start to end in radians, counterclockwise (clockwise if end < start).',
    'arc(${x}, ${y}, ${radius}, ${0}, ${PI})'
  ),
  fn(
    'poly',
    'points, fill?, stroke?, lineWidth?',
    'Closed polygon through the [x, y] points. fill and stroke work like circle().',
    'poly(${points})'
  ),
  fn(
    'rect',
    'x, y, w, h, fill?, stroke?, lineWidth?',
    'x, y is the bottom-left corner; w goes right, h goes up. fill and stroke work like circle().',
    'rect(${x}, ${y}, ${w}, ${h})'
  ),
  fn(
    'grid',
    'step?, color?, major?',
    'Grid lines across the visible area. step is the minor spacing in world units (default 10); major is the major spacing (default 5 * step, 0 or false for none). Minor lines are drawn at half opacity. Call it after clear().',
    'grid()'
  ),
  fn(
    'axes',
    'color? | { color, xLabel, yLabel, step }',
    'X and Y axes through the origin, with value labels. Call it after clear(). Pass an object for axis names and a label step.',
    'axes()'
  ),
  fn(
    'palette',
    'i',
    'The i-th color of a built-in 16-color palette. Wraps around, so any integer works.',
    'palette(${i})'
  ),
  fn(
    'hsl',
    'h, s, l, a?',
    'Color string. h is degrees, s and l are 0-100, a is 0-1 (default 1).',
    'hsl(${h}, ${s}, ${l})'
  ),
  fn(
    'rgb',
    'r, g, b, a?',
    'Color string. r, g, b are 0-255, a is 0-1 (default 1).',
    'rgb(${r}, ${g}, ${b})'
  ),
  fn(
    'text',
    'str, x, y, color?, size?, align?',
    "Text centered vertically at x, y. size is in world units (default 14). align: 'left' (default), 'center' or 'right'.",
    'text(${str}, ${x}, ${y})'
  ),
  fn(
    'plot',
    'f, color?, lineWidth?, from?, to?',
    'Graph of y = f(x) over the visible x range, or from..to. Gaps where f is not a finite number.',
    'plot((x) => ${})'
  ),
  fn(
    'slider',
    'name, min, max, value?, step?',
    'Adds a slider to the preview and returns its current value (default min). The value survives re-runs.',
    'slider("${name}", ${min}, ${max})'
  ),
  fn(
    'hud',
    '...lines',
    'Shows text in the top-left corner for this frame. Each argument is a line; an object prints key: value lines.',
    'hud(${})'
  ),
  fn(
    'plotPolar',
    'f, color?, lineWidth?',
    'Graph of r = f(theta) for theta from 0 to 2*PI. Gaps where f is not a finite number.',
    'plotPolar((theta) => ${})'
  ),
  fn(
    'plotParam',
    'fx, fy, color?, lineWidth?, from?, to?',
    'Parametric curve x = fx(t), y = fy(t) for t from from to to (default 0 to 2*PI). Gaps where either is not a finite number.',
    'plotParam((t) => ${}, (t) => ${})'
  ),
  fn(
    'toggle',
    'name, value?',
    'Adds a checkbox to the slider panel and returns whether it is on (default off). The state survives re-runs.',
    'toggle("${name}")'
  ),
  fn(
    'key',
    'name',
    "True while the key is held, e.g. key('ArrowLeft'), key('a'), key('Space'). Click the preview to give it keyboard focus.",
    'key("${name}")'
  ),
  fn(
    'fit',
    'x, y, w, h',
    'Frames a world rectangle in the view: x, y is the bottom-left corner. Applies once per run and again when the arguments change.',
    'fit(${x}, ${y}, ${w}, ${h})'
  ),
  fn(
    'curve',
    'x1, y1, cx, cy, x2, y2, color?, lineWidth?',
    'Quadratic Bezier curve from x1, y1 to x2, y2, pulled toward the control point cx, cy.',
    'curve(${x1}, ${y1}, ${cx}, ${cy}, ${x2}, ${y2})'
  ),
  fn(
    'px',
    'n?',
    'n screen pixels in world units (default 1), for line widths and sizes that ignore zoom: line(..., px(2)).',
    'px(${2})'
  ),
  fn(
    'field',
    'f, step?, color?, lineWidth?',
    'Vector field: f(x, y) returns [dx, dy] and an arrow is drawn every step world units (default 20), as long as the vector but capped below step.',
    'field((x, y) => [${dx}, ${dy}])'
  ),
  fn(
    'heat',
    'f, ramp?, cell?',
    "Colors the view by f(x, y), a number from 0 to 1. ramp: a colormap name ('viridis' default, 'magma', 'inferno', 'plasma', 'cividis', 'turbo', 'hot', 'coolwarm', 'gray', 'vexel') or a function t => color. cell: cell size in screen pixels (default about 8-10; 1 for every pixel). Opaque: draw it first.",
    'heat((x, y) => ${})'
  ),
  fn(
    'hover',
    'x, y, r',
    'True while the pointer is within r world units of x, y (r scales with zoom, unlike drag). Static sketches re-run when the result changes.',
    'hover(${x}, ${y}, ${r})'
  ),
  fn(
    'trail',
    'id, x, y, color?, n?',
    'Remembers the last n positions (default 50) under id and draws them fading out. Call it once per frame, e.g. in animate.',
    'trail("${id}", ${x}, ${y})'
  ),
  fn(
    'contour',
    'f, level?, color?, lineWidth?',
    'Draws the curve where f(x, y) = level (default 0), e.g. contour((x, y) => hypot(x, y) - 50).',
    'contour((x, y) => ${})'
  ),
  fn(
    'select',
    'name, options, value?',
    'Adds a chooser to the control panel and returns the chosen option (any value). Click the left half to go back, the right half to go forward. The choice survives re-runs.',
    'select("${name}", [${}])'
  ),
  fn(
    'scatter',
    'points, ramp?, size?',
    "Dots from [x, y, value] points, colored by value (0 to 1). ramp: a colormap name ('viridis' default, 'magma', 'inferno', 'plasma', 'cividis', 'turbo', 'hot', 'coolwarm', 'gray', 'vexel') or a function t => color.",
    'scatter(${points})'
  ),
  fn(
    'bars',
    'list, width?, color?',
    'Bar chart from numbers: bar i fills the slot from i * width (default 10), as tall as its value. color is one color or (i, value) => color.',
    'bars(${list})'
  ),
  fn(
    'hist',
    'list, bins?, color?',
    'Histogram of numbers in bins (default 10) across their range: x is the value, height is the count. Returns the counts.',
    'hist(${list})'
  ),
  fn(
    'log',
    '...values',
    'Prints values to the console panel under the editor, separated by spaces. Objects and arrays are shown as JSON.',
    'log(${})'
  ),
  fn(
    'range',
    'a, b, step?',
    'Numbers from a up to, but not including, b in steps of step (default 1). range(n) counts from 0 to n - 1. Use a negative step to count down.',
    'range(${a}, ${b})'
  ),
  fn(
    'linspace',
    'a, b, n',
    'n evenly spaced numbers from a to b, both included. Handy for sampling a curve.',
    'linspace(${a}, ${b}, ${n})'
  ),
  fn(
    'bounds',
    'points',
    'The rectangle around [[x, y], ...] as [x, y, w, h] (x, y is the bottom-left corner), ready for fit(...bounds(points)).',
    'bounds(${points})'
  ),
  fn(
    'normalize',
    'list',
    'The list rescaled so its smallest number becomes 0 and its largest 1. Good for scatter and heat values.',
    'normalize(${list})'
  ),
  fn(
    'lerp',
    'a, b, t',
    'The value t of the way from a to b: lerp(10, 20, 0.5) is 15. t is not clamped.',
    'lerp(${a}, ${b}, ${t})'
  ),
  fn(
    'random',
    'a?, b?',
    'Seeded random number: random() is 0..1, random(b) is 0..b, random(a, b) is a..b, random(list) picks an item. The same on every re-run; call seed(n) for a different sequence.',
    'random(${})'
  ),
  fn(
    'seed',
    'n',
    'Restarts random() and gauss() from seed n. Every run starts from seed 1.',
    'seed(${1})'
  ),
  fn(
    'gauss',
    'mean?, sd?',
    'Seeded normally distributed number with the given mean (default 0) and standard deviation (default 1).',
    'gauss(${})'
  ),
  fn(
    'once',
    'fn, key?',
    'Calls fn the first time and returns the same result after that, across frames and re-runs from panning or controls. Editing the code starts over. Pass a key to tell apart functions with the same source.',
    'once(() => ${})'
  ),
  fn(
    'button',
    'name',
    'Adds a button to the control panel. Returns true for the one frame (or re-run) after it is clicked.',
    'button("${name}")'
  ),
  fn(
    'every',
    'seconds, fn?, key?',
    'Inside animate: true once every given number of seconds, and calls fn when it is. Calls with the same period and function share a timer; pass a key to separate them.',
    'every(${1}, () => ${})'
  ),
  fn(
    'drag',
    'id, x, y, r?, color?',
    'A handle the user can drag, starting at x, y. Returns its current [x, y]. The position survives re-runs and code edits. r is the grab radius in screen pixels (default 8), so it keeps its size at any zoom.',
    'drag("${id}", ${x}, ${y})'
  ),
  fn(
    'lockView',
    'pan?, zoom?',
    'Stops the user from panning and/or zooming. Both default to true: lockView() locks both, lockView(true, false) only pan, lockView(false, true) only zoom. fit() still works. Editing the code clears the lock.',
    'lockView()'
  ),
  fn(
    "arrow",
    "x1, y1, x2, y2, color?, lineWidth?, head?",
    "Line with a filled arrowhead at x2, y2. head is in screen pixels (default 8).",
    "arrow(${x1}, ${y1}, ${x2}, ${y2})"
  ),
  fn(
    "bezier",
    "x1, y1, c1x, c1y, c2x, c2y, x2, y2, color?, lineWidth?",
    "Cubic Bezier curve from x1, y1 to x2, y2 with two control points.",
    "bezier(${x1}, ${y1}, ${c1x}, ${c1y}, ${c2x}, ${c2y}, ${x2}, ${y2})"
  ),
  fn(
    "spline",
    "points, color?, lineWidth?, closed?",
    "Smooth curve through every [x, y] point (Catmull-Rom).",
    "spline(${points})"
  ),
  fn(
    "wedge",
    "x, y, radius, start, end, fill?, stroke?, lineWidth?",
    "Pie slice from angle start to end (radians). fill and stroke work like circle().",
    "wedge(${x}, ${y}, ${radius}, ${start}, ${end})"
  ),
  fn(
    "label",
    "str, x, y, color?, size?, align?",
    "Text at a world point with size in screen pixels (default 12), readable at any zoom.",
    "label(${str}, ${x}, ${y})"
  ),
  fn(
    "image",
    "src, x, y, w?, h?",
    "Picture with its bottom-left corner at x, y. Loads in the background; returns whether it was drawn.",
    "image(${src}, ${x}, ${y})"
  ),
  fn(
    "transform",
    "fn, { x?, y?, rotate?, scale? }",
    "Calls fn with the world moved, rotated and scaled, then restores it.",
    "transform(() => ${}, { x: 0, y: 0 })"
  ),
  fn(
    "add",
    "a, b",
    "Sum of two [x, y] vectors.",
    "add(${a}, ${b})"
  ),
  fn(
    "sub",
    "a, b",
    "Difference a - b of two [x, y] vectors.",
    "sub(${a}, ${b})"
  ),
  fn(
    "scale",
    "v, k",
    "The vector v times k.",
    "scale(${v}, ${k})"
  ),
  fn(
    "dot",
    "a, b",
    "Dot product of two [x, y] vectors.",
    "dot(${a}, ${b})"
  ),
  fn(
    "len",
    "v",
    "Length of an [x, y] vector.",
    "len(${v})"
  ),
  fn(
    "dist",
    "a, b",
    "Distance between two [x, y] points, or dist(x1, y1, x2, y2).",
    "dist(${a}, ${b})"
  ),
  fn(
    "norm",
    "v",
    "The vector scaled to length 1 ([0, 0] stays [0, 0]).",
    "norm(${v})"
  ),
  fn(
    "rot",
    "v, angle, around?",
    "v rotated by angle radians counterclockwise around a point (default the origin).",
    "rot(${v}, ${angle})"
  ),
  fn(
    "angle",
    "v",
    "Direction of an [x, y] vector in radians.",
    "angle(${v})"
  ),
  fn(
    "polar",
    "r, theta",
    "The [x, y] at distance r in direction theta.",
    "polar(${r}, ${theta})"
  ),
  fn(
    "intersect",
    "a1, a2, b1, b2",
    "Where segment a1-a2 crosses segment b1-b2, as [x, y], or null.",
    "intersect(${a1}, ${a2}, ${b1}, ${b2})"
  ),
  fn(
    "clamp",
    "x, lo?, hi?",
    "x limited to lo..hi (default 0..1).",
    "clamp(${x})"
  ),
  fn(
    "map",
    "x, a1, b1, a2?, b2?",
    "x rescaled from a1..b1 to a2..b2 (default 0..1). Not clamped.",
    "map(${x}, ${a1}, ${b1}, ${a2}, ${b2})"
  ),
  fn(
    "smoothstep",
    "a, b, x",
    "0 below a, 1 above b, a smooth S-curve in between.",
    "smoothstep(${a}, ${b}, ${x})"
  ),
  fn(
    "ease",
    "t, kind?",
    "Easing for t in 0..1: 'linear', 'in', 'out', 'inOut' (default), 'sine', 'back', 'elastic', 'bounce'.",
    "ease(${t})"
  ),
  fn(
    "noise",
    "x, y?, z?",
    "Seeded Perlin noise in 0..1, smooth over about one unit: noise(x / 50, y / 50).",
    "noise(${x}, ${y})"
  ),
  fn(
    "mix",
    "c1, c2, t?",
    "The color c1 mixed t of the way (default 0.5) toward c2.",
    "mix(${c1}, ${c2}, ${t})"
  ),
  fn(
    "alpha",
    "color, a",
    "The color with its opacity multiplied by a.",
    "alpha(${color}, ${0.5})"
  ),
  fn(
    "ramp",
    "name, t",
    "The color at t (0..1) of a ramp such as 'viridis'.",
    "ramp('${viridis}', ${t})"
  ),
  fn(
    "legend",
    "entries, title?",
    "Legend under the hud for this frame: [[label, color], ...] or { label: color }.",
    "legend([[${}]])"
  ),
  fn(
    "colorbar",
    "ramp?, min?, max?, title?",
    "Color bar for a ramp with its value range, under the hud.",
    "colorbar(${})"
  ),
  fn(
    "pause",
    "on?",
    "pause() toggles, pause(true/false) sets. Returns whether animation is paused.",
    "pause(${})"
  ),
  fn(
    "step",
    "",
    "While paused, advances the animation by one 1/60 s frame.",
    "step()"
  ),
  fn(
    "slider2d",
    "name, min?, max?, value?",
    "Adds an x/y pad to the control panel. Returns [x, y], each from min to max (default -1..1).",
    "slider2d(\"${name}\")"
  ),
  fn(
    "swatch",
    "name, value?",
    "Adds a palette color picker to the control panel. Returns the chosen color.",
    "swatch(\"${name}\")"
  ),
  fn(
    "textBox",
    "str, x, y, color?, size?, align?",
    "Text on a dark backdrop in screen pixels, split into lines at \\n. x, y is the top-left corner.",
    "textBox(${str}, ${x}, ${y})"
  ),
  fn(
    "dims",
    "x1, y1, x2, y2, text?, color?, offset?",
    "Dimension line between two points with arrows and a label (default: the distance). offset in screen pixels (default 16).",
    "dims(${x1}, ${y1}, ${x2}, ${y2})"
  ),
  fn(
    "grid2d",
    "cols, rows, fn",
    "Calls fn(col, row, i) for every cell and returns the results as a list.",
    "grid2d(${cols}, ${rows}, (col, row, i) => ${})"
  ),
  fn(
    "screenshot",
    "name?",
    "Saves the canvas as a PNG after this frame, without controls. Call it from a button.",
    "screenshot(${})"
  ),
  fn(
    "number",
    "name, value?, step?, min?, max?",
    "Adds a number field: click - or + to step, drag to scrub. Returns its value.",
    "number(\"${name}\", ${0})"
  ),
  fn(
    "file",
    "name, format?",
    "A file control: pick or drop a CSV, TSV, JSON or text file. Returns the parsed data, or null until there is one.",
    "file(\"${name}\")"
  ),
  fn(
    "load",
    "url, format?, { every? }",
    "Fetches and parses a URL; null while loading. { every: seconds } refreshes it. Needs a CORS-enabled server.",
    "load(\"${url}\")"
  ),
  fn(
    "csvParse",
    "text, { header?, delimiter?, typed? }",
    "Parses CSV text into objects (with .columns), or arrays with header: false. Numbers and booleans are converted.",
    "csvParse(${text})"
  ),
  fn(
    "parse",
    "text, format, options?",
    "Parses text as 'json', 'csv', 'tsv', 'text' or 'lines'.",
    "parse(${text}, \"${json}\")"
  )
];

export const VIEW_MEMBERS: Completion[] = [
  { label: 'x', type: 'property', info: 'World x of the view center.' },
  { label: 'y', type: 'property', info: 'World y of the view center.' },
  { label: 'zoom', type: 'property', info: 'Current zoom factor (1 = 100%).' },
  { label: 'left', type: 'property', info: 'World x of the left edge.' },
  { label: 'top', type: 'property', info: 'World y of the top edge.' },
  { label: 'right', type: 'property', info: 'World x of the right edge.' },
  { label: 'bottom', type: 'property', info: 'World y of the bottom edge.' },
  { label: 'width', type: 'property', info: 'Visible width in world units.' },
  { label: 'height', type: 'property', info: 'Visible height in world units.' }
];

export const FRAME_MEMBERS: Completion[] = [
  { label: 'n', type: 'property', info: 'Index of the current frame, starting at 0.' },
  { label: 'time', type: 'property', info: 'Seconds since the run started (same as t in animate).' },
  { label: 'dt', type: 'property', info: 'Seconds since the previous frame (same as dt in animate).' },
  { label: 'fps', type: 'property', info: 'Smoothed frames per second (0 for sketches without animate).' }
];

export const MOUSE_MEMBERS: Completion[] = [
  { label: 'x', type: 'property', info: 'Pointer x in world coordinates.' },
  { label: 'y', type: 'property', info: 'Pointer y in world coordinates.' },
  { label: 'down', type: 'property', info: 'true while the left button is pressed.' }
];

const CTX_METHODS = [
  'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clearRect', 'clip', 'closePath',
  'createConicGradient', 'createLinearGradient', 'createRadialGradient', 'drawImage',
  'ellipse', 'fill', 'fillRect', 'fillText', 'getTransform', 'lineTo', 'measureText',
  'moveTo', 'quadraticCurveTo', 'rect', 'reset', 'resetTransform', 'restore', 'rotate',
  'roundRect', 'save', 'scale', 'setLineDash', 'setTransform', 'stroke', 'strokeRect',
  'strokeText', 'transform', 'translate'
];

const CTX_PROPERTIES = [
  'fillStyle', 'strokeStyle', 'lineWidth', 'lineCap', 'lineJoin', 'miterLimit',
  'lineDashOffset', 'font', 'textAlign', 'textBaseline', 'direction', 'letterSpacing',
  'globalAlpha', 'globalCompositeOperation', 'shadowBlur', 'shadowColor',
  'shadowOffsetX', 'shadowOffsetY', 'imageSmoothingEnabled', 'filter'
];

export const CTX_MEMBERS: Completion[] = [
  ...CTX_METHODS.map((name) => ({
    ...snippetCompletion(name + '(${})', { label: name, type: 'method' }),
    boost: 1
  })),
  ...CTX_PROPERTIES.map((name): Completion => ({ label: name, type: 'property' }))
];

// Parameter hints for Math functions whose names are not just (x).
const MATH_PARAMS: Record<string, string> = {
  atan2: 'y, x',
  pow: 'base, exponent',
  imul: 'a, b',
  max: '...values',
  min: '...values',
  hypot: '...values',
  clz32: 'n'
};

// Every Math member is available as a bare global in sketches (see runtime.ts).
// Math members that a helper of the same name replaces: log() prints (use Math.log for ln)
// and random() is seeded (use Math.random for unseeded numbers).
const SHADOWED_MATH = new Set(['log', 'random']);

export const MATH: Completion[] = Object.getOwnPropertyNames(Math)
  .filter((name) => !SHADOWED_MATH.has(name))
  .map((name): Completion => {
    const value = (Math as unknown as Record<string, unknown>)[name];
    if (typeof value === 'function') {
      const params = MATH_PARAMS[name] ?? (value.length > 1 ? 'x, y' : 'x');
      return fn(name, params, 'Math.' + name);
    }
    return { label: name, type: 'constant', detail: String(value), info: 'Math.' + name };
  });
