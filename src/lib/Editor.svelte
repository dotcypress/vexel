<script lang="ts" module>
  /** A sketch error, with its 1-based line and column in `code` when the browser reports them. */
  export type SketchError = { message: string; line: number | null; column: number | null; code: string };
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { linter, type Diagnostic } from '@codemirror/lint';
  import { StateEffect } from '@codemirror/state';
  import { syntaxTree } from '@codemirror/language';
  import { EditorView, basicSetup } from 'codemirror';
  import { keymap } from '@codemirror/view';
  import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
  import { sketchCompletions } from './completions';
  import { hoverDocs } from './hoverDocs';
  import { oneDark } from '@codemirror/theme-one-dark';

  let {
    value,
    onchange,
    onrun,
    error = null
  }: {
    value: string;
    onchange: (value: string) => void;
    onrun: () => void;
    /** The latest run's error, underlined in the code while the code is unchanged. */
    error?: SketchError | null;
  } = $props();

  // Squiggles: the first syntax error from the editor's own parse, and the line where the
  // last run threw, as long as the code has not changed since that run.
  const errorChanged = StateEffect.define<null>();
  const sketchLinter = linter(
    (view) => {
      const doc = view.state.doc;
      const found: Diagnostic[] = [];
      syntaxTree(view.state).iterate({
        enter(node) {
          if (found.length || !node.type.isError) return;
          const from = Math.min(node.from, doc.length);
          const line = doc.lineAt(from);
          const to = Math.max(Math.min(node.to, doc.length), Math.min(from + 1, line.to));
          found.push({ from: to > from ? from : Math.max(line.from, from - 1), to: Math.max(to, from), severity: 'error', message: 'Syntax error' });
        }
      });
      if (error?.line && error.code === doc.toString() && error.line <= doc.lines) {
        const line = doc.line(error.line);
        const start = Math.min(line.from + Math.max(0, (error.column ?? 1) - 1), line.to);
        const indent = line.from + (line.text.length - line.text.trimStart().length);
        const from = start < line.to ? start : indent;
        const to = Math.max(line.to, from + 1);
        found.push({ from, to: Math.min(to, doc.length), severity: 'error', message: error.message });
      }
      return found;
    },
    {
      delay: 300,
      needsRefresh: (update) => update.transactions.some((tr) => tr.effects.some((e) => e.is(errorChanged)))
    }
  );

  let host: HTMLDivElement;
  let view: EditorView | undefined;
  // True while the editor is being updated from `value`, so that change is not reported
  // back as an edit (which would schedule a second run).
  let syncing = false;

  onMount(() => {
    view = new EditorView({
      parent: host,
      doc: value,
      extensions: [
        basicSetup,
        javascript(),
        javascriptLanguage.data.of({ autocomplete: sketchCompletions }),
        hoverDocs,
        sketchLinter,
        oneDark,
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onrun();
              return true;
            }
          }
        ]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !syncing) {
            onchange(update.state.doc.toString());
          }
        })
      ]
    });
    return () => view?.destroy();
  });

  // A new error (or none) from the preview: recompute the squiggles right away.
  $effect(() => {
    error;
    view?.dispatch({ effects: errorChanged.of(null) });
  });

  // Sync external changes (e.g. reset) into the editor.
  $effect(() => {
    if (view && value !== view.state.doc.toString()) {
      syncing = true;
      try {
        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
      } finally {
        syncing = false;
      }
    }
  });
</script>

<div class="editor" bind:this={host}></div>

<style>
  .editor {
    height: 100%;
    min-height: 0;
  }
  .editor :global(.cm-editor) {
    height: 100%;
  }
  .editor :global(.cm-tooltip-hover) {
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--panel);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  }
  .editor :global(.vexel-doc) {
    max-width: 440px;
    padding: 8px 10px;
    color: var(--text);
    font: 12px/1.5 system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  .editor :global(.vexel-doc p) {
    margin: 6px 0 0;
    color: #b6bbc8;
  }
  .editor :global(.vexel-doc-signature),
  .editor :global(.vexel-doc-example) {
    font: 12px/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  }
  .editor :global(.vexel-doc-signature) {
    color: var(--text);
  }
  .editor :global(.vexel-doc-example) {
    margin: 8px 0 0;
    padding: 6px 8px;
    max-height: 160px;
    overflow: auto;
    border-radius: 4px;
    background: #1b1d25;
    white-space: pre-wrap;
  }
  /* Token colors match the editor's One Dark theme, like the Help examples. */
  .editor :global(.vexel-doc .tok-comment) {
    color: #7d8799;
    font-style: italic;
  }
  .editor :global(.vexel-doc .tok-string) {
    color: #98c379;
  }
  .editor :global(.vexel-doc .tok-number),
  .editor :global(.vexel-doc .tok-constant) {
    color: #d19a66;
  }
  .editor :global(.vexel-doc .tok-keyword) {
    color: #c678dd;
  }
  .editor :global(.vexel-doc .tok-function) {
    color: #61afef;
  }
  .editor :global(.vexel-doc .tok-operator) {
    color: #56b6c2;
  }
  .editor :global(.cm-tooltip-lint) {
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--panel);
  }
  .editor :global(.cm-diagnostic-error) {
    border-left-color: #e5484d;
    color: #ffb4b4;
    font: 12px/1.5 ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  }
  .editor :global(.cm-scroller) {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 13px;
    line-height: 1.55;
  }
</style>
