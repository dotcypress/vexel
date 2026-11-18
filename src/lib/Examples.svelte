<script lang="ts">
	import { tick } from 'svelte';
	import { EXAMPLES, EXAMPLE_GROUPS, type Example } from './examples';

	let { onpick }: { onpick: (example: Example) => void } = $props();

	let open = $state(false);
	let query = $state('');
	let active = $state(0);
	let root: HTMLDivElement;
	let search = $state<HTMLInputElement>();
	let list = $state<HTMLDivElement>();

	// "animate, slider: dots on the golden angle." -> helpers + blurb.
	function parts(example: Example) {
		const i = example.description.indexOf(': ');
		if (i < 0) return { helpers: [], blurb: example.description };
		return {
			helpers: example.description
				.slice(0, i)
				.split(/,\s*|\s\+\s/)
				.filter(Boolean),
			blurb: example.description.slice(i + 2)
		};
	}

	const GROUP_HUES: Record<string, number> = {
		Basics: 200,
		Math: 260,
		Data: 150,
		Generative: 320,
		Interactive: 20
	};

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return EXAMPLES;
		return EXAMPLES.filter((e) =>
			(e.title + ' ' + e.description + ' ' + e.group).toLowerCase().includes(q)
		);
	});

	const groups = $derived(
		EXAMPLE_GROUPS.map((group) => ({
			group,
			items: filtered.filter((e) => e.group === group)
		})).filter((g) => g.items.length)
	);

	async function show() {
		open = true;
		query = '';
		active = 0;
		await tick();
		search?.focus();
	}

	function close() {
		open = false;
	}

	function pick(example: Example) {
		close();
		onpick(example);
	}

	async function move(delta: number) {
		if (!filtered.length) return;
		active = (active + delta + filtered.length) % filtered.length;
		await tick();
		list?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			move(1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			move(-1);
		} else if (e.key === 'Enter' && filtered[active]) {
			e.preventDefault();
			pick(filtered[active]);
		}
	}

	function onWindowPointerDown(e: PointerEvent) {
		if (open && !root.contains(e.target as Node)) close();
	}

	$effect(() => {
		query;
		active = 0;
	});
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="examples" bind:this={root}>
	<button
		class="trigger"
		class:open
		onclick={() => (open ? close() : show())}
		aria-haspopup="dialog"
		aria-expanded={open}
		title="Load a ready-made sketch"
	>
		<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
			<path
				d="M8 1.75 9.6 6.4l4.65 1.6L9.6 9.6 8 14.25 6.4 9.6 1.75 8 6.4 6.4z"
				fill="currentColor"
			/>
		</svg>
		Examples
		<svg class="chevron" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
			<path
				d="m4 6 4 4 4-4"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="panel" role="dialog" aria-label="Examples" tabindex="-1" onkeydown={onKeyDown}>
			<input
				bind:this={search}
				bind:value={query}
				class="search"
				type="search"
				placeholder="Search {EXAMPLES.length} examples…"
				aria-label="Search examples"
			/>
			<div class="list" bind:this={list}>
				{#each groups as { group, items } (group)}
					<div class="group" style:--hue={GROUP_HUES[group] ?? 230}>
						<div class="group-title">{group}</div>
						<div class="cards">
							{#each items as example (example.id)}
								{@const { helpers, blurb } = parts(example)}
								{@const index = filtered.indexOf(example)}
								<button
									class="card"
									data-active={index === active}
									onclick={() => pick(example)}
									onpointerenter={() => (active = index)}
								>
									<span class="title">{example.title}</span>
									<span class="blurb">{blurb}</span>
									<span class="helpers">
										{#each helpers as helper (helper)}
											<code>{helper}</code>
										{/each}
									</span>
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="empty">No examples match “{query}”.</div>
				{/each}
			</div>
			<div class="footer"><kbd>↑</kbd><kbd>↓</kbd> choose <kbd>Enter</kbd> load <kbd>Esc</kbd> close</div>
		</div>
	{/if}
</div>

<style>
	.examples {
		position: relative;
	}
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 8px 4px 10px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		font: inherit;
		cursor: pointer;
	}
	.trigger:hover,
	.trigger.open {
		border-color: var(--accent);
	}
	.trigger svg:first-child {
		color: var(--accent);
	}
	.chevron {
		color: var(--muted);
		transition: transform 0.15s;
	}
	.trigger.open .chevron {
		transform: rotate(180deg);
	}

	.panel {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		z-index: 20;
		display: flex;
		flex-direction: column;
		width: min(560px, calc(100vw - 24px));
		max-height: min(70vh, 640px);
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 8px;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
		outline: none;
		animation: pop 0.12s ease-out;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
	}

	.search {
		margin: 10px 10px 4px;
		padding: 7px 10px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		font: inherit;
		outline: none;
	}
	.search:focus {
		border-color: var(--accent);
	}

	.list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: 4px 10px 10px;
	}
	.group-title {
		margin: 10px 2px 6px;
		color: hsl(var(--hue) 70% 72%);
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 6px;
	}
	.card {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 8px 10px 8px 12px;
		text-align: left;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
		border-left: 3px solid hsl(var(--hue) 65% 60%);
		border-radius: 6px;
		font: inherit;
		cursor: pointer;
		transition:
			border-color 0.1s,
			transform 0.1s;
	}
	.card[data-active='true'] {
		border-color: hsl(var(--hue) 65% 60%);
		background: hsl(var(--hue) 30% 14%);
		transform: translateY(-1px);
	}
	.title {
		font-weight: 600;
	}
	.blurb {
		display: block;
		color: var(--muted);
		font-size: 12px;
		line-height: 1.35;
	}
	.blurb::first-letter {
		text-transform: uppercase;
	}
	.helpers {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.helpers code {
		padding: 1px 5px;
		color: hsl(var(--hue) 70% 78%);
		background: hsl(var(--hue) 40% 50% / 0.14);
		border-radius: 3px;
		font-size: 11px;
	}
	.empty {
		padding: 24px 0;
		color: var(--muted);
		text-align: center;
	}
	.footer {
		padding: 6px 12px;
		color: var(--muted);
		font-size: 11px;
		border-top: 1px solid var(--border);
	}
	kbd {
		margin: 0 2px;
		padding: 0 4px;
		color: var(--text);
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 3px;
		font: inherit;
	}
</style>
