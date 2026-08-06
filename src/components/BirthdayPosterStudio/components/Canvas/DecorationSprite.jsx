// src/components/BirthdayPosterStudio/components/Canvas/DecorationSprite.jsx
//
// Fixed, non-editable decoration/logo sprite. Position, size and rotation
// always come from the template — decorations are part of the template's
// fixed design and are never dragged, added or removed by the user.
//
// Logo fix: the real logo (Brain Builder International) is a wide
// landscape mark, not a square. Forcing it into a square box wasted most
// of the box as empty padding and made the mark render tiny. Sprites now
// accept an optional `width`/`height` pair — used for the logo — and fall
// back to the old square `size` for every decoration PNG, so nothing else
// changes.
import { memo } from 'react';
import { DECORATIONS, LOGO_SRC } from '../../assets';

function DecorationSpriteBase({ layer, isLogo }) {
  if (!layer.visible) return null;
  const src = isLogo ? LOGO_SRC : DECORATIONS[layer.assetKey]?.src;
  if (!src) return null;

  const width = layer.width ?? layer.size;
  const height = layer.height ?? layer.size;

  return (
    <div
      style={{
        position: 'absolute',
        left: layer.x,
        top: layer.y,
        width,
        height,
        zIndex: layer.z ?? 15,
        transform: `rotate(${layer.rotation || 0}deg)`,
        pointerEvents: 'none',
      }}
    >
      <img
        src={src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: (layer.opacity ?? 100) / 100,
          filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.22))',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default memo(DecorationSpriteBase);