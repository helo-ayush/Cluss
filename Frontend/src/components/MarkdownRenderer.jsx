import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Check, Copy, AlertCircle, X, ZoomIn, ZoomOut, RotateCcw, ChevronRight, Maximize2, Compass } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { PremiumCodeWorkspace } from './CodeChallengeBlock';



// Pure JS Layout Engine for hierarchical concept maps (Bypasses Mermaid completely!)
function computeLayout(nodes, edges, direction = 'TD') {
  if (nodes.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };

  const adj = {};
  const inEdges = {};
  const outEdges = {};
  nodes.forEach(n => {
    adj[n.id] = [];
    inEdges[n.id] = [];
    outEdges[n.id] = [];
  });

  edges.forEach(e => {
    if (adj[e.from] && adj[e.to]) {
      adj[e.from].push(e.to);
      outEdges[e.from].push(e);
      inEdges[e.to].push(e);
    }
  });

  const levels = {};
  nodes.forEach(n => { levels[n.id] = 0; });

  const sources = nodes.filter(n => inEdges[n.id].length === 0).map(n => n.id);
  const startNodes = sources.length > 0 ? sources : [nodes[0].id];

  const visited = new Set();
  const queue = [];
  startNodes.forEach(id => {
    queue.push({ id, level: 0 });
    levels[id] = 0;
    visited.add(id);
  });

  while (queue.length > 0) {
    const { id, level } = queue.shift();
    const children = adj[id] || [];
    children.forEach(childId => {
      const nextLevel = Math.max(levels[childId], level + 1);
      levels[childId] = nextLevel;
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push({ id: childId, level: nextLevel });
      }
    });
  }

  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      levels[n.id] = 0;
    }
  });

  const levelsMap = {};
  nodes.forEach(n => {
    const lvl = levels[n.id];
    if (!levelsMap[lvl]) levelsMap[lvl] = [];
    levelsMap[lvl].push(n);
  });

  const levelIds = Object.keys(levelsMap).map(Number).sort((a, b) => a - b);

  const isHorizontal = direction === 'LR' || direction === 'RL';
  const nodeW = 180;
  const nodeH = 70;
  const colSpacing = isHorizontal ? 240 : 220;
  const rowSpacing = isHorizontal ? 100 : 120;

  const positionedNodes = [];
  const nodePositions = {};

  let maxW = 0;
  let maxH = 0;
  let minX = Infinity;
  let minY = Infinity;

  levelIds.forEach(lvl => {
    const lvlNodes = levelsMap[lvl];
    const K = lvlNodes.length;

    lvlNodes.forEach((node, idx) => {
      let x, y;
      if (isHorizontal) {
        x = lvl * colSpacing + 100;
        y = (idx - (K - 1) / 2) * rowSpacing + 300;
      } else {
        x = (idx - (K - 1) / 2) * colSpacing + 400;
        y = lvl * rowSpacing + 100;
      }

      nodePositions[node.id] = { x, y };
      positionedNodes.push({
        ...node,
        x,
        y,
        width: nodeW,
        height: nodeH
      });

      minX = Math.min(minX, x - nodeW / 2);
      minY = Math.min(minY, y - nodeH / 2);
    });
  });

  const paddingX = 80;
  const paddingY = 80;
  positionedNodes.forEach(node => {
    // Correct the coordinate translation offset to ensure perfect horizontal and vertical margin symmetry
    node.x = (node.x - nodeW / 2) - minX + paddingX;
    node.y = (node.y - nodeH / 2) - minY + paddingY;
    nodePositions[node.id] = { x: node.x, y: node.y };
    maxW = Math.max(maxW, node.x + nodeW + paddingX);
    maxH = Math.max(maxH, node.y + nodeH + paddingY);
  });

  const positionedEdges = edges.map((edge, idx) => {
    const start = nodePositions[edge.from];
    const end = nodePositions[edge.to];
    if (!start || !end) return null;

    const sx = start.x + nodeW / 2;
    const sy = start.y + nodeH / 2;
    const ex = end.x + nodeW / 2;
    const ey = end.y + nodeH / 2;

    let startX = sx;
    let startY = sy;
    let endX = ex;
    let endY = ey;

    if (isHorizontal) {
      startX = start.x + nodeW;
      startY = sy;
      endX = end.x;
      endY = ey;
    } else {
      startX = sx;
      startY = start.y + nodeH;
      endX = ex;
      endY = end.y;
    }

    let path = '';
    if (isHorizontal) {
      const midX = (startX + endX) / 2;
      path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
    } else {
      const midY = (startY + endY) / 2;
      path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
    }

    return {
      ...edge,
      id: `edge-${idx}`,
      path,
      startX,
      startY,
      endX,
      endY
    };
  }).filter(Boolean);

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    width: maxW,
    height: maxH
  };
}

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
  const standardMatch = part.match(/^([a-zA-Z0-9_-]+)\s*(?:(\(\(\s*["']?|\(\[\s*["']?|\[\[\s*["']?|\[\(\s*["']?|\{\{\s*["']?|\{\s*["']?|\(\s*["']?|\[\s*["']?|["'])(.*?)(?:\s*["']?\)\)|\s*["']?\]\)|\s*["']?\]\]|\s*["']?\s*\)\]|\s*["']?\}\}|\s*["']?\}|\s*["']?\)|["']?\s*\]|["']))$/);
  
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

    const setNodeMapSafe = (newNode) => {
      if (!newNode) return;
      const existing = nodesMap.get(newNode.id);
      if (!existing) {
        nodesMap.set(newNode.id, newNode);
        return;
      }
      const existingIsSimple = (existing.label === existing.id) && (existing.shape === 'box');
      const newIsSimple = (newNode.label === newNode.id) && (newNode.shape === 'box');
      if (existingIsSimple && !newIsSimple) {
        nodesMap.set(newNode.id, newNode);
      } else if (!existingIsSimple && newIsSimple) {
        // Keep existing richer definition
      } else {
        if (newNode.label && newNode.label.length > (existing.label ? existing.label.length : 0)) {
          nodesMap.set(newNode.id, newNode);
        }
      }
    };

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

      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('%%') || lowerLine.startsWith('style') || lowerLine.startsWith('classdef') || lowerLine.startsWith('class') || lowerLine.startsWith('linkstyle') || lowerLine.startsWith('subgraph') || lowerLine.startsWith('end')) {
        continue;
      }

      let currentLine = line;
      let iterations = 0;
      while (iterations < 10) {
        const parsed = parseLine(currentLine);
        if (parsed.hasEdge) {
          const leftNode = parseNodePart(parsed.left);
          if (leftNode) {
            setNodeMapSafe(leftNode);
          }

          const rightNextParsed = parseLine(parsed.right);
          const rightImmediateNodePart = rightNextParsed.hasEdge ? rightNextParsed.left : parsed.right;
          const rightNode = parseNodePart(rightImmediateNodePart);

          if (rightNode) {
            setNodeMapSafe(rightNode);
            let edgeLabel = parsed.edgeLabel.trim();
            if ((edgeLabel.startsWith('"') && edgeLabel.endsWith('"')) || (edgeLabel.startsWith("'") && edgeLabel.endsWith("'"))) {
              edgeLabel = edgeLabel.slice(1, -1).trim();
            }
            edgesList.push({
              from: leftNode ? leftNode.id : parsed.left.trim().replace(/[^a-zA-Z0-9_-]/g, ''),
              to: rightNode.id,
              label: edgeLabel.replace(/"/g, "'"),
              arrowType: parsed.arrowType
            });
          }

          currentLine = parsed.right;
          iterations++;
        } else {
          const node = parseNodePart(parsed.content);
          if (node) {
            setNodeMapSafe(node);
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

const renderNodeShape = (shape, cardFill, cardStroke, isActive, isDark) => {
  const commonProps = {
    fill: cardFill,
    stroke: cardStroke,
    strokeWidth: isActive ? 2 : 1.5,
    className: "transition-all duration-300",
    style: isActive 
      ? { filter: `drop-shadow(0 0 4px ${isDark ? 'rgba(239, 255, 85, 0.2)' : 'rgba(59, 130, 246, 0.2)'})` } 
      : undefined
  };

  switch (shape) {
    case 'double-circle':
      return (
        <g>
          <ellipse cx="90" cy="35" rx="85" ry="34" {...commonProps} />
          <ellipse cx="90" cy="35" rx="79" ry="28" fill="none" stroke={cardStroke} strokeWidth={isActive ? 1.5 : 1} className="transition-all duration-300" />
        </g>
      );
    case 'stadium':
      return <rect x="0" y="0" width="180" height="70" rx="35" ry="35" {...commonProps} />;
    case 'diamond':
      return <polygon points="90,0 180,35 90,70 0,35" {...commonProps} />;
    case 'hexagon':
      return <polygon points="20,0 160,0 180,35 160,70 20,70 0,35" {...commonProps} />;
    case 'database':
      return (
        <g>
          <path d="M 0,12 L 0,58 A 90,12 0 0 0 180,58 L 180,12 Z" {...commonProps} />
          <ellipse cx="90" cy="12" rx="90" ry="12" fill={cardFill} stroke={cardStroke} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all duration-300" />
        </g>
      );
    case 'subroutine':
      return (
        <g>
          <rect x="0" y="0" width="180" height="70" rx="4" {...commonProps} />
          <line x1="15" y1="0" x2="15" y2="70" stroke={cardStroke} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all duration-300" />
          <line x1="165" y1="0" x2="165" y2="70" stroke={cardStroke} strokeWidth={isActive ? 2.5 : 1.5} className="transition-all duration-300" />
        </g>
      );
    case 'round':
      return <rect x="0" y="0" width="180" height="70" rx="20" ry="20" {...commonProps} />;
    case 'box':
    default:
      return <rect x="0" y="0" width="180" height="70" rx="6" ry="6" {...commonProps} />;
  }
};

function InteractiveVisualGraph({ data, theme = 'dark' }) {
  const [selectedId, setSelectedId] = useState(data.nodes[0]?.id || '');
  const [direction, setDirection] = useState(data.direction || 'TD');
  const [viewport, setViewport] = useState({ zoom: 1, pan: { x: 0, y: 0 } });
  const { zoom, pan } = viewport;
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const canvasRef = useRef(null);

  // Hover state for interactive node highlighting
  const [hoveredId, setHoveredId] = useState(null);

  const isDark = theme === 'dark';
  const themeColor = isDark ? '#efff55' : '#3b82f6';
  const themeColorRGB = isDark ? '239, 255, 85' : '59, 130, 246';

  const [nodeOffsets, setNodeOffsets] = useState({});
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset node offsets when data or layout direction changes
  useEffect(() => {
    setNodeOffsets({});
  }, [data, direction]);

  // Compute layout coordinates dynamically
  const layout = React.useMemo(() => {
    return computeLayout(data.nodes, data.edges, direction);
  }, [data.nodes, data.edges, direction]);

  // Resolve layout coordinates dynamically with dragging offsets applied
  const resolvedLayout = React.useMemo(() => {
    if (!layout) return null;
    const nodePositions = {};
    const nodeW = 180;
    const nodeH = 70;
    const isHorizontal = direction === 'LR' || direction === 'RL';

    const nodes = layout.nodes.map(node => {
      const offset = nodeOffsets[node.id] || { x: 0, y: 0 };
      const adjustedNode = {
        ...node,
        x: node.x + offset.x,
        y: node.y + offset.y
      };
      nodePositions[node.id] = { x: adjustedNode.x, y: adjustedNode.y };
      return adjustedNode;
    });

    const edges = layout.edges.map(edge => {
      const start = nodePositions[edge.from];
      const end = nodePositions[edge.to];
      if (!start || !end) return null;

      const sx = start.x + nodeW / 2;
      const sy = start.y + nodeH / 2;
      const ex = end.x + nodeW / 2;
      const ey = end.y + nodeH / 2;

      let startX = sx;
      let startY = sy;
      let endX = ex;
      let endY = ey;

      if (isHorizontal) {
        startX = start.x + nodeW;
        startY = sy;
        endX = end.x;
        endY = ey;
      } else {
        startX = sx;
        startY = start.y + nodeH;
        endX = ex;
        endY = end.y;
      }

      let path = '';
      if (isHorizontal) {
        const midX = (startX + endX) / 2;
        path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
      } else {
        const midY = (startY + endY) / 2;
        path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
      }

      return {
        ...edge,
        path,
        startX,
        startY,
        endX,
        endY
      };
    }).filter(Boolean);

    return {
      ...layout,
      nodes,
      edges
    };
  }, [layout, nodeOffsets, direction]);

  // Fit to screen: calculate zoom/pan with optimum scaling and centering
  const fitToView = useCallback(() => {
    const el = canvasRef.current;
    if (!el || !layout.width || !layout.height) {
      setViewport({ zoom: 1, pan: { x: 0, y: 0 } });
      return;
    }
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;

    let newZoom = 1;
    let offsetX = 0;
    let offsetY = 0;

    if (direction === 'TD') {
      // For vertical TD graphs, fit to width (horizontally) so they are highly readable,
      // and do not squash the graph vertically down to fit tall diagrams in a short viewport.
      const scaleX = containerW / layout.width;
      // Cap zoom: minimum 0.65 for excellent legibility on load, max 0.9 for standard size
      newZoom = Math.max(0.65, Math.min(scaleX * 0.92, 0.9));
      
      // Center horizontally
      offsetX = (containerW - layout.width * newZoom) / 2;
      // Pin the top area in the center at the top of the canvas with a nice 40px padding
      offsetY = 40;
    } else {
      // For horizontal LR graphs, fit to height (vertically)
      const scaleY = containerH / layout.height;
      // Cap zoom: minimum 0.65 for legibility, max 0.9
      newZoom = Math.max(0.65, Math.min(scaleY * 0.92, 0.9));

      // Pin the start area near the left of the canvas
      offsetX = 40;
      // Center vertically
      offsetY = (containerH - layout.height * newZoom) / 2;
    }

    setViewport({ zoom: newZoom, pan: { x: offsetX, y: offsetY } });
  }, [layout.width, layout.height, direction]);

  const resetView = useCallback(() => {
    // Reset dragging offsets on explicit reset click
    setNodeOffsets({});
    fitToView();
  }, [fitToView]);

  // Auto-fit on initial render and when layout or maximized state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitToView();
    }, 50);
    return () => clearTimeout(timer);
  }, [fitToView, isMaximized]);

  const handleZoomIn = () => {
    const el = canvasRef.current;
    if (!el) return;
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    const cx = containerW / 2;
    const cy = containerH / 2;

    setViewport(prev => {
      const newZoom = Math.min(4, prev.zoom + 0.15);
      const ratio = newZoom / prev.zoom;
      return {
        zoom: newZoom,
        pan: {
          x: cx - (cx - prev.pan.x) * ratio,
          y: cy - (cy - prev.pan.y) * ratio
        }
      };
    });
  };

  const handleZoomOut = () => {
    const el = canvasRef.current;
    if (!el) return;
    const containerW = el.clientWidth;
    const containerH = el.clientHeight;
    const cx = containerW / 2;
    const cy = containerH / 2;

    setViewport(prev => {
      const newZoom = Math.max(0.2, prev.zoom - 0.15);
      const ratio = newZoom / prev.zoom;
      return {
        zoom: newZoom,
        pan: {
          x: cx - (cx - prev.pan.x) * ratio,
          y: cy - (cy - prev.pan.y) * ratio
        }
      };
    });
  };

  // Node Drag Event Handlers
  const handleNodeMouseDown = (e, nodeId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(nodeId);
    setDraggingNodeId(nodeId);
    const offset = nodeOffsets[nodeId] || { x: 0, y: 0 };
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    };
  };

  const handleNodeTouchStart = (e, nodeId) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    setSelectedId(nodeId);
    setDraggingNodeId(nodeId);
    const offset = nodeOffsets[nodeId] || { x: 0, y: 0 };
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      offsetX: offset.x,
      offsetY: offset.y
    };
  };

  // Drag pan & Drag node
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e) => {
    if (draggingNodeId) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      setNodeOffsets(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: dragStartRef.current.offsetX + dx,
          y: dragStartRef.current.offsetY + dy
        }
      }));
    } else if (isPanning) {
      setViewport(prev => ({
        ...prev,
        pan: {
          x: panStart.current.panX + (e.clientX - panStart.current.x),
          y: panStart.current.panY + (e.clientY - panStart.current.y)
        }
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Touch pan & drag
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y };
    }
  };

  const handleTouchMove = (e) => {
    if (draggingNodeId && e.touches.length === 1) {
      const dx = (e.touches[0].clientX - dragStartRef.current.x) / zoom;
      const dy = (e.touches[0].clientY - dragStartRef.current.y) / zoom;
      setNodeOffsets(prev => ({
        ...prev,
        [draggingNodeId]: {
          x: dragStartRef.current.offsetX + dx,
          y: dragStartRef.current.offsetY + dy
        }
      }));
    } else if (isPanning && e.touches.length === 1) {
      setViewport(prev => ({
        ...prev,
        pan: {
          x: panStart.current.panX + (e.touches[0].clientX - panStart.current.x),
          y: panStart.current.panY + (e.touches[0].clientY - panStart.current.y)
        }
      }));
    }
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const renderNodeText = (label, textColor) => {
    const words = label.split(' ');
    let line1 = '';
    let line2 = '';
    
    if (words.length > 3) {
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    } else {
      line1 = label;
    }

    if (line2) {
      return (
        <>
          <text x="90" y="35" fill={textColor} fontSize="11" fontWeight="800" textAnchor="middle">{line1}</text>
          <text x="90" y="49" fill={textColor} fontSize="11" fontWeight="800" textAnchor="middle">{line2}</text>
        </>
      );
    }
    return (
      <text x="90" y="42" fill={textColor} fontSize="11" fontWeight="800" textAnchor="middle">{line1}</text>
    );
  };

  const showInteractive = !isMobile || isMaximized;
  const containerClasses = isMaximized
    ? `fixed inset-0 z-[9999] flex h-screen w-screen flex-col ${isDark ? 'bg-[#151515] text-zinc-300' : 'bg-slate-50 text-slate-700'} p-3 md:p-4`
    : `my-6 overflow-hidden rounded-[1.6rem] border ${isDark ? 'border-white/[0.09] bg-[#242424] text-zinc-300' : 'border-slate-200 bg-white text-slate-700'} shadow-[0_24px_70px_rgba(0,0,0,0.30)] transition-all`;

  const graphContent = (
    <div className={containerClasses}>
      <div className={`relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 ${
        isMaximized
          ? 'mb-3 rounded-[1.35rem] border shadow-[0_18px_60px_rgba(0,0,0,0.28)]'
          : 'mx-4 mt-4 rounded-[1.35rem] border shadow-[0_14px_44px_rgba(0,0,0,0.20)]'
      } ${
        isDark
          ? 'border-white/[0.09] bg-[#202020]/92 backdrop-blur-xl'
          : 'border-slate-200 bg-white/90 backdrop-blur-md'
      }`}>
        <div className="flex min-w-0 items-center gap-2">
          <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
            isDark 
              ? 'bg-[#efff55]/10 text-[#efff55] border border-[#efff55]/20' 
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            Concept Path
          </span>
          <span className={`truncate text-[12px] font-black uppercase tracking-[0.12em] ${isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
            Navigator
          </span>
        </div>
        <div className="custom-scroll flex max-w-full items-center gap-2 overflow-x-auto">
          <button 
            onClick={() => setDirection(d => d === 'TD' ? 'LR' : 'TD')}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-[11px] font-black transition-all duration-200 active:scale-95 ${
              isDark 
                ? 'bg-[#2b2b2b] border-white/[0.09] text-zinc-300 hover:text-white hover:border-white/[0.16] hover:bg-[#303030] hover:shadow-lg hover:shadow-black/20' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-950 hover:border-slate-300 hover:bg-white hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]'
            }`}
            title="Toggle Graph Direction"
          >
            <Compass className="h-3.5 w-3.5 text-[#efff55]" />
            <span>{direction === 'TD' ? 'Vertical' : 'Horizontal'}</span>
          </button>
          
          <div className={`h-5 w-px shrink-0 ${isDark ? 'bg-white/[0.09]' : 'bg-slate-200'} mx-0.5`} />
          
          <button 
            onClick={handleZoomOut} 
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
              isDark 
                ? 'bg-[#2b2b2b] border-white/[0.09] text-zinc-400 hover:text-white hover:border-white/[0.16] hover:bg-[#303030]' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-white'
            }`} 
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleZoomIn} 
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
              isDark 
                ? 'bg-[#2b2b2b] border-white/[0.09] text-zinc-400 hover:text-white hover:border-white/[0.16] hover:bg-[#303030]' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-white'
            }`} 
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={resetView} 
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
              isDark 
                ? 'bg-[#2b2b2b] border-white/[0.09] text-zinc-400 hover:text-white hover:border-white/[0.16] hover:bg-[#303030]' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-white'
            }`} 
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          
          <div className={`h-5 w-px shrink-0 ${isDark ? 'bg-white/[0.09]' : 'bg-slate-200'} mx-0.5`} />

          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
              isDark 
                ? 'bg-[#2b2b2b] border-white/[0.12] text-zinc-300 hover:text-white hover:border-white/[0.22] hover:bg-[#303030]' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 hover:bg-white'
            }`}
            title={isMaximized ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isMaximized ? <X className="w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className={`relative flex min-h-0 flex-col overflow-hidden ${
        isMaximized
          ? `flex-1 rounded-[1.6rem] border ${isDark ? 'border-white/[0.09] bg-[#202020]' : 'border-slate-200 bg-white'}`
          : `mx-4 mb-4 mt-3 min-h-[520px] rounded-[1.35rem] border ${isDark ? 'border-white/[0.08] bg-[#202020]' : 'border-slate-200 bg-white'}`
      }`}>
        <div 
          ref={canvasRef}
          className={`relative flex-1 overflow-hidden select-none ${
            showInteractive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
          } ${isMaximized ? 'h-full w-full' : isMobile ? 'h-[280px]' : 'h-[520px]'}`}
          style={{
            backgroundColor: isDark ? '#202020' : '#f8fafc',
            backgroundImage: 'none'
          }}
          onMouseDown={showInteractive ? handleMouseDown : undefined}
          onMouseMove={showInteractive ? handleMouseMove : undefined}
          onMouseUp={showInteractive ? handleMouseUp : undefined}
          onMouseLeave={showInteractive ? handleMouseUp : undefined}
          onTouchStart={showInteractive ? handleTouchStart : undefined}
          onTouchMove={showInteractive ? handleTouchMove : undefined}
          onTouchEnd={showInteractive ? handleTouchEnd : undefined}
        >
          {isMobile && !isMaximized && (
            <div 
              onClick={() => setIsMaximized(true)}
              className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center bg-[#202020]/72 backdrop-blur-sm transition-all"
            >
              <div className={`rounded-full p-3 ${isDark ? 'bg-[#2b2b2b] text-zinc-100 border border-white/[0.12]' : 'bg-white text-slate-800 border border-slate-200'} shadow-lg transition-all active:scale-95`}>
                <Maximize2 className="w-5 h-5 animate-pulse" />
              </div>
              <span className={`mt-3 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${isDark ? 'text-zinc-200 bg-[#2b2b2b]/95 border border-white/[0.09]' : 'text-slate-700 bg-white/90 border border-slate-100'} shadow-md`}>
                Tap to Expand Graph
              </span>
            </div>
          )}

          <div 
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning || draggingNodeId ? 'none' : 'transform 0.15s ease-out'
            }}
          >
            <svg 
              width={layout.width} 
              height={layout.height} 
              className="overflow-visible"
            >
              <defs>
                <marker id="arrow-marker" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill={themeColor}/>
                </marker>
                <marker id="arrow-marker-muted" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill={isDark ? '#3f3f46' : '#cbd5e1'}/>
                </marker>
              </defs>

              {resolvedLayout?.edges.map((edge) => {
                const isActive = edge.from === selectedId || edge.to === selectedId;
                return (
                  <g key={edge.id}>
                    <path
                      d={edge.path}
                      fill="none"
                      stroke={isActive ? themeColor : isDark ? '#374151' : '#cbd5e1'}
                      strokeWidth={isActive ? 2.5 : 1.5}
                      markerEnd={`url(#${isActive ? 'arrow-marker' : 'arrow-marker-muted'})`}
                      className={draggingNodeId ? "" : "transition-all duration-300"}
                    />
                    {edge.label && (
                      <foreignObject
                        x={(edge.startX + edge.endX) / 2 - 70}
                        y={(edge.startY + edge.endY) / 2 - 12}
                        width="140"
                        height="24"
                      >
                        <div className="flex items-center justify-center h-full">
                          <span className={`text-[9px] font-medium px-2 py-0.5 rounded border text-center leading-tight ${
                            isDark 
                              ? 'bg-[#202020] border-white/[0.12] text-zinc-400' 
                              : 'bg-[#f8fafc] border-slate-200 text-slate-500'
                          }`}>
                            {edge.label}
                          </span>
                        </div>
                      </foreignObject>
                    )}
                  </g>
                );
              })}

              {resolvedLayout?.nodes.map((node) => {
                const isActive = node.id === selectedId;
                const isHovered = node.id === hoveredId;
                const cardFill = isDark ? '#202020' : '#ffffff';
                const cardStroke = isActive ? themeColor : isHovered ? (isDark ? '#71717a' : '#94a3b8') : isDark ? '#52525b' : '#cbd5e1';
                const labelColor = isDark ? '#ffffff' : '#1e293b';

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${node.x}, ${node.y})`}
                    onMouseDown={showInteractive ? (e) => handleNodeMouseDown(e, node.id) : undefined}
                    onTouchStart={showInteractive ? (e) => handleNodeTouchStart(e, node.id) : undefined}
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={showInteractive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
                    style={{
                      opacity: isHovered && !isActive ? 0.85 : 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    {renderNodeShape(node.shape || 'box', cardFill, cardStroke, isActive, isDark)}

                    {renderNodeText(node.label || node.id, labelColor)}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>


      </div>
    </div>
  );

  if (isMaximized) {
    return createPortal(graphContent, document.body);
  }
  return graphContent;
}


function MermaidBlock({ code }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cleanCode = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    // Mindmap conversion if needed
    if (/^\s*mindmap\b/i.test(cleanCode)) {
      const lines = cleanCode.split('\n').filter(l => l.trim());
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
        cleanCode = `graph TD\n${nodeDefs}\n${edgeDefs}`;
      }
    }

    const parsed = parseFlowchartData(cleanCode);
    setData(parsed);
  }, [code]);

  if (!data || data.nodes.length === 0) {
    return (
      <div className="my-6 rounded-2xl border border-zinc-800 bg-[#0c0d0f] p-6 text-center text-sm text-zinc-400">
        <AlertCircle className="mx-auto h-8 w-8 mb-2 text-indigo-400 opacity-80" />
        <p className="font-bold">Failed to load visual diagram.</p>
        <pre className="mt-4 max-h-40 overflow-y-auto rounded-xl bg-black/40 p-4 text-[11px] text-zinc-500 font-mono text-left">{code}</pre>
      </div>
    );
  }

  return <InteractiveVisualGraph data={data} theme="dark" />;
}

function CodeBlock({ className = '', children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'code';
  const code = String(children || '').replace(/\n$/, '');

  if (language === 'mermaid') {
    return <MermaidBlock code={code} />;
  }

  const SUPPORTED_MONACO_LANGUAGES = [
    'javascript', 'js', 'typescript', 'ts', 'python', 'py',
    'html', 'css', 'json', 'cpp', 'c++', 'c', 'java', 'csharp', 'cs',
    'go', 'rust', 'rs', 'sql', 'yaml', 'yml', 'bash', 'sh', 'shell', 'xml'
  ];

  const isMonacoSupported = SUPPORTED_MONACO_LANGUAGES.includes(language.toLowerCase());

  const mapLanguageForMonaco = (lang) => {
    const l = lang.toLowerCase();
    if (l === 'js') return 'javascript';
    if (l === 'ts') return 'typescript';
    if (l === 'py') return 'python';
    if (l === 'c++') return 'cpp';
    if (l === 'cs') return 'csharp';
    if (l === 'rs') return 'rust';
    if (l === 'yml') return 'yaml';
    if (l === 'sh' || l === 'bash' || l === 'shell') return 'bash';
    return l;
  };

  if (isMonacoSupported) {
    return (
      <PremiumCodeWorkspace
        readOnly={true}
        originalCode={code}
        language={mapLanguageForMonaco(language)}
      />
    );
  }

  return (
    <pre className="custom-scroll max-w-full overflow-x-auto p-4 text-[13.5px] leading-7 text-zinc-300 bg-[#1e1e1e] border border-zinc-800 rounded-2xl">
      <code className={className} {...props}>
        {children}
      </code>
    </pre>
  );
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const processedContent = React.useMemo(() => {
    if (!content) return '';
    const parts = content.split(/(```[\s\S]*?```)/);
    return parts.map((part, index) => {
      if (index % 2 !== 0) return part;
      const lines = part.split('\n');
      let insideUnwrappedDiagram = false;
      let diagramLines = [];
      const newLines = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const isDiagramStart = /^\s*(?:graph\s+(?:TD|LR|TB|BT|RL)|flowchart\s+(?:TD|LR|TB|BT|RL)|sequenceDiagram|mindmap)\b/i.test(trimmed);
        if (isDiagramStart) {
          insideUnwrappedDiagram = true;
          diagramLines.push(line);
        } else if (insideUnwrappedDiagram) {
          const isMarkdownBlock = /^\s*(?:#+|-|\*|\d+\.|\>)\s+/i.test(trimmed);
          const isDiagramLine = 
            /-->|==>|-\.->|->/g.test(trimmed) ||
            /subgraph\b|end\b/i.test(trimmed) ||
            /\b(?:participant|actor|as)\b/i.test(trimmed) ||
            /\b(?:style|class|classDef|linkStyle|click)\b/i.test(trimmed) ||
            /^\s*(?:[a-zA-Z0-9_-]+)\s*(?:(?:\(\(\s*["']?|\(\[\s*["']?|\[\[\s*["']?|\[\(\s*["']?|\{\{\s*["']?|\{\s*["']?|\(\s*["']?|\[\s*["']?|["']))/i.test(trimmed);
          if (trimmed === '') {
            diagramLines.push(line);
          } else if (isMarkdownBlock || !isDiagramLine) {
            while (diagramLines.length > 0 && diagramLines[diagramLines.length - 1].trim() === '') {
              diagramLines.pop();
            }
            if (diagramLines.length > 0) {
              newLines.push('```mermaid\n' + diagramLines.join('\n') + '\n```');
            }
            diagramLines = [];
            insideUnwrappedDiagram = false;
            newLines.push(line);
          } else {
            diagramLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      }
      if (insideUnwrappedDiagram && diagramLines.length > 0) {
        while (diagramLines.length > 0 && diagramLines[diagramLines.length - 1].trim() === '') {
          diagramLines.pop();
        }
        if (diagramLines.length > 0) {
          newLines.push('```mermaid\n' + diagramLines.join('\n') + '\n```');
        }
      }
      return newLines.join('\n');
    }).join('');
  }, [content]);

  const components = React.useMemo(() => ({
          p: ({ node, ...props }) => <p className="mb-4 leading-[1.8] text-zinc-300 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-zinc-400" {...props} />,
          pre: ({ children, ...props }) => {
            if (React.isValidElement(children) && children.props.node?.tagName === 'code') {
              return <CodeBlock className={children.props.className}>{children.props.children}</CodeBlock>;
            }
            return <pre {...props}>{children}</pre>;
          },
          code: ({ node, className, children, ...props }) => (
            <code className={`rounded-[0.4rem] border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.86em] text-indigo-300 shadow-sm ${className || ''}`} {...props}>
              {children}
            </code>
          ),
          ul: ({ node, ...props }) => <ul className="mb-5 list-none space-y-2.5 pl-2 text-zinc-300 [&>li]:relative [&>li]:pl-6 [&>li::before]:absolute [&>li::before]:left-1.5 [&>li::before]:top-[0.6em] [&>li::before]:h-1.5 [&>li::before]:w-1.5 [&>li::before]:rounded-full [&>li::before]:bg-zinc-500" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-5 list-decimal space-y-2.5 pl-6 text-zinc-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-[1.7]" {...props} />,
          h1: ({ node, ...props }) => <h1 className="mb-5 mt-8 text-[1.75rem] font-black leading-tight tracking-tight text-white first:mt-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="mb-4 mt-8 text-2xl font-black leading-tight tracking-tight text-white first:mt-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="mb-3 mt-6 text-xl font-bold leading-tight tracking-tight text-white first:mt-0" {...props} />,
          h4: ({ node, ...props }) => <h4 className="mb-2 mt-5 text-lg font-bold leading-tight text-white first:mt-0" {...props} />,
          a: ({ node, ...props }) => <a className="font-bold text-[#A3FF4F] underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-[#A3FF4F]/50" {...props} />,
          blockquote: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).map(c => c.props?.children || c).join('');
            let borderClass = 'border-zinc-700/50';
            let bgClass = 'bg-white/[0.02]';
            let textClass = 'text-zinc-300';
            let icon = null;
            
            if (text.includes('💡')) {
              borderClass = 'border-indigo-500/40'; bgClass = 'bg-indigo-500/5'; textClass = 'text-indigo-200';
            } else if (text.includes('⚠️')) {
              borderClass = 'border-[#FF9F1C]/40'; bgClass = 'bg-[#FF9F1C]/5'; textClass = 'text-[#FFBE55]';
            } else if (text.includes('🔗')) {
              borderClass = 'border-teal-500/40'; bgClass = 'bg-teal-500/5'; textClass = 'text-teal-200';
            }
            
            return (
              <blockquote className={`my-6 rounded-r-2xl border-l-[3px] ${borderClass} ${bgClass} px-6 py-4 text-[15px] leading-[1.8] ${textClass} shadow-sm`} {...props}>
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-[1.35rem] border border-white/[0.09] bg-[#242424] shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
              <table className="w-full text-left text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="border-b border-white/[0.08] bg-white/[0.045] text-xs uppercase tracking-wider text-zinc-400" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/[0.065]" {...props} />,
          tr: ({ node, ...props }) => <tr className="transition hover:bg-white/[0.035]" {...props} />,
          th: ({ node, ...props }) => <th className="px-6 py-4 font-black text-white" {...props} />,
          td: ({ node, ...props }) => <td className="px-6 py-4 text-zinc-200" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-10 border-white/10" {...props} />,
  }), []);

  return (
    <div className={`markdown-renderer max-w-none break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

