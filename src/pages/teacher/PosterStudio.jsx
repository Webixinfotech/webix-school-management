import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  Upload, Download, Palette, Type, Image as ImageIcon, Share2, X, Plus,
  Sparkles, Move, RotateCcw, Layers, Check, ChevronLeft, ChevronRight,
  Loader2, Smartphone, MessageCircle, GalleryHorizontal,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import logo from '../../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';

const ADMIN_WHATSAPP = '918422999199'; // +91 84229-99199
const POSTER_SIZE = 1080;

/* ───────────────────────────── Themes ───────────────────────────── */
/* Each theme drives a full visual identity: background, accent colors,
   decorative palette and type pairing. Decorative ELEMENTS themselves are
   real layered SVG illustrations (balloons / gift / bunting / confetti /
   cake) — not emoji — so the poster reads as a designed graphic, not a
   text message. */

const THEMES = [
  {
    id: 'confetti',
    name: 'Confetti Pop',
    bg: 'linear-gradient(160deg,#FFE8EF 0%,#FFF3E6 55%,#FFF8E1 100%)',
    panel: 'rgba(255,255,255,0.96)',
    accent: '#E11D48',
    accent2: '#FF8A3D',
    accentSoft: '#FFE4EC',
    text: '#2B1320',
    sub: '#7A4A4A',
    balloons: ['#FF6B9D', '#FFC857', '#7AD0FF', '#B68CFF'],
    display: '"Baloo 2","Segoe UI Rounded",system-ui,sans-serif',
    body: '"Poppins","Segoe UI",sans-serif',
    frameShape: 'circle',
  },
  {
    id: 'royal',
    name: 'Golden Royal',
    bg: 'linear-gradient(160deg,#1B1036 0%,#3A1C5C 55%,#5C2A6D 100%)',
    panel: 'rgba(20,12,38,0.6)',
    accent: '#F4C95D',
    accent2: '#D88BFF',
    accentSoft: 'rgba(244,201,93,0.18)',
    text: '#FCEFC7',
    sub: '#D9C9A3',
    balloons: ['#F4C95D', '#D88BFF', '#6FE3FF', '#F4C95D'],
    display: '"Playfair Display","Georgia",serif',
    body: '"Lato","Segoe UI",sans-serif',
    frameShape: 'arch',
  },
  {
    id: 'pastel',
    name: 'Pastel Dream',
    bg: 'linear-gradient(160deg,#FDEFF9 0%,#EAF6FF 50%,#F1FFEF 100%)',
    panel: 'rgba(255,255,255,0.92)',
    accent: '#9D7BD8',
    accent2: '#FF9DC4',
    accentSoft: '#F0E7FF',
    text: '#4A3B66',
    sub: '#8C7AA8',
    balloons: ['#C9A8FF', '#FFB3D1', '#A8E6CF', '#FFE08C'],
    display: '"Quicksand","Comic Sans MS",sans-serif',
    body: '"Nunito","Segoe UI",sans-serif',
    frameShape: 'scallop',
  },
  {
    id: 'galaxy',
    name: 'Galaxy Night',
    bg: 'linear-gradient(160deg,#05060F 0%,#10163A 45%,#231A4D 100%)',
    panel: 'rgba(15,18,45,0.6)',
    accent: '#6FE3FF',
    accent2: '#B68CFF',
    accentSoft: 'rgba(111,227,255,0.16)',
    text: '#EAF6FF',
    sub: '#9FB3D9',
    balloons: ['#6FE3FF', '#B68CFF', '#FF9DC4', '#6FE3FF'],
    display: '"Orbitron","Segoe UI",sans-serif',
    body: '"Rajdhani","Segoe UI",sans-serif',
    frameShape: 'hex',
  },
  {
    id: 'rainbow',
    name: 'Rainbow Burst',
    bg: 'linear-gradient(160deg,#FFF4E0 0%,#FFE9F0 50%,#E8F6FF 100%)',
    panel: 'rgba(255,255,255,0.95)',
    accent: '#FF5E78',
    accent2: '#5EC8FF',
    accentSoft: '#FFE9EC',
    text: '#27263B',
    sub: '#6B6885',
    balloons: ['#FF5E78', '#FFB454', '#5EC8FF', '#7CE38B'],
    display: '"Fredoka","Baloo 2",sans-serif',
    body: '"Poppins","Segoe UI",sans-serif',
    frameShape: 'circle',
  },
  {
    id: 'classroom',
    name: 'Classroom Cheer',
    bg: 'linear-gradient(160deg,#EAFBF6 0%,#FFF6E8 55%,#FFEFE2 100%)',
    panel: 'rgba(255,255,255,0.95)',
    accent: '#FF8A3D',
    accent2: '#2E7D6B',
    accentSoft: '#FFE6D2',
    text: '#1F3A36',
    sub: '#4F6F69',
    balloons: ['#FF8A3D', '#3FA796', '#FFD166', '#7BD3C0'],
    display: '"Baloo 2","Segoe UI Rounded",sans-serif',
    body: '"Poppins","Segoe UI",sans-serif',
    frameShape: 'badge',
  },
];

const FONT_STYLES = [
  { id: 'display', label: 'Playful' },
  { id: 'elegant', label: 'Elegant' },
  { id: 'bold', label: 'Bold Caps' },
];

const NOTE_PRESETS = [
  'May your special day bring you lots of smiles, laughter and wonderful memories. Have a fantastic year ahead!',
  'Wishing you a year as bright and wonderful as you are. Keep shining, keep dreaming!',
  'Another year older, another year more amazing. Stay kind, stay curious, stay you.',
  'May your birthday be the start of a year filled with good luck, good health and much happiness.',
];

const TEXT_POSITIONS = [
  { id: 'bottom', label: 'Bottom' },
  { id: 'top', label: 'Top' },
  { id: 'center', label: 'Center' },
];

/* ───────────────────────────── Helpers ───────────────────────────── */

const getInitials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '★';

const buildWhatsAppText = (name) =>
  `🎈 Happy Birthday, ${name}! 🎂🎉\n\nHope your special day is filled with laughter, cake, and everything you love!\n\n- Your School Family 🏫`;

const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const frameClipStyle = (shape) => {
  switch (shape) {
    case 'arch': return { borderRadius: '50% 50% 8% 8% / 60% 60% 8% 8%' };
    case 'hex': return { clipPath: 'polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%)' };
    case 'scallop': return { borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' };
    case 'badge': return { borderRadius: '24px' };
    default: return { borderRadius: '50%' };
  }
};

/* ─────────────────────── Real layered 3D-style SVG icons ───────────────────────
   These replace emoji entirely. Each uses gradients + highlight shapes so they
   read as glossy illustrated stickers, similar to professionally designed
   birthday posters. */

let gid = 0;
const nextId = (p) => `${p}${gid++}`;

function Balloon3D({ color, size = 90, rotate = 0, style = {} }) {
  const top = nextId('bg');
  const sheen = nextId('sh');
  return (
    <svg
      width={size}
      height={size * 1.45}
      viewBox="0 0 100 145"
      style={{ position: 'absolute', transform: `rotate(${rotate}deg)`, filter: 'drop-shadow(0 10px 14px rgba(0,0,0,0.22))', ...style }}
    >
      <defs>
        <radialGradient id={top} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="18%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="42" ry="50" fill={`url(#${top})`} />
      <ellipse cx="34" cy="28" rx="10" ry="15" fill="#ffffff" opacity="0.55" />
      <path d="M44 98 Q50 104 56 98 L52 110 L48 110 Z" fill={color} />
      <path d="M50 110 C 46 122, 54 128, 50 140" stroke="#C9C9C9" strokeWidth="1.4" fill="none" />
    </svg>
  );
}

function GiftBox3D({ size = 110, accent, accent2, style = {} }) {
  const lid = nextId('lid');
  const box = nextId('box');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute', filter: 'drop-shadow(0 10px 16px rgba(0,0,0,0.25))', ...style }}>
      <defs>
        <linearGradient id={box} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.85" />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>
        <linearGradient id={lid} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={accent2} />
          <stop offset="100%" stopColor={accent2} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect x="18" y="50" width="84" height="58" rx="6" fill={`url(#${box})`} />
      <rect x="18" y="50" width="84" height="58" rx="6" fill="#000" opacity="0.06" />
      <rect x="10" y="34" width="100" height="22" rx="6" fill={`url(#${lid})`} />
      <rect x="52" y="34" width="16" height="74" fill="#ffffff" opacity="0.85" />
      <path d="M60 34 C 40 10, 14 14, 30 32 C 40 40, 54 38, 60 34 Z" fill={accent2} />
      <path d="M60 34 C 80 10, 106 14, 90 32 C 80 40, 66 38, 60 34 Z" fill={accent2} />
      <circle cx="60" cy="32" r="7" fill="#fff" opacity="0.7" />
    </svg>
  );
}

function Bunting3D({ colors, width = 360, style = {} }) {
  const flags = 7;
  const fw = width / flags;
  return (
    <svg width={width} height="46" viewBox={`0 0 ${width} 46`} style={{ position: 'absolute', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))', ...style }}>
      <path d={`M0 4 Q ${width / 2} 22 ${width} 4`} stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" fill="none" />
      {Array.from({ length: flags }).map((_, i) => {
        const x = i * fw + fw / 2;
        const sag = Math.sin((i / (flags - 1)) * Math.PI) * 16;
        return (
          <g key={i} transform={`translate(${x},${4 + sag})`}>
            <path d="M-13 0 L13 0 L0 28 Z" fill={colors[i % colors.length]} />
            <circle cx="0" cy="3" r="3" fill="#fff" opacity="0.6" />
          </g>
        );
      })}
    </svg>
  );
}

function ConfettiField({ colors, count = 16, area }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        r: 4 + Math.random() * 6,
        rot: Math.random() * 360,
        c: colors[i % colors.length],
        shape: i % 3,
      })),
    [count, colors]
  );
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, ...area }}>
      {items.map((it, i) => (
        <g key={i} transform={`translate(${it.x},${it.y}) rotate(${it.rot})`} opacity="0.85">
          {it.shape === 0 && <rect x={-it.r / 2} y={-it.r / 4} width={it.r} height={it.r / 2} rx="1" fill={it.c} />}
          {it.shape === 1 && <circle r={it.r / 2.6} fill={it.c} />}
          {it.shape === 2 && <polygon points={`0,-${it.r / 2} ${it.r / 2},${it.r / 2} -${it.r / 2},${it.r / 2}`} fill={it.c} />}
        </g>
      ))}
    </svg>
  );
}

function Cake3D({ size = 110, accent, accent2, style = {} }) {
  const ic = nextId('ic');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.3))', ...style }}>
      <defs>
        <linearGradient id={ic} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#FFE9F0" />
        </linearGradient>
      </defs>
      <rect x="22" y="78" width="76" height="28" rx="6" fill={accent} />
      <rect x="22" y="78" width="76" height="10" rx="4" fill={`url(#${ic})`} />
      <rect x="30" y="56" width="60" height="26" rx="6" fill={accent2} />
      <rect x="30" y="56" width="60" height="9" rx="4" fill={`url(#${ic})`} />
      {[40, 60, 80].map((x, i) => (
        <g key={i}>
          <rect x={x - 2} y="34" width="4" height="20" rx="2" fill={i % 2 ? '#fff' : accent} />
          <path d={`M${x} 26 q4 4 0 8 q-4 -4 0 -8`} fill="#FFC857" />
        </g>
      ))}
    </svg>
  );
}

/* ─────────────────── Decoration layer: composes the icons per theme ─────────────────── */

function DecorLayer({ theme }) {
  const [c1, c2, c3, c4] = theme.balloons;
  return (
    <>
      <ConfettiField colors={theme.balloons} count={22} />
      <Balloon3D color={c1} size={92} rotate={-8} style={{ top: 70, left: 36 }} />
      <Balloon3D color={c2} size={68} rotate={10} style={{ top: 130, left: 18 }} />
      <Balloon3D color={c3} size={100} rotate={9} style={{ top: 64, right: 34 }} />
      <Balloon3D color={c4} size={66} rotate={-12} style={{ top: 132, right: 16 }} />
      <GiftBox3D size={118} accent={theme.accent} accent2={theme.accent2} style={{ bottom: 30, left: 26 }} />
      <Bunting3D colors={theme.balloons} width={POSTER_SIZE - 160} style={{ top: 0, left: 80 }} />
    </>
  );
}

/* ───────────────────────────── Poster Canvas ───────────────────────────── */

function PosterCanvas({ canvasRef, theme, name, note, photo, photoPos, onPhotoPosChange, fontStyle, textPos, draggable, collage = [] }) {
  const dragState = useRef(null);

  const handlePointerDown = (e) => {
    if (!draggable || !photo) return;
    const point = e.touches ? e.touches[0] : e;
    dragState.current = { startX: point.clientX, startY: point.clientY, origin: { ...photoPos } };
  };
  const handlePointerMove = (e) => {
    if (!dragState.current) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = point.clientX - dragState.current.startX;
    const dy = point.clientY - dragState.current.startY;
    const next = {
      x: Math.max(-40, Math.min(40, dragState.current.origin.x + dx / 4)),
      y: Math.max(-40, Math.min(40, dragState.current.origin.y + dy / 4)),
    };
    onPhotoPosChange(next);
  };
  const handlePointerUp = () => { dragState.current = null; };

  const titleFont =
    fontStyle === 'bold'
      ? { fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }
      : fontStyle === 'elegant'
      ? { fontWeight: 600, fontStyle: 'italic', letterSpacing: '0.01em' }
      : { fontWeight: 800, letterSpacing: '0' };

  const contentJustify = textPos === 'top' ? 'flex-start' : textPos === 'center' ? 'center' : 'flex-end';

  return (
    <div
      ref={canvasRef}
      style={{
        width: POSTER_SIZE,
        height: POSTER_SIZE,
        position: 'relative',
        overflow: 'hidden',
        background: theme.bg,
        fontFamily: theme.body,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: contentJustify,
        boxSizing: 'border-box',
      }}
    >
      <DecorLayer theme={theme} />

      {/* photo collage strip — small tilted thumbnails, like a film reel */}
      {collage.length > 0 && (
        <div style={{ position: 'absolute', top: 130, right: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {collage.slice(0, 3).map((p, i) => (
            <div
              key={i}
              style={{
                width: 96,
                height: 96,
                borderRadius: 14,
                overflow: 'hidden',
                border: '5px solid #fff',
                boxShadow: '0 10px 18px rgba(0,0,0,0.28)',
                transform: `rotate(${i % 2 === 0 ? -6 : 6}deg)`,
              }}
            >
              <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* logo badge — large, top centre */}
      <div
        style={{
          position: 'absolute',
          top: 26,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: theme.panel,
          padding: '10px 26px 10px 10px',
          borderRadius: 999,
          boxShadow: '0 10px 26px rgba(0,0,0,0.22)',
          zIndex: 3,
        }}
      >
        <img src={logo} alt="logo" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '50%', background: '#fff' }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontFamily: theme.display, fontSize: 24, fontWeight: 800, color: theme.text }}>
            Brain Builder International
          </span>
          <span style={{ fontFamily: theme.body, fontSize: 13, fontWeight: 600, color: theme.accent, letterSpacing: '0.04em' }}>
            PRE-SCHOOL & DAYCARE
          </span>
        </div>
      </div>

      {/* photo frame */}
      <div
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        style={{
          width: 420,
          height: 420,
          margin: textPos === 'center' ? '0 auto 28px' : '188px auto 24px',
          position: 'relative',
          zIndex: 2,
          ...frameClipStyle(theme.frameShape),
          border: `10px solid ${theme.accent}`,
          boxShadow: `0 18px 40px rgba(0,0,0,0.25), 0 0 0 8px ${theme.accentSoft}`,
          background: theme.panel,
          overflow: 'hidden',
          cursor: draggable && photo ? 'grab' : 'default',
          flexShrink: 0,
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            draggable={false}
            style={{
              width: '140%',
              height: '140%',
              objectFit: 'cover',
              position: 'absolute',
              top: `calc(50% + ${photoPos.y}px - 70%)`,
              left: `calc(50% + ${photoPos.x}px - 70%)`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: theme.display,
              fontSize: 110,
              fontWeight: 800,
              color: theme.accent,
              background: theme.accentSoft,
            }}
          >
            {getInitials(name)}
          </div>
        )}
        <Cake3D size={70} accent={theme.accent} accent2={theme.accent2} style={{ position: 'absolute', bottom: -6, right: -6 }} />
      </div>

      {/* text block */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '0 70px',
          textAlign: 'center',
          marginBottom: textPos === 'bottom' ? 56 : 0,
          marginTop: textPos === 'top' ? 12 : 0,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 30,
            color: theme.sub,
            marginBottom: 4,
            ...((fontStyle === 'bold') ? { letterSpacing: '0.15em' } : {}),
          }}
        >
          HAPPY BIRTHDAY
        </div>
        <div
          style={{
            fontFamily: theme.display,
            fontSize: 66,
            color: theme.text,
            lineHeight: 1.08,
            ...titleFont,
            wordBreak: 'break-word',
          }}
        >
          {name || 'Student Name'}
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: theme.body,
            fontSize: 21,
            color: theme.sub,
            lineHeight: 1.55,
            maxWidth: 760,
            marginInline: 'auto',
          }}
        >
          {note}
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: theme.body,
            fontSize: 16,
            fontWeight: 600,
            color: theme.accent,
            letterSpacing: '0.04em',
          }}
        >
          — WITH LOVE, YOUR SCHOOL FAMILY —
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Scaled preview wrapper ──────────────────────── */

function ScaledPoster({ poster, ...canvasProps }) {
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setScale(el.offsetWidth / POSTER_SIZE);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full aspect-square rounded-2xl overflow-hidden relative shadow-lg">
      <div style={{ width: POSTER_SIZE, height: POSTER_SIZE, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <PosterCanvas {...canvasProps} />
      </div>
    </div>
  );
}

/* ───────────────────────────── Main Component ───────────────────────────── */

export default function PosterStudio({ birthdays = [], onToast }) {
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [note, setNote] = useState(NOTE_PRESETS[0]);
  const [fontStyle, setFontStyle] = useState('display');
  const [textPos, setTextPos] = useState('bottom');
  const [photos, setPhotos] = useState([]); // array of dataURLs
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [photoPos, setPhotoPos] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const [step, setStep] = useState(1);

  const fileInputRef = useRef(null);
  const singleCanvasRef = useRef(null);

  const theme = useMemo(() => THEMES.find((t) => t.id === themeId) || THEMES[0], [themeId]);

  const toast = (msg, type = 'success') => onToast?.(msg, type);

  const handleSelectPerson = (id) => {
    setSelectedPersonId(id);
    const person = birthdays.find((p) => String(p.id) === String(id));
    if (person) {
      setName(person.name || '');
      setPhone(person.phone || '');
      if (person.photo) {
        setPhotos([person.photo]);
        setActivePhotoIdx(0);
      }
    }
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    try {
      const urls = await Promise.all(files.map(fileToDataURL));
      setPhotos((prev) => [...prev, ...urls]);
      if (photos.length === 0) {
        setActivePhotoIdx(0);
        setPhotoPos({ x: 0, y: 0 });
      }
      toast(`${urls.length} photo${urls.length > 1 ? 's' : ''} added`);
    } catch {
      toast('Could not read the selected image', 'error');
    }
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setActivePhotoIdx(0);
  };

  const downloadNode = async (node, filename) => {
    const canvas = await html2canvas(node, { backgroundColor: null, scale: 1, useCORS: true });
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleDownloadSingle = async () => {
    if (!singleCanvasRef.current) return;
    setDownloading(true);
    try {
      await downloadNode(singleCanvasRef.current, `${(name || 'birthday-poster').replace(/\s+/g, '-')}.png`);
      toast('Poster downloaded 🎉');
    } catch {
      toast('Download failed, please try again', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const shareNode = async (node) => {
    try {
      const canvas = await html2canvas(node, { backgroundColor: null, scale: 1, useCORS: true });
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      const file = new File([blob], `${name || 'poster'}.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Happy Birthday ${name}`, text: buildWhatsAppText(name) });
        return;
      }
    } catch {
      /* fall through to text-only share */
    }
    const text = encodeURIComponent(buildWhatsAppText(name));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    toast('Poster image saved as download — attach it in WhatsApp', 'success');
    await downloadNode(node, `${(name || 'poster').replace(/\s+/g, '-')}.png`);
  };

  const handleShareWhatsApp = () => shareNode(singleCanvasRef.current);

  const handleShareParent = () => {
    if (!phone) {
      toast('No parent/student mobile number on file', 'error');
      return;
    }
    let formatted = phone.replace(/\D/g, '');
    if (!formatted.startsWith('91')) formatted = '91' + formatted;
    const text = encodeURIComponent(buildWhatsAppText(name));
    window.open(`https://wa.me/${formatted}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareAdmin = () => {
    const text = encodeURIComponent(`${buildWhatsAppText(name)}\n\n(Poster generated in Poster Studio — please find the attached download)`);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const resetAll = () => {
    setSelectedPersonId('');
    setName('');
    setPhone('');
    setPhotos([]);
    setPhotoPos({ x: 0, y: 0 });
    setNote(NOTE_PRESETS[0]);
    setStep(1);
  };

  const activePhoto = photos[activePhotoIdx] || null;
  const collagePhotos = photos.filter((_, i) => i !== activePhotoIdx);

  return (
    <div className="space-y-5">
      {/* Step nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { n: 1, label: 'Pick Student' },
          { n: 2, label: 'Theme & Photo' },
          { n: 3, label: 'Message' },
          { n: 4, label: 'Preview & Share' },
        ].map((s, idx, arr) => (
          <div key={s.n} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                ${step === s.n
                  ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-md'
                  : step > s.n
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
            >
              {step > s.n ? <Check size={12} /> : <span>{s.n}</span>}
              {s.label}
            </button>
            {idx < arr.length - 1 && <ChevronRight size={14} className="text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ───────── Controls ───────── */}
        <div className="order-2 lg:order-1 w-full lg:w-[420px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-5 h-fit lg:sticky lg:top-5">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Sparkles size={15} className="text-rose-500" /> Pick a birthday student
              </h3>
              {birthdays.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                  {birthdays.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPerson(p.id)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all
                        ${String(selectedPersonId) === String(p.id)
                          ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100'
                          : 'border-slate-200 hover:border-rose-200 hover:bg-rose-50/40'}`}
                    >
                      <div className="font-semibold text-slate-700 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {p.daysRemaining === 0 ? 'Today 🎂' : `In ${p.daysRemaining} day${p.daysRemaining > 1 ? 's' : ''}`}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No upcoming birthdays loaded — you can still type a name manually below.</p>
              )}

              <div>
                <label className="text-xs font-medium text-slate-500">Or type a name manually</label>
                <input
                  value={name}
                  onChange={(e) => { setName(e.target.value); setSelectedPersonId(''); }}
                  placeholder="Student name"
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2.5">
                  <Palette size={15} className="text-rose-500" /> Choose a theme
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeId(t.id)}
                      className={`relative h-16 rounded-xl overflow-hidden border-2 transition-all
                        ${themeId === t.id ? 'border-rose-500 scale-[1.03]' : 'border-transparent hover:scale-[1.02]'}`}
                      style={{ background: t.bg }}
                      title={t.name}
                    >
                      {themeId === t.id && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <Check size={10} className="text-rose-500" />
                        </span>
                      )}
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-semibold drop-shadow" style={{ color: t.text }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <ImageIcon size={15} className="text-rose-500" /> Photo
                  </h3>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-1.5 py-5 rounded-xl border-2 border-dashed border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-all text-slate-400 hover:text-rose-500"
                >
                  <Upload size={20} />
                  <span className="text-xs font-medium">
                    Upload a main photo + optional extras for a collage
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />

                {photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {photos.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => setActivePhotoIdx(i)}
                        className={`relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer border-2 ${activePhotoIdx === i ? 'border-rose-500' : 'border-transparent'}`}
                        title={activePhotoIdx === i ? 'Main photo' : 'Click to make this the main photo'}
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                        {activePhotoIdx === i && (
                          <span className="absolute bottom-0 inset-x-0 bg-rose-500 text-white text-[8px] text-center font-semibold">MAIN</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center"
                        >
                          <X size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photos.length > 1 && (
                  <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                    <GalleryHorizontal size={11} /> Extra photos appear as a collage strip automatically, all in the same poster.
                  </p>
                )}

                {activePhoto && (
                  <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                    <Move size={10} /> Drag the main photo inside the poster preview to reposition it
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500"><ChevronLeft size={13} /> Back</button>
                <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-sm font-semibold">Continue</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Type size={15} className="text-rose-500" /> Message & style
              </h3>

              <div>
                <label className="text-xs font-medium text-slate-500">Name on poster</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 resize-none"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {NOTE_PRESETS.map((n, i) => (
                    <button key={i} onClick={() => setNote(n)} className="text-[10px] px-2 py-1 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors">
                      Preset {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Text style</label>
                <div className="grid grid-cols-3 gap-2">
                  {FONT_STYLES.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFontStyle(f.id)}
                      className={`py-1.5 rounded-lg text-[11px] font-medium border ${fontStyle === f.id ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-500'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">Text position</label>
                <div className="grid grid-cols-3 gap-2">
                  {TEXT_POSITIONS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setTextPos(p.id)}
                      className={`py-1.5 rounded-lg text-[11px] font-medium border ${textPos === p.id ? 'border-rose-400 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-500'}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-500"><ChevronLeft size={13} /> Back</button>
                <button onClick={() => setStep(4)} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white text-sm font-semibold">Preview poster</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Layers size={15} className="text-rose-500" /> Download & share
              </h3>

              <div className="space-y-2.5">
                <button
                  onClick={handleDownloadSingle}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-sm font-semibold disabled:opacity-60"
                  >
                    {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Download Poster (PNG)
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold"
                  >
                    <Share2 size={15} /> Share via WhatsApp
                  </button>
                  <button
                    onClick={handleShareParent}
                    disabled={!phone}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold disabled:opacity-40"
                  >
                    <Smartphone size={15} /> Send to Parent / Student
                  </button>
                  <button
                    onClick={handleShareAdmin}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold"
                  >
                    <MessageCircle size={15} /> Send to Admin (+91 84229-99199)
                  </button>
                </div>

              <button onClick={resetAll} className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-slate-400 hover:text-rose-500 transition-colors">
                <RotateCcw size={12} /> Start over
              </button>
            </div>
          )}
        </div>

        {/* ───────── Live preview ───────── */}
        <div className="order-1 lg:order-2 flex-1 min-w-0 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-100 p-4 sm:p-6 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            <ScaledPoster
              canvasRef={singleCanvasRef}
              theme={theme}
              name={name}
              note={note}
              photo={activePhoto}
              photoPos={photoPos}
              onPhotoPosChange={setPhotoPos}
              fontStyle={fontStyle}
              textPos={textPos}
              draggable
              collage={collagePhotos}
            />
            <p className="text-center text-[11px] text-slate-400 mt-3">Square poster · ready for Instagram, WhatsApp Status & print</p>
          </div>
        </div>
      </div>
    </div>
  );
}
