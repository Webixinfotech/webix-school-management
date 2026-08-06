const fs = require('fs');
const path = require('path');
function findImports(dir) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if(fs.statSync(p).isDirectory()) findImports(p);
    else if (p.endsWith('.jsx')) {
      const c = fs.readFileSync(p, 'utf8');
      const m = c.match(/import\s+.*?\s+from\s+['"].*?\.(png|jpg|jpeg|webp|svg)['"]/g);
      if (m) {
        console.log(p);
        m.forEach(x => console.log('  ' + x));
      }
    }
  });
}
findImports('src');
