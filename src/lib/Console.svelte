<script lang="ts" module>
	export type LogLevel = 'log' | 'info' | 'warn' | 'error';
	export type LogEntry = { level: LogLevel; text: string; count: number };
</script>

<script lang="ts">
	import { tick } from 'svelte';

	let {
		entries,
		open = $bindable(false),
		onclear
	}: { entries: LogEntry[]; open?: boolean; onclear: () => void } = $props();

	let body: HTMLDivElement | undefined = $state();
	// Once the user toggles the panel themselves, stop opening it automatically.
	let touched = false;
	let stickToBottom = true;

	const total = $derived(entries.reduce((sum, e) => sum + e.count, 0));
	const hasError = $derived(entries.some((e) => e.level === 'error'));
	const hasWarn = $derived(entries.some((e) => e.level === 'warn'));

	function toggle() {
		touched = true;
		open = !open;
	}

	function onScroll() {
		if (!body) return;
		stickToBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 24;
	}

	// First output opens the panel, unless the user has already chosen.
	$effect(() => {
		if (entries.length > 0 && !touched && !open) open = true;
	});

	// Follow new output while the user is at the bottom.
	$effect(() => {
		entries.length;
		entries[entries.length - 1]?.count;
		if (open && stickToBottom) {
			tick().then(() => {
				if (body) body.scrollTop = body.scrollHeight;
			});
		}
	});
</script>

<div class="console" class:open>
	<div class="bar">
		<button class="toggle" onclick={toggle} aria-expanded={open}>
			<span class="chevron">{open ? '▾' : '▸'}</span>
			Console
			{#if entries.length}
				<span class="count" class:error={hasError} class:warn={!hasError && hasWarn}>{total}</span>
			{/if}
		</button>
		{#if entries.length}
			<button class="clear" onclick={onclear}>Clear</button>
		{/if}
	</div>
	{#if open}
		<div class="lines" bind:this={body} onscroll={onScroll}>
			{#each entries as entry}
				<div class="line {entry.level}">
					<span class="text">{entry.text}</span>
					{#if entry.count > 1}<span class="repeat">×{entry.count}</span>{/if}
				</div>
			{:else}
				<div class="empty">Nothing logged yet. Call <code>log(...)</code> in your sketch.</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.console {
		flex: none;
		background: var(--panel);
		border-top: 1px solid var(--border);
	}
	.bar {
		box-sizing: border-box;
		/* The panel's own 1px top border brings it to the shared bar height. */
		height: calc(var(--bottom-bar-height) - 1px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 8px;
	}
	button {
		padding: 2px 6px;
		color: var(--muted);
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		font: inherit;
		font-size: 12px;
		cursor: pointer;
	}
	button:hover {
		color: var(--text);
		border-color: var(--border);
	}
	.chevron {
		display: inline-block;
		width: 1em;
	}
	.count {
		margin-left: 4px;
		padding: 0 6px;
		color: var(--text);
		background: var(--border);
		border-radius: 8px;
		font-size: 11px;
	}
	.count.warn {
		color: #2b2100;
		background: #f0c75b;
	}
	.count.error {
		color: #fff;
		background: #c9475a;
	}
	.lines {
		max-height: 160px;
		min-height: 48px;
		padding: 4px 12px 8px;
		overflow: auto;
		background: var(--bg);
		border-top: 1px solid var(--border);
		font: 12px/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
	}
	.line {
		display: flex;
		gap: 8px;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.line.info {
		color: #5bc7f0;
	}
	.line.warn {
		color: #f0c75b;
	}
	.line.error {
		color: #ffb4b4;
	}
	.repeat {
		flex: none;
		color: var(--muted);
	}
	.empty {
		color: var(--muted);
	}
	code {
		color: #c8d0ff;
	}
</style>
