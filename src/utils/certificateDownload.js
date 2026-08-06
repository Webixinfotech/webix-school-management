// src/utils/certificateDownload.js
//
// Same proven "what you see is exactly what downloads" pattern as
// BirthdayPosterStudio/utils/download.js — reused here (not duplicated logic,
// just resized for a landscape certificate/document instead of a square poster).

import html2pdf from 'html2pdf.js';

// Achievement certificate renders at a fixed landscape size.
export const CERT_WIDTH = 1400;
export const CERT_HEIGHT = 990;

// A4 portrait documents (Leaving / Experience) at 96 DPI.
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

// ── Fonts used anywhere on the certificate canvas ──
// html2canvas rasterises using whatever the browser has ACTUALLY finished
// loading at the moment .save() runs. If a webfont (Berkshire Swash /
// Playfair Display / Poppins) hasn't finished downloading yet, the canvas
// silently falls back to a system font — this is what was happening: the
// on-screen preview looked fine (browser re-paints once the font arrives)
// but the exported PDF had already been rasterised with the fallback.
//
// IMPORTANT: only request the exact weights that are actually used in
// CertificateCanvas.jsx. Berkshire Swash only ships a 400 weight — asking
// the browser for "700 Berkshire Swash" makes it synthesize a fake bold,
// and that synthesized bold is what was rendering wrong / inconsistently
// in html2canvas. Keep this list in sync with the fontFamily/fontWeight
// pairs used in the canvas component.
const REQUIRED_FONTS = [
  '400 40px "Berkshire Swash"', // school name + banner titles
  '700 44px "Playfair Display"', // student name
  '400 16px "Poppins"',
  '600 16px "Poppins"',
  '700 16px "Poppins"',
];

async function waitForFontsReady() {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all(REQUIRED_FONTS.map((f) => document.fonts.load(f)));
    await document.fonts.ready;
  } catch (e) {
    // Don't block export if font-loading introspection fails somewhere —
    // worst case we fall back to whatever is already loaded.
    console.warn('Font preload check failed, continuing with export:', e);
  }

  // document.fonts.ready resolving does NOT guarantee the browser has
  // actually repainted the page with the new font metrics yet — layout
  // for elements whose size depends on the font (e.g. a centered banner
  // sized to its text) can still reflect stale (fallback-font) metrics
  // for one more frame. Two rAFs guarantees at least one full paint cycle
  // has happened with the real font applied before html2canvas measures
  // and rasterises the DOM. Without this, centered/auto-width text
  // elements using a webfont could get captured mid-reflow — correct on
  // screen a moment later, wrong in the exported PDF.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

async function waitForImagesLoaded(node) {
  const images = node.querySelectorAll('img');
  if (images.length === 0) return;
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise((resolve) => {
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
        })
    )
  );
}

/**
 * PDF download — preview jaisa exact page-size PDF.
 *
 * For A4 documents pass { width: A4_WIDTH, height: A4_HEIGHT }.
 * The PDF page dimensions are derived directly from the same px values
 * (at 96 DPI) so the rasterised output fills the page at 1:1 scale.
 */
export async function downloadPDFDocumentNode(node, filename = 'document', capture = {}) {
  if (!node) throw new Error('Nothing to export yet');

  const width = capture.width || CERT_WIDTH;
  const height = capture.height || CERT_HEIGHT;

  // Fonts first, then images — fonts affect text layout/width, so we want
  // them settled before we even check image layout, and definitely before
  // html2canvas rasterises anything.
  await waitForFontsReady();
  await waitForImagesLoaded(node);
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Use node's natural height so long content never clips.
  const captureHeight = Math.max(height, node.offsetHeight || height);
  const isLandscape = width > height;

  // Derived page size in mm at 96 DPI.
  const mmPerPx = 25.4 / 96;
  const pageWidthMm = +(width * mmPerPx).toFixed(2);
  const pageHeightMm = +(captureHeight * mmPerPx).toFixed(2);

  await html2pdf()
    .set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width,
        height: captureHeight,
        backgroundColor: '#ffffff',
        imageTimeout: 8000,
        onclone: (clonedDocument) => {
          const clonedImages = clonedDocument.querySelectorAll('img');
          clonedImages.forEach((img) => {
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            img.style.display = 'block';
            img.decoding = 'async';
            img.loading = 'eager';
            if (img.src && !img.src.startsWith('data:')) {
              img.crossOrigin = 'anonymous';
            }
          });

          // Belt-and-suspenders: force the cloned document to also pick up
          // the same @font-face rules. Google Fonts <link> tags are in the
          // real <head> and get copied into the clone by html2canvas, but
          // if a link is ever moved into a stylesheet import instead, this
          // guarantees the cloned iframe still has it.
          const hasFontLink = Array.from(clonedDocument.querySelectorAll('link')).some((l) =>
            (l.href || '').includes('fonts.googleapis.com')
          );
          if (!hasFontLink) {
            const link = clonedDocument.createElement('link');
            link.rel = 'stylesheet';
            link.href =
              'https://fonts.googleapis.com/css2?family=Berkshire+Swash&family=Playfair+Display:wght@700&family=Poppins:ital,wght@0,400;0,600;0,700;1,400&display=swap';
            clonedDocument.head.appendChild(link);
          }
        },
      },
      jsPDF: {
        unit: 'mm',
        format: [pageWidthMm, pageHeightMm],
        orientation: isLandscape ? 'l' : 'p',
        hotfixes: ['px_scaling'],
      },
    })
    .from(node)
    .save();
}