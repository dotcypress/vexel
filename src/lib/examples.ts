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
// backticks or dollar-brace sequences. Keep comments short: Help documents the helpers.
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
		description: 'point, line, circle, rect, poly, text: every drawing helper once.',
		code: `// Every drawing helper once. Y points up and (0, 0) is the center.
clear('#282c34')
grid()
axes()

point(-200, 90, 14, palette(0))
points([[-175, 95], [-155, 80], [-135, 92]], 8, palette(1))
line(-210, 50, -130, 30, palette(2), 3)
polyline([[-210, 0], [-185, -30], [-160, 0], [-135, -30]], palette(3), 3)
curve(-210, -80, -170, -10, -130, -80, palette(4), 3)

circle(0, 70, 30, palette(5))
circle(0, 70, 40, false, palette(5), px(2))
ellipse(0, -5, 45, 20, palette(6), 'white', px(1), PI / 8)
arc(0, -75, 25, 0, PI * 1.5, palette(7), 5)

rect(140, 40, 60, 50, palette(8), 'white', px(1))
rect(210, 40, 25, 50, rgb(255, 160, 40, 0.8))

const star = range(10).map((i) => {
  const r = i % 2 ? 17 : 42
  const a = PI / 2 + (i * PI) / 5
  return [185 + r * cos(a), -40 + r * sin(a)]
})
poly(star, hsl(45, 95, 60), 'white', px(1))

text('shapes', 0, -125, 'white', 20, 'center')
fit(-230, -145, 480, 270)
`
	},
	{
		id: 'clock',
		title: 'Clock',
		group: 'Basics',
		description: 'line, circle, text, animate: an analog clock.',
		code: `// An analog clock showing the current time.
fit(-130, -130, 260, 260)

function hand(turns, length, color, width) {
  const a = PI / 2 - turns * 2 * PI
  line(0, 0, length * cos(a), length * sin(a), color, width)
}

animate(() => {
  const now = new Date()
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  clear('#1d2027')
  circle(0, 0, 110, '#262a35', 'white', 3)
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * 2 * PI
    const inner = i % 5 ? 100 : 92
    line(inner * cos(a), inner * sin(a), 106 * cos(a), 106 * sin(a), 'white', i % 5 ? 1 : 3)
  }
  for (let n = 1; n <= 12; n++) {
    const a = PI / 2 - (n / 12) * 2 * PI
    text(n, 78 * cos(a), 78 * sin(a), '#aab0c4', 14, 'center')
  }

  hand(hours / 12, 55, 'white', 6)
  hand(minutes / 60, 85, 'white', 4)
  hand(seconds / 60, 95, palette(3), 2)
  circle(0, 0, 5, palette(3))
})
`
	},
	{
		id: 'balls',
		title: 'Bouncing balls',
		group: 'Basics',
		description: 'animate, random, mouse.clicked: gravity and bounces.',
		code: `// Balls bouncing under gravity. Click to add one.
const W = 300
const H = 200
const balls = []

function addBall(x, y) {
  balls.push({ x, y, vx: random(-150, 150), vy: random(0, 200), r: random(8, 20), color: palette(balls.length) })
}

for (let i = 0; i < 8; i++) {
  addBall(random(-250, 250), random(0, 150))
}
fit(-W, -H, 2 * W, 2 * H)

animate((t, dt) => {
  const gravity = slider('gravity', 0, 1000, 500)
  const bounce = slider('bounce', 0.5, 1, 0.9, 0.01)
  if (mouse.clicked) {
    addBall(mouse.x, mouse.y)
  }

  dt = min(dt, 0.05)
  for (const b of balls) {
    b.vy -= gravity * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    if (b.y - b.r < -H) {
      b.y = -H + b.r
      b.vy = abs(b.vy) * bounce
    }
    if (abs(b.x) + b.r > W) {
      b.x = sign(b.x) * (W - b.r)
      b.vx = -b.vx
    }
  }

  clear('#1d2027')
  rect(-W, -H, 2 * W, 2 * H, false, '#5b6cf0', px(2))
  for (const b of balls) {
    circle(b.x, b.y, b.r, b.color)
  }
})
`
	},
	{
		id: 'solar',
		title: 'Solar system',
		group: 'Basics',
		description: 'circle, text, toggle: planets on their orbits.',
		code: `// Planets on circular orbits. Inner planets go around faster.
const planets = [
  { name: 'Mercury', r: 40, size: 4, color: '#b0a89f' },
  { name: 'Venus', r: 60, size: 7, color: '#e8c27a' },
  { name: 'Earth', r: 85, size: 7, color: '#5b9cf0' },
  { name: 'Mars', r: 110, size: 5, color: '#e2683c' },
  { name: 'Jupiter', r: 150, size: 14, color: '#d9a066' },
  { name: 'Saturn', r: 195, size: 12, color: '#e8d08f' }
]
let time = 0

fit(-220, -220, 440, 440)

animate((t, dt) => {
  const speed = slider('speed', 0, 5, 1, 0.1)
  const labels = toggle('labels', true)
  time += speed * dt

  clear('#0d0f14')
  circle(0, 0, 18, '#ffcc44')
  planets.forEach((p, i) => {
    const angle = i * 2.4 + (time * 200) / p.r ** 1.5
    const x = p.r * cos(angle)
    const y = p.r * sin(angle)
    circle(0, 0, p.r, false, 'rgba(255, 255, 255, 0.12)', px(1))
    circle(x, y, p.size, p.color)
    if (labels) {
      text(p.name, x + p.size + 4, y, '#aab0c4', 10)
    }
  })
})
`
	},
	{
		id: 'plot',
		title: 'Plot functions',
		group: 'Math',
		description: 'plot, slider, toggle: y = f(x) with live controls.',
		code: `// Graphs of y = f(x). Without animate, the sketch re-runs when a control changes.
const amp = slider('amplitude', 0, 100, 50)
const freq = slider('frequency', 5, 100, 30, 1)
const showCos = toggle('cosine', true)

const curves = [
  ['sin', (x) => amp * sin(x / freq), palette(0)],
  ['1000 / x', (x) => 1000 / x, palette(2)]
]
if (showCos) {
  curves.push(['cos', (x) => amp * cos(x / freq), palette(1)])
}

clear('#282c34')
grid(10, null, 50)
axes()

const labelX = view.right - px(90)
for (const [name, f, color] of curves) {
  plot(f, color, px(2))
  text(name, labelX, f(labelX) + px(12), color, px(13))
}

fit(-300, -150, 600, 300)
`
	},
	{
		id: 'rose',
		title: 'Polar rose',
		group: 'Math',
		description: 'plotPolar, plotParam: r = R cos(n/d theta), spinning.',
		code: `// Polar roses r = R cos(k theta). With k = n / d the curve closes after d turns.
const R = 130
fit(-170, -170, 340, 340)

animate((t) => {
  const n = slider('n', 1, 12, 5, 1)
  const d = slider('d', 1, 9, 4, 1)

  const spin = t * 0.15
  const r = (a) => R * cos((n / d) * a)
  const x = (a) => r(a) * cos(a + spin)
  const y = (a) => r(a) * sin(a + spin)
  const a = (t * 0.9) % (2 * PI * d)

  clear('#282c34')
  grid(25, null, 100)
  plotPolar((a) => R * cos(n * a), 'rgba(255, 255, 255, 0.12)', px(1))
  plotParam(x, y, 0, 2 * PI * d, palette(5), px(2.5))
  trail('dot', x(a), y(a), 60, 'white')
  point(x(a), y(a), 9, 'white')
})
`
	},
	{
		id: 'lissajous',
		title: 'Lissajous curve',
		group: 'Math',
		description: 'animate, plotParam, trail: x = sin(a t), y = sin(b t + phase).',
		code: `// A Lissajous curve whose phase slowly drifts.
fit(-160, -160, 320, 320)

animate((t) => {
  const a = slider('a', 1, 9, 3, 1)
  const b = slider('b', 1, 9, 2, 1)
  const drift = slider('drift', 0, 1, 0.2, 0.01)

  const x = (s) => 120 * sin(a * s)
  const y = (s) => 120 * sin(b * s + t * drift)

  clear('#282c34')
  grid(20, null, 100)
  axes()
  plotParam(x, y, 0, 2 * PI, hsl(t * 20, 80, 70, 0.6), px(1.5))
  trail('dot', x(t), y(t), 120, palette(1))
  point(x(t), y(t), 10, 'white')
})
`
	},
	{
		id: 'spirograph',
		title: 'Spirograph',
		group: 'Math',
		description: 'plotParam, circle, line: a pen on a circle rolling inside another.',
		code: `// A spirograph: a wheel of radius r rolls inside a ring of radius R,
// with a pen at distance d from the wheel's center.
const R = 120
const gcd = (a, b) => (b ? gcd(b, a % b) : a)
let s = 0

fit(-160, -160, 320, 320)

animate((t, dt) => {
  const r = slider('wheel radius', 10, 110, 45, 1)
  const d = slider('pen distance', 0, 110, 70, 1)
  const speed = slider('speed', 0, 10, 3, 0.1)

  const period = 2 * PI * (r / gcd(R, r))
  s = (s + speed * dt) % (period * 1.5)

  const k = (R - r) / r
  const penX = (u) => (R - r) * cos(u) + d * cos(k * u)
  const penY = (u) => (R - r) * sin(u) - d * sin(k * u)

  clear('#1d2027')
  circle(0, 0, R, false, 'rgba(255, 255, 255, 0.2)', px(1))
  plotParam(penX, penY, 0, min(s, period), hsl(s * 15, 85, 65), px(2))

  if (s < period) {
    const wheelX = (R - r) * cos(s)
    const wheelY = (R - r) * sin(s)
    circle(wheelX, wheelY, r, false, 'rgba(255, 255, 255, 0.5)', px(1))
    line(wheelX, wheelY, penX(s), penY(s), 'white', px(1))
    point(penX(s), penY(s), 8, 'white')
  }
})
`
	},
	{
		id: 'fourier',
		title: 'Fourier series',
		group: 'Math',
		description: 'circle, line, polyline: a square wave from circles.',
		code: `// A square wave built from circles: each one adds the next odd harmonic.
const R = 70
const wave = []
fit(-110, -110, 420, 220)

animate((t) => {
  const terms = slider('terms', 1, 20, 4, 1)

  clear('#1d2027')
  let x = 0
  let y = 0
  for (let i = 0; i < terms; i++) {
    const n = 2 * i + 1
    const r = (4 * R) / (n * PI)
    const nx = x + r * cos(n * t)
    const ny = y + r * sin(n * t)
    circle(x, y, r, false, 'rgba(255, 255, 255, 0.25)', px(1))
    line(x, y, nx, ny, 'white', px(1))
    x = nx
    y = ny
  }

  wave.unshift(y)
  if (wave.length > 200) {
    wave.pop()
  }

  line(x, y, 110, y, palette(3), px(1))
  polyline(wave.map((v, i) => [110 + i, v]), palette(2), px(2))
})
`
	},
	{
		id: 'waves',
		title: 'Wave interference',
		group: 'Math',
		description: 'heat, drag: two wave sources you can move.',
		code: `// Two wave sources interfering. Drag the sources around.
fit(-120, -90, 240, 180)

animate((t) => {
  const wavelength = slider('wavelength', 15, 80, 35)
  const a = drag('a', -40, 0, 8, palette(0))
  const b = drag('b', 40, 0, 8, palette(1))

  const k = (2 * PI) / wavelength
  const wave = ([sx, sy], x, y) => sin(k * hypot(x - sx, y - sy) - t * 4)

  heat((x, y) => 0.5 + 0.25 * (wave(a, x, y) + wave(b, x, y)), 'coolwarm')
})
`
	},
	{
		id: 'pendulum',
		title: 'Double pendulum',
		group: 'Math',
		description: 'trail, button: two linked arms going chaotic.',
		code: `// A double pendulum: two linked arms whose motion quickly turns chaotic.
const L = 100
const g = 9.81
let a1, a2, w1, w2

function restart() {
  a1 = PI / 2 + random(-0.2, 0.2)
  a2 = PI / 2 + random(-0.2, 0.2)
  w1 = 0
  w2 = 0
}

// Angular accelerations for equal masses and arm lengths.
function accel(a1, a2, w1, w2) {
  const d = a1 - a2
  const den = 3 - cos(2 * d)
  return [
    (-3 * g * sin(a1) - g * sin(a1 - 2 * a2) - 2 * sin(d) * (w2 * w2 + w1 * w1 * cos(d))) / den,
    (2 * sin(d) * (2 * w1 * w1 + 2 * g * cos(a1) + w2 * w2 * cos(d))) / den
  ]
}

restart()
fit(-230, -230, 460, 460)

animate((t, dt) => {
  if (button('restart')) {
    restart()
  }

  const h = min(dt, 0.05) / 20
  for (let i = 0; i < 20; i++) {
    const [e1, e2] = accel(a1, a2, w1, w2)
    w1 += e1 * h
    w2 += e2 * h
    a1 += w1 * h
    a2 += w2 * h
  }

  const x1 = L * sin(a1)
  const y1 = -L * cos(a1)
  const x2 = x1 + L * sin(a2)
  const y2 = y1 - L * cos(a2)

  clear('#1d2027')
  trail('tip', x2, y2, 400, palette(5))
  line(0, 0, x1, y1, 'white', 3)
  line(x1, y1, x2, y2, 'white', 3)
  circle(0, 0, 4, '#aab0c4')
  circle(x1, y1, 10, palette(0))
  circle(x2, y2, 10, palette(5))
})
`
	},
	{
		id: 'bezier',
		title: 'Bezier curve',
		group: 'Math',
		description: 'drag, plotParam, lerp: drag the control points.',
		code: `// A cubic Bezier curve. Drag the control points; move the slider to see how
// repeated in-between points find the point on the curve.
const P = [
  drag('p0', -150, -60, 8, palette(0)),
  drag('p1', -80, 90, 8, palette(1)),
  drag('p2', 80, 90, 8, palette(2)),
  drag('p3', 150, -60, 8, palette(3))
]
const t = slider('t', 0, 1, 0.4, 0.01)

const between = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
const reduce = (pts, t) => pts.slice(1).map((p, i) => between(pts[i], p, t))

function bezier(t) {
  let pts = P
  while (pts.length > 1) {
    pts = reduce(pts, t)
  }
  return pts[0]
}

clear('#282c34')
grid(20, null, 100)
polyline(P, 'rgba(255, 255, 255, 0.25)', px(1))
plotParam((s) => bezier(s)[0], (s) => bezier(s)[1], 0, 1, 'white', px(2.5))

let pts = reduce(P, t)
for (let level = 0; pts.length > 1; level++) {
  polyline(pts, hsl(200 + level * 50, 80, 65), px(1.5))
  points(pts, 7, hsl(200 + level * 50, 80, 65))
  pts = reduce(pts, t)
}
const [x, y] = pts[0]
point(x, y, 12, palette(5))

fit(-200, -120, 400, 260)
`
	},
	{
		id: 'triangle',
		title: 'Triangle centers',
		group: 'Math',
		description: 'drag, poly, circle: drag the corners and watch the Euler line.',
		code: `// Drag the corners: the centroid G, circumcenter O and orthocenter H
// always lie on one line, the Euler line.
const A = drag('A', -120, -70, 9, palette(0))
const B = drag('B', 130, -50, 9, palette(1))
const C = drag('C', -10, 110, 9, palette(2))

function circumcenter([ax, ay], [bx, by], [cx, cy]) {
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
  const a2 = ax * ax + ay * ay
  const b2 = bx * bx + by * by
  const c2 = cx * cx + cy * cy
  return [
    (a2 * (by - cy) + b2 * (cy - ay) + c2 * (ay - by)) / d,
    (a2 * (cx - bx) + b2 * (ax - cx) + c2 * (bx - ax)) / d
  ]
}

const G = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]
const O = circumcenter(A, B, C)
const H = [3 * G[0] - 2 * O[0], 3 * G[1] - 2 * O[1]]

clear('#282c34')
grid(20, null, 100)
poly([A, B, C], 'rgba(91, 108, 240, 0.15)', 'white', px(2))
circle(O[0], O[1], hypot(A[0] - O[0], A[1] - O[1]), false, palette(3), px(1))
line(O[0], O[1], H[0], H[1], 'rgba(255, 255, 255, 0.5)', px(1))

for (const [name, [x, y], color] of [['G', G, palette(5)], ['O', O, palette(3)], ['H', H, palette(6)]]) {
  point(x, y, px(9), color)
  text(name, x + px(8), y + px(8), color, px(13))
}

fit(-200, -150, 400, 300)
`
	},
	{
		id: 'phase',
		title: 'Phase portrait',
		group: 'Math',
		description: 'field, trail, mouse.clicked: a damped pendulum in the (theta, omega) plane.',
		code: `// Phase portrait of a damped pendulum: angle theta across, speed omega up.
// Click to drop a particle.
const S = 40
const particles = [[-3, 2], [-1, 3], [2, -2.5], [3, 1], [0.5, -1], [-2.5, -1]].map(([th, om]) => ({ th, om }))

fit(-6.5 * S, -4 * S, 13 * S, 8 * S)

animate((t, dt) => {
  const damping = slider('damping', 0, 1, 0.2, 0.01)
  const accel = (th, om) => -sin(th) - damping * om

  if (mouse.clicked && particles.length < 40) {
    particles.push({ th: mouse.x / S, om: mouse.y / S })
  }

  clear('#282c34')
  grid(S / 2, null, S)
  axes()
  field((x, y) => [(y / S) * 12, accel(x / S, y / S) * 12], 20, 'rgba(91, 108, 240, 0.6)')
  text('theta', 6.3 * S, 14, 'white', 12, 'right')
  text('omega', 8, 3.8 * S, 'white', 12)

  const h = min(dt, 0.05) / 4
  particles.forEach((p, i) => {
    for (let k = 0; k < 4; k++) {
      p.om += accel(p.th, p.om) * h
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
		title: 'Flow field',
		group: 'Math',
		description: 'field, random: particles streaming through a swirling vector field.',
		code: `// Particles streaming through a swirling vector field.
fit(-300, -200, 600, 400)

const spawn = (p) =>
  Object.assign(p, {
    x: random(view.left, view.right),
    y: random(view.bottom, view.top),
    life: random(1, 4)
  })
const outside = (p) => p.x < view.left || p.x > view.right || p.y < view.bottom || p.y > view.top
const particles = range(500).map(() => spawn({}))

animate((t, dt) => {
  const arrows = toggle('arrows', false)
  const flow = (x, y) => [40 * sin(y / 50 + t / 2), 40 * cos(x / 50 - t / 2)]

  clear('#1d2027')
  if (arrows) {
    field(flow, 30, 'rgba(91, 108, 240, 0.5)')
  }

  for (const p of particles) {
    const [vx, vy] = flow(p.x, p.y)
    const hue = (atan2(vy, vx) * 180) / PI + 200
    line(p.x - vx * 0.15, p.y - vy * 0.15, p.x, p.y, hsl(hue, 80, 65, min(1, p.life)), px(2))

    p.x += vx * min(dt, 0.05)
    p.y += vy * min(dt, 0.05)
    p.life -= dt
    if (p.life < 0 || outside(p)) {
      spawn(p)
    }
  }
})
`
	},
	{
		id: 'mandelbrot',
		title: 'Mandelbrot set',
		group: 'Math',
		description: 'heat, select: smooth escape-time coloring.',
		code: `// The Mandelbrot set. Pan and zoom to explore.
const ramp = select('ramp', ['magma', 'inferno', 'plasma', 'turbo', 'viridis', 'cividis', 'hot', 'vexel', 'gray'])
const maxIter = slider('iterations', 20, 300, 80, 1)
const scale = 200

// Smooth escape time of c = cr + ci i, or maxIter if it never escapes.
function escape(cr, ci) {
  let zr = 0
  let zi = 0
  for (let n = 0; n < maxIter; n++) {
    const zr2 = zr * zr
    const zi2 = zi * zi
    if (zr2 + zi2 > 256) {
      return n + 1 - log2(Math.log(zr2 + zi2) / 2)
    }
    zi = 2 * zr * zi + ci
    zr = zr2 - zi2 + cr
  }
  return maxIter
}

clear('#282c34')
heat((x, y) => {
  const n = escape(x / scale - 0.5, y / scale)
  return n >= maxIter ? 0 : sqrt(max(0, n) / maxIter)
}, ramp)
`
	},
	{
		id: 'metaballs',
		title: 'Metaballs',
		group: 'Math',
		description: 'heat + contour: an implicit curve around moving blobs and the pointer.',
		code: `// Metaballs: blobs that melt together as they move. One follows the pointer.
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
  const strength = (x, y) =>
    blobs.reduce((sum, [bx, by, r]) => sum + (r * r) / ((x - bx) ** 2 + (y - by) ** 2 + 1), 0)

  clear('#282c34')
  heat((x, y) => min(1, strength(x, y) / 3), ramp)
  contour(strength, level, 'white', px(2))
  contour(strength, level * 2, 'rgba(255, 255, 255, 0.4)', px(1))
})
`
	},
	{
		id: 'heatmap',
		title: 'Heatmap from data',
		group: 'Data',
		description: 'rect, hsl, hover: a grid of [column, row, value] triples.',
		code: `// A heatmap from [column, row, value] data. Hover a cell to read its value.
const cols = 14
const rows = 9
const cell = 36

const data = []
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    data.push([c, r, round(50 + 40 * sin(c / 2.2) * cos(r / 1.7) + 10 * sin(c * r))])
  }
}
const shade = normalize(data.map(([c, r, v]) => v))

clear('#282c34')
fit(0, 0, cols * cell, rows * cell)

data.forEach(([c, r, v], i) => {
  const x = c * cell
  const y = r * cell
  const t = shade[i]
  rect(x, y, cell - 2, cell - 2, hsl(lerp(240, 0, t), 70, lerp(25, 55, t)))

  if (hover(x + cell / 2, y + cell / 2, cell / 2)) {
    rect(x, y, cell - 2, cell - 2, false, 'white', px(2))
    text(v, x + cell / 2 - 1, y + cell / 2 - 1, 'white', 13, 'center')
  }
})
`
	},
	{
		id: 'charts',
		title: 'Bars and histogram',
		group: 'Data',
		description: 'bars, hist: charts from plain arrays.',
		code: `// A histogram of random samples, and a bar chart next to it.
const bins = slider('bins', 5, 40, 20, 1)
const samples = range(600).map(() => gauss(100, 30))
const sales = [30, 80, 55, 95, 60]

clear('#282c34')
grid(10, null, 50)
axes()

hist(samples, bins)
text('600 samples', 100, 120, 'white', 10, 'center')

ctx.save()
ctx.translate(260, 0)
bars(sales, 20, (i) => palette(i))
sales.forEach((v, i) => text(v, i * 20 + 10, v + 6, 'white', 8, 'center'))
ctx.restore()

fit(-10, -20, 390, 150)
`
	},
	{
		id: 'scatter',
		title: 'Scatter plot',
		group: 'Data',
		description: 'scatter, random, gauss: a spiral galaxy of dots colored by value.',
		code: `// A two-armed spiral galaxy, colored by distance from the core.
const ramp = select('ramp', ['turbo', 'viridis', 'plasma', 'inferno', 'cividis', 'hot', 'coolwarm', 'vexel', 'gray'])
const count = slider('stars', 200, 4000, 2000, 50)
const twist = slider('twist', 0, 6, 3, 0.1)

const stars = range(count).map((i) => {
  const r = 200 * random() ** 1.5
  const a = (i % 2) * PI + (twist * r) / 200 + gauss(0, 0.35)
  return [cos(a) * r + gauss(0, 6), sin(a) * r + gauss(0, 6), 1 - r / 200]
})

clear('#14161b')
scatter(stars, 3, ramp)
fit(...bounds(stars))
`
	},
	{
		id: 'donut',
		title: 'Donut chart',
		group: 'Data',
		description: 'poly, linspace, text: slices that pop out on hover.',
		code: `// A donut chart. Hover a slice to pull it out.
const data = [
  ['Rent', 1200],
  ['Food', 450],
  ['Transport', 180],
  ['Fun', 220],
  ['Savings', 500]
]
const total = data.reduce((sum, [label, value]) => sum + value, 0)

// Turns go clockwise from the top: 0 is 12 o'clock, 0.25 is 3 o'clock.
const angle = (turn) => PI / 2 - turn * 2 * PI

function slice(from, to, inner, outer, dx, dy) {
  const ring = (r, a, b) =>
    linspace(a, b, 40).map((turn) => [dx + r * cos(angle(turn)), dy + r * sin(angle(turn))])
  return [...ring(outer, from, to), ...ring(inner, to, from)]
}

fit(-220, -150, 440, 300)

animate(() => {
  const mouseTurn = (angle(0) - atan2(mouse.y, mouse.x)) / (2 * PI)
  const pointerTurn = mouseTurn - floor(mouseTurn)
  const pointerR = hypot(mouse.x, mouse.y)

  clear('#282c34')
  let from = 0
  data.forEach(([label, value], i) => {
    const to = from + value / total
    const hovered = pointerR > 60 && pointerR < 110 && pointerTurn >= from && pointerTurn < to
    const mid = angle((from + to) / 2)
    const pop = hovered ? 10 : 0

    poly(slice(from, to, 60, 110, pop * cos(mid), pop * sin(mid)), palette(i), '#282c34', px(2))
    const percent = round((value / total) * 100) + '%'
    text(label + ' ' + percent, 130 * cos(mid), 130 * sin(mid), hovered ? 'white' : '#aab0c4', 12, cos(mid) >= 0 ? 'left' : 'right')
    if (hovered) {
      text(value, 0, 0, 'white', 22, 'center')
    }
    from = to
  })
})
`
	},
	{
		id: 'sort',
		title: 'Bubble sort',
		group: 'Data',
		description: 'bars, button, random: watch a list get sorted.',
		code: `// Bubble sort: compare neighbors and swap them until every bar is in order.
const N = 40
let values, pass, j, done

function shuffle() {
  values = range(N).map(() => round(random(5, 100)))
  pass = 0
  j = 0
  done = false
}

function compare() {
  if (done) {
    return
  }
  if (values[j] > values[j + 1]) {
    [values[j], values[j + 1]] = [values[j + 1], values[j]]
  }
  j++
  if (j >= N - 1 - pass) {
    j = 0
    pass++
  }
  done = pass >= N - 1
}

function barColor(i) {
  if (done || i >= N - pass) {
    return palette(2)
  }
  if (i === j || i === j + 1) {
    return palette(3)
  }
  return '#566079'
}

shuffle()
fit(-10, -15, N * 10 + 200, 130)

animate(() => {
  const speed = slider('steps per frame', 1, 50, 5, 1)
  if (button('shuffle')) {
    shuffle()
  }
  for (let k = 0; k < speed; k++) {
    compare()
  }

  clear('#282c34')
  bars(values, 10, barColor)
  text(done ? 'sorted!' : 'pass ' + (pass + 1), 0, -8, '#aab0c4', 10)
})
`
	},
	{
		id: 'tree',
		title: 'Fractal tree',
		group: 'Generative',
		description: 'line, slider: a recursive tree swaying in the wind.',
		code: `// A fractal tree: every branch splits into two smaller ones.
fit(-200, -160, 400, 330)

animate((t) => {
  const depth = slider('depth', 1, 12, 9, 1)
  const spread = slider('spread', 0, 90, 25, 1)
  const shrink = slider('shrink', 0.5, 0.85, 0.72, 0.01)
  const wind = slider('wind', 0, 1, 0.3, 0.01)

  function branch(x, y, angle, length, level) {
    const k = level / depth
    const x2 = x + length * cos(angle)
    const y2 = y + length * sin(angle)
    line(x, y, x2, y2, hsl(lerp(30, 120, k), 60, lerp(30, 55, k)), max(1, (depth - level) * 1.5))
    if (level >= depth) {
      return
    }

    const turn = (spread * PI) / 180
    const sway = wind * 0.05 * sin(t * 1.5 + level)
    branch(x2, y2, angle + turn + sway, length * shrink, level + 1)
    branch(x2, y2, angle - turn + sway, length * shrink, level + 1)
  }

  clear('#1d2027')
  branch(0, -150, PI / 2, 90, 1)
})
`
	},
	{
		id: 'walk',
		title: 'Random walks',
		group: 'Generative',
		description: 'random, seed, polyline: wandering paths.',
		code: `// Random walks: each step goes the same distance in a random direction.
const walkers = slider('walkers', 1, 12, 6, 1)
const steps = slider('steps', 100, 3000, 1000, 100)
seed(slider('seed', 1, 100, 1, 1))

clear('#14161b')
grid(50, null, 250)

for (let w = 0; w < walkers; w++) {
  let x = 0
  let y = 0
  const path = [[x, y]]
  for (let i = 0; i < steps; i++) {
    const a = random(2 * PI)
    x += 5 * cos(a)
    y += 5 * sin(a)
    path.push([x, y])
  }
  polyline(path, hsl(w * 30, 80, 65, 0.7), px(1.5))
  point(x, y, 8, hsl(w * 30, 80, 65))
}

point(0, 0, 10, 'white')
fit(-250, -250, 500, 500)
`
	},
	{
		id: 'stars',
		title: 'Starfield',
		group: 'Generative',
		description: 'line, random: flying through space.',
		code: `// Flying through a field of stars.
const stars = range(400).map(() => ({ x: random(-1, 1), y: random(-1, 1), z: random() }))
const project = (s, z) => [(s.x / z) * 150, (s.y / z) * 150]

fit(-200, -150, 400, 300)

animate((t, dt) => {
  const speed = slider('speed', 0, 2, 0.4, 0.01)

  clear('#05060a')
  for (const s of stars) {
    const [x0, y0] = project(s, s.z)
    s.z -= speed * dt
    if (s.z < 0.02) {
      Object.assign(s, { x: random(-1, 1), y: random(-1, 1), z: 1 })
      continue
    }
    const [x1, y1] = project(s, s.z)
    const near = 1 - s.z
    line(x0, y0, x1, y1, hsl(220, 60, 50 + near * 45, near), px(0.5 + near * 3))
  }
})
`
	},
	{
		id: 'koch',
		title: 'Koch snowflake',
		group: 'Generative',
		description: 'poly, recursion: a fractal edge.',
		code: `// The Koch snowflake: replace the middle third of every edge with a spike, again and again.
const depth = slider('depth', 0, 6, 4, 1)

const rotate = ([x, y], a) => [x * cos(a) - y * sin(a), x * sin(a) + y * cos(a)]

// Points from a toward b, not including b.
function koch(a, b, level) {
  if (level === 0) {
    return [a]
  }
  const d = [(b[0] - a[0]) / 3, (b[1] - a[1]) / 3]
  const p1 = [a[0] + d[0], a[1] + d[1]]
  const p3 = [a[0] + 2 * d[0], a[1] + 2 * d[1]]
  const spike = rotate(d, -PI / 3)
  const p2 = [p1[0] + spike[0], p1[1] + spike[1]]
  return [...koch(a, p1, level - 1), ...koch(p1, p2, level - 1), ...koch(p2, p3, level - 1), ...koch(p3, b, level - 1)]
}

const corners = [90, 210, 330].map((deg) => [120 * cos((deg * PI) / 180), 120 * sin((deg * PI) / 180)])
const outline = corners.flatMap((c, i) => koch(c, corners[(i + 1) % 3], depth))

clear('#1d2027')
poly(outline, 'rgba(91, 108, 240, 0.25)', '#9fb4ff', px(1.5))
hud(outline.length + ' edges')
fit(-160, -130, 320, 300)
`
	},
	{
		id: 'keys',
		title: 'Collect the coins',
		group: 'Interactive',
		description: 'key, random, ellipse: a tiny arrow-key game.',
		code: `// Collect the coins with the arrow keys or WASD. Click the preview first.
const place = () => [random(-260, 260), random(-170, 170)]
const clamp = (v, lo, hi) => min(hi, max(lo, v))
const axis = (plus, minus) => (plus ? 1 : 0) - (minus ? 1 : 0)

let x = 0
let y = 0
let score = 0
let coins = range(5).map(place)

fit(-300, -200, 600, 400)

animate((t, dt) => {
  const speed = slider('speed', 50, 400, 220)
  every(10, () => coins.push(place()))

  const step = speed * min(dt, 0.1)
  x = clamp(x + axis(key('ArrowRight') || key('d'), key('ArrowLeft') || key('a')) * step, -290, 290)
  y = clamp(y + axis(key('ArrowUp') || key('w'), key('ArrowDown') || key('s')) * step, -190, 190)

  coins = coins.map((coin) => {
    if (hypot(coin[0] - x, coin[1] - y) > 20) {
      return coin
    }
    score++
    return place()
  })

  clear('#282c34')
  grid(20, null, 100)
  rect(-300, -200, 600, 400, false, 'rgba(255, 255, 255, 0.4)', px(2))
  coins.forEach(([cx, cy], i) => {
    const spin = abs(cos(t * 3 + i))
    ellipse(cx, cy, 8 * spin + 1, 8, hsl(45, 95, 55), hsl(35, 90, 40), px(1.5))
  })
  trail('me', x, y, 60, palette(1))
  circle(x, y, 12, palette(0), 'white', px(2))
  hud('score: ' + score)
})
`
	},
	{
		id: 'mines',
		title: 'Mines',
		group: 'Interactive',
		description: 'mouse.clicked, button, key, lockView: a minesweeping puzzle.',
		code: `// Open every safe cell without hitting a mine. Numbers count the mines around.
// Click to open a cell; hold F or Shift while clicking to flag it.
const W = 12
const H = 10
const MINES = 18
const S = 20
const COLORS = ['', '#6c8cff', '#5fd38d', '#ff6b6b', '#b48cff', '#ffb547', '#4fd6d6', '#e6e8f0', '#9aa0b4']

let cells, started, over, won

function newGame() {
  cells = range(W * H).map((i) => ({ x: i % W, y: floor(i / W), mine: false, open: false, flag: false, n: 0 }))
  started = over = won = false
}

const at = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? cells[y * W + x] : null)

function neighbors(c) {
  const out = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const n = (dx || dy) && at(c.x + dx, c.y + dy)
      if (n) {
        out.push(n)
      }
    }
  }
  return out
}

// Mines are placed after the first click, away from it, so it is always safe.
function plant(first) {
  const free = cells.filter((c) => c !== first && !neighbors(first).includes(c))
  for (let k = 0; k < MINES; k++) {
    free.splice(floor(Math.random() * free.length), 1)[0].mine = true
  }
  cells.forEach((c) => (c.n = neighbors(c).filter((o) => o.mine).length))
}

function reveal(c) {
  if (c.open || c.flag) {
    return
  }
  c.open = true
  if (c.mine) {
    over = true
  } else if (c.n === 0) {
    neighbors(c).forEach(reveal)
  }
}

function cellColor(c, hovered) {
  if (c.open || (over && c.mine)) {
    return c.mine ? '#c0392b' : '#353a47'
  }
  return c === hovered && !over ? '#6f7a99' : '#566079'
}

newGame()
lockView()
fit(-S, -S * 1.5, (W + 2) * S + 150, (H + 3) * S)

animate(() => {
  if (button('new game')) {
    newGame()
  }

  const hovered = at(floor(mouse.x / S), floor(mouse.y / S))
  if (mouse.clicked && hovered && !over) {
    if (key('f') || key('Shift')) {
      if (!hovered.open) {
        hovered.flag = !hovered.flag
      }
    } else {
      if (!started) {
        plant(hovered)
      }
      started = true
      reveal(hovered)
      won = !over && cells.every((c) => c.mine || c.open)
      over = over || won
    }
  }

  clear('#1d2027')
  for (const c of cells) {
    const X = c.x * S
    const Y = c.y * S
    rect(X + 1, Y + 1, S - 2, S - 2, cellColor(c, hovered))
    if ((c.open || over) && c.mine) {
      circle(X + S / 2, Y + S / 2, 5, '#14161b')
    } else if (c.open && c.n) {
      text(c.n, X + S / 2, Y + S / 2, COLORS[c.n], 13, 'center')
    } else if (c.flag) {
      poly([[X + 6, Y + 4], [X + 6, Y + 16], [X + 15, Y + 12]], '#ff6b6b')
    }
  }

  const flags = cells.filter((c) => c.flag).length
  text('mines left ' + (MINES - flags), 0, -S * 0.8, '#e6e8f0', 12)
  if (won) {
    text('Cleared!', W * S, -S * 0.8, '#5fd38d', 12, 'right')
  } else if (over) {
    text('Boom! Press new game.', W * S, -S * 0.8, '#ff6b6b', 12, 'right')
  }
})
`
	},
	{
		id: 'life',
		title: 'Game of Life',
		group: 'Interactive',
		description: 'every, button, toggle, mouse.clicked: cells that live and die.',
		code: `// Conway's Game of Life. Click cells to flip them.
const W = 40
const H = 26
const S = 10

const randomCells = () => range(W * H).map(() => random() < 0.25)
let cells = randomCells()

const alive = (x, y) => cells[((y + H) % H) * W + ((x + W) % W)]

function neighbors(x, y) {
  let n = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && alive(x + dx, y + dy)) {
        n++
      }
    }
  }
  return n
}

function step() {
  cells = cells.map((on, i) => {
    const n = neighbors(i % W, floor(i / W))
    return n === 3 || (on && n === 2)
  })
}

lockView()
fit(-S, -S, W * S + 220, H * S + 2 * S)

animate(() => {
  const playing = toggle('play', true)
  const speed = slider('steps per second', 1, 30, 10, 1)
  if (button('step')) {
    step()
  }
  if (button('randomize')) {
    cells = randomCells()
  }
  if (button('clear')) {
    cells = cells.map(() => false)
  }
  if (playing) {
    every(1 / speed, step)
  }

  const x = floor(mouse.x / S)
  const y = floor(mouse.y / S)
  if (mouse.clicked && x >= 0 && y >= 0 && x < W && y < H) {
    cells[y * W + x] = !cells[y * W + x]
  }

  clear('#14161b')
  rect(0, 0, W * S, H * S, '#1d2027')
  cells.forEach((on, i) => {
    if (on) {
      rect((i % W) * S + 0.5, floor(i / W) * S + 0.5, S - 1, S - 1, palette(2))
    }
  })
})
`
	},
	{
		id: 'snake',
		title: 'Snake',
		group: 'Interactive',
		description: 'key, slider, lockView: a grid snake with fixed-step movement.',
		code: `// Steer with the arrow keys or WASD, eat the food, avoid walls and your own tail.
// Click the preview first. Space restarts.
const W = 24
const H = 16
const S = 20

let snake, dir, next, food, score, over, timer

const same = (a, b) => a[0] === b[0] && a[1] === b[1]
const outside = ([x, y]) => x < 0 || y < 0 || x >= W || y >= H

function placeFood() {
  do {
    food = [floor(Math.random() * W), floor(Math.random() * H)]
  } while (snake.some((part) => same(part, food)))
}

function newGame() {
  snake = [[6, 8], [5, 8], [4, 8]]
  dir = next = [1, 0]
  score = 0
  over = false
  timer = 0
  placeFood()
}

function step() {
  if (!same(next, [-dir[0], -dir[1]])) {
    dir = next
  }
  const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]]
  const grows = same(head, food)
  const body = grows ? snake : snake.slice(0, -1)
  if (outside(head) || body.some((part) => same(part, head))) {
    over = true
    return
  }
  snake = [head, ...body]
  if (grows) {
    score++
    placeFood()
  }
}

newGame()
lockView()
fit(-S, -S * 2, (W + 2) * S + 160, (H + 3) * S)

animate((t, dt) => {
  const speed = slider('speed', 4, 20, 9, 1)
  if (over && key('Space')) {
    newGame()
  }

  if (key('ArrowUp') || key('w')) {
    next = [0, 1]
  }
  if (key('ArrowDown') || key('s')) {
    next = [0, -1]
  }
  if (key('ArrowLeft') || key('a')) {
    next = [-1, 0]
  }
  if (key('ArrowRight') || key('d')) {
    next = [1, 0]
  }

  timer += min(dt, 0.25)
  while (!over && timer >= 1 / speed) {
    timer -= 1 / speed
    step()
  }

  clear('#1d2027')
  rect(0, 0, W * S, H * S, '#262a35', '#5b6cf0', px(2))
  circle(food[0] * S + S / 2, food[1] * S + S / 2, 6 + sin(t * 8), '#ff6b6b')
  snake.forEach(([x, y], i) => {
    const k = i / snake.length
    rect(x * S + 1, y * S + 1, S - 2, S - 2, hsl(140 + k * 40, 70, lerp(60, 35, k)))
  })

  text('score ' + score, 0, -S, '#e6e8f0', 13)
  if (over) {
    text('Game over! Press Space to play again.', W * S, -S, '#ff6b6b', 13, 'right')
  }
})
`
	},
	{
		id: 'pong',
		title: 'Pong',
		group: 'Interactive',
		description: 'mouse, lockView: paddle versus computer.',
		code: `// Pong against the computer. Move your paddle (left) with the mouse.
const W = 300
const H = 180
const PADDLE = 40
const R = 6
let ball
let cpuY = 0
let you = 0
let cpu = 0

const clamp = (v, lo, hi) => min(hi, max(lo, v))

function serve(direction) {
  ball = { x: 0, y: 0, vx: 220 * direction, vy: random(-120, 120) }
}

function bounceOff(paddleY, x) {
  if (abs(ball.y - paddleY) > PADDLE + R) {
    return
  }
  ball.x = x
  ball.vx = clamp(-ball.vx * 1.05, -600, 600)
  ball.vy += (ball.y - paddleY) * 4
}

serve(1)
lockView()
fit(-W - 20, -H - 40, 2 * W + 40, 2 * H + 60)

animate((t, dt) => {
  dt = min(dt, 0.05)
  const youY = clamp(mouse.y, -H + PADDLE, H - PADDLE)
  cpuY += clamp(ball.y - cpuY, -160 * dt, 160 * dt)

  ball.x += ball.vx * dt
  ball.y += ball.vy * dt
  if (abs(ball.y) > H - R) {
    ball.y = sign(ball.y) * (H - R)
    ball.vy = -ball.vy
  }
  if (ball.vx < 0 && ball.x < -W + 16 + R) {
    bounceOff(youY, -W + 16 + R)
  }
  if (ball.vx > 0 && ball.x > W - 16 - R) {
    bounceOff(cpuY, W - 16 - R)
  }
  if (ball.x < -W - 20) {
    cpu++
    serve(1)
  }
  if (ball.x > W + 20) {
    you++
    serve(-1)
  }

  clear('#1d2027')
  rect(-W, -H, 2 * W, 2 * H, false, '#5b6cf0', px(2))
  for (let y = -H + 10; y < H; y += 20) {
    line(0, y, 0, y + 10, 'rgba(255, 255, 255, 0.2)', 2)
  }
  rect(-W + 8, youY - PADDLE, 8, 2 * PADDLE, palette(0))
  rect(W - 16, cpuY - PADDLE, 8, 2 * PADDLE, palette(3))
  circle(ball.x, ball.y, R, 'white')
  text(you + ' : ' + cpu, 0, -H - 20, 'white', 18, 'center')
})
`
	},
	{
		id: 'paint',
		title: 'Kaleidoscope paint',
		group: 'Interactive',
		description: 'mouse, button, polyline: draw with rainbow ink and mirror symmetry.',
		code: `// Draw with the mouse; every stroke is repeated around the center.
// Hold Space and drag to pan.
const strokes = []
let current = null

const rotate = ([x, y], a) => [x * cos(a) - y * sin(a), x * sin(a) + y * cos(a)]

fit(-300, -200, 600, 400)

animate((t) => {
  const copies = slider('symmetry', 1, 12, 6, 1)
  const mirror = toggle('mirror', true)
  const width = slider('brush', 1, 10, 3, 0.5)
  if (button('undo')) {
    strokes.pop()
  }
  if (button('clear')) {
    strokes.length = 0
  }

  if (mouse.clicked) {
    current = { points: [], hue: (t * 40) % 360 }
    strokes.push(current)
  }
  if (!mouse.down) {
    current = null
  }
  if (current) {
    current.points.push([mouse.x, mouse.y])
  }

  clear('#14161b')
  for (const { points, hue } of strokes) {
    for (let k = 0; k < copies; k++) {
      const a = (k * 2 * PI) / copies
      const color = hsl(hue + k * 8, 85, 65)
      polyline(points.map((p) => rotate(p, a)), color, px(width))
      if (mirror) {
        polyline(points.map(([x, y]) => rotate([x, -y], a)), color, px(width))
      }
    }
  }
})
`
	}
];

export const EXAMPLE_GROUPS = [...new Set(EXAMPLES.map((e) => e.group))];
