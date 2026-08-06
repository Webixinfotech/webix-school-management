// src/components/BirthdayPosterStudio/utils/download.js
import html2canvas from 'html2canvas';
import { ensureImageUrl } from './image';

export const BASE_SIZE = 1080;
export const EXPORT_SIZES = [1080, 2048, 4096];

/**
 * Waits for all images in a DOM node to fully load before proceeding.
 * This ensures that profile photos and decorative assets are ready
 * before html2canvas captures them.
 */
async function waitForImagesLoaded(node) {
  const images = node.querySelectorAll('img');
  if (images.length === 0) return;

  const imagePromises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      const finish = () => resolve();

      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve();
        return;
      }

      if (typeof img.decode === 'function') {
        img.decode().then(finish).catch(finish);
      }

      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', finish, { once: true });
      setTimeout(finish, 8000);
    });
  });

  await Promise.all(imagePromises);
}

/**
 * Captures the poster node (always laid out at BASE_SIZE) and scales it up
 * with html2canvas's `scale` option so a 4096px export is rendered crisp,
 * not stretched — the DOM itself never changes, only the raster output does.
 *
 * Fix history:
 * - Waits for all images to load before capturing so profile photos and
 *   decorations reliably appear in the downloaded poster.
 * - No longer mutates `<img>.src` directly on the live/portalled node.
 *   That node is rendered and owned by React (PosterCanvas), so writing to
 *   `.src` imperatively here could race with React's own render pass
 *   (e.g. if `exportPhotoSrc` changes again right before capture), causing
 *   the image to flicker back to a remote URL and re-trigger a fresh
 *   network load right as html2canvas reads it — leading to a tainted
 *   canvas or a blank/partial capture. Instead, any URL normalization now
 *   happens ONLY inside html2canvas's `onclone` callback, which operates on
 *   a detached clone of the DOM that React does not manage — safe to mutate
 *   freely with zero risk of fighting a React re-render.
 * - Surfaces a clearer error when the canvas comes back tainted (the
 *   #1 cause of "Download failed" for both uploaded-file and remote/DB
 *   photos): a tainted canvas makes `toBlob` return null rather than throw,
 *   so we now explicitly detect that case and explain it.
 */
export async function exportPoster(node, { format = 'png', size = 1080, filename = 'poster' } = {}) {
  if (!node) throw new Error('Nothing to export yet');

  // Wait for all images (as currently rendered by React) to finish loading
  // before we hand the node to html2canvas.
  await waitForImagesLoaded(node);

  // Small extra delay to let any final layout/paint settle.
  await new Promise((resolve) => setTimeout(resolve, 100));

  const scale = size / BASE_SIZE;

  let canvas;
  try {
    canvas = await html2canvas(node, {
      backgroundColor: format === 'jpg' ? '#ffffff' : null,
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: BASE_SIZE,
      height: BASE_SIZE,
      imageTimeout: 8000,
      onclone: (clonedDocument) => {
        // This clone is a detached copy of the DOM — safe to mutate
        // directly, it is NOT managed by React and nothing will race
        // against these writes.
        const clonedImages = clonedDocument.querySelectorAll('img');
        clonedImages.forEach((img) => {
          img.style.opacity = '1';
          img.style.visibility = 'visible';
          img.style.display = 'block';
          img.decoding = 'async';
          img.loading = 'eager';
          if (img.src && !img.src.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
            img.src = ensureImageUrl(img.src);
          }
        });
      },
    });
  } catch (err) {
    // html2canvas itself throws for some tainted-canvas / cross-origin
    // scenarios depending on browser.
    console.error('html2canvas capture failed:', err);
    throw new Error(
      'Could not capture the poster image. This usually means one of the images (photo or template artwork) is being served without CORS permission. Please try a different photo or contact support.'
    );
  }

  const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const quality = format === 'jpg' ? 0.95 : undefined;

  const blob = await new Promise((resolve, reject) => {
    try {
      canvas.toBlob((value) => {
        if (value) {
          resolve(value);
        } else {
          // A tainted canvas makes toBlob resolve with null instead of
          // throwing — this is the #1 real-world cause of "Download failed"
          // for BOTH uploaded-file photos and remote/database photos, since
          // it can be triggered by ANY image on the canvas (including fixed
          // template artwork), not just the user's own photo.
          reject(
            new Error(
              'Canvas export returned no image data (likely a CORS-tainted canvas — check that all poster images, including template artwork, are served with proper CORS headers).'
            )
          );
        }
      }, mime, quality);
    } catch (err) {
      // Some browsers throw synchronously from toBlob/toDataURL on a
      // tainted canvas instead of resolving null.
      reject(
        new Error(
          'Canvas export failed (tainted canvas). One of the images used in this poster is not CORS-accessible.'
        )
      );
    }
  });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.${format === 'jpg' ? 'jpg' : 'png'}`;
  link.href = objectUrl;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);

  return objectUrl;
}