// src/components/CertificateStudio/CertificateCanvas.jsx
//
// Purely presentational. This is the node html2canvas captures for download —
// whatever renders here is exactly what the user gets, so no separate
// "preview" vs "export" rendering path exists (per spec: preview = download).
//
// Design notes:
// - No custom SVG anywhere. Decorative motifs are the real trophy.png /
//   star.png / child.png graphic assets, given a drop-shadow so they read
//   as a printed foil/emboss element rather than a flat UI icon. A prior
//   version of this file used inline SVG (gradients/defs) for the icons —
//   html2canvas's SVG support is unreliable and that version silently
//   aborted mid-capture, producing a near-blank PDF. Plain <img> elements
//   are the proven-safe pattern here; never reintroduce inline SVG icons.
// - Every corner/border decoration below is plain div + CSS
//   background/gradient/border — no SVG, no canvas, nothing html2canvas
//   has to specially interpret.
// - VERTICAL RHYTHM: header → banner → subtitle → body is laid out on a
//   fixed set of pixel offsets (see the *_TOP constants below) with an
//   explicit gap after every block. A previous version packed these too
//   tightly (tagline ending at y=206, banner starting at y=206) which made
//   the "Your Child's Success Ladder" tagline render underneath the
//   category banner both on screen AND in the exported PDF — this was a
//   real positioning bug, not a preview-only artifact. Keep at least an
//   ~18–24px gap between any two stacked blocks below; don't tighten these
//   without re-checking every layout (medallions/wreath icons key off the
//   same constants).
// - Decorative frame/border lines (the double/triple outlines used by
//   'wave', 'wreath', 'rosette', 'sunburst', 'confetti') are spaced with a
//   visible ~8–10px gap between each line so they read as separate layered
//   lines rather than a single thick smudge.
// - All decorative image transforms avoid `rotate()` combined with
//   percentage-based centering — that combination is unreliable in the
//   html2canvas capture this component is downloaded through. Rotated
//   flourishes below use a fixed pixel box + transform, which is safe;
//   true centering (the watermark) uses flexbox with no transform at all.
// - Content fields (name / class / for / year / date / signature / "Held
//   At") intentionally match the school's own printed certificate so every
//   template stays drop-in compatible with existing generation calls.
// - This component always renders at a fixed CERT_WIDTH x CERT_HEIGHT
//   (1400x990) box — that's required so html2canvas captures a consistent,
//   non-clipped image regardless of how the page around it is scaled. If
//   the on-screen PREVIEW looks cut off on the right (badge/medallion/
//   corner star missing), that is the *parent* preview wrapper rendering
//   this at less than 1400px wide without a CSS `transform: scale()` — it
//   is not a bug in this file, and will not affect the downloaded PDF
//   (html2canvas is told the real 1400x990 size explicitly). Fix that in
//   whichever component wraps <CertificateCanvas /> for on-screen preview.
// - DECORATIVE / SCRIPT FONT ("Berkshire Swash"): used for the school name
//   heading and for the pill/ribbon banner title (Certificate of Merit /
//   Achievement / etc). This is a webfont loaded via Google Fonts in
//   index.html. Two rules to keep it rendering correctly, on screen AND
//   in the exported PDF:
//     1. Always pair it with a generic fallback ('"Berkshire Swash",
//        cursive') so there's a sane fallback if the font hasn't loaded.
//     2. NEVER set fontWeight to anything but 400 on it — Berkshire Swash
//        only ships a single (regular) weight. Asking for 700 makes the
//        browser synthesize a fake bold, which is exactly what was
//        rendering wrong/inconsistently in the html2canvas-exported PDF
//        (synthesized bold on webfonts is unreliable in canvas capture).
//   The actual "wait until the font is fully loaded before capturing"
//   fix lives in utils/certificateDownload.js (waitForFontsReady), not
//   here — this file only needs to declare the font correctly.

import { forwardRef, useState } from 'react';
import logo from '../../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';
import talentGymLogo from '../../assets/optimized/logo/brain-builder-logo-talengym.webp';
import trophyImg from '../../assets/optimized/general/brain-builder-asset-trophy.webp';
import starImg from '../../assets/optimized/general/brain-builder-asset-star.webp';
import childImg from '../../assets/optimized/mascots/brain-builder-mascot-child.webp';
// NOTE: these MUST be transparent PNGs, not JPG. JPEG has no alpha
// channel — any "background removed" signature saved/exported as .jpg
// gets its transparent area baked in as solid white by the exporter,
// permanently, in the pixel data itself. That's why a white box was
// showing up in the PDF even though the source *looked* transparent in
// some previewer: no amount of CSS or html2canvas config can recover
// transparency that was already flattened away in the file. Re-export the
// signatures as PNG with true alpha transparency, then point these
// imports at the .png files.
import directorSign from '../../assets/optimized/mascots/brain-builder-mascot-director-sign.webp';
import principalSign from '../../assets/optimized/mascots/brain-builder-mascot-principal-sign.webp';
import { CERT_WIDTH, CERT_HEIGHT } from '../../utils/certificateDownload';

const DECORATION_IMG = { trophy: trophyImg, star: starImg, child: childImg };

// Script/decorative font used for the school name + banner title only.
// Keep this as a single source of truth so both usages below always stay
// in sync (and so certificateDownload.js's REQUIRED_FONTS list is easy to
// cross-check against).
const SCRIPT_FONT = '"Berkshire Swash", cursive';

// ── Vertical rhythm constants ──
// Every stacked block below reads its top offset from here so the gaps
// stay intentional and easy to re-tune in one place.
const HEADER_TOP = 45;      // logo starting y (no circle frame anymore, so a touch higher)
const LOGO_SIZE = 108;       // bumped up now that the white circle/border frame is gone
// Header block (logo + school name + tagline) got taller once the logos
// were enlarged and lost their circular frame (LOGO_SIZE 78 -> 108), so
// these three were all pushed down together to preserve the same
// ~18-24px gaps the original layout relied on. Re-check these together if
// LOGO_SIZE or the school-name font size changes again.
const BANNER_TOP = 246;     // >=20px clear of the tagline in every case
const SUBTITLE_TOP = 316;   // clear of the banner
const BODY_TOP = 360;       // clear of the subtitle

function formatDate(d) {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Ribbon-cut banner shape used by 'rosette', 'geometric' and 'confetti' layouts.
const RIBBON_CLIP = 'polygon(1.5% 0%, 98.5% 0%, 100% 50%, 98.5% 100%, 1.5% 100%, 0% 50%)';

const GOLD_DROPSHADOW = 'drop-shadow(0 6px 10px rgba(0,0,0,0.28)) drop-shadow(0 1px 0 rgba(255,255,255,0.4))';

// Fixed confetti dot positions for the 'confetti' layout — deterministic
// (no Math.random at render time) so preview and export always match.
const CONFETTI_DOTS = [
  { top: 34, left: 150, r: 4 }, { top: 58, left: 190, r: 3 }, { top: 26, left: 214, r: 5 },
  { top: 70, left: 132, r: 3 }, { top: 46, left: 172, r: 3 }, { top: 92, left: 206, r: 4 },
  { top: 112, left: 150, r: 3 }, { top: 20, left: 122, r: 3 },
];

/** Tiny foil star, tucked into a frame corner — a printed-certificate
 * detail, not a UI icon. Fixed pixel box + transform only (no percentage
 * centering), so it survives html2canvas export unchanged. */
function FoilCorner({ top, bottom, left, right, rotate = 0, size = 22 }) {
  return (
    <img
      src={starImg}
      alt=""
      crossOrigin="anonymous"
      style={{
        position: 'absolute',
        top,
        bottom,
        left,
        right,
        width: size,
        opacity: 0.55,
        transform: `rotate(${rotate}deg)`,
        pointerEvents: 'none',
      }}
    />
  );
}

/** Corner / border decoration for the current template.layout. Painted
 * early in the DOM so all later (text/logo) content stacks visually above
 * it, without needing z-index. Every shape here is a plain div — no SVG.
 * Frame/border lines below are spaced ~9-11px apart so each line reads as
 * a distinct layer instead of merging into one thick edge. */
function LayoutDecor({ layout, accent, accentDark, bandFrom, bandTo }) {
  if (layout === 'wreath') {
    return (
      <>
        <div style={{ position: 'absolute', inset: 16, border: `2.5px solid ${accent}`, borderRadius: 10, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 26, border: `1px solid ${accent}`, borderRadius: 7, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 36, border: `1px dashed ${accent}88`, borderRadius: 4, pointerEvents: 'none' }} />
        <FoilCorner top={32} left={32} rotate={-8} />
        <FoilCorner top={32} right={32} rotate={8} />
        <FoilCorner bottom={32} left={32} rotate={8} />
        <FoilCorner bottom={32} right={32} rotate={-8} />
      </>
    );
  }

  if (layout === 'rosette') {
    return (
      <>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 16, background: `linear-gradient(90deg, ${bandFrom}, ${bandTo})` }} />
        <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 3, background: accent }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 16, background: `linear-gradient(90deg, ${bandTo}, ${bandFrom})` }} />
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, height: 3, background: accent }} />
        <div style={{ position: 'absolute', inset: 32, border: `1.5px solid ${accent}`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 42, border: `1px solid ${accent}66`, pointerEvents: 'none' }} />
      </>
    );
  }

  if (layout === 'geometric') {
    const flag = (pos, mirrored, key) => (
      <div
        key={key}
        style={{
          position: 'absolute',
          ...pos,
          width: 140,
          height: 140,
          background: `linear-gradient(135deg, ${bandFrom}, ${bandTo})`,
          clipPath: mirrored ? 'polygon(100% 0%, 0% 0%, 100% 100%)' : 'polygon(0% 0%, 100% 0%, 0% 100%)',
          opacity: 0.94,
          boxShadow: '0 0 20px rgba(0,0,0,0.12)',
        }}
      />
    );
    return (
      <>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, background: accentDark }} />
        <div style={{ position: 'absolute', top: 22, left: 0, right: 0, height: 4, background: accent }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: accentDark }} />
        <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 4, background: accent }} />
        {flag({ top: 0, left: 0 }, false, 'tl')}
        {flag({ bottom: 0, right: 0 }, true, 'br')}
        <FoilCorner top={26} right={26} />
        <FoilCorner bottom={26} left={26} />
      </>
    );
  }

  if (layout === 'sunburst') {
    return (
      <>
        <div
          style={{
            position: 'absolute', top: -140, left: -140, width: 360, height: 360, borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 35%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: -140, right: -140, width: 360, height: 360, borderRadius: '50%',
            background: `radial-gradient(circle, ${accentDark}55 0%, ${accentDark}22 35%, transparent 70%)`,
          }}
        />
        <div style={{ position: 'absolute', inset: 15, border: `2px solid ${accent}`, borderRadius: 12, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 26, border: `1px solid ${accent}77`, borderRadius: 8, pointerEvents: 'none' }} />
        <FoilCorner top={30} left={30} size={18} />
        <FoilCorner bottom={30} right={30} size={18} />
      </>
    );
  }

  if (layout === 'confetti') {
    return (
      <>
        <div style={{ position: 'absolute', top: -70, left: -70, width: 280, height: 280, background: `linear-gradient(135deg, ${bandFrom}, ${bandTo})`, borderRadius: '0 0 100% 0', opacity: 0.96, boxShadow: '10px 10px 24px rgba(0,0,0,0.08)' }} />
        <div style={{ position: 'absolute', top: -30, left: -30, width: 160, height: 160, background: accent, borderRadius: '0 0 100% 0', opacity: 0.9 }} />
        <div style={{ position: 'absolute', bottom: -70, right: -70, width: 280, height: 280, background: `linear-gradient(315deg, ${bandTo}, ${bandFrom})`, borderRadius: '100% 0 0 0', opacity: 0.96, boxShadow: '-10px -10px 24px rgba(0,0,0,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, background: accent, borderRadius: '100% 0 0 0', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: 14, border: `1.5px solid ${accent}`, borderRadius: 8, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 24, border: `1px solid ${accent}55`, borderRadius: 6, pointerEvents: 'none' }} />
        {CONFETTI_DOTS.map((d, i) => (
          <div key={i} style={{ position: 'absolute', top: d.top, left: d.left, width: d.r * 2, height: d.r * 2, borderRadius: '50%', background: i % 2 ? accent : bandTo, opacity: 0.85 }} />
        ))}
      </>
    );
  }

  // 'wave' (default) — diagonal navy/gold swoosh corners with a layered
  // foil edge for depth.
  return (
    <>
      <div style={{ position: 'absolute', top: -70, left: -70, width: 280, height: 280, background: `linear-gradient(135deg, ${bandFrom}, ${bandTo})`, borderRadius: '0 0 100% 0', opacity: 0.96, boxShadow: '10px 10px 24px rgba(0,0,0,0.08)' }} />
      <div style={{ position: 'absolute', top: -30, left: -30, width: 160, height: 160, background: accent, borderRadius: '0 0 100% 0', opacity: 0.9 }} />
      <div style={{ position: 'absolute', top: 6, left: 6, width: 70, height: 70, border: `1.5px solid ${bandFrom}55`, borderRadius: '0 0 100% 0', opacity: 0.7 }} />
      <div style={{ position: 'absolute', bottom: -70, right: -70, width: 280, height: 280, background: `linear-gradient(315deg, ${bandTo}, ${bandFrom})`, borderRadius: '100% 0 0 0', opacity: 0.96, boxShadow: '-10px -10px 24px rgba(0,0,0,0.08)' }} />
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 160, height: 160, background: accent, borderRadius: '100% 0 0 0', opacity: 0.9 }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 70, height: 70, border: `1.5px solid ${bandTo}55`, borderRadius: '100% 0 0 0', opacity: 0.7 }} />
      <div style={{ position: 'absolute', inset: 14, border: `1.5px solid ${accent}`, borderRadius: 8, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 24, border: `1px solid ${accent}55`, borderRadius: 6, pointerEvents: 'none' }} />
    </>
  );
}

/** Two award medallions flanking the title, used only by the 'rosette'
 * layout. Real star.png centered in a radial-gradient circle — no SVG.
 * Positioned to sit level with BANNER_TOP so it doesn't creep into the
 * subtitle/body area below. */
function RosetteMedallions({ accent, accentDark }) {
  const Medallion = ({ side }) => (
    <div style={{ position: 'absolute', top: BANNER_TOP - 4, [side]: 66, width: 88, textAlign: 'center' }}>
      <div
        style={{
          width: 76,
          height: 76,
          margin: '0 auto',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 30%, ${accent}, ${accentDark})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 14px rgba(0,0,0,0.22), inset 0 0 0 3px rgba(255,255,255,0.35)',
        }}
      >
        <img src={starImg} alt="" crossOrigin="anonymous" style={{ width: 38, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: -4 }}>
        <div style={{ width: 13, height: 38, background: accentDark, clipPath: 'polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)' }} />
        <div style={{ width: 13, height: 38, background: accentDark, clipPath: 'polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)' }} />
      </div>
    </div>
  );
  return (
    <>
      <Medallion side="left" />
      <Medallion side="right" />
    </>
  );
}

const CertificateCanvas = forwardRef(function CertificateCanvas(
  { template, name, className, title, forText, year, date, signatureUrl, principalSignatureUrl, isEditing = false, onTitleChange, onSubtitleChange },
  ref
) {
  const decorationSrc = DECORATION_IMG[template?.decorationImage] || trophyImg;
  const accent = template?.accent || '#C9A24B';
  const accentDark = template?.accentDark || '#8a6d1f';
  const bandFrom = template?.bandFrom || accent;
  const bandTo = template?.bandTo || accentDark;
  const layout = template?.layout || 'wave';
  const certTitle = template?.certTitle || 'Certificate of Achievement';
  const isRibbonBanner = layout === 'rosette' || layout === 'geometric' || layout === 'confetti';
  const showMascotAccent = layout === 'confetti';

  const [editableTitle, setEditableTitle] = useState(certTitle);
  const [editableSubtitle, setEditableSubtitle] = useState(title || 'Achievement');

  const displayTitle = isEditing ? editableTitle : certTitle;
  const displaySubtitle = isEditing ? editableSubtitle : (title || 'Achievement');

  const colors = [
  "#A84BC8", // D
  "#1DA1F2", // A
  "#2847B8", // Y
  "#FFA000", // C
  "#C23FA6", // A
  "#F44336", // R
  "#18A84A", // E
];

  return (
    <div
      ref={ref}
      style={{
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
        background: template?.bg || '#fff',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        border: `2px solid ${accent}`,
        boxSizing: 'border-box',
        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.045)',
      }}
    >
      {/* Soft background wash */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 90% at 50% 0%, ${accent}0D, transparent 60%)` }} />

      {/* Ultra-faint guilloche-style hairlines for a printed-security-paper feel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.035,
          backgroundImage: `repeating-linear-gradient(115deg, ${accentDark} 0px, ${accentDark} 1px, transparent 1px, transparent 26px)`,
        }}
      />

      <LayoutDecor layout={layout} accent={accent} accentDark={accentDark} bandFrom={bandFrom} bandTo={bandTo} />

      {/* ── WATERMARK ──
          Image, export-safe: no rotate/translate transform (that combo is
          what makes html2canvas render a watermark off-position in the
          PDF), opacity on the wrapping div rather than the <img> itself,
          and flexbox centering. Placed early in the DOM so every later
          element paints above it without needing z-index. */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: 0.05 }}>
        <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 340, display: 'block' }} />
      </div>

      {layout === 'rosette' && <RosetteMedallions accent={accent} accentDark={accentDark} />}

      {/* Decoration graphic, top-left — real trophy/star/child asset, not a line icon */}
      <div style={{ position: 'absolute', top: HEADER_TOP, left: 66, width: LOGO_SIZE }}>
        <img src={decorationSrc} alt="" crossOrigin="anonymous" style={{ width: '100%', display: 'block', filter: GOLD_DROPSHADOW }} />
      </div>

      {/* Talent Gym badge, top-right — no circular white frame anymore,
          just the logo art itself at a larger size. Ribbon tails kept as
          a printed-medal detail underneath it. */}
      <div style={{ position: 'absolute', top: HEADER_TOP - 6, right: 54, width: 130, height: 150, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <img
          src={talentGymLogo}
          alt="Talent Gym"
          crossOrigin="anonymous"
          style={{ width: 130, height: 130, objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' }}
        />
      </div>

      {/* Header: Brain Builder logo + school name + tagline. Fixed-height
          rows (not just marginTop) so the block's total height is
          predictable and never collides with BANNER_TOP below. */}
      <div style={{ position: 'absolute', top: HEADER_TOP, left: 0, right: 0, textAlign: 'center' }}>
        {/* No circular white frame anymore — just the logo art itself,
            centered, at the larger LOGO_SIZE. */}
        <div style={{ width: LOGO_SIZE, height: LOGO_SIZE, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={logo}
            alt="Brain Builder"
            crossOrigin="anonymous"
            style={{ height: LOGO_SIZE, width: LOGO_SIZE, objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
          />
        </div>
        {/* School name — decorative script font. fontWeight MUST stay 400
            (Berkshire Swash has no bold face; see file header note). */}
        <div
          style={{
            marginTop: 10,
            fontSize: 30,
            lineHeight: '36px',
            fontFamily: SCRIPT_FONT,
            fontWeight: 400,
            color: accentDark,
            letterSpacing: 0.5,
            textShadow: '0 1px 0 rgba(255,255,255,0.6)',
          }}
        >
          Zorix School
        </div>
        <div style={{ marginTop: 8, fontSize: 13, lineHeight: '16px', color: '#6b6478' }}>Your Child&apos;s Success Ladder</div>
      </div>

      {/* Banner — title also uses the script font (Certificate of Merit /
          Achievement / etc). fontWeight stays 400 here too, same reason.
          Centered via a full-width flex wrapper, NOT left:50% +
          transform:translateX(-50%). That combo depends on the browser
          having already measured the element's final rendered width,
          which for this element depends on Berkshire Swash's font
          metrics — fine in the live preview (browser reflows the instant
          the font swaps in), but unreliable in the html2canvas-captured
          clone, where the -50% shift could be computed a frame before
          layout had settled to the real font, cutting the ribbon
          clip-path off-center in the exported PDF. Flexbox centering
          sidesteps this entirely (same reasoning as the watermark above). */}
    <div
  style={{
    position: "absolute",
    top: BANNER_TOP,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
  }}
>
  <div
    style={{
      display: "flex",
      gap: "2px",
      fontSize: 48,
      fontFamily: '"Grobold", "Luckiest Guy", sans-serif',
      fontWeight: 700,
      lineHeight: 1,
      whiteSpace: "nowrap",
    }}
  >
    {isEditing ? (
      <input
        type="text"
        value={editableTitle}
        onChange={(e) => { setEditableTitle(e.target.value); onTitleChange?.(e.target.value); }}
        style={{
          fontSize: 48,
          fontFamily: '"Grobold", "Luckiest Guy", sans-serif',
          fontWeight: 700,
          lineHeight: 1,
          textAlign: 'center',
          width: '90%',
          background: 'transparent',
          border: '2px dashed rgba(0,0,0,0.25)',
          borderRadius: 8,
          padding: '8px 12px',
          color: accentDark,
          outline: 'none',
        }}
      />
    ) : (
      certTitle.split("").map((char, index) => (
        <span
          key={index}
          style={{
            color: colors[index % colors.length],
            WebkitTextStroke: "2px white",
            textShadow: `
              2px 2px 0 rgba(0,0,0,.12),
              3px 3px 6px rgba(0,0,0,.18)
            `,
            display: "inline-block",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))
    )}
  </div>
</div>

      {isEditing ? (
        <input
          type="text"
          value={editableSubtitle}
          onChange={(e) => { setEditableSubtitle(e.target.value); onSubtitleChange?.(e.target.value); }}
          style={{
            position: 'absolute',
            top: SUBTITLE_TOP,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 600,
            color: accentDark,
            textTransform: 'uppercase',
            letterSpacing: 2,
            background: 'transparent',
            border: '2px dashed rgba(0,0,0,0.25)',
            borderRadius: 8,
            padding: '6px 12px',
            outline: 'none',
          }}
        />
      ) : (
        <div style={{ position: 'absolute', top: SUBTITLE_TOP, left: 0, right: 0, textAlign: 'center', fontSize: 18, fontWeight: 600, color: accentDark, textTransform: 'uppercase', letterSpacing: 2 }}>
          {title || 'Achievement'}
        </div>
      )}

      {/* Body */}
      <div style={{ position: 'absolute', top: BODY_TOP, left: 90, right: 90, textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontStyle: 'italic', color: '#4a4458' }}>This certificate is proudly presented to</div>

        <div
          style={{
            fontSize: 44,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 700,
            color: accentDark,
            borderBottom: `2px solid ${accent}`,
            display: 'inline-block',
            padding: '10px 40px 8px',
            marginTop: 14,
            minWidth: 480,
          }}
        >
          {name || '—'}
        </div>

        <div style={{ fontSize: 17, color: '#4a4458', marginTop: 22 }}>Of Class <b>{className || '—'}</b> for</div>

        <div style={{ fontSize: 19, color: '#2B2440', marginTop: 10, fontStyle: 'italic', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto' }}>
          {forText || '—'}
        </div>

        <div style={{ fontSize: 15, color: '#6a6478', marginTop: 18 }}>
          School wishes for his / her bright future — {year || new Date().getFullYear()}
        </div>

        <div style={{ fontSize: 12.5, color: '#9a92a8', marginTop: 6, letterSpacing: 0.3 }}>
          Held At: Sector A-535, Mahalaxmi Nagar, Indore &nbsp;|&nbsp; 8422999199, 9619841642
        </div>
      </div>

      {/* Footer: signature + date */}
      <div style={{ position: 'absolute', bottom: 40, left: 90, right: 90, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', width: 200 }}>
          <img src={signatureUrl || directorSign} alt="Director Signature" crossOrigin="anonymous" style={{ height: 48, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          <div style={{ borderTop: `1px solid ${accentDark}`, marginTop: 4, paddingTop: 4, fontSize: 13, color: accentDark, fontWeight: 600 }}>Director</div>
        </div>

        <div style={{ textAlign: 'center', width: 200 }}>
          <img src={principalSignatureUrl || principalSign} alt="Principal Signature" crossOrigin="anonymous" style={{ height: 48, objectFit: 'contain', margin: '0 auto', display: 'block' }} />
          <div style={{ borderTop: `1px solid ${accentDark}`, marginTop: 4, paddingTop: 4, fontSize: 13, color: accentDark, fontWeight: 600 }}>Principal</div>
        </div>

        <div style={{ textAlign: 'center', width: 200 }}>
          <div style={{ height: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontSize: 15, color: accentDark, fontWeight: 600 }}>
            {formatDate(date)}
          </div>
          <div style={{ borderTop: `1px solid ${accentDark}`, marginTop: 4, paddingTop: 4, fontSize: 13, color: accentDark, fontWeight: 600 }}>Date</div>
        </div>
      </div>

      {/* Small foil star flourish, bottom-right — echoes the top-left decoration graphic */}
      <div style={{ position: 'absolute', bottom: 106, right: 62, width: 44 }}>
        <img src={starImg} alt="" crossOrigin="anonymous" style={{ width: '100%', display: 'block', filter: GOLD_DROPSHADOW, opacity: 0.92 }} />
      </div>

      {/* 'confetti' (Brand Classic) only — a small child mascot tucked
          above the signature row, low opacity so it reads as a printed
          accent rather than clutter. Positioned well clear of the footer
          (which starts at bottom: 40 and runs ~75px tall) so nothing
          overlaps. */}
      {showMascotAccent && (
        <div style={{ position: 'absolute', bottom: 130, left: 66, width: 64, opacity: 0.55 }}>
          <img src={childImg} alt="" crossOrigin="anonymous" style={{ width: '100%', display: 'block', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.15))' }} />
        </div>
      )}
    </div>
  );
});

export default CertificateCanvas;
