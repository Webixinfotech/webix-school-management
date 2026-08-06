// src/components/DocumentsAdmin/ExperienceCertificateView.jsx
import { forwardRef } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '../../utils/certificateDownload';
import logo from '../../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';
import talentGymLogo from '../../assets/optimized/logo/brain-builder-logo-talengym.webp';

function fmt(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const NAVY = '#1e3a5f';
const NAVY_DARK = '#152a45';
const GOLD = '#C9A24B';
const TEAL = '#2FB6A6';
const CORAL = '#F0904A';
const MUTED = '#6b7280';
const CREAM = '#FFFCF5';

const PILLS = ['Playgroup', 'Nursery', 'Jr. KG / Sr. KG', 'Day Care', 'Evening Hobby Classes'];

const ExperienceCertificateView = forwardRef(function ExperienceCertificateView({ form, signatureUrl }, ref) {
  const f = form || {};

  return (
    <div
      ref={ref}
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        background: CREAM,
        boxSizing: 'border-box',
        padding: 0,
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        color: '#1f2937',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── WATERMARK ──
          NOTE: opacity is set on this wrapping div, not on the <img> itself.
          certificateDownload.js's html2canvas onclone hook force-sets every
          <img>'s inline opacity to '1' (so images never fail to appear in the
          export), which would otherwise wipe out a low opacity set directly
          on the image. A parent div's opacity is untouched by that hook and
          still multiplies with the child, so the watermark stays faint in
          both the on-screen preview and the exported PDF/PNG. */}
      <div
        style={{
          position: 'absolute',
          top: A4_HEIGHT / 2 - 210,
          left: (A4_WIDTH - 420) / 2,
          width: 420,
          transform: 'rotate(-12deg)',
          transformOrigin: 'center center',
          opacity: 0.05,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <img
          src={logo}
          alt=""
          crossOrigin="anonymous"
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      {/* ── HEADER ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Decorative curved band */}
        <svg
          width={A4_WIDTH}
          height="150"
          viewBox={`0 0 ${A4_WIDTH} 150`}
          style={{ display: 'block' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="headerGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={NAVY} />
              <stop offset="100%" stopColor={NAVY_DARK} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={A4_WIDTH} height="150" fill="url(#headerGrad)" />
          <path
            d={`M0,150 Q${A4_WIDTH * 0.25},108 ${A4_WIDTH * 0.5},127 T${A4_WIDTH},114 L${A4_WIDTH},150 L0,150 Z`}
            fill={GOLD}
            opacity="0.9"
          />
          <path
            d={`M0,150 Q${A4_WIDTH * 0.3},134 ${A4_WIDTH * 0.55},145 T${A4_WIDTH},139 L${A4_WIDTH},150 L0,150 Z`}
            fill={CREAM}
          />
        </svg>

        {/* Header content, overlaid on the band */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 150,
            padding: '0 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: '50%',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                flexShrink: 0,
                border: `3px solid ${GOLD}`,
              }}
            >
              <img
                src={logo}
                alt="Zorix School"
                crossOrigin="anonymous"
                style={{ height: 54, width: 54, objectFit: 'contain' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 25,
                  fontWeight: 800,
                  color: '#fff',
                  letterSpacing: 0.3,
                  lineHeight: 1.15,
                }}
              >
                Zorix School
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: GOLD,
                  letterSpacing: 0.6,
                  marginTop: 1,
                }}
              >
                INTERNATIONAL PRE SCHOOL
              </div>
              {/* <div style={{ display: 'flex', gap: 5, marginTop: 9, flexWrap: 'wrap', maxWidth: 215, rowGap: 6 }}>
                {PILLS.map((p) => (
                  <span
                    key={p}
                    style={{
                      fontSize: 7,
                      fontWeight: 600,
                      color: NAVY_DARK,
                      background: 'rgba(255,255,255,0.92)',
                      borderRadius: 20,
                      padding: ' 4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div> */}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 12,
              padding: '8px 16px',
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
            }}
          >
            <span style={{ fontSize: 8.5, fontWeight: 700, color: MUTED, letterSpacing: 0.4 }}>
              POWERED BY
            </span>
            <img
              src={talentGymLogo}
              alt="Talent Gym"
              crossOrigin="anonymous"
              style={{ height: 40, marginTop: 2 }}
            />
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '30px 56px 40px' }}>
        {/* ── REFERENCE + DATE ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            color: MUTED,
          }}
        >
          <span>
            Letter Number: <b style={{ color: '#374151' }}>{f.letterNumber || '—'}</b>
          </span>
          <span>
            Date: <b style={{ color: '#374151' }}>{fmt(f.date)}</b>
          </span>
        </div>

        {/* ── SUBJECT / TITLE ── */}
        <div style={{ textAlign: 'center', margin: '26px 0 22px' }}>
          <div
            style={{
              display: 'inline-block',
              fontSize: 22,
              fontWeight: 800,
              color: NAVY,
              letterSpacing: 0.3,
              paddingBottom: 8,
              borderBottom: `3px solid ${GOLD}`,
            }}
          >
            Experience Certificate
          </div>
        </div>

        {/* ── SALUTATION ── */}
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#1f2937',
            margin: '4px 0 14px',
          }}
        >
          To Whomsoever It May Concern,
        </div>

        {/* ── BODY ── */}
        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.9,
            color: '#2B2440',
            textAlign: 'justify',
          }}
        >
          This is to certify that <b>{f.name || '—'}</b>
          {f.guardianName ? <> D/O <b>{f.guardianName}</b></> : null} worked as{' '}
          <b>{f.designation || 'Staff'}</b> in our school for the academic session{' '}
          <b>{f.session || '—'}</b>, with all associated responsibilities and duties.
        </div>

        {f.remarks && (
          <div
            style={{
              fontSize: 14.5,
              lineHeight: 1.9,
              color: '#2B2440',
              marginTop: 16,
              textAlign: 'justify',
            }}
          >
            {f.remarks}
          </div>
        )}

        <div
          style={{
            fontSize: 14.5,
            lineHeight: 1.9,
            color: '#2B2440',
            marginTop: 16,
            textAlign: 'justify',
          }}
        >
          {f.recommendation ||
            'We strongly recommend her/him for best of future opportunities. We wish her/him all the best for her/his future endeavours.'}
        </div>

        {/* Gap before signature */}
        <div style={{ height: 56 }} />

        {/* ── SIGNATURE ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div style={{ textAlign: 'center', width: 220 }}>
            {signatureUrl && (
              <img
                src={signatureUrl}
                alt="Signature"
                crossOrigin="anonymous"
                style={{ height: 48, display: 'block', margin: '0 auto 6px' }}
              />
            )}
            <div
              style={{
                borderTop: `1.5px solid ${NAVY}`,
                paddingTop: 4,
                fontSize: 13,
                color: NAVY,
                fontWeight: 700,
              }}
            >
              Principal
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1,
          display: 'flex',
          fontSize: 11.5,
          fontWeight: 600,
          color: '#fff',
        }}
      >
        <div
          style={{
            flex: '0 0 30%',
            background: TEAL,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span>🌐</span>
          <span>www.BrainBuilder.in</span>
        </div>
        <div
          style={{
            flex: '1 1 40%',
            background: NAVY_DARK,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center',
          }}
        >
          <span>📍</span>
          <span>Sector A-535, Mahalaxmi Nagar, Indore</span>
        </div>
        <div
          style={{
            flex: '0 0 30%',
            background: CORAL,
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
          }}
        >
          <span>📞</span>
          <span>8422999199 / 9619841642</span>
        </div>
      </div>
    </div>
  );
});

export default ExperienceCertificateView;
