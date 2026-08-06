import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputFile = path.resolve(__dirname, '../public/app_logo.png');
const outputDir = path.resolve(__dirname, '../public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const generateIcon = async (size, name, padding = false) => {
    try {
        let image = sharp(inputFile).resize(size, size, {
            fit: padding ? 'contain' : 'cover',
            background: { r: 255, g: 255, b: 255, alpha: padding ? 1 : 0 }
        });
        
        await image.toFile(path.join(outputDir, name));
        console.log(`Generated ${name} (${size}x${size})`);
    } catch (error) {
        console.error(`Error generating ${name}:`, error);
    }
};

const generateIcons = async () => {
    console.log('Generating PWA Icons...');
    
    // Standard PWA Icons (transparent background is okay, but usually solid is safer. We'll use cover/transparent)
    await generateIcon(192, 'pwa-192x192.png');
    await generateIcon(512, 'pwa-512x512.png');
    
    // Maskable Icons (must have solid background, padding helps prevent logo cut off)
    await generateIcon(192, 'pwa-maskable-192x192.png', true);
    await generateIcon(512, 'pwa-maskable-512x512.png', true);
    
    // Apple Touch Icon (solid background)
    await generateIcon(180, 'apple-touch-icon.png', true);
    
    console.log('Done generating icons.');
};

generateIcons();
