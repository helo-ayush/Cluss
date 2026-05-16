# Mermaid Diagram Rendering — Findings & Rules

> This document captures every Mermaid.js rendering issue we encountered while
> integrating AI-generated diagrams into the study platform, the root causes,
> and the fixes applied at both the **prompt level** (backend) and the
> **sanitizer level** (frontend).
>
> **Primary file:** `Frontend/src/components/MarkdownRenderer.jsx` → `MermaidBlock`
> **Prompt file:** `backend/src/services/guidedStudyGenerator.js`

---

## Architecture Overview

```
Gemini AI  ──generates──▶  Mermaid code (inside JSON `body` field)
                                │
                                ▼
              MarkdownRenderer picks up ```mermaid code blocks
                                │
                                ▼
              MermaidBlock component runs sanitizer pipeline
                                │
                                ▼
              mermaid.render() produces SVG
                                │
                                ▼
              SVG injected via dangerouslySetInnerHTML
```

The AI writes Mermaid syntax inside the `body` field of lesson blocks. The
`react-markdown` pipeline detects ` ```mermaid ` fenced blocks, routes them to
`<MermaidBlock>`, which sanitizes and renders them.

---

## Known Crash Patterns & Fixes

### 1. Mindmap Diagrams — "There can be only one root"

**Error:**
```
Error: There can be only one root. No parent could be found for ("e.g., Rolling a die")
```

**Root cause:** Mermaid's `mindmap` parser is extremely fragile. It uses
**indentation-based parsing** (like Python), so:
- A comma inside a label (e.g., `Rolling a die, Flipping a coin`) breaks it.
- Parentheses inside labels (e.g., `P(A)`) make the parser think it's a node
  shape delimiter.
- Inconsistent indentation (tabs vs spaces) silently corrupts the tree.

**Prompt fix:** Banned `mindmap` entirely. The prompt now says:
```
Types: DO NOT USE mindmap. Stick strictly to flowcharts (graph TD) and sequenceDiagram.
```

**Frontend fix:** If the AI ignores the instruction, the sanitizer auto-converts
`mindmap` syntax into a `graph TD` flowchart by:
1. Parsing each line's indentation depth.
2. Building node IDs and labels.
3. Connecting children to parents based on indent level.

```js
// Pseudocode of the conversion
if (/^\s*mindmap\b/i.test(safeCode)) {
  // parse indentation tree → generate "graph TD" with nodes + edges
}
```

**Status:** ✅ Fixed (prompt ban + frontend auto-conversion)

---

### 2. Spaces Inside Shape Brackets — Parse Error on `{ "text" }`

**Error:**
```
Parse error on line 3:
... -- Overlap --> C{ "A and B" }; B(("Eve
-----------------------^
Expecting 'SQE', 'DOUBLECIRCLEEND', ... got 'STR'
```

**Root cause:** Mermaid's parser does NOT tolerate spaces between a shape
delimiter and a quoted label. These are **invalid**:

```mermaid
C{ "A and B" }     ❌  space after { and before }
B(( "Event" ))     ❌  space after (( and before ))
A[ "Label" ]       ❌  space after [ and before ]
```

These are **valid**:
```mermaid
C{"A and B"}       ✅
B(("Event"))       ✅
A["Label"]         ✅
```

**Prompt fix:** Added explicit rule:
```
CRITICAL: NEVER put spaces inside the shape brackets.
Use A["Text"] NOT A[ "Text" ], use B{"Text"} NOT B{ "Text" }.
```

**Frontend fix:** Regex collapses whitespace inside all four shape types:
```js
safeCode = safeCode.replace(/\{\s+"([^"]*?)"\s+\}/g, '{"$1"}');
safeCode = safeCode.replace(/\(\(\s+"([^"]*?)"\s+\)\)/g, '(("$1"))');
safeCode = safeCode.replace(/\(\s+"([^"]*?)"\s+\)/g, '("$1")');
safeCode = safeCode.replace(/\[\s+"([^"]*?)"\s+\]/g, '["$1"]');
```

**Status:** ✅ Fixed (prompt + frontend sanitizer)

---

### 3. Unquoted Labels with Special Characters

**Error:**
```
Parse error: A[You (The User)] — unexpected token
```

**Root cause:** Parentheses `()`, braces `{}`, angle brackets `<>`, pipes `|`,
commas `,`, and semicolons `;` inside node labels clash with Mermaid's shape
and link syntax.

**Prompt fix:**
```
CRITICAL: ALWAYS wrap node labels in double quotes.
Example: A["You (The User)"] instead of A[You (The User)].
```

**Frontend fix (bracket nodes `[...]`):**
```js
safeCode = safeCode.replace(/\[([^\]]+)\]/g, (match, inner) => {
  if (inner.startsWith('"') || inner.startsWith("'")) return match; // already quoted
  if (/[(){}=<>,;|]/.test(inner)) return `["${inner.trim()}"]`;
  return match;
});
```

**Frontend fix (diamond nodes `{...}`):**
```js
safeCode = safeCode.replace(/(\w)\{([^}]+)\}/g, (match, prefix, inner) => {
  if (inner.startsWith('"') || inner.startsWith("'")) return match;
  if (/[()=<>,;|[\]]/.test(inner)) return `${prefix}{"${inner.trim()}"}`;
  return match;
});
```

**Status:** ✅ Fixed (prompt + frontend sanitizer)

---

### 4. HTML Tags in Diagram Code

**Root cause:** The AI sometimes injects `<br/>`, `<b>`, or `<i>` tags inside
Mermaid labels. Mermaid has no HTML parser and crashes immediately.

**Frontend fix:**
```js
safeCode = safeCode.replace(/<br\s*\/?>/gi, ' ');
safeCode = safeCode.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');
```

**Status:** ✅ Fixed (frontend sanitizer only)

---

### 5. Double-Quote Cascading Artifacts

**Root cause:** When multiple sanitizer passes run in sequence, a label like
`(("text"))` can become `("("text")")` after a regex re-processes an already-
fixed node.

**Frontend fix:** Final cleanup pass collapses nested quotes:
```js
safeCode = safeCode.replace(/\("\("([^"]*?)"\)"\)/g, '("$1")');
safeCode = safeCode.replace(/\["\["([^"]*?)"\]"\]/g, '["$1"]');
```

**Status:** ✅ Fixed (frontend sanitizer)

---

## Sanitizer Pipeline Order

The sanitizer in `MermaidBlock` runs these steps **in order**:

| Step | What it does |
|------|-------------|
| 0 | Convert `mindmap` → `graph TD` flowchart |
| 1 | Strip all HTML tags (`<br/>`, `<b>`, etc.) |
| 2 | Collapse excessive whitespace |
| 3 | Fix spaces inside shape delimiters (`{ "x" }` → `{"x"}`) |
| 4 | Force-quote unquoted `[...]` labels with special chars |
| 5 | Force-quote unquoted `{...}` diamond labels with special chars |
| 6 | Collapse double-quote cascading artifacts |

> **Important:** Step order matters. HTML stripping (1) must happen before
> whitespace normalization (2). Shape delimiter fixing (3) must happen before
> force-quoting (4/5) to avoid double-processing.

---

## Mermaid Configuration

Located at the top of `MarkdownRenderer.jsx`:

```js
mermaid.initialize({
  startOnLoad: false,           // We render manually via mermaid.render()
  theme: 'base',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    padding: 20,
  },
  themeVariables: {
    fontFamily: '"Poppins", ui-sans-serif, system-ui, sans-serif',
    primaryColor: '#eef2ff',
    primaryBorderColor: '#4338ca',
    primaryTextColor: '#1e293b',
    lineColor: '#64748b',
    secondaryColor: '#f8fafc',
    tertiaryColor: '#f1f5f9',
  },
  securityLevel: 'loose',       // Required for click events / links
});
```

---

## Safe Diagram Types

| Type | Safe? | Notes |
|------|-------|-------|
| `graph TD` / `graph LR` | ✅ Yes | Most reliable. Use for all hierarchies and flows. |
| `sequenceDiagram` | ✅ Yes | Works well. Labels don't use shape delimiters. |
| `erDiagram` | ⚠️ Caution | Generally works but AI sometimes generates invalid relationship syntax. |
| `mindmap` | ❌ Banned | Indentation-based parsing is too fragile for AI output. Auto-converted to flowchart. |
| `pie` | ⚠️ Caution | Works if AI follows the strict `"Label" : value` format. |
| `classDiagram` | ⚠️ Caution | Works for simple cases, but complex generics `<T>` can crash. |

---

## Prompt Rules Summary

These rules are embedded in `guidedStudyGenerator.js` under the
"Requirements for Visual & Rich Formatting" section:

1. **Use flowcharts and sequence diagrams only.** Never use `mindmap`.
2. **Always wrap labels in double quotes.** `A["Label"]` not `A[Label]`.
3. **No spaces inside shape brackets.** `A["Text"]` not `A[ "Text" ]`.
4. **Diagrams must be syntactically valid** before being returned.

---

## Future Considerations

- **If adding new diagram types** (e.g., `gantt`, `pie`), test them
  extensively with AI-generated content before enabling.
- **The sanitizer is a safety net**, not a replacement for good prompts.
  Always fix the prompt first, then add a frontend fallback.
- **erDiagram** could be re-enabled in prompts but needs its own sanitizer
  rules for relationship syntax (`||--o{`, etc.).
- **If upgrading Mermaid**, re-test all sanitizer regexes — the parser
  behavior can change between versions.
