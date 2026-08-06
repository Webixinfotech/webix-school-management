// src/components/BirthdayPosterStudio/components/Canvas/PosterCanvas.jsx
//
// Renders one fixed template. The template's texts, decorations and logo
// are always drawn exactly as designed — the only interactive part is the
// student's photo (drag to reposition, zoom via the slider in the panel).
// This same component is used both for the live, scaled-down preview and
// for the hidden full-resolution node used for the download, so preview
// and download are guaranteed to always match.
import { forwardRef } from 'react';
import PhotoFrame from './PhotoFrame';
import TextLayerView from './TextLayerView';
import DecorationSprite from './DecorationSprite';
import EffectsOverlay from './EffectsOverlay';
import { CANVAS } from '../Templates/templates';

const PosterCanvas = forwardRef(function PosterCanvas(
  { template, name, note, photoSrc, photoTransform, onPanPhoto, scale = 1, editable = false },
  ref
) {
  const effectsMap = Object.fromEntries((template.effects || []).map((e) => [e, true]));
  const logo = template.logo;

  return (
    <div
      ref={ref}
      style={{
        width: CANVAS,
        height: CANVAS,
        position: 'relative',
        overflow: 'hidden',
        background: template.background,
        boxSizing: 'border-box',
      }}
    >
      {/* Optional gradient-mesh / luxury radial glow sitting between the flat
          background and everything else — this is what turns a plain
          gradient into the "lit from one side" look premium templates use. */}
      {template.backgroundGlow && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: template.backgroundGlow,
            pointerEvents: 'none',
          }}
        />
      )}

      <EffectsOverlay effects={effectsMap} accent={template.accent} accent2={template.accent2} />

      <PhotoFrame
        frame={template.photoFrame}
        photoSrc={photoSrc}
        transform={photoTransform}
        name={name}
        accent={template.accent}
        accent2={template.accent2}
        scale={scale}
        editable={editable}
        onPanChange={onPanPhoto}
      />

      {template.decorations.map((d) => (
        <DecorationSprite key={d.id} layer={d} />
      ))}

      {logo?.visible && (
        <>
          {/* Dark-background templates get a soft halo behind the logo so a
              light-on-dark mark never looks like it's floating unlit. */}
          {logo.glow && (
            <div
              style={{
                position: 'absolute',
                left: logo.x - (logo.width ?? logo.size) * 0.25,
                top: logo.y - (logo.height ?? logo.size) * 0.3,
                width: (logo.width ?? logo.size) * 1.5,
                height: (logo.height ?? logo.size) * 1.6,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${logo.glow}55 0%, transparent 70%)`,
                filter: 'blur(10px)',
                zIndex: 14,
                pointerEvents: 'none',
              }}
            />
          )}
          <DecorationSprite isLogo layer={logo} />
        </>
      )}

      {template.texts.map((t) => (
        <TextLayerView
          key={t.id}
          layer={t}
          displayContent={t.role === 'name' ? (name || 'Student Name') : t.role === 'note' ? note : undefined}
        />
      ))}
    </div>
  );
});

export default PosterCanvas;