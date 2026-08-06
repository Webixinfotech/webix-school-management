const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS_DIR = path.join(__dirname, '../src/assets');
const OPTIMIZED_DIR = path.join(__dirname, '../src/assets/optimized');

const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const svgExtension = '.svg';

// Utility to recursively find files
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'optimized') {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

// Map filenames to SEO friendly names and categories
function getSeoNameAndCategory(basename) {
  const name = path.basename(basename, path.extname(basename)).toLowerCase();
  
  if (name.includes('hero') || name.includes('best-toddler') || name.includes('kg1') || name.includes('kg2') || name.includes('teacher-training')) {
    return { category: 'hero', seoName: `brain-builder-hero-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
  }
  if (name.includes('award')) {
    return { category: 'awards', seoName: `brain-builder-award-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
  }
  if (name.includes('squirrel') || name.includes('kids') || name.includes('founder') || name.includes('director') || name.includes('principal') || name.includes('child')) {
    return { category: 'mascots', seoName: `brain-builder-mascot-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
  }
  if (name.includes('logo') || name.includes('talengym')) {
    return { category: 'logo', seoName: `brain-builder-logo-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
  }
  if (name.includes('attendance') || name.includes('sleep') || name.includes('food') || name.includes('dress') || name.includes('mood') || name.includes('health') || name.includes('activity')) {
    return { category: 'activities', seoName: `brain-builder-activity-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
  }
  if (name.includes('preschool') || name.includes('daycare') || name.includes('nursery') || name.includes('playgroup') || name.includes('workshops')) {
    return { category: 'programs', seoName: `brain-builder-program-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
  }
  
  return { category: 'general', seoName: `brain-builder-asset-${name.replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-') };
}

async function optimizeImages() {
  if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
  }

  const files = getAllFiles(ASSETS_DIR);
  const mapping = {};

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const basename = path.basename(file);
    const relativeOldPath = path.relative(ASSETS_DIR, file).replace(/\\/g, '/');
    
    if (imageExtensions.includes(ext) || ext === svgExtension) {
      const { category, seoName } = getSeoNameAndCategory(basename);
      
      const categoryDir = path.join(OPTIMIZED_DIR, category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }

      const isSvg = ext === svgExtension;
      const finalExt = isSvg ? '.svg' : '.webp';
      const newBasename = `${seoName}${finalExt}`;
      const newPath = path.join(categoryDir, newBasename);
      const relativeNewPath = `optimized/${category}/${newBasename}`;

      try {
        if (isSvg) {
          // Just copy SVG
          fs.copyFileSync(file, newPath);
        } else {
          // Optimize Raster
          let width = 800; // default for general/programs
          let quality = 75; // default quality

          if (category === 'hero') {
            width = 1920;
            quality = 80;
          } else if (category === 'logo') {
            width = 400;
            quality = 90; // logos need crisp edges
          } else if (category === 'awards') {
            width = 600;
            quality = 80;
          } else if (category === 'mascots') {
            width = 600;
            quality = 80;
          }

          const metadata = await sharp(file).metadata();
          const targetWidth = Math.min(metadata.width || width, width); // never upscale

          await sharp(file)
            .resize({ width: targetWidth, withoutEnlargement: true })
            .webp({ quality, effort: 6 })
            .toFile(newPath);
        }
        
        mapping[relativeOldPath] = relativeNewPath;
        console.log(`✅ Optimized: ${relativeOldPath} -> ${relativeNewPath}`);
      } catch (err) {
        console.error(`❌ Failed to process ${relativeOldPath}:`, err);
      }
    }
  }

  // Save the mapping for the update script
  const mapPath = path.join(__dirname, 'image-mapping.json');
  fs.writeFileSync(mapPath, JSON.stringify(mapping, null, 2));
  console.log(`\n🎉 Optimization complete! Mapping saved to ${mapPath}`);
}

optimizeImages();
