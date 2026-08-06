// src/components/DocumentsAdmin/LeavingCertificateView.jsx
import { forwardRef } from 'react';
import { A4_WIDTH, A4_HEIGHT } from '../../utils/certificateDownload';
import logo from '../../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';

function fmt(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const NAVY = '#1e3a5f';
const NAVY_DARK = '#152a45';
const GOLD = '#C9A24B';
const RED = '#E1483F';
const TEAL = '#2FB6A6';
const LIGHT = '#F4F7FB';
const CREAM = '#FFFCF5';
const RULE = '#d1d5db';
const MUTED = '#6b7280';

const SECTION_LABEL = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1.5,
  color: NAVY,
  fontWeight: 700,
};

const ROW_LABEL = {
  width: 210,
  flexShrink: 0,
  fontWeight: 600,
  color: '#374151',
  fontSize: 14,
  lineHeight: 1.5,
};

const ROW_VALUE = {
  flex: 1,
  color: '#111827',
  fontSize: 14,
  lineHeight: 1.5,
  wordBreak: 'break-word',
};

const LeavingCertificateView = forwardRef(function LeavingCertificateView({ form, signatureUrl }, ref) {
  const f = form || {};

  const addressStr = [f.address].filter(Boolean).join('') || '—';

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
          Image watermark, export-safe:
          1) No rotate/translate transform — that combo is what makes
             html2canvas render an image watermark off-position/clipped in
             the PDF.
          2) Opacity is on this wrapping div, not the <img> itself — the
             download script's onclone hook force-sets every <img>'s opacity
             to 1, which would otherwise wipe out a low opacity set directly
             on the image.
          3) Centered with flexbox (top/left/right/bottom: 0) instead of
             percentage + translate, which renders identically in preview
             and PDF. */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 0,
          pointerEvents: 'none',
          opacity: 0.06,
        }}
      >
        <img
          src={logo}
          alt=""
          crossOrigin="anonymous"
          style={{ width: 380, display: 'block' }}
        />
      </div>

      {/* ── HEADER ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <svg
          width={A4_WIDTH}
          height="146"
          viewBox={`0 0 ${A4_WIDTH} 146`}
          style={{ display: 'block' }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lcHeaderGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={NAVY} />
              <stop offset="100%" stopColor={NAVY_DARK} />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={A4_WIDTH} height="146" fill="url(#lcHeaderGrad)" />
          <path
            d={`M0,146 Q${A4_WIDTH * 0.25},104 ${A4_WIDTH * 0.5},123 T${A4_WIDTH},110 L${A4_WIDTH},146 L0,146 Z`}
            fill={RED}
            opacity="0.9"
          />
          <path
            d={`M0,146 Q${A4_WIDTH * 0.3},130 ${A4_WIDTH * 0.55},141 T${A4_WIDTH},135 L${A4_WIDTH},146 L0,146 Z`}
            fill={CREAM}
          />
        </svg>

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 146,
            padding: '0 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 78,
                height: 78,
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
                style={{ height: 60, width: 60, objectFit: 'contain' }}
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
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: GOLD,
                  letterSpacing: 0.6,
                  marginTop: 1,
                }}
              >
                INTERNATIONAL PRE-SCHOOL
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
                Sector A-535, Mahalaxmi Nagar, Indore
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)' }}>
                Contact No. 8422999199, 9619841642
              </div>
            </div>
          </div>

          <div
            style={{
              flexShrink: 0,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 10,
              padding: '10px 20px',
              textAlign: 'center',
              minWidth: 100,
              boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ ...SECTION_LABEL, margin: 0 }}>Reg. No.</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: NAVY, marginTop: 4 }}>
              {f.regNo || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '28px 50px 40px' }}>
        {/* ── BANNER ─────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              background: `linear-gradient(90deg, ${NAVY}, ${NAVY_DARK})`,
              color: '#fff',
              padding: '12px 44px',
              borderRadius: 999,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: 2,
              boxShadow: `0 4px 12px ${NAVY}44`,
              borderBottom: `3px solid ${GOLD}`,
            }}
          >
            SCHOOL LEAVING CERTIFICATE
          </div>
        </div>

        {/* ── SERIAL + DATE ────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 14,
            margin: '22px 0 16px',
            color: '#374151',
            borderBottom: `1px solid ${RULE}`,
            paddingBottom: 10,
          }}
        >
          <span>
            Serial No.: <b>{f.serialNo || '—'}</b>
          </span>
          <span>
            Date of Issue: <b>{fmt(f.dateOfIssue)}</b>
          </span>
        </div>

        {/* ── FIELDS ── */}
        <div>
          {[
            ['Name', f.name],
            ["Father's Name", f.fatherName],
            ["Mother's/Guardian's Name", f.motherName],
            [
              'Date of Birth',
              `${fmt(f.dob)}${f.dobInWords ? ' (' + f.dobInWords + ')' : ''}`,
            ],
            ['Admission No.', f.regNo],
            ['Date of Admission', fmt(f.admissionDate)],
            ['Class', f.className],
            ['Nationality', f.nationality],
            ['Residential Address', addressStr],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                fontSize: 14,
                padding: '10px 0',
                borderBottom: `1px dotted ${RULE}`,
              }}
            >
              <div style={ROW_LABEL}>{label}</div>
              <div style={{ width: 14, flexShrink: 0, textAlign: 'center' }}>:</div>
              <div style={ROW_VALUE}>{value || '—'}</div>
            </div>
          ))}
        </div>

        {/* ── PARTICIPATION ───────────────────────────── */}
        <div style={{ marginTop: 18 }}>
          <div style={{ ...SECTION_LABEL, marginBottom: 10 }}>Activities Participation</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 14, color: '#374151' }}>
            {[
              ['Sports/Games', f.sportsParticipated],
              ['Co-Curricular Activities', f.coCurricularParticipated],
              ['Other Activities', f.otherActivitiesParticipated],
            ].map(([label, checked]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 15,
                    height: 15,
                    border: `1.5px solid ${NAVY}`,
                    borderRadius: 3,
                    flexShrink: 0,
                  }}
                >
                  {checked ? (
                    <span style={{ color: NAVY, fontWeight: 700, fontSize: 11 }}>✓</span>
                  ) : null}
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── CONDUCT + DUES ──────────────────────────── */}
        <div
          style={{
            marginTop: 16,
            padding: '14px 16px',
            background: LIGHT,
            borderRadius: 8,
            border: `1px solid ${RULE}`,
          }}
        >
          <div style={{ fontSize: 15, padding: '6px 0' }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>General Conduct: </span>
            <span style={{ color: '#111827', fontWeight: 500 }}>{f.generalConduct || '—'}</span>
          </div>
          <div style={{ fontSize: 15, padding: '6px 0', borderTop: `1px dashed ${RULE}` }}>
            <span style={{ fontWeight: 600, color: '#374151' }}>School Fees Paid &amp; No Dues: </span>
            <span
              style={{
                color: f.feesPaidNoDues ? '#15803d' : '#b91c1c',
                fontWeight: 600,
              }}
            >
              {f.feesPaidNoDues ? 'Yes' : 'No'}
            </span>
          </div>
        </div>

        {/* ── REMARKS / REASON ───────────────────────── */}
        {(f.remarks || f.reasonForLeaving) && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {f.remarks && (
              <div style={{ padding: '10px 14px', background: '#FFFBEB', borderRadius: 8 }}>
                <div style={{ ...SECTION_LABEL, color: '#92400e', marginBottom: 4 }}>
                  Any Other Remarks
                </div>
                <div style={{ fontSize: 14, color: '#1f2937', lineHeight: 1.6 }}>{f.remarks}</div>
              </div>
            )}
            {f.reasonForLeaving && (
              <div style={{ padding: '10px 14px', background: LIGHT, borderRadius: 8 }}>
                <div style={{ ...SECTION_LABEL, marginBottom: 4 }}>
                  Reason For Leaving School
                </div>
                <div style={{ fontSize: 14, color: '#1f2937', lineHeight: 1.6 }}>
                  {f.reasonForLeaving}
                </div>
              </div>
            )}
          </div>
        )}

        {!f.remarks && !f.reasonForLeaving && (
          <div style={{ marginTop: 14, fontSize: 13, color: MUTED, fontStyle: 'italic' }}>
            Remarks / Reason: to be filled at the time of issue
          </div>
        )}

        {/* ── SIGNATURE ───────────────────────── */}
        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'center', width: 240 }}>
            {signatureUrl && (
              <img
                src={signatureUrl}
                alt="Signature"
                crossOrigin="anonymous"
                style={{ height: 52, display: 'block', margin: '0 auto 4px' }}
              />
            )}
            <div
              style={{
                borderTop: `2px solid ${NAVY}`,
                paddingTop: 4,
                fontSize: 13,
                color: NAVY,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              Principal Signature
            </div>
          </div>
        </div>

        {/* spacer so content never collides with the absolute footer bar */}
        <div style={{ height: 44 }} />
      </div>

      {/* ── FOOTER ──
          Three-tone bar pulled from the brand mark's own palette: the red
          from "Zorix School", the navy from "International", and gold as
          the school's existing accent — instead of a generic single color. */}
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
            background: RED,
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
            background: TEAL,
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

export default LeavingCertificateView;
