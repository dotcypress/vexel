<script lang="ts">
  import { tick } from 'svelte';
  import { highlight } from './highlight';
  import { HELP_CATEGORIES } from './helpData';

  let {
    open = $bindable(false),
    onload
  }: {
    open?: boolean;
    /** Replace the editor's code with an example. */
    onload: (code: string, title: string) => void;
  } = $props();

  function load(code: string, title: string) {
    onload(code, title);
    open = false;
  }

  let dialog: HTMLDialogElement;
  let search = $state<HTMLInputElement>();
  let body = $state<HTMLDivElement>();
  let query = $state('');
  let copied = $state<string | null>(null);

  $effect(() => {
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      query = '';
      dialog.showModal();
      tick().then(() => search?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  });

  // Esc clears the search first, and closes the dialog only when it is empty.
  function onSearchKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && query) {
      e.preventDefault();
      e.stopPropagation();
      query = '';
    }
  }

  function jump(id: string) {
    body?.querySelector('#' + id)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  async function copy(code: string, key: string) {
    await navigator.clipboard.writeText(code);
    copied = key;
    setTimeout(() => {
      if (copied === key) {
        copied = null;
      }
    }, 1200);
  }

  const slug = (title: string) => 'help-' + title.toLowerCase().replace(/[^a-z]+/g, '-');
  const helperName = (signature: string) => signature.match(/^[\w.]+/)?.[0] ?? signature;

  function onBackdropClick(e: MouseEvent) {
    // Clicks on the dialog element itself (outside the panel) hit the backdrop.
    if (e.target === dialog) open = false;
  }


  const quickStart = [
    'animate((t) => {',
    "  clear()",
    '  grid()',
    '  axes()',
    '  circle(cos(t) * 60, sin(t) * 60, 10, palette(0))',
    '})'
  ].join('\n');

  const categories = HELP_CATEGORIES;

  const searching = $derived(query.trim() !== '');

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return categories;
    }
    return categories
      .map((category) => ({
        ...category,
        helpers: category.helpers.filter((h) => (h.signature + ' ' + h.text).toLowerCase().includes(q))
      }))
      .filter((category) => category.helpers.length);
  });

  const shortcuts: [string, string][] = [
    ['F1', 'Open this help'],
    ['Cmd/Ctrl + Enter', 'Run now (the code also re-runs as you type)'],
    ['Wheel / trackpad scroll', 'Pan'],
    ['Middle or right drag, Space + drag', 'Pan'],
    ['Alt/Option + drag', 'Zoom to the selected area (Esc cancels)'],
    ['Alt/Option + click', 'Zoom out 2x around the point'],
    ['Pinch / Ctrl + wheel', 'Zoom at the cursor'],
    ['+  /  -', 'Zoom in / out'],
    ['Ctrl + Space', 'Autocomplete']
  ];
</script>

{#snippet loadIcon()}
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path fill="currentColor" d="M4 2.2v11.6a.6.6 0 0 0 .92.5l9-5.8a.6.6 0 0 0 0-1l-9-5.8A.6.6 0 0 0 4 2.2z" />
  </svg>
{/snippet}

{#snippet copyIcon(done: boolean)}
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    {#if done}
      <path d="m3 8.5 3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
    {:else}
      <rect x="5.5" y="5.5" width="8" height="8.5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
      <path d="M10.5 3.5V3a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 3v6.5A1.5 1.5 0 0 0 4 11h.5" fill="none" stroke="currentColor" stroke-width="1.4" />
    {/if}
  </svg>
{/snippet}

{#snippet example(code: string, title: string)}
  <div class="example-wrap">
    <pre class="example"><code>{@html highlight(code)}</code></pre>
    <div class="tools">
      <button
        class="tool"
        onclick={() => copy(code, title)}
        title={copied === title ? 'Copied' : 'Copy to the clipboard'}
        aria-label="Copy the {title} example"
      >
        {@render copyIcon(copied === title)}
      </button>
      <button
        class="tool run"
        onclick={() => load(code, title)}
        title="Replace the editor's code with this example and run it"
        aria-label="Load the {title} example into the editor and run it"
      >
        {@render loadIcon()}
      </button>
    </div>
  </div>
{/snippet}

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} onclose={() => (open = false)} onclick={onBackdropClick}>
  <div class="panel">
    <header>
      <h2>Help</h2>
      <input
        bind:this={search}
        bind:value={query}
        class="search"
        type="search"
        placeholder="Search helpers…"
        aria-label="Search helpers"
        onkeydown={onSearchKey}
      />
      <button class="close" onclick={() => (open = false)} aria-label="Close help">✕</button>
    </header>

    <div class="columns">
      <nav class="toc" aria-label="Help sections">
        {#if !searching}
          <button onclick={() => jump('help-basics')}>Basics</button>
          <button onclick={() => jump('help-globals')}>Globals</button>
        {/if}
        {#each filtered as category (category.title)}
          <button onclick={() => jump(slug(category.title))}>
            {category.title}
            <span class="count">{category.helpers.length}</span>
          </button>
        {/each}
        {#if !searching}
          <button onclick={() => jump('help-shortcuts')}>Shortcuts</button>
        {/if}
      </nav>

      <div class="body" bind:this={body}>
        {#if !searching}
          <section id="help-basics">
            <h3>Basics</h3>
            <p>
              The canvas is infinite: draw in world coordinates, where <code>(0, 0)</code> is the
              origin and Y grows upward, like in a math plot. Pan and zoom the preview to explore.
            </p>
            <p>
              Call <code>animate((t, dt) =&gt; &#123; … &#125;)</code> to draw every frame:
              <code>t</code> is seconds since the run started, <code>dt</code> seconds since the last
              call. <code>animate(fn, 0.5)</code> calls <code>fn</code> every half second instead.
              Without <code>animate</code>, the code re-runs whenever the view or a control changes.
            </p>
            <p>
              Every helper takes its arguments in the same order: geometry first, then colors,
              then size or line width, then extras. Instead of the style arguments you can pass
              one object, for example <code>line(0, 0, 50, 50, &#123; color: 'red', width: 3 &#125;)</code>
              or <code>ellipse(0, 0, 60, 30, &#123; fill: 'teal', rotation: 0.5 &#125;)</code>.
            </p>
            <p>
              Left-out styles fall back to the current <code>ctx</code> styles, and helpers never
              change them. Each run starts with light ink and lines 1 screen pixel wide.
            </p>
            {@render example(quickStart, 'quick start')}
            <p>
              The <strong>Examples</strong> menu in the header has ready-made sketches; each card lists
              the helpers it uses.
            </p>
          </section>

          <section id="help-globals">
            <h3>Globals</h3>
            <dl>
              <dt><code>canvas</code>, <code>ctx</code></dt>
              <dd>The canvas and its 2D context, already set up for the world camera.</dd>
              <dt><code>view</code></dt>
              <dd>
                Visible world area:
                <code>x, y, zoom, left, top, right, bottom, width, height</code>.
              </dd>
              <dt><code>mouse</code></dt>
              <dd>
                Pointer in world coordinates: <code>x, y, down</code>, and <code>clicked</code>,
                true for the one frame after a click on the sketch.
              </dd>
              <dt><code>frame</code></dt>
              <dd>
                <code>n</code> (frame index), <code>time</code> and <code>dt</code> (seconds),
                <code>fps</code> (smoothed).
              </dd>
              <dt><code>sin, cos, PI, …</code></dt>
              <dd>
                Every <code>Math</code> function and constant is global, except <code>log</code>,
                which prints (use <code>Math.log</code>), and <code>random</code>, which is seeded
                (use <code>Math.random</code> for unseeded numbers).
              </dd>
            </dl>
          </section>
        {/if}

        {#each filtered as category (category.title)}
          <section id={slug(category.title)}>
            <h3>{category.title}</h3>
            {#if category.note && !searching}
              <p class="note">{category.note}</p>
            {/if}
            {#each category.helpers as helper (helper.signature)}
              {@const name = helperName(helper.signature)}
              <div class="entry">
                <code class="signature"
                  ><span class="name">{name}</span><span class="params"
                    >{helper.signature.slice(name.length)}</span
                  ></code
                >
                <p class="description">{helper.text}</p>
                {@render example(helper.example, helper.signature)}
              </div>
            {/each}
          </section>
        {:else}
          <p class="empty">No helpers match “{query}”.</p>
        {/each}

        {#if !searching}
          <section id="help-shortcuts">
            <h3>Shortcuts</h3>
            <dl class="keys">
              {#each shortcuts as [keys, text] (keys)}
                <dt><kbd>{keys}</kbd></dt>
                <dd>{text}</dd>
              {/each}
            </dl>
          </section>
        {/if}
      </div>
    </div>
  </div>
</dialog>

<style>
  dialog {
    width: min(960px, calc(100vw - 32px));
    height: min(820px, calc(100vh - 64px));
    padding: 0;
    color: var(--text);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);
  }
  dialog::backdrop {
    background: rgba(5, 6, 10, 0.6);
  }
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--border);
  }
  h2 {
    margin: 0;
    font-size: 15px;
  }
  .search {
    flex: 1;
    max-width: 360px;
    margin-left: auto;
    padding: 6px 10px;
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
  .columns {
    display: flex;
    flex: 1;
    min-height: 0;
  }
  .toc {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 190px;
    flex-shrink: 0;
    padding: 10px 8px;
    overflow-y: auto;
    border-right: 1px solid var(--border);
  }
  .toc button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    color: var(--muted);
    text-align: left;
    background: transparent;
    border: 0;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
  }
  .toc button:hover {
    color: var(--text);
    background: var(--bg);
  }
  .count {
    color: var(--muted);
    font-size: 11px;
    opacity: 0.7;
  }
  @media (max-width: 720px) {
    .toc {
      display: none;
    }
  }
  .empty {
    padding: 32px 0;
    color: var(--muted);
    text-align: center;
  }
  .close {
    padding: 2px 8px;
    color: var(--muted);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    font: inherit;
    cursor: pointer;
  }
  .close:hover {
    color: var(--text);
    border-color: var(--border);
  }
  .body {
    flex: 1;
    padding: 4px 20px 24px;
    overflow: auto;
  }
  section {
    scroll-margin-top: 8px;
  }
  h3 {
    margin: 20px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  p {
    margin: 6px 0;
    line-height: 1.5;
  }
  .note {
    color: var(--muted);
    font-size: 12px;
  }
  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 6px 16px;
    margin: 6px 0;
  }
  dt,
  dd {
    margin: 0;
  }
  dd {
    color: var(--muted);
  }
  .entry {
    margin: 20px 0 14px;
  }
  .signature {
    display: block;
    overflow-wrap: anywhere;
  }
  .signature .name {
    color: #61afef;
    font-weight: 600;
  }
  .signature .params {
    color: var(--muted);
  }
  .description {
    margin: 2px 0 4px;
    color: var(--muted);
  }
  .example-wrap {
    position: relative;
    margin: 4px 0 0;
  }
  .example {
    margin: 0;
    padding: 6px 72px 6px 10px;
    overflow-x: auto;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
  .tools {
    position: absolute;
    top: 5px;
    right: 6px;
    display: flex;
    gap: 4px;
  }
  .tool {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 22px;
    padding: 0;
    color: var(--muted);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
  }
  .tool:hover {
    color: var(--text);
    border-color: var(--accent);
  }
  .tool.run:hover {
    color: var(--bg);
    background: var(--accent);
  }
  .example code {
    color: var(--text);
    white-space: pre-wrap;
  }
  /* Colors match the editor's One Dark theme. */
  .example :global(.tok-comment) {
    color: #7d8799;
    font-style: italic;
  }
  .example :global(.tok-string) {
    color: #98c379;
  }
  .example :global(.tok-number),
  .example :global(.tok-constant) {
    color: #d19a66;
  }
  .example :global(.tok-keyword) {
    color: #c678dd;
  }
  .example :global(.tok-function) {
    color: #61afef;
  }
  .example :global(.tok-operator) {
    color: #56b6c2;
  }
  code,
  kbd {
    font: 12px ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  }
  code {
    color: #c8d0ff;
  }
  kbd {
    padding: 1px 6px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 4px;
  }
</style>
