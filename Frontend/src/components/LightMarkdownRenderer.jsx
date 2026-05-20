import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import { Check, Copy, Search, AlertCircle, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import 'katex/dist/katex.min.css';

// Mermaid configuration
const mermaidConfig = {
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'default',
  flowchart: { useMaxWidth: true, htmlLabels: true, padding: 20, curve: 'basis' },
  sequence: {
    useMaxWidth: true, actorFontWeight: 700, noteFontWeight: 600, messageFontWeight: 600,
    actorFontFamily: '"Outfit", "Inter", sans-serif',
    noteFontFamily: '"Outfit", "Inter", sans-serif',
    messageFontFamily: '"Outfit", "Inter", sans-serif',
  },
  themeVariables: {
    fontFamily: '"Outfit", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    primaryColor: '#f4f4f5',
    primaryBorderColor: '#a1a1aa',
    primaryTextColor: '#27272a',
    lineColor: '#71717a',
    edgeLabelBackground: '#f4f4f5',
    secondaryColor: '#e4e4e7',
    secondaryBorderColor: '#a1a1aa',
    secondaryTextColor: '#3f3f46',
    tertiaryColor: '#d4d4d8',
    tertiaryBorderColor: '#a1a1aa',
    tertiaryTextColor: '#52525b',
    actorBkg: '#f4f4f5', actorBorder: '#a1a1aa', actorTextColor: '#27272a', actorLineColor: '#a1a1aa',
    signalColor: '#3f3f46', signalTextColor: '#3f3f46',
    labelBoxBkgColor: '#fafafa', labelBoxBorderColor: '#a1a1aa', labelTextColor: '#27272a',
    loopTextColor: '#52525b',
    noteBorderColor: '#a1a1aa', noteBkgColor: '#f4f4f5', noteTextColor: '#27272a',
    activationBorderColor: '#a1a1aa', activationBkgColor: '#fafafa',
    classText: '#27272a',
  },
  themeCSS: `
    .node rect, .node polygon, .node circle, .node ellipse, .node path {
      rx: 12px !important; ry: 12px !important; stroke-width: 2px !important;
      fill: #f4f4f5 !important; stroke: #a1a1aa !important;
    }
    .node .label, .node .label div, .node .label text, .node text,
    .label foreignObject div, .label foreignObject span, .nodeLabel {
      font-weight: 700 !important; color: #27272a !important; fill: #27272a !important;
    }
    .edgePath .path, .flowchart-link, path.path {
      stroke: #71717a !important; stroke-width: 2.5px !important;
    }
    .marker, .arrowheadPath, defs marker path {
      fill: #71717a !important; stroke: #71717a !important;
    }
    .edgeLabel, .edgeLabel rect, .edgeLabel foreignObject, .edgeLabel .label {
      background: #f4f4f5 !important; background-color: #f4f4f5 !important;
      color: #3f3f46 !important; fill: #f4f4f5 !important;
      border-radius: 8px !important; font-weight: 700 !important;
    }
    .edgeLabel foreignObject div {
      background: #f4f4f5 !important; color: #3f3f46 !important;
      border-radius: 8px !important; padding: 3px 10px !important;
      font-weight: 700 !important; border: 1px solid #d4d4d855 !important;
      display: inline-block !important;
    }
    .actor text, text.actor { fill: #27272a !important; color: #27272a !important; font-weight: 700 !important; }
    .messageText, text.messageText, .labelText, text.labelText {
      fill: #3f3f46 !important; color: #3f3f46 !important; font-weight: 600 !important;
    }
    .loopText, .loopText > tspan { fill: #52525b !important; }
    .noteText, text.noteText { fill: #27272a !important; }
    rect.actor { fill: #f4f4f5 !important; stroke: #a1a1aa !important; stroke-width: 2px !important; }
    .messageLine0, .messageLine1 { stroke: #71717a !important; stroke-width: 2px !important; }
    line.actor-line, line { stroke: #d4d4d8 !important; }
    .cluster-label text, .cluster text { fill: #52525b !important; font-weight: 700 !important; }
  `,
  securityLevel: 'loose',
};

// Initialize with config
mermaid.initialize(mermaidConfig);

// Helper to recursively parse flowchart connections in a line
function parseLine(line) {
  const arrowRegex = /(?:-->|-.->|==>|->)(?:\s*\|([^|]+)\|)?|--\s*([^-\>]+)\s*(?:-->|-.->|==>|->)/;
  const match = line.match(arrowRegex);
  if (match) {
    const arrow = match[0];
    const label = match[1] || match[2] || '';
    const index = line.indexOf(arrow);
    const leftPart = line.substring(0, index).trim();
    const rightPart = line.substring(index + arrow.length).trim();
    return {
      hasEdge: true,
      left: leftPart,
      right: rightPart,
      edgeLabel: label,
      arrowType: arrow.includes('==>') ? '==>' : arrow.includes('-.->') ? '-.->' : '-->'
    };
  }
  return { hasEdge: false, content: line.trim() };
}

// Helper to parse a single node part like A["My Label"]
function parseNodePart(part) {
  part = part.trim();
  if (!part) return null;

  // 1. Check if the part starts with a standard node ID and shape: e.g. A["Label"], B(("Label"))
  const standardMatch = part.match(/^([a-zA-Z0-9_-]+)\s*(?:(\(\(\s*["']?|\[\s*["']?|\{\s*["']?|["']|\(\s*["']?|\[\s*["']?|\[\(\s*["']?|\{\{\s*["']?|\[\[\s*["']?)(.*?)(?:\s*["']?\)\)|\s*["']?\]|\s*["']?\}|["']|\s*["']?\)|["']?\s*\]|\s*["']?\s*\)\]|\s*["']?\s*\}\}|\s*["']?\s*\]\]))$/);
  
  if (standardMatch) {
    const id = standardMatch[1];
    let label = standardMatch[3] || '';
    let shape = 'box';
    const shapeOpen = standardMatch[2] || '';
    if (shapeOpen.startsWith('((')) shape = 'double-circle';
    else if (shapeOpen.startsWith('([')) shape = 'stadium';
    else if (shapeOpen.startsWith('[[')) shape = 'subroutine';
    else if (shapeOpen.startsWith('[(')) shape = 'database';
    else if (shapeOpen.startsWith('{{')) shape = 'hexagon';
    else if (shapeOpen.startsWith('{')) shape = 'diamond';
    else if (shapeOpen.startsWith('(')) shape = 'round';
    
    label = label.trim();
    if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith("'") && label.endsWith("'"))) {
      label = label.slice(1, -1).trim();
    }
    label = label.replace(/"/g, "'");
    return { id, label, shape };
  }

  // 2. Check if the part is a simple ID with a label but without standard brackets (e.g. A"Label")
  const idLabelMatch = part.match(/^([a-zA-Z0-9_-]+)\s*["'](.*?)["']$/);
  if (idLabelMatch) {
    return { id: idLabelMatch[1], label: idLabelMatch[2].replace(/"/g, "'"), shape: 'box' };
  }

  // 3. If there is no standard ID at the start (e.g. it's just a quoted string `"Random Event"` or raw text `Random Event`)
  let label = part;
  if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith("'") && label.endsWith("'"))) {
    label = label.slice(1, -1).trim();
  }
  
  let shape = 'box';
  if (label.startsWith('((') && label.endsWith('))')) {
    shape = 'double-circle';
    label = label.slice(2, -2);
  } else if (label.startsWith('([') && label.endsWith('])')) {
    shape = 'stadium';
    label = label.slice(2, -2);
  } else if (label.startsWith('[[') && label.endsWith(']]')) {
    shape = 'subroutine';
    label = label.slice(2, -2);
  } else if (label.startsWith('[(') && label.endsWith(')]')) {
    shape = 'database';
    label = label.slice(2, -2);
  } else if (label.startsWith('{{') && label.endsWith('}}')) {
    shape = 'hexagon';
    label = label.slice(2, -2);
  } else if (label.startsWith('{') && label.endsWith('}')) {
    shape = 'diamond';
    label = label.slice(1, -1);
  } else if (label.startsWith('(') && label.endsWith(')')) {
    shape = 'round';
    label = label.slice(1, -1);
  } else if (label.startsWith('[') && label.endsWith(']')) {
    shape = 'box';
    label = label.slice(1, -1);
  }

  label = label.trim();
  if ((label.startsWith('"') && label.endsWith('"')) || (label.startsWith("'") && label.endsWith("'"))) {
    label = label.slice(1, -1).trim();
  }
  label = label.replace(/"/g, "'");

  // Generate clean alphanumeric ID from the label
  let id = label.replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) {
    id = 'node_' + Math.random().toString(36).substr(2, 5);
  }

  return { id, label, shape };
}

// Helper to parse all flowchart data from a diagram code string
function parseFlowchartData(code) {
  try {
    const lines = code.split('\n');
    const nodesMap = new Map();
    const edgesList = [];
    let direction = 'TD';

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      const dirMatch = line.match(/^\s*(?:graph|flowchart)\s+(TD|LR|BT|RL|TB)\b/i);
      if (dirMatch) {
        direction = dirMatch[1].toUpperCase();
        const remaining = line.substring(dirMatch[0].length).trim();
        if (remaining) {
          line = remaining;
        } else {
          continue;
        }
      }

      if (line.startsWith('%%') || line.startsWith('style') || line.startsWith('classDef') || line.startsWith('class') || line.startsWith('linkStyle') || line.startsWith('subgraph') || line.startsWith('end')) {
        continue;
      }

      let currentLine = line;
      let iterations = 0;
      while (iterations < 10) {
        const parsed = parseLine(currentLine);
        if (parsed.hasEdge) {
          const leftNode = parseNodePart(parsed.left);
          if (leftNode) {
            if (!nodesMap.has(leftNode.id) || leftNode.label) {
              nodesMap.set(leftNode.id, leftNode);
            }
          }

          const rightNextParsed = parseLine(parsed.right);
          const rightImmediateNodePart = rightNextParsed.hasEdge ? rightNextParsed.left : parsed.right;
          const rightNode = parseNodePart(rightImmediateNodePart);

          if (rightNode) {
            if (!nodesMap.has(rightNode.id) || rightNode.label) {
              nodesMap.set(rightNode.id, rightNode);
            }
            edgesList.push({
              from: leftNode ? leftNode.id : parsed.left.trim().replace(/[^a-zA-Z0-9_-]/g, ''),
              to: rightNode.id,
              label: parsed.edgeLabel.trim().replace(/"/g, "'"),
              arrowType: parsed.arrowType
            });
          }

          currentLine = parsed.right;
          iterations++;
        } else {
          const node = parseNodePart(parsed.content);
          if (node) {
            if (!nodesMap.has(node.id) || node.label) {
              nodesMap.set(node.id, node);
            }
          }
          break;
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesList,
      direction
    };
  } catch (err) {
    console.error('Failed to parse flowchart data:', err);
    return { nodes: [], edges: [], direction: 'TD' };
  }
}

// Reconstruct perfectly valid flowchart code
function reconstructFlowchart(code) {
  try {
    const data = parseFlowchartData(code);
    if (data.nodes.length === 0) return code;

    let output = `flowchart ${data.direction}\n`;
    for (const node of data.nodes) {
      const label = node.label || node.id;
      let shapeOpen = '[';
      let shapeClose = ']';
      if (node.shape === 'double-circle') { shapeOpen = '(('; shapeClose = '))'; }
      else if (node.shape === 'stadium') { shapeOpen = '(['; shapeClose = '])'; }
      else if (node.shape === 'subroutine') { shapeOpen = '[['; shapeClose = ']]'; }
      else if (node.shape === 'database') { shapeOpen = '[('; shapeClose = ')]'; }
      else if (node.shape === 'hexagon') { shapeOpen = '{{'; shapeClose = '}}'; }
      else if (node.shape === 'diamond') { shapeOpen = '{'; shapeClose = '}'; }
      else if (node.shape === 'round') { shapeOpen = '('; shapeClose = ')'; }

      output += `  ${node.id}${shapeOpen}"${label}"${shapeClose}\n`;
    }

    for (const edge of data.edges) {
      const edgeLabel = edge.label ? `|"${edge.label}"| ` : '';
      output += `  ${edge.from} ${edge.arrowType}${edgeLabel}${edge.to}\n`;
    }

    return output;
  } catch (err) {
    console.error('Reconstruction failed:', err);
    return code;
  }
}

function InteractiveFallbackMap({ data, theme = 'dark' }) {
  const [selectedId, setSelectedId] = useState(data.nodes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const activeNode = data.nodes.find(n => n.id === selectedId) || data.nodes[0];

  const filteredNodes = data.nodes.filter(node => {
    const label = node.label || node.id;
    return label.toLowerCase().includes(searchQuery.toLowerCase()) || node.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const incomingEdges = selectedId ? data.edges.filter(e => e.to === selectedId) : [];
  const outgoingEdges = selectedId ? data.edges.filter(e => e.from === selectedId) : [];

  const getNodeLabel = (id) => {
    const node = data.nodes.find(n => n.id === id);
    return node ? (node.label || node.id) : id;
  };

  const getNodeShapeIcon = (node) => {
    if (!node) return null;
    if (node.shape === 'diamond') return <div className="h-3 w-3 rotate-45 border border-indigo-400 bg-indigo-500/10" />;
    if (node.shape === 'double-circle' || node.shape === 'circle' || node.shape === 'round') {
      return <div className="h-3 w-3 rounded-full border border-indigo-400 bg-indigo-500/10" />;
    }
    return <div className="h-3 w-3 border border-indigo-400 bg-indigo-500/10 rounded-sm" />;
  };

  if (data.nodes.length === 0) {
    return (
      <div className="my-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center text-sm text-amber-400">
        <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-80" />
        <p className="font-bold">No visual structure could be parsed from this diagram.</p>
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <div className={`my-6 overflow-hidden rounded-2xl border ${isDark ? 'border-zinc-800 bg-[#0c0d0f] text-zinc-300' : 'border-slate-200 bg-white text-slate-700'} shadow-lg transition-all`}>
      <div className={`flex flex-wrap items-center justify-between border-b ${isDark ? 'border-zinc-800/80 bg-zinc-900/35' : 'border-slate-200 bg-slate-50/50'} px-5 py-3.5`}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 items-center justify-center rounded-full bg-indigo-500/15 px-2.5 text-[10px] font-black uppercase tracking-wider text-indigo-400">
            Concept Map
          </div>
          <span className={`text-[12px] font-semibold ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Interactive Flow Explorer</span>
        </div>
        <div className={`text-[11px] font-medium ${isDark ? 'text-zinc-500' : 'text-slate-400'} italic`}>
          Click nodes to navigate steps
        </div>
      </div>

      <div className="flex flex-col md:flex-row min-h-[350px]">
        <div className={`w-full md:w-80 border-r ${isDark ? 'border-zinc-800/60' : 'border-slate-200'} p-4 flex flex-col gap-3`}>
          <div className="relative">
            <Search className={`absolute left-3 top-2.5 h-4 w-4 ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full rounded-xl border py-2 pl-9 pr-4 text-xs outline-none transition-all ${
                isDark 
                  ? 'border-zinc-800/80 bg-zinc-900/40 text-white placeholder-zinc-500 focus:border-indigo-500/50 focus:bg-zinc-900/60' 
                  : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-indigo-500/50 focus:bg-white'
              }`}
            />
          </div>

          <div className="custom-scroll flex-1 max-h-[300px] overflow-y-auto pr-1 space-y-1.5">
            {filteredNodes.map((node) => {
              const isActive = node.id === selectedId;
              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedId(node.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-indigo-500/10 border-l-[3px] border-l-indigo-500 text-white pl-2'
                        : 'bg-indigo-50 border-l-[3px] border-l-indigo-600 text-indigo-900 pl-2'
                      : isDark
                        ? 'bg-transparent border-l-[3px] border-l-transparent text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'
                        : 'bg-transparent border-l-[3px] border-l-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {getNodeShapeIcon(node)}
                  <span className="truncate flex-1">{node.label || node.id}</span>
                </button>
              );
            })}
            {filteredNodes.length === 0 && (
              <div className={`text-center py-8 text-xs ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                No matching concepts found
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 p-6 flex flex-col justify-between ${isDark ? 'bg-zinc-950/20' : 'bg-slate-50/20'}`}>
          {activeNode ? (
            <div className="space-y-6">
              <div className={`rounded-2xl border p-5 shadow-sm transition-all ${
                isDark 
                  ? 'border-indigo-500/20 bg-gradient-to-br from-[#121316] to-[#0e0f12] shadow-indigo-950/10' 
                  : 'border-indigo-100 bg-gradient-to-br from-indigo-50/20 to-white shadow-indigo-100/50'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                  Selected Concept
                </span>
                <h3 className={`mt-1.5 text-lg font-black tracking-tight leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {activeNode.label || activeNode.id}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Preceded By
                  </span>
                  <div className="space-y-2">
                    {incomingEdges.map((edge, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedId(edge.from)}
                        className={`w-full flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                          isDark
                            ? 'border-zinc-800 bg-[#0e0f12]/60 hover:bg-zinc-900/60 hover:border-zinc-700/80 text-zinc-300'
                            : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-indigo-400 inline-flex items-center gap-1">
                          ← {edge.label ? `[${edge.label}]` : 'leads to selected'}
                        </span>
                        <span className="text-xs font-bold truncate w-full">{getNodeLabel(edge.from)}</span>
                      </button>
                    ))}
                    {incomingEdges.length === 0 && (
                      <div className={`rounded-xl border border-dashed py-6 text-center text-xs ${isDark ? 'border-zinc-800/80 text-zinc-600' : 'border-slate-200/80 text-slate-400'}`}>
                        Starting point (no parent nodes)
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
                    Leads To
                  </span>
                  <div className="space-y-2">
                    {outgoingEdges.map((edge, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedId(edge.to)}
                        className={`w-full flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                          isDark
                            ? 'border-indigo-500/10 bg-[#0e0f12]/60 hover:bg-indigo-500/5 hover:border-indigo-500/30 text-zinc-300'
                            : 'border-slate-200 bg-white hover:bg-indigo-50/20 hover:border-indigo-300 text-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-indigo-400 inline-flex items-center gap-1">
                          {edge.label ? `[${edge.label}]` : 'leads next'} →
                        </span>
                        <span className="text-xs font-bold truncate w-full">{getNodeLabel(edge.to)}</span>
                      </button>
                    ))}
                    {outgoingEdges.length === 0 && (
                      <div className={`rounded-xl border border-dashed py-6 text-center text-xs ${isDark ? 'border-zinc-800/80 text-zinc-600' : 'border-slate-200/80 text-slate-400'}`}>
                        End point (no sub-concepts)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`text-center py-12 text-sm ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
              Select a concept from the list to explore
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MermaidBlock({ code }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const [fallbackData, setFallbackData] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const cleanLeakedMermaidElements = () => {
      const leakedElements = document.querySelectorAll(
        'body > [id^="mermaid-"], body > [id^="dmermaid-"], body > .mermaid, body > .mermaid-error, body > div[id^="dmermaid-"]'
      );
      leakedElements.forEach(el => {
        try {
          el.remove();
        } catch (e) {
          // ignore
        }
      });
    };

    const renderDiagram = async () => {
      cleanLeakedMermaidElements();

      // Enforce light theme configurations before parsing & rendering to prevent other renderers from overriding it
      mermaid.initialize(mermaidConfig);

      let safeCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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
          if (!label || /^::icon/i.test(label)) continue;

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
          safeCode = `graph TD\n${nodeDefs}\n${edgeDefs}`;
        }
      }

      safeCode = safeCode.replace(/<br\s*\/?>/gi, ' ');
      safeCode = safeCode.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');
      safeCode = safeCode.replace(/[ \t]{2,}/g, ' ');
      safeCode = safeCode.replace(/\{\s+"([^"]*?)"\s+\}/g, '{"$1"}');
      safeCode = safeCode.replace(/\(\(\s+"([^"]*?)"\s+\)\)/g, '(("$1"))');
      safeCode = safeCode.replace(/\(\s+"([^"]*?)"\s+\)/g, '("$1")');
      safeCode = safeCode.replace(/\[\s+"([^"]*?)"\s+\]/g, '["$1"]');

      safeCode = safeCode.replace(/\[([^\]]+)\]/g, (match, inner) => {
        if (inner.startsWith('"') || inner.startsWith("'")) return match;
        if (/[(){}=<>,;|]/.test(inner)) return `["${inner.trim()}"]`;
        return match;
      });

      safeCode = safeCode.replace(/(\w)\{([^}]+)\}/g, (match, prefix, inner) => {
        if (inner.startsWith('"') || inner.startsWith("'")) return match;
        if (/[()=<>,;|[\]]/.test(inner)) return `${prefix}{"${inner.trim()}"}`;
        return match;
      });

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

      try {
        await mermaid.parse(safeCode);
        const id = `mermaid-light-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: svgOutput } = await mermaid.render(id, safeCode);
        if (svgOutput && svgOutput.includes("Syntax error in text")) {
          throw new Error("Mermaid returned a syntax error placeholder SVG");
        }
        if (isMounted) {
          setSvg(svgOutput);
          setError(false);
          setFallbackData(null);
        }
        return;
      } catch (err) {
        console.warn('Standard Light Mermaid rendering failed, attempting recovery...', err);
        cleanLeakedMermaidElements();
      }

      try {
        const reconstructed = reconstructFlowchart(safeCode);
        await mermaid.parse(reconstructed);
        const id = `mermaid-light-reconstructed-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: svgOutput } = await mermaid.render(id, reconstructed);
        if (svgOutput && svgOutput.includes("Syntax error in text")) {
          throw new Error("Reconstructed Mermaid returned a syntax error placeholder SVG");
        }
        if (isMounted) {
          setSvg(svgOutput);
          setError(false);
          setFallbackData(null);
        }
        return;
      } catch (err) {
        console.warn('Reconstructed flowchart rendering failed, loading Interactive Fallback...', err);
        cleanLeakedMermaidElements();
      }

      if (isMounted) {
        const parsed = parseFlowchartData(safeCode);
        setFallbackData(parsed);
        setError(true);
      }
    };

    if (code) renderDiagram();
    return () => {
      isMounted = false;
      cleanLeakedMermaidElements();
    };
  }, [code]);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 600, h: 400 });
  const [bboxInfo, setBboxInfo] = useState(null);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lightboxRef = useRef(null);
  const thumbnailRef = useRef(null);
  const lightboxSvgRef = useRef(null);

  const calcAutoFitZoom = useCallback((naturalW, naturalH) => {
    const w = naturalW || (bboxInfo ? bboxInfo.w : naturalSize.w);
    const h = naturalH || (bboxInfo ? bboxInfo.h : naturalSize.h);
    // Card body available area (card = 90vw×80vh capped at 1100×800, minus header 46px + footer 37px)
    const cardW = Math.min(window.innerWidth * 0.9, 1100) - 48;
    const cardH = Math.min(window.innerHeight * 0.8, 800) - 100;
    return Math.min(cardW / Math.max(w, 1), cardH / Math.max(h, 1), 4);
  }, [naturalSize, bboxInfo]);

  const openLightbox = useCallback(() => {
    const container = thumbnailRef.current;
    let w = 600;
    let h = 400;
    let bbox = null;
    if (container) {
      const svgEl = container.querySelector('svg');
      if (svgEl) {
        // Try getting exact bounding box first to exclude extra whitespace
        try {
          const rect = svgEl.getBBox();
          if (rect && rect.width > 0 && rect.height > 0) {
            bbox = {
              x: rect.x - 12,
              y: rect.y - 12,
              w: rect.width + 24,
              h: rect.height + 24
            };
            w = bbox.w;
            h = bbox.h;
          }
        } catch (e) {
          console.warn('Failed to get SVG bounding box:', e);
        }

        // Fallback to viewBox attribute parsing
        if (!bbox) {
          const viewBoxAttr = svgEl.getAttribute('viewBox');
          if (viewBoxAttr) {
            const parts = viewBoxAttr.trim().split(/\s+/);
            if (parts.length === 4) {
              const parsedW = parseFloat(parts[2]);
              const parsedH = parseFloat(parts[3]);
              if (!isNaN(parsedW) && parsedW > 0 && !isNaN(parsedH) && parsedH > 0) {
                w = parsedW;
                h = parsedH;
                bbox = { x: 0, y: 0, w, h };
              }
            }
          }
        }

        // Ultimate fallback
        if (!bbox) {
          const vb = svgEl.viewBox?.baseVal;
          w = (vb && vb.width > 0) ? vb.width
            : (parseFloat(svgEl.getAttribute('width')) || svgEl.getBoundingClientRect().width || 600);
          h = (vb && vb.height > 0) ? vb.height
            : (parseFloat(svgEl.getAttribute('height')) || svgEl.getBoundingClientRect().height || 400);
          bbox = { x: 0, y: 0, w, h };
        }
      }
    }
    setBboxInfo(bbox);
    setNaturalSize({ w, h });
    const targetZoom = calcAutoFitZoom(w, h);
    // Start slightly zoomed out to trigger a beautiful spring scale-in effect
    setZoom(targetZoom * 0.85);
    setPan({ x: 0, y: 0 });
    setLightboxOpen(true);

    // Smoothly spring to target fitting zoom
    setTimeout(() => {
      setZoom(targetZoom);
    }, 50);
  }, [calcAutoFitZoom]);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const resetView = useCallback(() => {
    const w = bboxInfo ? bboxInfo.w : naturalSize.w;
    const h = bboxInfo ? bboxInfo.h : naturalSize.h;
    const z = calcAutoFitZoom(w, h);
    setZoom(z);
    setPan({ x: 0, y: 0 });
  }, [calcAutoFitZoom, bboxInfo, naturalSize]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom(z => Math.min(8, Math.max(0.1, z * factor)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);
  const handleTouchMove = useCallback((e) => {
    if (!isPanning || e.touches.length !== 1) return;
    e.preventDefault();
    setPan({
      x: panStart.current.panX + (e.touches[0].clientX - panStart.current.x),
      y: panStart.current.panY + (e.touches[0].clientY - panStart.current.y),
    });
  }, [isPanning]);
  const handleTouchEnd = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const el = lightboxRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [lightboxOpen, handleWheel]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeLightbox(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, closeLightbox]);

  useEffect(() => {
    if (lightboxOpen && lightboxSvgRef.current && bboxInfo) {
      const svgEl = lightboxSvgRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.setAttribute('viewBox', `${bboxInfo.x} ${bboxInfo.y} ${bboxInfo.w} ${bboxInfo.h}`);
      }
    }
  }, [lightboxOpen, bboxInfo]);

  if (error && fallbackData) {
    return <InteractiveFallbackMap data={fallbackData} theme="light" />;
  }

  if (error) {
    return (
      <div className="my-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        <AlertCircle className="mx-auto h-8 w-8 mb-2 text-indigo-500 opacity-80" />
        <p className="font-bold">Failed to load visual diagram.</p>
        <pre className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-slate-100 p-4 text-[11px] text-slate-400 font-mono text-left">{code}</pre>
      </div>
    );
  }

  return (
    <>
      {/* Diagram thumbnail */}
      <div
        className="my-6 group relative cursor-zoom-in overflow-x-auto rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
        style={{
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
        onClick={openLightbox}
        title="Click to expand diagram"
      >
        {svg ? (
          <div ref={thumbnailRef} dangerouslySetInnerHTML={{ __html: svg }} className="w-full flex justify-center [&_svg]:!max-w-full pointer-events-none select-none" />
        ) : (
          <div className="h-32 flex w-full items-center justify-center text-sm text-slate-400">Loading diagram...</div>
        )}
        {svg && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 border border-slate-300 text-slate-600 shadow backdrop-blur-sm">
              <ZoomIn className="w-3 h-3" /> Click to expand
            </span>
          </div>
        )}
      </div>

      {/* Popup Card Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', animation: 'lbBgInL 0.18s ease' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeLightbox(); }}
        >
          <style>{`
            @keyframes lbBgInL { from { opacity: 0; } to { opacity: 1; } }
            @keyframes lbCardInL { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          `}</style>
          {/* Card */}
          <div
            className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'white', border: '1px solid #e4e4e7', width: '90vw', maxWidth: '1100px', height: '80vh', maxHeight: '800px', animation: 'lbCardInL 0.2s cubic-bezier(0.34, 1.3, 0.64, 1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5">
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(0.1, z / 1.25))} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
                <button onClick={() => setZoom(z => Math.min(8, z * 1.25))} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
                <button onClick={resetView} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors" title="Fit to view"><RotateCcw className="w-3.5 h-3.5" /></button>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <button onClick={closeLightbox} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Close (Esc)"><X className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            {/* Card Body */}
            <div
              ref={lightboxRef}
              className="flex-1 overflow-hidden relative"
              style={{
                cursor: isPanning ? 'grabbing' : 'grab',
                backgroundColor: '#fafafa',
                backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-full h-full flex items-center justify-center" style={{ pointerEvents: 'none' }}>
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isPanning ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1)',
                    userSelect: 'none',
                    width: `${naturalSize.w}px`,
                    height: `${naturalSize.h}px`,
                  }}
                >
                  <div
                    ref={lightboxSvgRef}
                    dangerouslySetInnerHTML={{ __html: svg }}
                    className="pointer-events-none select-none w-full h-full [&_svg]:!w-full [&_svg]:!h-full [&_svg]:!max-w-none [&_svg]:!max-h-none"
                  />
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div className="flex items-center justify-center px-4 py-2 border-t border-slate-200 bg-slate-50 shrink-0">
              <span className="text-[11px] text-slate-400">Scroll to zoom · Drag to pan · Esc to close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CodeBlock({ className = '', children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'code';
  const code = String(children || '').replace(/\n$/, '');

  if (language === 'mermaid') {
    return <MermaidBlock code={code} />;
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{language}</span>
      </div>
      <pre className="custom-scroll max-w-full overflow-x-auto p-4 text-[13px] leading-7 text-slate-800">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function LightMarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const components = React.useMemo(() => ({
          p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-7 text-slate-600" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-950" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-slate-700" {...props} />,
          pre: ({ children, ...props }) => {
            if (React.isValidElement(children) && children.props.node?.tagName === 'code') {
              return <CodeBlock className={children.props.className}>{children.props.children}</CodeBlock>;
            }
            return <pre {...props}>{children}</pre>;
          },
          code: ({ node, className, children, ...props }) => (
            <code className={`rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.86em] text-slate-900 ${className || ''}`} {...props}>
              {children}
            </code>
          ),
          ul: ({ node, ...props }) => <ul className="mb-4 list-disc space-y-2 pl-5 text-slate-600" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-slate-600" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1 leading-7" {...props} />,
          h1: ({ node, ...props }) => <h1 className="mb-4 mt-6 text-2xl font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="mb-3 mt-6 text-xl font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="mb-2 mt-5 text-lg font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          h4: ({ node, ...props }) => <h4 className="mb-2 mt-4 text-base font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          a: ({ node, ...props }) => <a className="font-medium text-[#4338ca] underline underline-offset-4 hover:text-[#3730a3]" {...props} />,
          blockquote: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).map(c => c.props?.children || c).join('');
            let borderClass = 'border-slate-900';
            let bgClass = 'bg-slate-100';
            let textClass = 'text-slate-800';
            
            if (text.includes('💡')) {
              borderClass = 'border-indigo-500'; bgClass = 'bg-indigo-50'; textClass = 'text-indigo-900';
            } else if (text.includes('⚠️')) {
              borderClass = 'border-amber-500'; bgClass = 'bg-amber-50'; textClass = 'text-amber-900';
            } else if (text.includes('🔗')) {
              borderClass = 'border-teal-500'; bgClass = 'bg-teal-50'; textClass = 'text-teal-900';
            }
            
            return (
              <blockquote className={`my-6 rounded-r-2xl border-l-4 ${borderClass} ${bgClass} px-5 py-4 text-[15px] leading-7 ${textClass}`} {...props}>
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-slate-50 text-xs uppercase text-slate-500" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-200" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/50" {...props} />,
          th: ({ node, ...props }) => <th className="px-6 py-4 font-semibold text-slate-900" {...props} />,
          td: ({ node, ...props }) => <td className="px-6 py-4 text-slate-600" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-8 border-slate-200" {...props} />,
  }), []);

  return (
    <div className={`markdown-renderer max-w-none break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
