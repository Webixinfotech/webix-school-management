const fs = require('fs');
const path = require('path');

const mapPath = path.join(__dirname, 'image-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const allCodeFiles = getAllFiles(srcDir).filter(f => ['.jsx', '.js'].includes(path.extname(f).toLowerCase()));

let totalReplaced = 0;

for (const file of allCodeFiles) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We sort by length descending to avoid partial matches
  const keys = Object.keys(mapping).sort((a, b) => b.length - a.length);

  for (const oldPath of keys) {
    const newPath = mapping[oldPath];
    // Imports use forward slashes
    content = content.split(oldPath).join(newPath);
  }

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
    console.log(`Updated imports in: ${path.relative(__dirname, file)}`);
  }
}

console.log(`\n✅ Finished updating imports in ${totalReplaced} files.`);
