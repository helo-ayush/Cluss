const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');
content = content.replace(/background: 'var\(--color-background\)'/g, "background: '#eef3f4'");
content = content.replace(/background: 'rgba\\(0,0,0,0\\.85\\)'/g, "background: 'rgba(255,255,255,0.7)'");
content = content.replace(/background: 'linear-gradient\\(145deg, rgba\\(30,41,59,0\\.95\\) 0%, rgba\\(15,23,42,0\\.95\\) 100%\\)'/g, "background: '#ffffff'");
content = content.replace(/rgba\\(30,41,59,0\\.95\\)/g, '#ffffff');
content = content.replace(/rgba\\(15,23,42,0\\.95\\)/g, '#f8fafc');
content = content.replace(/text-white\/60/g, 'text-gray-500');
content = content.replace(/text-white\/70/g, 'text-gray-600');
content = content.replace(/text-white\/80/g, 'text-gray-700');
content = content.replace(/text-white\/90/g, 'text-gray-800');
// Some text-white classes shouldn't be converted if they are inside active buttons, but let's carefully convert only specific structural ones
content = content.replace(/text-white /g, 'text-gray-900 ');
fs.writeFileSync('src/pages/Dashboard.jsx', content);
console.log('Script ran successfully.');
