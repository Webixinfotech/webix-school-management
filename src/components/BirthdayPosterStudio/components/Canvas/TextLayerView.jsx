// src/components/BirthdayPosterStudio/components/Canvas/TextLayerView.jsx
//
// Fixed, non-editable text layer. Position, font, color etc. all come from
// the template and never change — the ONLY thing that varies at render
// time is the text content itself (student name / default note), which is
// swapped in via `displayContent`. No drag, no inline editing: this keeps
// every template pixel-identical to its design no matter what the user does.
import { memo } from 'react';

function TextLayerViewBase({ layer, displayContent }) {
  if (!layer.visible) return null;

  const textShadow = layer.shadow
    ? `${layer.shadow.x ?? 0}px ${layer.shadow.y ?? 2}px ${layer.shadow.blur ?? 8}px ${layer.shadow.color || 'rgba(0,0,0,0.35)'}`
    : 'none';

  const gradientStyle = layer.gradient
    ? {
        backgroundImage: `linear-gradient(90deg, ${layer.gradient[0]}, ${layer.gradient[1]})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }
    : { color: layer.color };

  return (
    <div
      style={{
        position: 'absolute',
        left: layer.x,
        top: layer.y,
        width: layer.w,
        zIndex: layer.z,
        textAlign: layer.align,
        transform: `rotate(${layer.rotation || 0}deg)`,
        pointerEvents: 'none',
        padding: 4,
      }}
    >
      <div
        style={{
          fontFamily: layer.fontFamily,
          fontSize: layer.fontSize,
          fontWeight: layer.fontWeight,
          fontStyle: layer.italic ? 'italic' : 'normal',
          textTransform: layer.uppercase ? 'uppercase' : 'none',
          letterSpacing: layer.letterSpacing,
          lineHeight: layer.lineHeight,
          opacity: (layer.opacity ?? 100) / 100,
          textShadow,
          WebkitTextStroke: layer.stroke ? `${layer.stroke.width}px ${layer.stroke.color}` : undefined,
          wordBreak: 'break-word',
          ...gradientStyle,
        }}
      >
        {displayContent ?? layer.content}
      </div>
    </div>
  );
}

export default memo(TextLayerViewBase);
