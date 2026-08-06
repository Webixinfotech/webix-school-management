// src/components/BirthdayPosterStudio/components/Canvas/EffectsOverlay.jsx
//
// Every effect here is deliberately subtle — these sit ON TOP of a hero
// photo and premium typography, so their job is to add atmosphere without
// competing for attention. Each is its own tiny component so templates can
// mix any combination (e.g. `effects: ['goldDust', 'lightRays', 'glow']`)
// without paying for the ones they don't use.
import { memo, useMemo } from 'react';

// Deterministic pseudo-random so a given template's particle field never
// reshuffles between re-renders (would look like flickering).
const rand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

function Confetti({ colors }) {
  const items = useMemo(() => Array.from({ length: 26 }).map((_, i) => ({
    x: rand(i * 3.1) * 100, y: rand(i * 7.7) * 100,
    r: 4 + rand(i * 2.3) * 6, rot: rand(i * 5.5) * 360,
    c: colors[i % colors.length], shape: i % 3,
  })), [colors]);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      {items.map((it, i) => (
        <g key={i} transform={`translate(${it.x},${it.y}) rotate(${it.rot})`} opacity="0.85">
          {it.shape === 0 && <rect x={-it.r / 2} y={-it.r / 4} width={it.r} height={it.r / 2} rx="1" fill={it.c} />}
          {it.shape === 1 && <circle r={it.r / 2.6} fill={it.c} />}
          {it.shape === 2 && <polygon points={`0,-${it.r / 2} ${it.r / 2},${it.r / 2} -${it.r / 2},${it.r / 2}`} fill={it.c} />}
        </g>
      ))}
    </svg>
  );
}

function Sparkles({ color, count = 16 }) {
  const items = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    x: rand(i * 4.2) * 100, y: rand(i * 9.1) * 100, s: 8 + rand(i * 1.7) * 14,
  })), [count]);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      {items.map((it, i) => (
        <path key={i} transform={`translate(${it.x},${it.y})`}
          d={`M0,-${it.s / 14} L${it.s / 70},-${it.s / 70} L${it.s / 14},0 L${it.s / 70},${it.s / 70} L0,${it.s / 14} L-${it.s / 70},${it.s / 70} L-${it.s / 14},0 L-${it.s / 70},-${it.s / 70} Z`}
          fill={color} opacity={0.5 + rand(i * 6.6) * 0.4} />
      ))}
    </svg>
  );
}

// Fine golden motes drifting across the frame — reads as "premium dust",
// distinct from the sharper 4-point Sparkles above.
function GoldDust() {
  const items = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    x: rand(i * 2.1) * 100, y: rand(i * 8.4) * 100, r: 0.6 + rand(i * 3.3) * 1.4,
  })), []);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      {items.map((it, i) => (
        <circle key={i} cx={it.x} cy={it.y} r={it.r} fill="#F4C95D" opacity={0.4 + rand(i) * 0.4} />
      ))}
    </svg>
  );
}

function Bokeh() {
  const items = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    x: rand(i * 5.9) * 100, y: rand(i * 3.7) * 100, r: 6 + rand(i * 1.1) * 10,
  })), []);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen' }}>
      {items.map((it, i) => (
        <circle key={i} cx={it.x} cy={it.y} r={it.r} fill="#ffffff" opacity={0.12 + rand(i) * 0.1} />
      ))}
    </svg>
  );
}

// Warm, low-opacity points that read as candlelight/fireflies rather than
// confetti — best on dark luxury backgrounds.
function Fireflies({ color }) {
  const items = useMemo(() => Array.from({ length: 14 }).map((_, i) => ({
    x: rand(i * 6.3) * 100, y: rand(i * 2.9) * 100, r: 1 + rand(i * 4.4) * 1.6,
  })), []);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      {items.map((it, i) => (
        <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={color} opacity={0.3 + rand(i * 3.1) * 0.5}>
          <animate attributeName="opacity" values={`${0.15};${0.55};${0.15}`} dur={`${3 + rand(i) * 3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

// Large, very soft translucent circles drifting behind the subject —
// gives a poster depth without ever reading as "clip art".
function FloatingShapes({ colors }) {
  const items = useMemo(() => Array.from({ length: 5 }).map((_, i) => ({
    x: rand(i * 7.1) * 100, y: rand(i * 5.5) * 100, r: 14 + rand(i * 2.2) * 16,
    c: colors[i % colors.length],
  })), [colors]);
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
      {items.map((it, i) => (
        <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={it.c} opacity="0.08" />
      ))}
    </svg>
  );
}

// A soft diagonal streak of light — cheap, but does a lot of work to make
// a flat gradient background feel like it was lit for a photoshoot.
function LightRays({ color }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-20%',
        background: `conic-gradient(from 200deg at 30% 10%, ${color}22 0deg, transparent 30deg, transparent 360deg)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
}

// A single satin ribbon banner, purely decorative — sits low-opacity in a
// corner so it never competes with the name/photo.
function Ribbon({ color, color2 }) {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <polygon points="0,0 22,0 6,18" fill={color} opacity="0.9" />
      <polygon points="0,0 14,0 4,11" fill={color2} opacity="0.7" />
    </svg>
  );
}

// Fine film-grain noise so flat gradients don't look flat/digital — this is
// the same trick print designers use to kill color banding.
function NoiseTexture() {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <filter id="posterNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#posterNoise)" />
    </svg>
  );
}

// A faint diagonal sheen across the whole canvas, like light catching glass
// — pairs with the "glass" photo frame style to tie the look together.
function GlassReflection() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.06) 100%)',
        pointerEvents: 'none',
      }}
    />
  );
}

const EFFECT_LIST = [
  { id: 'confetti', label: 'Confetti' },
  { id: 'sparkles', label: 'Luxury Sparkles' },
  { id: 'goldDust', label: 'Golden Particles' },
  { id: 'bokeh', label: 'Bokeh' },
  { id: 'fireflies', label: 'Fireflies' },
  { id: 'floatingShapes', label: 'Floating Shapes' },
  { id: 'glow', label: 'Glow' },
  { id: 'lightLeak', label: 'Light Leak' },
  { id: 'lightRays', label: 'Light Rays' },
  { id: 'ribbon', label: 'Ribbon' },
  { id: 'noiseTexture', label: 'Noise Texture' },
  { id: 'glassReflection', label: 'Glass Reflection' },
  { id: 'vignette', label: 'Luxury Overlay' },
];

function EffectsOverlayBase({ effects, accent, accent2 }) {
  if (!effects) return null;
  return (
    <>
      {effects.glow && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 38%, ${accent}33 0%, transparent 60%)`,
          pointerEvents: 'none',
        }} />
      )}
      {effects.lightLeak && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(120deg, ${accent2}22 0%, transparent 40%, transparent 70%, ${accent}22 100%)`,
          mixBlendMode: 'screen', pointerEvents: 'none',
        }} />
      )}
      {effects.floatingShapes && <FloatingShapes colors={[accent, accent2]} />}
      {effects.lightRays && <LightRays color="#ffffff" />}
      {effects.confetti && <Confetti colors={[accent, accent2, '#ffffff', '#F4C95D']} />}
      {effects.sparkles && <Sparkles color={accent2} />}
      {effects.goldDust && <GoldDust />}
      {effects.bokeh && <Bokeh />}
      {effects.fireflies && <Fireflies color="#F4C95D" />}
      {effects.ribbon && <Ribbon color={accent} color2={accent2} />}
      {effects.glassReflection && <GlassReflection />}
      {/* Vignette + noise always render last, above everything else, since
          they're meant to unify the whole composition rather than sit as a
          discrete "sticker" like the effects above. */}
      {effects.vignette && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(0,0,0,0.16) 100%)',
          pointerEvents: 'none',
        }} />
      )}
      {effects.noiseTexture && <NoiseTexture />}
    </>
  );
}

export default memo(EffectsOverlayBase);
export { EFFECT_LIST };