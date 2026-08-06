const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'image-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const assetsDir = path.join(__dirname, '../src/assets');

let deleted = 0;

for (const oldPath of Object.keys(mapping)) {
  const fullOldPath = path.join(assetsDir, oldPath);
  if (fs.existsSync(fullOldPath)) {
    fs.unlinkSync(fullOldPath);
    console.log(`🗑️ Deleted old image: ${oldPath}`);
    deleted++;
  }
}

console.log(`\n✅ Finished cleaning up ${deleted} unoptimized images.`);
