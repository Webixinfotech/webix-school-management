// src/components/BirthdayPosterStudio/utils/shapes.js
//
// Every frame SHAPE the studio supports, as a clip style. Shapes are
// intentionally decoupled from frame STYLE (gold ring, glass, floating
// card, etc — see FRAME_STYLES in PhotoFrame.jsx) so any shape can be
// combined with any premium border treatment.

export const FRAME_SHAPES = [
  'circle',
  'rounded',
  'square',
  'heart',
  'diamond',
  'arch',
  'hexagon',
  'polaroid',
  'filmstrip',
  'scallop',
  'wave',
];

export function shapeStyle(shape, radius = 28) {
  switch (shape) {
    case 'circle':
      return { borderRadius: '50%' };
    case 'rounded':
      return { borderRadius: `${radius}px` };
    case 'square':
      return { borderRadius: '6px' };
    case 'heart':
      return {
        clipPath:
          'polygon(50% 15%, 61% 4%, 75% 4%, 88% 13%, 92% 27%, 88% 43%, 75% 58%, 50% 82%, 25% 58%, 12% 43%, 8% 27%, 12% 13%, 25% 4%, 39% 4%)',
        borderRadius: 0,
      };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', borderRadius: 0 };
    case 'arch':
      return { borderRadius: '50% 50% 6% 6% / 62% 62% 6% 6%' };
    case 'hexagon':
      return {
        clipPath: 'polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)',
        borderRadius: 0,
      };
    case 'polaroid':
      return { borderRadius: '4px' };
    case 'filmstrip':
      return { borderRadius: '10px' };
    case 'scallop':
      return { borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' };
    // Soft asymmetric wave along the bottom edge — reads as "premium" on
    // hero photo crops. Built from percentage points (not path()) so it
    // scales correctly no matter what w/h the template gives the frame.
    case 'wave':
      return {
        clipPath:
          'polygon(0% 0%, 100% 0%, 100% 82%, 88% 87%, 76% 79%, 64% 85%, 52% 92%, 40% 84%, 28% 78%, 16% 86%, 8% 91%, 0% 84%)',
        borderRadius: 0,
      };
    default:
      return { borderRadius: '50%' };
  }
}