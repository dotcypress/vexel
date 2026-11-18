// Help entries for every sketch helper, shared by the Help dialog and the editor's hover docs.

export type Helper = { signature: string; text: string; example: string };
export type Category = { title: string; note?: string; helpers: Helper[] };

export const HELP_CATEGORIES: Category[] = [
  {
    title: 'Canvas and view',
    helpers: [
      {
        signature: 'clear(color?)',
        text: 'Fill the whole canvas with a color, or make it transparent if omitted.',
        example: "clear()"
      },
      {
        signature: 'grid(step?, color?, major?)',
        text: 'Grid lines across the visible area. step is the minor spacing in world units (default 10); major is the major spacing (default 5 * step, 0 or false for none). Minor lines are drawn at half opacity. Call it after clear().',
        example: "grid(10, 'rgba(255,255,255,0.25)', 50)"
      },
      {
        signature: 'axes(color?)',
        text: "X and Y axes through the origin, with value labels. Call it after clear(). Pass an object for more: axes({ color, xLabel, yLabel, step }). step is the label spacing in world units (doubled while labels would crowd), and xLabel and yLabel name the axes.",
        example: "clear()\naxes({ xLabel: 'time (s)', yLabel: 'height (m)', step: 25 })\nplot((x) => 60 * sin(x / 30), palette(0), px(2))"
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
        example: "lockView()\nfit(-100, -100, 200, 200)\nclear()\ngrid()\ncircle(0, 0, 60, palette(2))\nhud('try to scroll or zoom')"
      }
    ]
  },
  {
    title: 'Shapes',
    note: 'fill is a color, or omitted/true for ctx.fillStyle, or false/null for no fill. stroke is a color, or true for ctx.strokeStyle; leave it out for no outline. As an object, { fill } fills and { stroke } outlines: circle(0, 0, 40, { stroke: \'white\', width: px(2) }). Stroked helpers also take { dash: [on, off] } in screen pixels: line(0, 0, 80, 0, { color: \'white\', dash: [6, 4] }). Text helpers (text, label, textBox, dims) take { font, weight, italic }.',
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
      },
      {
        signature: "arrow(x1, y1, x2, y2, color?, lineWidth?, head?)",
        text: "Line with a filled arrowhead at x2, y2. head is the head length in screen pixels (default 8), capped at half the arrow.",
        example: "arrow(-60, -30, 60, 30, palette(1), px(2))"
      },
      {
        signature: "bezier(x1, y1, c1x, c1y, c2x, c2y, x2, y2, color?, lineWidth?)",
        text: "Cubic Bezier curve from x1, y1 to x2, y2, pulled toward the two control points.",
        example: "bezier(-80, 0, -40, 80, 40, -80, 80, 0, palette(2), px(2))"
      },
      {
        signature: "spline(points, color?, lineWidth?, closed?)",
        text: "Smooth curve through every [x, y] point (Catmull-Rom), the smooth version of polyline. closed = true loops back to the start.",
        example: "const pts = range(8).map((i) => [i * 25 - 90, random(-50, 50)])\nspline(pts, palette(0), px(2))\npoints(pts, 'white', px(5))"
      },
      {
        signature: "wedge(x, y, radius, start, end, fill?, stroke?, lineWidth?)",
        text: "Pie slice from angle start to end (radians, counterclockwise). fill and stroke work like circle().",
        example: "const data = [3, 5, 2, 6]\nconst total = data.reduce((a, b) => a + b)\nlet a = 0\ndata.forEach((v, i) => {\n  wedge(0, 0, 80, a, a + 2 * PI * v / total, palette(i))\n  a += 2 * PI * v / total\n})"
      },
      {
        signature: "label(str, x, y, color?, size?, align?)",
        text: "Like text, but size is in screen pixels (default 12), so it stays readable at any zoom. align is 'left' (default), 'center' or 'right'.",
        example: "point(40, 20, palette(1), px(6))\nlabel('A (40, 20)', 40 + px(6), 20, 'white')"
      },
      {
        signature: "textBox(str, x, y, color?, size?, align?)",
        text: "Text on a dark backdrop, in screen pixels (default size 12), split into lines at \\n. x, y is the box's top-left corner, or its top center or top right with align 'center' or 'right'. As an object: { color, size, align, background }. Good for notes and tooltips.",
        example: "const p = drag('p', 40, 30)\nclear()\ngrid()\ntextBox('point\\nx = ' + p[0].toFixed(1) + '\\ny = ' + p[1].toFixed(1), p[0] + px(14), p[1] - px(10))"
      },
      {
        signature: "dims(x1, y1, x2, y2, text?, color?, offset?)",
        text: "A dimension line between two points, like on a technical drawing: extension lines, arrows and a label. text defaults to the distance. offset is how far from the points it is drawn, in screen pixels (default 16; negative for the other side).",
        example: "clear()\nrect(-60, -30, 120, 60, false, 'white', px(2))\ndims(-60, 30, 60, 30)\ndims(60, 30, 60, -30, '60 mm')"
      },
      {
        signature: "font(family?, weight?, italic?)",
        text: "Sets the font for text, label, textBox, dims and axis titles for the rest of the run; font() goes back to the default. family is a font name or 'sans', 'serif', 'mono' or 'rounded'. weight is 'bold' or 100 to 900. A style object works too: text('hi', 0, 0, { font: 'serif', weight: 'bold', italic: true }).",
        example: "font('serif', 'bold')\ntext('Serif heading', -100, 20, 'white', 24)\nfont()\ntext('back to the default', -100, -10, '#aab0c4', 14)"
      },
      {
        signature: "loadFont(name, url?, descriptors?)",
        text: "Loads a web font and returns true once it is ready; the sketch redraws when it arrives. With only a name it comes from Google Fonts (regular, bold and italic where available); with a url it loads that font file, which must allow cross-origin requests. Use the name as font afterwards. Errors go to the console.",
        example: "loadFont('Lobster')\nclear()\ntext('Hello, Lobster', -120, 0, { color: palette(0), size: 36, font: 'Lobster' })"
      },
      {
        signature: "image(src, x, y, w?, h?)",
        text: "Draws a picture (any URL, including data: URLs) with its bottom-left corner at x, y. Without w and h it is one world unit per image pixel; with only w the aspect ratio is kept. It loads in the background and the sketch redraws when it arrives; returns whether it was drawn.",
        example: "image('https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png', -100, -75, 200)"
      },
      {
        signature: "transform(fn, { x?, y?, rotate?, scale? })",
        text: "Calls fn with the world moved to x, y, rotated by rotate radians and scaled by scale (a number or [sx, sy]), then puts everything back. Returns what fn returns.",
        example: "animate((t) => {\n  clear()\n  transform(() => rect(-30, -30, 60, 60, palette(4)), { x: 40, rotate: t })\n})"
      }
    ]
  },
  {
    title: 'Plots',
    note: "heat paints opaque cells over the whole view, so call it right after clear() and draw everything else on top. Ramps for heat and scatter: viridis (default), magma, inferno, plasma, cividis (color-blind safe), turbo, hot and gray for values from low to high; coolwarm for values on both sides of a middle (0.5 is neutral); vexel, the brand sunflower ramp (dark blue to green to gold), with lightness rising from low to high. Or pass a function t => color.",
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
    title: 'Vectors',
    note: 'Vectors and points are [x, y] arrays, so spread them into the shape helpers: line(...a, ...b).',
    helpers: [
      {
        signature: "add(a, b), sub(a, b)",
        text: "Sum and difference of two [x, y] vectors.",
        example: "const a = [60, 20], b = [10, 50]\narrow(0, 0, ...a, palette(0))\narrow(0, 0, ...b, palette(1))\narrow(0, 0, ...add(a, b), 'white')"
      },
      {
        signature: "scale(v, k)",
        text: "The vector v times k.",
        example: "arrow(0, 0, ...scale([30, 20], 3), palette(2))"
      },
      {
        signature: "dot(a, b), len(v), norm(v)",
        text: "Dot product, length, and the vector scaled to length 1 ([0, 0] stays [0, 0]).",
        example: "const v = [30, 40]\nhud({ len: len(v), dot: dot(v, [1, 0]) })\narrow(0, 0, ...scale(norm(v), 100), palette(3))"
      },
      {
        signature: "dist(a, b)",
        text: "Distance between two [x, y] points, or dist(x1, y1, x2, y2).",
        example: "const p = drag('p', 50, 30)\nline(0, 0, ...p, 'white')\nlabel(dist([0, 0], p).toFixed(1), ...p)"
      },
      {
        signature: "rot(v, angle, around?)",
        text: "v rotated by angle radians counterclockwise around the point around (default the origin).",
        example: "range(12).forEach((i) => point(...rot([80, 0], i * PI / 6), palette(i), px(8)))"
      },
      {
        signature: "angle(v), polar(r, theta)",
        text: "The direction of v in radians, and the [x, y] at distance r in direction theta.",
        example: "const p = polar(80, PI / 3)\narrow(0, 0, ...p, palette(0))\nhud(angle(p))"
      },
      {
        signature: "intersect(a1, a2, b1, b2)",
        text: "Where segment a1-a2 crosses segment b1-b2, as [x, y], or null if they do not cross.",
        example: "const a = drag('a', -80, -40), b = drag('b', 80, 40)\nline(...a, ...b, 'white')\nline(-60, 50, 60, -50, palette(1))\nconst p = intersect(a, b, [-60, 50], [60, -50])\nif (p) point(...p, palette(2), px(10))"
      }
    ]
  },
  {
    title: 'Colors',
    helpers: [
      {
        signature: 'palette(i)',
        text: 'The i-th color of the built-in 16-color Sunflower palette. Wraps around, so any integer works. palette(0) is the brand gold, each color differs strongly from the one before, and the first 8 stay distinct for red-green color blindness, so use them first for data series.',
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
      },
      {
        signature: "mix(c1, c2, t?)",
        text: "The color c1 mixed t of the way (0 to 1, default 0.5) toward c2. Works with any CSS color.",
        example: "range(10).forEach((i) => circle(i * 20 - 90, 0, 9, mix('tomato', 'royalblue', i / 9)))"
      },
      {
        signature: "alpha(color, a)",
        text: "The color with its opacity multiplied by a (0 to 1).",
        example: "circle(-20, 0, 50, alpha(palette(0), 0.5))\ncircle(20, 0, 50, alpha(palette(1), 0.5))"
      },
      {
        signature: "ramp(name, t)",
        text: "The color at t (0 to 1, clamped) of a built-in ramp such as 'viridis', or of your own ramp function.",
        example: "range(20).forEach((i) => rect(i * 10 - 100, -20, 10, 40, ramp('plasma', i / 19)))"
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
        signature: "grid2d(cols, rows, fn)",
        text: "Calls fn(col, row, i) for every cell of a cols by rows grid, row by row from the bottom, and returns the results as a list. i is row * cols + col.",
        example: "grid2d(8, 5, (c, r, i) => rect(c * 22, r * 22, 20, 20, palette(i)))"
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
        example: "clear()\naxes()\nhist(range(2000).map(() => gauss(100, 25)), 30)\nfit(0, -10, 200, 280)"
      },
      {
        signature: "clamp(x, lo?, hi?)",
        text: "x limited to lo..hi (default 0..1).",
        example: "hud(clamp(1.7), clamp(-5, -1, 1))"
      },
      {
        signature: "map(x, a1, b1, a2?, b2?)",
        text: "x rescaled from the range a1..b1 to a2..b2 (default 0..1). Not clamped.",
        example: "circle(0, 0, map(mouse.x, -100, 100, 5, 60), palette(3))"
      },
      {
        signature: "smoothstep(a, b, x)",
        text: "0 below a, 1 above b, and a smooth S-curve in between.",
        example: "plot((x) => 50 * smoothstep(-50, 50, x), palette(2), px(2))"
      },
      {
        signature: "ease(t, kind?)",
        text: "Easing curve for t in 0..1 (clamped): 'linear', 'in', 'out', 'inOut' (default), 'sine', 'back', 'elastic' or 'bounce'.",
        example: "animate((t) => {\n  clear()\n  circle(-100 + 200 * ease(t / 2 % 1, 'bounce'), 0, 12, palette(1))\n})"
      },
      {
        signature: "noise(x, y?, z?)",
        text: "Seeded Perlin noise from 0 to 1 for 1, 2 or 3 coordinates. It changes smoothly over about one unit, so scale world coordinates down. Follows seed().",
        example: "heat((x, y) => noise(x / 40, y / 40), 'viridis')"
      }
    ]
  },
  {
    title: 'Animation and state',
    helpers: [
      {
        signature: 'every(seconds, fn?, key?)',
        text: 'Use inside animate. True once every given number of seconds (the first time one period in), and calls fn when it is. Calls with the same period and function share a timer; pass a key to tell them apart.',
        example: "let hue = 0\nanimate(() => {\n  every(0.5, () => (hue += 40))\n  clear()\n  circle(0, 0, 60, hsl(hue, 80, 60))\n})"
      },
      {
        signature: 'once(fn, key?)',
        text: 'Calls fn the first time and returns the same result after that: on later frames, and when panning, zooming or a control re-runs the sketch. Use it for expensive setup or state that should survive re-runs. Editing the code starts over. Without a key, functions with identical source share a result; pass a key to tell them apart.',
        example: "const stars = once(() =>\n  range(300).map(() => [Math.random() * 400 - 200, Math.random() * 300 - 150])\n)\nclear('#14161b')\npoints(stars, 3, 'white')\nhud('pan around: the stars stay put')"
      },
      {
        signature: "pause(on?)",
        text: "pause() toggles, pause(true) and pause(false) set. While paused, time stands still and animate is only called when the view moves or step() is used. Returns whether animation is paused.",
        example: "animate((t) => {\n  pause(toggle('paused'))\n  if (button('step')) step()\n  clear()\n  circle(cos(t) * 80, sin(t) * 80, 10, palette(0))\n})"
      },
      {
        signature: "step()",
        text: "While paused, advances the animation by one 1/60 s frame.",
        example: "animate((t) => {\n  pause(true)\n  if (button('step')) step()\n  clear()\n  hud(t)\n})"
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
        example: "let n = 0\nanimate(() => {\n  if (button('add a dot')) {\n    n++\n  }\n  clear()\n  range(n).forEach((i) => circle(i * 30 - 150, 0, 10, palette(i)))\n})"
      },
      {
        signature: "number(name, value?, step?, min?, max?)",
        text: "Adds a number field to the control panel and returns its value (default 0). Click - or + to step it by step (default 1), or drag the number left and right to scrub. min and max limit it. The value survives re-runs.",
        example: "const sides = number('sides', 6, 1, 3, 20)\npoly(range(sides).map((i) => polar(80, (i * 2 * PI) / sides)), palette(4))"
      },
      {
        signature: "slider2d(name, min?, max?, value?)",
        text: "Adds an x/y pad to the control panel and returns [x, y], each from min to max (default -1 to 1). value is the initial [x, y] (default the middle). The value survives re-runs.",
        example: "const [x, y] = slider2d('offset', -100, 100)\ncircle(x, y, 20, palette(5))"
      },
      {
        signature: "swatch(name, value?)",
        text: "Adds a color picker with the 16 palette colors and returns the chosen color. value is the initial palette index or color (default 0).",
        example: "circle(0, 0, 50, swatch('fill', 2))"
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
        example: "const dots = []\nanimate(() => {\n  if (mouse.clicked) {\n    dots.push([mouse.x, mouse.y])\n  }\n  clear()\n  points(dots, palette(2), 12)\n  hud('click to add dots')\n})"
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
        example: "const [ax, ay] = drag('a', -80, -40, 8, palette(0))\nconst [bx, by] = drag('b', 80, 40, 8, palette(1))\nclear()\ngrid()\nline(ax, ay, bx, by, 'white', px(2))\nhud('length ' + hypot(bx - ax, by - ay).toFixed(1))"
      }
    ]
  },
  {
    title: 'Data',
    note: "file and load return null until the data is there, then the sketch runs again, so start with: if (!rows) return hud('loading'). Formats come from the file extension: .csv, .tsv, .json and .txt; pass format ('csv', 'tsv', 'json', 'text' or 'lines') to override. CSV rows become objects keyed by the header, numbers and true/false are converted, and empty cells become null. Files up to 20 MB.",
    helpers: [
      {
        signature: "file(name, format?)",
        text: "Adds a file row to the control panel and returns the parsed data, or null until a file is chosen. Click the row to pick a file, or drop one onto the preview; the \u00d7 clears it. The file stays with the sketch across edits and reloads, and Export HTML includes it. Nothing is uploaded.",
        example: "const rows = file('data')\nif (!rows) return hud('click \"data\" or drop a CSV file')\nhud(rows.length + ' rows', 'columns: ' + rows.columns.join(', '))"
      },
      {
        signature: "load(url, format?, { every? })",
        text: "Fetches a URL once and returns the parsed data, or null while it loads; the sketch runs again when it arrives. { every: seconds } fetches it again on that interval for live data, keeping the last result in between. The server must allow cross-origin requests (raw GitHub files and most public APIs do). Errors go to the console.",
        example: "const rows = load('https://raw.githubusercontent.com/vega/vega-datasets/main/data/seattle-weather.csv')\nif (!rows) return hud('loading...')\nclear()\naxes({ xLabel: 'day', yLabel: 'max temp' })\npolyline(rows.map((r, i) => [i / 4, r.temp_max * 5]), palette(0), px(1.5))"
      },
      {
        signature: "csvParse(text, { header?, delimiter?, typed? })",
        text: "Parses CSV text. With a header (default) rows are objects and the result has .columns; header: false gives arrays. The delimiter (comma, semicolon or tab) is detected; typed: false keeps every cell as a string. Handles quotes, doubled \"\" and line breaks inside quotes.",
        example: "const rows = csvParse('name,score\\nAda,92\\nLin,78\\nSam,85')\nbars(rows.map((r) => r.score), 30, (i) => palette(i))\nrows.forEach((r, i) => label(r.name, i * 30 + 15, -10, 'white', 12, 'center'))"
      },
      {
        signature: "parse(text, format, options?)",
        text: "Parses text as 'json', 'csv', 'tsv', 'text' or 'lines' (an array of lines). Invalid JSON reports the line and column.",
        example: "const words = parse('apple\\nbanana\\ncherry', 'lines')\nwords.forEach((w, i) => label(w, 0, -i * 20, palette(i), 14))"
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
      },
      {
        signature: "screenshot(name?)",
        text: "Saves the canvas as a PNG once the current frame is drawn, without the controls and hud, with a small Vexel badge in the corner (like the camera button above the preview). name is the file name (default 'vexel-sketch'). Call it from a button so it does not fire on every frame.",
        example: "animate((t) => {\n  clear()\n  circle(cos(t) * 60, sin(t) * 60, 20, palette(1))\n  if (button('save PNG')) {\n    screenshot('orbit')\n  }\n})"
      },
      {
        signature: "legend(entries, title?)",
        text: "A legend under the hud in the top-left corner, for this frame. entries are [[label, color], ...] or { label: color }.",
        example: "plot((x) => 40 * sin(x / 20), palette(0), px(2))\nplot((x) => 40 * cos(x / 20), palette(1), px(2))\nlegend([['sin', palette(0)], ['cos', palette(1)]])"
      },
      {
        signature: "colorbar(ramp?, min?, max?, title?)",
        text: "A color bar for a ramp (default viridis) with its value range, under the hud, for this frame. Pairs with heat and scatter.",
        example: "heat((x, y) => 0.5 + 0.5 * sin(x / 20) * cos(y / 20), 'magma')\ncolorbar('magma', -1, 1, 'value')"
      }
    ]
  }
];
