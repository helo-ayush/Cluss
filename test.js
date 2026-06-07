const fs = require('fs');
const parser = require('@babel/parser');

try {
  const code = fs.readFileSync('Frontend/src/components/CodeChallengeBlock.jsx', 'utf8');
  parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('JSX parsed successfully!');
} catch (err) {
  console.error('Parsing error:');
  console.error(err.message);
  console.error('At line:', err.loc?.line, 'column:', err.loc?.column);
}
