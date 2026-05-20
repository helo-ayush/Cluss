function testSanitizer(code) {
    // Normalize all line endings to standard Unix \n
    let safeCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    console.log("--- BEFORE SANITIZATION (NORMALIZED) ---");
    console.log(JSON.stringify(safeCode));

    // 0. Convert mindmap → flowchart
    if (/^\s*mindmap\b/i.test(safeCode)) {
        const lines = safeCode.split('\n').filter(l => l.trim());
        const nodes = [];
        const edges = [];
        let nodeId = 0;
        const depthMap = {};

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.replace(/^\s+/, '');
            const indent = line.length - line.trimStart().length;
            const depth = Math.floor(indent / 2);
            const label = stripped.replace(/^[-*]\s*/, '').trim();
            if (!label) continue;

            const id = `N${nodeId++}`;
            nodes.push({ id, label, depth });
            depthMap[depth] = id;

            for (let d = depth - 1; d >= 0; d--) {
                if (depthMap[d]) {
                    edges.push(`${depthMap[d]} --> ${id}`);
                    break;
                }
            }
        }

        if (nodes.length > 0) {
            const nodeDefs = nodes.map(n => `${n.id}["${n.label.replace(/"/g, "'")}"]`).join('\n');
            const edgeDefs = edges.join('\n');
            safeCode = `graph TD\n${nodeDefs}\n${edgeDefs}`;
        }
    }
    console.log("Step 0 (mindmap):", JSON.stringify(safeCode));

    // 1. Strip HTML tags like <br/>, <b>, <i> etc.
    safeCode = safeCode.replace(/<br\s*\/?>/gi, ' ');
    safeCode = safeCode.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');
    console.log("Step 1 (strip html):", JSON.stringify(safeCode));

    // 2. Normalize excessive whitespace left behind by tag stripping
    safeCode = safeCode.replace(/[ \t]{2,}/g, ' ');
    console.log("Step 2 (whitespace):", JSON.stringify(safeCode));

    // 3. Fix spaces inside shape delimiters
    safeCode = safeCode.replace(/\{\s+"([^"]*?)"\s+\}/g, '{"$1"}');
    safeCode = safeCode.replace(/\(\(\s+"([^"]*?)"\s+\)\)/g, '(("$1"))');
    safeCode = safeCode.replace(/\(\s+"([^"]*?)"\s+\)/g, '("`$1`")');
    safeCode = safeCode.replace(/\[\s+"([^"]*?)"\s+\]/g, '["$1"]');
    console.log("Step 3 (delimiters):", JSON.stringify(safeCode));

    // 4. Force-quote unquoted bracket [...] labels
    safeCode = safeCode.replace(/\[([^\]]+)\]/g, (match, inner) => {
        if (inner.startsWith('"') || inner.startsWith("'")) return match;
        if (/[(){}=<>,;|]/.test(inner)) return `["${inner.trim()}"]`;
        return match;
    });
    console.log("Step 4 (bracket quote):", JSON.stringify(safeCode));

    // 5. Force-quote unquoted diamond {...} labels
    safeCode = safeCode.replace(/(\w)\{([^}]+)\}/g, (match, prefix, inner) => {
        if (inner.startsWith('"') || inner.startsWith("'")) return match;
        if (/[()=<>,;|[\]]/.test(inner)) return `${prefix}{"${inner.trim()}"}`;
        return match;
    });
    console.log("Step 5 (diamond quote):", JSON.stringify(safeCode));

    // 6. Fix sequenceDiagram
    if (/^\s*sequenceDiagram\b/i.test(safeCode)) {
        safeCode = safeCode.replace(/(participant|actor)\s+([a-zA-Z0-9_\-\.]+)/gi, (match, type, name) => {
            if (name.startsWith('"')) return match;
            return `${type} "${name}"`;
        });
        safeCode = safeCode.replace(/([a-zA-Z0-9_\-\.]+)\s*(->+|-->>?)\s*([a-zA-Z0-9_\-\.]+)/g, (match, p1, arrow, p2) => {
            const quote = (p) => {
                if (p.startsWith('"')) return p;
                if (p.includes('-') || p.includes('.')) return `"${p}"`;
                return p;
            };
            return `${quote(p1)} ${arrow} ${quote(p2)}`;
        });
    }
    console.log("Step 6 (sequence):", JSON.stringify(safeCode));

    // 7. Strip custom styles and frontmatter config
    safeCode = safeCode.split('\n').filter(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('style ') || 
            trimmed.startsWith('classDef ') || 
            trimmed.startsWith('class ') || 
            trimmed.startsWith('linkStyle ') ||
            trimmed.startsWith('%%')) {
            return false;
        }
        return true;
    }).join('\n');
    console.log("Step 7 (styles):", JSON.stringify(safeCode));

    console.log("\n--- FINAL SANITIZED CODE ---");
    console.log(safeCode);
}

const codeInput = `graph TD\r"Start Problem" --> Q1{"Is the data symmetric?"}\rQ1 -- "Yes (Natural Variation)" --> "Use Normal Distribution"\r"Use Normal Distribution" --> Z["Calculate Z = (X-mu)/sigma"]\rQ1 -- "No (Time/Intervals)" --> Q2{"Is it time between events?"}\rQ2 -- "Yes" --> "Use Exponential Distribution"\r"Use Exponential Distribution" --> P["Use Rate lambda or Scale 1/lambda"]\rQ2 -- "No" --> "Check other distributions (Binomial/Poisson)"`;

testSanitizer(codeInput);
