// src/components/BirthdayPosterStudio/components/Canvas/PhotoFrame.jsx
//
// The ONE editable thing in the whole poster: the student's photo can be
// repositioned (drag) and zoomed (pinch / zoom slider) inside a frame whose
// shape, size, position AND border treatment are fixed by the template.
//
// Redesign pass: frames are now built from up to three stacked, shape-clipped
// layers — RING (outer accent) -> GAP -> BORDER (inner accent, usually white)
// -> PHOTO — driven by frameStyles.js. This is what makes "Luxury Gold",
// "Glass", "Floating Card" etc. all possible on top of the exact same shape
// system, with zero special-casing per shape. The shadow is a
// filter:drop-shadow (not box-shadow) so it always hugs the true clipped
// silhouette — circular, diamond, hexagon, wave, whatever — instead of a
// squared-off box.
import { memo, useState, useEffect } from 'react';
import { shapeStyle } from '../../utils/shapes';
import { resolveFrameStyle } from '../../utils/frameStyles';
import { getInitials, ensureImageUrl } from '../../utils/image';
import { useDrag } from './useDrag';

function PhotoFrameBase({
  frame, photoSrc, transform, name, accent, accent2, accentSoft = 'rgba(0,0,0,0.06)',
  scale, editable, onPanChange,
}) {
  const t = transform || {};
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);

    if (!photoSrc) return undefined;

    // Safety net: if the browser never fires onLoad/onError (can happen on
    // some mobile webviews when a request stalls or gets silently dropped),
    // don't leave the user staring at "Loading…" forever — fall back to the
    // initials placeholder after a few seconds so the UI always resolves.
    const timeout = setTimeout(() => {
      setImageLoaded((loaded) => {
        if (!loaded) setImageError(true);
        return loaded;
      });
    }, 8000);

    return () => clearTimeout(timeout);
  }, [photoSrc]);

  const dragHandlers = useDrag(
    scale,
    ({ dx, dy }) => onPanChange?.({ x: (t.x || 0) + dx, y: (t.y || 0) + dy }),
    editable && !!photoSrc
  );

  const clip = shapeStyle(frame.shape);
  const isPolaroid = frame.shape === 'polaroid';
  const canDrag = editable && !!photoSrc;
  const imageUrl = ensureImageUrl(photoSrc);

  const style = resolveFrameStyle(frame.style || 'classic', { accent, accent2, frame });
  const rotation = frame.rotation || 0;

  // Each concentric layer eats its own width from the outside in, so the
  // innermost "photo" box is always the frame's true content area no
  // matter how many rings/gaps the chosen style stacks on top.
  const ringW = style.ring?.width || 0;
  const gapW = style.gap || 0;
  const borderW = style.border?.width || 0;

  const polaroidPad = isPolaroid ? { padding: '18px 18px 64px 18px', background: '#ffffff' } : {};

  return (
    <div
      style={{
        position: 'absolute',
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.h,
        transform: `rotate(${rotation}deg)`,
        zIndex: 6,
        filter: style.shadow,
      }}
    >
      {/* Ambient glow halo — sits behind everything, ignores clipping on purpose */}
      {style.glow && (
        <div
          style={{
            position: 'absolute',
            inset: -(style.glowSize || 30),
            borderRadius: frame.shape === 'circle' ? '50%' : '32px',
            background: `radial-gradient(circle, ${style.glow}55 0%, transparent 70%)`,
            filter: 'blur(18px)',
            zIndex: -1,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        onMouseDown={canDrag ? dragHandlers.onMouseDown : undefined}
        onMouseMove={canDrag ? dragHandlers.onMouseMove : undefined}
        onMouseUp={canDrag ? dragHandlers.onMouseUp : undefined}
        onMouseLeave={canDrag ? dragHandlers.onMouseLeave : undefined}
        onTouchStart={canDrag ? dragHandlers.onTouchStart : undefined}
        onTouchMove={canDrag ? dragHandlers.onTouchMove : undefined}
        onTouchEnd={canDrag ? dragHandlers.onTouchEnd : undefined}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          cursor: canDrag ? 'grab' : 'default',
          touchAction: canDrag ? 'none' : 'auto',
          ...clip,
          background: style.ring?.background || 'transparent',
          padding: ringW,
          ...polaroidPad,
        }}
      >
        {/* gap ring — reveals the poster background between ring and border,
            which is what makes "double border" read as two separate rings
            instead of one thick blended one */}
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: gapW,
            boxSizing: 'border-box',
            ...clip,
          }}
        >
          <div
            style={{
              width: '100%',
              height: isPolaroid ? `calc(100% - ${64 - 18}px)` : '100%',
              padding: borderW,
              boxSizing: 'border-box',
              background: style.border?.background || '#ffffff',
              ...clip,
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                background: '#fff',
                ...clip,
              }}
            >
              {photoSrc && !imageError ? (
                <>
                  {!imageLoaded && (
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: accentSoft,
                        color: accent,
                        fontSize: '12px',
                        fontFamily: '"Baloo 2", sans-serif',
                        zIndex: 1,
                      }}
                    >
                      Loading...
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt={name || 'photo'}
                    draggable={false}
                    decoding="async"
                    loading="eager"
                    // Marks this as THE profile-photo element so the export
                    // readiness check in index.jsx can reliably target it
                    // instead of any other <img> that might exist inside
                    // the template (logos, decorative art, etc). Without
                    // this, querySelector('img') could grab the wrong node
                    // and the download would fire before this photo was
                    // actually ready, producing a tainted/blank capture.
                    data-role="photo"
                    // IMPORTANT: do NOT set crossOrigin="anonymous" here.
                    // html2canvas already manages CORS internally via its
                    // own `useCORS` option — this attribute does nothing to
                    // help the export. What it DOES do is force the browser
                    // to require a real Access-Control-Allow-Origin header
                    // from the photo host just to display the image at all.
                    // Most photo hosts (Firebase Storage default config,
                    // plain static hosting, etc.) don't send that header,
                    // so setting this attribute made the <img> fail to load
                    // entirely — blank photo both on screen and in the
                    // download — instead of just being canvas-tainted. The
                    // real, reliable fix for export is the data-URL
                    // conversion below (`prepareExportPhoto`/`toDataURL()`),
                    // which sidesteps CORS entirely because a data: URL is
                    // never cross-origin.
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      console.warn('Failed to load profile photo:', {
                        originalSrc: photoSrc,
                        processedSrc: imageUrl,
                        error: e,
                      });
                      setImageError(true);
                    }}
                    style={{
                      position: 'absolute',
                      // Hero-scale crop: photo fills well past the frame box
                      // so panning never reveals empty edges, at any zoom.
                      width: `${140 * (t.scale || 1)}%`,
                      height: `${140 * (t.scale || 1)}%`,
                      left: `calc(50% + ${t.x || 0}px - ${70 * (t.scale || 1)}%)`,
                      top: `calc(50% + ${t.y || 0}px - ${70 * (t.scale || 1)}%)`,
                      objectFit: 'cover',
                      userSelect: 'none',
                      pointerEvents: 'none',
                      opacity: imageLoaded ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                    }}
                  />
                  {/* Subtle top-light sheen — a cheap but effective way to make
                      a flat photo read as "lit" rather than pasted on */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(165deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 30%, rgba(0,0,0,0.10) 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                  {style.sheen && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(120deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 35%)',
                        mixBlendMode: 'screen',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </>
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: Math.min(frame.w, frame.h) * 0.32,
                    fontWeight: 800,
                    color: accent,
                    background: accentSoft,
                    fontFamily: '"Baloo 2", sans-serif',
                  }}
                >
                  {getInitials(name)}
                </div>
              )}
            </div>
          </div>      
        </div>
      </div>
    </div>
  );
}

export default memo(PhotoFrameBase);