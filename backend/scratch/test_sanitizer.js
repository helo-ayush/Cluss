const mindmapCode = `mindmap
  root(("The Process"))
    ::icon(fa fa-cogs)
    A["**Experiment**<br/>(e.g., Rolling a die)"]
      B["**Sample Space (S)**<br/>The set of ALL possible outcomes<br/>e.g., {1, 2, 3, 4, 5, 6}"]
        C["**Event (E)**<br/>A subset of outcomes we care about<br/>e.g., Getting an even number {2, 4, 6}"]
        D["**Another Event (F)**<br/>Another subset we might care about<br/>e.g., Getting a number greater than 4 {5, 6}"]`;

function testClean(safeCode) {
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
      
      let label = stripped.replace(/^[-*]\s*/, '').trim();
      if (/^::icon/i.test(label)) continue; // Skip icon styling entirely
      
      // Clean up common AI mindmap-to-flowchart bracketed prefixes/wrappers
      const nodeWrapperMatch = label.match(/^[a-zA-Z0-9_-]+(?:\(\(\s*["']?|\[\s*["']?|\{\s*["']?|["'])(.*?)(?:\s*["']?\)\)|\s*["']?\]|\s*["']?\}|["'])$/);
      if (nodeWrapperMatch) {
        label = nodeWrapperMatch[1].trim();
      }

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
      return `graph TD\n${nodeDefs}\n${edgeDefs}`;
    }
  }
  return safeCode;
}

console.log(testClean(mindmapCode));
