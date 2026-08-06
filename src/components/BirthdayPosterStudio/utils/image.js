// src/components/BirthdayPosterStudio/utils/image.js

export const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/** Downscale an uploaded image to a web-friendly size before turning it into a
 *  data URL. Raw phone photos are often 3000px+ / several MB — feeding that
 *  straight into an <img src="data:..."> makes the browser choke (blank /
 *  "never loads" preview). Re-rendering onto a capped canvas keeps the poster
 *  crisp while the data URL stays small and decodes instantly. */
export const downscaleToFile = (file, maxDim = 1200, quality = 0.92) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

let idCounter = 0;
export const uid = (prefix = 'id') => `${prefix}_${Date.now()}_${idCounter++}`;

export const getInitials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '★';

/** Default, non-destructive transform state for a freshly-added photo. */
export const defaultPhotoTransform = () => ({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
  brightness: 100,
  contrast: 100,
  opacity: 100,
  fit: 'cover', // 'cover' (auto fit, never stretches) | 'contain'
});

/**
 * Convert Firebase URL to a version that works with html2canvas.
 * Adds necessary query parameters for CORS and proper handling.
 */
export const ensureImageUrl = (url) => {
  if (!url) return '';
  
  // If it's a data URL, return as-is
  if (url.startsWith('data:')) return url;
  
  // If it's a Firebase Storage URL, add alt=media parameter for proper access
  if (url.includes('firebaseapp.com') || url.includes('firebasestorage.googleapis.com')) {
    // Add alt=media if not already present
    if (!url.includes('alt=media')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}alt=media`;
    }
    return url;
  }
  
  return url;
};

/**
 * Fetches a remote image (S3/Firebase/etc.) and converts it to a base64
 * data-URL. This is the ONLY bulletproof fix for the classic
 * "photo shows fine on screen but is blank in the html2canvas download"
 * bug: other pages in the app (e.g. BirthdaysPage.jsx) load the same
 * photo URL via a plain <img> WITHOUT crossOrigin="anonymous". The browser
 * caches that as a no-cors/opaque response, and when PhotoFrame later
 * requests the exact same URL WITH crossOrigin="anonymous", it can reuse
 * that poisoned cache entry — the <img> still renders visually (browsers
 * don't need CORS just to display a picture), but the pixels are "tainted"
 * for canvas purposes, so html2canvas silently skips drawing it.
 *
 * Converting to a data-URL once, up front, means PhotoFrame never touches
 * the remote URL directly again — no CORS, no cache-poisoning, ever.
 */
export async function toDataURL(url) {
  if (!url || url.startsWith('data:')) return url;

  // Guard against a stalled/blocked request hanging forever (e.g. the media
  // host doesn't send CORS headers at all, so the browser just sits there).
  // Without this, `photoReady` can stay false indefinitely and the download
  // button looks stuck — but the ON-SCREEN preview no longer depends on this
  // promise at all (see PhotoFrame.jsx), so a failure here only affects the
  // export path, never what the user sees while editing.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(ensureImageUrl(url), {
      mode: 'cors',
      cache: 'reload',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('toDataURL: falling back to original URL (CORS/network issue):', url, err);
    return url; // caller still gets something to try rendering
  } finally {
    clearTimeout(timeout);
  }
}