// src/components/CertificateStudio/templates.js
//
// Six certificate designs. Each is a genuinely different look because
// `layout` picks a whole corner/border/banner code path in
// CertificateCanvas.jsx:
//
//   'wave'      — diagonal navy/gold swoosh corners, pill banner
//   'wreath'    — engraved double/triple-line frame, pill banner
//   'rosette'   — ribbon banner + star medallions flanking the title
//   'geometric' — angled corner flags + top/bottom colour bars
//   'sunburst'  — soft radiating corner glow, warm pill banner
//   'confetti'  — two-tone diagonal corners + scattered foil dots
//                 (closest to the school's own printed certificate)
//
// IMPORTANT: decoration is a REAL PNG asset (trophy.png / star.png /
// child.png), never a custom inline SVG. html2canvas's SVG support is
// unreliable — nested <defs>/gradients can silently abort the capture
// partway through, which is exactly the "certificate fat raha hai" PDF
// bug this file previously caused. Plain <img> decorations + CSS
// div/gradient corner shapes are the proven-safe combination.

export const ACHIEVEMENT_TEMPLATES = [
  {
    id: 'royal-navy-gold',
    name: 'Royal Navy & Gold',
    bg: '#ffffff',
    accent: '#C9A24B',
    accentDark: '#8a6d1f',
    bandFrom: '#1e3a5f',
    bandTo: '#0f2038',
    decorationImage: 'trophy',
    layout: 'wave',
    certTitle: 'Certificate of Achievement',
  },
  {
    id: 'emerald-elegance',
    name: 'Emerald Elegance',
    bg: '#fbfffb',
    accent: '#d4af37',
    accentDark: '#8a6d1f',
    bandFrom: '#0b3d24',
    bandTo: '#1f7a4d',
    decorationImage: 'trophy',
    layout: 'wreath',
    certTitle: 'Certificate of Excellence',
  },
  {
    id: 'forest-rosette',
    name: 'Forest Rosette',
    bg: '#ffffff',
    accent: '#e3b23c',
    accentDark: '#1d4023',
    bandFrom: '#2f6b3a',
    bandTo: '#0f2b16',
    decorationImage: 'star',
    layout: 'rosette',
    certTitle: 'Scholarship Certificate',
  },
  {
    id: 'fresh-participation',
    name: 'Fresh Participation',
    bg: '#fbfdfb',
    accent: '#0f9d58',
    accentDark: '#0b6b3c',
    bandFrom: '#0f9d58',
    bandTo: '#0b6b3c',
    decorationImage: 'child',
    layout: 'geometric',
    certTitle: 'Certificate of Participation',
  },
  {
    id: 'sunrise-gold',
    name: 'Sunrise Gold',
    bg: '#fffaf0',
    accent: '#e08a1e',
    accentDark: '#8a4f0c',
    bandFrom: '#f5a623',
    bandTo: '#c9781a',
    decorationImage: 'star',
    layout: 'sunburst',
    certTitle: 'Certificate of Merit',
  },
  {
    id: 'brand-classic',
    name: 'Brand Classic',
    bg: '#ffffff',
    accent: '#C9A24B',
    accentDark: '#8a4f0c',
    bandFrom: '#1e3a5f',
    bandTo: '#e08a1e',
    decorationImage: 'trophy',
    layout: 'confetti',
    certTitle: 'Certificate of Achievement',
  },
];

export default ACHIEVEMENT_TEMPLATES;

export const ACHIEVEMENT_TITLES = [
  'Certificate of Achievement',
  'Certificate of Excellence',
  'Scholarship Certificate',
  'Certificate of Participation',
  'Certificate of Merit',
];

export function getTemplateById(id) {
  return ACHIEVEMENT_TEMPLATES.find((t) => t.id === id) || ACHIEVEMENT_TEMPLATES[0];
}