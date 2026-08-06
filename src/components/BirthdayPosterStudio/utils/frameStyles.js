// src/components/BirthdayPosterStudio/utils/frameStyles.js
//
// A frame STYLE is a border/ring/shadow treatment. A frame SHAPE (see
// shapes.js) is the outline the photo gets clipped to. Any style can be
// combined with any shape — PhotoFrame.jsx stacks up to three clipped
// layers (ring -> gap -> border -> photo) using the numbers this file
// returns, so "Luxury Gold + Hexagon" or "Glass + Arch" both just work.
//
// template.photoFrame.style accepts any FRAME_STYLE_KEYS value. Templates
// written before this pass simply omit `style`, which resolves to
// 'classic' and renders exactly like the old single-border frame — so
// nothing existing breaks.

export const FRAME_STYLE_KEYS = [
  'classic',
  'luxuryGold',
  'glass',
  'doubleBorder',
  'softGlow',
  'luxuryRing',
  'floatingCard',
  'premiumWhite',
  'softGradientBorder',
  'modernShadow',
  'paperFrame',
];

const SHADOWS = {
  none: 'none',
  soft: 'drop-shadow(0 14px 24px rgba(0,0,0,0.20))',
  natural: 'drop-shadow(0 18px 30px rgba(0,0,0,0.26))',
  premium: 'drop-shadow(0 26px 46px rgba(0,0,0,0.34))',
  layered:
    'drop-shadow(0 6px 10px rgba(0,0,0,0.18)) drop-shadow(0 24px 40px rgba(0,0,0,0.30))',
  dramatic: 'drop-shadow(0 34px 60px rgba(0,0,0,0.42))',
};

// Resolves a style name + the frame's own colors into concrete layer specs.
// `accent`/`accent2` come from the template; `frame` is template.photoFrame.
export function resolveFrameStyle(styleName, { accent, accent2, frame }) {
  const borderColor = frame.borderColor || '#ffffff';
  const ringColor = frame.ringColor || accent;
  const baseBorderWidth = frame.borderWidth ?? 10;

  switch (styleName) {
    case 'luxuryGold':
      return {
        ring: { width: 4, background: `linear-gradient(135deg, ${accent2 || '#8C6A3F'}, ${accent})` },
        gap: 5,
        border: { width: 10, background: `linear-gradient(135deg, ${accent}, ${accent2 || accent})` },
        shadow: SHADOWS.layered,
        glow: accent,
      };

    case 'glass':
      return {
        ring: { width: 2, background: 'rgba(255,255,255,0.55)' },
        gap: 6,
        border: { width: 1, background: 'rgba(255,255,255,0.35)' },
        shadow: SHADOWS.soft,
        glow: null,
        backdrop: true,
        sheen: true,
      };

    case 'doubleBorder':
      return {
        ring: { width: 8, background: '#ffffff' },
        gap: 6,
        border: { width: baseBorderWidth, background: accent },
        shadow: SHADOWS.natural,
        glow: null,
      };

    case 'softGlow':
      return {
        ring: null,
        gap: 0,
        border: { width: baseBorderWidth, background: borderColor },
        shadow: SHADOWS.soft,
        glow: accent,
        glowSize: 46,
      };

    case 'luxuryRing':
      return {
        ring: { width: 14, background: `conic-gradient(from 180deg, ${accent}, ${accent2 || accent}, ${accent})` },
        gap: 4,
        border: { width: 6, background: '#ffffff' },
        shadow: SHADOWS.premium,
        glow: accent,
      };

    case 'floatingCard':
      return {
        ring: null,
        gap: 0,
        border: { width: 16, background: '#ffffff' },
        shadow: SHADOWS.dramatic,
        glow: null,
      };

    case 'premiumWhite':
      return {
        ring: null,
        gap: 0,
        border: { width: 20, background: '#ffffff' },
        shadow: SHADOWS.natural,
        glow: null,
      };

    case 'softGradientBorder':
      return {
        ring: { width: 9, background: `linear-gradient(135deg, ${accent}, ${accent2 || accent}, ${accent})` },
        gap: 4,
        border: { width: 6, background: '#ffffff' },
        shadow: SHADOWS.soft,
        glow: null,
      };

    case 'modernShadow':
      return {
        ring: null,
        gap: 0,
        border: { width: 4, background: borderColor },
        shadow: SHADOWS.dramatic,
        glow: null,
      };

    case 'paperFrame':
      return {
        ring: { width: 2, background: 'rgba(0,0,0,0.06)' },
        gap: 10,
        border: { width: 14, background: '#FBF8F2' },
        shadow: SHADOWS.natural,
        glow: null,
        paper: true,
      };

    case 'classic':
    default:
      return {
        ring: ringColor ? { width: 8, background: ringColor } : null,
        gap: 0,
        border: { width: baseBorderWidth, background: borderColor },
        shadow: frame.shadow === false ? SHADOWS.none : SHADOWS.natural,
        glow: null,
      };
  }
}