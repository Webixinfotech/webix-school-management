import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toMediaUrl } from '../../utils/photoUtils';

const Ico = ({ d, size = 16, stroke = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

export default function AdBannerCarousel({ ads = [] }) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(null);
  const touchDeltaX = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (ads.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [ads.length, isPaused]);

  if (!ads.length) return null;

  const goTo = (i) => setIndex(((i % ads.length) + ads.length) % ads.length);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchDeltaX.current > 40) {
      prev();
    } else if (touchDeltaX.current < -40) {
      next();
    }
    touchStartX.current = null;
    // We don't reset touchDeltaX here immediately so onClick can read it
    setTimeout(() => { touchDeltaX.current = 0; }, 100);
  };

  const handleAdClick = (ad) => {
    if (Math.abs(touchDeltaX.current) > 10) return; // was a swipe, not a tap
    if (ad.linkType === 'external' && ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    } else if (ad.linkType === 'internal' && ad.linkUrl) {
      navigate(ad.linkUrl);
    }
  };

  return (
    <div
      className="pd-ad-carousel"
      role="region"
      aria-label="School announcements and offers"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pd-ad-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {ads.map((ad, i) => {
          let cursor = 'default';
          if (ad.linkType === 'external' || ad.linkType === 'internal') {
            cursor = 'pointer';
          }
          return (
            <div
              key={ad._id || i}
              className="pd-ad-slide"
              onClick={() => handleAdClick(ad)}
              style={{ cursor }}
            >
              <img 
                src={toMediaUrl(ad.imageUrl)}
                alt={ad.title}
                className="w-full h-full object-cover rounded-2xl"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          );
        })}
      </div>

      {ads.length > 1 && (
        <>
          <div className="pd-ad-dots">
            {ads.map((_, i) => (
              <button
                key={i}
                className={`pd-ad-dot ${i === index ? 'active' : ''}`}
                aria-label={`Go to ad ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                  // Reset timer logic implicitly happens due to index change re-triggering render
                  // The interval clears and restarts.
                }}
              />
            ))}
          </div>

          <button
            className="pd-ad-arrow prev"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous ad"
          >
            <Ico d="M15 19l-7-7 7-7" size={20} stroke="#fff" sw={2.5} />
          </button>
          
          <button
            className="pd-ad-arrow next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next ad"
          >
            <Ico d="M9 5l7 7-7 7" size={20} stroke="#fff" sw={2.5} />
          </button>
        </>
      )}
    </div>
  );
}
