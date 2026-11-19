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
    description: 'point, line, arrow, bezier, spline, circle, wedge, poly, label, dims: every drawing helper once.',
    code: `// Every drawing helper once. Y points up and (0, 0) is the center.
// Zoom in and out: world sizes scale, px() and label() sizes stay the same.
const THICK = 3
const MUTED = '#aab0c4'

// Star: points alternate between the outer and inner radius
const STAR_X = 185
const STAR_Y = -40
const STAR_OUTER = 42
const STAR_INNER = 17
const STAR_POINTS = 5

clear()
grid()
axes()

// Left column: dots, lines and curves
point(-200, 90, palette(0), 14)
points([[-175, 95], [-155, 80], [-135, 92]], palette(1), 8)
line(-210, 50, -130, 30, palette(2), THICK)
polyline([[-210, 0], [-185, -30], [-160, 0], [-135, -30]], palette(3), THICK)
curve(-210, -80, -170, -10, -130, -80, palette(4), THICK)
bezier(-210, -110, -190, -60, -150, -150, -130, -100, palette(9), THICK)

// Second column: arrows, dashes and a smooth spline
arrow(-110, 90, -60, 110, 'white', px(2))
line(-110, 60, -60, 60, { color: 'white', width: px(2), dash: [6, 4] })
spline([[-110, 20], [-95, 40], [-80, 10], [-65, 35]], palette(10), THICK)
wedge(-80, -75, 30, PI / 6, PI * 1.3, palette(11))

// Middle: round shapes
circle(0, 70, 30, palette(5))
circle(0, 70, 40, false, palette(5), px(2))
ellipse(0, -5, 45, 20, palette(6), 'white', px(1), PI / 8)
arc(0, -75, 25, 0, PI * 1.5, palette(7), 5)

// Right: rectangles with a dimension line, and a star polygon
rect(140, 40, 60, 50, palette(8), 'white', px(1))
dims(140, 90, 200, 90)
rect(210, 40, 25, 50, rgb(255, 160, 40, 0.8))

const star = range(2 * STAR_POINTS).map((i) => {
  const radius = i % 2 ? STAR_INNER : STAR_OUTER
  const angle = PI / 2 + (i * PI) / STAR_POINTS
  return add([STAR_X, STAR_Y], polar(radius, angle))
})
poly(star, hsl(45, 95, 60), 'white', px(1))

text('shapes', 0, -125, 'white', 20, 'center')
label('label() keeps its size when you zoom', STAR_X, -100, MUTED, 11, 'center')
fit(-230, -160, 480, 290)
`
  },
  {
    id: 'clock',
    title: 'Clock',
    group: 'Basics',
    description: 'line, polar, text, animate: an analog clock.',
    code: `// An analog clock showing the current time.
const FACE_RADIUS = 110
const FACE_COLOR = '#262a35'
const NUMBER_COLOR = '#aab0c4'
const SECOND_COLOR = palette(3)

// Tick marks run from their inner radius out to TICK_OUTER
const TICK_OUTER = 106
const MINUTE_TICK_INNER = 100
const HOUR_TICK_INNER = 92
const NUMBER_RADIUS = 78

// Hands: [length, width]
const HOUR_HAND = [55, 6]
const MINUTE_HAND = [85, 4]
const SECOND_HAND = [95, 2]
const HUB_RADIUS = 5

fit(-130, -130, 260, 260)

// Clock angles: 0 turns is 12 o'clock, and turns go clockwise.
const clockAngle = (turns) => PI / 2 - turns * 2 * PI

function hand(turns, [length, width], color) {
  line(0, 0, ...polar(length, clockAngle(turns)), color, width)
}

function drawFace() {
  circle(0, 0, FACE_RADIUS, FACE_COLOR, 'white', 3)
  for (let i = 0; i < 60; i++) {
    const angle = clockAngle(i / 60)
    const isHour = i % 5 === 0
    const inner = isHour ? HOUR_TICK_INNER : MINUTE_TICK_INNER
    line(...polar(inner, angle), ...polar(TICK_OUTER, angle), 'white', isHour ? 3 : 1)
  }
  for (let n = 1; n <= 12; n++) {
    text(n, ...polar(NUMBER_RADIUS, clockAngle(n / 12)), NUMBER_COLOR, 14, 'center')
  }
}

animate(() => {
  const now = new Date()
  const seconds = now.getSeconds() + now.getMilliseconds() / 1000
  const minutes = now.getMinutes() + seconds / 60
  const hours = (now.getHours() % 12) + minutes / 60

  clear()
  drawFace()
  hand(hours / 12, HOUR_HAND, 'white')
  hand(minutes / 60, MINUTE_HAND, 'white')
  hand(seconds / 60, SECOND_HAND, SECOND_COLOR)
  circle(0, 0, HUB_RADIUS, SECOND_COLOR)
})
`
  },
  {
    id: 'balls',
    title: 'Bouncing balls',
    group: 'Basics',
    description: 'animate, random, mouse.clicked: gravity and bounces.',
    code: `// Balls bouncing under gravity. Click to add one.
// The box spans -HALF_WIDTH..HALF_WIDTH and -HALF_HEIGHT..HALF_HEIGHT
const HALF_WIDTH = 300
const HALF_HEIGHT = 200
const WALL_COLOR = '#5b6cf0'

// New balls get a random sideways speed, upward speed and radius
const MAX_SIDE_SPEED = 150
const MAX_UP_SPEED = 200
const MIN_RADIUS = 8
const MAX_RADIUS = 20
// Starting balls appear in the upper part of the box
const START_COUNT = 8
const START_X = 250
const START_TOP = 150

// Longest time step, so a slow frame can't push balls through the walls
const MAX_DT = 0.05

const balls = []

function addBall(x, y) {
  const vx = random(-MAX_SIDE_SPEED, MAX_SIDE_SPEED)
  const vy = random(0, MAX_UP_SPEED)
  const r = random(MIN_RADIUS, MAX_RADIUS)
  balls.push({ x, y, vx, vy, r, color: palette(balls.length) })
}

function move(b, gravity, bounce, dt) {
  b.vy -= gravity * dt
  b.x += b.vx * dt
  b.y += b.vy * dt
  // Floor: push back up and lose some speed
  if (b.y - b.r < -HALF_HEIGHT) {
    b.y = -HALF_HEIGHT + b.r
    b.vy = abs(b.vy) * bounce
  }
  // Side walls: push back inside and reverse
  if (abs(b.x) + b.r > HALF_WIDTH) {
    b.x = sign(b.x) * (HALF_WIDTH - b.r)
    b.vx = -b.vx
  }
}

for (let i = 0; i < START_COUNT; i++) {
  addBall(random(-START_X, START_X), random(0, START_TOP))
}
fit(-HALF_WIDTH, -HALF_HEIGHT, 2 * HALF_WIDTH, 2 * HALF_HEIGHT)

animate((t, dt) => {
  const gravity = slider('gravity', 0, 1000, 500)
  const bounce = slider('bounce', 0.5, 1, 0.9, 0.01)
  if (mouse.clicked) {
    addBall(mouse.x, mouse.y)
  }

  const step = min(dt, MAX_DT)
  for (const b of balls) {
    move(b, gravity, bounce, step)
  }

  clear()
  rect(-HALF_WIDTH, -HALF_HEIGHT, 2 * HALF_WIDTH, 2 * HALF_HEIGHT, false, WALL_COLOR, px(2))
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
    description: 'circle, polar, label, toggle: planets on their orbits.',
    code: `// Planets on circular orbits. Inner planets go around faster.
// Use the slider to change the speed and the toggle to show names.
const planets = [
  { name: 'Mercury', orbit: 40, size: 4, color: '#b0a89f' },
  { name: 'Venus', orbit: 60, size: 7, color: '#e8c27a' },
  { name: 'Earth', orbit: 85, size: 7, color: '#5b9cf0' },
  { name: 'Mars', orbit: 110, size: 5, color: '#e2683c' },
  { name: 'Jupiter', orbit: 150, size: 14, color: '#d9a066' },
  { name: 'Saturn', orbit: 195, size: 12, color: '#e8d08f' }
]
const SUN_RADIUS = 18
const SUN_COLOR = '#ffcc44'
const ORBIT_COLOR = 'rgba(255, 255, 255, 0.12)'
const LABEL_COLOR = '#aab0c4'
const LABEL_GAP = 4 // screen pixels between a planet and its name
const VIEW_RADIUS = 220

// Kepler's third law: angular speed falls off as orbit ^ 1.5
const ORBIT_SPEED = 200
const START_ANGLE_STEP = 2.4 // spread the planets out at the start

let time = 0

function planetAngle(p, i) {
  return i * START_ANGLE_STEP + (time * ORBIT_SPEED) / p.orbit ** 1.5
}

fit(-VIEW_RADIUS, -VIEW_RADIUS, 2 * VIEW_RADIUS, 2 * VIEW_RADIUS)

animate((t, dt) => {
  const speed = slider('speed', 0, 5, 1, 0.1)
  const labels = toggle('labels', true)
  time += speed * dt

  clear()
  circle(0, 0, SUN_RADIUS, SUN_COLOR)
  planets.forEach((p, i) => {
    const [x, y] = polar(p.orbit, planetAngle(p, i))
    circle(0, 0, p.orbit, false, ORBIT_COLOR, px(1))
    circle(x, y, p.size, p.color)
    if (labels) {
      label(p.name, x + p.size + px(LABEL_GAP), y, LABEL_COLOR, 11)
    }
  })
})
`
  },
  {
    id: 'plot',
    title: 'Plot functions',
    group: 'Math',
    description: 'plot, slider, toggle, legend: y = f(x) with live controls.',
    code: `// Graphs of y = f(x). Without animate, the sketch re-runs when a control changes.
const GRID_STEP = 10
const GRID_MAJOR = 50

const amp = slider('amplitude', 0, 100, 50)
const freq = slider('frequency', 5, 100, 30, 1)
const showCos = toggle('cosine', true)

const curves = [
  { name: 'sin', f: (x) => amp * sin(x / freq), color: palette(0) },
  { name: '1000 / x', f: (x) => 1000 / x, color: palette(2) }
]
if (showCos) {
  curves.push({ name: 'cos', f: (x) => amp * cos(x / freq), color: palette(1) })
}

clear()
grid(GRID_STEP, null, GRID_MAJOR)
axes({ xLabel: 'x', yLabel: 'y' })

for (const { f, color } of curves) {
  plot(f, color, px(2))
}
legend(curves.map(({ name, color }) => [name, color]))

fit(-300, -150, 600, 300)
`
  },
  {
    id: 'rose',
    title: 'Polar rose',
    group: 'Math',
    description: 'plotPolar, plotParam, number: r = R cos(n/d theta), spinning.',
    code: `// Polar roses r = R cos(k theta). With k = n / d the curve closes after d turns.
// Change n and d to get a different rose.
const RADIUS = 130
const VIEW_RADIUS = 170
const GRID_STEP = 25
const GRID_MAJOR = 100
const GUIDE_COLOR = 'rgba(255, 255, 255, 0.12)'

const SPIN_SPEED = 0.15 // radians per second for the whole rose
const DOT_SPEED = 0.9 // radians per second for the dot tracing it
const TRAIL_LENGTH = 60
const DOT_SIZE = 9

fit(-VIEW_RADIUS, -VIEW_RADIUS, 2 * VIEW_RADIUS, 2 * VIEW_RADIUS)

animate((t) => {
  const n = number('n', 5, 1, 1, 12)
  const d = number('d', 4, 1, 1, 9)
  const k = n / d
  const fullCurve = 2 * PI * d

  const spin = t * SPIN_SPEED
  const r = (theta) => RADIUS * cos(k * theta)
  const x = (theta) => r(theta) * cos(theta + spin)
  const y = (theta) => r(theta) * sin(theta + spin)
  const dot = (t * DOT_SPEED) % fullCurve

  clear()
  grid(GRID_STEP, null, GRID_MAJOR)
  // Faint guide: the rose with d = 1
  plotPolar((theta) => RADIUS * cos(n * theta), GUIDE_COLOR, px(1))
  plotParam(x, y, palette(5), px(2.5), 0, fullCurve)
  trail('dot', x(dot), y(dot), 'white', TRAIL_LENGTH)
  point(x(dot), y(dot), 'white', DOT_SIZE)
})
`
  },
  {
    id: 'lissajous',
    title: 'Lissajous curve',
    group: 'Math',
    description: 'plotParam, trail, number: x = sin(a t), y = sin(b t + phase).',
    code: `// A Lissajous curve whose phase slowly drifts.
// Change a and b for different shapes, and drift for how fast the phase moves.
const SIZE = 120
const VIEW_RADIUS = 160
const GRID_STEP = 20
const GRID_MAJOR = 100

const HUE_SPEED = 20 // degrees per second
const CURVE_OPACITY = 0.6
const TRAIL_LENGTH = 120
const DOT_SIZE = 10

fit(-VIEW_RADIUS, -VIEW_RADIUS, 2 * VIEW_RADIUS, 2 * VIEW_RADIUS)

animate((t) => {
  const a = number('a', 3, 1, 1, 9)
  const b = number('b', 2, 1, 1, 9)
  const drift = slider('drift', 0, 1, 0.2, 0.01)

  const phase = t * drift
  const x = (s) => SIZE * sin(a * s)
  const y = (s) => SIZE * sin(b * s + phase)

  clear()
  grid(GRID_STEP, null, GRID_MAJOR)
  axes()
  plotParam(x, y, hsl(t * HUE_SPEED, 80, 70, CURVE_OPACITY), px(1.5), 0, 2 * PI)
  trail('dot', x(t), y(t), palette(1), TRAIL_LENGTH)
  point(x(t), y(t), 'white', DOT_SIZE)
})
`
  },
  {
    id: 'easing',
    title: 'Easing curves',
    group: 'Math',
    description: 'ease, plot, legend: every easing curve, with racing dots.',
    code: `// Easing curves turn steady time (0 to 1) into motion that speeds up, slows down or bounces.
// Left: each curve. Right: a dot moving along a track with that curve.
const KINDS = ['linear', 'in', 'out', 'inOut', 'sine', 'back', 'elastic', 'bounce']

const CHART_SIZE = 200
const TRACK_START = CHART_SIZE + 50
const TRACK_LENGTH = 200
const DOT_SIZE = 10 // screen pixels
const PAUSE = 0.4 // rest at the end of each run, as a fraction of a run

const FRAME_COLOR = 'rgba(255, 255, 255, 0.3)'
const TRACK_COLOR = 'rgba(255, 255, 255, 0.15)'

// A little margin around the chart and the tracks
fit(-20, -30, TRACK_START + TRACK_LENGTH + 50, CHART_SIZE + 60)

animate((t) => {
  const seconds = slider('seconds', 0.5, 4, 2, 0.1)
  const progress = min(1, (t / seconds) % (1 + PAUSE))

  clear()
  rect(0, 0, CHART_SIZE, CHART_SIZE, false, FRAME_COLOR, px(1))
  KINDS.forEach((kind, i) => {
    const color = palette(i)
    plot((x) => CHART_SIZE * ease(x / CHART_SIZE, kind), color, px(2), 0, CHART_SIZE)

    // Tracks are spread evenly from the top of the chart to the bottom
    const y = CHART_SIZE - (i * CHART_SIZE) / (KINDS.length - 1)
    line(TRACK_START, y, TRACK_START + TRACK_LENGTH, y, TRACK_COLOR, px(1))
    point(TRACK_START + TRACK_LENGTH * ease(progress, kind), y, color, px(DOT_SIZE))
  })
  legend(KINDS.map((kind, i) => [kind, palette(i)]), 'ease(t, kind)')
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
const RING_RADIUS = 120
const VIEW_SIZE = 320
const PAUSE_AFTER = 0.5   // extra fraction of a loop to linger on the finished curve
const HUE_PER_RADIAN = 15
const RING_COLOR = 'rgba(255, 255, 255, 0.2)'
const WHEEL_COLOR = 'rgba(255, 255, 255, 0.5)'
const PEN_SIZE = 8

const gcd = (a, b) => (b ? gcd(b, a % b) : a)
let s = 0   // how far the wheel has rolled, in radians

fit(-VIEW_SIZE / 2, -VIEW_SIZE / 2, VIEW_SIZE, VIEW_SIZE)

animate((t, dt) => {
  const r = slider('wheel radius', 10, 110, 45, 1)
  const d = slider('pen distance', 0, 110, 70, 1)
  const speed = slider('speed', 0, 10, 3, 0.1)

  // The curve closes after the wheel's center has gone round this many radians.
  const period = 2 * PI * (r / gcd(RING_RADIUS, r))
  s = (s + speed * dt) % (period * (1 + PAUSE_AFTER))

  const orbit = RING_RADIUS - r   // distance of the wheel's center from the middle
  const spin = orbit / r          // wheel turns per turn around the ring
  const penX = (u) => orbit * cos(u) + d * cos(spin * u)
  const penY = (u) => orbit * sin(u) - d * sin(spin * u)

  clear()
  circle(0, 0, RING_RADIUS, false, RING_COLOR, px(1))
  plotParam(penX, penY, hsl(s * HUE_PER_RADIAN, 85, 65), px(2), 0, min(s, period))

  const drawing = s < period
  if (drawing) {
    const [wheelX, wheelY] = polar(orbit, s)
    const pen = [penX(s), penY(s)]
    circle(wheelX, wheelY, r, false, WHEEL_COLOR, px(1))
    line(wheelX, wheelY, ...pen, 'white', px(1))
    point(...pen, 'white', PEN_SIZE)
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
const AMPLITUDE = 70     // height of the square wave
const WAVE_X = 110       // where the traced wave starts
const WAVE_LENGTH = 200  // samples kept (one world unit apart)
const CIRCLE_COLOR = 'rgba(255, 255, 255, 0.25)'

const wave = []
fit(-110, -110, 420, 220)

animate((t) => {
  const terms = slider('terms', 1, 20, 4, 1)

  clear()
  let tip = [0, 0]
  for (let i = 0; i < terms; i++) {
    const harmonic = 2 * i + 1
    const radius = (4 * AMPLITUDE) / (harmonic * PI)
    const next = add(tip, polar(radius, harmonic * t))
    circle(...tip, radius, false, CIRCLE_COLOR, px(1))
    line(...tip, ...next, 'white', px(1))
    tip = next
  }

  const [x, y] = tip
  wave.unshift(y)
  if (wave.length > WAVE_LENGTH) {
    wave.pop()
  }

  line(x, y, WAVE_X, y, palette(3), px(1))
  polyline(wave.map((v, i) => [WAVE_X + i, v]), palette(2), px(2))
})
`
  },
  {
    id: 'waves',
    title: 'Wave interference',
    group: 'Math',
    description: 'heat, drag, colorbar: two wave sources you can move.',
    code: `// Two wave sources interfering. Drag the sources around.
const SOURCE_A = [-40, 0]
const SOURCE_B = [40, 0]
const HANDLE_SIZE = 8
const WAVE_SPEED = 4   // phase change per second, in radians

fit(-120, -90, 240, 180)

animate((t) => {
  const wavelength = slider('wavelength', 15, 80, 35)
  const a = drag('a', ...SOURCE_A, HANDLE_SIZE, palette(0))
  const b = drag('b', ...SOURCE_B, HANDLE_SIZE, palette(1))

  const waveNumber = (2 * PI) / wavelength
  const wave = (source, x, y) => sin(waveNumber * dist(source, [x, y]) - t * WAVE_SPEED)

  // The sum of two waves lies in -2..2; map it to 0..1 for the color ramp.
  heat((x, y) => map(wave(a, x, y) + wave(b, x, y), -2, 2), 'coolwarm')
  colorbar('coolwarm', -2, 2, 'height')
})
`
  },
  {
    id: 'pendulum',
    title: 'Double pendulum',
    group: 'Math',
    description: 'trail, pause, step: two linked arms going chaotic.',
    code: `// A double pendulum: two linked arms whose motion quickly turns chaotic.
const ARM_LENGTH = 100
const GRAVITY = 9.81
const START_JITTER = 0.2   // random spread of the starting angles, in radians
const SUBSTEPS = 20        // physics steps per frame, for accuracy
const MAX_DT = 0.05        // cap on the frame time so a slow frame can't explode
const TRAIL_LENGTH = 400
const ARM_WIDTH = 3
const BOB_RADIUS = 10
const PIVOT_RADIUS = 4
const PIVOT_COLOR = '#aab0c4'

let a1, a2, w1, w2   // arm angles from straight down, and their angular speeds

function restart() {
  a1 = PI / 2 + random(-START_JITTER, START_JITTER)
  a2 = PI / 2 + random(-START_JITTER, START_JITTER)
  w1 = 0
  w2 = 0
}

// Angular accelerations for equal masses and arm lengths.
function accel(a1, a2, w1, w2) {
  const g = GRAVITY
  const d = a1 - a2
  const den = 3 - cos(2 * d)
  return [
    (-3 * g * sin(a1) - g * sin(a1 - 2 * a2) - 2 * sin(d) * (w2 * w2 + w1 * w1 * cos(d))) / den,
    (2 * sin(d) * (2 * w1 * w1 + 2 * g * cos(a1) + w2 * w2 * cos(d))) / den
  ]
}

// The end of an arm hanging from (x, y) at the given angle.
const armEnd = ([x, y], a) => [x + ARM_LENGTH * sin(a), y - ARM_LENGTH * cos(a)]

restart()
fit(-230, -230, 460, 460)

animate((t, dt) => {
  if (button('restart')) {
    restart()
  }
  pause(toggle('pause'))
  if (button('step')) {
    step()
  }

  const h = min(dt, MAX_DT) / SUBSTEPS
  for (let i = 0; i < SUBSTEPS; i++) {
    const [e1, e2] = accel(a1, a2, w1, w2)
    w1 += e1 * h
    w2 += e2 * h
    a1 += w1 * h
    a2 += w2 * h
  }

  const pivot = [0, 0]
  const bob1 = armEnd(pivot, a1)
  const bob2 = armEnd(bob1, a2)

  clear()
  trail('tip', ...bob2, palette(5), TRAIL_LENGTH)
  line(...pivot, ...bob1, 'white', ARM_WIDTH)
  line(...bob1, ...bob2, 'white', ARM_WIDTH)
  circle(...pivot, PIVOT_RADIUS, PIVOT_COLOR)
  circle(...bob1, BOB_RADIUS, palette(0))
  circle(...bob2, BOB_RADIUS, palette(5))
})
`
  },
  {
    id: 'bezier',
    title: 'Bezier curve',
    group: 'Math',
    description: 'drag, bezier, vectors: drag the control points.',
    code: `// A cubic Bezier curve. Drag the control points; move the slider to see how
// repeated in-between points find the point on the curve.
const HANDLE_SIZE = 8
const HULL_STYLE = { color: 'rgba(255, 255, 255, 0.4)', width: px(1), dash: [4, 4] }
const LEVEL_HUE = 200   // hue of the first level of in-between points
const HUE_STEP = 50     // hue shift for each further level
const DOT_SIZE = 7
const RESULT_SIZE = 12

const P = [
  drag('p0', -150, -60, HANDLE_SIZE, palette(0)),
  drag('p1', -80, 90, HANDLE_SIZE, palette(1)),
  drag('p2', 80, 90, HANDLE_SIZE, palette(2)),
  drag('p3', 150, -60, HANDLE_SIZE, palette(3))
]
const t = slider('t', 0, 1, 0.4, 0.01)

// The point t of the way from a to b, and one such point on every segment.
const between = (a, b, t) => add(a, scale(sub(b, a), t))
const reduce = (pts, t) => pts.slice(1).map((p, i) => between(pts[i], p, t))

clear()
grid(20, null, 100)
polyline(P, HULL_STYLE)
bezier(...P[0], ...P[1], ...P[2], ...P[3], 'white', px(2.5))

let pts = reduce(P, t)
for (let level = 0; pts.length > 1; level++) {
  const color = hsl(LEVEL_HUE + level * HUE_STEP, 80, 65)
  polyline(pts, color, px(1.5))
  points(pts, color, DOT_SIZE)
  pts = reduce(pts, t)
}
point(...pts[0], palette(5), RESULT_SIZE)

fit(-200, -120, 400, 260)
`
  },
  {
    id: 'triangle',
    title: 'Triangle centers',
    group: 'Math',
    description: 'drag, vectors, label: drag the corners and watch the Euler line.',
    code: `// Drag the corners: the centroid G, circumcenter O and orthocenter H
// always lie on one line, the Euler line.
const HANDLE_SIZE = 9
const FILL = 'rgba(91, 108, 240, 0.15)'
const EULER_LINE = { color: 'rgba(255, 255, 255, 0.5)', width: px(1), dash: [6, 4] }
const DOT_SIZE = px(9)
const LABEL_OFFSET = [px(8), px(8)]
const LABEL_SIZE = 13

const A = drag('A', -120, -70, HANDLE_SIZE, palette(0))
const B = drag('B', 130, -50, HANDLE_SIZE, palette(1))
const C = drag('C', -10, 110, HANDLE_SIZE, palette(2))

// The point equally far from all three corners.
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

const G = scale(add(add(A, B), C), 1 / 3)   // average of the corners
const O = circumcenter(A, B, C)
const H = sub(scale(G, 3), scale(O, 2))     // Euler: H = 3G - 2O

clear()
grid(20, null, 100)
poly([A, B, C], FILL, 'white', px(2))
circle(...O, dist(A, O), false, palette(3), px(1))
line(...O, ...H, EULER_LINE)

const centers = [['G', G, palette(5)], ['O', O, palette(3)], ['H', H, palette(6)]]
for (const [name, p, color] of centers) {
  point(...p, color, DOT_SIZE)
  label(name, ...add(p, LABEL_OFFSET), color, LABEL_SIZE)
}

fit(-200, -150, 400, 300)
`
  },
  {
    id: 'phase',
    title: 'Phase portrait',
    group: 'Math',
    description: 'field, trail, axes labels: a damped pendulum in the (theta, omega) plane.',
    code: `// Phase portrait of a damped pendulum: angle theta across, speed omega up.
// Click to drop a particle.
const SCALE = 40            // world units per unit of theta or omega
const MAX_PARTICLES = 40
const ARROW_LENGTH = 12     // stretch of the field arrows
const ARROW_SPACING = 20
const FIELD_COLOR = 'rgba(91, 108, 240, 0.6)'
const SUBSTEPS = 4          // physics steps per frame
const MAX_DT = 0.05         // cap on the frame time so a slow frame can't jump
const TRAIL_LENGTH = 150
const DOT_SIZE = 8

const starts = [[-3, 2], [-1, 3], [2, -2.5], [3, 1], [0.5, -1], [-2.5, -1]]
const particles = starts.map(([th, om]) => ({ th, om }))

fit(-6.5 * SCALE, -4 * SCALE, 13 * SCALE, 8 * SCALE)

animate((t, dt) => {
  const damping = slider('damping', 0, 1, 0.2, 0.01)
  const accel = (th, om) => -sin(th) - damping * om

  if (mouse.clicked && particles.length < MAX_PARTICLES) {
    particles.push({ th: mouse.x / SCALE, om: mouse.y / SCALE })
  }

  clear()
  grid(SCALE / 2, null, SCALE)
  axes({ xLabel: 'theta', yLabel: 'omega', step: SCALE })
  field((x, y) => {
    const th = x / SCALE
    const om = y / SCALE
    return [om * ARROW_LENGTH, accel(th, om) * ARROW_LENGTH]
  }, ARROW_SPACING, FIELD_COLOR)

  const h = min(dt, MAX_DT) / SUBSTEPS
  particles.forEach((p, i) => {
    for (let k = 0; k < SUBSTEPS; k++) {
      p.om += accel(p.th, p.om) * h
      p.th += p.om * h
    }
    const x = p.th * SCALE
    const y = p.om * SCALE
    trail('p' + i, x, y, palette(i + 1), TRAIL_LENGTH)
    point(x, y, palette(i + 1), DOT_SIZE)
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
const PARTICLE_COUNT = 500
const LIFETIME = [1, 4]     // seconds before a particle respawns
const FLOW_SPEED = 40
const SWIRL_SIZE = 50       // larger values give wider swirls
const STREAK_LENGTH = 0.15  // seconds of motion each streak shows
const HUE_OFFSET = 200
const MAX_DT = 0.05         // cap on the frame time so a slow frame can't jump
const ARROW_SPACING = 30
const FIELD_COLOR = 'rgba(91, 108, 240, 0.5)'

fit(-300, -200, 600, 400)

// Put a particle at a random spot in view with a fresh lifetime.
const spawn = (p) =>
  Object.assign(p, {
    x: random(view.left, view.right),
    y: random(view.bottom, view.top),
    life: random(...LIFETIME)
  })
const outside = (p) => p.x < view.left || p.x > view.right || p.y < view.bottom || p.y > view.top
const particles = range(PARTICLE_COUNT).map(() => spawn({}))

animate((t, dt) => {
  const arrows = toggle('arrows', false)
  const flow = (x, y) => [
    FLOW_SPEED * sin(y / SWIRL_SIZE + t / 2),
    FLOW_SPEED * cos(x / SWIRL_SIZE - t / 2)
  ]

  clear()
  if (arrows) {
    field(flow, ARROW_SPACING, FIELD_COLOR)
  }

  const step = min(dt, MAX_DT)
  for (const p of particles) {
    const v = flow(p.x, p.y)
    const hue = (angle(v) * 180) / PI + HUE_OFFSET
    const tail = sub([p.x, p.y], scale(v, STREAK_LENGTH))
    line(...tail, p.x, p.y, hsl(hue, 80, 65, min(1, p.life)), px(2))

    p.x += v[0] * step
    p.y += v[1] * step
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
const UNIT = 200          // world units per 1 on the complex plane
const CENTER_RE = -0.5    // real part shown at the world origin
const ESCAPE_RADIUS = 16  // once |z| passes this, z flies off to infinity

const ramp = select('ramp', ['magma', 'inferno', 'plasma', 'turbo', 'viridis', 'cividis', 'hot', 'vexel', 'gray'])
const maxIter = slider('iterations', 20, 300, 80, 1)
const cell = slider('cell size', 1, 12, 3, 1)

// Smooth escape time of c = cr + ci i, or maxIter if it never escapes.
function escape(cr, ci) {
  let zr = 0
  let zi = 0
  for (let n = 0; n < maxIter; n++) {
    const zr2 = zr * zr
    const zi2 = zi * zi
    if (zr2 + zi2 > ESCAPE_RADIUS * ESCAPE_RADIUS) {
      return n + 1 - log2(Math.log(zr2 + zi2) / 2)
    }
    zi = 2 * zr * zi + ci
    zr = zr2 - zi2 + cr
  }
  return maxIter
}

clear()
heat((x, y) => {
  const n = escape(x / UNIT + CENTER_RE, y / UNIT)
  if (n >= maxIter) {
    return 0   // inside the set
  }
  return sqrt(max(0, n) / maxIter)   // sqrt brings out the faint outer bands
}, ramp, cell)
`
  },
  {
    id: 'metaballs',
    title: 'Metaballs',
    group: 'Math',
    description: 'heat + contour: an implicit curve around moving blobs and the pointer.',
    code: `// Metaballs: blobs that melt together as they move. One follows the pointer.
const MAX_STRENGTH = 3 // field strength shown as the brightest color
const POINTER_RADIUS = 45
const OUTER_GLOW = 'rgba(255, 255, 255, 0.4)'

fit(-250, -170, 500, 340)

// Each blob orbits on its own ellipse: [x, y, radius] at time t.
function movingBlobs(t) {
  return [
    [120 * cos(t * 0.7), 80 * sin(t * 0.9), 60],
    [-100 * sin(t * 0.5), 60 * cos(t * 0.8), 50],
    [80 * cos(t * 0.4 + 2), -90 * sin(t * 0.6), 70]
  ]
}

animate((t) => {
  const level = slider('threshold', 0.3, 3, 1, 0.1)
  const ramp = select('ramp', ['magma', 'plasma', 'vexel', 'turbo', 'cividis'])

  const blobs = [...movingBlobs(t), [mouse.x, mouse.y, POINTER_RADIUS]]

  // Every blob adds r² / distance², so the field is strong near blob centers.
  // The + 1 avoids dividing by zero at a center.
  const strength = (x, y) =>
    blobs.reduce((sum, [bx, by, r]) => sum + (r * r) / ((x - bx) ** 2 + (y - by) ** 2 + 1), 0)

  clear()
  heat((x, y) => min(1, strength(x, y) / MAX_STRENGTH), ramp)
  contour(strength, level, 'white', px(2))
  contour(strength, level * 2, OUTER_GLOW, px(1))
})
`
  },
  {
    id: 'heatmap',
    title: 'Heatmap from data',
    group: 'Data',
    description: 'grid2d, ramp, textBox, hover: a grid of [column, row, value] triples.',
    code: `// A heatmap from [column, row, value] data. Hover a cell to read its value.
const COLS = 14
const ROWS = 9
const CELL = 36 // cell size in world units
const GAP = 2 // space between cells
const RAMP = 'plasma'

// Made-up smooth data with a little ripple, roughly 0..100.
function valueAt(c, r) {
  return round(50 + 40 * sin(c / 2.2) * cos(r / 1.7) + 10 * sin(c * r))
}

const data = grid2d(COLS, ROWS, (c, r) => [c, r, valueAt(c, r)])
const values = data.map(([c, r, v]) => v)
const shade = normalize(values)

clear()
fit(0, 0, COLS * CELL, ROWS * CELL)

let hovered = null
data.forEach(([c, r, v], i) => {
  const x = c * CELL
  const y = r * CELL
  rect(x, y, CELL - GAP, CELL - GAP, ramp(RAMP, shade[i]))
  if (hover(x + CELL / 2, y + CELL / 2, CELL / 2)) {
    hovered = [c, r, v]
  }
})

// The tooltip goes last so no cell covers it.
if (hovered) {
  const [c, r, v] = hovered
  rect(c * CELL, r * CELL, CELL - GAP, CELL - GAP, false, 'white', px(2))
  textBox('column ' + c + '\\nrow ' + r + '\\nvalue ' + v, (c + 1) * CELL, r * CELL)
}
colorbar(RAMP, min(...values), max(...values))
`
  },
  {
    id: 'charts',
    title: 'Bars and histogram',
    group: 'Data',
    description: 'bars, hist, transform: charts from plain arrays.',
    code: `// A histogram of random samples, and a bar chart next to it.
const SAMPLE_COUNT = 600
const SAMPLE_MEAN = 100
const SAMPLE_SD = 30
const SALES = [30, 80, 55, 95, 60]
const BAR_WIDTH = 20
const BAR_CHART_X = 260 // how far right the bar chart sits
const LABEL_COLOR = 'white'

const bins = slider('bins', 5, 40, 20, 1)
const samples = range(SAMPLE_COUNT).map(() => gauss(SAMPLE_MEAN, SAMPLE_SD))

clear()
grid(10, null, 50)
axes()

hist(samples, bins, palette(0))
text(SAMPLE_COUNT + ' samples', SAMPLE_MEAN, 120, LABEL_COLOR, 10, 'center')

// transform shifts the bar chart right; its own coordinates stay simple.
transform(() => {
  bars(SALES, BAR_WIDTH, (i) => palette(i))
  SALES.forEach((v, i) => {
    const barCenter = i * BAR_WIDTH + BAR_WIDTH / 2
    text(v, barCenter, v + 6, LABEL_COLOR, 8, 'center')
  })
}, { x: BAR_CHART_X })

fit(-10, -20, 390, 150)
`
  },
  {
    id: 'scatter',
    title: 'Scatter plot',
    group: 'Data',
    description: 'scatter, random, gauss: a spiral galaxy of dots colored by value.',
    code: `// A two-armed spiral galaxy, colored by distance from the core.
const GALAXY_RADIUS = 200
const CORE_FALLOFF = 1.5 // above 1 packs more stars near the core
const ARM_SPREAD = 0.35 // random angle around each arm (radians)
const POSITION_JITTER = 6
const STAR_SIZE = 3

const ramp = select('ramp', ['turbo', 'viridis', 'plasma', 'inferno', 'cividis', 'hot', 'coolwarm', 'vexel', 'gray'])
const count = slider('stars', 200, 4000, 2000, 50)
const twist = slider('twist', 0, 6, 3, 0.1)

// Even stars go on one arm, odd stars on the opposite one.
function star(i) {
  const r = GALAXY_RADIUS * random() ** CORE_FALLOFF
  const armAngle = (i % 2) * PI
  const a = armAngle + (twist * r) / GALAXY_RADIUS + gauss(0, ARM_SPREAD)
  const x = cos(a) * r + gauss(0, POSITION_JITTER)
  const y = sin(a) * r + gauss(0, POSITION_JITTER)
  const brightness = 1 - r / GALAXY_RADIUS
  return [x, y, brightness]
}

const stars = range(count).map(star)

clear()
scatter(stars, ramp, STAR_SIZE)
fit(...bounds(stars))
`
  },
  {
    id: 'csv',
    title: 'CSV explorer',
    group: 'Data',
    description: 'file, select, axes: drop a CSV and plot any two columns.',
    code: `// Drop a CSV file onto the preview, or click "data" in the panel, then pick two columns.
// Until then it shows a made-up weather sample.
const SAMPLE_DAYS = 120
const DOT_SIZE = 6
const LINE_WIDTH = 2

function makeSample() {
  const days = range(SAMPLE_DAYS).map((day) => ({
    day,
    temp: round(12 + 9 * sin(day / 19) + gauss(0, 1.5), 1),
    rain: round(max(0, gauss(2, 3)), 1),
    wind: round(abs(gauss(15, 6)), 1)
  }))
  days.columns = ['day', 'temp', 'rain', 'wind']
  return days
}

const sample = makeSample()
const rows = file('data') ?? sample
if (!rows.columns) {
  return hud('that file is not a table: try a CSV or TSV file')
}

// Only columns with numbers can be plotted.
const isNumber = (value) => typeof value === 'number'
const numeric = rows.columns.filter((c) => rows.some((r) => isNumber(r[c])))
if (numeric.length < 2) {
  return hud('need at least two columns with numbers')
}
const xCol = select('x', numeric, numeric[0])
const yCol = select('y', numeric, numeric[1])
const style = select('style', ['dots', 'line'])

const pts = rows
  .filter((r) => isNumber(r[xCol]) && isNumber(r[yCol]))
  .map((r) => [r[xCol], r[yCol]])

clear()
axes({ xLabel: xCol, yLabel: yCol })
if (style === 'line') {
  polyline(pts, palette(0), px(LINE_WIDTH))
} else {
  points(pts, palette(0), px(DOT_SIZE))
}
fit(...bounds(pts))
`
  },
  {
    id: 'donut',
    title: 'Donut chart',
    group: 'Data',
    description: 'poly, polar, linspace: slices that pop out on hover.',
    code: `// A donut chart. Hover a slice to pull it out.
const DATA = [
  ['Rent', 1200],
  ['Food', 450],
  ['Transport', 180],
  ['Fun', 220],
  ['Savings', 500]
]
const INNER_RADIUS = 60
const OUTER_RADIUS = 110
const LABEL_RADIUS = 130
const PULL_OUT = 10 // how far a hovered slice moves out
const ARC_STEPS = 40 // points along each curved edge
const BACKGROUND = '#282c34'
const MUTED_TEXT = '#aab0c4'
const LABEL_SIZE = 12
const VALUE_SIZE = 22

const total = DATA.reduce((sum, [label, value]) => sum + value, 0)

// Turns go clockwise from the top: 0 is 12 o'clock, 0.25 is 3 o'clock.
const turnAngle = (turn) => PI / 2 - turn * 2 * PI

// The pointer's position as a turn in 0..1.
function turnOf(p) {
  const turn = (turnAngle(0) - angle(p)) / (2 * PI)
  return turn - floor(turn)
}

// A ring segment between two turns, shifted by offset.
function slice(from, to, offset) {
  const ring = (r, a, b) => linspace(a, b, ARC_STEPS).map((turn) => add(offset, polar(r, turnAngle(turn))))
  return [...ring(OUTER_RADIUS, from, to), ...ring(INNER_RADIUS, to, from)]
}

fit(-220, -150, 440, 300)

animate(() => {
  const pointer = [mouse.x, mouse.y]
  const pointerTurn = turnOf(pointer)
  const pointerR = len(pointer)
  const onRing = pointerR > INNER_RADIUS && pointerR < OUTER_RADIUS

  clear()
  let from = 0
  DATA.forEach(([label, value], i) => {
    const to = from + value / total
    const hovered = onRing && pointerTurn >= from && pointerTurn < to
    const mid = turnAngle((from + to) / 2)
    const offset = polar(hovered ? PULL_OUT : 0, mid)

    poly(slice(from, to, offset), palette(i), BACKGROUND, px(2))
    const percent = round((value / total) * 100) + '%'
    const align = cos(mid) >= 0 ? 'left' : 'right'
    text(label + ' ' + percent, ...polar(LABEL_RADIUS, mid), hovered ? 'white' : MUTED_TEXT, LABEL_SIZE, align)
    if (hovered) {
      text(value, 0, 0, 'white', VALUE_SIZE, 'center')
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
const N = 40 // number of bars
const MIN_VALUE = 5
const MAX_VALUE = 100
const BAR_WIDTH = 10
const SORTED_COLOR = palette(2)
const COMPARING_COLOR = palette(3)
const UNSORTED_COLOR = '#566079'
const TEXT_COLOR = '#aab0c4'

let values, pass, j, done

function shuffle() {
  values = range(N).map(() => round(random(MIN_VALUE, MAX_VALUE)))
  pass = 0
  j = 0
  done = false
}

// One step: compare bar j with its right neighbor and swap if needed.
function compare() {
  if (done) {
    return
  }
  if (values[j] > values[j + 1]) {
    [values[j], values[j + 1]] = [values[j + 1], values[j]]
  }
  j++
  // After each pass the largest remaining bar has bubbled to the end.
  if (j >= N - 1 - pass) {
    j = 0
    pass++
  }
  done = pass >= N - 1
}

function barColor(i) {
  const isSorted = done || i >= N - pass
  if (isSorted) {
    return SORTED_COLOR
  }
  if (i === j || i === j + 1) {
    return COMPARING_COLOR
  }
  return UNSORTED_COLOR
}

shuffle()
fit(-10, -15, N * BAR_WIDTH + 200, 130)

animate(() => {
  const speed = slider('steps per frame', 1, 50, 5, 1)
  if (button('shuffle')) {
    shuffle()
  }
  for (let k = 0; k < speed; k++) {
    compare()
  }

  clear()
  bars(values, BAR_WIDTH, barColor)
  text(done ? 'sorted!' : 'pass ' + (pass + 1), 0, -8, TEXT_COLOR, 10)
})
`
  },
  {
    id: 'tree',
    title: 'Fractal tree',
    group: 'Generative',
    description: 'line, polar, mix: a recursive tree swaying in the wind.',
    code: `// A fractal tree: every branch splits into two smaller ones.
const TRUNK_BASE = [0, -150]
const TRUNK_LENGTH = 90
const BARK_COLOR = '#7a4a2a'
const LEAF_COLOR = '#6fd36f'
const WIDTH_PER_LEVEL = 1.5 // thicker branches closer to the trunk
const SWAY_STRENGTH = 0.05 // radians of sway at full wind
const SWAY_SPEED = 1.5

fit(-200, -160, 400, 330)

animate((t) => {
  const depth = slider('depth', 1, 12, 9, 1)
  const spread = slider('spread', 0, 90, 25, 1)
  const shrink = slider('shrink', 0.5, 0.85, 0.72, 0.01)
  const wind = slider('wind', 0, 1, 0.3, 0.01)

  const turn = (spread * PI) / 180

  function branch(start, angle, length, level) {
    const end = add(start, polar(length, angle))
    const color = mix(BARK_COLOR, LEAF_COLOR, level / depth)
    line(...start, ...end, color, max(1, (depth - level) * WIDTH_PER_LEVEL))
    if (level >= depth) {
      return
    }

    // Each level sways a little out of step with the one below.
    const sway = wind * SWAY_STRENGTH * sin(t * SWAY_SPEED + level)
    branch(end, angle + turn + sway, length * shrink, level + 1)
    branch(end, angle - turn + sway, length * shrink, level + 1)
  }

  clear()
  branch(TRUNK_BASE, PI / 2, TRUNK_LENGTH, 1)
})
`
  },
  {
    id: 'terrain',
    title: 'Noise terrain',
    group: 'Generative',
    description: 'noise, heat, mix: an endless map from layered Perlin noise.',
    code: `// A map from layered Perlin noise. Pan around: the land goes on forever.
const CONTRAST = 2.5 // noise mostly stays near 0.5, so stretch it
const LAYER_OFFSET = 10 // a different noise slice for each layer

// Land bands, as fractions of the height above sea level.
const BEACH_END = 0.05
const FOREST_END = 0.6
const ROCK_END = 0.85

const DEEP_WATER = '#0f2f5c'
const SHALLOW_WATER = '#3f8fd0'
const SAND = '#d8c88e'
const LOW_FOREST = '#5aa34f'
const HIGH_FOREST = '#2b5a2b'
const ROCK = '#7a6a5a'
const SNOW = '#f2f2f2'

const size = slider('feature size', 50, 400, 150)
const layers = slider('layers', 1, 6, 4, 1)
const sea = slider('sea level', 0, 1, 0.5, 0.01)
seed(slider('seed', 1, 100, 1, 1))

// Several layers of noise, each twice as fine and half as strong.
function height(x, y) {
  let sum = 0
  let total = 0
  for (let i = 0; i < layers; i++) {
    const k = 2 ** i
    sum += noise((x * k) / size, (y * k) / size, i * LAYER_OFFSET) / k
    total += 1 / k
  }
  return clamp(0.5 + (sum / total - 0.5) * CONTRAST)
}

// Height (0..1) to a map color: deep to shallow water, beach, forest, rock and snow.
function terrain(h) {
  if (h < sea) {
    return mix(DEEP_WATER, SHALLOW_WATER, h / sea)
  }
  const land = map(h, sea, 1)
  if (land < BEACH_END) {
    return SAND
  }
  if (land < FOREST_END) {
    return mix(LOW_FOREST, HIGH_FOREST, land / FOREST_END)
  }
  return land < ROCK_END ? ROCK : SNOW
}

clear()
heat(height, terrain)
`
  },
  {
    id: 'walk',
    title: 'Random walks',
    group: 'Generative',
    description: 'random, seed, polyline: wandering paths.',
    code: `// Random walks: each step goes the same distance in a random direction.
const STEP_LENGTH = 5
const HUE_STEP = 30 // degrees between walker colors
const PATH_OPACITY = 0.7
const END_SIZE = 8
const START_SIZE = 10
const VIEW_SIZE = 500

const walkers = slider('walkers', 1, 12, 6, 1)
const steps = slider('steps', 100, 3000, 1000, 100)
seed(slider('seed', 1, 100, 1, 1))

function randomWalk(stepCount) {
  let p = [0, 0]
  const path = [p]
  for (let i = 0; i < stepCount; i++) {
    p = add(p, polar(STEP_LENGTH, random(2 * PI)))
    path.push(p)
  }
  return path
}

const walkerColor = (w, opacity) => hsl(w * HUE_STEP, 80, 65, opacity)

clear()
grid(50, null, 250)

for (let w = 0; w < walkers; w++) {
  const path = randomWalk(steps)
  polyline(path, walkerColor(w, PATH_OPACITY), px(1.5))
  point(...path[path.length - 1], walkerColor(w), END_SIZE)
}

point(0, 0, 'white', START_SIZE)
fit(-VIEW_SIZE / 2, -VIEW_SIZE / 2, VIEW_SIZE, VIEW_SIZE)
`
  },
  {
    id: 'stars',
    title: 'Starfield',
    group: 'Generative',
    description: 'line, random: flying through space.',
    code: `// Flying through a field of stars.
const STAR_COUNT = 400
const FOCAL_LENGTH = 150 // how strongly depth spreads the stars out
const NEAREST_DEPTH = 0.02 // stars closer than this respawn far away
const STAR_HUE = 220

// x and y in -1..1, depth z from 0 (at the eye) to 1 (far away).
const newStar = (z) => ({ x: random(-1, 1), y: random(-1, 1), z: z ?? random() })
const stars = range(STAR_COUNT).map(() => newStar())

// Perspective: dividing by depth pushes near stars toward the edges.
const project = (star, z) => [(star.x / z) * FOCAL_LENGTH, (star.y / z) * FOCAL_LENGTH]

fit(-200, -150, 400, 300)

animate((t, dt) => {
  const speed = slider('speed', 0, 2, 0.4, 0.01)

  clear()
  for (const star of stars) {
    const [x0, y0] = project(star, star.z)
    star.z -= speed * dt
    if (star.z < NEAREST_DEPTH) {
      Object.assign(star, newStar(1))
      continue
    }
    const [x1, y1] = project(star, star.z)
    // Near stars are brighter, more opaque and thicker.
    const nearness = 1 - star.z
    line(x0, y0, x1, y1, hsl(STAR_HUE, 60, 50 + nearness * 45, nearness), px(0.5 + nearness * 3))
  }
})
`
  },
  {
    id: 'koch',
    title: 'Koch snowflake',
    group: 'Generative',
    description: 'poly, vectors, number: a fractal edge.',
    code: `// The Koch snowflake: replace the middle third of every edge with a spike, again and again.
const depth = number('depth', 4, 1, 0, 6)

const SIZE = 120 // distance from the center to each corner
const FILL = 'rgba(91, 108, 240, 0.25)'
const OUTLINE = '#9fb4ff'

// Points from a toward b, not including b.
function koch(a, b, level) {
  if (level === 0) {
    return [a]
  }
  const third = scale(sub(b, a), 1 / 3)
  const start = add(a, third)
  const end = add(start, third)
  const tip = add(start, rot(third, -PI / 3)) // the spike points outward
  return [
    ...koch(a, start, level - 1),
    ...koch(start, tip, level - 1),
    ...koch(tip, end, level - 1),
    ...koch(end, b, level - 1),
  ]
}

// An equilateral triangle, one corner pointing straight up.
const corners = [90, 210, 330].map((degrees) => polar(SIZE, (degrees * PI) / 180))
const outline = corners.flatMap((corner, i) => koch(corner, corners[(i + 1) % 3], depth))

clear()
poly(outline, FILL, OUTLINE, px(1.5))
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
const FIELD_W = 600
const FIELD_H = 400
const PLAYER_RADIUS = 12
const COIN_RADIUS = 8
const PICKUP_DISTANCE = 20
const START_COINS = 5
const NEW_COIN_EVERY = 10 // seconds
const MAX_STEP_TIME = 0.1 // seconds; avoids big jumps after a pause
const COIN_SPIN_SPEED = 3
const TRAIL_LENGTH = 60

const HALF_W = FIELD_W / 2
const HALF_H = FIELD_H / 2
const COIN_MARGIN_X = 40 // coins appear at least this far from the walls
const COIN_MARGIN_Y = 30
const WALL_GAP = 10 // the player stops this far from the walls

const place = () => [
  random(-HALF_W + COIN_MARGIN_X, HALF_W - COIN_MARGIN_X),
  random(-HALF_H + COIN_MARGIN_Y, HALF_H - COIN_MARGIN_Y),
]

// +1, -1 or 0 depending on which of two opposite keys is held.
const axis = (plus, minus) => (plus ? 1 : 0) - (minus ? 1 : 0)

let x = 0
let y = 0
let score = 0
let coins = range(START_COINS).map(place)

fit(-HALF_W, -HALF_H, FIELD_W, FIELD_H)

animate((t, dt) => {
  const speed = slider('speed', 50, 400, 220)
  every(NEW_COIN_EVERY, () => coins.push(place()))

  const step = speed * min(dt, MAX_STEP_TIME)
  const moveX = axis(key('ArrowRight') || key('d'), key('ArrowLeft') || key('a'))
  const moveY = axis(key('ArrowUp') || key('w'), key('ArrowDown') || key('s'))
  x = clamp(x + moveX * step, -HALF_W + WALL_GAP, HALF_W - WALL_GAP)
  y = clamp(y + moveY * step, -HALF_H + WALL_GAP, HALF_H - WALL_GAP)

  // A collected coin is replaced by a new one somewhere else.
  coins = coins.map((coin) => {
    if (dist(coin, [x, y]) > PICKUP_DISTANCE) {
      return coin
    }
    score++
    return place()
  })

  clear()
  grid(20, null, 100)
  rect(-HALF_W, -HALF_H, FIELD_W, FIELD_H, false, 'rgba(255, 255, 255, 0.4)', px(2))
  coins.forEach(([cx, cy], i) => {
    // Squashing the width makes the coin look like it spins.
    const spin = abs(cos(t * COIN_SPIN_SPEED + i))
    ellipse(cx, cy, COIN_RADIUS * spin + 1, COIN_RADIUS, hsl(45, 95, 55), hsl(35, 90, 40), px(1.5))
  })
  trail('me', x, y, palette(1), TRAIL_LENGTH)
  circle(x, y, PLAYER_RADIUS, palette(0), 'white', px(2))
  hud('score: ' + score)
})
`
  },
  {
    id: 'mines',
    title: 'Mines',
    group: 'Interactive',
    description: 'mouse.clicked, grid2d, key, lockView: a minesweeping puzzle.',
    code: `// Open every safe cell without hitting a mine. Numbers count the mines around.
// Click to open a cell; hold F or Shift while clicking to flag it.
const COLS = 12
const ROWS = 10
const MINES = 18
const CELL = 20 // cell size in world units
const GAP = 1 // space around each cell
const MINE_RADIUS = 5
const NUMBER_SIZE = 13
const STATUS_SIZE = 12
const STATUS_Y = -CELL * 0.8 // status line just below the board
const PANEL_SPACE = 150 // room on the right for the controls

const TEXT = '#e6e8f0'
const RED = '#ff6b6b'
const GREEN = '#5fd38d'
const CELL_CLOSED = '#566079'
const CELL_HOVER = '#6f7a99'
const CELL_OPEN = '#353a47'
const CELL_MINE = '#c0392b'
const MINE = '#14161b'
// Color for each neighbor count, 1 to 8.
const NUMBER_COLORS = ['', '#6c8cff', GREEN, RED, '#b48cff', '#ffb547', '#4fd6d6', TEXT, '#9aa0b4']

let cells, started, over, won

function newGame() {
  cells = grid2d(COLS, ROWS, (x, y) => ({ x, y, mine: false, open: false, flag: false, count: 0 }))
  started = over = won = false
}

const cellAt = (x, y) => (x >= 0 && y >= 0 && x < COLS && y < ROWS ? cells[y * COLS + x] : null)

function neighbors(cell) {
  const out = []
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const other = (dx || dy) && cellAt(cell.x + dx, cell.y + dy)
      if (other) {
        out.push(other)
      }
    }
  }
  return out
}

// Mines are placed after the first click, away from it, so it is always safe.
function plantMines(first) {
  const free = cells.filter((c) => c !== first && !neighbors(first).includes(c))
  for (let k = 0; k < MINES; k++) {
    const pick = floor(Math.random() * free.length)
    free.splice(pick, 1)[0].mine = true
  }
  cells.forEach((c) => (c.count = neighbors(c).filter((other) => other.mine).length))
}

// Opening a cell with no mines around opens its neighbors too.
function reveal(cell) {
  if (cell.open || cell.flag) {
    return
  }
  cell.open = true
  if (cell.mine) {
    over = true
  } else if (cell.count === 0) {
    neighbors(cell).forEach(reveal)
  }
}

function cellColor(cell, hovered) {
  if (cell.open || (over && cell.mine)) {
    return cell.mine ? CELL_MINE : CELL_OPEN
  }
  return cell === hovered && !over ? CELL_HOVER : CELL_CLOSED
}

// A small pennant inside the cell whose bottom-left corner is x, y.
function drawFlag(x, y) {
  const pole = x + CELL * 0.3
  poly([[pole, y + CELL * 0.2], [pole, y + CELL * 0.8], [x + CELL * 0.75, y + CELL * 0.6]], RED)
}

newGame()
lockView()
fit(-CELL, -CELL * 1.5, (COLS + 2) * CELL + PANEL_SPACE, (ROWS + 3) * CELL)

animate(() => {
  if (button('new game')) {
    newGame()
  }

  const hovered = cellAt(floor(mouse.x / CELL), floor(mouse.y / CELL))
  if (mouse.clicked && hovered && !over) {
    if (key('f') || key('Shift')) {
      if (!hovered.open) {
        hovered.flag = !hovered.flag
      }
    } else {
      if (!started) {
        plantMines(hovered)
      }
      started = true
      reveal(hovered)
      won = !over && cells.every((c) => c.mine || c.open)
      over = over || won
    }
  }

  clear()
  for (const cell of cells) {
    const x = cell.x * CELL
    const y = cell.y * CELL
    const centerX = x + CELL / 2
    const centerY = y + CELL / 2
    rect(x + GAP, y + GAP, CELL - 2 * GAP, CELL - 2 * GAP, cellColor(cell, hovered))
    if ((cell.open || over) && cell.mine) {
      circle(centerX, centerY, MINE_RADIUS, MINE)
    } else if (cell.open && cell.count) {
      text(cell.count, centerX, centerY, NUMBER_COLORS[cell.count], NUMBER_SIZE, 'center')
    } else if (cell.flag) {
      drawFlag(x, y)
    }
  }

  const flags = cells.filter((c) => c.flag).length
  const boardRight = COLS * CELL
  text('mines left ' + (MINES - flags), 0, STATUS_Y, TEXT, STATUS_SIZE)
  if (won) {
    text('Cleared!', boardRight, STATUS_Y, GREEN, STATUS_SIZE, 'right')
  } else if (over) {
    text('Boom! Press new game.', boardRight, STATUS_Y, RED, STATUS_SIZE, 'right')
  }
})
`
  },
  {
    id: 'life',
    title: 'Game of Life',
    group: 'Interactive',
    description: 'every, grid2d, button, mouse.clicked: cells that live and die.',
    code: `// Conway's Game of Life. Click cells to flip them.
const COLS = 40
const ROWS = 26
const CELL = 10 // cell size in world units
const START_DENSITY = 0.25 // share of cells alive after randomize
const BOARD_COLOR = '#1d2027'
const PANEL_SPACE = 220 // room on the right for the controls

const randomCells = () => grid2d(COLS, ROWS, () => random() < START_DENSITY)
let cells = randomCells()

const index = (x, y) => y * COLS + x
const insideBoard = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS

// The board wraps around: the left edge touches the right, the top the bottom.
const alive = (x, y) => cells[index((x + COLS) % COLS, (y + ROWS) % ROWS)]

function countNeighbors(x, y) {
  let count = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && alive(x + dx, y + dy)) {
        count++
      }
    }
  }
  return count
}

// Birth with exactly 3 neighbors, survival with 2 or 3.
function advance() {
  cells = cells.map((on, i) => {
    const n = countNeighbors(i % COLS, floor(i / COLS))
    return n === 3 || (on && n === 2)
  })
}

lockView()
fit(-CELL, -CELL, COLS * CELL + PANEL_SPACE, ROWS * CELL + 2 * CELL)

animate(() => {
  const playing = toggle('play', true)
  const speed = slider('steps per second', 1, 30, 10, 1)
  if (button('step')) {
    advance()
  }
  if (button('randomize')) {
    cells = randomCells()
  }
  if (button('clear')) {
    cells = cells.map(() => false)
  }
  if (playing) {
    every(1 / speed, advance)
  }

  const x = floor(mouse.x / CELL)
  const y = floor(mouse.y / CELL)
  if (mouse.clicked && insideBoard(x, y)) {
    cells[index(x, y)] = !cells[index(x, y)]
  }

  clear()
  rect(0, 0, COLS * CELL, ROWS * CELL, BOARD_COLOR)
  cells.forEach((on, i) => {
    if (on) {
      // Inset by half a unit so neighboring cells show a thin gap.
      rect((i % COLS) * CELL + 0.5, floor(i / COLS) * CELL + 0.5, CELL - 1, CELL - 1, palette(2))
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
const COLS = 24
const ROWS = 16
const CELL = 20 // cell size in world units
const GAP = 1 // space around each body segment
const START = [[6, 8], [5, 8], [4, 8]] // head first
const MAX_FRAME_TIME = 0.25 // seconds; avoids a burst of moves after a pause
const FOOD_RADIUS = 6
const FOOD_PULSE_SPEED = 8
const TEXT_SIZE = 13
const STATUS_Y = -CELL // status line just below the board
const PANEL_SPACE = 160 // room on the right for the controls

const BOARD = '#262a35'
const BORDER = '#5b6cf0'
const FOOD = '#ff6b6b'

const UP = [0, 1]
const DOWN = [0, -1]
const LEFT = [-1, 0]
const RIGHT = [1, 0]

let snake, dir, next, food, score, over, timer

const same = (a, b) => a[0] === b[0] && a[1] === b[1]
const outside = ([x, y]) => x < 0 || y < 0 || x >= COLS || y >= ROWS
const hitsSnake = (cell, body) => body.some((part) => same(part, cell))

function placeFood() {
  do {
    food = [floor(Math.random() * COLS), floor(Math.random() * ROWS)]
  } while (hitsSnake(food, snake))
}

function newGame() {
  snake = START
  dir = next = RIGHT
  score = 0
  over = false
  timer = 0
  placeFood()
}

function move() {
  // The snake can't turn straight back into itself.
  if (!same(next, scale(dir, -1))) {
    dir = next
  }
  const head = add(snake[0], dir)
  const grows = same(head, food)
  const body = grows ? snake : snake.slice(0, -1)
  if (outside(head) || hitsSnake(head, body)) {
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
fit(-CELL, -CELL * 2, (COLS + 2) * CELL + PANEL_SPACE, (ROWS + 3) * CELL)

animate((t, dt) => {
  const speed = slider('speed', 4, 20, 9, 1)
  if (over && key('Space')) {
    newGame()
  }

  if (key('ArrowUp') || key('w')) {
    next = UP
  }
  if (key('ArrowDown') || key('s')) {
    next = DOWN
  }
  if (key('ArrowLeft') || key('a')) {
    next = LEFT
  }
  if (key('ArrowRight') || key('d')) {
    next = RIGHT
  }

  // Move once every 1 / speed seconds, catching up if a frame was slow.
  const moveTime = 1 / speed
  timer += min(dt, MAX_FRAME_TIME)
  while (!over && timer >= moveTime) {
    timer -= moveTime
    move()
  }

  clear()
  rect(0, 0, COLS * CELL, ROWS * CELL, BOARD, BORDER, px(2))
  const pulse = sin(t * FOOD_PULSE_SPEED)
  circle(food[0] * CELL + CELL / 2, food[1] * CELL + CELL / 2, FOOD_RADIUS + pulse, FOOD)
  snake.forEach(([x, y], i) => {
    // Shade from a bright head to a darker, bluer tail.
    const k = i / snake.length
    const color = hsl(140 + k * 40, 70, lerp(60, 35, k))
    rect(x * CELL + GAP, y * CELL + GAP, CELL - 2 * GAP, CELL - 2 * GAP, color)
  })

  text('score ' + score, 0, STATUS_Y, '#e6e8f0', TEXT_SIZE)
  if (over) {
    text('Game over! Press Space to play again.', COLS * CELL, STATUS_Y, FOOD, TEXT_SIZE, 'right')
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
const HALF_W = 300 // the court spans -HALF_W..HALF_W
const HALF_H = 180
const PADDLE_HALF = 40 // half the paddle length
const PADDLE_WIDTH = 8
const PADDLE_INSET = 8 // gap between the back wall and a paddle
const BALL_RADIUS = 6

const SERVE_SPEED = 220
const SERVE_MAX_VY = 120
const SPEEDUP = 1.05 // each hit makes the ball a bit faster
const MAX_SPEED = 600
const SPIN = 4 // hitting off-center sends the ball at an angle
const CPU_SPEED = 160
const OUT_MARGIN = 20 // how far past the paddle the ball goes before a point
const MAX_FRAME_TIME = 0.05

const DASH = 10 // center line dash length
const SCORE_SIZE = 18

// Where the ball touches each paddle's front face.
const PADDLE_FACE = HALF_W - PADDLE_INSET - PADDLE_WIDTH - BALL_RADIUS

let ball
let cpuY = 0
let you = 0
let cpu = 0

function serve(direction) {
  ball = { x: 0, y: 0, vx: SERVE_SPEED * direction, vy: random(-SERVE_MAX_VY, SERVE_MAX_VY) }
}

function bounceOff(paddleY, faceX) {
  const offset = ball.y - paddleY
  if (abs(offset) > PADDLE_HALF + BALL_RADIUS) {
    return // missed the paddle
  }
  ball.x = faceX
  ball.vx = clamp(-ball.vx * SPEEDUP, -MAX_SPEED, MAX_SPEED)
  ball.vy += offset * SPIN
}

function drawPaddle(x, y, color) {
  rect(x, y - PADDLE_HALF, PADDLE_WIDTH, 2 * PADDLE_HALF, color)
}

serve(1)
lockView()
fit(-HALF_W - 20, -HALF_H - 40, 2 * HALF_W + 40, 2 * HALF_H + 60)

animate((t, dt) => {
  dt = min(dt, MAX_FRAME_TIME)
  const paddleLimit = HALF_H - PADDLE_HALF
  const youY = clamp(mouse.y, -paddleLimit, paddleLimit)
  // The computer follows the ball, but only so fast.
  cpuY += clamp(ball.y - cpuY, -CPU_SPEED * dt, CPU_SPEED * dt)

  ball.x += ball.vx * dt
  ball.y += ball.vy * dt
  const wallY = HALF_H - BALL_RADIUS
  if (abs(ball.y) > wallY) {
    ball.y = sign(ball.y) * wallY
    ball.vy = -ball.vy
  }
  if (ball.vx < 0 && ball.x < -PADDLE_FACE) {
    bounceOff(youY, -PADDLE_FACE)
  }
  if (ball.vx > 0 && ball.x > PADDLE_FACE) {
    bounceOff(cpuY, PADDLE_FACE)
  }
  if (ball.x < -HALF_W - OUT_MARGIN) {
    cpu++
    serve(1)
  }
  if (ball.x > HALF_W + OUT_MARGIN) {
    you++
    serve(-1)
  }

  clear()
  rect(-HALF_W, -HALF_H, 2 * HALF_W, 2 * HALF_H, false, '#5b6cf0', px(2))
  for (let y = -HALF_H + DASH; y < HALF_H; y += 2 * DASH) {
    line(0, y, 0, y + DASH, 'rgba(255, 255, 255, 0.2)', 2)
  }
  drawPaddle(-HALF_W + PADDLE_INSET, youY, palette(0))
  drawPaddle(HALF_W - PADDLE_INSET - PADDLE_WIDTH, cpuY, palette(3))
  circle(ball.x, ball.y, BALL_RADIUS, 'white')
  text(you + ' : ' + cpu, 0, -HALF_H - 20, 'white', SCORE_SIZE, 'center')
})
`
  },
  {
    id: 'paint',
    title: 'Kaleidoscope paint',
    group: 'Interactive',
    description: 'mouse, rot, screenshot: draw with rainbow ink and mirror symmetry.',
    code: `// Draw with the mouse; every stroke is repeated around the center.
// Hold Space and drag to pan.
const HUE_SPEED = 40 // degrees per second; each new stroke gets the current hue
const HUE_STEP = 8 // each copy is shifted a little further around the color wheel

const strokes = []
let current = null

// Points flipped across the x axis.
const flipped = (points) => points.map(([x, y]) => [x, -y])
const rotated = (points, angle) => points.map((p) => rot(p, angle))

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
  if (button('save PNG')) {
    screenshot('kaleidoscope')
  }

  // A click starts a stroke; it grows while the mouse is held down.
  if (mouse.clicked) {
    current = { points: [], hue: (t * HUE_SPEED) % 360 }
    strokes.push(current)
  }
  if (!mouse.down) {
    current = null
  }
  if (current) {
    current.points.push([mouse.x, mouse.y])
  }

  clear()
  for (const { points, hue } of strokes) {
    for (let k = 0; k < copies; k++) {
      const angle = (k * 2 * PI) / copies
      const color = hsl(hue + k * HUE_STEP, 85, 65)
      polyline(rotated(points, angle), color, px(width))
      if (mirror) {
        polyline(rotated(flipped(points), angle), color, px(width))
      }
    }
  }
})
`
  },
  {
    id: 'mixer',
    title: 'Color mixer',
    group: 'Interactive',
    description: 'swatch, slider2d, mix, alpha: blend two palette colors.',
    code: `// Pick two colors and see them blended. The pad moves the second circle.
const first = swatch('first', 0)
const second = swatch('second', 6)
const opacity = slider('opacity', 0, 1, 0.6, 0.01)
const [dx, dy] = slider2d('offset', -80, 80, [50, 0])

// The strip of blend steps along the top.
const STEPS = 10
const STEP_WIDTH = 30 // one step plus the gap after it
const STRIP_LEFT = -165
const STRIP_Y = 90
const STRIP_HEIGHT = 40
const LABEL_COLOR = '#aab0c4'

// The two overlapping circles.
const CENTER = [-50, -30]
const RADIUS = 70

clear()

// A strip of steps from the first color to the second.
for (let i = 0; i <= STEPS; i++) {
  const amount = i / STEPS
  const x = STRIP_LEFT + i * STEP_WIDTH
  rect(x, STRIP_Y, STEP_WIDTH - 2, STRIP_HEIGHT, mix(first, second, amount))
  label(round(amount * 100) + '%', x + STEP_WIDTH / 2 - 1, STRIP_Y - 10, LABEL_COLOR, 10, 'center')
}

// Two see-through circles: where they overlap, the colors add up.
const [x2, y2] = add(CENTER, [dx, dy])
circle(CENTER[0], CENTER[1], RADIUS, alpha(first, opacity))
circle(x2, y2, RADIUS, alpha(second, opacity))

fit(-180, -120, 360, 260)
`
  }
];

export const EXAMPLE_GROUPS = [...new Set(EXAMPLES.map((e) => e.group))];
