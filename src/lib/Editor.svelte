<script lang="ts">
	import { onMount } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { keymap } from '@codemirror/view';
	import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';
	import { sketchCompletions } from './completions';
	import { oneDark } from '@codemirror/theme-one-dark';

	let {
		value,
		onchange,
		onrun
	}: {
		value: string;
		onchange: (value: string) => void;
		onrun: () => void;
	} = $props();

	let host: HTMLDivElement;
	let view: EditorView | undefined;

	onMount(() => {
		view = new EditorView({
			parent: host,
			doc: value,
			extensions: [
				basicSetup,
				javascript(),
				javascriptLanguage.data.of({ autocomplete: sketchCompletions }),
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
					if (update.docChanged) onchange(update.state.doc.toString());
				})
			]
		});
		return () => view?.destroy();
	});

	// Sync external changes (e.g. reset) into the editor.
	$effect(() => {
		if (view && value !== view.state.doc.toString()) {
			view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
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
	.editor :global(.cm-scroller) {
		font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
		font-size: 13px;
		line-height: 1.55;
	}
</style>
