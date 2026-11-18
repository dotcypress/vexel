<script lang="ts">
  import favicon from '#lib/assets/favicon.svg';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
  :global(:root) {
    --bg: #15171e;
    --panel: #1c1f28;
    --border: #2c303c;
    --text: #d7dae0;
    --muted: #8b91a1;
    --accent: #5b6cf0;
    /* Height of the bars along the bottom: the console bar and the preview hint bar. */
    --bottom-bar-height: 28px;
    color-scheme: dark;
  }
  :global(html, body) {
    margin: 0;
    height: 100%;
    background: var(--bg);
    color: var(--text);
    font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
</style>
