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
		code: DEFAULT_CODE
	},
	{
		id: 'shapes',
		title: 'Shapes',
		group: 'Basics',
		description: 'Every drawing helper once, plus colors and px().',
		code: `// Shapes gallery: every drawing helper once. Y points up and (0, 0) is the center.
clear('#282c34')
grid()
axes()

// Left column: points and lines
point(-200, 90, 14, palette(0))                        // x, y, diameter, color
points([[-175, 95], [-155, 80], [-135, 92]], 8, palette(1))
line(-210, 50, -130, 30, palette(2), 3)                // x1, y1, x2, y2, color, lineWidth
polyline([[-210, 0], [-185, -30], [-160, 0], [-135, -30]], palette(3), 3)
curve(-210, -80, -170, -10, -130, -80, palette(4), 3)  // the middle point pulls the curve

// Middle column: round things
circle(0, 70, 30, palette(5))                          // filled
circle(0, 70, 40, false, palette(5), px(2))            // outline only; px(2) is always 2 screen pixels
ellipse(0, -5, 45, 20, palette(6), 'white', px(1), PI / 8)   // radii 45 and 20, tilted 22.5 degrees
arc(0, -75, 25, 0, PI * 1.5, palette(7), 5)            // from 0 to 270 degrees, counterclockwise

// Right column: boxes and polygons
rect(140, 40, 60, 50, palette(8), 'white', px(1))      // bottom-left corner at 140, 40
rect(210, 40, 25, 50, rgb(255, 160, 40, 0.8))          // rgb() and hsl() build color strings
const star = range(10).map((i) => {
  const r = i % 2 ? 17 : 42                            // alternate outer and inner corners
  const a = PI / 2 + (i * PI) / 5
  return [185 + r * cos(a), -40 + r * sin(a)]
})
poly(star, hsl(45, 95, 60), 'white', px(1))            // a closed polygon through the points

text('shapes', 0, -125, 'white', 20, 'center')
fit(-230, -145, 480, 270)                              // frame this area once
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

clear('#282c34')
grid(10, null, 50)                                // minor every 10, major every 50
axes()

plot((x) => amp * sin(x / freq), palette(0), px(2))
if (showCos) plot((x) => amp * cos(x / freq), palette(1), px(2))
plot((x) => 1000 / x, palette(2), px(2))          // gaps wherever f is not finite

// Label each curve near the right edge of the view
const lx = view.right - px(90)
text('sin', lx, amp * sin(lx / freq) + px(12), palette(0), px(13))
if (showCos) text('cos', lx, amp * cos(lx / freq) + px(12), palette(1), px(13))
text('1000 / x', lx, 1000 / lx + px(12), palette(2), px(13))

hud({ amplitude: amp, frequency: freq })
fit(-300, -150, 600, 300)
`
	},
	{
		id: 'rose',
		title: 'Polar rose',
		group: 'Math',
		description: 'plotPolar, plotParam: r = R cos(n/d theta), spinning.',
		code: `// Polar roses, r = R * cos(k * theta).
// The faint flower is plotPolar with whole k, which closes after one turn.
// The bright one uses k = n / d: it needs d turns to close, so it is drawn with
// plotParam over theta from 0 to 2 PI * d, and spins slowly.
const R = 130
fit(-170, -170, 340, 340)

animate((t) => {
  const n = slider('n', 1, 12, 5, 1)
  const d = slider('d', 1, 9, 4, 1)

  clear('#282c34')
  grid(25, null, 100)

  plotPolar((a) => R * cos(n * a), 'rgba(255, 255, 255, 0.12)', px(1))

  const spin = t * 0.15
  const r = (a) => R * cos((n / d) * a)
  const x = (a) => r(a) * cos(a + spin)
  const y = (a) => r(a) * sin(a + spin)
  plotParam(x, y, 0, 2 * PI * d, palette(5), px(2.5))

  // A dot that runs along the curve and leaves a trail
  const a = (t * 0.9) % (2 * PI * d)
  trail('dot', x(a), y(a), 60, 'white')
  point(x(a), y(a), 9, 'white')
  hud('k = ' + n + ' / ' + d)
})
`
	},
	{
		id: 'lissajous',
		title: 'Lissajous curve',
		group: 'Math',
		description: 'animate, plotParam, trail: x = sin(a t), y = sin(b t + phase).',
		code: `// A Lissajous curve that slowly morphs as its phase drifts. The dot follows it and
// leaves a fading trail. Controls are read inside animate so they update every frame.
fit(-160, -160, 320, 320)

animate((t) => {
  const a = slider('a', 1, 9, 3, 1)
  const b = slider('b', 1, 9, 2, 1)
  const drift = slider('drift', 0, 1, 0.2, 0.01)
  const phase = t * drift

  clear('#282c34')
  grid(20, null, 100)
  axes()

  // plotParam draws x = fx(s), y = fy(s) for s from 0 to 2 PI.
  // Drawing it twice, wide and faint then thin, gives a soft glow.
  const fx = (s) => 120 * sin(a * s)
  const fy = (s) => 120 * sin(b * s + phase)
  plotParam(fx, fy, 0, PI * 2, hsl(t * 20, 80, 60, 0.15), px(8))
  plotParam(fx, fy, 0, PI * 2, hsl(t * 20, 80, 75, 0.8), px(1.5))

  const x = fx(t)
  const y = fy(t)
  trail('dot', x, y, 120, palette(1))                 // remembers the last 120 positions
  point(x, y, 10, 'white')
})
`
	},
	{
		id: 'spirograph',
		title: 'Spirograph',
		group: 'Math',
		description: 'plotParam, circle, line: a pen on a circle rolling inside another.',
		code: `// A spirograph (hypotrochoid): a small circle of radius r rolls inside a big one of
// radius R, and a pen sits at distance d from its center. plotParam draws the curve up
// to the current time, so it grows as the wheel turns.
const R = 120
fit(-160, -160, 320, 320)

const gcd = (a, b) => (b ? gcd(b, a % b) : a)
let s = 0                                       // the wheel's angle, grows with time

animate((t, dt) => {
  const r = slider('wheel radius', 10, 110, 45, 1)
  const d = slider('pen distance', 0, 110, 70, 1)
  const speed = slider('speed', 0, 10, 3, 0.1)

  // The curve closes after r / gcd(R, r) trips around the big circle
  const period = 2 * PI * (r / gcd(R, r))
  s = (s + speed * dt) % (period * 1.5)         // draw, hold the finished curve, restart

  const k = (R - r) / r
  const fx = (u) => (R - r) * cos(u) + d * cos(k * u)
  const fy = (u) => (R - r) * sin(u) - d * sin(k * u)

  clear('#1d2027')
  circle(0, 0, R, false, 'rgba(255, 255, 255, 0.2)', px(1))
  plotParam(fx, fy, 0, min(s, period), hsl(s * 15, 85, 65), px(2))

  if (s < period) {
    // The rolling wheel and the arm from its center to the pen
    const cx = (R - r) * cos(s)
    const cy = (R - r) * sin(s)
    circle(cx, cy, r, false, 'rgba(255, 255, 255, 0.5)', px(1))
    line(cx, cy, fx(s), fy(s), 'white', px(1))
    point(fx(s), fy(s), 8, 'white')
  }
})
`
	},
	{
		id: 'triangle',
		title: 'Triangle centers',
		group: 'Math',
		description: 'drag, poly, circle: drag the corners and watch the centers move.',
		code: `// Drag the three corners. The centroid, circumcenter and orthocenter always lie on
// one line, the Euler line; the incenter usually does not.
// drag(id, x, y) returns the handle's current [x, y]; positions survive edits.
const A = drag('A', -120, -70, 9, palette(0))
const B = drag('B', 130, -50, 9, palette(1))
const C = drag('C', -10, 110, 9, palette(2))

const sub = (p, q) => [p[0] - q[0], p[1] - q[1]]
const len = (p) => hypot(p[0], p[1])
const a = len(sub(B, C))
const b = len(sub(C, A))
const c = len(sub(A, B))

// Centroid: the average of the corners
const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]
// Circumcenter: equally far from all corners
const d = 2 * (A[0] * (B[1] - C[1]) + B[0] * (C[1] - A[1]) + C[0] * (A[1] - B[1]))
const sq = (p) => p[0] * p[0] + p[1] * p[1]
const O = [
  (sq(A) * (B[1] - C[1]) + sq(B) * (C[1] - A[1]) + sq(C) * (A[1] - B[1])) / d,
  (sq(A) * (C[0] - B[0]) + sq(B) * (A[0] - C[0]) + sq(C) * (B[0] - A[0])) / d
]
// Orthocenter: where the altitudes meet, H = A + B + C - 2 O
const H = [A[0] + B[0] + C[0] - 2 * O[0], A[1] + B[1] + C[1] - 2 * O[1]]
// Incenter: the corners weighted by the opposite side lengths
const p = a + b + c
const I = [(a * A[0] + b * B[0] + c * C[0]) / p, (a * A[1] + b * B[1] + c * C[1]) / p]
// Inradius from the area (Heron's formula)
const s = p / 2
const r = sqrt(max(0, s * (s - a) * (s - b) * (s - c))) / s

clear('#282c34')
grid(20, null, 100)
poly([A, B, C], 'rgba(91, 108, 240, 0.15)', 'white', px(2))
circle(O[0], O[1], len(sub(A, O)), false, palette(3), px(1))   // circumcircle
circle(I[0], I[1], r, false, palette(4), px(1))                 // incircle

// The Euler line, extended well past O and H
const dir = sub(H, O)
const k = 1000 / max(1e-9, len(dir))
line(O[0] - dir[0] * k, O[1] - dir[1] * k, O[0] + dir[0] * k, O[1] + dir[1] * k, 'rgba(255, 255, 255, 0.3)', px(1))

const mark = (P, color, name) => {
  point(P[0], P[1], px(9), color)
  text(name, P[0] + px(8), P[1] + px(8), color, px(12))
}
mark(G, palette(5), 'centroid')
mark(O, palette(3), 'circumcenter')
mark(H, palette(6), 'orthocenter')
mark(I, palette(4), 'incenter')
fit(-200, -150, 400, 300)
`
	},
	{
		id: 'phase',
		title: 'Phase portrait',
		group: 'Math',
		description: 'field, trail, mouse.clicked: a damped pendulum in the (theta, omega) plane.',
		code: `// Phase portrait of a damped pendulum: theta' = omega, omega' = -sin(theta) - c * omega.
// The horizontal axis is theta, the vertical axis is omega (1 unit = 40 world units).
// Arrows show the flow; the dots follow it and leave fading trails.
// Click anywhere to drop a new particle; the reset button removes them all.
const S = 40
let made = 0                                    // each particle gets its own trail id
const add = (th, om) => particles.push({ th, om, id: made++ })
const particles = []
for (const [th, om] of [[-3, 2], [-1, 3], [2, -2.5], [3, 1], [0.5, -1], [-2.5, -1]]) add(th, om)
fit(-6.5 * S, -4 * S, 13 * S, 8 * S)

animate((t, dt) => {
  const c = slider('damping', 0, 1, 0.2, 0.01)

  // mouse.clicked is true for just one frame per click
  if (mouse.clicked && particles.length < 40) {
    add(mouse.x / S, mouse.y / S)
  }
  if (button('reset')) particles.length = 0

  clear('#282c34')
  grid(S / 2, null, S)
  axes()

  // field(f, step, color): f(x, y) returns [dx, dy], drawn as an arrow every step units
  field((x, y) => {
    const th = x / S
    const om = y / S
    return [om * 12, (-sin(th) - c * om) * 12]
  }, 20, 'rgba(91, 108, 240, 0.6)')

  text('theta', 6.3 * S, 14, 'white', 12, 'right')
  text('omega', 8, 3.8 * S, 'white', 12)

  particles.forEach((p) => {
    // A few small steps per frame keep the integration stable.
    const h = min(dt, 0.05) / 4
    for (let k = 0; k < 4; k++) {
      p.om += (-sin(p.th) - c * p.om) * h
      p.th += p.om * h
    }
    trail('p' + p.id, p.th * S, p.om * S, 150, palette(p.id + 1))
    point(p.th * S, p.om * S, 8, palette(p.id + 1))
  })
  hud('click to drop a particle', 'particles: ' + particles.length)
})
`
	},
	{
		id: 'flow',
		title: 'Flow field',
		group: 'Math',
		description: 'field, random: particles streaming through a swirling vector field.',
		code: `// A swirling vector field with particles streaming through it. f(x, y) returns
// [dx, dy]; field() draws it as arrows, and each particle moves along it.
// random() is seeded, so every run starts with the same particles.
const spawn = (p) => {
  p.x = random(view.left, view.right)
  p.y = random(view.bottom, view.top)
  p.life = random(1, 4)
  return p
}

fit(-300, -200, 600, 400)
const particles = range(500).map(() => spawn({}))

animate((t, dt) => {
  const step = slider('spacing', 15, 60, 30, 5)
  const arrows = toggle('arrows', false)
  const f = (x, y) => [sin(y / 50 + t * 0.5) * 40, cos(x / 50 - t * 0.5) * 40]

  clear('#1d2027')
  if (arrows) field(f, step, 'rgba(91, 108, 240, 0.5)')

  const h = min(dt, 0.05)
  particles.forEach((p) => {
    const [vx, vy] = f(p.x, p.y)
    const nx = p.x + vx * h
    const ny = p.y + vy * h
    // A short streak from the old position, colored by direction
    const angle = (Math.atan2(vy, vx) * 180) / PI
    line(p.x - vx * 0.15, p.y - vy * 0.15, nx, ny, hsl(angle + 200, 80, 65, min(1, p.life)), px(2))
    p.x = nx
    p.y = ny
    p.life -= dt
    if (p.life < 0 || p.x < view.left || p.x > view.right || p.y < view.bottom || p.y > view.top) spawn(p)
  })
})
`
	},
	{
		id: 'mandelbrot',
		title: 'Mandelbrot set',
		group: 'Math',
		description: 'heat, select: smooth escape-time coloring.',
		code: `// The Mandelbrot set with heat(): f(x, y) returns a number from 0 to 1 and heat() colors
// the whole view with it. Pan and zoom to explore; each cell is a few screen pixels.
// select() adds a chooser: click its left or right half to switch colormaps.
const ramp = select('ramp', ['magma', 'inferno', 'plasma', 'turbo', 'viridis', 'cividis', 'hot', 'vexel', 'gray'])
const maxIter = slider('iterations', 20, 300, 80, 1)

clear('#282c34')
heat((x, y) => {
  const cr = x / 200 - 0.5   // 200 world units per unit of the complex plane
  const ci = y / 200
  let zr = 0
  let zi = 0
  let n = 0
  while (n < maxIter && zr * zr + zi * zi < 256) {
    const next = zr * zr - zi * zi + cr
    zi = 2 * zr * zi + ci
    zr = next
    n++
  }
  if (n === maxIter) return 0
  // Smooth coloring: a fractional escape count instead of whole steps, so the
  // bands blend. Math.log is the natural logarithm (plain log prints to the console).
  const smooth = n + 1 - Math.log(Math.log(zr * zr + zi * zi) / 2) / Math.LN2
  return sqrt(max(0, smooth) / maxIter)
}, ramp)

hud('center ' + (view.x / 200 - 0.5).toFixed(5) + ', ' + (view.y / 200).toFixed(5))
`
	},
	{
		id: 'metaballs',
		title: 'Metaballs',
		group: 'Math',
		description: 'heat + contour: an implicit curve around moving blobs and the pointer.',
		code: `// Metaballs: moving blobs shaded with heat() and outlined with contour(), which
// draws the curve where f(x, y) equals the level. One blob follows the pointer.
fit(-250, -170, 500, 340)

animate((t) => {
  const level = slider('threshold', 0.3, 3, 1, 0.1)
  const ramp = select('ramp', ['magma', 'plasma', 'vexel', 'turbo', 'cividis'])
  const blobs = [
    [120 * cos(t * 0.7), 80 * sin(t * 0.9), 60],
    [-100 * sin(t * 0.5), 60 * cos(t * 0.8), 50],
    [80 * cos(t * 0.4 + 2), -90 * sin(t * 0.6), 70],
    [mouse.x, mouse.y, 45]
  ]
  const f = (x, y) =>
    blobs.reduce((sum, [bx, by, r]) => sum + (r * r) / ((x - bx) ** 2 + (y - by) ** 2 + 1), 0)

  clear('#282c34')
  heat((x, y) => min(1, f(x, y) / 3), ramp)   // draw heat first: it is opaque
  contour(f, level, 'white', px(2))
  contour(f, level * 2, 'rgba(255, 255, 255, 0.4)', px(1))
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
const shade = normalize(data.map((d) => d[2]))            // every value rescaled to 0..1

clear('#282c34')
fit(0, 0, cols * cell, rows * cell)

data.forEach(([c, r, v], i) => {
  const t = shade[i]
  const x = c * cell
  const y = r * cell
  // lerp(a, b, t) slides from a to b: blue to red here, and darker to lighter
  rect(x, y, cell - 2, cell - 2, hsl(lerp(240, 0, t), 70, lerp(25, 55, t)))
  if (hover(x + cell / 2, y + cell / 2, cell / 2)) {
    rect(x, y, cell - 2, cell - 2, false, 'white', px(2))
    text(v, x + cell / 2 - 1, y + cell / 2 - 1, 'white', 13, 'center')
    hud('column ' + c + ', row ' + r, 'value ' + v)
  }
})
`
	},
	{
		id: 'charts',
		title: 'Bars and histogram',
		group: 'Data',
		description: 'bars, hist: charts from plain arrays.',
		code: `// A histogram and a bar chart. gauss(mean, sd) draws from a bell curve; like random()
// it is seeded, so the data is the same every time the sketch re-runs.
const samples = range(600).map(() => gauss(100, 30))       // range(600) is [0, 1, ... 599]
const bins = slider('bins', 5, 40, 20, 1)

clear('#282c34')
grid(10, null, 50)
axes()

// hist(list, bins): x is the data value, a bar is as tall as its count.
const counts = hist(samples, bins)
text('600 samples', 100, 120, 'white', 10, 'center')

// bars(list, width, color): bar i stands in the slot from i * width to (i + 1) * width.
ctx.save()
ctx.translate(260, 0)                                     // move the second chart to the right
const sales = [30, 80, 55, 95, 60]
bars(sales, 20, (i) => palette(i))
sales.forEach((v, i) => text(v, i * 20 + 10, v + 6, 'white', 8, 'center'))
ctx.restore()

hud('tallest bin: ' + max(...counts))
fit(-10, -20, 390, 150)
`
	},
	{
		id: 'scatter',
		title: 'Scatter plot',
		group: 'Data',
		description: 'scatter, random, gauss: a spiral galaxy of dots colored by value.',
		code: `// scatter(list, size, ramp) draws dots from [x, y, value] triples, colored by value (0 to 1).
// Here the dots form a two-armed spiral galaxy, colored by distance from the core.
const ramp = select('ramp', ['turbo', 'viridis', 'plasma', 'inferno', 'cividis', 'hot', 'coolwarm', 'vexel', 'gray'])
const n = slider('stars', 200, 4000, 2000, 50)
const twist = slider('twist', 0, 6, 3, 0.1)

seed(42)                                 // random() and gauss() repeat on every re-run

const pts = []
for (let i = 0; i < n; i++) {
  const r = 200 * random() ** 1.5                          // more stars near the core
  const arm = (i % 2) * PI
  const a = arm + (twist * r) / 200 + gauss(0, 0.35)
  pts.push([cos(a) * r + gauss(0, 6), sin(a) * r + gauss(0, 6), 1 - r / 200])
}

clear('#14161b')
scatter(pts, 3, ramp)
fit(...bounds(pts))                      // frame the points; bounds() returns [x, y, w, h]
`
	},
	{
		id: 'keys',
		title: 'Collect the coins',
		group: 'Interactive',
		description: 'key, random, ellipse: a tiny arrow-key game.',
		code: `// A tiny game: steer with the arrow keys or WASD and collect the coins.
// every(10, fn) adds another coin every 10 seconds.
// Click the preview first so it has keyboard focus.
const place = () => [random(-260, 260), random(-170, 170)]

let x = 0
let y = 0
let score = 0
let coins = range(5).map(place)

fit(-300, -200, 600, 400)

animate((t, dt) => {
  const speed = slider('speed', 50, 400, 220)
  const showTrail = toggle('trail', true)
  every(10, () => coins.push(place()))         // a bonus coin every 10 seconds

  // key(name) is true while the key is held.
  const dx = (key('ArrowRight') || key('d') ? 1 : 0) - (key('ArrowLeft') || key('a') ? 1 : 0)
  const dy = (key('ArrowUp') || key('w') ? 1 : 0) - (key('ArrowDown') || key('s') ? 1 : 0)
  x = min(290, max(-290, x + dx * speed * min(dt, 0.1)))
  y = min(190, max(-190, y + dy * speed * min(dt, 0.1)))

  // Pick up any coin we touch and put a new one somewhere else
  coins = coins.map(([cx, cy]) => {
    if (hypot(cx - x, cy - y) > 20) return [cx, cy]
    score++
    return place()
  })

  clear('#282c34')
  grid(20, null, 100)
  rect(-300, -200, 600, 400, false, 'rgba(255, 255, 255, 0.4)', px(2))
  coins.forEach(([cx, cy], i) => {
    // Squash the coin horizontally so it looks like it spins
    ellipse(cx, cy, 8 * abs(cos(t * 3 + i)) + 1, 8, hsl(45, 95, 55), hsl(35, 90, 40), px(1.5))
  })
  if (showTrail) trail('me', x, y, 60, palette(1))
  circle(x, y, 12, palette(0), 'white', px(2))
  hud('score: ' + score, 'fps: ' + round(frame.fps))
})
`
	},
	{
		id: 'mines',
		title: 'Mines',
		group: 'Interactive',
		description: 'mouse.clicked, button, select, key: a minesweeping puzzle.',
		code: `// Mines: open every safe cell without hitting a mine. The first click is always safe.
// Click a cell to open it. To place or remove a flag, hold F or Shift while clicking,
// or turn on 'flag mode'. Click an opened number whose mines are all flagged to open
// the rest of its neighbors at once. Numbers count the mines in the 8 cells around.
const S = 20                                       // cell size in world units
const LEVELS = {
  'easy 9x9': [9, 9, 10],                          // columns, rows, mines
  'medium 16x16': [16, 16, 40],
  'hard 30x16': [30, 16, 99]
}
const NUM_COLORS = ['', '#6c8cff', '#5fd38d', '#ff6b6b', '#b48cff', '#ffb547', '#4fd6d6', '#e6e8f0', '#9aa0b4']

let game = null

function newGame(level) {
  const [w, h, mines] = LEVELS[level]
  game = {
    level, w, h, mines,
    cells: range(w * h).map(() => ({ mine: false, open: false, flag: false, n: 0 })),
    started: false, over: false, won: false, start: 0, end: 0, boom: -1
  }
}

const idx = (x, y) => y * game.w + x
const cellAt = (x, y) => game.cells[idx(x, y)]

function neighbors(x, y) {
  const out = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx
      const ny = y + dy
      if ((dx || dy) && nx >= 0 && ny >= 0 && nx < game.w && ny < game.h) out.push([nx, ny])
    }
  }
  return out
}

// Mines go anywhere except the first clicked cell and its neighbors, so the first
// click always opens an area. Math.random gives a new board every game (random() is
// seeded and would repeat).
function plant(sx, sy) {
  const banned = new Set([idx(sx, sy), ...neighbors(sx, sy).map(([x, y]) => idx(x, y))])
  const free = range(game.w * game.h).filter((i) => !banned.has(i))
  for (let k = 0; k < game.mines && free.length; k++) {
    const j = floor(Math.random() * free.length)
    game.cells[free[j]].mine = true
    free.splice(j, 1)
  }
  for (let y = 0; y < game.h; y++) {
    for (let x = 0; x < game.w; x++) {
      cellAt(x, y).n = neighbors(x, y).filter(([a, b]) => cellAt(a, b).mine).length
    }
  }
}

// Opens a cell; empty cells (no mines around) keep opening their neighbors.
function reveal(x, y) {
  const stack = [[x, y]]
  while (stack.length) {
    const [cx, cy] = stack.pop()
    const c = cellAt(cx, cy)
    if (c.open || c.flag) continue
    c.open = true
    if (c.mine) {
      game.over = true
      game.boom = idx(cx, cy)
    } else if (c.n === 0) {
      stack.push(...neighbors(cx, cy))
    }
  }
}

function click(x, y, flagging, now) {
  if (game.over) return
  const c = cellAt(x, y)
  if (!c.open) {
    if (flagging) {
      c.flag = !c.flag
      return
    }
    if (c.flag) return
    if (!game.started) {
      plant(x, y)
      game.started = true
      game.start = now
    }
    reveal(x, y)
  } else if (c.n > 0) {
    // Chord: the number's mines are all flagged, so the other neighbors are safe
    const around = neighbors(x, y)
    if (around.filter(([a, b]) => cellAt(a, b).flag).length === c.n) {
      around.forEach(([a, b]) => reveal(a, b))
    }
  }
  if (!game.over && game.cells.every((c) => c.mine || c.open)) {
    game.over = true
    game.won = true
    game.cells.forEach((c) => (c.flag = c.mine))
  }
  if (game.over) game.end = now
}

function drawFlag(x, y) {
  line(x + 7, y + 4, x + 7, y + 16, '#e6e8f0', 1.5)
  poly([[x + 7, y + 16], [x + 15, y + 13], [x + 7, y + 10]], '#ff6b6b')
}

function drawMine(x, y) {
  for (let k = 0; k < 4; k++) {
    const a = (k * PI) / 4
    line(x + 10 - 7 * cos(a), y + 10 - 7 * sin(a), x + 10 + 7 * cos(a), y + 10 + 7 * sin(a), '#14161b', 1.5)
  }
  circle(x + 10, y + 10, 5, '#14161b')
  circle(x + 8.5, y + 11.5, 1.5, '#e6e8f0')
}

animate((t) => {
  const level = select('level', Object.keys(LEVELS), 'easy 9x9')
  const flagMode = toggle('flag mode', false)
  const restart = button('new game')
  if (!game || game.level !== level || restart) newGame(level)
  const { w, h } = game

  // The cell under the pointer, if any
  const mx = floor(mouse.x / S)
  const my = floor(mouse.y / S)
  const inside = mx >= 0 && my >= 0 && mx < w && my < h
  if (mouse.clicked && inside) click(mx, my, flagMode || key('f') || key('Shift'), t)

  clear('#1d2027')
  fit(-S, -S * 1.5, (w + 2) * S + 150, (h + 3) * S)    // extra room on the right for the controls
  rect(-4, -4, w * S + 8, h * S + 8, '#2b2f3a')

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = cellAt(x, y)
      const X = x * S
      const Y = y * S
      if (c.open) {
        rect(X + 1, Y + 1, S - 2, S - 2, idx(x, y) === game.boom ? '#c0392b' : '#353a47')
        if (c.mine) drawMine(X, Y)
        else if (c.n) text(c.n, X + S / 2, Y + S / 2, NUM_COLORS[c.n], 13, 'center')
      } else {
        const lit = inside && x === mx && y === my && !game.over
        rect(X + 1, Y + 1, S - 2, S - 2, lit ? '#6f7a99' : '#566079')
        rect(X + 1, Y + S - 4, S - 2, 3, 'rgba(255, 255, 255, 0.12)')   // a little bevel
        if (c.flag) {
          drawFlag(X, Y)
          if (game.over && !c.mine) line(X + 3, Y + 3, X + S - 3, Y + S - 3, '#ffb547', 2)   // wrong flag
        } else if (game.over && c.mine) {
          drawMine(X, Y)
        }
      }
    }
  }

  const flags = game.cells.filter((c) => c.flag).length
  const time = game.started ? floor((game.over ? game.end : t) - game.start) : 0
  text('mines ' + (game.mines - flags), 0, -S * 0.8, '#e6e8f0', 12)
  text('time ' + time, w * S, -S * 0.8, '#e6e8f0', 12, 'right')

  if (game.over) {
    const msg = game.won ? 'Cleared in ' + time + ' s!' : 'Boom! Press new game.'
    rect(w * S / 2 - 90, h * S / 2 - 16, 180, 32, 'rgba(20, 22, 27, 0.85)', game.won ? '#5fd38d' : '#ff6b6b', px(2))
    text(msg, w * S / 2, h * S / 2, game.won ? '#5fd38d' : '#ff6b6b', 14, 'center')
  }
})
`
	},
	{
		id: 'snake',
		title: 'Snake',
		group: 'Interactive',
		description: 'key, button, toggle: a classic grid snake with fixed-step movement.',
		code: `// Snake: steer with the arrow keys or WASD, eat the food, don't bite yourself.
// Click the preview first so it has keyboard focus. Space or 'new game' restarts.
// The snake moves in fixed steps; turns are queued so quick double turns still work.
const S = 20                                         // cell size in world units
const W = 24                                         // columns
const H = 16                                         // rows
const DIRS = {
  up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0]
}
const KEYS = {
  up: ['ArrowUp', 'w'], down: ['ArrowDown', 's'], left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd']
}

let snake, dir, queue, food, score, over, acc, eaten
let best = 0

function placeFood() {
  // Math.random so every game is different (random() is seeded and would repeat)
  do {
    food = [floor(Math.random() * W), floor(Math.random() * H)]
  } while (snake.some(([x, y]) => x === food[0] && y === food[1]))
}

function newGame() {
  snake = [[6, 8], [5, 8], [4, 8]]                   // head first
  dir = DIRS.right
  queue = []
  score = 0
  over = false
  acc = 0
  eaten = -1
  placeFood()
}
newGame()

animate((t, dt) => {
  const speed = slider('speed', 4, 20, 9, 1)         // steps per second
  const wrap = toggle('wrap around walls', false)
  if (button('new game') || (over && key('Space'))) newGame()

  // Queue a turn when a direction key is held, unless it reverses the last queued move
  for (const name in KEYS) {
    if (!KEYS[name].some((k) => key(k))) continue
    const d = DIRS[name]
    const last = queue.length ? queue[queue.length - 1] : dir
    if (d !== last && (d[0] !== -last[0] || d[1] !== -last[1]) && queue.length < 3) queue.push(d)
  }

  // Fixed steps: add up time and move once per 1 / speed seconds
  acc += min(dt, 0.25)
  while (!over && acc >= 1 / speed) {
    acc -= 1 / speed
    if (queue.length) dir = queue.shift()
    let x = snake[0][0] + dir[0]
    let y = snake[0][1] + dir[1]
    if (wrap) {
      x = (x + W) % W
      y = (y + H) % H
    }
    const grows = x === food[0] && y === food[1]
    const body = grows ? snake : snake.slice(0, -1)   // the tail moves away unless we grow
    if (x < 0 || y < 0 || x >= W || y >= H || body.some(([a, b]) => a === x && b === y)) {
      over = true
      best = max(best, score)
      break
    }
    snake = [[x, y], ...body]
    if (grows) {
      score++
      eaten = t
      placeFood()
    }
  }
  if (over) acc = 0

  clear('#1d2027')
  fit(-S, -S * 2, (W + 2) * S + 160, (H + 3) * S)     // extra room on the right for the controls
  rect(0, 0, W * S, H * S, '#262a35', wrap ? 'rgba(255, 255, 255, 0.15)' : '#5b6cf0', px(2))

  // Food pulses; a ring bursts out when it is eaten
  const pulse = 1 + 0.15 * sin(t * 8)
  circle(food[0] * S + S / 2, food[1] * S + S / 2, 6 * pulse, '#ff6b6b')
  const since = t - eaten
  if (eaten >= 0 && since < 0.4) {
    circle(snake[0][0] * S + S / 2, snake[0][1] * S + S / 2, 8 + since * 60, false, hsl(0, 90, 70, 1 - since / 0.4), px(2))
  }

  // Body from tail to head, shading from deep to bright green
  for (let i = snake.length - 1; i >= 0; i--) {
    const [x, y] = snake[i]
    const k = i / max(1, snake.length - 1)
    const pad = i === 0 ? 1 : 2 + k * 2              // the tail tapers
    rect(x * S + pad, y * S + pad, S - 2 * pad, S - 2 * pad, hsl(140 + k * 40, 70, lerp(60, 35, k)))
  }

  // Eyes on the head, looking where it is going
  const [hx, hy] = snake[0]
  const cx = hx * S + S / 2
  const cy = hy * S + S / 2
  const side = [-dir[1], dir[0]]
  for (const sgn of [-1, 1]) {
    const ex = cx + dir[0] * 3 + side[0] * 4 * sgn
    const ey = cy + dir[1] * 3 + side[1] * 4 * sgn
    circle(ex, ey, 2.6, 'white')
    circle(ex + dir[0], ey + dir[1], 1.3, '#14161b')
  }

  text('score ' + score, 0, -S, '#e6e8f0', 13)
  text('best ' + best, W * S, -S, '#aab0c4', 13, 'right')

  if (over) {
    rect(W * S / 2 - 110, H * S / 2 - 26, 220, 52, 'rgba(20, 22, 27, 0.88)', '#ff6b6b', px(2))
    text('Game over: ' + score, W * S / 2, H * S / 2 + 8, '#ff6b6b', 16, 'center')
    text('press Space to play again', W * S / 2, H * S / 2 - 12, '#aab0c4', 10, 'center')
  }
})
`
	},
	{
		id: 'paint',
		title: 'Kaleidoscope paint',
		group: 'Interactive',
		description: 'mouse, button, polyline: draw with rainbow ink and mirror symmetry.',
		code: `// Draw with the mouse: hold the left button and move. To pan, drag with Space held.
// mouse.x and mouse.y are in world coordinates, mouse.down is true while pressed.
// Every stroke is repeated around the center, and mirrored if you like.
const strokes = []
let current = null

fit(-300, -200, 600, 400)

animate((t) => {
  const copies = slider('symmetry', 1, 12, 6, 1)
  const mirror = toggle('mirror', true)
  const width = slider('brush', 1, 10, 3, 0.5)
  if (button('undo')) strokes.pop()
  if (button('clear')) strokes.length = 0

  if (mouse.down) {
    if (!current) {
      current = { pts: [], hue: (t * 40) % 360 }
      strokes.push(current)
    }
    current.pts.push([mouse.x, mouse.y])
  } else {
    current = null
  }

  clear('#14161b')
  circle(0, 0, 3, 'rgba(255, 255, 255, 0.3)')
  strokes.forEach((s) => {
    for (let k = 0; k < copies; k++) {
      const a = (k * 2 * PI) / copies
      const rot = ([x, y]) => [x * cos(a) - y * sin(a), x * sin(a) + y * cos(a)]
      const color = hsl(s.hue + k * 8, 85, 65)
      polyline(s.pts.map(rot), color, px(width))
      if (mirror) polyline(s.pts.map(([x, y]) => rot([x, -y])), color, px(width))
    }
  })
  hud('strokes: ' + strokes.length)
})
`
	}
];

export const EXAMPLE_GROUPS = [...new Set(EXAMPLES.map((e) => e.group))];
