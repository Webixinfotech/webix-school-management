// src/components/BirthdayPosterStudio/components/Templates/templates.js
//
// Every template is DATA, not a component. PosterCanvas.jsx knows how to
// draw a background glow, a photo frame (shape + style), a text layer, a
// decoration and a logo — a template just describes where those things
// sit and how they look.
//
// DESIGN PASS v3 — "Canva premium" rewrite
// - Canvas is a fixed 1080x1080 square. Every photoFrame below is sized to
//   roughly 65-70% canvas coverage (700-760px) per the hero-photo brief,
//   and checked against the new layered frame system in PhotoFrame.jsx
//   (utils/frameStyles.js) so rings/borders/glows never clip.
// - Typography hierarchy is now three layers, always in this order:
//     HAPPY   -> bold, wide letter-spacing, small
//     Birthday -> luxury script, medium
//     NAME    -> the hero text: large, the one thing nobody misses
//   No more than 3 text layers on any template — that's the whole ask.
// - Backgrounds are luxury gradients (gold / black / navy / rose gold /
//   royal purple / cream / glass) each paired with a `backgroundGlow`
//   radial-mesh layer for depth, rendered by PosterCanvas beneath the
//   effects layer.
// - Decorations only use the 7 PNGs that exist in src/assets/birthday/
//   (blackboxgift, blueBalloon, cake, multiBalloons, orangeBalloon,
//   redBalloon, starBalloon) plus the logo. 2-3 per template, always
//   tucked into a corner the photo/text don't occupy.
// - Logos are sized 140-180px, auto-positioned per layout, and get a soft
//   glow halo (logo.glow) whenever they sit on a dark background.

export const CANVAS = 1080;

// ---- shared palettes -------------------------------------------------
const FONTS = {
  serif: '"Playfair Display", Georgia, serif',
  cinzel: '"Cinzel", "Playfair Display", serif',
  cormorant: '"Cormorant Garamond", Georgia, serif',
  script: '"Great Vibes", "Brush Script MT", cursive',
  roundedDisplay: '"Baloo 2", "Segoe UI Rounded", sans-serif',
  geoDisplay: '"Fredoka", sans-serif',
  editorial: '"Bebas Neue", "Arial Narrow", sans-serif',
  montserrat: '"Montserrat", "Segoe UI", sans-serif',
  body: '"Poppins", "Segoe UI", sans-serif',
  bodySoft: '"Nunito", "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", monospace',
};

const textLayer = (over) => ({
  id: over.id,
  type: 'text',
  role: over.role || 'custom',
  content: over.content ?? '',
  x: over.x,
  y: over.y,
  w: over.w ?? 900,
  align: over.align || 'center',
  rotation: over.rotation || 0,
  fontFamily: over.fontFamily || FONTS.body,
  fontSize: over.fontSize || 32,
  fontWeight: over.fontWeight || 600,
  color: over.color || '#241C33',
  gradient: over.gradient || null, // [c1, c2] -> gradient text
  stroke: over.stroke || null, // { color, width }
  shadow: over.shadow || null, // { color, blur, x, y }
  opacity: over.opacity ?? 100,
  letterSpacing: over.letterSpacing ?? 0,
  lineHeight: over.lineHeight ?? 1.2,
  uppercase: !!over.uppercase,
  italic: !!over.italic,
  visible: true,
  z: over.z ?? 10,
});

const deco = (key, x, y, size, rotation = 0, opacity = 100, z = 5) => ({
  id: `${key}-${x}-${y}`,
  type: 'decoration',
  assetKey: key,
  x,
  y,
  size,
  rotation,
  opacity,
  visible: true,
  z,
});

const frame = (over) => ({
  shape: over.shape || 'circle',
  x: over.x,
  y: over.y,
  w: over.w,
  h: over.h,
  rotation: over.rotation || 0,
  style: over.style || 'classic', // drives ring/border/glow via frameStyles.js
  borderWidth: over.borderWidth ?? 10,
  borderColor: over.borderColor || '#ffffff',
  ringColor: over.ringColor || null,
  shadow: over.shadow !== false,
});

// Builds the standard 3-layer HAPPY / Birthday / NAME hierarchy so every
// template gets the same typographic logic with only colors/fonts varying.
// `y` is the top of the "HAPPY" line; the other two stack below it.
function hierarchy({ y, x = 90, w = 900, align = 'center', happyColor, scriptColor, nameColor, nameFont = FONTS.cinzel, happyFont = FONTS.editorial, nameSize = 84, nameWeight = 700, italic = false, happySize = 58, birthdaySize = 72, happyLetterSpacing = 12 }) {
  return [
    textLayer({ id: 't-happy', role: 'title', content: 'HAPPY', x, y, w, align, fontFamily: happyFont, fontSize: happySize, fontWeight: 800, color: happyColor, letterSpacing: happyLetterSpacing, uppercase: true, z: 12 }),
    textLayer({ id: 't-birthday', role: 'title2', content: 'Birthday', x, y: y + 56, w, align, fontFamily: FONTS.script, fontSize: birthdaySize, fontWeight: 400, color: scriptColor, z: 12 }),
    textLayer({ id: 't-name', role: 'name', x, y: y + 132, w, align, fontFamily: nameFont, fontSize: nameSize, fontWeight: nameWeight, color: nameColor, italic, z: 12 }),
  ];
}

// ---- the 15 templates --------------------------------------------------
export const TEMPLATES = [
  {
    id: 'luxury-gold',
    name: 'Luxury Gold',
    category: 'Premium',
    background: 'linear-gradient(160deg,#1A1108 0%,#2B1D0E 55%,#3D2A12 100%)',
    backgroundGlow: 'radial-gradient(circle at 25% 15%, rgba(244,201,93,0.22) 0%, transparent 55%)',
    accent: '#E8B84B',
    accent2: '#C68A2E',
    photoFrame: frame({ shape: 'arch', x: 190, y: 60, w: 700, h: 720, style: 'luxuryGold' }),
    collage: false,
    texts: hierarchy({ y: 815, happyColor: '#E8B84B', scriptColor: '#F4D98C', nameColor: '#FDF6E3', nameFont: FONTS.cinzel, nameSize: 72 }),
    decorations: [deco('starBalloon', 930, 40, 100, 8), deco('blackboxgift', 40, 900, 100, -8)],
    logo: { x: 40, y: 40, size: 150, opacity: 95, visible: true, glow: '#E8B84B' },
    effects: ['goldDust', 'glow', 'vignette'],
  },
  {
    id: 'corporate-white',
    name: 'Corporate White',
    category: 'Corporate',
    background: 'linear-gradient(180deg,#FFFFFF 0%,#F4F5F7 100%)',
    backgroundGlow: 'radial-gradient(circle at 75% 10%, rgba(31,58,110,0.06) 0%, transparent 55%)',
    accent: '#1F3A6E',
    accent2: '#8FA3C4',
    photoFrame: frame({ shape: 'rounded', x: 170, y: 70, w: 740, h: 690, style: 'modernShadow', borderColor: '#ffffff' }),
    collage: false,
    texts: hierarchy({ y: 800, happyColor: '#8FA3C4', scriptColor: '#1F3A6E', nameColor: '#12213F', nameFont: FONTS.montserrat, nameSize: 62, nameWeight: 700, happyFont: FONTS.mono }),
    decorations: [deco('starBalloon', 930, 810, 80, 6, 70)],
    logo: { x: 40, y: 900, size: 150, opacity: 100, visible: true, glow: null },
    effects: ['vignette'],
  },
  {
    id: 'royal-blue',
    name: 'Royal Blue',
    category: 'Premium',
    background: 'linear-gradient(160deg,#0B1E44 0%,#122B5E 55%,#1C3E7E 100%)',
    backgroundGlow: 'radial-gradient(circle at 20% 20%, rgba(140,180,255,0.20) 0%, transparent 55%)',
    accent: '#9CC1FF',
    accent2: '#F4C95D',
    photoFrame: frame({ shape: 'diamond', x: 170, y: 40, w: 740, h: 740, style: 'luxuryRing' }),
    collage: false,
    texts: hierarchy({ y: 830, happyColor: '#F4C95D', scriptColor: '#9CC1FF', nameColor: '#F3F7FF', nameFont: FONTS.cinzel, nameSize: 68 }),
    decorations: [deco('starBalloon', 60, 40, 100, -8), deco('blackboxgift', 900, 900, 100, 8)],
    logo: { x: 900, y: 40, size: 150, opacity: 100, visible: true, glow: '#9CC1FF' },
    effects: ['fireflies', 'glow', 'vignette'],
  },
  {
    id: 'luxury-black',
    name: 'Luxury Black',
    category: 'Premium',
    background: 'linear-gradient(160deg,#050505 0%,#111111 55%,#1C1C1C 100%)',
    backgroundGlow: 'radial-gradient(circle at 70% 15%, rgba(232,184,75,0.16) 0%, transparent 55%)',
    accent: '#E8B84B',
    accent2: '#EDEDED',
    photoFrame: frame({ shape: 'hexagon', x: 190, y: 50, w: 700, h: 700, style: 'softGlow', borderColor: '#111111' }),
    collage: false,
    texts: hierarchy({ y: 800, happyColor: '#EDEDED', scriptColor: '#E8B84B', nameColor: '#FFFFFF', nameFont: FONTS.cinzel, nameSize: 70 }),
    decorations: [deco('starBalloon', 900, 60, 100, 8), deco('blackboxgift', 60, 900, 100, -6)],
    logo: { x: 40, y: 40, size: 150, opacity: 100, visible: true, glow: '#E8B84B' },
    effects: ['goldDust', 'lightRays', 'vignette'],
  },
  {
    id: 'glass-theme',
    name: 'Glass Theme',
    category: 'Modern',
    background: 'linear-gradient(150deg,#DCEBFF 0%,#EDE7FF 45%,#FFE9F3 100%)',
    backgroundGlow: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.55) 0%, transparent 55%)',
    accent: '#6C8CFF',
    accent2: '#B98CFF',
    photoFrame: frame({ shape: 'rounded', x: 175, y: 70, w: 730, h: 690, style: 'glass' }),
    collage: false,
    texts: hierarchy({ y: 800, happyColor: '#6C8CFF', scriptColor: '#B98CFF', nameColor: '#2B2A44', nameFont: FONTS.montserrat, nameSize: 62 }),
    decorations: [deco('blueBalloon', 900, 60, 90, 6, 85)],
    logo: { x: 40, y: 900, size: 150, opacity: 90, visible: true, glow: null },
    effects: ['glassReflection', 'bokeh', 'vignette'],
  },
  {
    id: 'pinterest-theme',
    name: 'Pinterest Theme',
    category: 'Social',
    background: 'linear-gradient(160deg,#FFF6F2 0%,#FDEDE4 100%)',
    backgroundGlow: 'radial-gradient(circle at 80% 85%, rgba(230,90,80,0.10) 0%, transparent 55%)',
    accent: '#E65C50',
    accent2: '#2B2B2B',
    photoFrame: frame({ shape: 'rounded', x: 150, y: 90, w: 780, h: 640, style: 'floatingCard', borderColor: '#ffffff' }),
    collage: false,
    texts: hierarchy({ y: 770, happyColor: '#E65C50', scriptColor: '#2B2B2B', nameColor: '#1E1E1E', nameFont: FONTS.serif, nameSize: 64 }),
    decorations: [deco('cake', 850, 850, 130, 6, 100)],
    logo: { x: 40, y: 900, size: 150, opacity: 95, visible: true, glow: null },
    effects: ['vignette'],
  },
  {
    id: 'instagram-theme',
    name: 'Instagram Theme',
    category: 'Social',
    background: 'linear-gradient(135deg,#FEDA75 0%,#FA7E1E 30%,#D62976 55%,#962FBF 75%,#4F5BD5 100%)',
    backgroundGlow: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 55%)',
    accent: '#ffffff',
    accent2: '#FEDA75',
    photoFrame: frame({ shape: 'rounded', x: 150, y: 90, w: 780, h: 660, style: 'doubleBorder', borderColor: '#ffffff', ringColor: '#ffffff' }),
    collage: false,
    texts: hierarchy({ y: 790, happyColor: '#ffffff', scriptColor: '#FEDA75', nameColor: '#ffffff', nameFont: FONTS.geoDisplay, nameSize: 62, happyFont: FONTS.mono }),
    decorations: [deco('starBalloon', 920, 60, 100, 8)],
    logo: { x: 40, y: 900, size: 150, opacity: 100, visible: true, glow: '#ffffff' },
    effects: ['confetti', 'glow'],
  },
  {
    id: 'minimal-premium',
    name: 'Minimal Premium',
    category: 'Clean',
    background: 'linear-gradient(180deg,#FDFBF7 0%,#F5F1E8 100%)',
    backgroundGlow: 'radial-gradient(circle at 80% 10%, rgba(176,137,104,0.10) 0%, transparent 55%)',
    accent: '#2B2B2B',
    accent2: '#B08968',
    photoFrame: frame({ shape: 'rounded', x: 160, y: 80, w: 760, h: 690, style: 'premiumWhite' }),
    collage: false,
    texts: hierarchy({ y: 800, happyColor: '#B08968', scriptColor: '#8A6A4C', nameColor: '#2B2B2B', nameFont: FONTS.cormorant, nameSize: 74, happyFont: FONTS.mono }),
    decorations: [deco('redBalloon', 930, 800, 80, 6, 80)],
    logo: { x: 40, y: 900, size: 150, opacity: 90, visible: true, glow: null },
    effects: ['noiseTexture', 'vignette'],
  },
  {
    id: 'modern',
    name: 'Modern',
    category: 'Modern',
    background: 'linear-gradient(135deg,#050505 0%,#111111 48%,#20160B 100%)',
    backgroundGlow: 'radial-gradient(circle at 20% 20%, rgba(232,184,75,0.24) 0%, transparent 58%)',
    accent: '#E8B84B',
    accent2: '#F2E0BB',
    photoFrame: frame({ shape: 'arch', x: 70, y: 80, w: 520, h: 780, style: 'luxuryGold', borderColor: '#111111', ringColor: '#E8B84B' }),
    collage: false,
    texts: [
      textLayer({ id: 't-happy', role: 'title', content: 'HAPPY', x: 620, y: 120, w: 390, align: 'left', fontFamily: FONTS.editorial, fontSize: 64, fontWeight: 800, color: '#E8B84B', letterSpacing: 12, uppercase: true, z: 12 }),
      textLayer({ id: 't-birthday', role: 'title2', content: 'Birthday', x: 620, y: 200, w: 390, align: 'left', fontFamily: FONTS.script, fontSize: 74, fontWeight: 400, color: '#F2E0BB', z: 12 }),
      textLayer({ id: 't-name', role: 'name', x: 620, y: 290, w: 390, align: 'left', fontFamily: FONTS.cinzel, fontSize: 76, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.0, z: 12 }),
    ],
    decorations: [deco('cake', 700, 800, 140, 0, 100)],
    logo: { x: 40, y: 900, size: 150, opacity: 100, visible: true, glow: null },
    effects: ['vignette'],
  },
  {
    id: 'creative',
    name: 'Creative',
    category: 'Playful',
    background: 'linear-gradient(160deg,#FFF4D6 0%,#FFE1EC 50%,#DFF6FF 100%)',
    backgroundGlow: 'radial-gradient(circle at 25% 15%, rgba(255,209,102,0.28) 0%, transparent 55%)',
    accent: '#FF6B9D',
    accent2: '#3FA9F5',
    photoFrame: frame({ shape: 'scallop', x: 170, y: 50, w: 740, h: 720, style: 'softGradientBorder' }),
    collage: false,
    texts: hierarchy({ y: 800, happyColor: '#3FA9F5', scriptColor: '#FF6B9D', nameColor: '#B23A67', nameFont: FONTS.roundedDisplay, nameSize: 70, nameWeight: 800, happyFont: FONTS.geoDisplay }),
    decorations: [deco('multiBalloons', 10, 10, 170, -6), deco('starBalloon', 910, 850, 100, 10)],
    logo: { x: 900, y: 40, size: 150, opacity: 100, visible: true, glow: null },
    effects: ['confetti', 'floatingShapes'],
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'Elegant',
    background: 'radial-gradient(circle at 30% 20%, #FFF0F3 0%, #FDEBD9 55%, #FBE4EC 100%)',
    backgroundGlow: 'radial-gradient(circle at 75% 80%, rgba(194,71,138,0.12) 0%, transparent 55%)',
    accent: '#C2478A',
    accent2: '#E8A54B',
    photoFrame: frame({ shape: 'circle', x: 180, y: 50, w: 720, h: 720, style: 'softGradientBorder' }),
    collage: false,
    texts: hierarchy({ y: 815, happyColor: '#E8A54B', scriptColor: '#C2478A', nameColor: '#5B2A44', nameFont: FONTS.cormorant, nameSize: 74, italic: true }),
    decorations: [deco('orangeBalloon', 930, 800, 90, 10, 90), deco('redBalloon', 40, 800, 80, -10, 80)],
    logo: { x: 40, y: 40, size: 150, opacity: 90, visible: true, glow: null },
    effects: ['sparkles', 'vignette'],
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    category: 'Premium',
    background: 'linear-gradient(160deg,#1B1036 0%,#3A1C5C 55%,#5C2A6D 100%)',
    backgroundGlow: 'radial-gradient(circle at 25% 15%, rgba(216,139,255,0.24) 0%, transparent 55%)',
    accent: '#F4C95D',
    accent2: '#D88BFF',
    photoFrame: frame({ shape: 'diamond', x: 170, y: 40, w: 740, h: 740, style: 'luxuryRing' }),
    collage: false,
    texts: hierarchy({ y: 830, happyColor: '#F4C95D', scriptColor: '#D88BFF', nameColor: '#FCEFC7', nameFont: FONTS.cinzel, nameSize: 68 }),
    decorations: [deco('starBalloon', 50, 40, 100, -8), deco('blackboxgift', 900, 900, 100, 8)],
    logo: { x: 900, y: 40, size: 150, opacity: 100, visible: true, glow: '#D88BFF' },
    effects: ['goldDust', 'glow', 'vignette'],
  },
  {
    id: 'celebration',
    name: 'Celebration',
    category: 'Playful',
    background: 'linear-gradient(160deg,#FFF4E0 0%,#FFE9F0 50%,#E8F6FF 100%)',
    backgroundGlow: 'radial-gradient(circle at 25% 15%, rgba(255,180,84,0.24) 0%, transparent 55%)',
    accent: '#FF5E78',
    accent2: '#5EC8FF',
    photoFrame: frame({ shape: 'circle', x: 220, y: 40, w: 640, h: 640, style: 'doubleBorder', ringColor: '#FFB454' }),
    collage: false,
    effects: ['confetti', 'glow'],
    texts: hierarchy({ y: 700, happyColor: '#5EC8FF', scriptColor: '#FF5E78', nameColor: '#C23652', nameFont: FONTS.roundedDisplay, nameSize: 72, nameWeight: 800, happyFont: FONTS.geoDisplay }),
    decorations: [deco('multiBalloons', 10, 10, 180, -8), deco('cake', 840, 840, 140, 6, 100)],
    logo: { x: 900, y: 40, size: 150, opacity: 100, visible: true, glow: null },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    category: 'Premium',
    background: 'linear-gradient(160deg,#3A1F26 0%,#5C2F3A 55%,#7E4453 100%)',
    backgroundGlow: 'radial-gradient(circle at 25% 15%, rgba(244,168,169,0.24) 0%, transparent 55%)',
    accent: '#F4A8A9',
    accent2: '#E8B84B',
    photoFrame: frame({ shape: 'arch', x: 190, y: 60, w: 700, h: 720, style: 'luxuryGold', ringColor: '#F4A8A9' }),
    collage: false,
    texts: hierarchy({ y: 815, happyColor: '#F4A8A9', scriptColor: '#F4D98C', nameColor: '#FDEEF0', nameFont: FONTS.cinzel, nameSize: 70 }),
    decorations: [deco('starBalloon', 930, 40, 100, 8), deco('blackboxgift', 40, 900, 100, -8)],
    logo: { x: 40, y: 40, size: 150, opacity: 95, visible: true, glow: '#F4A8A9' },
    effects: ['goldDust', 'glow', 'vignette'],
  },
  {
    id: 'ceo-style',
    name: 'CEO Style',
    category: 'Corporate',
    background: 'linear-gradient(160deg,#0E1116 0%,#171B22 55%,#212730 100%)',
    backgroundGlow: 'radial-gradient(circle at 75% 15%, rgba(159,178,255,0.12) 0%, transparent 55%)',
    accent: '#9FB2FF',
    accent2: '#C9CED9',
    photoFrame: frame({ shape: 'rounded', x: 170, y: 70, w: 740, h: 690, style: 'modernShadow', borderColor: '#0E1116' }),
    collage: false,
    texts: hierarchy({ y: 800, happyColor: '#C9CED9', scriptColor: '#9FB2FF', nameColor: '#F3F5FA', nameFont: FONTS.montserrat, nameSize: 60, nameWeight: 700, happyFont: FONTS.mono }),
    decorations: [deco('starBalloon', 930, 800, 80, 6, 60)],
    logo: { x: 40, y: 900, size: 150, opacity: 100, visible: true, glow: '#9FB2FF' },
    effects: ['lightRays', 'vignette'],
  },
];

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];