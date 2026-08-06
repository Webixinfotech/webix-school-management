import { useState, useEffect, useContext, useRef } from 'react';
import AuthContext from '../../context/AuthContext';
import {
  Camera, CheckCircle2, Clock, UserCheck, Calendar,
  History, BarChart3, AlertCircle, RefreshCw,
  ChevronLeft, ChevronRight, Download, XCircle, Timer,
  Umbrella, UserMinus, CalendarDays, Zap, Shield, Star,
  QrCode
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import api from '../../api/axios';
import {
  getQRCode, formatTime, formatDate, formatHours, getStatusConfig,
  speak, speakSuccess, speakVerify, speakAlreadyMarked, speakFailed
} from '../../api/staffAttendance';

// ─── Global Styles ────────────────────────────────────────────────────────────

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --blue-50: #eff6ff;
    --blue-100: #dbeafe;
    --blue-200: #bfdbfe;
    --blue-400: #60a5fa;
    --blue-500: #3b82f6;
    --blue-600: #2563eb;
    --blue-700: #1d4ed8;
    --violet-500: #8b5cf6;
    --violet-600: #7c3aed;
    --emerald-500: #10b981;
    --emerald-600: #059669;
    --amber-500: #f59e0b;
    --rose-500: #ef4444;
    --rose-600: #dc2626;
    --slate-50: #f8fafc;
    --slate-100: #f1f5f9;
    --slate-200: #e2e8f0;
    --slate-300: #cbd5e1;
    --slate-400: #94a3b8;
    --slate-500: #64748b;
    --slate-600: #475569;
    --slate-700: #334155;
    --slate-800: #1e293b;
    --slate-900: #0f172a;
  }

  .att-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    background: #f0f4ff;
    color: var(--slate-900);
    position: relative;
    overflow-x: hidden;
  }

  /* Background pattern */
  .att-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 20% -10%, rgba(59,130,246,0.12) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 85% 90%, rgba(139,92,246,0.10) 0%, transparent 55%),
      radial-gradient(ellipse 50% 30% at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .att-wrap {
    position: relative;
    z-index: 1;
    max-width: 920px;
    margin: 0 auto;
    padding: 20px 16px 40px;
    width: 100%;
  }

  /* ── Cards ── */
  .glass-card {
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.9);
    box-shadow:
      0 2px 4px rgba(15,23,42,0.04),
      0 8px 24px rgba(15,23,42,0.07),
      0 1px 0 rgba(255,255,255,1) inset;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 4px 8px rgba(15,23,42,0.05),
      0 16px 40px rgba(15,23,42,0.10),
      0 1px 0 rgba(255,255,255,1) inset;
  }

  .stat-card {
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.9);
    padding: 18px 16px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4px 16px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,1) inset;
    cursor: default;
  }
  .stat-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
  }
  .stat-card:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 20px 48px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,1) inset;
  }

  /* ── Icon Box ── */
  .icon-box {
    width: 48px; height: 48px;
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 14px rgba(0,0,0,0.18), 0 1px 0 rgba(255,255,255,0.35) inset;
  }
  .icon-box::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(145deg, rgba(255,255,255,0.25) 0%, transparent 55%);
  }

  /* ── Tabs ── */
  .tab-bar {
    display: flex;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 18px;
    padding: 5px;
    gap: 4px;
    box-shadow: 0 2px 12px rgba(15,23,42,0.07);
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 20px;
  }
  .tab-bar::-webkit-scrollbar { display: none; }

  .tab-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px;
    font-size: 13px; font-weight: 700;
    border: none; cursor: pointer;
    border-radius: 13px;
    transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: var(--slate-500);
    background: transparent;
    position: relative;
    flex: 1 1 auto;
    justify-content: center;
  }
  .tab-btn:hover { color: var(--slate-800); background: rgba(241,245,249,0.8); }
  .tab-btn.active {
    color: white;
    background: linear-gradient(135deg, var(--blue-600), var(--violet-600));
    box-shadow: 0 4px 16px rgba(37,99,235,0.35), 0 1px 0 rgba(255,255,255,0.2) inset;
  }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 13px 24px;
    border-radius: 14px; font-weight: 800; font-size: 14px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; border: none;
    background: linear-gradient(135deg, var(--blue-600), var(--violet-600));
    color: white;
    box-shadow: 0 4px 20px rgba(37,99,235,0.38), 0 1px 0 rgba(255,255,255,0.2) inset;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    width: 100%;
    letter-spacing: -0.01em;
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(37,99,235,0.45);
  }
  .btn-primary:active:not(:disabled) { transform: translateY(0); }
  .btn-primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: linear-gradient(135deg, var(--slate-400), var(--slate-500));
    box-shadow: none;
  }

  .btn-secondary {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 20px; border-radius: 13px; font-weight: 700; font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer;
    border: 1.5px solid var(--slate-200);
    background: white; color: var(--slate-600);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: all 0.2s; width: 100%;
  }
  .btn-secondary:hover { background: var(--slate-50); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,0.08); }

  .btn-danger {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    padding: 11px 20px; border-radius: 13px; font-weight: 700; font-size: 13px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    cursor: pointer; border: 1.5px solid #fecaca;
    background: #fff1f2; color: var(--rose-600);
    box-shadow: 0 2px 8px rgba(239,68,68,0.08);
    transition: all 0.2s; width: 100%;
  }
  .btn-danger:hover { background: #ffe4e6; transform: translateY(-1px); }

  /* ── Scanner ── */
  .scanner-wrap {
    border-radius: 20px; overflow: hidden;
    background: #0a0f1e;
    position: relative;
    box-shadow: 0 8px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(59,130,246,0.2);
  }
  .scanner-corners {
    position: absolute; inset: 0; pointer-events: none; z-index: 10;
  }
  .scanner-corners::before,
  .scanner-corners::after {
    content: '';
    position: absolute;
    width: 32px; height: 32px;
    border-color: #3b82f6;
    border-style: solid;
  }
  .scanner-corners::before { top: 20px; left: 20px; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
  .scanner-corners::after  { bottom: 20px; right: 20px; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }

  .scan-line {
    position: absolute; left: 16px; right: 16px; height: 2px;
    background: linear-gradient(90deg, transparent, rgba(59,130,246,0.7), #60a5fa, rgba(99,179,237,1), #60a5fa, rgba(59,130,246,0.7), transparent);
    box-shadow: 0 0 16px rgba(59,130,246,0.9), 0 0 32px rgba(59,130,246,0.4);
    z-index: 20;
    animation: scanLine 2.8s ease-in-out infinite;
  }

  /* ── Input ── */
  .att-input {
    width: 100%; padding: 11px 14px;
    border-radius: 12px; border: 1.5px solid var(--slate-200);
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px;
    color: var(--slate-800); background: var(--slate-50); outline: none;
    transition: all 0.2s;
  }
  .att-input:focus {
    border-color: var(--blue-500); background: white;
    box-shadow: 0 0 0 4px rgba(59,130,246,0.10);
  }

  /* ── Table ── */
  .att-table { width: 100%; border-collapse: collapse; min-width: 560px; }
  .att-table th {
    padding: 13px 16px; text-align: left;
    font-size: 10.5px; font-weight: 800;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: var(--slate-400); background: var(--slate-50);
    border-bottom: 1px solid var(--slate-100);
  }
  .att-table td {
    padding: 13px 16px; font-size: 13px; color: var(--slate-600);
    border-bottom: 1px solid var(--slate-100);
  }
  .att-table tr:hover td { background: #f8faff; }
  .att-table tr:last-child td { border-bottom: none; }

  /* ── Status Badge ── */
  .status-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 11px; border-radius: 999px;
    font-size: 11px; font-weight: 800; border: 1.5px solid;
    letter-spacing: 0.01em;
  }
  .status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    animation: glowPulse 2s ease-in-out infinite;
  }

  /* ── Toast ── */
  .toast {
    position: fixed; bottom: 28px; right: 24px; z-index: 9999;
    padding: 14px 20px; border-radius: 18px;
    font-size: 13px; font-weight: 700;
    display: flex; align-items: center; gap: 11px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.22);
    animation: toastIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    font-family: 'Plus Jakarta Sans', sans-serif; max-width: 360px;
    border: 1px solid rgba(255,255,255,0.2);
  }

  /* ── Mono ── */
  .mono { font-family: 'IBM Plex Mono', monospace; }

  /* ── Gradient text ── */
  .grad-text {
    background: linear-gradient(135deg, var(--blue-600), var(--violet-600));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Cooldown bar ── */
  .cooldown-bar {
    height: 4px; border-radius: 999px;
    background: linear-gradient(90deg, var(--blue-500), var(--violet-500));
    transition: width 1s linear;
  }

  /* ── Keyframes ── */
  @keyframes scanLine {
    0%   { top: 18%; }
    50%  { top: 80%; }
    100% { top: 18%; }
  }
  @keyframes glowPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(20px) scale(0.95); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bounceIn {
    0%   { transform: scale(0.4) rotate(-8deg); opacity: 0; }
    65%  { transform: scale(1.06) rotate(1deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); }
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes ringPulse {
    0%   { transform: scale(0.9); opacity: 0.8; }
    100% { transform: scale(1.6); opacity: 0; }
  }
  @keyframes checkSuccess {
    0%   { transform: scale(0) rotate(-15deg); }
    60%  { transform: scale(1.15) rotate(3deg); }
    100% { transform: scale(1) rotate(0deg); }
  }

  .anim-slide-up  { animation: fadeSlideUp 0.4s ease both; }
  .anim-bounce-in { animation: bounceIn 0.55s cubic-bezier(0.34,1.56,0.64,1) both; }
  .anim-float     { animation: float 3.5s ease-in-out infinite; }
  .anim-spin      { animation: spin 1s linear infinite; }

  /* ── QR display ── */
  .qr-container {
    background: white;
    border-radius: 20px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    border: 2px solid var(--blue-100);
    box-shadow: 0 8px 32px rgba(59,130,246,0.12);
  }
  .qr-img-wrap {
    width: 180px; height: 180px;
    border-radius: 16px; overflow: hidden;
    border: 3px solid var(--blue-200);
    position: relative;
    background: var(--slate-50);
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Grids ── */
  .scanner-grid {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 16px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
  }
  .time-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 10px;
  }

  /* ── Divider ── */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--slate-200), transparent);
    margin: 12px 0;
  }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .scanner-grid { grid-template-columns: 1fr; }
    .tab-btn { padding: 9px 13px; font-size: 12px; }
    .tab-btn .tab-label { display: none; }
    .glass-card { border-radius: 18px; }
  }

  @media (max-width: 600px) {
    .att-table { min-width: 480px; }
  }

  @media (max-width: 480px) {
    .att-wrap { padding: 12px 10px 32px; }
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .time-grid { grid-template-columns: repeat(2, 1fr); }
    .stat-card { padding: 14px 12px; border-radius: 16px; }
    .icon-box { width: 40px; height: 40px; border-radius: 12px; }
    .qr-img-wrap { width: 140px; height: 140px; }
    .qr-container { padding: 16px; }
    .toast { left: 16px; right: 16px; bottom: 16px; max-width: none; }
    .btn-primary, .btn-secondary, .btn-danger { padding: 11px 16px; font-size: 12.5px; }
  }

  @media (max-width: 380px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .time-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: var(--slate-100); border-radius: 999px; }
  ::-webkit-scrollbar-thumb { background: var(--slate-300); border-radius: 999px; }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StyleTag = () => <style dangerouslySetInnerHTML={{ __html: globalStyles }} />;

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = {
    success: { bg: 'linear-gradient(135deg,#059669,#10b981)', icon: <CheckCircle2 size={18} /> },
    error:   { bg: 'linear-gradient(135deg,#dc2626,#ef4444)', icon: <XCircle size={18} /> },
    warning: { bg: 'linear-gradient(135deg,#d97706,#f59e0b)', icon: <AlertCircle size={18} /> },
    info:    { bg: 'linear-gradient(135deg,#2563eb,#7c3aed)', icon: <Zap size={18} /> },
  }[type] || { bg: 'linear-gradient(135deg,#2563eb,#7c3aed)', icon: <Zap size={18} /> };

  return (
    <div className="toast" style={{ background: cfg.bg, color: 'white' }}>
      {cfg.icon}
      <span style={{ flex: 1, lineHeight: 1.4 }}>{message}</span>
      <button onClick={onClose} style={{ opacity: 0.7, background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <XCircle size={16} />
      </button>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = getStatusConfig(status);
  return (
    <span className={`status-badge ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`status-dot ${cfg.dot}`} />
      {status}
    </span>
  );
};

const IconBox = ({ icon: Icon, bg, color = 'white' }) => (
  <div className="icon-box" style={{ background: bg }}>
    <Icon size={22} color={color} style={{ position: 'relative', zIndex: 1 }} />
  </div>
);

const StatCard = ({ icon: Icon, label, value, color, bg, iconBg }) => (
  <div className="stat-card" style={{ background: bg }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 5 }}>{label}</p>
        <p style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value ?? 0}</p>
      </div>
      <IconBox icon={Icon} bg={iconBg} />
    </div>
  </div>
);

const TimeBlock = ({ label, value, color, bg, border }) => (
  <div style={{ background: bg, borderRadius: 16, padding: '13px 15px', border: `1.5px solid ${border}` }}>
    <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 5 }}>{label}</p>
    <p className="mono" style={{ fontSize: 19, fontWeight: 800, color, wordBreak: 'break-word' }}>{value}</p>
  </div>
);

// Compares a check-in timestamp against the teacher's fixed-shift entry
// time. For the teacher's OWN panel we do NOT apply any grace
// period — if they're even 1 minute after the scheduled entry time
// they're late (applyGrace = false). Falls back to the backend-flagged
// late values when no shift timing is available locally. The backend's
// own `lateByMinutes` is unreliable (it returns 0 even for
// clearly-late check-ins), so we prefer this client-side calc sourced
// from the `/teachers/my-profile` timing.
const computeLateMinutes = (checkInTime, fixedShift, fallback, applyGrace = true) => {
  if (!checkInTime) return null;
  const fallbackLate = (fallback?.isLate || fallback?.status === 'Late')
    ? (fallback?.lateByMinutes || 0)
    : null;
  if (!fixedShift?.entryTime) {
    return fallbackLate != null
      ? { isLate: fallbackLate > 0, lateByMinutes: fallbackLate, scheduledEntry: null, gracePeriodMinutes: null }
      : null;
  }
  const [eh, em] = String(fixedShift.entryTime).split(':').map(v => parseInt(v, 10));
  if (Number.isNaN(eh) || Number.isNaN(em)) return null;
  const grace = applyGrace ? Number(fixedShift?.gracePeriodMinutes ?? 0) : 0;
  const d = new Date(checkInTime);
  if (Number.isNaN(d.getTime())) return null;
  const expected = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0);
  const diff = Math.round((d.getTime() - expected.getTime()) / 60000);
  const lateBy = Math.max(0, diff - grace);
  return { isLate: lateBy > 0, lateByMinutes: lateBy, scheduledEntry: fixedShift.entryTime, gracePeriodMinutes: grace };
};

// Formats a late duration (in minutes) as "Xh Ym" so the
// teacher sees both hours and minutes, e.g. 77 -> "1h 17m".
const fmtLateDuration = (mins) => {
  const m = Number(mins) || 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
};

const LoaderCenter = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 180 }}>
    <div style={{ position: 'relative' }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #dbeafe', borderTopColor: '#2563eb', animation: 'spin 0.9s linear infinite' }} />
      <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '2px solid #ede9fe', borderTopColor: '#7c3aed', animation: 'spin 0.7s linear infinite reverse' }} />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherStaffAttendancePage = () => {
  const auth = useContext(AuthContext);

  const [todayStatus, setTodayStatus]     = useState(null);
  const [todayLoading, setTodayLoading]   = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [showScanner, setShowScanner]     = useState(false);
  const [isScanning, setIsScanning]       = useState(false);
  const [cameraError, setCameraError]     = useState('');
  const [, setScanDone]                   = useState(false); // camera closed after success
  const [qrData, setQrData]               = useState(null);
  const [qrRemainingTime, setQrRemainingTime] = useState(0);
  const [qrPermission, setQrPermission]   = useState(null); // null=loading, true/false
  const [scanResult, setScanResult]       = useState(null);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage]     = useState(1);
  const [historyTotal, setHistoryTotal]   = useState(0);
  const [historyPages, setHistoryPages]   = useState(1);
  const [histStartDate, setHistStartDate] = useState('');
  const [histEndDate, setHistEndDate]     = useState('');
  const [summary, setSummary]             = useState(null);
  const [statsLoading, setStatsLoading]   = useState(false);
  const [activeTab, setActiveTab]         = useState('today');
  const [toast, setToast]                 = useState(null);
  const [cooldownLeft, setCooldownLeft]   = useState(0); // seconds remaining

  const scannerRef    = useRef(null);
  const isScanningRef   = useRef(false);
  const teacherIdRef  = useRef(null);
  const qrTimeoutRef  = useRef(null);
  const qrIntervalRef = useRef(null);
  const cooldownTimer = useRef(null);
  const HISTORY_LIMIT = 15;

  // ─── Cooldown check on mount ────────────────────────────────────────────────
  useEffect(() => {
    checkCooldown();
    fetchTeacherProfile();
    fetchTodayStatus();
    return () => { // eslint-disable-line
      stopCamera();
      clearInterval(cooldownTimer.current);
    };
  }, []);

  const checkCooldown = () => {
    const lastScan = localStorage.getItem('staff_last_scan_time');
    if (!lastScan) return;
    const diff = Date.now() - parseInt(lastScan, 10);
    const COOLDOWN = 5 * 60 * 1000;
    if (diff < COOLDOWN) {
      const secs = Math.ceil((COOLDOWN - diff) / 1000);
      setCooldownLeft(secs);
      startCooldownTimer(secs);
    }
  };

  const startCooldownTimer = (secs) => {
    clearInterval(cooldownTimer.current);
    let remaining = secs;
    cooldownTimer.current = setInterval(() => {
      remaining -= 1;
      setCooldownLeft(remaining);
      if (remaining <= 0) {
        clearInterval(cooldownTimer.current);
        setCooldownLeft(0);
      }
    }, 1000);
  };

  // ─── Tab effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'scanner') {
      checkQRPermission();
      refreshQRCode();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, historyPage, histStartDate, histEndDate]);

  useEffect(() => {
    if (activeTab === 'stats') fetchSummary();
  }, [activeTab]);

  // ─── QR Timer ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!qrData) return;
    const generatedAt  = new Date(qrData.generatedAt).getTime();
    const expiresInMs  = qrData.expiresIn * 1000;
    const expiresAt    = generatedAt + expiresInMs;
    const initialMs    = Math.max(0, expiresAt - Date.now());
    setQrRemainingTime(Math.ceil(initialMs / 1000));
    clearTimeout(qrTimeoutRef.current);
    clearInterval(qrIntervalRef.current);
    qrTimeoutRef.current = setTimeout(() => refreshQRCode(), initialMs);
    qrIntervalRef.current = setInterval(() => {
      const rem = Math.max(0, expiresAt - Date.now());
      setQrRemainingTime(Math.ceil(rem / 1000));
    }, 1000);
    return () => { clearTimeout(qrTimeoutRef.current); clearInterval(qrIntervalRef.current); };
  }, [qrData]);

  // ─── API helpers ───────────────────────────────────────────────────────────
  const getLocalDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  };

  const resolveTeacherId = async () => {
    if (teacherIdRef.current) return teacherIdRef.current;
    try {
      const res = await api.get('/teachers/my-profile');
      const id  = res.data?.data?._id || res.data?.data?.id;
      if (id) { teacherIdRef.current = id; return id; }
    } catch {}
    const fallback = auth.user?.teacherId || auth.user?.profileId || auth.user?._id || auth.user?.id;
    teacherIdRef.current = fallback;
    return fallback;
  };

  const fetchTeacherProfile = async () => {
    try {
      const res = await api.get('/teachers/my-profile');
      const profile = res.data?.data || res.data;
      setTeacherProfile(profile);
    } catch (err) {
      console.error('[Attendance] fetchTeacherProfile:', err);
      setTeacherProfile(null);
    }
  };

  // Fixed-shift scheduling (and its grace period) only applies to FIXED_TIME
  // employees. FIXED_HOURS staff have no scheduled entry time, so ignore any
  // fixedShift data on their profile even if it's left over from before they
  // were switched to FIXED_HOURS.
  const profileFixedShift = teacherProfile?.employeeType === 'FIXED_TIME'
    ? teacherProfile?.fixedShift
    : null;

  // Teacher's own panel: NO grace — late is measured strictly
  // against the scheduled entry time (1 min late = late).
  const compareCheckInToProfile = (checkInTime, record) => {
    if (!checkInTime) return null;
    return computeLateMinutes(checkInTime, profileFixedShift, record, false);
  };

  const enrichAttendanceWithProfileTiming = (record) => {
    if (!record) return record;
    const timing = record.checkInTime
      ? computeLateMinutes(record.checkInTime, profileFixedShift, record, false)
      : null;
    return timing ? { ...record, ...timing } : record;
  };

  useEffect(() => {
    if (teacherProfile && todayStatus?.checkInTime) {
      setTodayStatus(prev => prev ? enrichAttendanceWithProfileTiming(prev) : prev);
    }
  }, [teacherProfile, todayStatus?.checkInTime]);

  // ─── QR Permission check ───────────────────────────────────────────────────
  // This checks if teacher has permission to generate QR for others.
  // If API returns 403/permission error → qrPermission = false, don't show QR panel.
  // If API success → qrPermission = true.
  const checkQRPermission = async () => {
    setQrPermission(null);
    try {
      const res = await api.get('/employee-attendance/qr');
      if (res.data) {
        setQrPermission(true);
        setQrData(res.data?.data || res.data);
      } else {
        setQrPermission(false);
      }
    } catch (err) {
      // 403 = forbidden / no permission; silently hide
      // Other errors = treat as no permission too (don't show error to user)
      setQrPermission(false);
    }
  };

  const fetchTodayStatus = async () => {
    setTodayLoading(true);
    try {
      const today     = getLocalDate();
      const teacherId = await resolveTeacherId();
      if (!teacherId) return;
      const res = await api.get(`/employee-attendance/${teacherId}/history`, {
        params: { startDate: today, endDate: today, page: 1, limit: 10 }
      });
      const records     = res.data?.data || [];
      const todayRecord = records.find(r => r.attendanceDate === today) || records[0] || null;
      setTodayStatus(enrichAttendanceWithProfileTiming(todayRecord));
    } catch (err) {
      console.error('[Attendance] fetchTodayStatus:', err);
    } finally {
      setTodayLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const teacherId = await resolveTeacherId();
      if (!teacherId) return;
      const params = { page: historyPage, limit: HISTORY_LIMIT };
      if (histStartDate) params.startDate = histStartDate;
      if (histEndDate)   params.endDate   = histEndDate;
      const res = await api.get(`/employee-attendance/${teacherId}/history`, { params });
      if (res.data) {
        setHistoryRecords(res.data.data || []);
        setHistoryTotal(res.data.total || 0);
        setHistoryPages(res.data.pages || 1);
        if (res.data.monthlySummary) setSummary(res.data.monthlySummary);
      }
    } catch (err) { showToast(err?.response?.data?.message || 'History load failed', 'error'); }
    finally { setHistoryLoading(false); }
  };

  const fetchSummary = async () => {
    setStatsLoading(true);
    try {
      const teacherId = await resolveTeacherId();
      if (!teacherId) return;
      const now   = new Date();
      const y     = now.getFullYear();
      const m     = String(now.getMonth()+1).padStart(2,'0');
      const last  = new Date(y, now.getMonth()+1, 0).getDate();
      const res   = await api.get(`/employee-attendance/${teacherId}/history`, {
        params: { limit: 1, startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${String(last).padStart(2,'0')}` }
      });
      if (res.data?.monthlySummary) setSummary(res.data.monthlySummary);
    } catch (err) { showToast(err?.response?.data?.message || 'Stats load failed', 'error'); }
    finally { setStatsLoading(false); }
  };

  const getCurrentLocation = () =>
    new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

  const refreshQRCode = async () => {
    try {
      const res = await getQRCode();
      if (res?.data) setQrData(res.data);
    } catch {}
  };

  // ─── Camera ────────────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError('');
    setScanResult(null);
    setScanDone(false);
    await new Promise(r => setTimeout(r, 200));
    const readerEl = document.getElementById('reader');
    if (!readerEl) { setCameraError('Scanner element not found. Please refresh.'); return; }
    try {
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;
      const cfg = { fps: 10, qrbox: { width: 230, height: 230 }, aspectRatio: 1 };
      try {
        await html5QrCode.start({ facingMode: 'environment' }, cfg, handleQRScan, () => {});
      } catch {
        await html5QrCode.start({ facingMode: 'user' }, cfg, handleQRScan, () => {});
      }
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('Permission') || msg.includes('NotAllowed'))
        setCameraError('Camera permission denied. Allow camera access in browser settings and try again.');
      else if (msg.includes('NotFound') || msg.includes('DevicesNotFound'))
        setCameraError('No camera found on this device.');
      else
        setCameraError('Could not start camera. Please check browser settings.');
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState?.();
        if (state === 2 || state === 3) await scannerRef.current.stop();
        scannerRef.current = null;
      } catch { scannerRef.current = null; }
    }
  };

  const handleQRScan = async (decodedText) => {
    if (isScanningRef.current) return;

    // Cooldown check
    const lastScan = localStorage.getItem('staff_last_scan_time');
    if (lastScan) {
      const diff = Date.now() - parseInt(lastScan, 10);
      if (diff < 5 * 60 * 1000) {
        isScanningRef.current = true;
        const minsLeft = Math.ceil((5 * 60 * 1000 - diff) / 60000);
        showToast(`Please wait ${minsLeft} min(s) before scanning again.`, 'warning');
        setTimeout(() => { isScanningRef.current = false; }, 4000);
        return;
      }
    }

    // QR expiry check
    if (qrData) {
      const expiresAt = new Date(qrData.generatedAt).getTime() + (qrData.expiresIn || 60) * 1000;
      if (Date.now() > expiresAt) {
        speak('QR code has expired. Please refresh.');
        showToast('QR expired — refreshing…', 'warning');
        refreshQRCode();
        return;
      }
    }

    isScanningRef.current = true;
    setIsScanning(true); // For UI feedback

    try {
      const token    = decodedText.includes(':') ? decodedText.split(':')[1] : decodedText;
      const location = await getCurrentLocation() || { lat: null, lng: null };
      const response = await api.post('/employee-attendance/scan', { token, location });

      if (response.data?.success) {
        // Save cooldown timestamp
        localStorage.setItem('staff_last_scan_time', Date.now().toString());
        const data = response.data.data;
        const comparison = compareCheckInToProfile(data?.checkInTime);
        setScanResult({ ...data, ...comparison, message: response.data.message });

        const userName = auth.user?.name || '';
        if (data?.action === 'already_marked') speakAlreadyMarked(userName);
        else if (data?.action === 'checked_out') speakVerify(userName);
        else speakSuccess(userName);

        if (data?.action === 'already_marked') {
          showToast(response.data.message || 'Attendance already marked for today.', 'info');
        } else if (data?.action === 'checked_in' && comparison?.isLate) {
          showToast(`Late by ${comparison.lateByMinutes} minute(s).`, 'warning');
        } else {
          showToast(response.data.message || 'Attendance recorded!', 'success');
        }

        // ✅ KEY: stop camera immediately after successful scan, then start cooldown
        setScanDone(true);
        await stopCamera();
        setShowScanner(false);
        startCooldownTimer(300); // 5 minutes
        setCooldownLeft(300);

        // Refresh today status
        setTimeout(() => fetchTodayStatus(), 1200);

        // After voice completes (~3s), navigate to today tab
        setTimeout(() => {
          setActiveTab('today');
          isScanningRef.current = false;
        }, 3000);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.response?.data?.message || 'Scan failed. Please try again.';
      if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('expired')) {
        speakFailed('Invalid or expired QR code. Please refresh and try again.');
      } else {
        speakFailed();
      }
      showToast(errorMsg, 'error');
      setTimeout(() => { isScanningRef.current = false; }, 3000);
    } finally {
      setIsScanning(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const showToast = (message, type = 'info') => setToast({ message, type, id: Date.now() });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setScanResult(null);
    if (tab !== 'scanner') { stopCamera(); setShowScanner(false); }
  };

  const handleOpenScanner = async () => {
    setShowScanner(true);
    setScanDone(false);
    await new Promise(r => setTimeout(r, 100));
    await startCamera();
  };

  const handleCloseScanner = async () => {
    await stopCamera();
    setShowScanner(false);
    setCameraError('');
    setScanResult(null);
  };

  const csvEscape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const exportToCSV = () => {
    if (!historyRecords.length) { showToast('No records to export', 'warning'); return; }
    const headers = ['Date','Check-In','Check-Out','Total Hours','Status','Method'];
    const rows    = historyRecords.map(r => [
      formatDate(r.attendanceDate), formatTime(r.checkInTime),
      formatTime(r.checkOutTime),   formatHours(r.totalMinutes),
      r.status,                      r.checkInMethod
    ]);
    const csv  = [headers.join(','), ...rows.map(r => r.map(csvEscape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = `Attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('CSV exported!', 'success');
  };

  // ─── Cooldown UI helpers ───────────────────────────────────────────────────
  const cooldownMins    = Math.floor(cooldownLeft / 60);
  const cooldownSecs    = cooldownLeft % 60;
  const cooldownPct     = Math.max(0, ((300 - cooldownLeft) / 300) * 100);
  const isCooldownActive = cooldownLeft > 0; // Cooldown for self-scanning
  const canMarkAttendance = teacherProfile?.permissions?.canMarkAttendance !== false;

  // ─── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'today',   label: 'Today',      icon: Calendar  },
    { id: 'scanner', label: 'Scanner',    icon: Camera    },
    { id: 'history', label: 'History',    icon: History   },
    { id: 'stats',   label: 'Statistics', icon: BarChart3 },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="att-root">
      <StyleTag />

      <div className="att-wrap">

        {/* ── Header ── */}
        <div className="glass-card" style={{ padding: '22px 26px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          {/* Top gradient bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899, #f59e0b)' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.35)' }}>
                  <UserCheck size={20} color="white" />
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>
                  <span className="grad-text">Staff Attendance</span>
                </h1>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                Welcome back{auth.user?.name ? `, ${auth.user.name}` : ''}! Track your attendance below.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {/* Today badge */}
              <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 14, padding: '8px 16px', border: '1px solid #bfdbfe', textAlign: 'center', minWidth: 90 }}>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3b82f6', marginBottom: 3 }}>Today</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#1d4ed8' }}>{formatDate(new Date().toISOString().split('T')[0])}</p>
              </div>
              {/* Cooldown indicator */}
              {isCooldownActive && (
                <div style={{ background: 'linear-gradient(135deg,#fff7ed,#ffedd5)', borderRadius: 14, padding: '8px 16px', border: '1px solid #fed7aa', textAlign: 'center', minWidth: 90 }}>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ea580c', marginBottom: 3 }}>Next Scan</p>
                  <p className="mono" style={{ fontSize: 13, fontWeight: 800, color: '#c2410c' }}>
                    {String(cooldownMins).padStart(2,'0')}:{String(cooldownSecs).padStart(2,'0')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="tab-bar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={16} />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ══════════════ TAB: TODAY ══════════════ */}
        {activeTab === 'today' && (
          <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {todayLoading ? (
              <div className="glass-card" style={{ padding: 20 }}><LoaderCenter /></div>
            ) : todayStatus ? (
              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.01em', marginBottom: 4 }}>Today's Attendance</h3>
                    <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{formatDate(todayStatus.attendanceDate)}</p>
                  </div>
                  {todayStatus.status && <StatusBadge status={todayStatus.status} />}
                </div>

                <div className="time-grid" style={{ marginBottom: 14 }}>
                  <TimeBlock label="Check-In"  value={formatTime(todayStatus.checkInTime) || '—'}  color="#2563eb" bg="#eff6ff" border="#bfdbfe" />
                  <TimeBlock label="Check-Out" value={formatTime(todayStatus.checkOutTime) || '—'} color="#059669" bg="#ecfdf5" border="#a7f3d0" />
                  <TimeBlock label="Total Hours" value={formatHours(todayStatus.totalMinutes) || '—'} color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
                  {todayStatus.scheduledEntry && (
                    <TimeBlock label="Scheduled Entry" value={todayStatus.scheduledEntry} color="#475569" bg="#f8fafc" border="#e2e8f0" />
                  )}
                </div>

                {todayStatus.scheduledEntry && todayStatus.checkInTime && (
                  todayStatus.isLate ? (
                    <div style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', border: '1.5px solid #fecaca', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Clock size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#b91c1c', lineHeight: 1.4 }}>
                          Late by {fmtLateDuration(todayStatus.lateByMinutes)}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: '#b91c1c', lineHeight: 1.4 }}>
                          Scheduled {todayStatus.scheduledEntry}{todayStatus.gracePeriodMinutes > 0 ? ` · Grace ${todayStatus.gracePeriodMinutes}m` : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #a7f3d0', borderRadius: 14, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#047857', lineHeight: 1.5 }}>
                        On time for the {todayStatus.scheduledEntry} shift.
                      </p>
                    </div>
                  )
                )}

                {!todayStatus.checkOutTime && todayStatus.checkInTime && (
                  <button onClick={() => handleTabChange('scanner')} className="btn-primary" style={{ marginTop: 16 }}>
                    <Camera size={16} /> Scan to Check Out
                  </button>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 52, textAlign: 'center' }}>
                <div className="anim-float" style={{ display: 'inline-flex', width: 72, height: 72, borderRadius: '50%', background: '#f8fafc', alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0', marginBottom: 16 }}>
                  <Calendar size={32} color="#cbd5e1" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#94a3b8', marginBottom: 5 }}>No attendance marked yet</p>
                <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500, marginBottom: 20 }}>
                  {canMarkAttendance ? 'Scan the QR code to check in for today.' : 'Your account is not permitted to self-scan. Contact your administrator.'}
                </p>
                {canMarkAttendance && (
                  <button onClick={() => handleTabChange('scanner')} className="btn-primary" style={{ maxWidth: 220, margin: '0 auto' }}>
                    <Camera size={16} /> Go to Scanner
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: SCANNER ══════════════ */}
        {activeTab === 'scanner' && (
          <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!showScanner ? (
              <div className="scanner-grid">
                {/* ── Open Camera CTA ── */}
                <div className="glass-card" style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
                  {/* Camera icon with pulse ring */}
                  <div style={{ position: 'relative', display: 'inline-flex' }}>
                    <div style={{
                      width: 108, height: 108, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 10px 36px rgba(37,99,235,0.38)',
                      animation: isCooldownActive ? 'none' : 'float 3.5s ease-in-out infinite',
                    }}>
                      {isCooldownActive ? <Timer size={44} color="white" /> : <Camera size={44} color="white" />}
                    </div>
                    {!isCooldownActive && (
                      <>
                        <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '2px solid rgba(59,130,246,0.4)', animation: 'ringPulse 2s ease-out infinite' }} />
                        <div style={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '1px solid rgba(59,130,246,0.2)', animation: 'ringPulse 2s ease-out 0.5s infinite' }} />
                      </>
                    )}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>
                      {isCooldownActive ? 'Scanner Cooling Down' : 'Scan QR Code'}
                    </h3>
                    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500, lineHeight: 1.5 }}>
                      {isCooldownActive
                        ? `You can scan again in ${cooldownMins}:${String(cooldownSecs).padStart(2,'0')}`
                        : 'Open camera and point it at the attendance QR code'}
                    </p>
                  </div>
                  {/* Cooldown progress bar */}
                  {isCooldownActive && (
                    <div style={{ width: '100%', maxWidth: 280 }}>
                      <div style={{ background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', height: 6, marginBottom: 8 }}>
                        <div className="cooldown-bar" style={{ width: `${cooldownPct}%` }} />
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                        {Math.round(cooldownPct)}% cooldown elapsed
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleOpenScanner}
                    className="btn-primary"
                    style={{ maxWidth: 280 }}
                    disabled={isCooldownActive}
                  >
                    {isCooldownActive
                      ? <><Timer size={16} /> Wait {cooldownMins}:{String(cooldownSecs).padStart(2,'0')}</>
                      : <><Camera size={16} /> Open Camera</>}
                  </button>
                  {isCooldownActive && (
                    <p style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 500, textAlign: 'center', lineHeight: 1.5 }}>
                      5-minute cooldown prevents duplicate scans
                    </p>
                  )}
                </div>

                {/* ── QR Token / Permission Panel ── */}
                <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 3 }}>
                      {qrPermission === null ? 'Loading…' : qrPermission ? 'Employee Attendance QR (Show to Staff)' : 'Attendance QR'}
                    </h3>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                      {qrPermission ? 'Display this on your screen for other staff to scan. This is NOT for marking your own attendance.' : 'Scan the QR code displayed by your administrator.'}
                    </p>
                  </div>

                  {/* Loading state */}
                  {qrPermission === null && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #dbeafe', borderTopColor: '#2563eb', animation: 'spin 0.9s linear infinite' }} />
                    </div>
                  )}

                  {/* Has QR permission — show token panel */}
                  {qrPermission === true && qrData && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Clear warning banner so staff don't confuse this with self check-in */}
                      <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fde68a', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <Shield size={15} color="#b45309" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#92400e', fontWeight: 700, lineHeight: 1.5 }}>
                          Show this QR on your screen so OTHER staff can scan it to mark their own attendance. Don't scan this yourself.
                        </p>
                      </div>
                      <div className="qr-container">
                        <div className="qr-img-wrap">
                          <QRCodeCanvas value={qrData.qrPayload} size={150} bgColor="#ffffff" fgColor="#2563eb" level="M" includeMargin={false} />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: 4 }}>Token (partial)</p>
                          <p className="mono" style={{ fontSize: 10, color: '#475569', wordBreak: 'break-all', lineHeight: 1.7, background: '#f8fafc', padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            {qrData.token?.slice(0, 32)}…
                          </p>
                        </div>
                      </div>
                      {/* Timer pill */}
                      <div style={{
                        background: qrRemainingTime < 15 ? 'linear-gradient(135deg,#fff1f2,#ffe4e6)' : 'linear-gradient(135deg,#eff6ff,#dbeafe)',
                        borderRadius: 14, padding: '12px 16px',
                        border: `1.5px solid ${qrRemainingTime < 15 ? '#fecaca' : '#bfdbfe'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: qrRemainingTime < 15 ? '#dc2626' : '#2563eb' }}>
                          {qrRemainingTime < 15 ? '⚠ Expiring soon' : 'Expires in'}
                        </span>
                        <span className="mono" style={{ fontSize: 24, fontWeight: 900, color: qrRemainingTime < 15 ? '#dc2626' : '#1d4ed8' }}>
                          {qrRemainingTime}s
                        </span>
                      </div>
                      <button onClick={refreshQRCode} className="btn-secondary">
                        <RefreshCw size={14} /> Refresh Token
                      </button>
                    </div>
                  )}

                  {/* No QR permission — show info (no error, just guidance) */}
                  {qrPermission === false && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 4px', textAlign: 'center' }}>
                      <div className="anim-float" style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bfdbfe' }}>
                        <QrCode size={30} color="#3b82f6" />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Scan Admin's QR Code</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, lineHeight: 1.5 }}>
                          Ask your administrator to display the attendance QR code, then tap <strong>Open Camera</strong> to scan it.
                        </p>
                      </div>
                      <div style={{ width: '100%', background: '#f8faff', borderRadius: 12, padding: '10px 14px', border: '1px solid #dbeafe', display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left' }}>
                        <Shield size={15} color="#2563eb" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#475569', fontWeight: 600, lineHeight: 1.5 }}>
                          Location is captured automatically for verification purposes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Active Scanner View ── */
              <div className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 900, letterSpacing: '-0.01em' }}>
                      {isScanning ? '⏳ Processing…' : '📸 Align QR Code'}
                    </h2>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                      Hold steady — scanner is active
                    </p>
                  </div>
                  <button onClick={handleCloseScanner}
                    style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <XCircle size={18} color="#64748b" />
                  </button>
                </div>

                {cameraError ? (
                  <div style={{ background: '#fff1f2', borderRadius: 18, border: '1.5px solid #fecaca', padding: 32, textAlign: 'center' }}>
                    <div className="anim-float" style={{ display: 'inline-flex', marginBottom: 14 }}>
                      <AlertCircle size={44} color="#ef4444" />
                    </div>
                    <p style={{ color: '#dc2626', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{cameraError}</p>
                    <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 22, opacity: 0.8, lineHeight: 1.5 }}>
                      Go to browser Settings → Site Settings → Camera → Allow
                    </p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => { setCameraError(''); startCamera(); }} className="btn-primary" style={{ maxWidth: 160 }}>
                        <RefreshCw size={14} /> Try Again
                      </button>
                      <button onClick={handleCloseScanner} className="btn-secondary" style={{ maxWidth: 140 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Scanner frame */}
                    <div className="scanner-wrap" style={{ marginBottom: 16 }}>
                      <div id="reader" style={{ width: '100%' }} />
                      {!isScanning && <div className="scan-line" />}
                      {/* Corner decorations */}
                      <div className="scanner-corners" />
                      <div style={{ position: 'absolute', top: 20, right: 20, width: 32, height: 32, borderTop: '3px solid #3b82f6', borderRight: '3px solid #3b82f6', borderRadius: '0 4px 0 0', pointerEvents: 'none', zIndex: 11 }} />
                      <div style={{ position: 'absolute', bottom: 20, left: 20, width: 32, height: 32, borderBottom: '3px solid #3b82f6', borderLeft: '3px solid #3b82f6', borderRadius: '0 0 0 4px', pointerEvents: 'none', zIndex: 11 }} />
                    </div>

                    {/* Processing indicator */}
                    {isScanning && (
                      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', borderRadius: 14, border: '1px solid #bfdbfe', padding: '16px 20px', textAlign: 'center', marginBottom: 12 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #bfdbfe', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                        <p style={{ color: '#2563eb', fontWeight: 800, fontSize: 13 }}>Verifying attendance…</p>
                      </div>
                    )}

                    {/* Success result */}
                    {scanResult && (
                      <div className="anim-bounce-in" style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius: 18, border: '1.5px solid #a7f3d0', padding: 22, marginBottom: 12 }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'checkSuccess 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                            <CheckCircle2 size={24} color="white" />
                          </div>
                          <div>
                            <p style={{ fontWeight: 900, fontSize: 15, color: '#065f46', marginBottom: 3 }}>{scanResult.message}</p>
                            {scanResult.note && <p style={{ fontSize: 12, color: '#047857', lineHeight: 1.4 }}>{scanResult.note}</p>}
                          </div>
                        </div>
                        {scanResult.scheduledEntry && scanResult.checkInTime && (
                          <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #d1fae5', padding: '14px 16px', marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Scheduled Entry</p>
                                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{scanResult.scheduledEntry}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Checked In</p>
                                <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{formatTime(scanResult.checkInTime)}</p>
                              </div>
                            </div>
                            {scanResult.isLate ? (
                              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#b91c1c' }}>
                                Late by {fmtLateDuration(scanResult.lateByMinutes)}
                                <span style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#b91c1c' }}>
                                  Scheduled {scanResult.scheduledEntry}{scanResult.gracePeriodMinutes > 0 ? ` · Grace ${scanResult.gracePeriodMinutes}m` : ''}
                                </span>
                              </p>
                            ) : (
                              <p style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: '#047857' }}>
                                On time for the {scanResult.scheduledEntry} shift.
                              </p>
                            )}
                          </div>
                        )}
                        {scanResult.action === 'checked_out' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div style={{ background: 'white', borderRadius: 12, padding: '10px 14px', border: '1px solid #a7f3d0' }}>
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Total Hours</p>
                              <p className="mono" style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>{scanResult.totalHours}</p>
                            </div>
                            {scanResult.extraHours && (
                              <div style={{ background: 'white', borderRadius: 12, padding: '10px 14px', border: '1px solid #a7f3d0' }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Extra Hours</p>
                                <p className="mono" style={{ fontSize: 20, fontWeight: 900, color: '#2563eb' }}>{scanResult.extraHours}</p>
                              </div>
                            )}
                          </div>
                        )}
                        <p style={{ fontSize: 11, color: '#047857', fontWeight: 600, marginTop: 12, opacity: 0.8 }}>
                          Redirecting to Today tab…
                        </p>
                      </div>
                    )}

                    {/* QR expiry indicator */}
                    {qrData && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                          Token: <span className="mono" style={{ color: qrRemainingTime < 15 ? '#dc2626' : '#2563eb', fontWeight: 900 }}>{qrRemainingTime}s</span>
                        </span>
                        <button onClick={refreshQRCode} className="btn-secondary" style={{ width: 'auto', padding: '7px 14px', fontSize: 12 }}>
                          <RefreshCw size={12} /> Refresh
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB: HISTORY ══════════════ */}
        {activeTab === 'history' && (
          <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filters */}
            <div className="glass-card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', marginBottom: 16 }}>Filter Records</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From Date</label>
                  <input type="date" value={histStartDate}
                    onChange={e => { setHistStartDate(e.target.value); setHistoryPage(1); }} className="att-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To Date</label>
                  <input type="date" value={histEndDate}
                    onChange={e => { setHistEndDate(e.target.value); setHistoryPage(1); }} className="att-input" />
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <button onClick={() => { setHistStartDate(''); setHistEndDate(''); setHistoryPage(1); }} className="btn-secondary">
                    <XCircle size={14} /> Clear
                  </button>
                  <button onClick={exportToCSV} className="btn-primary">
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
              {historyLoading ? (
                <div style={{ padding: 20 }}><LoaderCenter /></div>
              ) : historyRecords.length > 0 ? (
                <>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="att-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Total Hours</th>
                          <th>Status</th>
                          <th>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyRecords.map(record => (
                          <tr key={record._id}>
                            <td style={{ fontWeight: 800, color: '#1e293b' }}>{formatDate(record.attendanceDate)}</td>
                            <td><span className="mono" style={{ fontWeight: 700, color: '#2563eb' }}>{formatTime(record.checkInTime)}</span></td>
                            <td><span className="mono" style={{ fontWeight: 700, color: '#059669' }}>{formatTime(record.checkOutTime) || '—'}</span></td>
                            <td><span className="mono" style={{ fontWeight: 700, color: '#475569' }}>{formatHours(record.totalMinutes)}</span></td>
                            <td>
                              <StatusBadge status={record.status} />
                              {(() => {
                                const li = computeLateMinutes(record.checkInTime, profileFixedShift, record, false);
                                return li?.isLate ? (
                                  <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 800, color: '#b91c1c', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
                                    Late · {fmtLateDuration(li.lateByMinutes)}
                                  </span>
                                ) : null;
                              })()}
                            </td>
                            <td style={{ textTransform: 'capitalize', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{record.checkInMethod}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div style={{ padding: '16px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      Showing {(historyPage - 1) * HISTORY_LIMIT + 1}–{Math.min(historyPage * HISTORY_LIMIT, historyTotal)} of {historyTotal} records
                    </p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => setHistoryPage(p => Math.max(p-1, 1))} disabled={historyPage === 1}
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: historyPage === 1 ? 0.4 : 1, transition: 'all 0.2s' }}>
                        <ChevronLeft size={16} />
                      </button>
                      <span style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)', color: '#2563eb', borderRadius: 10, fontWeight: 900, fontSize: 13, border: '1px solid #bfdbfe' }}>
                        {historyPage} / {historyPages}
                      </span>
                      <button onClick={() => setHistoryPage(p => Math.min(p+1, historyPages))} disabled={historyPage === historyPages}
                        style={{ width: 34, height: 34, borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: historyPage === historyPages ? 0.4 : 1, transition: 'all 0.2s' }}>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 52 }}>
                  <div className="anim-float" style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: '#f8fafc', alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0', marginBottom: 14 }}>
                    <History size={28} color="#cbd5e1" />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#94a3b8', marginBottom: 5 }}>No records found</p>
                  <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>Try adjusting your filters or date range</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB: STATISTICS ══════════════ */}
        {activeTab === 'stats' && (
          <div className="anim-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {statsLoading ? (
              <div className="glass-card" style={{ padding: 20 }}><LoaderCenter /></div>
            ) : summary ? (
              <>
                {/* Late count is computed client-side from the teacher's own
                    shift timing + grace — the backend monthly summary's
                    `late` is unreliable (returns 0) so we don't trust it. */}
                {summary && (() => {
                  const lateCount = historyRecords.filter((r) =>
                    computeLateMinutes(r.checkInTime, profileFixedShift, r, false)?.isLate
                  ).length;
                  return (
                    <div className="stats-grid">
                      <StatCard icon={UserCheck}    label="Present"  value={summary.present}  color="#059669" bg="linear-gradient(135deg,#ecfdf5,#d1fae5)"   iconBg="linear-gradient(135deg,#10b981,#059669)" />
                      <StatCard icon={Clock}         label="Late"     value={lateCount}     color="#d97706" bg="linear-gradient(135deg,#fffbeb,#fef3c7)"   iconBg="linear-gradient(135deg,#f59e0b,#d97706)" />
                      <StatCard icon={Timer}         label="Half Day" value={summary.halfDay}  color="#ea580c" bg="linear-gradient(135deg,#fff7ed,#ffedd5)"   iconBg="linear-gradient(135deg,#f97316,#ea580c)" />
                      <StatCard icon={UserMinus}     label="Absent"   value={summary.absent}   color="#dc2626" bg="linear-gradient(135deg,#fff1f2,#ffe4e6)"   iconBg="linear-gradient(135deg,#ef4444,#dc2626)" />
                      <StatCard icon={Umbrella}      label="Leave"    value={summary.leave}    color="#0284c7" bg="linear-gradient(135deg,#f0f9ff,#e0f2fe)"   iconBg="linear-gradient(135deg,#0ea5e9,#0284c7)" />
                      <StatCard icon={CalendarDays}  label="Holiday"  value={summary.holiday}  color="#7c3aed" bg="linear-gradient(135deg,#f5f3ff,#ede9fe)"   iconBg="linear-gradient(135deg,#8b5cf6,#7c3aed)" />
                    </div>
                  );
                })()}

                {summary.totalExtraMinutes > 0 && (
                  <div style={{
                    borderRadius: 22,
                    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #7c3aed 100%)',
                    padding: '24px 28px',
                    boxShadow: '0 12px 40px rgba(37,99,235,0.35)',
                    position: 'relative', overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <div style={{ position: 'absolute', right: -24, top: -24, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ position: 'absolute', right: 30, bottom: -20, width: 70, height: 70, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                          Extra Minutes This Month
                        </p>
                        <p className="mono" style={{ fontSize: 42, fontWeight: 900, color: 'white', lineHeight: 1 }}>{summary.totalExtraMinutes}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 5, fontWeight: 600 }}>
                          ≈ {Math.round(summary.totalExtraMinutes / 60 * 10) / 10} hours extra
                        </p>
                      </div>
                      <Star size={52} color="rgba(255,255,255,0.18)" strokeWidth={1} />
                    </div>
                  </div>
                )}

                {/* Monthly summary label */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                    Statistics for current month · Updates automatically
                  </p>
                </div>
              </>
            ) : (
              <div className="glass-card" style={{ padding: 52, textAlign: 'center' }}>
                <div className="anim-float" style={{ display: 'inline-flex', width: 72, height: 72, borderRadius: '50%', background: '#f8fafc', alignItems: 'center', justifyContent: 'center', border: '2px solid #e2e8f0', marginBottom: 16 }}>
                  <BarChart3 size={32} color="#cbd5e1" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#94a3b8', marginBottom: 5 }}>No statistics yet</p>
                <p style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>Data will appear once attendance is recorded</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
};

export default TeacherStaffAttendancePage;