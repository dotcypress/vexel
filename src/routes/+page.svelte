<script lang="ts">
	import { onMount } from 'svelte';
	import Editor from '#lib/Editor.svelte';
	import Preview from '#lib/Preview.svelte';
	import Help from '#lib/Help.svelte';
	import Console, { type LogEntry, type LogLevel } from '#lib/Console.svelte';
	import logo from '#lib/assets/logo.svg';
	import { DEFAULT_CODE } from '../lib/runtime';
	import { EXAMPLES } from '../lib/examples';
	import Examples from '../lib/Examples.svelte';

	const STORAGE_KEY = 'vexel:v1';
	const DEBOUNCE_MS = 350;

	let code = $state(DEFAULT_CODE);
	let appliedCode = $state(DEFAULT_CODE);
	let runId = $state(0);


	let error = $state<string | null>(null);
	let logs = $state<LogEntry[]>([]);
	let consoleOpen = $state(false);

	const MAX_LOGS = 500;

	function onlog(entries: { level: LogLevel; text: string }[]) {
		for (const entry of entries) {
			const last = logs[logs.length - 1];
			// Fold identical consecutive lines into a counter.
			if (last && last.level === entry.level && last.text === entry.text) last.count++;
			else logs.push({ ...entry, count: 1 });
		}
		if (logs.length > MAX_LOGS) logs.splice(0, logs.length - MAX_LOGS);
	}
	let splitPct = $state(50);
	let loaded = $state(false);
	let resizing = $state(false);
	let helpOpen = $state(false);

	let timer: ReturnType<typeof setTimeout> | undefined;
	let container: HTMLDivElement;

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
			if (saved) {
				if (typeof saved.code === 'string') code = appliedCode = saved.code;

				if (Number.isFinite(saved.splitPct)) splitPct = saved.splitPct;
			}
		} catch {
			// Ignore corrupt saved state.
		}
		loaded = true;
	});

	$effect(() => {
		if (!loaded) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, splitPct }));
	});

	function onEdit(value: string) {
		code = value;
		clearTimeout(timer);
		timer = setTimeout(run, DEBOUNCE_MS);
	}

	function run() {
		clearTimeout(timer);
		appliedCode = code;
		runId++;
	}

	// The last example loaded from the menu or the help, so loading another one over it
	// (while it is still unedited) needs no confirmation.
	let lastLoaded = '';

	// Loading an example replaces the editor, so ask first unless the code is untouched
	// (blank, the default sketch, or an unedited example).
	function loadCode(newCode: string, name: string) {
		const pristine =
			code.trim() === '' ||
			code === DEFAULT_CODE ||
			code === lastLoaded ||
			EXAMPLES.some((x) => x.code === code);
		if (!pristine && !confirm('Replace the current code with the "' + name + '" example?')) return;
		code = lastLoaded = newCode;
		run();
	}



	function startResize(e: PointerEvent) {
		resizing = true;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function moveResize(e: PointerEvent) {
		if (!resizing) return;
		const r = container.getBoundingClientRect();
		splitPct = Math.min(80, Math.max(20, ((e.clientX - r.left) / r.width) * 100));
	}

	function endResize() {
		resizing = false;
	}
</script>

<Help bind:open={helpOpen} onload={loadCode} />

<svelte:head>
	<title>Vexel — live coding graphics</title>
</svelte:head>

<div class="app" bind:this={container} class:resizing>
	<section class="left" style:width="{splitPct}%">
		<header>
			<span class="brand">
				<img class="logo" src={logo} alt="" width="22" height="22" />
				<span class="title">vexel</span>
			</span>
			<div class="actions">
				<Examples onpick={(example) => loadCode(example.code, example.title)} />
				<button
					class="icon"
					onclick={() => (helpOpen = true)}
					title="Help: API reference and shortcuts"
					aria-label="Help"
				>
					<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
						<circle cx="8" cy="8" r="6.75" fill="none" stroke="currentColor" stroke-width="1.5" />
						<path
							d="M6.1 6.2a1.95 1.95 0 1 1 2.7 1.8c-.5.2-.8.6-.8 1.1v.4"
							fill="none"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
						/>
						<circle cx="8" cy="11.6" r="0.95" fill="currentColor" />
					</svg>
				</button>
			</div>
		</header>
		<div class="editor-wrap">
			<Editor value={code} onchange={onEdit} onrun={run} />
		</div>
		<Console entries={logs} bind:open={consoleOpen} onclear={() => (logs = [])} />
		{#if error}
			<pre class="error" role="alert">{error}</pre>
		{/if}
	</section>

	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="divider"
		role="separator"
		aria-orientation="vertical"
		onpointerdown={startResize}
		onpointermove={moveResize}
		onpointerup={endResize}
		onpointercancel={endResize}
	></div>

	<section class="right">
		<Preview code={appliedCode} {runId} onerror={(m) => (error = m)} {onlog} onreset={() => (logs = [])} />
	</section>
</div>

<style>
	.app {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden;
	}
	.app.resizing {
		cursor: col-resize;
		user-select: none;
	}
	.left {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.right {
		flex: 1;
		min-width: 0;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		background: var(--panel);
		border-bottom: 1px solid var(--border);
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.logo {
		display: block;
		filter: drop-shadow(0 0 6px rgba(120, 140, 255, 0.45));
	}
	.title {
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: lowercase;
	}
	.actions {
		display: flex;
		gap: 6px;
	}
	button {
		padding: 4px 10px;
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
	button.icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 6px;
	}
	.editor-wrap {
		flex: 1;
		min-height: 0;
	}
	.error {
		margin: 0;
		padding: 8px 12px;
		max-height: 30%;
		overflow: auto;
		color: #ffb4b4;
		background: #3a1d22;
		border-top: 1px solid #6b2a33;
		font: 12px/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		white-space: pre-wrap;
	}
	.divider {
		width: 5px;
		flex: none;
		cursor: col-resize;
		background: var(--border);
		touch-action: none;
	}
	.divider:hover,
	.resizing .divider {
		background: var(--accent);
	}
</style>
