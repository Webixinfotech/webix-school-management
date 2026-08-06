// src/components/CertificateStudio/CertificateIcons.jsx
//
// Inline SVG decorative icons — crisp at any size, no external image
// requests, and render reliably inside the html2canvas export (unlike
// raster PNGs, which can blur when scaled or fail silently on CORS).
// Each icon takes `accent` / `accentDark` so it re-colors per template.
//
// IMPORTANT: SVG <defs> ids are global to the page. If two certificates
// are ever mounted at once (e.g. a template gallery preview grid), two
// icons using the same gradient id will fight over the same paint. Every
// icon here takes an `id` prop (pass the template id, e.g. "royal-navy-gold")
// and namespaces its internal gradient ids with it — always pass a unique
// `id` per rendered certificate.

function gid(id, key) {
  return `${id || 'cert'}-${key}`;
}

/** Trophy cup, gold-foil gradient with a bright highlight rim. */
export function TrophyIcon({ id, accent = '#C9A24B', accentDark = '#8a6d1f', size = 78 }) {
  const g = gid(id, 'trophy');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.28))' }}>
      <defs>
        <linearGradient id={g} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="45%" stopColor={accent} />
          <stop offset="100%" stopColor={accentDark} />
        </linearGradient>
      </defs>
      <path
        d="M30 8h40v6h12a3 3 0 0 1 3 3v4c0 12-9 20-19 21.5C63 50 57 55 53 56v10h10a4 4 0 0 1 4 4v4H33v-4a4 4 0 0 1 4-4h10V56c-4-1-10-6-13-13.5C24 41 15 33 15 21v-4a3 3 0 0 1 3-3h12V8Z"
        fill={`url(#${g})`}
        stroke={accentDark}
        strokeWidth="1.2"
      />
      <rect x="30" y="78" width="40" height="7" rx="2" fill={`url(#${g})`} stroke={accentDark} strokeWidth="1" />
      <rect x="38" y="70" width="24" height="10" fill={`url(#${g})`} stroke={accentDark} strokeWidth="1" />
      <circle cx="50" cy="30" r="9" fill="none" stroke="#fff8e6" strokeWidth="1.6" opacity="0.85" />
    </svg>
  );
}

/** Medal on a two-tail ribbon, with a five-point star embossed in the centre. */
export function MedalIcon({ id, accent = '#C9A24B', accentDark = '#8a6d1f', ribbon = '#8a1f2b', size = 78 }) {
  const g = gid(id, 'medal');
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" style={{ display: 'block', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.25))' }}>
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="55%" stopColor={accent} />
          <stop offset="100%" stopColor={accentDark} />
        </radialGradient>
      </defs>
      <path d="M32 4 48 40 20 40Z" fill={ribbon} />
      <path d="M68 4 52 40 80 40Z" fill={ribbon} opacity="0.85" />
      <circle cx="50" cy="66" r="34" fill={`url(#${g})`} stroke={accentDark} strokeWidth="1.4" />
      <circle cx="50" cy="66" r="26" fill="none" stroke="#fff8e6" strokeWidth="1.4" opacity="0.75" />
      <path
        d="M50 52l4.5 9.2 10.1 1.5-7.3 7.1 1.7 10.1L50 74.9l-9 5 1.7-10.1-7.3-7.1 10.1-1.5Z"
        fill="#fff8e6"
        opacity="0.95"
      />
    </svg>
  );
}

/** Single laurel-leaf branch. Use two, mirrored, flanking a title. */
export function WreathIcon({ id, accent = '#C9A24B', accentDark = '#8a6d1f', size = 54, mirror = false }) {
  const g = gid(id, 'wreath');
  const leaves = [10, 22, 34, 46, 58, 68];
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 60 90"
      style={{ display: 'block', transform: mirror ? 'scaleX(-1)' : 'none', filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.18))' }}
    >
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={accentDark} />
        </linearGradient>
      </defs>
      <path d="M40 4C20 12 8 32 12 56c3 16 14 28 14 28" fill="none" stroke={`url(#${g})`} strokeWidth="3.2" strokeLinecap="round" />
      {leaves.map((t, i) => (
        <ellipse
          key={i}
          cx={40 - t * 0.42}
          cy={8 + t}
          rx="7"
          ry="3.4"
          fill={`url(#${g})`}
          transform={`rotate(${-35 - i * 6} ${40 - t * 0.42} ${8 + t})`}
        />
      ))}
    </svg>
  );
}

/** Fluted award seal — a rosette/badge shape with an embossed star. */
export function SealIcon({ id, accent = '#C9A24B', accentDark = '#8a6d1f', size = 70 }) {
  const g = gid(id, 'seal');
  const points = Array.from({ length: 14 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 14;
    const r = i % 2 === 0 ? 34 : 27;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block', filter: 'drop-shadow(0 5px 8px rgba(0,0,0,0.22))' }}>
      <defs>
        <radialGradient id={g} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="55%" stopColor={accent} />
          <stop offset="100%" stopColor={accentDark} />
        </radialGradient>
      </defs>
      <polygon points={points} fill={`url(#${g})`} stroke={accentDark} strokeWidth="1" />
      <circle cx="50" cy="50" r="21" fill="none" stroke="#fff8e6" strokeWidth="1.4" opacity="0.85" />
      <path d="M50 36l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L50 54.4l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2Z" fill="#fff8e6" />
    </svg>
  );
}

/** Radiating ray-burst, used as a soft corner glow behind other decor. */
export function SunburstIcon({ id, accent = '#C9A24B', accentDark = '#8a6d1f', size = 300, rays = 24 }) {
  const g = gid(id, 'sun');
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.47;
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = (Math.PI * 2 * i) / rays;
    const x2 = cx + r * Math.cos(a);
    const y2 = cy + r * Math.sin(a);
    return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={`url(#${g})`} strokeWidth={size * 0.03} strokeLinecap="round" />;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accentDark} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {lines}
    </svg>
  );
}

/** Small foil star — used for corner flourishes and confetti. */
export function StarIcon({ id, accent = '#C9A24B', accentDark = '#8a6d1f', size = 22 }) {
  const g = gid(id, 'star');
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>
      <defs>
        <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff6dc" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
      </defs>
      <path
        d="M20 2l4.7 11.9 12.8 1-9.8 8.4 3 12.5L20 29l-10.7 6.8 3-12.5-9.8-8.4 12.8-1Z"
        fill={`url(#${g})`}
        stroke={accentDark}
        strokeWidth="0.6"
      />
    </svg>
  );
}

export const DECORATION_ICON = { trophy: TrophyIcon, medal: MedalIcon, seal: SealIcon };