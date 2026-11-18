<script lang="ts">
  import { onMount } from 'svelte';
  import Editor, { type SketchError } from '#lib/Editor.svelte';
  import Preview from '#lib/Preview.svelte';
  import Help from '#lib/Help.svelte';
  import Console, { type LogEntry, type LogLevel } from '#lib/Console.svelte';
  import logo from '#lib/assets/logo.svg';
  import { DEFAULT_CODE } from '../lib/runtime';
  import { EXAMPLES } from '../lib/examples';
  import Examples from '../lib/Examples.svelte';
  import { decodeCode, embedCode, isEmbed, sharedData, shareUrl } from '../lib/share';

  const STORAGE_KEY = 'vexel:v1';
  // The user's own code, kept when a share link replaced it, so it can be restored.
  const BEFORE_SHARE_KEY = 'vexel:before-share';
  // Links longer than this may be cut off by chat apps and some browsers.
  const LONG_LINK = 8000;
  const DEBOUNCE_MS = 350;

  let code = $state(DEFAULT_CODE);
  let appliedCode = $state(DEFAULT_CODE);
  let runId = $state(0);


  let error = $state<SketchError | null>(null);
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
  let container = $state<HTMLDivElement>();

  // ?embed shows only the preview of a shared sketch and never touches the saved code.
  let embed = $state(false);
  let editUrl = $state('');
  // Shown above the editor after opening a share link.
  let notice = $state<'opened' | 'broken' | null>(null);
  let shareOpen = $state(false);
  let toast = $state<string | null>(null);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    embed = isEmbed();
    let savedCode: string | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved && !embed) {
        if (typeof saved.code === 'string') savedCode = code = appliedCode = saved.code;

        if (Number.isFinite(saved.splitPct)) splitPct = saved.splitPct;
      }
    } catch {
      // Ignore corrupt saved state.
    }

    openShared(savedCode).finally(() => (loaded = true));
  });

  // Opens the sketch in the URL fragment, if any. The user's own code (current) is kept
  // aside first so the banner can bring it back.
  async function openShared(current: string | null) {
    const data = sharedData();
    if (!data) return;
    try {
      const shared = await decodeCode(data);
      if (!embed && current !== null && current !== shared && !isPristine(current)) {
        localStorage.setItem(BEFORE_SHARE_KEY, current);
        notice = 'opened';
      }
      code = appliedCode = shared;
      runId++;
      if (embed) editUrl = await shareUrl(shared);
    } catch {
      notice = 'broken';
    }
    // Drop the fragment so a reload keeps later edits instead of reopening the link.
    if (!embed) history.replaceState(null, '', location.pathname + location.search);
  }

  // A share link pasted into the address bar of an open Vexel tab only changes the fragment.
  function onHashChange() {
    if (sharedData()) openShared(code);
  }

  function restoreBeforeShare() {
    const previous = localStorage.getItem(BEFORE_SHARE_KEY);
    if (previous !== null) {
      code = previous;
      run();
    }
    dismissNotice();
  }

  function dismissNotice() {
    notice = null;
    localStorage.removeItem(BEFORE_SHARE_KEY);
  }

  function showToast(text: string) {
    toast = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = null), 3500);
  }

  async function copyShare(kind: 'link' | 'embed') {
    shareOpen = false;
    const text = kind === 'link' ? await shareUrl(code) : await embedCode(code);
    const what = kind === 'link' ? 'Link' : 'Embed code';
    try {
      await navigator.clipboard.writeText(text);
      showToast(
        text.length > LONG_LINK
          ? what + ' copied. It is long (' + text.length + ' characters), so some apps may cut it off.'
          : what + ' copied to the clipboard.'
      );
    } catch {
      prompt('Copy the ' + what.toLowerCase() + ':', text);
    }
  }

  $effect(() => {
    if (!loaded || embed) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, splitPct }));
  });

  function onEdit(value: string) {
    if (value === code) {
      return;
    }
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
  function isPristine(c: string) {
    return c.trim() === '' || c === DEFAULT_CODE || c === lastLoaded || EXAMPLES.some((x) => x.code === c);
  }

  function loadCode(newCode: string, name: string) {
    if (!isPristine(code) && !confirm('Replace the current code with the "' + name + '" example?')) return;
    code = lastLoaded = newCode;
    run();
  }



  function startResize(e: PointerEvent) {
    resizing = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function moveResize(e: PointerEvent) {
    if (!resizing || !container) return;
    const r = container.getBoundingClientRect();
    splitPct = Math.min(80, Math.max(20, ((e.clientX - r.left) / r.width) * 100));
  }

  function endResize() {
    resizing = false;
  }

  function onWindowKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') shareOpen = false;
    if (e.key === 'F1' && !embed) {
      e.preventDefault();
      helpOpen = true;
    }
  }
</script>

<svelte:window
  onkeydown={onWindowKeyDown}
  onhashchange={onHashChange}
  onpointerdown={(e) => {
    if (shareOpen && !(e.target as Element).closest('.share')) shareOpen = false;
  }}
/>

<Help bind:open={helpOpen} onload={loadCode} />

<svelte:head>
  <title>Vexel — live coding graphics</title>
</svelte:head>

{#snippet shareButton()}
  <div class="share">
    <button
      class="icon"
      onclick={() => (shareOpen = !shareOpen)}
      title="Share: copy a link or embed code for this sketch"
      aria-label="Share"
      aria-expanded={shareOpen}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path
          d="M6.6 9.4a2.6 2.6 0 0 0 3.7 0l2.4-2.4a2.6 2.6 0 0 0-3.7-3.7l-.9.9M9.4 6.6a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 0 0 3.7 3.7l.9-.9"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
    {#if shareOpen}
      <div class="menu" role="menu">
        <button role="menuitem" onclick={() => copyShare('link')}>
          Copy link<small>Opens this code in Vexel</small>
        </button>
        <button role="menuitem" onclick={() => copyShare('embed')}>
          Copy embed code<small>An iframe showing only the preview</small>
        </button>
      </div>
    {/if}
  </div>
{/snippet}

{#if embed}
  <div class="embed">
    {#if loaded}
      <Preview code={appliedCode} {runId} onerror={(e) => (error = e)} {onlog} onreset={() => (logs = [])} embed {editUrl} />
    {/if}
    {#if notice === 'broken'}
      <pre class="error embed-error" role="alert">This share link is damaged and could not be opened.</pre>
    {:else if error}
      <pre class="error embed-error" role="alert">{error.line ? 'Line ' + error.line + ': ' : ''}{error.message}</pre>
    {/if}
  </div>
{:else}
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
          title="Help: API reference and shortcuts (F1)"
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
    {#if notice === 'opened'}
      <div class="notice">
        <span>Opened a shared sketch. Your previous code was kept aside.</span>
        <button onclick={restoreBeforeShare}>Restore my code</button>
        <button class="icon" onclick={dismissNotice} aria-label="Dismiss">✕</button>
      </div>
    {:else if notice === 'broken'}
      <div class="notice">
        <span>This share link is damaged and could not be opened.</span>
        <button class="icon" onclick={() => (notice = null)} aria-label="Dismiss">✕</button>
      </div>
    {/if}
    <div class="editor-wrap">
      <Editor value={code} onchange={onEdit} onrun={run} {error} />
    </div>
    <Console entries={logs} bind:open={consoleOpen} onclear={() => (logs = [])} />
    {#if error}
      <pre class="error" role="alert">{error.line ? 'Line ' + error.line + ': ' : ''}{error.message}</pre>
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
    <!-- Wait for the saved code: starting the default sketch and then replacing it
         right away raced, leaving a stale or empty preview after a refresh. -->
    {#if loaded}
      <Preview code={appliedCode} {runId} onerror={(e) => (error = e)} {onlog} onreset={() => (logs = [])} extraTools={shareButton} />
    {/if}
  </section>
</div>
{/if}

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

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
  .share {
    position: relative;
  }
  /* Same size as the preview toolbar buttons it sits next to. */
  .share > button.icon {
    padding: 4px 8px;
  }
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 6px);
    z-index: 20;
    display: flex;
    flex-direction: column;
    min-width: 240px;
    padding: 4px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .menu button {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 6px 10px;
    text-align: left;
    background: none;
    border: 1px solid transparent;
  }
  .menu button:hover {
    background: var(--bg);
    border-color: var(--border);
  }
  .menu small {
    color: var(--muted);
    font-size: 11px;
  }
  .notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    font-size: 13px;
    background: rgba(245, 184, 61, 0.12);
    border-bottom: 1px solid var(--border);
  }
  .notice span {
    flex: 1;
  }
  .toast {
    position: fixed;
    left: 50%;
    bottom: 40px;
    z-index: 30;
    transform: translateX(-50%);
    max-width: min(520px, 90vw);
    padding: 8px 14px;
    font-size: 13px;
    color: var(--text);
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  }
  .embed {
    position: relative;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  .embed-error {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
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
