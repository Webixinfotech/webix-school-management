import { useState, useEffect, useRef } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);
  const pointsRef = useRef([]);
  const animationRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    const trail = trailRef.current;
    
    if (!cursor || !trail) return;

    const moveCursor = (e) => {
      const { clientX, clientY } = e;
      
      // Update main cursor position
      cursor.style.left = clientX + 'px';
      cursor.style.top = clientY + 'px';
      
      // Update ripple position
      setCursorPos({ x: clientX, y: clientY });
      
      // Add point to trail
      pointsRef.current.push({ x: clientX, y: clientY });
      if (pointsRef.current.length > 25) {
        pointsRef.current.shift();
      }
      
      updateTrail();
    };

    const updateTrail = () => {
      if (pointsRef.current.length < 2) return;
      
      const points = pointsRef.current;
      let pathD = `M ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
      
      trail.setAttribute('d', pathD);
    };

    const animateTrail = () => {
      // Fade out older points
      pointsRef.current = pointsRef.current.filter((_, i) => {
        return i > pointsRef.current.length - 15;
      });
      updateTrail();
      animationRef.current = requestAnimationFrame(animateTrail);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' ||
          target.closest('a') || target.closest('button') ||
          target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsHovering(true);
      }
    };

    const handleMouseOut = () => setIsHovering(false);
    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    // Only enable custom cursor on desktop (screen width > 768px)
    const isMobile = window.innerWidth <= 768;
    
    if (!isMobile) {
      document.addEventListener('mousemove', moveCursor);
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('mouseout', handleMouseOut);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);

      // Start trail animation
      animationRef.current = requestAnimationFrame(animateTrail);

      // Hide default cursor
      document.body.style.cursor = 'none';
      document.querySelectorAll('a, button, input, textarea, select, [role="button"]').forEach(el => {
        el.style.cursor = 'none';
      });
    }

    return () => {
      if (!isMobile) {
        document.removeEventListener('mousemove', moveCursor);
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('mouseout', handleMouseOut);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);

        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }

        document.body.style.cursor = 'auto';
        document.querySelectorAll('a, button, input, textarea, select, [role="button"]').forEach(el => {
          el.style.cursor = 'pointer';
        });
      }
    };
  }, []);

  return (
    <>
      {/* Main Cursor */}
      <div 
        ref={cursorRef} 
        className={`custom-cursor cursor-outer ${isHovering ? 'cursor-hover' : ''} ${isClicking ? 'cursor-click' : ''}`}
      >
        <div className="cursor-inner" />
      </div>

      {/* Water Ripple Effect */}
      <div 
        className="cursor-ripple"
        style={{ 
          left: cursorPos.x + 'px', 
          top: cursorPos.y + 'px' 
        }}
      />

      {/* Trail SVG */}
      <svg className="cursor-trail">
        <defs>
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#29A9E1" stopOpacity="1" />
            <stop offset="50%" stopColor="#E82928" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#BEDB39" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path ref={trailRef} d="" />
      </svg>
    </>
  );
}
