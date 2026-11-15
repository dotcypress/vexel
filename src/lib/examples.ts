import { DEFAULT_CODE } from './runtime';

export type Example = {
	id: string;
	title: string;
	/** Which helpers or ideas the sketch shows off. */
	description: string;
	group: string;
	code: string;
};

// The code is plain text that gets pasted into the editor, so it must not contain
// backticks or dollar-brace sequences. Comments explain the helpers it uses: the examples
// double as documentation.
export const EXAMPLES: Example[] = [
	{
		id: 'sunflower',
		title: 'Sunflower',
		group: 'Basics',
		description: 'animate, slider, hsl, point: dots on the golden angle.',
		// The default sketch has no fit(), so frame the view when loading it as an example.
		code: 'fit(-340, -340, 680, 680)\n\n' + DEFAULT_CODE
	},
	{
		id: 'shapes',
		title: 'Shapes',
		group: 'Basics',
		description: 'Every drawing helper once, plus colors and px().',
		code: `// Shapes gallery: every drawing helper once. Y points up and (0, 0) is the center.
clear('#07080d')
grid()
axes()

point(-120, 80, 14, palette(0))                      // x, y, diameter, color
points([[-90, 80], [-70, 90], [-50, 70]], 8, palette(1))
line(-120, 40, -40, 20, palette(2), 3)               // x1, y1, x2, y2, color, lineWidth
polyline([[-120, -10], [-90, -40], [-60, -10], [-30, -40]], palette(3), 3)
curve(-120, -70, -75, -20, -30, -70, palette(4), 3)  // the middle point pulls the curve

circle(60, 70, 30, palette(5))                       // filled
circle(60, 70, 40, false, palette(5), px(2))         // outline only; px(2) is always 2 screen pixels
rect(30, -10, 60, 40, palette(6), 'white', px(1))    // bottom-left corner at 30, -10
rect(100, -10, 30, 40, rgb(255, 160, 40, 0.8))       // rgb() and hsl() build color strings
text('shapes', 60, -60, 'white', 18, 'center')
text('hsl() makes colors too', 60, -85, hsl(200, 80, 70), 11, 'center')

fit(-150, -110, 300, 230)                            // frame this area once
`
	},
	{
		id: 'plot',
		title: 'Plot functions',
		group: 'Math',
		description: 'plot, slider, toggle, hud: y = f(x) with live controls.',
		code: `// Plot functions with live controls: drag the sliders in the top-right corner.
// Sketches without animate re-run whenever a control or the view changes.
const amp = slider('amplitude', 0, 100, 50)
const freq = slider('frequency', 5, 100, 30, 1)   // the last number is the step
const showCos = toggle('cosine', true)

clear('#07080d')
grid(10, null, 50)                                // minor every 10, major every 50
axes()

plot((x) => amp * sin(x / freq), palette(0), px(2))
if (showCos) plot((x) => amp * cos(x / freq), palette(1), px(2))
plot((x) => 1000 / x, palette(2), px(2))          // gaps wherever f is not finite

hud({ amplitude: amp, frequency: freq })
fit(-300, -150, 600, 300)
`
	},
	{
		id: 'rose',
		title: 'Polar rose',
		group: 'Math',
		description: 'plotPolar: r = R cos(k theta).',
		code: `// A polar rose, r = R * cos(k * theta). Integer k gives a closed flower with k or 2k petals.
// plotPolar draws theta from 0 to 2 PI, so other values of k leave the curve open.
const k = slider('k', 1, 12, 5, 1)
const R = slider('radius', 20, 150, 100)

clear('#07080d')
grid(25, null, 100)
axes()
plotPolar((a) => R * cos(k * a), palette(5), px(2.5))
fit(-170, -170, 340, 340)
`
	},
	{
		id: 'lissajous',
		title: 'Lissajous curve',
		group: 'Math',
		description: 'animate, polyline, trail: x = sin(a t), y = sin(b t).',
		code: `// A Lissajous curve. The dot follows it and leaves a fading trail.
// Controls are read inside animate so they update every frame.
fit(-160, -160, 320, 320)

animate((t) => {
  const a = slider('a', 1, 9, 3, 1)
  const b = slider('b', 1, 9, 2, 1)

  clear('#07080d')
  grid(20, null, 100)
  axes()

  const pts = []
  for (let i = 0; i <= 400; i++) {
    const s = (i / 400) * PI * 2
    pts.push([120 * sin(a * s), 120 * sin(b * s + 1)])
  }
  polyline(pts, 'rgba(255, 255, 255, 0.15)', px(1))   // the full curve, faint

  const x = 120 * sin(a * t)
  const y = 120 * sin(b * t + 1)
  trail('dot', x, y, 120, palette(1))                 // remembers the last 120 positions
  point(x, y, 10, 'white')
})
`
	},
	{
		id: 'phase',
		title: 'Phase portrait',
		group: 'Math',
		description: 'field, trail, slider: a damped pendulum in the (theta, omega) plane.',
		code: `// Phase portrait of a damped pendulum: theta' = omega, omega' = -sin(theta) - c * omega.
// The horizontal axis is theta, the vertical axis is omega (1 unit = 40 world units).
// Arrows show the flow; the dots follow it and leave fading trails.
const S = 40
const particles = [[-3, 2], [-1, 3], [2, -2.5], [3, 1], [0.5, -1], [-2.5, -1]].map(
  ([th, om]) => ({ th, om })
)

fit(-6.5 * S, -4 * S, 13 * S, 8 * S)

animate((t, dt) => {
  const c = slider('damping', 0, 1, 0.2, 0.01)

  clear('#07080d')
  grid(S / 2, null, S)
  axes()

  // field(f, step, color): f(x, y) returns [dx, dy], drawn as an arrow every step units
  field((x, y) => {
    const th = x / S
    const om = y / S
    return [om * 12, (-sin(th) - c * om) * 12]
  }, 20, 'rgba(91, 108, 240, 0.7)')

  text('theta', 6.3 * S, 14, 'white', 12, 'right')
  text('omega', 8, 3.8 * S, 'white', 12)

  particles.forEach((p, i) => {
    // A few small steps per frame keep the integration stable.
    const h = min(dt, 0.05) / 4
    for (let k = 0; k < 4; k++) {
      p.om += (-sin(p.th) - c * p.om) * h
      p.th += p.om * h
    }
    trail('p' + i, p.th * S, p.om * S, 150, palette(i + 1))
    point(p.th * S, p.om * S, 8, palette(i + 1))
  })
})
`
	},
	{
		id: 'flow',
		title: 'Vector field',
		group: 'Math',
		description: 'field with time: arrows that swirl and change.',
		code: `// An animated vector field: f(x, y) returns [dx, dy] and field() draws an arrow
// at every grid point. Arrows are as long as the vector, capped just below the spacing.
fit(-300, -200, 600, 400)

animate((t) => {
  const step = slider('spacing', 15, 60, 30, 5)

  clear('#07080d')
  axes('rgba(255, 255, 255, 0.25)')
  field((x, y) => [sin(y / 50 + t) * 30, cos(x / 50 - t) * 30], step, palette(5))
})
`
	},
	{
		id: 'mandelbrot',
		title: 'Mandelbrot set',
		group: 'Math',
		description: 'heat, select: color the view by escape time.',
		code: `// The Mandelbrot set with heat(): f(x, y) returns a number from 0 to 1 and heat() colors
// the whole view with it. Pan and zoom to explore; each cell is a few screen pixels.
// select() adds a chooser: click its left or right half to switch colormaps.
const ramp = select('ramp', ['magma', 'turbo', 'viridis', 'gray'])
const maxIter = slider('iterations', 10, 150, 60, 1)

clear('#07080d')
heat((x, y) => {
  const cr = x / 200 - 0.5   // 200 world units per unit of the complex plane
  const ci = y / 200
  let zr = 0
  let zi = 0
  let n = 0
  while (n < maxIter && zr * zr + zi * zi < 4) {
    const next = zr * zr - zi * zi + cr
    zi = 2 * zr * zi + ci
    zr = next
    n++
  }
  return n === maxIter ? 0 : n / maxIter
}, ramp)
`
	},
	{
		id: 'metaballs',
		title: 'Metaballs',
		group: 'Math',
		description: 'heat + contour: an implicit curve around moving blobs.',
		code: `// Metaballs: three moving blobs shaded with heat() and outlined with contour(), which
// draws the curve where f(x, y) equals the level.
fit(-250, -170, 500, 340)

animate((t) => {
  const level = slider('threshold', 0.3, 3, 1, 0.1)
  const blobs = [
    [120 * cos(t * 0.7), 80 * sin(t * 0.9), 60],
    [-100 * sin(t * 0.5), 60 * cos(t * 0.8), 50],
    [80 * cos(t * 0.4 + 2), -90 * sin(t * 0.6), 70]
  ]
  const f = (x, y) =>
    blobs.reduce((sum, [bx, by, r]) => sum + (r * r) / ((x - bx) ** 2 + (y - by) ** 2 + 1), 0)

  clear('#07080d')
  heat((x, y) => min(1, f(x, y) / 3), 'magma')   // draw heat first: it is opaque
  contour(f, level, 'white', px(2))
})
`
	},
	{
		id: 'heatmap',
		title: 'Heatmap from data',
		group: 'Data',
		description: 'rect, hsl, hover: a grid of [column, row, value] triples.',
		code: `// A heatmap from [column, row, value] triples, drawn as colored squares.
// hover() makes the sketch re-run when the pointer enters or leaves a cell.
const cols = 14
const rows = 9
const cell = 36

const data = []
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    data.push([c, r, round(50 + 40 * sin(c / 2.2) * cos(r / 1.7) + 10 * sin(c * r))])
  }
}
const lo = min(...data.map((d) => d[2]))
const hi = max(...data.map((d) => d[2]))

clear('#07080d')
fit(0, 0, cols * cell, rows * cell)

for (const [c, r, v] of data) {
  const t = (v - lo) / (hi - lo || 1)                     // 0..1
  const x = c * cell
  const y = r * cell
  rect(x, y, cell - 2, cell - 2, hsl(240 - 240 * t, 70, 25 + 30 * t))
  if (hover(x + cell / 2, y + cell / 2, cell / 2)) {
    rect(x, y, cell - 2, cell - 2, false, 'white', px(2))
    hud('column ' + c + ', row ' + r, 'value ' + v)
  }
}
`
	},
	{
		id: 'charts',
		title: 'Bars and histogram',
		group: 'Data',
		description: 'bars, hist: charts from plain arrays.',
		code: `// A histogram and a bar chart. The data comes from a tiny seeded generator, so it is
// the same every time the sketch re-runs.
let seed = 12345
const rand01 = () => (seed = (seed * 16807) % 2147483647) / 2147483647
const gauss = () => (rand01() + rand01() + rand01() + rand01() - 2) * 1.7

const samples = Array.from({ length: 600 }, () => 100 + 30 * gauss())
const bins = slider('bins', 5, 40, 20, 1)

clear('#07080d')
grid(10, null, 50)
axes()

// hist(list, bins): x is the data value, a bar is as tall as its count.
const counts = hist(samples, bins)

// bars(list, width, color): bar i stands in the slot from i * width to (i + 1) * width.
ctx.save()
ctx.translate(260, 0)                                     // move the second chart to the right
bars([30, 80, 55, 95, 60], 20, (i) => palette(i))
ctx.restore()

hud('tallest bin: ' + max(...counts))
fit(-10, -20, 390, 130)
`
	},
	{
		id: 'scatter',
		title: 'Scatter plot',
		group: 'Data',
		description: 'scatter, select: dots colored by a value.',
		code: `// scatter(list, size, ramp) draws dots from [x, y, value] triples, colored by value (0 to 1).
// Here the value is simply how far along the spiral each dot is.
const ramp = select('ramp', ['turbo', 'viridis', 'magma', 'gray'])
const n = slider('points', 50, 1500, 600, 10)

const pts = []
for (let i = 0; i < n; i++) {
  const a = i * 0.25
  const r = i * 0.2
  pts.push([cos(a) * r, sin(a) * r, i / n])
}

clear('#07080d')
grid(50, null, 100)
axes()
scatter(pts, 5, ramp)
fit(-320, -320, 640, 640)
`
	},
	{
		id: 'keys',
		title: 'Move with the keyboard',
		group: 'Interactive',
		description: 'key, trail, toggle, hud: arrow keys or WASD.',
		code: `// Move the circle with the arrow keys or WASD. Click the preview first so it has focus.
let x = 0
let y = 0

fit(-300, -200, 600, 400)

animate((t, dt) => {
  const speed = slider('speed', 50, 400, 200)
  const showTrail = toggle('trail', true)

  // key(name) is true while the key is held.
  const dx = (key('ArrowRight') || key('d') ? 1 : 0) - (key('ArrowLeft') || key('a') ? 1 : 0)
  const dy = (key('ArrowUp') || key('w') ? 1 : 0) - (key('ArrowDown') || key('s') ? 1 : 0)
  x += dx * speed * min(dt, 0.1)
  y += dy * speed * min(dt, 0.1)

  clear('#07080d')
  grid(20, null, 100)
  axes()
  if (showTrail) trail('me', x, y, 200, palette(1))
  circle(x, y, 12, palette(0), 'white', px(2))
  hud({ x: x, y: y, fps: frame.fps })
})
`
	},
	{
		id: 'paint',
		title: 'Draw with the mouse',
		group: 'Interactive',
		description: 'mouse, polyline: hold the left button and move.',
		code: `// Draw with the mouse: hold the left button and move. To pan, drag with Space held.
// mouse.x and mouse.y are in world coordinates, mouse.down is true while pressed.
const strokes = []
let current = null

fit(-300, -200, 600, 400)

animate(() => {
  if (mouse.down) {
    if (!current) {
      current = []
      strokes.push(current)
    }
    current.push([mouse.x, mouse.y])
  } else {
    current = null
  }

  clear('#07080d')
  grid(20, null, 100)
  axes()
  strokes.forEach((stroke, i) => polyline(stroke, palette(i), px(3)))
  hud('strokes: ' + strokes.length)
})
`
	}
];

export const EXAMPLE_GROUPS = [...new Set(EXAMPLES.map((e) => e.group))];
