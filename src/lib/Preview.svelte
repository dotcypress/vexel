<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { buildPreviewDoc } from './runtime';
	import type { LogLevel } from './Console.svelte';

	let {
		code,
		runId,
		onerror,
		onlog,
		onreset
	}: {
		code: string;
		runId: number;
		onerror: (message: string | null) => void;
		/** Lines printed by log() or console.* in the sketch. */
		onlog: (entries: { level: LogLevel; text: string }[]) => void;
		/** A new run is starting; previous output is stale. */
		onreset: () => void;
	} = $props();

	const LOG_LEVELS = new Set(['log', 'info', 'warn', 'error']);

	const MIN_ZOOM = 0.01;
	const MAX_ZOOM = 100;

	let viewport: HTMLDivElement;
	let frame: HTMLIFrameElement;

	// Camera in CSS pixels: screen x = world x * zoom + panX, screen y = panY - world y * zoom
	// (Y points up).
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);

	// Latest value of each slider() reported by the sketch, by name.
	const sliderValues: Record<string, number> = {};

	let panning = false;
	let panStart = { x: 0, y: 0, panX: 0, panY: 0 };
	// Pointer position in viewport pixels, or null when it is outside the viewport.
	let cursor = $state<{ x: number; y: number } | null>(null);

	const cursorWorld = $derived(
		cursor ? { x: (cursor.x - panX) / zoom, y: (panY - cursor.y) / zoom } : null
	);

	// Show roughly one digit more than a screen pixel is worth.
	const decimals = $derived(Math.min(6, Math.max(0, Math.ceil(Math.log10(zoom)) + 1)));

	let spaceDown = $state(false);
	let dragging = $state(false);


	const doc = $derived(buildPreviewDoc(code) + `<!--${runId}-->`);

	// A fresh document resets any previous error until the new run reports one.
	$effect(() => {
		doc;
		untrack(() => {
			onerror(null);
			onreset();
		});
	});

	// Push the camera to the sketch whenever it changes.
	$effect(() => {
		sendCamera(panX, panY, zoom);
	});

	function sendCamera(x: number, y: number, z: number) {
		frame?.contentWindow?.postMessage({ source: 'vexel', type: 'camera', x, y, zoom: z }, '*');
	}

	// Download the sketch as a self-contained page that runs without the app.
	function exportHtml() {
		const html = buildPreviewDoc(code, { standalone: true, zoom, sliders: sliderValues });
		const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = 'vexel-sketch.html';
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function clampZoom(z: number) {
		return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
	}

	function zoomAt(newZoom: number, cx: number, cy: number) {
		newZoom = clampZoom(newZoom);
		const ratio = newZoom / zoom;
		panX = cx - (cx - panX) * ratio;
		panY = cy - (cy - panY) * ratio;
		zoom = newZoom;
	}

	function zoomBy(factor: number) {
		const r = viewport.getBoundingClientRect();
		zoomAt(zoom * factor, r.width / 2, r.height / 2);
	}

	function zoomTo(value: number) {
		const r = viewport.getBoundingClientRect();
		zoomAt(value, r.width / 2, r.height / 2);
	}

	// Origin in the middle of the panel at 100%.
	function resetView() {
		const r = viewport.getBoundingClientRect();
		zoom = 1;
		panX = r.width / 2;
		panY = r.height / 2;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const r = viewport.getBoundingClientRect();
		if (e.ctrlKey || e.metaKey) {
			// Pinch gestures arrive as ctrl+wheel with small deltas.
			zoomAt(zoom * Math.exp(-e.deltaY * 0.01), e.clientX - r.left, e.clientY - r.top);
		} else {
			panX -= e.deltaX;
			panY -= e.deltaY;
		}
	}

	function toWorld(e: PointerEvent) {
		const r = viewport.getBoundingClientRect();
		return {
			x: (e.clientX - r.left - panX) / zoom,
			y: (panY - (e.clientY - r.top)) / zoom
		};
	}

	function sendMouse(e: PointerEvent, down: boolean) {
		const { x, y } = toWorld(e);
		frame?.contentWindow?.postMessage({ source: 'vexel', type: 'mouse', x, y, down }, '*');
	}

	function onPointerDown(e: PointerEvent) {
		viewport.focus();
		viewport.setPointerCapture(e.pointerId);
		if (e.button === 1 || e.button === 2 || (e.button === 0 && spaceDown)) {
			e.preventDefault();
			panning = true;
			dragging = true;
			panStart = { x: e.clientX, y: e.clientY, panX, panY };
		} else if (e.button === 0) {
			sendMouse(e, true);
		}
	}

	function onPointerMove(e: PointerEvent) {
		const r = viewport.getBoundingClientRect();
		cursor = { x: e.clientX - r.left, y: e.clientY - r.top };
		if (panning) {
			panX = panStart.panX + (e.clientX - panStart.x);
			panY = panStart.panY + (e.clientY - panStart.y);
		} else {
			sendMouse(e, (e.buttons & 1) === 1);
		}
	}

	function onPointerUp(e: PointerEvent) {
		if (panning) {
			panning = false;
			dragging = false;
		} else {
			sendMouse(e, false);
		}
	}

	// The iframe never has focus, so the viewport forwards keys for key() in sketches.
	function sendKey(e: KeyboardEvent, down: boolean) {
		frame?.contentWindow?.postMessage(
			{ source: 'vexel', type: 'key', key: e.key, code: e.code, down },
			'*'
		);
	}

	function onBlur() {
		spaceDown = false;
		frame?.contentWindow?.postMessage({ source: 'vexel', type: 'keyreset' }, '*');
	}

	function onKeyDown(e: KeyboardEvent) {
		sendKey(e, true);
		if (e.code === 'Space') {
			spaceDown = true;
			e.preventDefault();
		} else if (e.key === '0') {
			resetView();
		} else if (e.key === '+' || e.key === '=') {
			zoomBy(1.25);
		} else if (e.key === '-') {
			zoomBy(1 / 1.25);
		}
	}

	function onKeyUp(e: KeyboardEvent) {
		sendKey(e, false);
		if (e.code === 'Space') spaceDown = false;
	}

	function onMessage(e: MessageEvent) {
		if (e.source !== frame?.contentWindow) return;
		const d = e.data;
		if (!d || d.source !== 'vexel') return;
		if (d.type === 'ready') {
			// Every edit reloads the sketch; hand back slider values so they survive.
			frame?.contentWindow?.postMessage({ source: 'vexel', type: 'sliders', values: sliderValues }, '*');
			sendCamera(panX, panY, zoom);
		} else if (d.type === 'camera') {
			// The sketch asked for a new view (fit); adopt it.
			if ([d.x, d.y, d.zoom].every(Number.isFinite)) {
				zoom = clampZoom(d.zoom);
				panX = d.x;
				panY = d.y;
			}
		} else if (d.type === 'slider' && typeof d.value === 'number') {
			sliderValues[String(d.name)] = d.value;
		} else if (d.type === 'log' && Array.isArray(d.entries)) {
			onlog(
				d.entries
					.filter((x: { level?: unknown; text?: unknown }) => LOG_LEVELS.has(String(x?.level)))
					.map((x: { level: LogLevel; text: unknown }) => ({
						level: x.level,
						text: String(x.text).slice(0, 2000)
					}))
			);
		} else if (d.type === 'error') {
			onerror(String(d.message));
		} else if (d.type === 'ok') {
			onerror(null);
		}
	}


	onMount(() => {
		viewport.addEventListener('wheel', onWheel, { passive: false });
		window.addEventListener('message', onMessage);
		resetView();
		return () => {
			viewport.removeEventListener('wheel', onWheel);
			window.removeEventListener('message', onMessage);
		};
	});

	const percent = $derived(Math.round(zoom * 100));
</script>

<div class="preview">
	<div class="toolbar">
		<div class="group">
			<button title="Zoom out (-)" onclick={() => zoomBy(1 / 1.25)}>−</button>
			<button class="value" title="Zoom to 100%" onclick={() => zoomTo(1)}>{percent}%</button>
			<button title="Zoom in (+)" onclick={() => zoomBy(1.25)}>+</button>
			<button title="Reset view: origin at center, 100% (0)" onclick={resetView}>Reset</button>

		</div>
		<div class="group">
			<button title="Download the sketch as a standalone HTML file" onclick={exportHtml}>
				Export HTML
			</button>
		</div>
	</div>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="viewport"
		class:grab={spaceDown}
		class:dragging
		bind:this={viewport}
		tabindex="0"
		role="application"
		aria-label="Graphics preview"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onpointerleave={() => (cursor = null)}
		onkeydown={onKeyDown}
		onkeyup={onKeyUp}
		onblur={onBlur}
		oncontextmenu={(e) => e.preventDefault()}
	>
		<iframe bind:this={frame} title="Preview" sandbox="allow-scripts" srcdoc={doc}></iframe>

		{#if cursorWorld}
			<div class="readout">
				<span>x {cursorWorld.x.toFixed(decimals)}</span>
				<span>y {cursorWorld.y.toFixed(decimals)}</span>
			</div>
		{/if}

	</div>

	<div class="hint">
		Wheel / middle or right drag / Space+drag to pan · Pinch or Ctrl+wheel to zoom · 0 reset
	</div>
</div>

<style>
	.preview {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-width: 0;
		min-height: 0;
	}
	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: var(--panel);
		border-bottom: 1px solid var(--border);
	}
	.group {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	button {
		min-width: 28px;
		padding: 4px 8px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		font: inherit;
		cursor: pointer;
	}
	button:hover {
		border-color: var(--accent);
	}

	button.value {
		min-width: 56px;
		font-variant-numeric: tabular-nums;
	}
	.viewport {
		position: relative;
		flex: 1;
		min-height: 0;
		overflow: hidden;
		outline: none;
		touch-action: none;
		background: #1b1d25;
		cursor: crosshair;
	}
	.viewport.grab {
		cursor: grab;
	}
	.viewport.dragging {
		cursor: grabbing;
	}
	iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
		pointer-events: none;
		background: transparent;
	}

	.readout {
		position: absolute;
		left: 8px;
		bottom: 8px;
		display: flex;
		gap: 12px;
		padding: 3px 8px;
		pointer-events: none;
		color: var(--text);
		background: rgba(21, 23, 30, 0.8);
		border: 1px solid var(--border);
		border-radius: 4px;
		font: 11px/1.3 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-variant-numeric: tabular-nums;
	}

	.hint {
		padding: 4px 12px;
		color: var(--muted);
		background: var(--panel);
		border-top: 1px solid var(--border);
		font-size: 11px;
	}
</style>
