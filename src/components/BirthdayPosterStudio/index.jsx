// src/components/BirthdayPosterStudio/index.jsx
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Download, Loader2 } from 'lucide-react';
import ControlPanel from './components/Panel/ControlPanel';
import ScaledCanvas from './components/Canvas/ScaledCanvas';
import PosterCanvas from './components/Canvas/PosterCanvas';
import { CANVAS } from './components/Templates/templates';
import { usePosterState } from './hooks/usePosterState';
import { exportPoster } from './utils/download';

/**
 * BirthdayPosterStudio
 *
 * Drop-in replacement for the old PosterStudio component. Same public API:
 *   <BirthdayPosterStudio birthdays={birthdays} onToast={showToast} />
 *
 * `birthdays` items are expected in the same shape the existing API already
 * returns: { id, name, phone, photo, daysRemaining, class? }. Nothing about
 * how that data is fetched has changed — this component only consumes it.
 *
 * Every poster design is FIXED (see components/Templates/templates.js).
 * The only things a user can change are: which template, which student,
 * the name shown, and the photo (upload + drag to reposition + zoom).
 * The preview shown on screen is exactly what gets downloaded.
 */
export default function BirthdayPosterStudio({ birthdays = [], onToast }) {
  const s = usePosterState();
  const exportRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const toast = (msg, type = 'success') => onToast?.(msg, type);

  // Auto-select the first student on initial load to show a preview
  useEffect(() => {
    if (birthdays.length > 0 && !s.selectedPersonId) {
      console.log('Auto-selecting first student:', {
        total: birthdays.length,
        first: birthdays[0],
      });
      s.selectStudent(String(birthdays[0].id), birthdays);
    }
  }, [birthdays.length, s.selectedPersonId, s]);

  const handleDownload = async () => {
    if (!s.name.trim()) {
      toast('Add a name before downloading', 'error');
      return;
    }
    if (!s.photoReady) {
      toast('Just a sec, still preparing the photo…', 'error');
      return;
    }
    setDownloading(true);
    try {
      if (!exportRef.current) {
        throw new Error('Poster export node is not ready');
      }

      // Make sure the hidden export node has a canvas-safe data URL before
      // we capture it (the on-screen preview may still be on the raw remote URL).
      // Note: prepareExportPhoto already calls setExportPhotoSrc internally
      // and updates s.exportPhotoSrc via React state — the hook does NOT
      // expose a standalone setExportPhotoSrc setter, so we must not call
      // one here. We just await it so the readiness-check loop below sees
      // the updated exportPhotoSrc on its next render.
      const preparedSrc = await s.prepareExportPhoto(s.photoSrc);

      // If the photo is a remote URL, prepareExportPhoto MUST have turned it
      // into a data: URL by now (that's the only reliable way to get a
      // non-tainted canvas). If it's still a remote URL here, the
      // fetch()-based conversion in toDataURL() failed — almost always
      // because the photo host isn't sending CORS headers the browser will
      // accept. Rather than silently downloading a poster with a blank
      // photo (which is what happened before), fail loudly so it's obvious
      // what needs fixing on the backend/storage side.
      if (preparedSrc && !preparedSrc.startsWith('data:')) {
        throw new Error(
          'Could not prepare the photo for download (the photo host may be blocking cross-origin access). Please try re-uploading the photo, or contact support if this keeps happening.'
        );
      }

      // Wait until the hidden export node's PHOTO <img> has actually swapped
      // to a decoded DATA URL. We must target the photo element specifically
      // (via data-role="photo") — not just the first <img> in the node —
      // because the poster template may contain other decorative/static
      // <img> tags (logos, badges, background art) that are already loaded
      // and would make querySelector('img') resolve immediately even though
      // the real user photo hasn't finished converting yet. That premature
      // resolve was causing html2canvas to capture a stale/remote <img>,
      // producing a tainted canvas and a failed toDataURL/toBlob — which is
      // why downloads were failing for BOTH uploaded-file photos and
      // database/remote photos alike.
      //
      // Do NOT resolve on a stale/remote <img>, otherwise html2canvas
      // captures a tainted image and toDataURL throws. Give it a reasonable
      // timeout so we don't hang forever.
      await new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
          const img = exportRef.current?.querySelector('img[data-role="photo"]');
          const ready =
            img &&
            ((img.src && img.src.startsWith('data:') && img.complete && img.naturalWidth > 0) ||
              (img.complete && img.naturalWidth > 0 && img.src === s.exportPhotoSrc));
          if (ready || Date.now() - start > 8000) return resolve();
          requestAnimationFrame(check);
        };
        check();
      });

      await exportPoster(exportRef.current, {
        format: 'png',
        size: 2048,
        filename: (s.name || 'birthday-poster').trim().replace(/\s+/g, '-').toLowerCase(),
      });
      toast('Poster downloaded 🎉');
    } catch (err) {
      console.error('Birthday poster download failed:', err);
      toast(err?.message || 'Download failed, please try again', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const canvasProps = {
    template: s.template,
    name: s.name,
    note: s.note,
    photoSrc: s.photoSrc,
    photoTransform: s.photoTransform,
    onPanPhoto: s.panPhoto,
  };

  return (
    <div className="h-full min-h-[640px] flex flex-col bg-[#F4F1EA] rounded-2xl overflow-hidden border border-[#EDE8DC]">
      {/* Header */}
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-[#EDE8DC] bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B1230] to-[#3a2145] flex items-center justify-center shrink-0">
            <Sparkles size={15} className="text-[#C9A24B]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[#2B2440] leading-tight">Birthday Poster Studio</div>
            <div className="text-[11px] text-[#9a92a8] leading-tight truncate">{s.template.name} template</div>
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || !s.photoReady}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A24B] to-[#a8842f] text-white text-xs font-semibold disabled:opacity-60 shrink-0"
        >
          {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          <span>Download</span>
        </button>
      </div>

      {/* Body: canvas + panel, stacked on mobile, side-by-side from lg up */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-1 lg:overflow-y-auto flex items-start justify-center p-4 md:p-8">
          <div className="w-full max-w-md">
            <ScaledCanvas {...canvasProps} editable />
            <p className="text-center text-[11px] text-[#9a92a8] mt-3">
              Drag the photo to reposition it · what you see here is exactly what downloads
            </p>
          </div>
        </div>

        <div className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-[#EDE8DC] bg-[#F4F1EA] lg:overflow-y-auto p-4">
          <ControlPanel s={s} birthdays={birthdays} toast={toast} />
        </div>
      </div>

      {/*
        Hidden, unscaled, full-resolution clone of the poster used ONLY for
        export. The visible preview above is deliberately shrunk with a CSS
        transform (`scale(...)`) so it fits the screen — but html2canvas
        renders a node based on its own layout box, and capturing a node
        that sits inside a transform-scaled ancestor produces exactly the
        squished / overlapping / cropped output you saw. Rendering a second,
        identical copy at true 1080×1080 size, off-screen via a portal
        (so no ancestor transform, overflow or scale can touch it), and
        capturing THAT instead, guarantees the download always matches the
        editor pixel-for-pixel.

        NOTE: PosterCanvas is expected to render the user's profile photo
        <img> with a `data-role="photo"` attribute so the readiness check
        above can reliably target it instead of any other decorative
        <img> tags that may exist inside the template.
      */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: CANVAS,
              height: CANVAS,
              pointerEvents: 'none',
              opacity: 0,
              zIndex: -1,
              overflow: 'visible',
            }}
          >
            <PosterCanvas ref={exportRef} scale={1} editable={false} {...canvasProps} photoSrc={s.exportPhotoSrc} />
          </div>,
          document.body
        )}
    </div>
  );
}