import type { Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';
import { CTX_MEMBERS, FRAME_MEMBERS, MATH, MOUSE_MEMBERS, SKETCH, VIEW_MEMBERS } from './completionData';

const GLOBALS: Completion[] = [...SKETCH, ...MATH];

const MEMBERS: Record<string, Completion[]> = {
  view: VIEW_MEMBERS,
  mouse: MOUSE_MEMBERS,
  frame: FRAME_MEMBERS,
  ctx: CTX_MEMBERS
};

const SKIP_NODES = new Set([
  'String',
  'TemplateString',
  'LineComment',
  'BlockComment',
  'RegExp'
]);

/**
 * Completion source for sketch code: the runtime's globals and helpers, all
 * Math members, and the properties of view, mouse, frame and ctx.
 */
export function sketchCompletions(context: CompletionContext): CompletionResult | null {
  const node = syntaxTree(context.state).resolveInner(context.pos, -1);
  if (SKIP_NODES.has(node.name)) return null;

  // Member access on a known object: view.|, mouse.|, frame.|, ctx.|
  const member = context.matchBefore(/[A-Za-z_$][\w$]*\.[\w$]*$/);
  if (member) {
    const dot = member.text.indexOf('.');
    const options = MEMBERS[member.text.slice(0, dot)];
    if (!options) return null;
    return { from: member.from + dot + 1, options, validFor: /^[\w$]*$/ };
  }

  const word = context.matchBefore(/[\w$]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  // Property of some other object, e.g. foo.bar: leave it to the default sources.
  if (word.from > 0 && context.state.sliceDoc(word.from - 1, word.from) === '.') return null;

  return { from: word.from, options: GLOBALS, validFor: /^[\w$]*$/ };
}
