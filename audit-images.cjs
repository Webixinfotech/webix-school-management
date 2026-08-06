const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const assetsDir = path.join(__dirname, 'src', 'assets');
const publicDir = path.join(__dirname, 'public');

const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif'];

function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

const allAssets = getAllFiles(assetsDir).filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
const allPublicAssets = getAllFiles(publicDir).filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));
const allImages = [...allAssets, ...allPublicAssets];

const allCodeFiles = getAllFiles(srcDir).filter(f => ['.jsx', '.js', '.tsx', '.ts', '.css'].includes(path.extname(f).toLowerCase()));

let report = [];

allImages.forEach(img => {
  const stat = fs.statSync(img);
  const sizeKB = (stat.size / 1024).toFixed(2);
  const ext = path.extname(img).toLowerCase();
  const basename = path.basename(img);
  const relPath = path.relative(__dirname, img).replace(/\\/g, '/');
  
  // check usages in code
  let usages = 0;
  let usedIn = [];
  allCodeFiles.forEach(codeFile => {
    const content = fs.readFileSync(codeFile, 'utf8');
    if (content.includes(basename)) {
      usages++;
      usedIn.push(path.basename(codeFile));
    }
  });
  
  report.push({
    path: relPath,
    basename,
    sizeKB: parseFloat(sizeKB),
    format: ext,
    usages,
    usedIn: [...new Set(usedIn)].join(', ')
  });
});

report.sort((a, b) => b.sizeKB - a.sizeKB);

const totalSize = report.reduce((sum, img) => sum + img.sizeKB, 0);

console.log(`Total Images: ${report.length}`);
console.log(`Total Size: ${(totalSize / 1024).toFixed(2)} MB\n`);

console.log("=== TOP 20 LARGEST IMAGES ===");
report.slice(0, 20).forEach(img => {
  console.log(`${img.basename} | ${img.sizeKB} KB | Format: ${img.format} | Usages: ${img.usages} (${img.usedIn})`);
});

console.log("\n=== UNUSED IMAGES (0 usages found) ===");
report.filter(img => img.usages === 0).forEach(img => {
  console.log(`${img.path} | ${img.sizeKB} KB`);
});

fs.writeFileSync('image-audit-report.json', JSON.stringify(report, null, 2));
console.log("\nFull report saved to image-audit-report.json");
