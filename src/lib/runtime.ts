import logoSvg from './assets/logo.svg?raw';
import faviconSvg from './assets/favicon.svg?raw';

export const PROJECT_URL = 'https://github.com/dotcypress/vexel';

export const DEFAULT_CODE = `// Sunflower: each seed sits one golden angle past the last.
const golden = PI * (3 - sqrt(5))
let spin = 0

fit(-340, -340, 680, 680)

animate((t, dt) => {
  const speed = slider('speed', 0, 2, 0.14)
  const spread = slider('spread', 5, 20, 10)
  const count = slider('dots', 100, 1500, 900, 10)
  spin += speed * dt

  clear('#282c34')
  for (let i = 1; i < count; i++) {
    const angle = i * golden + spin
    const radius = spread * sqrt(i) * (1 + 0.1 * sin(t * 1.5 - i * 0.02))
    const size = 4.5 + 2.5 * sin(i * 0.05 - t * 2)
    point(cos(angle) * radius, sin(angle) * radius, size, hsl(i * 0.4 + t * 30, 90, 60))
  }
})`;

// Runs inside the sandboxed iframe. Kept as plain ES5-style JS in a template string.
// Must not contain backticks or dollar-brace sequences.
const RUNTIME = `
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;

// Camera in CSS pixels: screen x = world x * zoom + x, screen y = y - world y * zoom
// (Y points up). Pushed by the host.
var cam = { x: 0, y: 0, zoom: 1 };
var view = {
  x: 0, y: 0, zoom: 1,
  left: 0, top: 0, right: 0, bottom: 0,
  width: 0, height: 0
};
var mouse = { x: 0, y: 0, down: false, clicked: false };
// n: index of the current frame, time/dt: seconds, fps: smoothed frames per second.
var frame = { n: 0, time: 0, dt: 0, fps: 0 };

var fn = null;          // animate callback, if the sketch registered one
var halted = false;     // set after an error until the next run
var started = false;
var dirty = true;       // camera or size changed since the last frame
var animStart = 0;
var animLast = 0;       // time of the last animate callback
var animInterval = 0;   // seconds between callbacks, 0 = every frame
var animFirst = true;   // the first callback runs right away
var standalone = typeof STANDALONE !== 'undefined';

// Talks to the host app. Exported files have no host, so this is a no-op there.
function post(message) {
  if (!standalone) parent.postMessage(message, '*');
}

function updateView() {
  var w = window.innerWidth;
  var h = window.innerHeight;
  view.zoom = cam.zoom;
  view.left = -cam.x / cam.zoom;
  view.top = cam.y / cam.zoom;
  view.width = w / cam.zoom;
  view.height = h / cam.zoom;
  view.right = view.left + view.width;
  view.bottom = view.top - view.height;
  view.x = view.left + view.width / 2;
  view.y = view.top - view.height / 2;
}

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  dirty = true;
}

function applyCamera() {
  updateView();
  // Y points up: world y is negated on its way to the screen.
  ctx.setTransform(dpr * cam.zoom, 0, 0, -dpr * cam.zoom, dpr * cam.x, dpr * cam.y);
}

// Drawing helpers. Optional style arguments are applied temporarily so they
// never leak into the user's ctx state.
function clear(color) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  ctx.restore();
}

function point(x, y, size, color) {
  ctx.save();
  if (color) ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, (size == null ? 4 : size) / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function line(x1, y1, x2, y2, color, lineWidth) {
  ctx.save();
  if (color) ctx.strokeStyle = color;
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function points(list, size, color) {
  for (var i = 0; i < list.length; i++) {
    point(list[i][0], list[i][1], size, color);
  }
}

function polyline(list, color, lineWidth, closed) {
  if (list.length < 2) return;
  ctx.save();
  if (color) ctx.strokeStyle = color;
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(list[0][0], list[0][1]);
  for (var i = 1; i < list.length; i++) ctx.lineTo(list[i][0], list[i][1]);
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// Fills and/or strokes the current path. fill defaults to on, stroke to off.
function paint(fill, stroke, lineWidth) {
  if (fill !== false && fill !== null) {
    if (fill !== true && fill !== undefined) ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke !== undefined && stroke !== false && stroke !== null) {
    if (stroke !== true) ctx.strokeStyle = stroke;
    if (lineWidth != null) ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function circle(x, y, radius, fill, stroke, lineWidth) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, Math.abs(radius), 0, Math.PI * 2);
  paint(fill, stroke, lineWidth);
  ctx.restore();
}

function ellipse(x, y, rx, ry, fill, stroke, lineWidth, rotation) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rotation || 0, 0, Math.PI * 2);
  paint(fill, stroke, lineWidth);
  ctx.restore();
}

// Stroked arc of a circle, from angle start to end in radians, counterclockwise.
function arc(x, y, radius, start, end, color, lineWidth) {
  ctx.save();
  if (color) ctx.strokeStyle = color;
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, Math.abs(radius), start, end, end < start);
  ctx.stroke();
  ctx.restore();
}

// Closed polygon through [[x, y], ...]. fill and stroke work like circle().
function poly(list, fill, stroke, lineWidth) {
  if (list.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(list[0][0], list[0][1]);
  for (var i = 1; i < list.length; i++) ctx.lineTo(list[i][0], list[i][1]);
  ctx.closePath();
  paint(fill, stroke, lineWidth);
  ctx.restore();
}

function rect(x, y, w, h, fill, stroke, lineWidth) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  paint(fill, stroke, lineWidth);
  ctx.restore();
}

// Color helpers: they return CSS color strings usable anywhere a color is accepted.
// rgb: r, g, b in 0..255, a in 0..1.
function rgb(r, g, b, a) {
  return 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + (a == null ? 1 : a) + ')';
}

// hsl: h in degrees, s and l in 0..100, a in 0..1.
function hsl(h, s, l, a) {
  return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + (a == null ? 1 : a) + ')';
}

var PALETTE = [
  '#5b6cf0', '#f0725b', '#5bd6a0', '#f0c75b',
  '#c75bf0', '#5bc7f0', '#f05ba6', '#a6f05b',
  '#f0955b', '#e4f05b', '#5bf073', '#5bf0dd',
  '#5b9bf0', '#8f5bf0', '#f05bd9', '#f05b7c'
];

// The i-th color of a built-in palette. Wraps around, so any integer works.
function palette(i) {
  var n = PALETTE.length;
  return PALETTE[(((Math.floor(i) || 0) % n) + n) % n];
}

function isMultiple(v, step) {
  var q = v / step;
  return Math.abs(q - Math.round(q)) < 1e-9;
}

// Strokes grid lines at every multiple of step across the visible area,
// leaving out multiples of skip (when skip > 0).
function gridLines(step, skip) {
  var i, v;
  var last = Math.floor(view.right / step);
  ctx.beginPath();
  for (i = Math.ceil(view.left / step); i <= last; i++) {
    v = i * step;
    if (skip > 0 && isMultiple(v, skip)) continue;
    ctx.moveTo(v, view.top);
    ctx.lineTo(v, view.bottom);
  }
  last = Math.floor(view.top / step);
  for (i = Math.ceil(view.bottom / step); i <= last; i++) {
    v = i * step;
    if (skip > 0 && isMultiple(v, skip)) continue;
    ctx.moveTo(view.left, v);
    ctx.lineTo(view.right, v);
  }
  ctx.stroke();
}

// Grid with minor lines every step world units (default 10) and major lines every
// major world units (default 5 * step; 0 or false for none). Minor lines are drawn at
// half the opacity of major ones. Each kind is skipped on its own when its lines
// would be closer than a few screen pixels.
function grid(step, color, major) {
  step = step > 0 ? step : 10;
  var majorStep = major === false || major === 0 ? 0 : major > 0 ? major : step * 5;
  var minorOk = step * cam.zoom >= 4;
  var majorOk = majorStep > 0 && majorStep * cam.zoom >= 4;
  if (!minorOk && !majorOk) return;
  ctx.save();
  ctx.strokeStyle = color || 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1 / cam.zoom;
  if (minorOk) {
    var alpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * 0.5;
    gridLines(step, majorOk ? majorStep : 0);
    ctx.globalAlpha = alpha;
  }
  if (majorOk) gridLines(majorStep, 0);
  ctx.restore();
}

// Smallest 1/2/5 * 10^n step that keeps labels at least minPx screen pixels apart.
function tickStep(minPx) {
  for (var p = 1e-6; p < 1e15; p *= 10) {
    var k = [1, 2, 5];
    for (var j = 0; j < k.length; j++) {
      if (k[j] * p * cam.zoom >= minPx) return k[j] * p;
    }
  }
  return 1;
}

// X and Y axes through the origin, with value labels. Labels stay on screen
// by sticking to the edge when an axis is off-screen.
function axes(color) {
  ctx.save();
  ctx.strokeStyle = color || 'rgba(91, 108, 240, 0.8)';
  ctx.lineWidth = 1 / cam.zoom;
  ctx.beginPath();
  ctx.moveTo(view.left, 0);
  ctx.lineTo(view.right, 0);
  ctx.moveTo(0, view.top);
  ctx.lineTo(0, view.bottom);
  ctx.stroke();

  // Labels are drawn in screen pixels so they keep a constant size.
  var w = window.innerWidth;
  var h = window.innerHeight;
  var step = tickStep(70);
  var ax = Math.min(Math.max(cam.x, 0), Math.max(w - 40, 0));
  var ay = Math.min(Math.max(cam.y, 0), Math.max(h - 16, 0));
  var i, v, last;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = color || 'rgba(255, 255, 255, 0.75)';
  ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.textBaseline = 'top';
  last = Math.floor(view.right / step);
  for (i = Math.ceil(view.left / step); i <= last; i++) {
    v = i * step;
    ctx.fillText(String(Number(v.toPrecision(10))), v * cam.zoom + cam.x + 3, ay + 3);
  }
  ctx.textBaseline = 'bottom';
  last = Math.floor(view.top / step);
  for (i = Math.ceil(view.bottom / step); i <= last; i++) {
    if (i === 0) continue;
    v = i * step;
    ctx.fillText(String(Number(v.toPrecision(10))), ax + 4, cam.y - v * cam.zoom - 2);
  }
  ctx.restore();
}

// Quadratic Bezier from (x1, y1) to (x2, y2), pulled toward the control point (cx, cy).
function curve(x1, y1, cx, cy, x2, y2, color, lineWidth) {
  ctx.save();
  if (color) ctx.strokeStyle = color;
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
  ctx.restore();
}

// Vector field: f(x, y) returns [dx, dy] and an arrow starts at every step-th world point
// (default 20). An arrow is as long as the vector, capped just under step so arrows never
// overlap. Skipped when the arrows would be too dense to read.
function field(f, step, color) {
  step = step > 0 ? step : 20;
  if (step * cam.zoom < 8) return;
  var i0 = Math.ceil(view.left / step);
  var i1 = Math.floor(view.right / step);
  var j0 = Math.ceil(view.bottom / step);
  var j1 = Math.floor(view.top / step);
  if ((i1 - i0 + 1) * (j1 - j0 + 1) > 20000) return;
  var cap = step * 0.9;
  var headMax = px(6);
  ctx.save();
  ctx.strokeStyle = color || PALETTE[5];
  ctx.lineWidth = px(1.5);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (var i = i0; i <= i1; i++) {
    for (var j = j0; j <= j1; j++) {
      var x = i * step;
      var y = j * step;
      var v = f(x, y);
      if (!v) continue;
      var dx = v[0];
      var dy = v[1];
      if (!isFinite(dx) || !isFinite(dy)) continue;
      var len = Math.sqrt(dx * dx + dy * dy);
      if (!(len > 0)) continue;
      var k = len > cap ? cap / len : 1;
      var ex = x + dx * k;
      var ey = y + dy * k;
      var h = Math.min(headMax, len * k * 0.5);
      var a = Math.atan2(dy, dx);
      ctx.moveTo(x, y);
      ctx.lineTo(ex, ey);
      ctx.moveTo(ex - h * Math.cos(a - 0.45), ey - h * Math.sin(a - 0.45));
      ctx.lineTo(ex, ey);
      ctx.lineTo(ex - h * Math.cos(a + 0.45), ey - h * Math.sin(a + 0.45));
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Built-in colormaps for heat() and scatter(), as evenly spaced color stops.
// Sequential: viridis, magma, inferno, plasma, cividis (color-blind safe), turbo, hot, gray.
// Diverging: coolwarm, with a neutral middle for values on both sides of zero.
// Brand: vexel, the logo gradient.
var RAMPS = Object.create(null);
RAMPS.viridis = ['#440154', '#3b528b', '#21908d', '#5dc863', '#fde725'];
RAMPS.magma = ['#000004', '#51127c', '#b73779', '#fc8761', '#fcfdbf'];
RAMPS.inferno = ['#000004', '#420a68', '#932667', '#dd513a', '#fca50a', '#fcffa4'];
RAMPS.plasma = ['#0d0887', '#6a00a8', '#b12a90', '#e16462', '#fca636', '#f0f921'];
RAMPS.cividis = ['#00204d', '#31446b', '#666970', '#958f78', '#cbba69', '#ffea46'];
RAMPS.turbo = ['#30123b', '#4777ef', '#1ac7c2', '#a2fc3c', '#fabb38', '#e4460a', '#7a0403'];
RAMPS.hot = ['#000000', '#b30000', '#ff7f00', '#ffe135', '#ffffff'];
RAMPS.coolwarm = ['#3b4cc0', '#7b9ff9', '#c0d4f5', '#f2cbb7', '#ee8468', '#b40426'];
RAMPS.gray = ['#000000', '#ffffff'];
RAMPS.vexel = ['#5bc7f0', '#5b6cf0', '#8f5bf0', '#f05ba6'];
var rampLuts = Object.create(null);

// 256 precomputed CSS colors for a built-in colormap.
function rampLut(name) {
  if (rampLuts[name]) return rampLuts[name];
  var stops = RAMPS[name];
  if (!stops) {
    throw new Error("unknown ramp '" + name + "' (use " + Object.keys(RAMPS).join(', ') + ' or a function)');
  }
  var rgbs = stops.map(function (s) {
    return [parseInt(s.substr(1, 2), 16), parseInt(s.substr(3, 2), 16), parseInt(s.substr(5, 2), 16)];
  });
  var lut = [];
  for (var n = 0; n < 256; n++) {
    var t = (n / 255) * (rgbs.length - 1);
    var i = Math.min(rgbs.length - 2, Math.floor(t));
    var u = t - i;
    var a = rgbs[i];
    var b = rgbs[i + 1];
    lut.push(
      'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ', ' +
      Math.round(a[1] + (b[1] - a[1]) * u) + ', ' +
      Math.round(a[2] + (b[2] - a[2]) * u) + ')'
    );
  }
  rampLuts[name] = lut;
  return lut;
}

// Colors the whole view by f(x, y), which returns a number from 0 to 1 (clamped).
// ramp is the name of a built-in colormap ('viridis' by default) or a function t => color.
// Cells are a few screen pixels wide; the result is opaque, so draw it first.
function heat(f, ramp) {
  var lut = null;
  if (typeof ramp !== 'function') lut = rampLut(ramp == null ? 'viridis' : String(ramp));
  var w = window.innerWidth;
  var h = window.innerHeight;
  var c = Math.max(8, Math.ceil(Math.sqrt((w * h) / 10000)));
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (var sy = 0; sy < h; sy += c) {
    for (var sx = 0; sx < w; sx += c) {
      var v = f((sx + c / 2 - cam.x) / cam.zoom, (cam.y - sy - c / 2) / cam.zoom);
      if (typeof v !== 'number' || !isFinite(v)) continue;
      var t = v < 0 ? 0 : v > 1 ? 1 : v;
      var color = lut ? lut[Math.round(t * 255)] : ramp(t);
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(sx, sy, c + 0.5, c + 0.5);
    }
  }
  ctx.restore();
}

// Numbers from a up to, but not including, b in steps of step (default 1), e.g.
// range(0, 1, 0.25) is [0, 0.25, 0.5, 0.75]. range(n) counts from 0 to n - 1. A step that
// points away from b gives an empty list, so use a negative step to count down.
function range(a, b, step) {
  if (b === undefined) {
    b = a;
    a = 0;
  }
  step = step == null ? 1 : step;
  if (!isFinite(a) || !isFinite(b) || !isFinite(step)) {
    throw new Error('range: a, b and step must be finite numbers');
  }
  if (step === 0) throw new Error('range: step must not be 0');
  // The tiny offset keeps float noise (0.3 / 0.1 is 2.9999999999999996) from adding a value.
  var count = Math.ceil((b - a) / step - 1e-9);
  if (!(count > 0)) return [];
  if (count > 1000000) throw new Error('range: too many values (' + count + ')');
  var out = [];
  // a + i * step avoids the drift of repeated addition; toPrecision trims 0.30000000000000004.
  for (var i = 0; i < count; i++) out.push(Number((a + i * step).toPrecision(15)));
  return out;
}

// n evenly spaced numbers from a to b, both included: linspace(0, 1, 5) is
// [0, 0.25, 0.5, 0.75, 1]. Handy for sampling a curve.
function linspace(a, b, n) {
  if (!isFinite(a) || !isFinite(b) || !isFinite(n)) {
    throw new Error('linspace: a, b and n must be finite numbers');
  }
  n = Math.floor(n);
  if (!(n > 0)) return [];
  if (n > 1000000) throw new Error('linspace: too many values (' + n + ')');
  if (n === 1) return [a];
  var out = [];
  for (var i = 0; i < n - 1; i++) out.push(a + ((b - a) * i) / (n - 1));
  out.push(b);
  return out;
}

// The rectangle around a list of [x, y] points as [x, y, w, h], with x, y the bottom-left
// corner, ready for fit(...bounds(points)). Points that are not finite are ignored; an empty
// list gives [0, 0, 0, 0].
function bounds(points) {
  var minX = Infinity;
  var minY = Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;
  for (var i = 0; i < points.length; i++) {
    var p = points[i];
    if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue;
    if (p[0] < minX) minX = p[0];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  if (minX === Infinity) return [0, 0, 0, 0];
  return [minX, minY, maxX - minX, maxY - minY];
}

// The list rescaled so its smallest number becomes 0 and its largest 1. A list whose numbers
// are all equal becomes all 0, and entries that are not finite numbers become NaN.
function normalize(list) {
  var lo = Infinity;
  var hi = -Infinity;
  var i, v;
  for (i = 0; i < list.length; i++) {
    v = list[i];
    if (typeof v !== 'number' || !isFinite(v)) continue;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  var span = hi - lo;
  var out = [];
  for (i = 0; i < list.length; i++) {
    v = list[i];
    out.push(typeof v === 'number' && isFinite(v) ? (span > 0 ? (v - lo) / span : 0) : NaN);
  }
  return out;
}

// The value t of the way from a to b: lerp(10, 20, 0.5) is 15. t is not clamped, so values
// outside 0..1 extrapolate.
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// once(fn) or once(key, fn): calls fn the first time and returns the cached result
// after that, across frames and across re-runs from panning or controls. Editing the
// code reloads the preview, which clears the cache. Without a key, the function's
// source text is the key.
var onceCache = Object.create(null);

function once(key, fn) {
  if (typeof key === 'function') {
    fn = key;
    key = String(fn);
  }
  key = String(key);
  if (!(key in onceCache)) onceCache[key] = fn();
  return onceCache[key];
}

// Seeded random numbers (mulberry32). The generator restarts from the same seed on
// every run, so re-runs triggered by panning or controls draw the same picture.
var DEFAULT_SEED = 1;
var rngState = DEFAULT_SEED;
var spareGauss = null;

function seed(n) {
  rngState = (Number(n) || 0) >>> 0;
  spareGauss = null;
}

function rand01() {
  rngState = (rngState + 0x6d2b79f5) >>> 0;
  var t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// random(): 0..1. random(b): 0..b. random(a, b): a..b. random(list): a random item.
function random(a, b) {
  var r = rand01();
  if (Array.isArray(a)) return a[Math.floor(r * a.length)];
  if (a == null) return r;
  if (b == null) return r * a;
  return a + (b - a) * r;
}

// Normally distributed number (Box-Muller), mean 0 and sd 1 by default.
function gauss(mean, sd) {
  var z;
  if (spareGauss !== null) {
    z = spareGauss;
    spareGauss = null;
  } else {
    var u = 1 - rand01();
    var v = rand01();
    var m = Math.sqrt(-2 * Math.log(u));
    z = m * Math.cos(2 * Math.PI * v);
    spareGauss = m * Math.sin(2 * Math.PI * v);
  }
  return (mean == null ? 0 : mean) + (sd == null ? 1 : sd) * z;
}

// Function t (0..1) => color for a ramp argument: a built-in name or your own function.
function rampFn(ramp) {
  if (typeof ramp === 'function') return ramp;
  var lut = rampLut(ramp == null ? 'viridis' : String(ramp));
  return function (t) {
    return lut[Math.round(t * 255)];
  };
}

// Dots at [x, y, value] triples, colored by value (0..1, clamped) with a ramp as in heat().
// size is the diameter in world units (default 4). Entries without a value use the ramp's start.
function scatter(list, size, ramp) {
  var color = rampFn(ramp);
  var r = (size == null ? 4 : size) / 2;
  ctx.save();
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    if (!p || !isFinite(p[0]) || !isFinite(p[1])) continue;
    var v = typeof p[2] === 'number' && isFinite(p[2]) ? p[2] : 0;
    var c = color(v < 0 ? 0 : v > 1 ? 1 : v);
    if (c) ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(p[0], p[1], r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Bar chart: bar i stands on y = 0 in the slot from i * width to (i + 1) * width (width
// defaults to 10), as tall as its value in world units. color is one color or (i, value) => color.
function bars(list, width, color) {
  width = width > 0 ? width : 10;
  ctx.save();
  for (var i = 0; i < list.length; i++) {
    var v = list[i];
    if (typeof v !== 'number' || !isFinite(v)) continue;
    var c = typeof color === 'function' ? color(i, v) : color || PALETTE[0];
    if (c) ctx.fillStyle = c;
    ctx.fillRect(i * width + width * 0.1, 0, width * 0.8, v);
  }
  ctx.restore();
}

// Histogram of a list of numbers in the given number of bins (default 10) between its
// smallest and largest value. x is the data value and a bar is as tall as its count, both
// in world units. Returns the counts.
function hist(list, bins) {
  var data = [];
  for (var i = 0; i < list.length; i++) {
    if (typeof list[i] === 'number' && isFinite(list[i])) data.push(list[i]);
  }
  if (!data.length) return [];
  var n = bins > 0 ? Math.min(1000, Math.floor(bins)) || 1 : 10;
  var min = data[0];
  var max = data[0];
  for (i = 1; i < data.length; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  if (min === max) {
    min -= 0.5;
    max += 0.5;
  }
  var bw = (max - min) / n;
  var counts = [];
  for (i = 0; i < n; i++) counts.push(0);
  for (i = 0; i < data.length; i++) {
    counts[Math.min(n - 1, Math.floor((data[i] - min) / bw))]++;
  }
  var gap = bw * cam.zoom > 3 ? px(1) : 0;
  ctx.save();
  ctx.fillStyle = PALETTE[0];
  for (i = 0; i < n; i++) ctx.fillRect(min + i * bw, 0, bw - gap, counts[i]);
  ctx.restore();
  return counts;
}

// Curve where f(x, y) = level (default 0), found with marching squares on a grid of
// a few screen pixels. Draws every branch it finds, e.g. contour((x, y) => hypot(x, y) - 50).
function contour(f, level, color, lineWidth) {
  level = level == null ? 0 : level;
  var w = window.innerWidth;
  var h = window.innerHeight;
  var c = Math.max(6, Math.ceil(Math.sqrt((w * h) / 20000)));
  var nx = Math.ceil(w / c);
  var ny = Math.ceil(h / c);
  var cw = c / cam.zoom;
  var stride = nx + 1;
  var vals = new Float64Array(stride * (ny + 1));
  var i, j;
  for (j = 0; j <= ny; j++) {
    for (i = 0; i <= nx; i++) {
      var v = f(view.left + i * cw, view.top - j * cw);
      vals[j * stride + i] = typeof v === 'number' ? v - level : NaN;
    }
  }

  ctx.save();
  ctx.strokeStyle = color || PALETTE[0];
  ctx.lineWidth = lineWidth == null ? px(1.5) : lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  function seg(ax, ay, bx, by) {
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  for (j = 0; j < ny; j++) {
    for (i = 0; i < nx; i++) {
      // Corners: a top-left, b top-right, c bottom-right, d bottom-left.
      var va = vals[j * stride + i];
      var vb = vals[j * stride + i + 1];
      var vd = vals[(j + 1) * stride + i];
      var vc = vals[(j + 1) * stride + i + 1];
      if (!isFinite(va) || !isFinite(vb) || !isFinite(vc) || !isFinite(vd)) continue;
      var idx = (va > 0 ? 1 : 0) | (vb > 0 ? 2 : 0) | (vc > 0 ? 4 : 0) | (vd > 0 ? 8 : 0);
      if (idx === 0 || idx === 15) continue;
      var x0 = view.left + i * cw;
      var y0 = view.top - j * cw;
      var x1 = x0 + cw;
      var y1 = y0 - cw;
      // Where the curve crosses each edge: top, right, bottom, left.
      var tx = x0 + (va / (va - vb)) * cw;
      var ry = y0 - (vb / (vb - vc)) * cw;
      var bx = x0 + (vd / (vd - vc)) * cw;
      var ly = y0 - (va / (va - vd)) * cw;
      var inside = (va + vb + vc + vd) / 4 > 0;
      switch (idx) {
        case 1: case 14: seg(x0, ly, tx, y0); break;
        case 2: case 13: seg(tx, y0, x1, ry); break;
        case 3: case 12: seg(x0, ly, x1, ry); break;
        case 4: case 11: seg(x1, ry, bx, y1); break;
        case 6: case 9: seg(tx, y0, bx, y1); break;
        case 7: case 8: seg(x0, ly, bx, y1); break;
        case 5:
          if (inside) { seg(tx, y0, x1, ry); seg(x0, ly, bx, y1); }
          else { seg(x0, ly, tx, y0); seg(x1, ry, bx, y1); }
          break;
        case 10:
          if (inside) { seg(x0, ly, tx, y0); seg(x1, ry, bx, y1); }
          else { seg(tx, y0, x1, ry); seg(x0, ly, bx, y1); }
          break;
      }
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Positions remembered per trail id.
var trails = Object.create(null);

// Remembers the last n positions (default 50) under id and draws them as a line that
// fades out toward the oldest. Call it once per frame, e.g. inside animate.
function trail(id, x, y, n, color) {
  id = String(id);
  n = n > 1 ? Math.min(Math.floor(n), 10000) : 50;
  var pts = trails[id] || (trails[id] = []);
  if (isFinite(x) && isFinite(y)) {
    var last = pts[pts.length - 1];
    // Static sketches re-run on camera changes; don't grow the trail for the same point.
    if (!last || last[0] !== x || last[1] !== y) pts.push([x, y]);
  }
  if (pts.length > n) pts.splice(0, pts.length - n);
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color || PALETTE[0];
  ctx.lineWidth = px(2);
  ctx.lineCap = 'round';
  var alpha = ctx.globalAlpha;
  for (var i = 1; i < pts.length; i++) {
    ctx.globalAlpha = (alpha * i) / (pts.length - 1);
    ctx.beginPath();
    ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
    ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  ctx.restore();
}

// Hover tests made during the current run of a static sketch, so the sketch can be
// re-run when the pointer enters or leaves.
var hoverTests = [];

// True while the pointer is within r world units of (x, y).
function hover(x, y, r) {
  var inside = Math.sqrt((mouse.x - x) * (mouse.x - x) + (mouse.y - y) * (mouse.y - y)) <= r;
  hoverTests.push({ x: x, y: y, r: r, inside: inside });
  return inside;
}

function checkHover() {
  // Sketches animated every frame read the pointer again on their next frame anyway.
  if (fn && !animInterval) return;
  for (var i = 0; i < hoverTests.length; i++) {
    var t = hoverTests[i];
    var inside = Math.sqrt((mouse.x - t.x) * (mouse.x - t.x) + (mouse.y - t.y) * (mouse.y - t.y)) <= t.r;
    if (inside !== t.inside) {
      dirty = true;
      return;
    }
  }
}

// n screen pixels expressed in world units (default 1), for zoom-independent line
// widths and sizes: line(0, 0, 50, 50, 'white', px(2)).
function px(n) {
  return (n == null ? 1 : n) / cam.zoom;
}

// Frames the world rectangle with bottom-left corner (x, y), w wide and h tall,
// with a small margin. It applies once per run and again only when the arguments
// change, so the user can still pan and zoom afterwards.
var lastFit = '';
var pendingFit = null;   // a fit() that ran before the page had any size
function fit(x, y, w, h) {
  if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h) || !(w > 0) || !(h > 0)) return;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  // Right after the page loads the frame can still be unmeasured (0 x 0). Framing against that
  // would zoom way out, so wait for the resize event that reports the real size.
  if (vw < 2 || vh < 2) {
    pendingFit = [x, y, w, h];
    return;
  }
  pendingFit = null;
  var id = [x, y, w, h].join(',');
  if (id === lastFit) return;
  lastFit = id;
  var zoom = Math.min(100, Math.max(0.01, Math.min(vw / w, vh / h) * 0.9));
  cam.zoom = zoom;
  cam.x = vw / 2 - (x + w / 2) * zoom;
  cam.y = vh / 2 + (y + h / 2) * zoom;
  applyCamera();
  // Redraw the whole frame under the new camera on the next tick.
  dirty = true;
  post({ source: 'vexel', type: 'camera', x: cam.x, y: cam.y, zoom: zoom });
}

// lockView(options?): stops the user from panning and/or zooming the view. With no
// argument both are locked; { pan: false } locks only zoom, { zoom: false } only pan.
// fit() still moves the camera. Editing the code clears the lock.
var viewLock = { pan: false, zoom: false };

function lockView(options) {
  var o = options || {};
  var pan = o.pan !== false;
  var zoom = o.zoom !== false;
  if (pan === viewLock.pan && zoom === viewLock.zoom) return;
  viewLock.pan = pan;
  viewLock.zoom = zoom;
  post({ source: 'vexel', type: 'lock', pan: pan, zoom: zoom });
}

// Text at (x, y), vertically centered. size is in world units (default 14);
// align is 'left' (default), 'center' or 'right'.
function text(str, x, y, color, size, align) {
  ctx.save();
  ctx.fillStyle = color || '#e6e8f0';
  ctx.font = (size == null ? 14 : size) + 'px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  // Undo the camera's y flip locally so the text is not mirrored.
  ctx.translate(x, y);
  ctx.scale(1, -1);
  ctx.fillText(String(str), 0, 0);
  ctx.restore();
}

// Graph of y = f(x) over the visible x range, or from..to when given.
// Gaps appear wherever f returns something that is not a finite number.
function plot(f, color, lineWidth, from, to) {
  var x0 = Math.max(from == null ? view.left : from, view.left);
  var x1 = Math.min(to == null ? view.right : to, view.right);
  if (!(x1 > x0)) return;
  var n = Math.min(4000, Math.max(2, Math.ceil(((x1 - x0) * cam.zoom) / 2)));
  ctx.save();
  ctx.strokeStyle = color || PALETTE[0];
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  var pen = false;
  for (var i = 0; i <= n; i++) {
    var x = x0 + ((x1 - x0) * i) / n;
    var y = f(x);
    if (typeof y !== 'number' || !isFinite(y)) {
      pen = false;
    } else if (pen) {
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      pen = true;
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Graph of r = f(theta) for theta from 0 to 2*PI. Gaps appear wherever f
// returns something that is not a finite number.
function plotPolar(f, color, lineWidth) {
  var n = 2000;
  ctx.save();
  ctx.strokeStyle = color || PALETTE[0];
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  var pen = false;
  for (var i = 0; i <= n; i++) {
    var theta = (Math.PI * 2 * i) / n;
    var r = f(theta);
    if (typeof r !== 'number' || !isFinite(r)) {
      pen = false;
      continue;
    }
    var x = r * Math.cos(theta);
    var y = r * Math.sin(theta);
    if (pen) {
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      pen = true;
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Parametric curve x = fx(t), y = fy(t) for t from t0 to t1 (default 0 to 2*PI).
// Gaps appear wherever fx or fy returns something that is not a finite number.
function plotParam(fx, fy, t0, t1, color, lineWidth) {
  if (t0 == null) t0 = 0;
  if (t1 == null) t1 = Math.PI * 2;
  var n = 2000;
  ctx.save();
  ctx.strokeStyle = color || PALETTE[0];
  if (lineWidth != null) ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  var pen = false;
  for (var i = 0; i <= n; i++) {
    var t = t0 + ((t1 - t0) * i) / n;
    var x = fx(t);
    var y = fy(t);
    if (typeof x !== 'number' || !isFinite(x) || typeof y !== 'number' || !isFinite(y)) {
      pen = false;
    } else if (pen) {
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      pen = true;
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Keyboard state. Keys are stored lowercased under both event.key and event.code,
// so key('a'), key('ArrowLeft') and key('Space') all work.
var keys = Object.create(null);

function setKey(name, code, down) {
  var changed = false;
  var ids = [String(name).toLowerCase(), String(code || '').toLowerCase()];
  for (var i = 0; i < ids.length; i++) {
    if (!ids[i] || !!keys[ids[i]] === down) continue;
    changed = true;
    if (down) keys[ids[i]] = true;
    else delete keys[ids[i]];
  }
  // A static sketch re-runs so it can react to the key.
  if (changed) dirty = true;
}

function clearKeys() {
  keys = Object.create(null);
  dirty = true;
}

// True while the named key is held, e.g. key('ArrowLeft'), key('a'), key('Space').
function key(name) {
  return keys[String(name).toLowerCase()] === true;
}

// Screen-space overlays (sliders, toggles and hud) are drawn after the sketch has
// finished a frame, so they always end up on top.
var sliders = [];   // controls: sliders, toggles, selects and buttons, in first-use order
var sliderMap = Object.create(null);
var savedSliders = Object.create(null);   // values restored by the host after a re-run
var activeSlider = null;
var prevDown = false;
var hudLines = [];
var SLIDER_W = 180;
var SLIDER_ROW = 36;
var TOGGLE_ROW = 24;
var SELECT_ROW = 44;
var BUTTON_ROW = 30;
var pressedButton = null;   // the button under a held pointer, drawn highlighted

function fmtNumber(v) {
  return String(Number(v.toPrecision(4)));
}

function clampSlider(s, v) {
  if (typeof v !== 'number' || !isFinite(v)) v = s.min;
  if (s.step > 0) v = s.min + Math.round((v - s.min) / s.step) * s.step;
  v = Math.min(Math.max(v, Math.min(s.min, s.max)), Math.max(s.min, s.max));
  return Number(v.toPrecision(12));
}

// Adds (once) a labeled slider to the top-right panel and returns its current value.
// The value survives re-runs; min, max and step may change between calls.
function slider(name, min, max, value, step) {
  name = String(name);
  min = min == null ? 0 : min;
  max = max == null ? 1 : max;
  var s = sliderMap[name];
  if (s && s.kind !== 'slider') return s.value;   // name already used by a toggle
  if (!s) {
    s = sliderMap[name] = { kind: 'slider', name: name, min: min, max: max, step: 0, value: 0 };
    sliders.push(s);
    s.value = name in savedSliders ? savedSliders[name] : value == null ? min : value;
  }
  s.min = min;
  s.max = max;
  s.step = step > 0 ? step : 0;
  s.value = clampSlider(s, s.value);
  return s.value;
}

// Adds (once) a labeled checkbox to the same panel and returns whether it is on.
// The state survives re-runs. value is the initial state (default off).
function toggle(name, value) {
  name = String(name);
  var s = sliderMap[name];
  if (s && s.kind !== 'toggle') return !!s.value;   // name already used by a slider
  if (!s) {
    s = sliderMap[name] = { kind: 'toggle', name: name, value: 0 };
    sliders.push(s);
    s.value = name in savedSliders ? (savedSliders[name] ? 1 : 0) : value ? 1 : 0;
  }
  return !!s.value;
}

// Adds (once) a labeled chooser to the same panel and returns the chosen option, which
// can be any value. Click the left half to go back and the right half to go forward.
// value is the initially chosen option (default: the first). The choice survives re-runs.
function select(name, options, value) {
  name = String(name);
  if (!Array.isArray(options) || !options.length) {
    throw new Error('select: options must be a non-empty array');
  }
  var s = sliderMap[name];
  if (s && s.kind !== 'select') return options[0];   // name already used by another control
  if (!s) {
    s = sliderMap[name] = { kind: 'select', name: name, options: options, value: 0 };
    sliders.push(s);
    var start = options.indexOf(value);
    s.value = name in savedSliders ? Math.floor(savedSliders[name]) : start >= 0 ? start : 0;
  }
  s.options = options;
  s.value = Math.min(options.length - 1, Math.max(0, s.value || 0));
  return options[s.value];
}

// Adds (once) a push button to the same panel. Returns true for the one frame or re-run
// after it was clicked, false otherwise.
function button(name) {
  name = String(name);
  var s = sliderMap[name];
  if (s && s.kind !== 'button') return false;   // name already used by another control
  if (!s) {
    s = sliderMap[name] = { kind: 'button', name: name, value: 0, pending: false, fired: false };
    sliders.push(s);
  }
  return s.fired;
}

// drag(id, x, y, r?, color?): a handle the user can drag with the left button. Returns
// its current [x, y]; x, y is where it starts. The position survives frames, re-runs and
// code edits (the host keeps it with the slider values). r is the grab radius in screen pixels (default 8).
// Handles are drawn on top of the sketch, like the controls.
var DRAG_KEY = '@drag:';            // prefix for handle positions stored with slider values
var handles = Object.create(null);   // id -> { x, y }, kept across runs
var handleList = [];                 // handles used by the latest run, in call order
var activeHandle = null;
var hoveredHandle = null;
var dragOffset = { x: 0, y: 0 };

function drag(id, x, y, r, color) {
  id = String(id);
  var h = handles[id];
  if (!h) {
    var key = DRAG_KEY + id;
    var saved = key + ':x' in savedSliders && key + ':y' in savedSliders;
    h = handles[id] = {
      x: saved ? savedSliders[key + ':x'] : Number(x) || 0,
      y: saved ? savedSliders[key + ':y'] : Number(y) || 0
    };
  }
  h.id = id;
  h.r = r > 0 ? r : 8;
  h.color = color || PALETTE[0];
  if (handleList.indexOf(h) < 0) handleList.push(h);
  return [h.x, h.y];
}

// The topmost handle within its radius of a screen point, or null.
function handleAt(sx, sy) {
  for (var i = handleList.length - 1; i >= 0; i--) {
    var h = handleList[i];
    var dx = h.x * cam.zoom + cam.x - sx;
    var dy = cam.y - h.y * cam.zoom - sy;
    if (dx * dx + dy * dy <= (h.r + 4) * (h.r + 4)) return h;
  }
  return null;
}

// Clicks arrive between frames. Each one is handed to exactly one run of the sketch code:
// the next animate frame, or the re-run a click triggers in a static sketch.
var pendingClick = false;

function latchClicks() {
  mouse.clicked = pendingClick;
  pendingClick = false;
  for (var i = 0; i < sliders.length; i++) {
    var s = sliders[i];
    if (s.kind !== 'button') continue;
    s.fired = s.pending;
    s.pending = false;
  }
}

// every(seconds, fn?): true once every given number of seconds of animation time, and
// calls fn when it is. The first time comes one period after the first call. Calls with
// the same period and function share a timer; pass a different key to separate them.
var timers = Object.create(null);

function every(seconds, fn, key) {
  if (!(seconds > 0)) return false;
  var id = String(seconds) + '|' + (key != null ? key : fn ? String(fn) : '');
  var now = frame.time;
  var tm = timers[id];
  if (!tm) {
    timers[id] = { next: now + seconds, n: frame.n };
    return false;
  }
  if (tm.n === frame.n) return tm.fired;   // asked again within the same frame
  tm.n = frame.n;
  tm.fired = now >= tm.next;
  if (tm.fired) {
    tm.next += seconds;
    if (tm.next <= now) tm.next = now + seconds;   // skip missed beats instead of bursting
    if (fn) fn();
  }
  return tm.fired;
}

// Each argument is a line of text; a plain object becomes one "key: value" line per entry.
// Shown in the top-left corner for the current frame only.
function hud() {
  for (var i = 0; i < arguments.length; i++) {
    var a = arguments[i];
    if (a && typeof a === 'object' && !Array.isArray(a)) {
      for (var key in a) {
        var v = a[key];
        hudLines.push(key + ': ' + (typeof v === 'number' ? fmtNumber(v) : String(v)));
      }
    } else {
      hudLines.push(typeof a === 'number' ? fmtNumber(a) : String(a));
    }
  }
}

// Log lines are batched so a log() call on every frame cannot flood the host.
var logQueue = [];
var logScheduled = false;
var LOG_BATCH = 50;

function fmtLog(v) {
  var s;
  if (typeof v === 'string') s = v;
  else if (v instanceof Error) s = v.name + ': ' + v.message;
  else if (typeof v === 'function') s = 'function ' + (v.name || '(anonymous)');
  else if (v && typeof v === 'object') {
    try {
      s = JSON.stringify(v);
    } catch (e) {}
    if (s === undefined) s = String(v);
  } else s = String(v);
  return s.length > 1000 ? s.slice(0, 1000) + '\u2026' : s;
}

function flushLogs() {
  logScheduled = false;
  if (!logQueue.length) return;
  var entries = logQueue.slice(0, LOG_BATCH);
  var dropped = logQueue.length - entries.length;
  logQueue = [];
  if (dropped > 0) entries.push({ level: 'warn', text: dropped + ' more log lines dropped' });
  post({ source: 'vexel', type: 'log', entries: entries });
}

function emitLog(level, args) {
  var parts = [];
  for (var i = 0; i < args.length; i++) parts.push(fmtLog(args[i]));
  logQueue.push({ level: level, text: parts.join(' ') });
  if (!logScheduled) {
    logScheduled = true;
    setTimeout(flushLogs, 50);
  }
}

// Prints its arguments to the console panel, separated by spaces. Objects and arrays are
// shown as JSON. In exported pages it prints to the browser console instead.
function log() {
  if (standalone) console.log.apply(console, arguments);
  else emitLog('log', arguments);
}

function controlHeight(c) {
  if (c.kind === 'toggle') return TOGGLE_ROW;
  if (c.kind === 'button') return BUTTON_ROW;
  return c.kind === 'select' ? SELECT_ROW : SLIDER_ROW;
}

function sliderRow(i) {
  var y = 22;
  for (var j = 0; j < i; j++) y += controlHeight(sliders[j]);
  return { x: window.innerWidth - 12 - SLIDER_W - 10, y: y, h: controlHeight(sliders[i]) };
}

// Called whenever the pointer changes: starts, drags and ends slider interaction.
function updateSliders() {
  checkHover();
  var down = mouse.down;
  var sx = mouse.x * cam.zoom + cam.x;
  var sy = cam.y - mouse.y * cam.zoom;
  if (down && !prevDown) {
    activeSlider = null;
    var hit = false;
    for (var i = 0; i < sliders.length; i++) {
      var r = sliderRow(i);
      if (sx >= r.x - 8 && sx <= r.x + SLIDER_W + 8 && sy >= r.y && sy < r.y + r.h) {
        hit = true;
        if (sliders[i].kind === 'button') {
          sliders[i].pending = true;
          pressedButton = sliders[i];
          dirty = true;
        } else if (sliders[i].kind === 'toggle') {
          sliders[i].value = sliders[i].value ? 0 : 1;
          dirty = true;
          post({ source: 'vexel', type: 'slider', name: sliders[i].name, value: sliders[i].value });
        } else if (sliders[i].kind === 'select') {
          var count = sliders[i].options.length;
          sliders[i].value = (sliders[i].value + (sx < r.x + SLIDER_W / 2 ? count - 1 : 1)) % count;
          dirty = true;
          post({ source: 'vexel', type: 'slider', name: sliders[i].name, value: sliders[i].value });
        } else {
          activeSlider = sliders[i];
        }
        break;
      }
    }
    if (!hit) {
      activeHandle = handleAt(sx, sy);
      if (activeHandle) {
        dragOffset.x = activeHandle.x - mouse.x;
        dragOffset.y = activeHandle.y - mouse.y;
      } else {
        // A click on the sketch itself, not on a control or a handle.
        pendingClick = true;
      }
      dirty = true;
    }
  } else if (!down) {
    activeSlider = null;
    if (activeHandle) {
      post({ source: 'vexel', type: 'slider', name: DRAG_KEY + activeHandle.id + ':x', value: activeHandle.x });
      post({ source: 'vexel', type: 'slider', name: DRAG_KEY + activeHandle.id + ':y', value: activeHandle.y });
      activeHandle = null;
      dirty = true;
    }
    if (pressedButton) {
      pressedButton = null;
      dirty = true;
    }
  }
  prevDown = down;
  if (activeHandle && down) {
    var nx = mouse.x + dragOffset.x;
    var ny = mouse.y + dragOffset.y;
    if (nx !== activeHandle.x || ny !== activeHandle.y) {
      activeHandle.x = nx;
      activeHandle.y = ny;
      dirty = true;
    }
  }
  var over = activeHandle || (down ? null : handleAt(sx, sy));
  if (over !== hoveredHandle) {
    hoveredHandle = over;
    var cur = over ? (activeHandle ? 'grabbing' : 'grab') : '';
    canvas.style.cursor = cur;
    post({ source: 'vexel', type: 'cursor', cursor: cur });
    dirty = true;
  }
  if (!activeSlider) return;
  var row = sliderRow(sliders.indexOf(activeSlider));
  var t = Math.min(1, Math.max(0, (sx - row.x) / SLIDER_W));
  var v = clampSlider(activeSlider, activeSlider.min + t * (activeSlider.max - activeSlider.min));
  if (v !== activeSlider.value) {
    activeSlider.value = v;
    dirty = true;
    post({ source: 'vexel', type: 'slider', name: activeSlider.name, value: v });
  }
}

function overlayBox(x, y, w, h) {
  ctx.fillStyle = 'rgba(21, 23, 30, 0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

function drawOverlays() {
  if (!sliders.length && !hudLines.length && !handleList.length) return;
  var mono = 'ui-monospace, Menlo, Consolas, monospace';
  var i;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Neutralize any state the sketch left on ctx.
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.setLineDash([]);
  ctx.textBaseline = 'top';
  ctx.font = '11px ' + mono;

  for (i = 0; i < handleList.length; i++) {
    var hd = handleList[i];
    var hx = hd.x * cam.zoom + cam.x;
    var hy = cam.y - hd.y * cam.zoom;
    var lit = hd === activeHandle || hd === hoveredHandle;
    ctx.beginPath();
    ctx.arc(hx, hy, hd.r * (lit ? 1.25 : 1), 0, Math.PI * 2);
    ctx.fillStyle = lit ? '#ffffff' : '#dfe3ee';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = hd.color;
    ctx.stroke();
  }

  if (hudLines.length) {
    var width = 0;
    for (i = 0; i < hudLines.length; i++) {
      width = Math.max(width, ctx.measureText(hudLines[i]).width);
    }
    overlayBox(12, 12, width + 12, hudLines.length * 15 + 8);
    ctx.fillStyle = '#e6e8f0';
    ctx.textAlign = 'left';
    for (i = 0; i < hudLines.length; i++) {
      ctx.fillText(hudLines[i], 18, 16 + i * 15);
    }
  }

  if (sliders.length) {
    var last = sliderRow(sliders.length - 1);
    overlayBox(window.innerWidth - 12 - SLIDER_W - 20, 12, SLIDER_W + 20, last.y + last.h - 12 + 4);
    for (i = 0; i < sliders.length; i++) {
      var s = sliders[i];
      var r = sliderRow(i);
      if (s.kind === 'toggle') {
        ctx.fillStyle = '#aab0c4';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, r.x, r.y + 2);
        ctx.fillStyle = s.value ? '#5b6cf0' : 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(r.x + SLIDER_W - 14, r.y, 14, 14);
        if (s.value) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(r.x + SLIDER_W - 11, r.y + 7);
          ctx.lineTo(r.x + SLIDER_W - 7, r.y + 11);
          ctx.lineTo(r.x + SLIDER_W - 3, r.y + 3);
          ctx.stroke();
        }
        continue;
      }
      if (s.kind === 'button') {
        ctx.fillStyle = s === pressedButton ? '#7d8bff' : '#5b6cf0';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(r.x, r.y, SLIDER_W, 22, 4);
        else ctx.rect(r.x, r.y, SLIDER_W, 22);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(s.name, r.x + SLIDER_W / 2, r.y + 6);
        continue;
      }
      if (s.kind === 'select') {
        var label = String(s.options[s.value]);
        var maxChars = Math.floor((SLIDER_W - 40) / 6.6);
        if (label.length > maxChars) label = label.slice(0, maxChars - 1) + '\u2026';
        ctx.fillStyle = '#aab0c4';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, r.x, r.y + 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(r.x, r.y + 17, SLIDER_W, 20);
        ctx.fillStyle = '#e6e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(label, r.x + SLIDER_W / 2, r.y + 22);
        ctx.fillStyle = '#aab0c4';
        ctx.textAlign = 'left';
        ctx.fillText('\u2039', r.x + 7, r.y + 22);
        ctx.textAlign = 'right';
        ctx.fillText('\u203a', r.x + SLIDER_W - 7, r.y + 22);
        continue;
      }
      var span = s.max - s.min;
      var t = span ? (s.value - s.min) / span : 0;
      var ty = r.y + 24;
      ctx.fillStyle = '#aab0c4';
      ctx.textAlign = 'left';
      ctx.fillText(s.name, r.x, r.y + 2);
      ctx.fillStyle = '#e6e8f0';
      ctx.textAlign = 'right';
      ctx.fillText(fmtNumber(s.value), r.x + SLIDER_W, r.y + 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fillRect(r.x, ty, SLIDER_W, 4);
      ctx.fillStyle = '#5b6cf0';
      ctx.fillRect(r.x, ty, SLIDER_W * t, 4);
      ctx.fillStyle = '#e6e8f0';
      ctx.beginPath();
      ctx.arc(r.x + SLIDER_W * t, ty + 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  hudLines = [];
}

function report(err) {
  halted = true;
  var message = err && err.message ? err.message : String(err);
  post({ source: 'vexel', type: 'error', message: message });
  if (standalone) {
    console.error(err);
    var box = document.getElementById('err');
    if (box) {
      box.textContent = message;
      box.style.display = 'block';
    }
  }
}

// Calls f(t, dt) every frame, or every interval seconds when interval is given. The first
// call is immediate, and the view moving or a control changing also triggers a call, so
// the canvas is never left blank in between.
function animate(f, interval) {
  fn = f;
  animInterval = interval > 0 ? interval : 0;
  animFirst = true;
  animStart = animLast = performance.now();
}

// Everything the sketch can use as a bare identifier. Math members (sin, PI, ...)
// are included automatically, except those a helper shadows.
var scopeNames = [
  'canvas', 'ctx', 'view', 'mouse', 'frame', 'animate',
  'clear', 'point', 'line', 'points', 'polyline', 'circle', 'rect', 'grid', 'axes',
  'palette', 'hsl', 'rgb', 'text', 'plot', 'slider', 'hud',
  'plotPolar', 'toggle', 'key', 'fit', 'curve', 'px',
  'field', 'heat',
  'hover', 'trail', 'contour',
  'select', 'scatter', 'bars', 'hist', 'log',
  'range', 'linspace', 'bounds', 'normalize', 'lerp',
  'plotParam', 'ellipse', 'arc', 'poly',
  'seed', 'random', 'gauss', 'once',
  'button', 'every', 'drag', 'lockView'
];
var scopeValues = [
  canvas, ctx, view, mouse, frame, animate,
  clear, point, line, points, polyline, circle, rect, grid, axes,
  palette, hsl, rgb, text, plot, slider, hud,
  plotPolar, toggle, key, fit, curve, px,
  field, heat,
  hover, trail, contour,
  select, scatter, bars, hist, log,
  range, linspace, bounds, normalize, lerp,
  plotParam, ellipse, arc, poly,
  seed, random, gauss, once,
  button, every, drag, lockView
];
Object.getOwnPropertyNames(Math).forEach(function (name) {
  // Helpers win over Math members of the same name (log prints; use Math.log for ln, random is seeded; use Math.random for unseeded).
  if (scopeNames.indexOf(name) >= 0) return;
  scopeNames.push(name);
  scopeValues.push(Math[name]);
});

// The sketch runs inside an inner function so its own const/let declarations
// can shadow any of the names above instead of clashing with parameters.
var sketch = null;

function execute() {
  try {
    if (!sketch) {
      sketch = Function.apply(
        null,
        scopeNames.concat('return (function () {\\n' + CODE + '\\n})();')
      );
    }
    hoverTests = [];
    handleList = [];
    seed(DEFAULT_SEED);
    latchClicks();
    sketch.apply(null, scopeValues);
    drawOverlays();
    return true;
  } catch (err) {
    report(err);
    return false;
  }
}

function tick(now) {
  requestAnimationFrame(tick);
  if (halted) return;

  var moved = dirty;
  if (moved) {
    dirty = false;
    // Content drawn under the old camera is stale; start from a clean canvas.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyCamera();
  }

  if (fn) {
    var due = animFirst || moved || !animInterval || now - animLast >= animInterval * 1000;
    if (!due) return;
    animFirst = false;
    var t = (now - animStart) / 1000;
    var dt = (now - animLast) / 1000;
    frame.time = t;
    frame.dt = dt;
    hoverTests.length = 0;
    handleList = [];
    if (dt > 0) frame.fps = frame.fps ? frame.fps * 0.9 + (1 / dt) * 0.1 : 1 / dt;
    latchClicks();
    try {
      fn(t, dt);
      drawOverlays();
    } catch (err) {
      report(err);
    }
    frame.n++;
    animLast = now;
  } else if (moved) {
    // Static sketch: redraw for the new view.
    frame.n++;
    if (execute() && !fn) {
      post({ source: 'vexel', type: 'ok' });
    }
  }
}

window.addEventListener('error', function (e) { report(e.error || e.message); });
window.addEventListener('unhandledrejection', function (e) { report(e.reason); });
window.addEventListener('resize', function () {
  resizeCanvas();
  if (pendingFit) fit(pendingFit[0], pendingFit[1], pendingFit[2], pendingFit[3]);
});

window.addEventListener('message', function (e) {
  var d = e.data;
  if (!d || d.source !== 'vexel') return;

  if (d.type === 'mouse') {
    mouse.x = d.x;
    mouse.y = d.y;
    mouse.down = d.down;
    updateSliders();
  } else if (d.type === 'key') {
    setKey(d.key, d.code, !!d.down);
  } else if (d.type === 'keyreset') {
    clearKeys();
  } else if (d.type === 'sliders') {
    for (var key in d.values) {
      if (typeof d.values[key] === 'number') savedSliders[key] = d.values[key];
    }
  } else if (d.type === 'camera') {
    cam.x = d.x;
    cam.y = d.y;
    cam.zoom = d.zoom;
    dirty = true;
    // Wait for the first camera so the first frame is already correctly framed.
    start();
  }
});

// Runs the sketch for the first time and starts the frame loop.
function start() {
  if (started) return;
  started = true;
  resizeCanvas();
  applyCamera();
  dirty = false;
  if (execute()) post({ source: 'vexel', type: 'ok' });
  requestAnimationFrame(tick);
}

// Exported files have no host app, so they handle their own camera and mouse.
function setupStandalone() {
  cam.zoom = STANDALONE.zoom || 1;
  for (var key in STANDALONE.sliders || {}) savedSliders[key] = STANDALONE.sliders[key];
  cam.x = window.innerWidth / 2;
  cam.y = window.innerHeight / 2;

  var panning = false;
  var last = { x: 0, y: 0 };

  // Pointer position readout (the app has its own next to the preview).
  var readout = document.getElementById('readout');
  var rx = document.getElementById('rx');
  var ry = document.getElementById('ry');
  var cursor = null;

  function updateReadout() {
    if (!readout) return;
    if (!cursor) {
      readout.style.display = 'none';
      return;
    }
    // About one digit more than a screen pixel is worth.
    var digits = Math.min(6, Math.max(0, Math.ceil(Math.log10(cam.zoom)) + 1));
    rx.textContent = 'x ' + ((cursor.x - cam.x) / cam.zoom).toFixed(digits);
    ry.textContent = 'y ' + ((cam.y - cursor.y) / cam.zoom).toFixed(digits);
    readout.style.display = 'flex';
  }

  function toWorld(e) {
    mouse.x = (e.clientX - cam.x) / cam.zoom;
    mouse.y = (cam.y - e.clientY) / cam.zoom;
    cursor = { x: e.clientX, y: e.clientY };
    updateReadout();
  }

  function release() {
    panning = false;
    mouse.down = false;
    updateSliders();
  }

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pinch = e.ctrlKey || e.metaKey;
    // With pan locked, the plain wheel zooms, around the center so the view does not shift.
    var zooming = pinch || viewLock.pan;
    if (zooming ? viewLock.zoom : viewLock.pan) return;
    if (zooming) {
      var z = Math.min(100, Math.max(0.01, cam.zoom * Math.exp(-e.deltaY * (pinch ? 0.01 : 0.002))));
      var ratio = z / cam.zoom;
      var ax = viewLock.pan ? window.innerWidth / 2 : e.clientX;
      var ay = viewLock.pan ? window.innerHeight / 2 : e.clientY;
      cam.x = ax - (ax - cam.x) * ratio;
      cam.y = ay - (ay - cam.y) * ratio;
      cam.zoom = z;
    } else {
      cam.x -= e.deltaX;
      cam.y -= e.deltaY;
    }
    toWorld(e);
    dirty = true;
  }, { passive: false });

  canvas.addEventListener('pointerdown', function (e) {
    canvas.setPointerCapture(e.pointerId);
    if (e.button === 1 || e.button === 2) {
      if (viewLock.pan) return;
      panning = true;
      last.x = e.clientX;
      last.y = e.clientY;
    } else if (e.button === 0) {
      toWorld(e);
      mouse.down = true;
      updateSliders();
    }
  });

  canvas.addEventListener('pointermove', function (e) {
    if (panning) {
      cam.x += e.clientX - last.x;
      cam.y += e.clientY - last.y;
      last.x = e.clientX;
      last.y = e.clientY;
      dirty = true;
    }
    toWorld(e);
    updateSliders();
  });

  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('pointerleave', function () {
    cursor = null;
    updateReadout();
  });

  window.addEventListener('keydown', function (e) { setKey(e.key, e.code, true); });
  window.addEventListener('keyup', function (e) { setKey(e.key, e.code, false); });
  window.addEventListener('blur', clearKeys);

  start();
}

resizeCanvas();
updateView();

// Inside the app, console.log and friends show up in the console panel too.
if (!standalone) {
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var original = console[level];
    console[level] = function () {
      emitLog(level, arguments);
      if (original) original.apply(console, arguments);
    };
  });
}

if (standalone) setupStandalone();
else post({ source: 'vexel', type: 'ready' });
`;

export type PreviewDocOptions = {
	/** Build a self-contained page that handles its own camera and mouse (for export). */
	standalone?: boolean;
	/** Initial zoom for standalone pages. */
	zoom?: number;
	/** Initial slider values for standalone pages, by slider name. */
	sliders?: Record<string, number>;
};

/**
 * Builds the HTML document that runs user code.
 *
 * In the app it runs inside a sandboxed iframe (scripts only, opaque origin), so
 * user code can't touch the host; camera, mouse state and errors travel via
 * postMessage. With `standalone` it is a complete page that works on its own.
 */
export function buildPreviewDoc(code: string, options: PreviewDocOptions = {}): string {
	// Escape "<" so user code can never close the surrounding <script> tag.
	const safeCode = JSON.stringify(code).replace(/</g, '\\u003c');
	const { standalone = false, zoom = 1, sliders = {} } = options;

	// Exported pages carry their own logo, so they need no files next to them.
	const dataUri = (svg: string) => 'data:image/svg+xml,' + encodeURIComponent(svg.trim());

	const head = standalone
		? `<meta name="viewport" content="width=device-width, initial-scale=1">
<title>vexel sketch</title>
<link rel="icon" href="${dataUri(faviconSvg)}">`
		: '';
	const background = standalone ? '#1b1d25' : 'transparent';
	const extraStyle = standalone
		? `
  #err { display: none; position: fixed; left: 0; right: 0; bottom: 0; margin: 0; padding: 8px 12px;
    color: #ffb4b4; background: #3a1d22; font: 12px/1.5 ui-monospace, Menlo, Consolas, monospace;
    white-space: pre-wrap; }
  #readout { display: none; position: fixed; left: 8px; bottom: 8px; gap: 12px; padding: 3px 8px;
    pointer-events: none; color: #d7dae0; background: rgba(21, 23, 30, 0.8); border: 1px solid #2c303c;
    border-radius: 4px; font: 11px/1.3 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums; }
  #brand { position: fixed; right: 8px; bottom: 6px; display: flex; align-items: center; gap: 8px;
    padding: 5px 8px; border-radius: 8px; opacity: 0.65; color: #d7dae0; text-decoration: none;
    font: 600 14px/1 system-ui, -apple-system, 'Segoe UI', sans-serif; letter-spacing: 0.08em;
    text-transform: lowercase; }
  #brand:hover { opacity: 1; background: rgba(255, 255, 255, 0.08); }
  #brand img { display: block; width: 24px; height: 24px; }`
		: '';
	const extraBody = standalone
			? '\n<pre id="err"></pre>\n<div id="readout"><span id="rx"></span><span id="ry"></span></div>' +
				`\n<a id="brand" href="${PROJECT_URL}" target="_blank" rel="noopener noreferrer" title="Made with Vexel"><img src="${dataUri(logoSvg)}" alt=""><span>Vexel</span></a>`
			: '';
	const standaloneVar = standalone ? `<script>var STANDALONE = { zoom: ${Number(zoom) || 1}, sliders: ${JSON.stringify(sliders).replace(/</g, '\\u003c')} };<\/script>\n` : '';

	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
${head}
<style>
  /* Match the host's color scheme so the page background stays transparent. */
  :root { color-scheme: dark; }
  html, body { margin: 0; background: ${background}; overflow: hidden; }
  canvas { display: block; width: 100vw; height: 100vh; }${extraStyle}
</style>
</head>
<body>
<canvas id="c"></canvas>${extraBody}
${standaloneVar}<script>var CODE = ${safeCode};<\/script>
<script>${RUNTIME}<\/script>
</body>
</html>`;
}
