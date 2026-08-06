// src/components/BirthdayPosterStudio/components/Panel/PhotoControls.jsx
//
// Everything the user can do to the photo: replace it, fall back to the
// student's profile picture, and reposition/zoom it inside the (fixed)
// frame. Nothing here can touch layout, colors, text or decorations.
import { useRef } from 'react';
import { Upload, RotateCcw, ZoomIn, ImageOff } from 'lucide-react';
import { fileToDataURL, downscaleToFile } from '../../utils/image';

export default function PhotoControls({
  photoSrc, isCustomPhoto, hasProfilePhoto, zoom,
  onUpload, onUseProfilePhoto, onZoomChange, onResetPosition, toast,
}) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast?.('Please choose an image file', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast?.('Image is too large (max 8MB)', 'error');
      return;
    }
    try {
      let dataUrl;
      try {
        dataUrl = await downscaleToFile(file);
      } catch {
        dataUrl = await fileToDataURL(file); // fallback: use the raw data URL
      }
      onUpload(dataUrl);
    } catch {
      toast?.('Could not read that image, try another', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#2B2440] text-white text-xs font-semibold hover:bg-[#3a2e56] transition-colors"
        >
          <Upload size={13} /> Change photo
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {hasProfilePhoto && isCustomPhoto && (
          <button
            type="button"
            onClick={onUseProfilePhoto}
            title="Use profile photo"
            className="flex items-center justify-center px-3 py-2.5 rounded-xl border border-[#EDE8DC] text-[#6b6478] hover:bg-[#F5F1E8] transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {!photoSrc && (
        <p className="flex items-center gap-1.5 text-[11px] text-[#9a92a8]">
          <ImageOff size={12} /> No photo yet — pick a student or upload one.
        </p>
      )}

      {photoSrc && (
        <>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-[#6b6478] flex items-center gap-1">
                <ZoomIn size={12} /> Zoom
              </label>
              <button
                type="button"
                onClick={onResetPosition}
                className="text-[10px] text-[#9a92a8] hover:text-[#C9A24B] font-medium"
              >
                Reset position
              </button>
            </div>
            <input
              type="range"
              min={0.6}
              max={2.5}
              step={0.01}
              value={zoom}
              onChange={(e) => onZoomChange(parseFloat(e.target.value))}
              className="w-full accent-[#C9A24B]"
            />
          </div>
          <p className="text-[11px] text-[#9a92a8]">Drag the photo on the poster to reposition it.</p>
        </>
      )}
    </div>
  );
}
