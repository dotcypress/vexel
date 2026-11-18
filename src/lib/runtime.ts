import logoSvg from './assets/logo.svg?raw';
import faviconSvg from './assets/favicon.svg?raw';

export const PROJECT_URL = 'https://github.com/dotcypress/vexel';

export const MIN_ZOOM = 0.0001;
export const MAX_ZOOM = 1000000;

export const DEFAULT_CODE = `// Sunflower: each seed sits one golden angle past the last.
const golden = PI * (3 - sqrt(5))
let spin = 0

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
    point(cos(angle) * radius, sin(angle) * radius, hsl(i * 0.4 + t * 30, 90, 60), size)
  }
})`;

const RUNTIME = `
var canvas = document.getElementById('c');
var ctx = canvas.getContext('2d');
var dpr = window.devicePixelRatio || 1;

var cam = { x: 0, y: 0, zoom: 1 };
var MIN_ZOOM = ${MIN_ZOOM};
var MAX_ZOOM = ${MAX_ZOOM};
var view = {
  x: 0, y: 0, zoom: 1,
  left: 0, top: 0, right: 0, bottom: 0,
  width: 0, height: 0
};
var mouse = { x: 0, y: 0, down: false, clicked: false };
var frame = { n: 0, time: 0, dt: 0, fps: 0 };

var fn = null;
var halted = false;
var started = false;
var dirty = true;
var animStart = 0;
var animLast = 0;
var animInterval = 0;
var animFirst = true;
var standalone = typeof STANDALONE !== 'undefined';

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
  resetStyle();
  dirty = true;
}

var INK = '#e6e8f0';
var defaultLineWidth = 1;

function resetStyle() {
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  defaultLineWidth = 1 / cam.zoom;
  ctx.lineWidth = defaultLineWidth;
}

function followZoom() {
  if (Math.abs(ctx.lineWidth - defaultLineWidth) <= defaultLineWidth * 1e-6) {
    defaultLineWidth = 1 / cam.zoom;
    ctx.lineWidth = defaultLineWidth;
  }
}

function isStyle(v) {
  return (
    v != null && typeof v === 'object' && !Array.isArray(v) &&
    !(v instanceof CanvasGradient) && !(v instanceof CanvasPattern)
  );
}

function applyDash(d) {
  if (Array.isArray(d)) {
    ctx.setLineDash(d.map(function (v) { return v / cam.zoom; }));
  }
}

function useStroke(color, lineWidth) {
  if (isStyle(color)) {
    applyDash(color.dash);
    lineWidth = color.width;
    color = color.color;
  }
  if (color) ctx.strokeStyle = color;
  if (lineWidth != null) ctx.lineWidth = lineWidth;
}

function applyCamera() {
  updateView();
  ctx.setTransform(dpr * cam.zoom, 0, 0, -dpr * cam.zoom, dpr * cam.x, dpr * cam.y);
  followZoom();
}

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

function point(x, y, color, size) {
  if (isStyle(color)) {
    size = color.size;
    color = color.color;
  } else if (typeof color === 'number') {
    var s = color;
    color = size;
    size = s;
  }
  ctx.save();
  if (color) ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, (size == null ? 4 : size) / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function line(x1, y1, x2, y2, color, lineWidth) {
  ctx.save();
  useStroke(color, lineWidth);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function points(list, color, size) {
  if (isStyle(color)) {
    size = color.size;
    color = color.color;
  } else if (typeof color === 'number') {
    var s = color;
    color = size;
    size = s;
  }
  for (var i = 0; i < list.length; i++) {
    point(list[i][0], list[i][1], color, size);
  }
}

function polyline(list, color, lineWidth, closed) {
  if (list.length < 2) return;
  if (isStyle(color)) closed = color.closed;
  ctx.save();
  useStroke(color, lineWidth);
  ctx.beginPath();
  ctx.moveTo(list[0][0], list[0][1]);
  for (var i = 1; i < list.length; i++) ctx.lineTo(list[i][0], list[i][1]);
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function paint(fill, stroke, lineWidth) {
  if (isStyle(fill)) {
    var o = fill;
    applyDash(o.dash);
    lineWidth = o.width;
    stroke = o.stroke;
    fill = o.fill != null ? o.fill : o.stroke != null ? false : undefined;
  }
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
  if (isStyle(fill)) rotation = fill.rotation;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rotation || 0, 0, Math.PI * 2);
  paint(fill, stroke, lineWidth);
  ctx.restore();
}

function arc(x, y, radius, start, end, color, lineWidth) {
  ctx.save();
  useStroke(color, lineWidth);
  ctx.beginPath();
  ctx.arc(x, y, Math.abs(radius), start, end, end < start);
  ctx.stroke();
  ctx.restore();
}

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

function rgb(r, g, b, a) {
  return 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + (a == null ? 1 : a) + ')';
}

function hsl(h, s, l, a) {
  return 'hsla(' + h + ', ' + s + '%, ' + l + '%, ' + (a == null ? 1 : a) + ')';
}

var PALETTE = [
  '#f5b83d', '#509fe4', '#ff6450', '#00ba80',
  '#cb93ff', '#bae98a', '#ff93c6', '#41b4bc',
  '#ff9a3d', '#6b7cff', '#8fe0b0', '#e05ad0',
  '#d9c08c', '#9fb4ff', '#e5484d', '#c9ccd6'
];

function palette(i) {
  var n = PALETTE.length;
  return PALETTE[(((Math.floor(i) || 0) % n) + n) % n];
}

function isMultiple(v, step) {
  var q = v / step;
  return Math.abs(q - Math.round(q)) < 1e-9;
}

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

function tickStep(minPx) {
  for (var p = 1e-6; p < 1e15; p *= 10) {
    var k = [1, 2, 5];
    for (var j = 0; j < k.length; j++) {
      if (k[j] * p * cam.zoom >= minPx) return k[j] * p;
    }
  }
  return 1;
}

function axes(color) {
  var o = isStyle(color) ? color : {};
  if (isStyle(color)) color = o.color;
  ctx.save();
  ctx.strokeStyle = color || 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1 / cam.zoom;
  ctx.beginPath();
  ctx.moveTo(view.left, 0);
  ctx.lineTo(view.right, 0);
  ctx.moveTo(0, view.top);
  ctx.lineTo(0, view.bottom);
  ctx.stroke();

  var w = window.innerWidth;
  var h = window.innerHeight;
  var step = tickStep(70);
  if (o.step > 0) {
    step = o.step;
    while (step * cam.zoom < 40) step *= 2;
  }
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
  ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
  if (o.xLabel != null) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(o.xLabel), w - 8, Math.max(ay - 4, 16));
  }
  if (o.yLabel != null) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(String(o.yLabel), Math.min(ax + 8, w - 60), 8);
  }
  ctx.restore();
}

function curve(x1, y1, cx, cy, x2, y2, color, lineWidth) {
  ctx.save();
  useStroke(color, lineWidth);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
  ctx.restore();
}

function field(f, step, color, lineWidth) {
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
  useStroke(color, lineWidth);
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
RAMPS.vexel = ['#1b1f4b', '#22667a', '#5fa86a', '#f5b83d', '#fff3b0'];
var rampLuts = Object.create(null);

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
  var bytes = new Uint8ClampedArray(256 * 4);
  for (var n = 0; n < 256; n++) {
    var t = (n / 255) * (rgbs.length - 1);
    var i = Math.min(rgbs.length - 2, Math.floor(t));
    var u = t - i;
    var a = rgbs[i];
    var b = rgbs[i + 1];
    var r = Math.round(a[0] + (b[0] - a[0]) * u);
    var g = Math.round(a[1] + (b[1] - a[1]) * u);
    var bl = Math.round(a[2] + (b[2] - a[2]) * u);
    lut.push('rgb(' + r + ', ' + g + ', ' + bl + ')');
    bytes[n * 4] = r;
    bytes[n * 4 + 1] = g;
    bytes[n * 4 + 2] = bl;
    bytes[n * 4 + 3] = 255;
  }
  lut.bytes = bytes;
  rampLuts[name] = lut;
  return lut;
}

var colorBytes = Object.create(null);
var colorProbe = null;

function cssColorBytes(color) {
  if (colorBytes[color]) return colorBytes[color];
  if (!colorProbe) {
    colorProbe = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    colorProbe.canvas.width = colorProbe.canvas.height = 1;
  }
  colorProbe.clearRect(0, 0, 1, 1);
  colorProbe.fillStyle = '#000';
  colorProbe.fillStyle = color;
  colorProbe.fillRect(0, 0, 1, 1);
  return (colorBytes[color] = colorProbe.getImageData(0, 0, 1, 1).data);
}

function heat(f, ramp, cell) {
  var lut = null;
  if (typeof ramp !== 'function') lut = rampLut(ramp == null ? 'viridis' : String(ramp));
  var w = window.innerWidth;
  var h = window.innerHeight;
  var c = cell > 0 ? Math.max(1, Math.round(cell)) : Math.max(8, Math.ceil(Math.sqrt((w * h) / 10000)));
  if (c === 1) {
    heatPixels(f, ramp, lut, w, h);
    return;
  }
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
  var count = Math.ceil((b - a) / step - 1e-9);
  if (!(count > 0)) return [];
  if (count > 1000000) throw new Error('range: too many values (' + count + ')');
  var out = [];
  for (var i = 0; i < count; i++) out.push(Number((a + i * step).toPrecision(15)));
  return out;
}

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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

var onceCache = Object.create(null);

function once(fn, key) {
  if (typeof fn !== 'function') {
    var k = fn;
    fn = key;
    key = k;
  }
  key = key == null ? String(fn) : String(key);
  if (!(key in onceCache)) onceCache[key] = fn();
  return onceCache[key];
}

var DEFAULT_SEED = 1;
var rngState = DEFAULT_SEED;
var currentSeed = DEFAULT_SEED;
var spareGauss = null;

function seed(n) {
  rngState = (Number(n) || 0) >>> 0;
  currentSeed = rngState;
  spareGauss = null;
}

function rand01() {
  rngState = (rngState + 0x6d2b79f5) >>> 0;
  var t = rngState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function random(a, b) {
  var r = rand01();
  if (Array.isArray(a)) return a[Math.floor(r * a.length)];
  if (a == null) return r;
  if (b == null) return r * a;
  return a + (b - a) * r;
}

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

var heatCanvas = null;

function heatPixels(f, ramp, lut, w, h) {
  w = Math.ceil(w);
  h = Math.ceil(h);
  if (!heatCanvas) heatCanvas = document.createElement('canvas');
  if (heatCanvas.width !== w || heatCanvas.height !== h) {
    heatCanvas.width = w;
    heatCanvas.height = h;
  }
  var hctx = heatCanvas.getContext('2d');
  var image = hctx.createImageData(w, h);
  var data = image.data;
  var bytes = lut ? lut.bytes : new Uint8ClampedArray(256 * 4);
  if (!lut) {
    for (var n = 0; n < 256; n++) {
      var color = ramp(n / 255);
      if (color) {
        bytes.set(cssColorBytes(String(color)), n * 4);
      }
    }
  }
  for (var sy = 0; sy < h; sy++) {
    var y = (cam.y - sy - 0.5) / cam.zoom;
    for (var sx = 0; sx < w; sx++) {
      var v = f((sx + 0.5 - cam.x) / cam.zoom, y);
      if (typeof v !== 'number' || !isFinite(v)) continue;
      var k = Math.round((v < 0 ? 0 : v > 1 ? 1 : v) * 255) * 4;
      var o = (sy * w + sx) * 4;
      data[o] = bytes[k];
      data[o + 1] = bytes[k + 1];
      data[o + 2] = bytes[k + 2];
      data[o + 3] = bytes[k + 3];
    }
  }
  hctx.putImageData(image, 0, 0);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(heatCanvas, 0, 0, w, h);
  ctx.restore();
}

function rampFn(ramp) {
  if (typeof ramp === 'function') return ramp;
  var lut = rampLut(ramp == null ? 'viridis' : String(ramp));
  return function (t) {
    return lut[Math.round(t * 255)];
  };
}

function scatter(list, ramp, size) {
  if (typeof ramp === 'number') {
    var s = ramp;
    ramp = size;
    size = s;
  }
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

function bars(list, width, color) {
  width = width > 0 ? width : 10;
  ctx.save();
  for (var i = 0; i < list.length; i++) {
    var v = list[i];
    if (typeof v !== 'number' || !isFinite(v)) continue;
    var c = typeof color === 'function' ? color(i, v) : color;
    if (c) ctx.fillStyle = c;
    ctx.fillRect(i * width + width * 0.1, 0, width * 0.8, v);
  }
  ctx.restore();
}

function hist(list, bins, color) {
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
  if (color) ctx.fillStyle = color;
  for (i = 0; i < n; i++) ctx.fillRect(min + i * bw, 0, bw - gap, counts[i]);
  ctx.restore();
  return counts;
}

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
  useStroke(color, lineWidth);
  ctx.lineCap = 'round';
  ctx.beginPath();
  function seg(ax, ay, bx, by) {
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  for (j = 0; j < ny; j++) {
    for (i = 0; i < nx; i++) {
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

var trails = Object.create(null);

function trail(id, x, y, color, n) {
  var lineWidth;
  if (isStyle(color)) {
    n = color.n;
    lineWidth = color.width;
    color = color.color;
  } else if (typeof color === 'number') {
    var k = color;
    color = n;
    n = k;
  }
  id = String(id);
  n = n > 1 ? Math.min(Math.floor(n), 10000) : 50;
  var pts = trails[id] || (trails[id] = []);
  if (isFinite(x) && isFinite(y)) {
    var last = pts[pts.length - 1];
    if (!last || last[0] !== x || last[1] !== y) pts.push([x, y]);
  }
  if (pts.length > n) pts.splice(0, pts.length - n);
  if (pts.length < 2) return;
  ctx.save();
  useStroke(color, lineWidth);
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

var hoverTests = [];

function hover(x, y, r) {
  var inside = Math.sqrt((mouse.x - x) * (mouse.x - x) + (mouse.y - y) * (mouse.y - y)) <= r;
  hoverTests.push({ x: x, y: y, r: r, inside: inside });
  return inside;
}

function checkHover() {
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

function px(n) {
  return (n == null ? 1 : n) / cam.zoom;
}

var lastFit = '';
var pendingFit = null;
function fit(x, y, w, h) {
  if (!isFinite(x) || !isFinite(y) || !isFinite(w) || !isFinite(h) || !(w > 0) || !(h > 0)) return;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  if (vw < 2 || vh < 2) {
    pendingFit = [x, y, w, h];
    return;
  }
  pendingFit = null;
  var id = [x, y, w, h].join(',');
  if (id === lastFit) return;
  lastFit = id;
  var zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(vw / w, vh / h) * 0.9));
  cam.zoom = zoom;
  cam.x = vw / 2 - (x + w / 2) * zoom;
  cam.y = vh / 2 + (y + h / 2) * zoom;
  applyCamera();
  dirty = true;
  post({ source: 'vexel', type: 'camera', x: cam.x, y: cam.y, zoom: zoom });
}

var viewLock = { pan: false, zoom: false };

function lockView(pan, zoom) {
  pan = pan !== false;
  zoom = zoom !== false;
  if (pan === viewLock.pan && zoom === viewLock.zoom) return;
  viewLock.pan = pan;
  viewLock.zoom = zoom;
  post({ source: 'vexel', type: 'lock', pan: pan, zoom: zoom });
}

function text(str, x, y, color, size, align) {
  if (isStyle(color)) {
    size = color.size;
    align = color.align;
    color = color.color;
  }
  ctx.save();
  if (color) ctx.fillStyle = color;
  ctx.font = (size == null ? 14 : size) + 'px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.translate(x, y);
  ctx.scale(1, -1);
  ctx.fillText(String(str), 0, 0);
  ctx.restore();
}

function plot(f, color, lineWidth, from, to) {
  if (isStyle(color)) {
    from = color.from;
    to = color.to;
  }
  var x0 = Math.max(from == null ? view.left : from, view.left);
  var x1 = Math.min(to == null ? view.right : to, view.right);
  if (!(x1 > x0)) return;
  var n = Math.min(4000, Math.max(2, Math.ceil(((x1 - x0) * cam.zoom) / 2)));
  ctx.save();
  useStroke(color, lineWidth);
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

function plotPolar(f, color, lineWidth) {
  var n = 2000;
  ctx.save();
  useStroke(color, lineWidth);
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

function plotParam(fx, fy, color, lineWidth, from, to) {
  if (typeof color === 'number') {
    var a = [color, lineWidth, from, to];
    from = a[0];
    to = a[1];
    color = a[2];
    lineWidth = a[3];
  } else if (isStyle(color)) {
    from = color.from;
    to = color.to;
  }
  var t0 = from == null ? 0 : from;
  var t1 = to == null ? Math.PI * 2 : to;
  var n = 2000;
  ctx.save();
  useStroke(color, lineWidth);
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
  if (changed) dirty = true;
}

function clearKeys() {
  keys = Object.create(null);
  dirty = true;
}

function key(name) {
  return keys[String(name).toLowerCase()] === true;
}

var sliders = [];
var sliderMap = Object.create(null);
var savedSliders = Object.create(null);
var activeSlider = null;
var prevDown = false;
var hudLines = [];
var SLIDER_W = 180;
var SLIDER_ROW = 36;
var TOGGLE_ROW = 24;
var SELECT_ROW = 44;
var BUTTON_ROW = 30;
var pressedButton = null;

function fmtNumber(v) {
  return String(Number(v.toPrecision(4)));
}

function clampSlider(s, v) {
  if (typeof v !== 'number' || !isFinite(v)) v = s.min;
  if (s.step > 0) v = s.min + Math.round((v - s.min) / s.step) * s.step;
  v = Math.min(Math.max(v, Math.min(s.min, s.max)), Math.max(s.min, s.max));
  return Number(v.toPrecision(12));
}

function slider(name, min, max, value, step) {
  name = String(name);
  min = min == null ? 0 : min;
  max = max == null ? 1 : max;
  var s = sliderMap[name];
  if (s && s.kind !== 'slider') return s.value;
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

function toggle(name, value) {
  name = String(name);
  var s = sliderMap[name];
  if (s && s.kind !== 'toggle') return !!s.value;
  if (!s) {
    s = sliderMap[name] = { kind: 'toggle', name: name, value: 0 };
    sliders.push(s);
    s.value = name in savedSliders ? (savedSliders[name] ? 1 : 0) : value ? 1 : 0;
  }
  return !!s.value;
}

function select(name, options, value) {
  name = String(name);
  if (!Array.isArray(options) || !options.length) {
    throw new Error('select: options must be a non-empty array');
  }
  var s = sliderMap[name];
  if (s && s.kind !== 'select') return options[0];
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

function button(name) {
  name = String(name);
  var s = sliderMap[name];
  if (s && s.kind !== 'button') return false;
  if (!s) {
    s = sliderMap[name] = { kind: 'button', name: name, value: 0, pending: false, fired: false };
    sliders.push(s);
  }
  return s.fired;
}

var DRAG_KEY = '@drag:';
var handles = Object.create(null);
var handleList = [];
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

function handleAt(sx, sy) {
  for (var i = handleList.length - 1; i >= 0; i--) {
    var h = handleList[i];
    var dx = h.x * cam.zoom + cam.x - sx;
    var dy = cam.y - h.y * cam.zoom - sy;
    if (dx * dx + dy * dy <= (h.r + 4) * (h.r + 4)) return h;
  }
  return null;
}

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
  if (tm.n === frame.n) return tm.fired;
  tm.n = frame.n;
  tm.fired = now >= tm.next;
  if (tm.fired) {
    tm.next += seconds;
    if (tm.next <= now) tm.next = now + seconds;
    if (fn) fn();
  }
  return tm.fired;
}

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

function log() {
  if (standalone) console.log.apply(console, arguments);
  else emitLog('log', arguments);
}

function controlHeight(c) {
  if (c.kind === 'toggle') return TOGGLE_ROW;
  if (c.kind === 'button') return BUTTON_ROW;
  if (c.kind === 'pad') return PAD_ROW;
  if (c.kind === 'swatch') return SWATCH_ROW;
  if (c.kind === 'number') return NUMBER_ROW;
  return c.kind === 'select' ? SELECT_ROW : SLIDER_ROW;
}

function sliderRow(i) {
  var y = 22;
  for (var j = 0; j < i; j++) y += controlHeight(sliders[j]);
  return { x: window.innerWidth - 12 - SLIDER_W - 10, y: y, h: controlHeight(sliders[i]) };
}

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
        } else if (sliders[i].kind === 'number') {
          var ns = sliders[i];
          var rel = sx - r.x;
          if (rel < 28 || rel > SLIDER_W - 28) {
            var nv = Number(clamp(ns.value + (rel < 28 ? -ns.step : ns.step), ns.min, ns.max).toPrecision(12));
            if (nv !== ns.value) {
              ns.value = nv;
              dirty = true;
              post({ source: 'vexel', type: 'slider', name: ns.name, value: nv });
            }
          } else {
            ns.dragX = sx;
            ns.dragV = ns.value;
            activeSlider = ns;
          }
        } else if (sliders[i].kind === 'swatch') {
          var col = Math.floor((sx - r.x) / (SLIDER_W / 8));
          var srow = Math.floor((sy - r.y - 18) / 16);
          if (col >= 0 && col < 8 && srow >= 0 && srow < 2) {
            sliders[i].value = srow * 8 + col;
            dirty = true;
            post({ source: 'vexel', type: 'slider', name: sliders[i].name, value: sliders[i].value });
          }
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
  if (activeSlider.kind === 'number') {
    var nm = activeSlider;
    var scrub = Math.round((sx - nm.dragX) / 6) * nm.step;
    var nval = Number(clamp(nm.dragV + scrub, nm.min, nm.max).toPrecision(12));
    if (nval !== nm.value) {
      nm.value = nval;
      dirty = true;
      post({ source: 'vexel', type: 'slider', name: nm.name, value: nval });
    }
    return;
  }
  if (activeSlider.kind === 'pad') {
    var pd = activeSlider;
    var fx = clamp((sx - row.x) / SLIDER_W, 0, 1);
    var fy = clamp(1 - (sy - row.y - 18) / PAD_H, 0, 1);
    var nvx = Number((pd.min + fx * (pd.max - pd.min)).toPrecision(12));
    var nvy = Number((pd.min + fy * (pd.max - pd.min)).toPrecision(12));
    if (nvx !== pd.vx || nvy !== pd.vy) {
      pd.vx = nvx;
      pd.vy = nvy;
      dirty = true;
      post({ source: 'vexel', type: 'slider', name: pd.name + ':x', value: nvx });
      post({ source: 'vexel', type: 'slider', name: pd.name + ':y', value: nvy });
    }
    return;
  }
  var t = Math.min(1, Math.max(0, (sx - row.x) / SLIDER_W));
  var v = clampSlider(activeSlider, activeSlider.min + t * (activeSlider.max - activeSlider.min));
  if (v !== activeSlider.value) {
    activeSlider.value = v;
    dirty = true;
    post({ source: 'vexel', type: 'slider', name: activeSlider.name, value: v });
  }
}

var ACCENT = '#f5b83d';
var ACCENT_LIGHT = '#ffd27a';
var ON_ACCENT = '#15171e';

function overlayBox(x, y, w, h) {
  ctx.fillStyle = 'rgba(21, 23, 30, 0.88)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, 6);
  else ctx.rect(x, y, w, h);
  ctx.fill();
}

function drawOverlays() {
  if (!sliders.length && !hudLines.length && !handleList.length && !legends.length && !colorbars.length) return;
  var mono = 'ui-monospace, Menlo, Consolas, monospace';
  var i;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

  var leftY = 12;
  if (hudLines.length) {
    var width = 0;
    for (i = 0; i < hudLines.length; i++) {
      width = Math.max(width, ctx.measureText(hudLines[i]).width);
    }
    overlayBox(12, 12, width + 12, hudLines.length * 15 + 8);
    ctx.fillStyle = '#e6e8f0';
    ctx.textAlign = 'left';
    for (i = 0; i < hudLines.length; i++) {
      ctx.fillText(hudLines[i], 18, 18 + i * 15);
    }
    leftY += hudLines.length * 15 + 8 + 8;
  }

  for (i = 0; i < legends.length; i++) {
    var lg = legends[i];
    var lw = lg.title ? ctx.measureText(lg.title).width : 0;
    for (var li = 0; li < lg.rows.length; li++) {
      lw = Math.max(lw, ctx.measureText(lg.rows[li][0]).width + 18);
    }
    var top = lg.title ? 18 : 0;
    var lh = top + lg.rows.length * 16 + 8;
    overlayBox(12, leftY, lw + 12, lh);
    ctx.textAlign = 'left';
    if (lg.title) {
      ctx.fillStyle = '#aab0c4';
      ctx.fillText(lg.title, 18, leftY + 6);
    }
    for (li = 0; li < lg.rows.length; li++) {
      var ly = leftY + 4 + top + li * 16;
      ctx.fillStyle = lg.rows[li][1] || INK;
      ctx.fillRect(18, ly + 2, 10, 10);
      ctx.fillStyle = '#e6e8f0';
      ctx.fillText(lg.rows[li][0], 36, ly + 2);
    }
    leftY += lh + 8;
  }

  for (i = 0; i < colorbars.length; i++) {
    var cb = colorbars[i];
    var ctop = cb.title ? 18 : 4;
    var ch = ctop + 12 + 18;
    overlayBox(12, leftY, 172, ch);
    ctx.textAlign = 'left';
    if (cb.title) {
      ctx.fillStyle = '#aab0c4';
      ctx.fillText(cb.title, 18, leftY + 6);
    }
    for (var ci = 0; ci < 80; ci++) {
      ctx.fillStyle = cb.fn(ci / 79) || 'transparent';
      ctx.fillRect(18 + ci * 2, leftY + ctop, 2.5, 12);
    }
    ctx.fillStyle = '#e6e8f0';
    ctx.fillText(fmtNumber(cb.min), 18, leftY + ctop + 16);
    ctx.textAlign = 'right';
    ctx.fillText(fmtNumber(cb.max), 178, leftY + ctop + 16);
    leftY += ch + 8;
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
        ctx.fillStyle = s.value ? ACCENT : 'rgba(255, 255, 255, 0.18)';
        ctx.fillRect(r.x + SLIDER_W - 14, r.y, 14, 14);
        if (s.value) {
          ctx.strokeStyle = ON_ACCENT;
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
        ctx.fillStyle = s === pressedButton ? ACCENT_LIGHT : ACCENT;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(r.x, r.y, SLIDER_W, 22, 4);
        else ctx.rect(r.x, r.y, SLIDER_W, 22);
        ctx.fill();
        ctx.fillStyle = ON_ACCENT;
        ctx.textAlign = 'center';
        ctx.fillText(s.name, r.x + SLIDER_W / 2, r.y + 6);
        continue;
      }
      if (s.kind === 'pad') {
        var pspan = s.max - s.min;
        var px0 = r.x + SLIDER_W * (pspan ? (s.vx - s.min) / pspan : 0.5);
        var py0 = r.y + 18 + PAD_H * (1 - (pspan ? (s.vy - s.min) / pspan : 0.5));
        ctx.fillStyle = '#aab0c4';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, r.x, r.y + 2);
        ctx.fillStyle = '#e6e8f0';
        ctx.textAlign = 'right';
        ctx.fillText(fmtNumber(s.vx) + ', ' + fmtNumber(s.vy), r.x + SLIDER_W, r.y + 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(r.x, r.y + 18, SLIDER_W, PAD_H);
        ctx.strokeStyle = 'rgba(245, 184, 61, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px0, r.y + 18);
        ctx.lineTo(px0, r.y + 18 + PAD_H);
        ctx.moveTo(r.x, py0);
        ctx.lineTo(r.x + SLIDER_W, py0);
        ctx.stroke();
        ctx.fillStyle = '#e6e8f0';
        ctx.beginPath();
        ctx.arc(px0, py0, 6, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      if (s.kind === 'number') {
        ctx.fillStyle = '#aab0c4';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, r.x, r.y + 2);
        ctx.fillStyle = s === activeSlider ? 'rgba(245, 184, 61, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(r.x, r.y + 17, SLIDER_W, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(r.x, r.y + 17, 24, 20);
        ctx.fillRect(r.x + SLIDER_W - 24, r.y + 17, 24, 20);
        ctx.fillStyle = '#e6e8f0';
        ctx.textAlign = 'center';
        ctx.fillText(fmtNumber(s.value), r.x + SLIDER_W / 2, r.y + 22);
        ctx.fillStyle = '#aab0c4';
        ctx.fillText('-', r.x + 12, r.y + 22);
        ctx.fillText('+', r.x + SLIDER_W - 12, r.y + 22);
        continue;
      }
      if (s.kind === 'swatch') {
        ctx.fillStyle = '#aab0c4';
        ctx.textAlign = 'left';
        ctx.fillText(s.name, r.x, r.y + 2);
        var sw = SLIDER_W / 8;
        for (var k = 0; k < 16; k++) {
          var kx = r.x + (k % 8) * sw;
          var ky = r.y + 18 + Math.floor(k / 8) * 16;
          ctx.fillStyle = palette(k);
          ctx.fillRect(kx + 1, ky + 1, sw - 2, 14);
          if (k === s.value) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(kx + 1, ky + 1, sw - 2, 14);
          }
        }
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
      ctx.fillStyle = ACCENT;
      ctx.fillRect(r.x, ty, SLIDER_W * t, 4);
      ctx.fillStyle = '#e6e8f0';
      ctx.beginPath();
      ctx.arc(r.x + SLIDER_W * t, ty + 2, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
  hudLines = [];
  legends = [];
  colorbars = [];
}

function arrow(x1, y1, x2, y2, color, lineWidth, head) {
  if (isStyle(color)) head = color.head;
  var dx = x2 - x1;
  var dy = y2 - y1;
  var len = Math.sqrt(dx * dx + dy * dy);
  if (!(len > 0)) return;
  var h = Math.min(px(head > 0 ? head : 8), len * 0.5);
  var a = Math.atan2(dy, dx);
  ctx.save();
  useStroke(color, lineWidth);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - h * 0.8 * Math.cos(a), y2 - h * 0.8 * Math.sin(a));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - h * Math.cos(a - 0.4), y2 - h * Math.sin(a - 0.4));
  ctx.lineTo(x2 - h * Math.cos(a + 0.4), y2 - h * Math.sin(a + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function bezier(x1, y1, c1x, c1y, c2x, c2y, x2, y2, color, lineWidth) {
  ctx.save();
  useStroke(color, lineWidth);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.bezierCurveTo(c1x, c1y, c2x, c2y, x2, y2);
  ctx.stroke();
  ctx.restore();
}

function spline(list, color, lineWidth, closed) {
  if (!list || list.length < 2) return;
  if (isStyle(color)) closed = color.closed;
  var n = list.length;
  function at(i) {
    if (closed) return list[((i % n) + n) % n];
    return list[Math.max(0, Math.min(n - 1, i))];
  }
  ctx.save();
  useStroke(color, lineWidth);
  ctx.beginPath();
  ctx.moveTo(list[0][0], list[0][1]);
  var last = closed ? n : n - 1;
  for (var i = 0; i < last; i++) {
    var p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    ctx.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
      p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
      p2[0], p2[1]
    );
  }
  if (closed) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function wedge(x, y, radius, start, end, fill, stroke, lineWidth) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, Math.abs(radius), start, end, end < start);
  ctx.closePath();
  paint(fill, stroke, lineWidth);
  ctx.restore();
}

function label(str, x, y, color, size, align) {
  if (isStyle(color)) {
    size = color.size;
    align = color.align;
    color = color.color;
  }
  var sx = x * cam.zoom + cam.x;
  var sy = cam.y - y * cam.zoom;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (color) ctx.fillStyle = color;
  ctx.font = (size == null ? 12 : size) + 'px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(str), sx, sy);
  ctx.restore();
}

var images = Object.create(null);

function image(src, x, y, w, h) {
  src = String(src);
  var im = images[src];
  if (!im) {
    im = images[src] = { el: new Image(), ready: false };
    im.el.onload = function () {
      im.ready = true;
      dirty = true;
    };
    im.el.onerror = function () {
      emitLog('warn', ['image: could not load ' + src]);
    };
    im.el.src = src;
  }
  if (!im.ready) return false;
  var iw = im.el.naturalWidth;
  var ih = im.el.naturalHeight;
  if (w == null) {
    w = iw;
    h = ih;
  } else if (h == null) {
    h = (w * ih) / iw;
  }
  ctx.save();
  ctx.translate(x, y + h);
  ctx.scale(1, -1);
  ctx.drawImage(im.el, 0, 0, w, h);
  ctx.restore();
  return true;
}

function transform(f, o) {
  o = o || {};
  ctx.save();
  try {
    ctx.translate(o.x || 0, o.y || 0);
    if (o.rotate) ctx.rotate(o.rotate);
    if (o.scale != null) {
      if (Array.isArray(o.scale)) ctx.scale(o.scale[0], o.scale[1]);
      else ctx.scale(o.scale, o.scale);
    }
    return f();
  } finally {
    ctx.restore();
  }
}

function add(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
function sub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
function scale(v, k) { return [v[0] * k, v[1] * k]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
function len(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
function dist(a, b, c, d) {
  if (typeof a === 'number') return Math.sqrt((c - a) * (c - a) + (d - b) * (d - b));
  return len(sub(b, a));
}
function norm(v) {
  var l = len(v);
  return l > 0 ? [v[0] / l, v[1] / l] : [0, 0];
}
function rot(v, a, around) {
  var ox = around ? around[0] : 0;
  var oy = around ? around[1] : 0;
  var x = v[0] - ox;
  var y = v[1] - oy;
  var c = Math.cos(a);
  var s = Math.sin(a);
  return [ox + x * c - y * s, oy + x * s + y * c];
}
function angle(v) { return Math.atan2(v[1], v[0]); }
function polar(r, theta) { return [r * Math.cos(theta), r * Math.sin(theta)]; }

function intersect(a1, a2, b1, b2) {
  var rx = a2[0] - a1[0], ry = a2[1] - a1[1];
  var sx = b2[0] - b1[0], sy = b2[1] - b1[1];
  var d = rx * sy - ry * sx;
  if (d === 0) return null;
  var qx = b1[0] - a1[0], qy = b1[1] - a1[1];
  var t = (qx * sy - qy * sx) / d;
  var u = (qx * ry - qy * rx) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [a1[0] + t * rx, a1[1] + t * ry];
}

function clamp(x, lo, hi) {
  lo = lo == null ? 0 : lo;
  hi = hi == null ? 1 : hi;
  return x < lo ? lo : x > hi ? hi : x;
}

function map(x, a1, b1, a2, b2) {
  if (a2 == null) a2 = 0;
  if (b2 == null) b2 = 1;
  return b1 === a1 ? a2 : a2 + ((x - a1) / (b1 - a1)) * (b2 - a2);
}

function smoothstep(a, b, x) {
  var t = clamp(b === a ? (x < a ? 0 : 1) : (x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function ease(t, kind) {
  t = clamp(t, 0, 1);
  switch (kind == null ? 'inOut' : kind) {
    case 'linear': return t;
    case 'in': return t * t * t;
    case 'out': return 1 - Math.pow(1 - t, 3);
    case 'inOut': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    case 'sine': return (1 - Math.cos(Math.PI * t)) / 2;
    case 'back': {
      var c = 1.70158;
      return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    }
    case 'elastic':
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    case 'bounce': {
      var n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    }
  }
  throw new Error("ease: unknown kind '" + kind + "' (use linear, in, out, inOut, sine, back, elastic or bounce)");
}

var noisePerm = null;
var noisePermSeed = null;

function buildNoise() {
  var p = [];
  var i;
  for (i = 0; i < 256; i++) p[i] = i;
  var s = (currentSeed ^ 0x9e3779b9) >>> 0;
  for (i = 255; i > 0; i--) {
    s = (s + 0x6d2b79f5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    var j = Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * (i + 1));
    var tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  noisePerm = new Uint8Array(512);
  for (i = 0; i < 512; i++) noisePerm[i] = p[i & 255];
  noisePermSeed = currentSeed;
}

function nfade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function nmix(t, a, b) { return a + t * (b - a); }
function ngrad(h, x, y, z) {
  h &= 15;
  var u = h < 8 ? x : y;
  var v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}

function noise(x, y, z) {
  if (noisePermSeed !== currentSeed) buildNoise();
  x = Number(x) || 0;
  y = Number(y) || 0;
  z = Number(z) || 0;
  var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  x -= X; y -= Y; z -= Z;
  X &= 255; Y &= 255; Z &= 255;
  var u = nfade(x), v = nfade(y), w = nfade(z);
  var P = noisePerm;
  var A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z;
  var B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
  var r = nmix(w,
    nmix(v,
      nmix(u, ngrad(P[AA], x, y, z), ngrad(P[BA], x - 1, y, z)),
      nmix(u, ngrad(P[AB], x, y - 1, z), ngrad(P[BB], x - 1, y - 1, z))),
    nmix(v,
      nmix(u, ngrad(P[AA + 1], x, y, z - 1), ngrad(P[BA + 1], x - 1, y, z - 1)),
      nmix(u, ngrad(P[AB + 1], x, y - 1, z - 1), ngrad(P[BB + 1], x - 1, y - 1, z - 1))));
  return clamp(0.5 + r * 0.5, 0, 1);
}

function rgbaString(r, g, b, a) {
  return 'rgba(' + Math.round(r) + ', ' + Math.round(g) + ', ' + Math.round(b) + ', ' + Number(a.toFixed(3)) + ')';
}

function mix(c1, c2, t) {
  var a = cssColorBytes(String(c1));
  var b = cssColorBytes(String(c2));
  t = clamp(t == null ? 0.5 : t, 0, 1);
  return rgbaString(
    a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t,
    (a[3] + (b[3] - a[3]) * t) / 255
  );
}

function alpha(color, a) {
  var c = cssColorBytes(String(color));
  return rgbaString(c[0], c[1], c[2], (c[3] / 255) * clamp(a, 0, 1));
}

function ramp(name, t) {
  return rampFn(name)(clamp(t, 0, 1));
}

var paused = false;
var stepOnce = false;
var pausedAt = 0;

function pause(on) {
  var next = on == null ? !paused : !!on;
  if (next !== paused) {
    var now = performance.now();
    paused = next;
    if (paused) {
      pausedAt = now;
    } else {
      animStart += now - pausedAt;
      animLast += now - pausedAt;
    }
  }
  return paused;
}

function step() {
  if (!paused) return;
  pausedAt += 1000 / 60;
  stepOnce = true;
}

var legends = [];
var colorbars = [];

function legend(entries, title) {
  var rows = [];
  if (Array.isArray(entries)) {
    for (var i = 0; i < entries.length; i++) rows.push([String(entries[i][0]), entries[i][1]]);
  } else if (entries) {
    for (var k in entries) rows.push([k, entries[k]]);
  }
  legends.push({ title: title == null ? null : String(title), rows: rows });
}

function colorbar(r, min, max, title) {
  colorbars.push({
    fn: rampFn(r),
    min: min == null ? 0 : min,
    max: max == null ? 1 : max,
    title: title == null ? null : String(title)
  });
}

var PAD_H = 100;
var PAD_ROW = 18 + PAD_H + 10;

function slider2d(name, min, max, value) {
  name = String(name);
  min = min == null ? -1 : min;
  max = max == null ? 1 : max;
  var s = sliderMap[name];
  if (s && s.kind !== 'pad') return [min, min];
  if (!s) {
    var mid = (min + max) / 2;
    var vx = value ? value[0] : mid;
    var vy = value ? value[1] : mid;
    if (name + ':x' in savedSliders) vx = savedSliders[name + ':x'];
    if (name + ':y' in savedSliders) vy = savedSliders[name + ':y'];
    s = sliderMap[name] = { kind: 'pad', name: name, vx: vx, vy: vy, value: 0 };
    sliders.push(s);
  }
  s.min = min;
  s.max = max;
  var lo = Math.min(min, max);
  var hi = Math.max(min, max);
  s.vx = clamp(Number(s.vx) || 0, lo, hi);
  s.vy = clamp(Number(s.vy) || 0, lo, hi);
  return [s.vx, s.vy];
}

var SWATCH_ROW = 18 + 2 * 16 + 8;

function swatch(name, value) {
  name = String(name);
  var s = sliderMap[name];
  if (s && s.kind !== 'swatch') return palette(0);
  if (!s) {
    var start = typeof value === 'number' ? value : Math.max(0, PALETTE.indexOf(value));
    if (name in savedSliders) start = savedSliders[name];
    s = sliderMap[name] = { kind: 'swatch', name: name, value: 0 };
    sliders.push(s);
    var n = PALETTE.length;
    s.value = (((Math.floor(start) || 0) % n) + n) % n;
  }
  return palette(s.value);
}

function textBox(str, x, y, color, size, align) {
  var background = 'rgba(21, 23, 30, 0.88)';
  if (isStyle(color)) {
    size = color.size;
    align = color.align;
    if (color.background) background = color.background;
    color = color.color;
  }
  size = size == null ? 12 : size;
  var lines = String(str).split('\\n');
  var pad = 6;
  var lh = Math.round(size * 1.3);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = size + 'px ui-sans-serif, system-ui, sans-serif';
  var w = 0;
  for (var i = 0; i < lines.length; i++) w = Math.max(w, ctx.measureText(lines[i]).width);
  var bw = w + 2 * pad;
  var bh = lines.length * lh + 2 * pad - (lh - size);
  var sx = x * cam.zoom + cam.x;
  var sy = cam.y - y * cam.zoom;
  if (align === 'center') sx -= bw / 2;
  else if (align === 'right') sx -= bw;
  ctx.fillStyle = background;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx, sy, bw, bh, 4);
  else ctx.rect(sx, sy, bw, bh);
  ctx.fill();
  ctx.fillStyle = color || INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], sx + pad, sy + pad + i * lh);
  ctx.restore();
}

function dims(x1, y1, x2, y2, text, color, offset) {
  if (isStyle(text)) {
    color = text.color;
    offset = text.offset;
    text = text.text;
  }
  var dx = x2 - x1;
  var dy = y2 - y1;
  var l = Math.sqrt(dx * dx + dy * dy);
  if (!(l > 0)) return;
  color = color || 'rgba(255, 255, 255, 0.8)';
  var off = px(offset == null ? 16 : offset);
  var nx = -dy / l;
  var ny = dx / l;
  var ax = x1 + nx * off, ay = y1 + ny * off;
  var bx = x2 + nx * off, by = y2 + ny * off;
  var gap = px(3) * (off < 0 ? -1 : 1);
  var over = px(4) * (off < 0 ? -1 : 1);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = px(1);
  ctx.beginPath();
  ctx.moveTo(x1 + nx * gap, y1 + ny * gap);
  ctx.lineTo(ax + nx * over, ay + ny * over);
  ctx.moveTo(x2 + nx * gap, y2 + ny * gap);
  ctx.lineTo(bx + nx * over, by + ny * over);
  ctx.stroke();
  ctx.restore();
  arrow((ax + bx) / 2, (ay + by) / 2, ax, ay, color, px(1), 7);
  arrow((ax + bx) / 2, (ay + by) / 2, bx, by, color, px(1), 7);
  var str = text == null ? fmtNumber(l) : String(text);
  var lx = (ax + bx) / 2 + nx * px(10) * (off < 0 ? -1 : 1);
  var ly = (ay + by) / 2 + ny * px(10) * (off < 0 ? -1 : 1);
  label(str, lx, ly, color, 11, 'center');
}

function grid2d(cols, rows, f) {
  var out = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) out.push(f(c, r, r * cols + c));
  }
  return out;
}

var pendingShot = null;

function screenshot(name) {
  pendingShot = String(name == null ? 'vexel-sketch' : name).replace(/[^a-zA-Z0-9 _.-]+/g, '_');
  if (!/[.]png$/i.test(pendingShot)) pendingShot += '.png';
}

function drawLogo(c, cx, cy, size) {
  var golden = Math.PI * (3 - Math.sqrt(5));
  var s = size / 128;
  for (var i = 0; i < 21; i++) {
    var k = Math.sqrt((i + 0.5) / 21);
    var a = i * golden - Math.PI / 2;
    c.fillStyle = i % 5 === 3 ? '#ff5c4d' : '#f5b83d';
    c.beginPath();
    c.arc(cx + 49 * k * s * Math.cos(a), cy + 49 * k * s * Math.sin(a), (5 + 4 * k) * s, 0, Math.PI * 2);
    c.fill();
  }
}

function brandedPng() {
  var out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  var c = out.getContext('2d');
  c.fillStyle = '#1b1d25';
  c.fillRect(0, 0, out.width, out.height);
  c.drawImage(canvas, 0, 0);
  c.scale(dpr, dpr);
  var w = out.width / dpr;
  var h = out.height / dpr;
  c.font = '600 11px system-ui, -apple-system, sans-serif';
  var bw = 5 + 14 + 5 + c.measureText('vexel').width + 6;
  var bh = 22;
  var bx = w - bw - 4;
  var by = h - bh - 4;
  c.fillStyle = 'rgba(21, 23, 30, 0.8)';
  c.beginPath();
  if (c.roundRect) c.roundRect(bx, by, bw, bh, 5);
  else c.rect(bx, by, bw, bh);
  c.fill();
  drawLogo(c, bx + 5 + 7, by + bh / 2, 14);
  c.fillStyle = '#d7dae0';
  c.textBaseline = 'middle';
  c.fillText('vexel', bx + 5 + 14 + 5, by + bh / 2 + 0.5);
  return out.toDataURL('image/png');
}

function takeScreenshot() {
  if (!pendingShot) return;
  var name = pendingShot;
  pendingShot = null;
  var url = brandedPng();
  if (standalone) {
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    post({ source: 'vexel', type: 'screenshot', name: name, url: url });
  }
}

var NUMBER_ROW = 44;

function number(name, value, step, min, max) {
  name = String(name);
  var s = sliderMap[name];
  if (s && s.kind !== 'number') return Number(value) || 0;
  if (!s) {
    s = sliderMap[name] = { kind: 'number', name: name, value: 0 };
    sliders.push(s);
    s.value = name in savedSliders ? savedSliders[name] : Number(value) || 0;
  }
  s.step = step > 0 ? step : 1;
  s.min = min == null ? -Infinity : min;
  s.max = max == null ? Infinity : max;
  s.value = Number(clamp(s.value, s.min, s.max).toPrecision(12));
  return s.value;
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

function animate(f, interval) {
  fn = f;
  animInterval = interval > 0 ? interval : 0;
  animFirst = true;
  animStart = animLast = performance.now();
}

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
  'button', 'every', 'drag', 'lockView',
  'arrow', 'bezier', 'spline', 'wedge', 'label', 'image', 'transform',
  'add', 'sub', 'scale', 'dot', 'len', 'dist', 'norm', 'rot', 'angle', 'polar', 'intersect',
  'clamp', 'map', 'smoothstep', 'ease', 'noise',
  'mix', 'alpha', 'ramp', 'legend', 'colorbar', 'pause', 'step', 'slider2d', 'swatch',
  'textBox', 'dims', 'grid2d', 'screenshot', 'number'
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
  button, every, drag, lockView,
  arrow, bezier, spline, wedge, label, image, transform,
  add, sub, scale, dot, len, dist, norm, rot, angle, polar, intersect,
  clamp, map, smoothstep, ease, noise,
  mix, alpha, ramp, legend, colorbar, pause, step, slider2d, swatch,
  textBox, dims, grid2d, screenshot, number
];
Object.getOwnPropertyNames(Math).forEach(function (name) {
  if (scopeNames.indexOf(name) >= 0) return;
  scopeNames.push(name);
  scopeValues.push(Math[name]);
});

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
    resetStyle();
    sketch.apply(null, scopeValues);
    takeScreenshot();
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyCamera();
  }

  if (fn) {
    var clock = paused ? pausedAt : now;
    var due = animFirst || moved || stepOnce ||
      (!paused && (!animInterval || now - animLast >= animInterval * 1000));
    if (!due) return;
    animFirst = false;
    stepOnce = false;
    var t = (clock - animStart) / 1000;
    var dt = (clock - animLast) / 1000;
    frame.time = t;
    frame.dt = dt;
    hoverTests.length = 0;
    handleList = [];
    if (dt > 0) frame.fps = frame.fps ? frame.fps * 0.9 + (1 / dt) * 0.1 : 1 / dt;
    latchClicks();
    try {
      fn(t, dt);
      takeScreenshot();
      drawOverlays();
    } catch (err) {
      report(err);
    }
    frame.n++;
    animLast = clock;
  } else if (moved) {
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
  } else if (d.type === 'screenshot') {
    screenshot(d.name);
    dirty = true;
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
    start();
  }
});

function start() {
  if (started) return;
  started = true;
  resizeCanvas();
  applyCamera();
  dirty = false;
  if (execute()) post({ source: 'vexel', type: 'ok' });
  requestAnimationFrame(tick);
}

function setupStandalone() {
  cam.zoom = STANDALONE.zoom || 1;
  for (var key in STANDALONE.sliders || {}) savedSliders[key] = STANDALONE.sliders[key];
  cam.x = window.innerWidth / 2;
  cam.y = window.innerHeight / 2;

  var panning = false;
  var last = { x: 0, y: 0 };

  var selecting = null;
  var selectionBox = document.createElement('div');
  selectionBox.id = 'selection';
  document.body.appendChild(selectionBox);

  function selectionRect() {
    return {
      left: Math.min(selecting.x0, selecting.x1),
      top: Math.min(selecting.y0, selecting.y1),
      width: Math.abs(selecting.x1 - selecting.x0),
      height: Math.abs(selecting.y1 - selecting.y0)
    };
  }

  function showSelection() {
    if (!selecting) {
      selectionBox.style.display = 'none';
      return;
    }
    var r = selectionRect();
    selectionBox.style.display = 'block';
    selectionBox.style.left = r.left + 'px';
    selectionBox.style.top = r.top + 'px';
    selectionBox.style.width = r.width + 'px';
    selectionBox.style.height = r.height + 'px';
  }

  function zoomAround(z, sx, sy) {
    z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
    var ratio = z / cam.zoom;
    cam.x = sx - (sx - cam.x) * ratio;
    cam.y = sy - (sy - cam.y) * ratio;
    cam.zoom = z;
    dirty = true;
  }

  function zoomToSelection() {
    var r = selectionRect();
    if (r.width < 5 || r.height < 5) {
      zoomAround(cam.zoom / 2, r.left, r.top);
      return;
    }
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var worldX = (r.left + r.width / 2 - cam.x) / cam.zoom;
    var worldY = (cam.y - (r.top + r.height / 2)) / cam.zoom;
    cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom * Math.min(vw / r.width, vh / r.height)));
    cam.x = vw / 2 - worldX * cam.zoom;
    cam.y = vh / 2 + worldY * cam.zoom;
    dirty = true;
  }

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
    var digits = Math.min(10, Math.max(0, Math.ceil(Math.log10(cam.zoom)) + 1));
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
    if (selecting) {
      zoomToSelection();
      selecting = null;
      showSelection();
      return;
    }
    panning = false;
    mouse.down = false;
    updateSliders();
  }

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var pinch = e.ctrlKey || e.metaKey;
    var zooming = pinch || viewLock.pan;
    if (zooming ? viewLock.zoom : viewLock.pan) return;
    if (zooming) {
      var z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cam.zoom * Math.exp(-e.deltaY * (pinch ? 0.01 : 0.002))));
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
    if (e.button === 0 && e.altKey) {
      e.preventDefault();
      if (!viewLock.pan && !viewLock.zoom) {
        selecting = { x0: e.clientX, y0: e.clientY, x1: e.clientX, y1: e.clientY };
        showSelection();
      }
      return;
    }
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
    if (selecting) {
      selecting.x1 = e.clientX;
      selecting.y1 = e.clientY;
      showSelection();
    } else if (panning) {
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

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && selecting) {
      selecting = null;
      showSelection();
      return;
    }
    setKey(e.key, e.code, true);
  });
  window.addEventListener('keyup', function (e) { setKey(e.key, e.code, false); });
  window.addEventListener('blur', clearKeys);

  start();
}

resizeCanvas();
updateView();

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
  standalone?: boolean;
  zoom?: number;
  sliders?: Record<string, number>;
};

export function buildPreviewDoc(code: string, options: PreviewDocOptions = {}): string {
  const safeCode = JSON.stringify(code).replace(/</g, '\\u003c');
  const { standalone = false, zoom = 1, sliders = {} } = options;

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
  #selection { display: none; position: fixed; pointer-events: none; background: rgba(245, 184, 61, 0.15);
    border: 1px dashed #f5b83d; border-radius: 2px; }
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
  :root { color-scheme: dark; }
  html, body { margin: 0; background: ${background}; overflow: hidden; -webkit-user-select: none; user-select: none; }
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
