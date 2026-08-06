const fs = require('fs');
const content = fs.readFileSync('attendance_api_postman_collection.json', 'utf8');

try {
  JSON.parse(content);
  console.log('✓ JSON is valid');
} catch (e) {
  console.error('✗ JSON Parse Error:', e.message);
  if (e.lineNumber !== undefined) {
    console.error('Line:', e.lineNumber, 'Column:', e.column);
    const lines = content.split('\n');
    const errorLine = lines[e.lineNumber - 1];
    console.error('Line content:', errorLine);
    console.error('Position indicator:', ' '.repeat(e.column - 1) + '^');
  } else {
    // Fallback: find approximate position
    const pos = e.column || e.message.match(/position (\d+)/)?.[1];
    if (pos) {
      const p = parseInt(pos);
      const start = Math.max(0, p - 50);
      const end = Math.min(content.length, p + 50);
      console.error('Context around position', p, ':', content.substring(start, end));
    }
  }
  process.exit(1);
}
