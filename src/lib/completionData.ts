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
	{ label: 'mouse', type: 'variable', info: 'Pointer in world coordinates: { x, y, down }.' },
	{
		label: 'frame',
		type: 'variable',
		info: 'Frame info: { n, time, dt, fps }. n is the frame index, time and dt are in seconds.'
	},

	fn('clear', 'color?', 'Fill the whole canvas with color, or make it transparent if omitted.'),
	fn('point', 'x, y, size?, color?', 'Filled dot. size is the diameter (default 4).', 'point(${x}, ${y})'),
	fn('line', 'x1, y1, x2, y2, color?, lineWidth?', 'Line segment.', 'line(${x1}, ${y1}, ${x2}, ${y2})'),
	fn('points', 'list, size?, color?', 'Draw many dots from [[x, y], ...].', 'points(${list})'),
	fn(
		'polyline',
		'list, color?, lineWidth?, closed?',
		'Connected lines through [[x, y], ...]. closed = true joins the ends.',
		'polyline(${list})'
	),
	fn(
		'circle',
		'x, y, radius, fill?, stroke?, lineWidth?',
		'fill: color, omit/true for ctx.fillStyle, false/null for none. stroke: color, true for ctx.strokeStyle, omit for none.',
		'circle(${x}, ${y}, ${radius})'
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
	fn('axes', 'color?', 'X and Y axes through the origin, with value labels. Call it after clear().', 'axes()'),
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
		'f, step?, color?',
		'Vector field: f(x, y) returns [dx, dy] and an arrow is drawn every step world units (default 20), as long as the vector but capped below step.',
		'field((x, y) => [${dx}, ${dy}])'
	),
	fn(
		'heat',
		'f, ramp?',
		"Colors the view by f(x, y), a number from 0 to 1. ramp: 'viridis' (default), 'magma', 'turbo', 'gray' or a function t => color. Opaque: draw it first.",
		'heat((x, y) => ${})'
	),
	fn(
		'hover',
		'x, y, r',
		'True while the pointer is within r world units of x, y. Static sketches re-run when the result changes.',
		'hover(${x}, ${y}, ${r})'
	),
	fn(
		'trail',
		'id, x, y, n?, color?',
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
		'list, size?, ramp?',
		"Dots from [[x, y, value], ...], colored by value (0 to 1). ramp: 'viridis' (default), 'magma', 'turbo', 'gray' or a function t => color.",
		'scatter(${list})'
	),
	fn(
		'bars',
		'list, width?, color?',
		'Bar chart from numbers: bar i fills the slot from i * width (default 10), as tall as its value. color is one color or (i, value) => color.',
		'bars(${list})'
	),
	fn(
		'hist',
		'list, bins?',
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
	random: '',
	clz32: 'n'
};

// Every Math member is available as a bare global in sketches (see runtime.ts).
// Math members that a helper of the same name replaces: log() prints (use Math.log for ln).
const SHADOWED_MATH = new Set(['log']);

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
