// src/components/BirthdayPosterStudio/components/Canvas/ScaledCanvas.jsx
import { useEffect, useRef, useState } from 'react';
import PosterCanvas from './PosterCanvas';
import { CANVAS } from '../Templates/templates';

export default function ScaledCanvas({ canvasRef, ...canvasProps }) {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / CANVAS);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(20,10,40,0.35)] ring-1 ring-black/5 bg-white"
      style={{
        backgroundImage:
          'linear-gradient(45deg,#f4f2ee 25%,transparent 25%),linear-gradient(-45deg,#f4f2ee 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f4f2ee 75%),linear-gradient(-45deg,transparent 75%,#f4f2ee 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      }}
    >
      <div style={{ width: CANVAS, height: CANVAS, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <PosterCanvas ref={canvasRef} scale={scale} {...canvasProps} />
      </div>
    </div>
  );
}
