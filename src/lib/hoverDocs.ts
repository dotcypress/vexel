import { hoverTooltip, type Tooltip } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { Completion } from '@codemirror/autocomplete';
import { HELP_CATEGORIES, type Helper } from './helpData';
import { highlight } from './highlight';
import {
  CTX_MEMBERS,
  FRAME_MEMBERS,
  MATH,
  MOUSE_MEMBERS,
  SKETCH,
  VIEW_MEMBERS
} from './completionData';

type Doc = { signature: string; text: string; example?: string };

// Help entries by name. A signature such as 'add(a, b), sub(a, b)' documents both names,
// and 'mouse.clicked' documents a member.
const HELP = new Map<string, Doc>();
for (const category of HELP_CATEGORIES) {
  for (const helper of category.helpers) {
    for (const name of helperNames(helper)) {
      if (!HELP.has(name)) HELP.set(name, helper);
    }
  }
}

function helperNames(helper: Helper): string[] {
  const names = [...helper.signature.matchAll(/(?:^|,\s*)([A-Za-z_$][\w$.]*)\s*\(/g)].map((m) => m[1]);
  if (!names.length) {
    const bare = /^[A-Za-z_$][\w$.]*/.exec(helper.signature);
    if (bare) names.push(bare[0]);
  }
  return names;
}

// Everything else autocomplete knows about: globals, Math members and object members.
function fromCompletion(c: Completion, prefix = ''): Doc {
  const info = typeof c.info === 'string' ? c.info : '';
  const signature = prefix + c.label + (c.type === 'function' || c.type === 'method' ? c.detail ?? '()' : '');
  return { signature, text: info };
}

const GLOBALS = new Map<string, Doc>();
for (const c of [...SKETCH, ...MATH]) GLOBALS.set(c.label, fromCompletion(c));

const MEMBERS: Record<string, Completion[]> = {
  view: VIEW_MEMBERS,
  mouse: MOUSE_MEMBERS,
  frame: FRAME_MEMBERS,
  ctx: CTX_MEMBERS
};

const SKIP_NODES = new Set(['String', 'TemplateString', 'LineComment', 'BlockComment', 'RegExp']);

function lookup(object: string | null, name: string): Doc | null {
  if (object) {
    const help = HELP.get(object + '.' + name);
    if (help) return help;
    const member = MEMBERS[object]?.find((c) => c.label === name);
    return member ? fromCompletion(member, object + '.') : null;
  }
  return HELP.get(name) ?? GLOBALS.get(name) ?? null;
}

// The sketch's own declarations win over helpers of the same name (const angle = ...).
function declaredInSketch(doc: string, name: string): boolean {
  const escaped = name.replace(/\$/g, '\\$');
  return new RegExp('\\b(?:const|let|var|function|class)\\s+' + escaped + '\\b').test(doc);
}

function render(doc: Doc): HTMLElement {
  const dom = document.createElement('div');
  dom.className = 'vexel-doc';
  const signature = document.createElement('code');
  signature.className = 'vexel-doc-signature';
  signature.innerHTML = highlight(doc.signature);
  dom.append(signature);
  if (doc.text) {
    const text = document.createElement('p');
    text.textContent = doc.text;
    dom.append(text);
  }
  if (doc.example) {
    const example = document.createElement('pre');
    example.className = 'vexel-doc-example';
    example.innerHTML = highlight(doc.example);
    dom.append(example);
  }
  return dom;
}

/** Shows a helper's Help entry when the pointer rests on its name in the editor. */
export const hoverDocs = hoverTooltip(
  (view, pos, side): Tooltip | null => {
    const { from, text } = view.state.doc.lineAt(pos);
    let start = pos - from;
    let end = pos - from;
    while (start > 0 && /[\w$]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w$]/.test(text[end])) end++;
    if (start === end || (start === pos - from && side < 0) || (end === pos - from && side > 0)) return null;
    const name = text.slice(start, end);
    if (/^\d/.test(name)) return null;

    const node = syntaxTree(view.state).resolveInner(pos, side);
    if (SKIP_NODES.has(node.name)) return null;

    let object: string | null = null;
    if (text[start - 1] === '.') {
      const before = /([A-Za-z_$][\w$]*)\s*\.$/.exec(text.slice(0, start));
      if (!before) return null;
      object = before[1];
      if (object === 'Math') object = null;
      else if (!MEMBERS[object]) return null;
    } else if (declaredInSketch(view.state.doc.toString(), name)) {
      return null;
    }

    const doc = lookup(object, name);
    if (!doc) return null;
    return {
      pos: from + start,
      end: from + end,
      above: true,
      create: () => ({ dom: render(doc) })
    };
  },
  { hoverTime: 350 }
);
