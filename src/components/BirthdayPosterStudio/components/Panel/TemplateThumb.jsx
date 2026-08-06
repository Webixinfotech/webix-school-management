// src/components/BirthdayPosterStudio/components/Panel/TemplateThumb.jsx
//
// A tiny, non-interactive, true-to-design preview of one template — used in
// the template picker grid so users see exactly what they're choosing,
// rather than a generic swatch.
import PosterCanvas from '../Canvas/PosterCanvas';
import { CANVAS } from '../Templates/templates';

const THUMB = 132;
const scale = THUMB / CANVAS;

export default function TemplateThumb({ template, name, photoSrc }) {
  return (
    <div
      style={{ width: THUMB, height: THUMB, position: 'relative', overflow: 'hidden' }}
      className="rounded-lg bg-white"
    >
      <div style={{ width: CANVAS, height: CANVAS, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <PosterCanvas template={template} name={name} note="" photoSrc={photoSrc} editable={false} scale={scale} />
      </div>
    </div>
  );
}
