const fs = require('fs');
const path = require('path');

const targetFile = 'c:\\Users\\Ayush Kumar\\Desktop\\StudyHelper\\backend\\src\\services\\guidedStudyGenerator.js';
let content = fs.readFileSync(targetFile, 'utf8');

const targetStr = `f) Structure the graph to reflect real conceptual relationships: cause-effect chains, decision trees, classification hierarchies, process pipelines, or dependency graphs—whatever best fits the subject matter.`;

const replacementStr = `f) Structure the graph to reflect real conceptual relationships: cause-effect chains, decision trees, classification hierarchies, process pipelines, or dependency graphs—whatever best fits the subject matter.
     g) MANDATORY VISUAL SHAPE DIVERSITY (CRITICAL): Every single diagram generated MUST utilize at least 3-4 different geometric shapes from the available shapes list. Do NOT use a single shape (like subroutine or rect) all over the diagram. Map checks/conditions to diamonds, storage to databases, hubs to double-circles, processes to subroutines, start/end to stadiums, and milestones to hexagons. This keeps the diagram visually rich, colorful, and engaging!
     h) MANDATORY NON-LINEAR TOPOLOGY (CRITICAL): Avoid generating basic, flat, linear single-chain graphs (e.g. node1 -> node2 -> node3 -> node4 is strictly prohibited!). True concept maps are rich and interconnected. You MUST design non-linear structures featuring decision checks/branches (using diamond nodes that split into 'Yes' and 'No' paths), parallel processing streams, feedback loops (where validation steps connect back to earlier nodes to fix errors), or central hubs with multiple radiating dependencies. The map should look like a highly detailed, professional visual system architecture!`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log("Successfully updated guidedStudyGenerator.js prompt template!");
} else {
    console.log("Could not find the target string in guidedStudyGenerator.js!");
}
