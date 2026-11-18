// A tiny syntax highlighter for the short JavaScript snippets in the help. It understands
// comments, strings, numbers, keywords, constants and function calls, which is all those
// snippets use. It is not a general JavaScript tokenizer: there is no support for template
// strings or regular expression literals.

const KEYWORDS = new Set([
  'const',
  'let',
  'var',
  'if',
  'else',
  'for',
  'of',
  'in',
  'while',
  'do',
  'return',
  'function',
  'new',
  'break',
  'continue',
  'switch',
  'case',
  'default',
  'typeof',
  'throw',
  'try',
  'catch'
]);

// true, false, null, undefined and the Math constants (PI, E, ...), which sketches use bare.
const CONSTANTS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'NaN',
  'Infinity',
  ...Object.getOwnPropertyNames(Math).filter(
    (name) => typeof (Math as unknown as Record<string, unknown>)[name] !== 'function'
  )
]);

const TOKEN =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|\.\d+\b)|([A-Za-z_$][\w$]*)|(=>|[+\-*/%=<>!&|?:]+)/g;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(kind: string, text: string): string {
  return '<span class="tok-' + kind + '">' + escapeHtml(text) + '</span>';
}

/** Returns HTML for the code, with tokens wrapped in `<span class="tok-...">`. */
export function highlight(code: string): string {
  let out = '';
  let last = 0;
  for (const match of code.matchAll(TOKEN)) {
    const start = match.index;
    out += escapeHtml(code.slice(last, start));
    const text = match[0];
    last = start + text.length;

    if (match[1]) out += wrap('comment', text);
    else if (match[2]) out += wrap('string', text);
    else if (match[3]) out += wrap('number', text);
    else if (match[4]) {
      if (KEYWORDS.has(text)) out += wrap('keyword', text);
      else if (CONSTANTS.has(text)) out += wrap('constant', text);
      // A name directly followed by "(" is a call: helpers, Math functions and methods.
      else if (code[last] === '(') out += wrap('function', text);
      else out += escapeHtml(text);
    } else out += wrap('operator', text);
  }
  return out + escapeHtml(code.slice(last));
}
