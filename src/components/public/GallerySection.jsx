import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, Calendar, Camera, Download } from 'lucide-react';
import { photoApi } from '../../api/photos';

const CATEGORIES = ['All', 'Events', 'Activities'];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const CAT_COLORS = {
  Events:     { bg: '#0C2A4715', text: '#0C2A47', dot: '#0C2A47' },
  Activities: { bg: '#E2B94D15', text: '#B48A14', dot: '#E2B94D' },
  Academics:  { bg: '#E5F1F4', text: '#0b3844', dot: '#13677A' },
};

// ─── Download ───────────────────────────────────────────────────────────────
const downloadImage = async (imageUrl, title) => {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const ext = blob.type.includes('png') ? 'png' : blob.type.includes('gif') ? 'gif' : 'jpg';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || 'photo').replace(/[^a-z0-9]/gi, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    window.open(imageUrl, '_blank');
  }
};

// ─── Lightbox ───────────────────────────────────────────────────────────────
const Lightbox = ({ items, currentIndex, setIndex, onClose }) => {
  const item = items[currentIndex];
  const [downloading, setDownloading] = useState(false);

  const onPrev = useCallback(() => setIndex(i => Math.max(0, i - 1)), [setIndex]);
  const onNext = useCallback(() => setIndex(i => Math.min(items.length - 1, i + 1)), [setIndex, items.length]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!item) return null;
  const cc = CAT_COLORS[item.category] || CAT_COLORS.Events;

  const handleDownload = async () => {
    setDownloading(true);
    await downloadImage(item.imageUrl, item.title);
    setDownloading(false);
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5,15,25,0.97)',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        width: '100vw', height: '100vh',
        animation: 'lbFadeIn 0.22s ease-out',
        overflow: 'hidden',
      }}
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em' }}>
          {currentIndex + 1} <span style={{ color: 'rgba(255,255,255,0.2)' }}>/</span> {items.length}
        </span>

        <span style={{
          fontSize: 13, fontWeight: 700, color: '#fff',
          maxWidth: 'calc(100% - 160px)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {item.title}
        </span>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: downloading ? 'rgba(226,185,77,0.5)' : '#E2B94D',
              color: '#0C2A47', border: 'none', cursor: downloading ? 'default' : 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Download size={13} />
            {downloading ? 'Saving…' : 'Download'}
          </button>
          <button
            onClick={onClose}
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden', minHeight: 0,
        }}
        onClick={onClose}
      >
        {currentIndex > 0 && (
          <button
            onClick={e => { e.stopPropagation(); onPrev(); }}
            style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', zIndex: 2, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <img
          key={item.id}
          src={item.imageUrl}
          alt={item.title}
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: 'calc(100% - 100px)',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 12,
            display: 'block',
            animation: 'lbImgIn 0.2s ease-out',
            userSelect: 'none',
          }}
        />

        {currentIndex < items.length - 1 && (
          <button
            onClick={e => { e.stopPropagation(); onNext(); }}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              width: 40, height: 40, borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)', zIndex: 2, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Info Row */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          padding: '10px 16px',
          background: 'rgba(255,255,255,0.04)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <span style={{
          padding: '3px 9px', borderRadius: 99, fontSize: 10, fontWeight: 700,
          background: cc.bg, color: cc.dot, border: `1px solid ${cc.dot}40`
        }}>
          {item.category}
        </span>
        {item.description && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.description}
          </span>
        )}
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 3, marginLeft: 'auto' }}>
          <Calendar size={10} /> {fmtDate(item.uploadedAt)}
        </span>
      </div>

      {/* Thumbnail Strip */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          display: 'flex', gap: 6, padding: '10px 16px',
          overflowX: 'auto', flexShrink: 0,
          background: 'rgba(0,0,0,0.3)',
          scrollbarWidth: 'none',
        }}
      >
        {items.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setIndex(i)}
            style={{
              flexShrink: 0, width: 52, height: 40, borderRadius: 7, overflow: 'hidden',
              border: `2px solid ${i === currentIndex ? '#E2B94D' : 'transparent'}`,
              opacity: i === currentIndex ? 1 : 0.45,
              cursor: 'pointer', padding: 0, background: 'none',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { if (i !== currentIndex) e.currentTarget.style.opacity = 0.75; }}
            onMouseLeave={e => { if (i !== currentIndex) e.currentTarget.style.opacity = 0.45; }}
          >
            <img src={g.imageUrl} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Gallery Card ────────────────────────────────────────────────────────────
const GalleryCard = ({ item, onClick, index }) => {
  const [hovered, setHovered] = useState(false);
  const cc = CAT_COLORS[item.category] || CAT_COLORS.Events;

  return (
    <div
      className="g-card"
      onClick={() => onClick(index)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        breakInside: 'avoid',
        marginBottom: 10,
        display: 'inline-block',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        background: '#fff',
        boxShadow: hovered ? '0 10px 28px rgba(12,42,71,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        animationDelay: `${Math.min(index * 0.04, 0.4)}s`,
        border: '1px solid rgba(12,42,71,0.05)',
      }}
    >
      <div style={{ overflow: 'hidden' }}>
        <img
          src={item.imageUrl}
          alt={item.title}
          loading="lazy"
          style={{
            width: '100%', height: 'auto', display: 'block',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.4s ease',
          }}
        />
      </div>

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(12,42,71,0.8) 0%, rgba(12,42,71,0.2) 40%, transparent 65%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s',
      }} />

      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%,-50%) scale(${hovered ? 1 : 0.6})`,
        opacity: hovered ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        width: 44, height: 44, borderRadius: 12,
        background: 'linear-gradient(135deg, #E2B94D, #b59223)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(226,185,77,0.4)',
        pointerEvents: 'none',
      }}>
        <ZoomIn size={20} color="#0C2A47" />
      </div>

      <span style={{
        position: 'absolute', top: 12, left: 12,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700,
        background: 'rgba(255,255,255,0.9)', color: '#0C2A47',
        backdropFilter: 'blur(8px)', border: '1px solid rgba(12,42,71,0.1)',
        letterSpacing: '0.02em',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cc.dot, flexShrink: 0 }} />
        {item.category}
      </span>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '12px 14px 14px',
        opacity: hovered ? 1 : 0,
        transform: hovered ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.3s',
        pointerEvents: 'none',
      }}>
        <h3 style={{
          margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.title}
        </h3>
        <p style={{
          margin: '4px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Calendar size={10} /> {fmtDate(item.uploadedAt)}
        </p>
      </div>
    </div>
  );
};

// ─── Main GallerySection ─────────────────────────────────────────────────────
const GallerySection = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadGalleryItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await photoApi.getPublicWebsitePhotos({ limit: 20 });
      const items = (response.data || []).map((item) => ({
        ...item,
        id: item.id || item._id,
        views: item.viewsCount || item.views || 0,
      }));
      setGalleryItems(items);
    } catch (err) {
      setError(err.message || 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGalleryItems(); }, []);

  const filtered = galleryItems.filter(g => {
    const isPublished = !g.status || ['approved', 'published'].includes(String(g.status).toLowerCase());
    return isPublished && (activeCategory === 'All' || g.category === activeCategory);
  });

  const publishedCount = galleryItems.filter(g =>
    !g.status || ['approved', 'published'].includes(String(g.status).toLowerCase())
  ).length;

  return (
    <section style={{ fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100vh', background: '#F8FAFC' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap');
        
        @keyframes lbFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lbImgIn  { from { opacity: 0; transform: scale(0.97) } to { opacity: 1; transform: scale(1) } }
        @keyframes slideUp  { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }

        .g-card { animation: slideUp 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }

        /* ── Responsive masonry grid ── */
        .g-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          align-items: start;
          width: 100%;
        }
        @media (max-width: 860px)  { .g-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px)  { .g-grid { grid-template-columns: 1fr; } }

        /* card inside grid: no masonry tricks needed, images natural ratio */
        .g-card {
          width: 100%;
          break-inside: unset;
          display: block;
          margin-bottom: 0;
        }

        div::-webkit-scrollbar { display: none; }

        .cat-scroll {
          display: flex; gap: 8px;
          overflow-x: auto; -webkit-overflow-scrolling: touch;
          scrollbar-width: none; padding: 4px 0;
          justify-content: center;
          flex-wrap: wrap;
        }
        .cat-scroll::-webkit-scrollbar { display: none; }

        @keyframes pulseSkeleton { 0%,100% { opacity: 0.5 } 50% { opacity: 0.8 } }
        .skeleton { animation: pulseSkeleton 1.5s ease-in-out infinite; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0C2A47 0%, #081A2E 50%, #0C2A47 100%)',
        padding: '60px 20px 48px',
        position: 'relative', overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Decorative Grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        {[180, 300, 420].map((size, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            border: `1px solid rgba(226,185,77, ${0.15 - i*0.03})`,
            width: size, height: size,
            top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 16px', borderRadius: 99,
            background: 'rgba(226,185,77,0.1)',
            border: '1px solid rgba(226,185,77,0.3)',
            marginBottom: 20,
          }}>
            <Camera size={12} color="#E2B94D" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#E2B94D', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              School Gallery
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            margin: 0,
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            Moments That <span style={{ color: '#E2B94D' }}>Matter</span>
          </h1>

          <p style={{ margin: '16px 0 0', fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontWeight: 300 }}>
            A visual journey through our school's most cherished events and activities.
          </p>

          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Camera size={12} /> {publishedCount} photos available
          </p>
        </div>
      </div>

      {/* ── Category Filter ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 16px 8px' }}>
        <div className="cat-scroll">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const cc = cat !== 'All' ? (CAT_COLORS[cat] || CAT_COLORS.Events) : null;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: `1.5px solid ${isActive ? '#0C2A47' : 'rgba(12,42,71,0.15)'}`,
                  background: isActive ? '#0C2A47' : '#fff',
                  color: isActive ? '#fff' : '#0C2A47',
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  boxShadow: isActive ? '0 4px 12px rgba(12,42,71,0.2)' : '0 2px 4px rgba(0,0,0,0.02)',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#0C2A47'; } }}
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'rgba(12,42,71,0.15)'; } }}
              >
                {cat !== 'All' && cc && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#E2B94D' : cc.dot }} />
                )}
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 16px 64px' }}>
        {loading ? (
          <div className="g-grid">
            {[240, 180, 320, 200, 280, 160].map((h, i) => (
              <div key={i} className="skeleton" style={{
                height: h, borderRadius: 16,
                background: 'linear-gradient(135deg, #e2e8f0, #cbd5e1)',
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <p style={{ color: '#0C2A47', fontWeight: 600, fontSize: 16 }}>Failed to load photos</p>
            <button onClick={loadGalleryItems} style={{
              marginTop: 16, padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: 'none', background: '#E2B94D', color: '#0C2A47', cursor: 'pointer',
              transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(226,185,77,0.3)'
            }}>
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, background: '#0C2A4710',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Camera size={32} color="#0C2A47" opacity={0.7} />
            </div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0C2A47' }}>
              No photos in this category
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748b' }}>
              Check back soon for updates
            </p>
          </div>
        ) : (
          <div className="g-grid">
            {filtered.map((item, i) => (
              <GalleryCard key={item.id} item={item} index={i} onClick={setLightboxIndex} />
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          currentIndex={lightboxIndex}
          setIndex={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
};

export default GallerySection;

