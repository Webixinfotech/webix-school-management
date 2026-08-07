import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { programsData } from '../../data/programsData';

// ─── Program Card ─────────────────────────────────────────────────────────────
const ProgramCard = ({ program, index, onKnowMore }) => {
  const [hovered, setHovered] = useState(false);

  // Override data colors with Zorix Theme
  const themePrimary = '#0C2A47';
  const themeGold = '#E2B94D';
  const isTealCard = index % 2 === 0;

  const cardBorder = isTealCard ? 'rgba(12,42,71,0.1)' : 'rgba(226,185,77,0.2)';
  const cardBg = isTealCard ? '#F4F7F8' : '#FAF8F2';
  const cardAccent = isTealCard ? themePrimary : themeGold;
  const hoverGrad = isTealCard 
    ? 'linear-gradient(135deg, #0C2A47, #081A2E)' 
    : 'linear-gradient(135deg, #E2B94D, #b59223)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: 24,
        border: `2px solid ${hovered ? cardAccent : cardBorder}`,
        overflow: 'hidden',
        boxShadow: hovered
          ? `0 20px 40px rgba(12,42,71,0.12), 0 4px 16px rgba(0,0,0,0.04)`
          : '0 2px 12px rgba(0,0,0,0.03)',
        transform: hovered ? 'translateY(-6px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        flexDirection: 'column',
        animationDelay: `${index * 60}ms`,
        animation: 'fadeUp 0.5s ease both',
      }}>

      {/* Gradient top bar */}
      <div style={{
        height: 6,
        background: hoverGrad,
      }} />

      {/* Card header */}
      <div style={{
        padding: '24px 24px 16px',
        background: hovered ? cardBg : '#fff',
        transition: 'background 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          {/* Icon circle */}
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            color: cardAccent
          }}>
            {program.icon}
          </div>
          {/* Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
              padding: '4px 12px', borderRadius: 99,
              background: cardBg, color: cardAccent,
              border: `1.5px solid ${cardBorder}`,
            }}>
              {program.age}
            </span>
            {program.extraTag && (
              <span style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
                padding: '4px 10px', borderRadius: 99,
                background: cardAccent, color: '#fff',
              }}>
                {program.extraTag}
              </span>
            )}
          </div>
        </div>

        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0C2A47', lineHeight: 1.2 }}>
          {program.name}
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: cardAccent, letterSpacing: '0.01em' }}>
          {program.subtitle}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: cardBorder, margin: '0 24px' }} />

      {/* Features */}
      <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {program.benefits.slice(0, 4).map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: hovered ? cardAccent : cardBg,
              border: `1.5px solid ${hovered ? 'transparent' : cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1, transition: 'all 0.3s ease',
            }}>
              <svg width="10" height="10" viewBox="0 0 8 8" fill="none">
                <path d="M1.5 4l2 2 3-3" stroke={hovered ? '#fff' : cardAccent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, fontWeight: 500 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* CTA footer */}
      <div style={{ padding: '0 24px 24px' }}>
        <button
          onClick={() => onKnowMore(program.slug)}
          style={{
          width: '100%', padding: '12px 0',
          borderRadius: 12,
          background: hovered ? hoverGrad : cardBg,
          color: hovered ? '#fff' : cardAccent,
          fontWeight: 700, fontSize: 14, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '0.02em',
          transition: 'all 0.3s ease',
          border: `1.5px solid ${hovered ? 'transparent' : cardBorder}`,
        }}>
          Know More →
        </button>
      </div>
    </div>
  );
};
 
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProgramsSection() {
  const navigate = useNavigate();

  const handleKnowMore = (slug) => {
    navigate('/programs/' + slug);
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: '#F8FAFC', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;800&family=Inter:wght@400;500;600&display=swap');
        
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(0.95); opacity: 0.7; }
          100% { transform: scale(1.15); opacity: 0; }
        }
      `}</style>

      {/* ── Hero Section ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0C2A47 0%, #081A2E 50%, #0C2A47 100%)',
        padding: '80px 24px 100px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.05,
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }} />

        {[
          { size: 400, top: -150, left: -100, color: 'rgba(226,185,77,0.08)' },
          { size: 250, top: -80,  right: -80, color: 'rgba(226,185,77,0.1)' },
          { size: 200, bottom: -80, left: '40%', color: 'rgba(255,255,255,0.05)' },
        ].map((c, i) => (
          <div key={i} style={{
            position: 'absolute', width: c.size, height: c.size, borderRadius: '50%',
            background: c.color, top: c.top, left: c.left, right: c.right, bottom: c.bottom,
            pointerEvents: 'none',
          }} />
        ))}

        <div style={{ position: 'relative', maxWidth: 700, margin: '0 auto' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(226,185,77,0.15)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226,185,77,0.3)',
            borderRadius: 99, padding: '8px 20px', marginBottom: 24,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2B94D', animation: 'pulse-ring 1.5s ease-out infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#E2B94D', letterSpacing: '0.08em' }}>
              EXCELLENCE IN EDUCATION
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            margin: 0, fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800,
            color: '#fff', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            Where Every Child{' '}
            <span style={{ color: '#E2B94D' }}>
              Discovers
            </span>{' '}
            Their Spark
          </h1>

          <p style={{
            margin: '24px auto 0', fontSize: 18, color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.7, maxWidth: 540, fontWeight: 300,
          }}>
            Age-appropriate programs crafted for holistic development — from your baby's first steps to a child's academic excellence.
          </p>

          {/* Age range pills */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
            {['9 months+', '1–3 years', '3–6 years', '6–12 years', 'For Teachers'].map(a => (
              <span key={a} style={{
                padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}>
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <svg style={{ position: 'absolute', bottom: -1, left: 0, width: '100%' }} viewBox="0 0 1440 60" fill="none" preserveAspectRatio="none">
          <path d="M0 60 C360 0 1080 0 1440 60 L1440 60 L0 60Z" fill="#F8FAFC"/>
        </svg>
      </div>

      {/* ── Programs Grid ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px 100px' }}>

        {/* Section header */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", margin: 0, fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: '#0C2A47', letterSpacing: '-0.5px' }}>
            Our Programs
          </h2>
          <div style={{ width: 80, height: 4, borderRadius: 99, background: '#E2B94D', margin: '16px auto 0' }} />
          <p style={{ margin: '16px 0 0', fontSize: 16, color: '#64748B', fontWeight: 400 }}>
            Click on any program to learn more — we're happy to guide you!
          </p>
        </div>

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 32,
        }}>
          {programsData.map((p, i) => (
            <ProgramCard key={p.id} program={p} index={i} onKnowMore={handleKnowMore} />
          ))}
        </div>

        {/* Bottom CTA banner */}
        <div style={{
          marginTop: 80,
          background: 'linear-gradient(135deg, #0C2A47, #081A2E)',
          borderRadius: 32,
          padding: '64px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(12,42,71,0.2)'
        }}>
          <div style={{ position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(226,185,77,0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -50, left: 40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(226,185,77,0.08)', pointerEvents: 'none' }} />
          
          <div style={{ position: 'relative' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#E2B94D', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Not sure which program?
            </p>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", margin: 0, fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Book a Free Counselling Session
            </h3>
            <p style={{ margin: '16px 0 0', fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 460, marginInline: 'auto', fontWeight: 300 }}>
              Our child development experts will help you choose the perfect program for your little one.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
              <button onClick={() => navigate('/contact')} style={{
                padding: '16px 36px', borderRadius: 16, border: 'none',
                background: '#E2B94D', color: '#0C2A47', fontWeight: 700, fontSize: 15,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s ease',
                boxShadow: '0 10px 20px rgba(226,185,77,0.3)'
              }}>
                Schedule a Visit →
              </button>
              <a href="tel:+910000000000" style={{
                padding: '14px 36px', borderRadius: 16,
                border: '2px solid rgba(226,185,77,0.5)',
                background: 'transparent', color: '#E2B94D', fontWeight: 700, fontSize: 15,
                cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block',
                transition: 'all 0.3s ease'
              }}>
                Call Us Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
