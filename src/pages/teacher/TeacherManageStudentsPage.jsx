import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getMyProfileAPI } from '../../api/teachers';
import {
  UserPlus, X, Eye, Edit2, QrCode, Clock, BookOpen,
  Users, Download, Copy, CheckCircle, Search, AlertTriangle,
  Phone, Calendar, Plus, Minus, AlarmClock, Hourglass, Info,
  ChevronDown, ChevronUp, Baby, User, CalendarDays, MapPin,
  Shield, Star, Activity, Hash, GraduationCap, Heart,
  ChevronLeft, ChevronRight, Mail, Lock, Key, Camera,
  Fingerprint, AlertCircle, CheckCircle2, ExternalLink,
  Share2, MessageCircle, Smartphone, Loader2, Zap,
} from 'lucide-react';
import { FaWhatsapp } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import {
  getStudentsAPI,
  createStudentAPI,
  updateStudentAPI,
} from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import { API_ORIGIN } from '../../utils/photoUtils';
import feeService from '../../services/feeService';
import { sumFlexiFromClassTimings } from '../../utils/flexiHours';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  const s = { error: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' }, success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' }, warning: { bg: '#FFFBEB', border: '#FCD34D', text: '#B45309' }, info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' } }[type] || {};
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12, padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', maxWidth: 340, animation: 'slideUp .25s ease' }}>
      <AlertCircle size={16} color={s.text} />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: s.text, flex: 1 }}>{message}</p>
      <button onClick={onClose} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CLASS_TYPES = {
  FIXED_TIME:  { id: 'FIXED_TIME',  label: 'Fixed Time',    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  FLEX_TIME:   { id: 'FLEX_TIME',   label: 'Flexible Time', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  HOURS_BASED: { id: 'HOURS_BASED', label: 'Hours Based',   color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
};
const WEEK_DAYS = [
  { id: 'MON', label: 'Mon' }, { id: 'TUE', label: 'Tue' }, { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' }, { id: 'FRI', label: 'Fri' }, { id: 'SAT', label: 'Sat' }, { id: 'SUN', label: 'Sun' },
];
const formatDays = (days) => {
  if (!days?.length || days.length === 7) return 'All Days';
  return WEEK_DAYS.filter(d => days.includes(d.id)).map(d => d.label).join(', ');
};
const getAcademicYear = (date = new Date()) => {
  const m = date.getMonth(), y = date.getFullYear();
  return m >= 3 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};
const CURRENT_AY = getAcademicYear();
const CURRENT_START_YR = parseInt(CURRENT_AY.split('-')[0]);
const NEXT_AY = `${CURRENT_START_YR + 1}-${CURRENT_START_YR + 2}`;

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  blue:   { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', solid: '#2563EB' },
  green:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', solid: '#16A34A' },
  red:    { bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3', solid: '#E11D48' },
  amber:  { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', solid: '#D97706' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', solid: '#0D9488' },
  purple: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', solid: '#9333EA' },
  indigo: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE', solid: '#4F46E5' },
  slate:  { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', solid: '#64748B' },
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', solid: '#EA580C' },
};
const AVATAR_COLORS = [
  ['#1E3A8A','#3B82F6'], ['#581C87','#A855F7'],
  ['#064E3B','#10B981'], ['#7C2D12','#F97316'],
  ['#831843','#EC4899'], ['#1E3A5F','#0EA5E9'],
];
const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const fmt12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
};
const fmtHrs = (h) => {
  const total = Math.max(0, Number(h) || 0);
  const hrs = Math.floor(total);
  const mins = Math.round((total - hrs) * 60);
  if (mins >= 60) return `${hrs + 1}h 0m`;
  return `${hrs}h ${mins}m`;
};
const formatDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};
const getPhotoUrl = (p) => {
  if (!p) return null;
  // If it's already a full URL (S3, CloudFront, etc.), return as-is
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p;
  // If it's a relative path, prepend base URL
  let c = p.replace(/\\/g, '/');
  const m = c.match(/(uploads\/.*)$/);
  if (m) c = m[1];
  return `${API_ORIGIN}/${c}`;
};
const getRemainingHours = (s) => {
  const classPaid = Object.values(s.classTimings || {}).reduce((sum, ct) => sum + (ct.paidFlexiHours || 0), 0);
  const classFree = Object.values(s.classTimings || {}).reduce((sum, ct) => sum + (ct.freeFlexiHours || 0), 0);
  const classConsumed = Object.values(s.classTimings || {}).reduce((sum, ct) => sum + (ct.consumedFlexiHours || 0), 0);
  const extraConsumed = s.consumedFlexiHours || 0;
  return Math.max(0, classPaid + classFree - (classConsumed + extraConsumed));
};
const isHoursCritical = (s) => {
  const classPaid = Object.values(s.classTimings || {}).reduce((sum, ct) => sum + (ct.paidFlexiHours || 0), 0);
  const classFree = Object.values(s.classTimings || {}).reduce((sum, ct) => sum + (ct.freeFlexiHours || 0), 0);
  const classConsumed = Object.values(s.classTimings || {}).reduce((sum, ct) => sum + (ct.consumedFlexiHours || 0), 0);
  const extraConsumed = s.consumedFlexiHours || 0;
  const remaining = classPaid + classFree - (classConsumed + extraConsumed);
  return remaining < 6 && (classPaid > 0 || classFree > 0);
};
const getClassLabel = (classId, classesData = []) => {
  const cls = classesData.find(c => c.id === classId || c._id === classId || c.classId === classId);
  return cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : classId;
};
const syncFeeEnrollmentsForClasses = async ({ studentId, classIds = [], previousClassIds = [], classesData = [], classTimings = {} }) => {
  if (!studentId || !classIds.length) return { enrolled: [], failed: [] };
  const previous = new Set((previousClassIds || []).filter(Boolean).map(String));
  const newClassIds = classIds.filter(cid => cid && !previous.has(String(cid)));
  const enrolled = [];
  const failed = [];

  for (const cid of newClassIds) {
    const cls = classesData.find(c => c.id === cid || c._id === cid || c.classId === cid);
    const assignedHours = cls?.classType === 'FLEX_TIME' ? (classTimings?.[cid]?.assignedHours || undefined) : undefined;
    try {
      await feeService.createEnrollment(studentId, cid, assignedHours);
      enrolled.push(getClassLabel(cid, classesData));
    } catch (err) {
      const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to enroll';
      if (/already|duplicate|exist/i.test(message)) {
        enrolled.push(getClassLabel(cid, classesData));
      } else {
        failed.push({ name: getClassLabel(cid, classesData), reason: message });
      }
    }
  }

  return { enrolled, failed };
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_RE = /^[6-9]\d{9}$/;
const getClassTimingLabel = (student, cls) => {
  const timing = student.classTimings?.[cls.id] || student.classTimings?.[cls._id] || student.classTimings?.[cls.classId] || {};
  const typeColor = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';
  const addonPaid = timing.paidFlexiHours || 0;
  const addonFree = timing.freeFlexiHours || 0;
  const hasAddon = addonPaid > 0 || addonFree > 0;
  const addonSuffix = hasAddon ? ` · +${addonPaid + addonFree} flexi hrs` : '';
  if (cls.classType === 'FIXED_TIME') return { label: cls.startTime && cls.endTime ? `${fmt12(cls.startTime)} – ${fmt12(cls.endTime)}${addonSuffix}` : 'Time not set', color: typeColor };
  if (cls.classType === 'FLEX_TIME') return { label: timing.startTime && timing.endTime ? `${fmt12(timing.startTime)} – ${fmt12(timing.endTime)}${addonSuffix}` : 'Time not set', color: typeColor };
  if (cls.classType === 'HOURS_BASED') {
    const paid = timing.paidFlexiHours || 0;
    const free = timing.freeFlexiHours || 0;
    return { label: (paid + free) > 0 ? `${paid + free} hrs (${paid}p + ${free}f)` : 'Hours not set', color: typeColor };
  }
  return { label: '—', color: 'slate' };
};

// ─── Base Styles ──────────────────────────────────────────────────────────────
const IS = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 500, outline: 'none', boxSizing: 'border-box', background: '#fff', fontFamily: 'inherit', color: '#0F172A', transition: 'border-color 0.15s' };
const LS = { display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 };

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name, photo, size = 40, radius = 12 }) => {
  const [imgErr, setImgErr] = useState(false);
  const src = photo && !imgErr ? getPhotoUrl(photo) : null;
  const [from, to] = avatarColor(name);
  return src
    ? <img src={src} alt={name} onError={() => setImgErr(true)} style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, background: `linear-gradient(135deg,${from},${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.38, letterSpacing: '-0.02em' }}>{(name || 'S').charAt(0).toUpperCase()}</div>;
};

// ─── Centered Modal ───────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, subtitle, children, maxWidth = 620 }) => {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2,8,32,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth, background: '#fff', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden', animation: 'modalIn .22s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</h2>
            {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}><X size={15} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: '18px 20px', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── QR Modal ────────────────────────────────────────────────────────────────
const QRModal = ({ open, onClose, student, classesData = [] }) => {
  const [copied, setCopied] = useState(false);
  if (!open || !student) return null;
  const [from, to] = avatarColor(student.name);
  const enrolledClasses = classesData.filter(c => student.classIds?.includes(c.id));
  const handleDownload = () => {
    const canvas = document.getElementById(`qr-${student.id}`);
    if (canvas) { const a = document.createElement('a'); a.download = `${student.name}_QR.png`; a.href = canvas.toDataURL(); a.click(); }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(2,8,32,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', animation: 'modalIn .22s ease' }}>
        <div style={{ background: `linear-gradient(135deg,${from},${to})`, padding: '20px', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ border: '2px solid rgba(255,255,255,0.35)', borderRadius: 14, overflow: 'hidden' }}>
              <Avatar name={student.name} photo={student.photo} size={52} radius={12} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase' }}>Student QR</p>
              <h3 style={{ margin: '3px 0 2px', fontSize: 16, fontWeight: 900, color: '#fff' }}>{student.name}</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>{student.enrollmentId || '—'}</p>
            </div>
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{ padding: 10, background: '#fff', borderRadius: 12, border: '1.5px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', flexShrink: 0 }}>
              <QRCodeCanvas id={`qr-${student.id}`} value={student.qrCode || `BRAINBUILDER-STU-${student.id}`} size={120} level="H" includeMargin={false} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[{ icon: Phone, label: 'Phone', val: student.phone }, { icon: User, label: 'Father', val: student.fatherName }, { icon: Calendar, label: 'DOB', val: formatDate(student.dob) }, { icon: CalendarDays, label: 'Joined', val: formatDate(student.joiningDate) }].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <Icon size={11} color="#94A3B8" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: '#94A3B8', width: 42, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 9, border: '1px solid #E2E8F0', marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>QR Code ID</p>
            <p style={{ margin: '3px 0 0', fontSize: 10, fontWeight: 700, color: '#1D4ED8', fontFamily: 'monospace', wordBreak: 'break-all' }}>{student.qrCode || `BRAINBUILDER-STU-${student.id}`}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={handleDownload} style={{ padding: '9px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg,${from},${to})`, color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Download size={13} /> Download</button>
            <button onClick={() => { navigator.clipboard.writeText(student.qrCode || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: '9px', borderRadius: 10, border: `1.5px solid ${copied ? '#16A34A' : '#E2E8F0'}`, background: copied ? '#F0FDF4' : '#F8FAFC', color: copied ? '#16A34A' : '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>{copied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy ID</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Parent Credentials Modal ─────────────────────────────────────────────────
const ParentCredentialsModal = ({ open, onClose, credentials, studentName, parentPhone, fatherPhone, motherPhone, studentPhone, studentEmail, studentPassword }) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [passCopied, setPassCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  
  if (!open || !credentials) return null;
  
  const fmtWA = (p) => { 
    const c = p?.replace(/\D/g,'') || ''; 
    return c.startsWith('91') && c.length > 2 ? c : c.length === 10 ? '91'+c : c; 
  };

  const sendWhatsApp = (phone) => {
    const p = fmtWA(phone);
    if (p.length >= 12) {
      window.open(`https://wa.me/${p}?text=${encodeURIComponent(waMessage)}`, '_blank');
    } else {
      alert('Invalid phone number. Must be 10 digits.');
    }
  };
  
  const loginUrl = 'https://brainbuilder.in/login';
  const waMessage = `🎉 *Congratulations! Student Registered Successfully*

👤 *Student:* ${studentName}

🔒 *Parent Login Credentials*
📧 *Email:* ${credentials.email || 'N/A'}
📱 *Phone:* ${parentPhone || fatherPhone || motherPhone || 'N/A'}
🔑 *Password:* ${credentials.password || 'N/A'}

🌐 *Login Link:* ${loginUrl}

✅ *Parent can login with Email OR Phone + Password*
⚠️ *Please save these credentials safely.*

📌 *Use the link above to login at BrainBuilder.*`;

  const hasFather = fatherPhone?.length === 10, hasMother = motherPhone?.length === 10;
  const primaryPhone = parentPhone || fatherPhone || motherPhone;
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(2,8,32,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 20, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', animation: 'modalIn .22s ease' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#064E3B,#059669)', padding: '18px 20px', flexShrink: 0, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 7, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', paddingRight: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={26} color="#fff" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Registered!</p>
              <h3 style={{ margin: '3px 0 2px', fontSize: 18, fontWeight: 900, color: '#fff' }}>{studentName}</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>Credentials generated successfully</p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Warning */}
          <div style={{ background: 'linear-gradient(135deg,#FFFBEB,#FEF3C7)', border: '1.5px solid #FCD34D', borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, color: '#92400E', fontWeight: 700, lineHeight: 1.5 }}>⚠️ Share credentials with parent immediately</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#A16207', fontWeight: 600 }}>Password cannot be recovered later. Save safely!</p>
            </div>
          </div>
          
          {/* Student Credentials */}
          {(studentPhone || studentEmail || studentPassword) && (
            <div>
              <label style={{ ...LS, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={13} color="#7E22CE" />
                Student Login Credentials
              </label>
              <div style={{ background: 'linear-gradient(135deg,#FAF5FF,#F3E8FF)', borderRadius: 12, border: '1.5px solid #E9D5FF', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {studentPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Phone size={13} color="#7E22CE" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#6B21A8', fontWeight: 700, width: 60 }}>Phone:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', flex: 1, fontFamily: 'monospace' }}>{studentPhone}</span>
                  </div>
                )}
                {studentEmail && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={13} color="#7E22CE" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#6B21A8', fontWeight: 700, width: 60 }}>Email:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>{studentEmail}</span>
                  </div>
                )}
                {studentPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Key size={13} color="#7E22CE" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#6B21A8', fontWeight: 700, width: 60 }}>Password:</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', flex: 1, fontFamily: 'monospace' }}>{studentPassword}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Parent Credentials */}
          <div>
            <label style={{ ...LS, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Users size={13} color="#2563EB" />
              Parent Login Credentials
            </label>
            <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, border: '1.5px solid #BFDBFE', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, width: 60 }}>Email:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>{credentials.email}</span>
                <button onClick={() => { navigator.clipboard.writeText(credentials.email); setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); }} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: emailCopied ? '#DCFCE7' : 'rgba(0,0,0,0.06)', color: emailCopied ? '#16A34A' : '#2563EB', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {emailCopied ? <><CheckCircle size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
              {primaryPhone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, width: 60 }}>Phone:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', flex: 1, fontFamily: 'monospace' }}>{primaryPhone}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Lock size={13} color="#2563EB" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 700, width: 60 }}>Password:</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626', flex: 1, fontFamily: 'monospace' }}>{credentials.password}</span>
                <button onClick={() => { navigator.clipboard.writeText(credentials.password); setPassCopied(true); setTimeout(() => setPassCopied(false), 2000); }} style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: passCopied ? '#DCFCE7' : 'rgba(0,0,0,0.06)', color: passCopied ? '#16A34A' : '#2563EB', fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {passCopied ? <><CheckCircle size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
                </button>
              </div>
            </div>
          </div>
          
          {/* Login Info */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={13} color="#16A34A" />
              Parent Login Options:
            </p>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 11, color: '#166534', fontWeight: 600, lineHeight: 1.6 }}>
              <li>Email + Password</li>
              <li>Phone + Password</li>
              <li>Both methods work for parent login</li>
            </ul>
          </div>
          
          {/* Share Options */}
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', fontWeight: 700 }}>Send login details to:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {hasFather && (
                <button onClick={() => sendWhatsApp(fatherPhone)} style={{ padding: '11px 14px', borderRadius: 11, border: '2px solid #2563EB', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FaWhatsapp size={18} color="#25D366" />
                  Send to Father
                </button>
              )}
              {hasMother && (
                <button onClick={() => sendWhatsApp(motherPhone)} style={{ padding: '11px 14px', borderRadius: 11, border: '2px solid #DB2777', background: '#FCE7F3', color: '#BE185D', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FaWhatsapp size={18} color="#25D366" />
                  Send to Mother
                </button>
              )}
              {!hasFather && !hasMother && parentPhone && (
                <button onClick={() => sendWhatsApp(parentPhone)} style={{ padding: '11px 14px', borderRadius: 11, border: '2px solid #10B981', background: '#ECFDF5', color: '#047857', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <FaWhatsapp size={18} color="#25D366" />
                  Send to Parent
                </button>
              )}
            </div>

            <button onClick={() => {
              navigator.clipboard.writeText(waMessage);
              setCopiedAll(true);
              setTimeout(() => setCopiedAll(false), 2000);
            }} style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #3B82F6', background: '#EFF6FF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Copy size={14} color="#2563EB" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8' }}>
                {copiedAll ? '✓ Copied to Clipboard!' : 'Copy All Credentials'}
              </span>
            </button>

            <button onClick={() => {
              const subject = encodeURIComponent(`BrainBuilder Login - ${studentName}`);
              const body = encodeURIComponent(waMessage);
              window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
            }} style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #EA4335', background: '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MdOutlineEmail size={16} color="#EA4335" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>Send via Email</span>
            </button>
          </div>
          
          {/* Close Button */}
          <button onClick={onClose} style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0F172A,#1E293B)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.25)' }}>
            <CheckCircle2 size={16} /> Done - Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Class Assignment Widget ──────────────────────────────────────────────────
const TimePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('hour');
  const hour24 = value ? parseInt(value.split(':')[0]) : 9;
  const hour12 = hour24 % 12 || 12;
  const minute = value ? value.split(':')[1] : '00';
  const period = value ? (parseInt(value.split(':')[0]) >= 12 ? 'PM' : 'AM') : 'AM';

  const pickHour = (h) => {
    const h24 = mode === 'AM' ? (h % 12) : ((h % 12) + 12);
    const newVal = `${String(h24).padStart(2, '0')}:${minute}`;
    onChange(newVal);
    setMode('minute');
  };

  const pickMinute = (m) => {
    const newVal = `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(newVal);
    setOpen(false);
  };

  const togglePeriod = () => {
    const curH = parseInt(value?.split(':')[0] || '09');
    const next = curH < 12 ? curH + 12 : curH - 12;
    onChange(`${String(next).padStart(2, '0')}:${minute}`);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div style={{ position: 'relative', zIndex: open ? 10 : 1 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          ...IS, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#fff', fontSize: 13, fontWeight: 600, color: '#0F172A',
        }}
      >
        <span>{value ? (() => { const [h, m] = value.split(':').map(Number); const ampm = h >= 12 ? 'PM' : 'AM'; return `${String(h % 12 || 12)}:${String(m).padStart(2, '0')} ${ampm}`; })() : 'Select time'}</span>
        <Clock size={16} color="#94A3B8" />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
            background: '#fff', borderRadius: 14, border: '1.5px solid #E2E8F0',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)', padding: 12,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button type="button" onClick={() => setMode('hour')} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === 'hour' ? '#2563EB' : '#F1F5F9',
                color: mode === 'hour' ? '#fff' : '#475569',
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              }}>Hour</button>
              <button type="button" onClick={() => setMode('minute')} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: mode === 'minute' ? '#2563EB' : '#F1F5F9',
                color: mode === 'minute' ? '#fff' : '#475569',
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              }}>Minute</button>
              <button type="button" onClick={togglePeriod} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: period === 'AM' ? '#EFF6FF' : '#FEF3C7',
                color: period === 'AM' ? '#1D4ED8' : '#B45309',
                fontWeight: 800, fontSize: 12, fontFamily: 'inherit',
              }}>{period}</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {(mode === 'hour' ? hours : minutes).map((num) => {
                const isSelected = mode === 'hour' ? num === hour12 : String(num).padStart(2, '0') === minute;
                return (
                  <button key={num} type="button" onClick={() => mode === 'hour' ? pickHour(num) : pickMinute(num)} style={{
                    padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isSelected ? '#2563EB' : '#FAFAFA',
                    color: isSelected ? '#fff' : '#1E293B',
                    fontWeight: isSelected ? 800 : 600, fontSize: 13, fontFamily: 'inherit',
                  }}>
                    {String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const ClassAssignmentWidget = ({ classIds, classTimings, onToggle, onTimingChange, onHoursChange, classesData = [] }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {classesData.map(cls => {
      const sel = classIds.includes(cls.id);
      const ct = CLASS_TYPES[cls.classType];
      const tc = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';
      const TIcon = cls.classType === 'FIXED_TIME' ? AlarmClock : cls.classType === 'FLEX_TIME' ? Clock : Hourglass;
      const timing = classTimings[cls.id] || classTimings[cls._id] || classTimings[cls.classId] || {};
      return (
        <div key={cls.id} style={{ borderRadius: 12, border: `1.5px solid ${sel ? T[tc].solid : '#E2E8F0'}`, background: sel ? T[tc].bg : '#FAFAFA', transition: 'all .15s' }}>
          <div onClick={() => onToggle(cls.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', cursor: 'pointer' }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${sel ? T[tc].solid : '#CBD5E1'}`, background: sel ? T[tc].solid : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {sel && <CheckCircle size={10} color="#fff" strokeWidth={3} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{cls.name}</span>
                <span style={{ fontSize: 10, color: '#94A3B8' }}>§{cls.section}</span>
                {ct && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: T[tc].bg, color: T[tc].text, border: `1px solid ${T[tc].border}` }}>{ct.label}</span>}
                {cls.baseFee > 0 && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>₹{cls.baseFee} {cls.feeType === 'MONTHLY' ? '/mo' : ''}</span>}
              </div>
              {cls.days?.length > 0 && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#64748B' }}>{formatDays(cls.days)}</p>}
            </div>
            <TIcon size={14} color={sel ? T[tc].solid : '#94A3B8'} style={{ flexShrink: 0 }} />
          </div>
          {sel && (
            <div style={{ padding: '0 13px 12px', borderTop: `1px solid ${T[tc].border}` }}>
              {cls.classType === 'FIXED_TIME' && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: '#fff', borderRadius: 9, border: `1px solid ${T.blue.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlarmClock size={14} color={T.blue.text} />
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.blue.text }}>Fixed — auto applied</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{cls.startTime && cls.endTime ? `${fmt12(cls.startTime)} – ${fmt12(cls.endTime)}` : 'Not set'}</p>
                  </div>
                  <CheckCircle size={14} color={T.green.text} style={{ marginLeft: 'auto' }} />
                </div>
              )}
              {cls.classType === 'FLEX_TIME' && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: T.teal.text, fontWeight: 600 }}>Set student's exact time</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><label style={LS}>Start *</label><TimePicker value={timing.startTime || ''} onChange={val => onTimingChange(cls.id, 'startTime', val)} /></div>
                    <div><label style={LS}>End *</label><TimePicker value={timing.endTime || ''} onChange={val => onTimingChange(cls.id, 'endTime', val)} /></div>
                  </div>
                  <div style={{ marginTop: 8, padding: '9px 11px', background: '#fff', borderRadius: 8, border: `1.5px solid ${T.teal.border}` }}>
                    <label style={LS}>Hours to Assign *</label>
                    <input
                      type="number" min="0.5" step="0.5" inputMode="decimal"
                      placeholder="e.g. 3"
                      value={timing.assignedHours ?? ''}
                      onChange={e => onHoursChange(cls.id, 'assignedHours', e.target.value === '' ? '' : Number(e.target.value))}
                      style={{ ...IS, fontWeight: 800 }}
                    />
                    <p style={{ margin: '6px 0 0', fontSize: 11, fontWeight: 700, color: T.teal.text }}>
                      Fee: ₹{cls.baseFee || 0}/hr × {timing.assignedHours || 0} hrs = ₹{(cls.baseFee || 0) * (timing.assignedHours || 0)} (unpaid until collected)
                    </p>
                  </div>
                </div>
              )}
              {cls.classType !== 'HOURS_BASED' && (
                <FlexiAddOn cls={cls} timing={timing} onHoursChange={onHoursChange} />
              )}
              {cls.classType === 'HOURS_BASED' && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 11, color: T.amber.text, fontWeight: 600 }}>Set flexi hours</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                    {[{ key: 'paidFlexiHours', label: 'Paid', def: 0, c: 'amber' }, { key: 'freeFlexiHours', label: 'Free', def: cls.monthlyFreeHours ?? 0, c: 'green' }].map(({ key, label, def, c }) => (
                      <div key={key}>
                        <label style={LS}>{label} Hours</label>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button type="button" onClick={() => onHoursChange(cls.id, key, Math.max(0, (timing[key] ?? def) - 1))} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: T.slate.bg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                          <input type="number" min="0" value={timing[key] ?? def} onChange={e => onHoursChange(cls.id, key, Math.max(0, parseInt(e.target.value) || 0))} style={{ ...IS, textAlign: 'center', fontWeight: 800, fontSize: 14, padding: '6px' }} />
                          <button type="button" onClick={() => onHoursChange(cls.id, key, (timing[key] ?? def) + 1)} style={{ width: 30, height: 30, borderRadius: 7, border: 'none', background: T[c].bg, color: T[c].text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 12px', background: '#fff', borderRadius: 9, border: `1px solid ${T.amber.border}`, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#64748B' }}>Total hours</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: T.amber.text }}>{(timing.paidFlexiHours || 0) + (timing.freeFlexiHours ?? (cls.monthlyFreeHours ?? 0))} hrs</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

const FlexiAddOn = ({ cls, timing, onHoursChange }) => {
  const hasAddon = (timing.paidFlexiHours || 0) > 0 || (timing.freeFlexiHours || 0) > 0;
  const [open, setOpen] = useState(hasAddon);
  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: 11.5, fontWeight: 700, color: T.amber.text }}>
        <Hourglass size={12} />
        {open ? 'Hide flexi hours add-on' : '+ Add flexi hours (optional)'}
      </button>
      {open && (
        <div style={{ marginTop: 8, padding: '10px 12px', background: '#fff', borderRadius: 9, border: `1px solid ${T.amber.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { key: 'paidFlexiHours', label: 'Paid', def: 0 },
              { key: 'freeFlexiHours', label: 'Free', def: cls.monthlyFreeHours ?? 0 },
            ].map(({ key, label, def }) => (
              <div key={key}>
                <label style={LS}>{label} Hours</label>
                <input type="number" min="0" value={timing[key] ?? def} onChange={e => onHoursChange(cls.id, key, Math.max(0, parseInt(e.target.value) || 0))} style={{ ...IS, textAlign: 'center', fontWeight: 800 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, color = '#1D4ED8', children, bg = '#F8FAFC' }) => (
  <div style={{ background: bg, borderRadius: 14, padding: '16px', border: '1px solid #E2E8F0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #E2E8F0' }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={14} color={color} />
      </div>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{title}</h3>
    </div>
    {children}
  </div>
);

// ─── Student Form ─────────────────────────────────────────────────────────────
const EMPTY_STUDENT = {
  name: '', gender: 'Male', dob: '', phone: '',
  fatherName: '', fatherMobile: '', fatherDob: '', fatherEmail: '',
  motherName: '', motherMobile: '', motherDob: '', motherEmail: '',
  address: '', status: 'Active',
  classIds: [], classTimings: {}, paidFlexiHours: 0, freeFlexiHours: 0, consumedFlexiHours: 0,
  joiningDate: new Date().toISOString().split('T')[0],
  admissionYear: CURRENT_START_YR, admissionAY: CURRENT_AY,
  siblings: [], parentPassword: 'parent@123', photo: null,
  studentEmail: '', studentPassword: 'student@123',
};

const normalizeStudentForm = (form) => ({
  ...form,
  name: form.name?.trim() || '',
  phone: (form.phone || '').replace(/\D/g, ''),
  fatherName: form.fatherName?.trim() || '',
  fatherMobile: (form.fatherMobile || '').replace(/\D/g, ''),
  fatherEmail: form.fatherEmail?.trim().toLowerCase() || '',
  motherName: form.motherName?.trim() || '',
  motherMobile: (form.motherMobile || '').replace(/\D/g, ''),
  motherEmail: form.motherEmail?.trim().toLowerCase() || '',
  address: form.address?.trim() || '',
  parentPassword: form.parentPassword || '',
  studentEmail: form.studentEmail?.trim().toLowerCase() || '',
  studentPassword: form.studentPassword || '',
  siblings: (form.siblings || []).map((sib) => ({
    ...sib,
    name: sib.name?.trim() || '',
    school: sib.school?.trim() || '',
    class: sib.class?.trim() || '',
  })),
});

const StudentForm = ({ initial, onSave, onCancel, saveLoading, classesData = [] }) => {
  const [form, setForm] = useState(() => ({ ...EMPTY_STUDENT, ...(initial || {}), classIds: initial?.classIds || [], classTimings: initial?.classTimings || {}, siblings: initial?.siblings || [], photo: null }));
  const [errors, setErrors] = useState({});
  const [showSiblings, setShowSiblings] = useState((initial?.siblings?.length || 0) > 0);
  const [photoPreview, setPhotoPreview] = useState(initial?.photo ? getPhotoUrl(initial.photo) : null);
  const fileRef = useRef();
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const Err = ({ k }) => errors[k] ? <p style={{ margin: '4px 0 0', fontSize: 11, color: '#E11D48', fontWeight: 600 }}>{errors[k]}</p> : null;
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('photo', file);
    const r = new FileReader();
    r.onload = ev => setPhotoPreview(ev.target.result);
    r.readAsDataURL(file);
  };
  const toggleClass = (cid) => setForm(f => {
    const ids = f.classIds.includes(cid) ? f.classIds.filter(x => x !== cid) : [...f.classIds, cid];
    const ct = { ...f.classTimings };
    if (!ids.includes(cid)) delete ct[cid]; 
    else {
      const cls = classesData.find(c => c.id === cid);
      if (!ct[cid] && cls) ct[cid] = ct[cls._id] || ct[cls.classId] || {};
    }
    return { ...f, classIds: ids, classTimings: ct };
  });
  const setTiming = (cid, field, val) => setForm(f => {
    const cls = classesData.find(c => c.id === cid);
    const currentTiming = f.classTimings[cid] || f.classTimings[cls?._id] || f.classTimings[cls?.classId] || {};
    return { ...f, classTimings: { ...f.classTimings, [cid]: { ...currentTiming, [field]: val } } };
  });
  const setHours = (cid, field, val) => setForm(f => {
    const cls = classesData.find(c => c.id === cid);
    const currentTiming = f.classTimings[cid] || f.classTimings[cls?._id] || f.classTimings[cls?.classId] || {};
    return { ...f, classTimings: { ...f.classTimings, [cid]: { ...currentTiming, [field]: val } } };
  });
  const validate = () => {
    const v = normalizeStudentForm(form);
    const e = {};
    if (!v.name) e.name = 'Name required';
    if (!v.phone) e.phone = 'Phone required';
    else if (!INDIAN_PHONE_RE.test(v.phone)) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!v.fatherName) e.fatherName = 'Father name required';
    if (!v.fatherMobile) e.fatherMobile = 'Mobile required';
    else if (!INDIAN_PHONE_RE.test(v.fatherMobile)) e.fatherMobile = 'Enter a valid 10-digit Indian mobile number';
    if (v.fatherEmail && !EMAIL_RE.test(v.fatherEmail)) e.fatherEmail = 'Enter a valid email address';
    if (v.motherEmail && !EMAIL_RE.test(v.motherEmail)) e.motherEmail = 'Enter a valid email address';
    if (v.motherMobile && !INDIAN_PHONE_RE.test(v.motherMobile)) e.motherMobile = 'Enter a valid 10-digit Indian mobile number';
    if (!v.classIds.length) e.classIds = 'Select at least one class';
    v.classIds.forEach((cid) => {
      const cls = classesData.find((item) => item.id === cid);
      const timing = v.classTimings?.[cid] || {};
      if (cls?.classType === 'FLEX_TIME' && (!timing.startTime || !timing.endTime)) {
        e.classIds = 'Set start and end time for all flexible classes';
      }
      if (cls?.classType === 'FLEX_TIME' && timing.startTime && timing.endTime && timing.startTime >= timing.endTime) {
        e.classIds = 'Flexible class end time must be after start time';
      }
      if (cls?.classType === 'FLEX_TIME' && !(Number(timing.assignedHours) > 0)) {
        e.classIds = 'Enter hours to assign for all flexible classes';
      }
    });
    if (!initial) {
      if (!v.fatherEmail) e.fatherEmail = 'Email required for parent login';
      if (!v.parentPassword || v.parentPassword.length < 6) e.parentPassword = 'Min 6 characters';
    }
    const filledSibling = v.siblings.find((sib) => sib.name || sib.class || sib.school || sib.dob);
    if (filledSibling && !filledSibling.name) {
      e.siblings = 'Sibling name required when adding sibling details';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* AY */}
      <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#F0FDFA)', border: '1px solid #BFDBFE', borderRadius: 12, padding: '13px 16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>Admission Session</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[CURRENT_AY, NEXT_AY].map(ay => {
            const active = form.admissionAY === ay;
            return (
              <button key={ay} type="button" onClick={() => setForm(f => ({ ...f, admissionAY: ay, admissionYear: parseInt(ay.split('-')[0]) }))}
                style={{ flex: 1, padding: '9px', borderRadius: 9, border: `2px solid ${active ? '#1E88E5' : '#E2E8F0'}`, background: active ? 'linear-gradient(135deg,#1E88E5,#1565C0)' : '#fff', color: active ? '#fff' : '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                {ay} <span style={{ fontSize: 10, opacity: 0.8 }}>{ay === NEXT_AY ? '(Next)' : '(Current)'}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Photo + Basic */}
      <Section title="Student Details" icon={GraduationCap} color="#1D4ED8">
        <div style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'center' }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 72, height: 72, borderRadius: 14, overflow: 'hidden', border: '2px solid #E9D5FF', background: photoPreview ? 'transparent' : 'linear-gradient(135deg,#E9D5FF,#DDD6FE)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
            {photoPreview ? <img src={photoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera size={20} color="#7E22CE" />}
          </div>
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} style={{ padding: '7px 13px', borderRadius: 8, border: '1px solid #E9D5FF', background: '#FAF5FF', color: '#7E22CE', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Camera size={12} /> {photoPreview ? 'Change' : 'Upload Photo'}
            </button>
            <p style={{ margin: '5px 0 0', fontSize: 10, color: '#94A3B8' }}>JPG/PNG/WEBP · Max 5MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={LS}>Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student's full name" style={{ ...IS, borderColor: errors.name ? '#E11D48' : '#E2E8F0' }} />
            <Err k="name" />
          </div>
          <div>
            <label style={LS}>Gender</label>
            <select value={form.gender} onChange={e => set('gender', e.target.value)} style={IS}>{['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}</select>
          </div>
          <div>
            <label style={LS}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={IS}><option>Active</option><option>Inactive</option></select>
          </div>
          <div>
            <label style={LS}>Date of Birth</label>
            <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} style={IS} />
          </div>
          <div>
            <label style={LS}>Joining Date</label>
            <input type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} style={IS} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={LS}>Phone *</label>
            <input value={form.phone} onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 10) set('phone', v); }} placeholder="9876543210" maxLength={10} style={{ ...IS, borderColor: errors.phone ? '#E11D48' : '#E2E8F0' }} />
            <Err k="phone" />
          </div>
        </div>
      </Section>
      {/* Father */}
      <Section title="Father's Info & Parent Login" icon={User} color="#1D4ED8">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={LS}>Name *</label>
            <input value={form.fatherName} onChange={e => set('fatherName', e.target.value)} placeholder="Father's name" style={{ ...IS, borderColor: errors.fatherName ? '#E11D48' : '#E2E8F0' }} />
            <Err k="fatherName" />
          </div>
          <div>
            <label style={LS}>Mobile *</label>
            <input value={form.fatherMobile} onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 10) set('fatherMobile', v); }} placeholder="Mobile" maxLength={10} style={{ ...IS, borderColor: errors.fatherMobile ? '#E11D48' : '#E2E8F0' }} />
            <Err k="fatherMobile" />
          </div>
          <div>
            <label style={LS}>Date of Birth</label>
            <input type="date" value={form.fatherDob} onChange={e => set('fatherDob', e.target.value)} style={IS} />
          </div>
          <div>
            <label style={LS}>Email {!initial && '*'}</label>
            <input type="email" value={form.fatherEmail} onChange={e => set('fatherEmail', e.target.value)} placeholder="For parent login" style={{ ...IS, borderColor: errors.fatherEmail ? '#E11D48' : '#E2E8F0' }} />
            <Err k="fatherEmail" />
          </div>
        </div>
        {!initial && (
          <div style={{ marginTop: 12, background: 'linear-gradient(135deg,#EFF6FF,#F0FDFA)', border: '1.5px solid #BFDBFE', borderRadius: 12, padding: '13px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <Key size={13} color="#1D4ED8" />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#1D4ED8' }}>Parent Login Password</p>
            </div>
            <input type="text" value={form.parentPassword || ''} onChange={e => set('parentPassword', e.target.value)} placeholder="Min 6 characters" style={{ ...IS, fontFamily: 'monospace', borderColor: errors.parentPassword ? '#E11D48' : '#BFDBFE' }} />
            <Err k="parentPassword" />
            <p style={{ margin: '5px 0 0', fontSize: 11, color: '#64748B' }}>💡 Share this with the parent after registration</p>
          </div>
        )}
        {!initial && (
          <div style={{ marginTop: 12, background: 'linear-gradient(135deg,#FAF5FF,#F3E8FF)', border: '1.5px solid #E9D5FF', borderRadius: 12, padding: '13px' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <Smartphone size={13} color="#7E22CE" />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#7E22CE' }}>Student Login Credentials</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ ...LS, marginBottom: 4 }}>Student Email (Optional)</label>
                <input type="email" value={form.studentEmail || ''} onChange={e => set('studentEmail', e.target.value)} placeholder="student@example.com" style={{ ...IS, borderColor: errors.studentEmail ? '#E11D48' : '#E2E8F0' }} />
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#64748B' }}>💡 If empty, parent email will be used</p>
              </div>
              <div>
                <label style={{ ...LS, marginBottom: 4 }}>Student Password</label>
                <input type="text" value={form.studentPassword || ''} onChange={e => set('studentPassword', e.target.value)} placeholder="Min 6 characters" style={{ ...IS, fontFamily: 'monospace', borderColor: errors.studentPassword ? '#E11D48' : '#E2E8F0' }} />
                {errors.studentPassword && <Err k="studentPassword" />}
                <p style={{ margin: '3px 0 0', fontSize: 10, color: '#64748B' }}>💡 Share with student after registration</p>
              </div>
            </div>
          </div>
        )}
        {initial && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: '#FFFBEB', borderRadius: 10, border: '1px solid #FCD34D', display: 'flex', gap: 8 }}>
            <AlertCircle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: 11, color: '#92400E' }}>Parent email: <strong>{initial.fatherEmail || 'Not set'}</strong>. Use Change Password to update.</p>
          </div>
        )}
      </Section>
      {/* Mother */}
      <Section title="Mother's Info (Optional)" icon={Heart} color="#7E22CE" bg="#FDF8FF">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div><label style={LS}>Name</label><input value={form.motherName} onChange={e => set('motherName', e.target.value)} placeholder="Mother's name" style={IS} /></div>
          <div><label style={LS}>Mobile</label><input value={form.motherMobile} onChange={e => { const v = e.target.value.replace(/\D/g,''); if (v.length <= 10) set('motherMobile', v); }} placeholder="Mobile" maxLength={10} style={IS} /></div>
          <div style={{ gridColumn: '2 / 3', marginTop: -6 }}><Err k="motherMobile" /></div>
          <div><label style={LS}>Date of Birth</label><input type="date" value={form.motherDob} onChange={e => set('motherDob', e.target.value)} style={IS} /></div>
          <div><label style={LS}>Email</label><input type="email" value={form.motherEmail} onChange={e => set('motherEmail', e.target.value)} placeholder="Email" style={{ ...IS, borderColor: errors.motherEmail ? '#E11D48' : '#E2E8F0' }} /><Err k="motherEmail" /></div>
        </div>
      </Section>
      {/* Address */}
      <Section title="Address" icon={MapPin} color="#0F766E">
        <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="Full home address" style={{ ...IS, resize: 'vertical' }} />
      </Section>
      {/* Siblings */}
      <Section title="Siblings" icon={Baby} color="#0D9488">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showSiblings ? 12 : 0 }}>
          {form.siblings.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, color: T.teal.text, background: T.teal.bg, padding: '2px 8px', borderRadius: 99 }}>{form.siblings.length} added</span>}
          <button type="button" onClick={() => setShowSiblings(!showSiblings)} style={{ padding: '5px 11px', borderRadius: 7, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
            {showSiblings ? <ChevronUp size={11} /> : <ChevronDown size={11} />} {showSiblings ? 'Hide' : 'Add Sibling'}
          </button>
        </div>
        {showSiblings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Err k="siblings" />
            {form.siblings.length === 0 ? <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>No siblings yet</p>
              : form.siblings.map((sib, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, padding: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Sibling {i + 1}</span>
                    <button type="button" onClick={() => setForm(f => ({ ...f, siblings: f.siblings.filter((_, idx) => idx !== i) }))} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: T.red.bg, color: T.red.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><label style={LS}>Name</label><input value={sib.name} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s) }))} style={IS} /></div>
                    <div><label style={LS}>Relation</label><select value={sib.relation} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, relation: e.target.value } : s) }))} style={IS}><option>Brother</option><option>Sister</option></select></div>
                    <div><label style={LS}>DOB</label><input type="date" value={sib.dob} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, dob: e.target.value } : s) }))} style={IS} /></div>
                    <div><label style={LS}>Class</label><input value={sib.class} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, class: e.target.value } : s) }))} placeholder="e.g. KG-A" style={IS} /></div>
                  </div>
                </div>
              ))}
            <button type="button" onClick={() => setForm(f => ({ ...f, siblings: [...f.siblings, { name: '', relation: 'Brother', dob: '', school: '', class: '' }] }))} style={{ width: '100%', padding: '9px', borderRadius: 9, border: '1.5px dashed #CBD5E1', background: '#fff', color: '#64748B', fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Plus size={12} /> Add Sibling
            </button>
          </div>
        )}
      </Section>
      {/* Classes */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={14} color="#1D4ED8" /></div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>Assign Classes *</h3>
          </div>
          {form.classIds.length > 0 && <span style={{ fontSize: 11, fontWeight: 700, background: T.blue.bg, color: T.blue.text, padding: '2px 9px', borderRadius: 99, border: `1px solid ${T.blue.border}` }}>{form.classIds.length} selected</span>}
        </div>
        {errors.classIds && <p style={{ margin: '0 0 8px', fontSize: 11, color: '#E11D48', fontWeight: 600 }}>{errors.classIds}</p>}
        <ClassAssignmentWidget classIds={form.classIds} classTimings={form.classTimings} onToggle={toggleClass} onTimingChange={setTiming} onHoursChange={setHours} classesData={classesData} />
      </div>
      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button onClick={() => { if (!saveLoading && validate()) onSave(normalizeStudentForm(form)); }} disabled={saveLoading} style={{ flex: 2, padding: '11px', borderRadius: 11, border: 'none', background: saveLoading ? '#93C5FD' : 'linear-gradient(135deg,#1E88E5,#1565C0)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: saveLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          {saveLoading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {initial ? 'Updating…' : 'Registering…'}</> : <>{initial ? '✅ Update Student' : '🎓 Register Student'}</>}
        </button>
        <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 11, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
};

// ─── Student Profile View (Centered Modal) ────────────────────────────────────
const StudentProfileView = ({ student, onClose, onEdit, classesData = [] }) => {
  const enrolledClasses = classesData.filter(c => student.classIds?.includes(c.id));
  const [from, to] = avatarColor(student.name);
  // The real flexi-hour allocation lives per-class in classTimings (not the
  // top-level paidFlexiHours/freeFlexiHours fields, which are usually 0) —
  // total it the same way StudentCard does, so "Hrs Left" here actually
  // matches what was purchased.
  const totalPaidPlan = enrolledClasses.reduce((s, c) => s + (student.classTimings?.[c.id]?.paidFlexiHours || 0), 0);
  const totalFreePlan = enrolledClasses.reduce((s, c) => s + (student.classTimings?.[c.id]?.freeFlexiHours || 0), 0);
  const totalConsumedPlan = enrolledClasses.reduce((s, c) => s + (student.classTimings?.[c.id]?.consumedFlexiHours || 0), 0) + (student.consumedFlexiHours || 0);
  const hasFlexiPlan = totalPaidPlan > 0 || totalFreePlan > 0;
  const rawLeftPlan = totalPaidPlan + totalFreePlan - totalConsumedPlan;
  const totalLeftPlan = Math.max(0, rawLeftPlan);
  // Students with no purchased plan can still rack up hours by staying at
  // the center after their fixed-time class ends — backend tracks that in
  // the top-level student.consumedFlexiHours, separate from the per-class
  // numbers above. AND a student who DOES have a plan can fall back into
  // "Extra Stay" once their allotted hours run out and the balance goes
  // negative — that overflow (rather than being silently clamped to 0) is
  // what overstayHours reports in that case.
  const overstayHours = hasFlexiPlan ? Math.max(0, -rawLeftPlan) : (Number(student.consumedFlexiHours) || 0);
  const hasOverstay = overstayHours > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg,${from},${to})`, borderRadius: 16, padding: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          <div style={{ border: '2.5px solid rgba(255,255,255,0.35)', borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
            <Avatar name={student.name} photo={student.photo} size={64} radius={12} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase' }}>Student</p>
            <h3 style={{ margin: '3px 0 2px', fontSize: 18, fontWeight: 900, color: '#fff' }}>{student.name}</h3>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: 'monospace' }}>{student.enrollmentId || '—'}</p>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: student.status === 'Active' ? 'rgba(34,197,94,0.25)' : 'rgba(100,116,139,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>{student.status}</span>
              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>{student.gender}</span>
              {student.admissionAY && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>AY {student.admissionAY}</span>}
            </div>
          </div>
          <button onClick={onEdit} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}><Edit2 size={13} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7, marginTop: 12 }}>
          {[
            { label: 'Classes', val: enrolledClasses.length },
            { label: 'Siblings', val: student.siblings?.length || 0 },
            hasOverstay
              ? { label: 'Extra Hrs', val: fmtHrs(overstayHours) }
              : { label: 'Hrs Left', val: hasFlexiPlan ? fmtHrs(totalLeftPlan) : '0.00' },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.13)', borderRadius: 9, padding: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#fff' }}>{val}</p>
              <p style={{ margin: '1px 0 0', fontSize: 9, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Parent Login */}
      <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 12, padding: '13px', border: '1.5px solid #BFDBFE' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <Key size={14} color="#1D4ED8" /><p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#1D4ED8' }}>Parent Login</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: '#fff', borderRadius: 9, padding: '9px 11px', border: '1px solid #BFDBFE' }}>
            <p style={{ margin: 0, fontSize: 9, color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase' }}>Email</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#0F172A', fontFamily: 'monospace', wordBreak: 'break-all' }}>{student.fatherEmail || '—'}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 9, padding: '9px 11px', border: '1px solid #BFDBFE' }}>
            <p style={{ margin: 0, fontSize: 9, color: '#1D4ED8', fontWeight: 700, textTransform: 'uppercase' }}>Parent</p>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{student.fatherName || '—'}</p>
          </div>
        </div>
      </div>
      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { icon: Phone, label: 'Phone', val: student.phone, color: 'blue' },
          { icon: Calendar, label: 'DOB', val: formatDate(student.dob), color: 'purple' },
          { icon: CalendarDays, label: 'Joined', val: formatDate(student.joiningDate), color: 'teal' },
          { icon: Hash, label: 'Admission No', val: student.enrollmentId, color: 'amber' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} style={{ background: T[color].bg, borderRadius: 10, padding: '10px 12px', border: `1px solid ${T[color].border}` }}>
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}><Icon size={11} color={T[color].text} /><span style={{ fontSize: 9, fontWeight: 700, color: T[color].text, textTransform: 'uppercase' }}>{label}</span></div>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{val || '—'}</p>
          </div>
        ))}
      </div>
      {/* Father */}
      {student.fatherName && (
        <div style={{ background: '#EFF6FF', borderRadius: 12, padding: '12px 14px', border: '1px solid #BFDBFE' }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 9 }}>
            <User size={13} color="#1D4ED8" /><span style={{ fontSize: 12, fontWeight: 800, color: '#1D4ED8' }}>Father</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ label: 'Name', val: student.fatherName }, { label: 'Mobile', val: student.fatherMobile }, student.fatherEmail && { label: 'Email', val: student.fatherEmail }, student.fatherDob && { label: 'DOB', val: formatDate(student.fatherDob) }].filter(Boolean).map(({ label, val }) => (
              <div key={label}><p style={{ margin: 0, fontSize: 9, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>{label}</p><p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{val || '—'}</p></div>
            ))}
          </div>
        </div>
      )}
      {/* Mother */}
      {student.motherName && (
        <div style={{ background: '#FAF5FF', borderRadius: 12, padding: '12px 14px', border: '1px solid #E9D5FF' }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginBottom: 9 }}>
            <Heart size={13} color="#7E22CE" /><span style={{ fontSize: 12, fontWeight: 800, color: '#7E22CE' }}>Mother</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[{ label: 'Name', val: student.motherName }, { label: 'Mobile', val: student.motherMobile }, student.motherEmail && { label: 'Email', val: student.motherEmail }, student.motherDob && { label: 'DOB', val: formatDate(student.motherDob) }].filter(Boolean).map(({ label, val }) => (
              <div key={label}><p style={{ margin: 0, fontSize: 9, color: '#64748B', textTransform: 'uppercase', fontWeight: 700 }}>{label}</p><p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{val || '—'}</p></div>
            ))}
          </div>
        </div>
      )}
      {/* Enrolled Classes */}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classes ({enrolledClasses.length})</p>
        {enrolledClasses.length === 0
          ? <div style={{ padding: 16, textAlign: 'center', background: '#F8FAFC', borderRadius: 10, border: '1.5px dashed #E2E8F0' }}><p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>No classes enrolled</p></div>
          : enrolledClasses.map(cls => {
            const ti = getClassTimingLabel(student, cls);
            const tc = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';
            const TIcon = cls.classType === 'FIXED_TIME' ? AlarmClock : cls.classType === 'FLEX_TIME' ? Clock : Hourglass;
            return (
              <div key={cls.id} style={{ borderRadius: 12, border: `1px solid ${T[tc].border}`, background: T[tc].bg, padding: '11px 13px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: T[tc].solid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TIcon size={12} color="#fff" /></div>
                    <div><p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{cls.name}</p><p style={{ margin: 0, fontSize: 9, color: '#94A3B8' }}>§{cls.section}</p></div>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#fff', color: T[tc].text, border: `1px solid ${T[tc].border}` }}>{CLASS_TYPES[cls.classType]?.label}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                  <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 7, padding: '7px 9px' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>{cls.classType === 'HOURS_BASED' ? 'Hours' : 'Time'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: T[tc].text }}>{ti.label}</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 7, padding: '7px 9px' }}>
                    <p style={{ margin: 0, fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Schedule</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{formatDays(cls.days)}</p>
                  </div>
                </div>
                {/* Flexi hours are tracked per-class in classTimings regardless of classType,
                    so this block is shown for every enrolled class, not just HOURS_BASED. */}
                {(() => {
                  const t = student.classTimings?.[cls.id] || {};
                  const paid = t.paidFlexiHours || 0;
                  const free = t.freeFlexiHours || 0;
                  const consumed = t.consumedFlexiHours || 0;
                  const left = Math.max(0, paid + free - consumed);
                  const hasFlexi = paid > 0 || free > 0 || consumed > 0;
                  if (!hasFlexi) return null;
                  return (
                    <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                      {[{ l: 'Paid', v: fmtHrs(paid), c: 'amber' }, { l: 'Free', v: fmtHrs(free), c: 'green' }, { l: 'Used', v: fmtHrs(consumed), c: 'orange' }, { l: 'Left', v: fmtHrs(left), c: left < 6 ? 'red' : 'teal' }].map(({ l, v, c }) => (
                        <div key={l} style={{ background: '#fff', borderRadius: 7, padding: '6px 4px', textAlign: 'center', border: `1px solid ${T[c]?.border}` }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: T[c]?.text }}>{v}</p>
                          <p style={{ margin: 0, fontSize: 8, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{l}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            );
          })}
      </div>
      {/* Extra Stay Hours — no flexi plan purchased, but stayed back after class */}
      {hasOverstay && (
        <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #FED7AA' }}>
          <div style={{ padding: '8px 12px', background: '#FFF7ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Clock size={13} color="#C2410C" /><span style={{ fontSize: 10.5, fontWeight: 800, color: '#C2410C', textTransform: 'uppercase' }}>Extra Stay Hours</span></div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '2px 8px', borderRadius: 99 }}>⚠ NO PLAN</span>
          </div>
          <div style={{ padding: '10px 12px', background: '#fff' }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#C2410C' }}>{fmtHrs(overstayHours)}</p>
            <p style={{ margin: '3px 0 0', fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>Fixed-time class khatam hone ke baad bhi center pe ruka hai — is student ke liye koi flexi hours (paid/free) allotted nahi hai, isliye ye extra time alag se track ho raha hai.</p>
          </div>
        </div>
      )}
      {/* Siblings */}
      {student.siblings?.length > 0 && (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siblings ({student.siblings.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {student.siblings.map((sib, i) => (
              <div key={i} style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', border: '1px solid #E2E8F0', display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: sib.relation === 'Sister' ? 'linear-gradient(135deg,#EC4899,#DB2777)' : 'linear-gradient(135deg,#3B82F6,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>
                  {sib.name?.charAt(0) || (sib.relation === 'Sister' ? '♀' : '♂')}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0F172A' }}>{sib.name || `Sibling ${i + 1}`}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    {[sib.relation, sib.class && `Class ${sib.class}`, sib.school, sib.dob && formatDate(sib.dob)].filter(Boolean).map(v => <span key={v} style={{ fontSize: 10, color: '#64748B' }}>{v}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid #F1F5F9' }}>
        <button onClick={onEdit} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', background: T.blue.bg, color: T.blue.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Edit2 size={13} /> Edit Profile</button>
        <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
};

// ─── Student Card ─────────────────────────────────────────────────────────────
const StudentCard = ({ student, onView, onEdit, onQR, onToggleStatus, onFlexReport, classesData = [] }) => {
  const enrolled = classesData.filter(c => student.classIds?.includes(c.id));
  const [from, to] = avatarColor(student.name);
  // Flexi hours are stored per-class in classTimings for every class type (Fixed/Flex/Hours),
  // so we total them across ALL enrolled classes, not just HOURS_BASED ones.
  const hourClasses = enrolled;
  const totalPaid = hourClasses.reduce((s, c) => s + (student.classTimings?.[c.id]?.paidFlexiHours || 0), 0);
  const totalFree = hourClasses.reduce((s, c) => s + (student.classTimings?.[c.id]?.freeFlexiHours || 0), 0);
  const totalConsumed = hourClasses.reduce((s, c) => s + (student.classTimings?.[c.id]?.consumedFlexiHours || 0), 0) + (student.consumedFlexiHours || 0);
  const rawLeft = totalPaid + totalFree - totalConsumed;
  const totalLeft = Math.max(0, rawLeft);
  // "Has a flexi plan" = actually paid for or was given hours. Students with
  // no plan at all (0 paid, 0 free) shouldn't be judged against a Paid/Free/
  // Used/Left box that was never meant for them.
  const hasAnyFlexi = totalPaid > 0 || totalFree > 0;
  const critical = hasAnyFlexi && totalLeft < 6;
  // Students with NO flexi plan can still rack up hours by staying at the
  // center after their fixed-time class ends. The backend tracks that as
  // student.consumedFlexiHours (top-level, separate from the per-class
  // classTimings numbers used above) — show it as its own "Extra Stay" box
  // instead of squeezing it into the purchased-hours grid. AND a student
  // who DOES have a plan falls back into "Extra Stay" once their allotted
  // hours are used up and the balance goes negative — that overflow amount
  // (instead of being silently clamped to 0) is what overstayHours reports.
  const overstayHours = hasAnyFlexi ? Math.max(0, -rawLeft) : (Number(student.consumedFlexiHours) || 0);
  const hasOverstay = overstayHours > 0;
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1.5px solid #F1F5F9', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all .2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${from},${to})`, padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ border: '2px solid rgba(255,255,255,0.35)', borderRadius: 13, overflow: 'hidden', flexShrink: 0 }}>
            <Avatar name={student.name} photo={student.photo} size={48} radius={11} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{student.name}</h3>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace' }}>{student.enrollmentId || '—'}</p>
          </div>
          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', background: student.status === 'Active' ? 'rgba(34,197,94,0.2)' : 'rgba(100,116,139,0.2)', color: student.status === 'Active' ? '#86EFAC' : '#CBD5E1', border: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap', flexShrink: 0 }}>{student.status}</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
        {/* Contact */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {/* Phone with call button */}
          <div style={{ background: '#F8FAFC', borderRadius: 9, padding: '8px 10px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}><Phone size={9} color="#94A3B8" /><span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Phone</span></div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#334155' }}>{student.phone || '—'}</p>
            </div>
            {student.phone && (
              <a href={`tel:${student.phone.replace(/\s/g, '')}`} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all .15s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.transform = 'scale(1)'; }}
                title={`Call ${student.phone}`}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </a>
            )}
          </div>
          {/* Father name + mobile */}
          {student.fatherName && (
            <div style={{ background: '#F8FAFC', borderRadius: 9, padding: '8px 10px', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}><User size={9} color="#94A3B8" /><span style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Father</span></div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#334155' }}>{student.fatherName}</p>
              </div>
              {student.fatherMobile && (
                <a href={`tel:${student.fatherMobile.replace(/\s/g, '')}`} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all .15s', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.transform = 'scale(1)'; }}
                  title={`Call ${student.fatherMobile}`}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </a>
              )}
            </div>
          )}
          {/* Mother mobile */}
          {student.motherName && student.motherMobile && (
            <div style={{ background: '#FAF5FF', borderRadius: 9, padding: '8px 10px', border: '1px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}><User size={9} color="#7E22CE" /><span style={{ fontSize: 9, color: '#7E22CE', fontWeight: 700, textTransform: 'uppercase' }}>Mother</span></div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#334155' }}>{student.motherName}</p>
              </div>
              <a href={`tel:${student.motherMobile.replace(/\s/g, '')}`} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all .15s', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#059669'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.transform = 'scale(1)'; }}
                title={`Call ${student.motherMobile}`}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              </a>
            </div>
          )}
        </div>
        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {student.gender && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#F1F5F9', color: '#475569' }}>{student.gender === 'Male' ? '👦' : student.gender === 'Female' ? '👧' : '🧑'} {student.gender}</span>}
          {enrolled.length > 0 && enrolled.slice(0, 3).map(cls => (
            <span key={cls.id} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#F0FDFA', color: '#0F766E' }}>
              📚 {cls.name}{cls.section ? ` (${cls.section})` : ''}
            </span>
          ))}
          {enrolled.length > 3 && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#B45309' }}>+{enrolled.length - 3} more</span>}
          {student.siblings?.length > 0 && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#FEF3C7', color: '#B45309' }}>👶 {student.siblings.length}</span>}
          {student.admissionAY && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: '#FAF5FF', color: '#7E22CE' }}>{student.admissionAY}</span>}
        </div>
        {/* Flexi Hours */}
        {hasAnyFlexi && (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${critical ? '#FECACA' : '#BBF7D0'}` }}>
            <div style={{ padding: '6px 10px', background: critical ? '#FEF2F2' : '#F0FDF4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}><Hourglass size={11} color={critical ? '#DC2626' : '#16A34A'} /><span style={{ fontSize: 9, fontWeight: 700, color: critical ? '#DC2626' : '#16A34A', textTransform: 'uppercase' }}>Flexi Hours</span></div>
              {critical && <span style={{ fontSize: 9, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: 99 }}>⚠ LOW</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', padding: '8px 6px', gap: 4, background: '#fff' }}>
              {[{ l: 'Paid', v: fmtHrs(totalPaid), c: 'amber' }, { l: 'Free', v: fmtHrs(totalFree), c: 'green' }, { l: 'Used', v: fmtHrs(totalConsumed), c: 'orange' }, { l: 'Left', v: fmtHrs(totalLeft), c: critical ? 'red' : 'teal' }].map(({ l, v, c }) => (
                <div key={l} style={{ textAlign: 'center', padding: '5px 3px', borderRadius: 7, background: T[c]?.bg, border: `1px solid ${T[c]?.border}` }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: T[c]?.text }}>{v}</p>
                  <p style={{ margin: 0, fontSize: 8, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Extra Stay Hours — no flexi plan purchased, but stayed back after class */}
        {hasOverstay && (
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #FED7AA' }}>
            <div style={{ padding: '6px 10px', background: '#FFF7ED', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}><Clock size={11} color="#C2410C" /><span style={{ fontSize: 9, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>Extra Stay</span></div>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '1px 6px', borderRadius: 99 }}>⚠ NO PLAN</span>
            </div>
            <div style={{ padding: '8px 10px', background: '#fff', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#C2410C' }}>{fmtHrs(overstayHours)}</p>
              <p style={{ margin: '2px 0 0', fontSize: 8.5, color: '#94A3B8', fontWeight: 600 }}>Class time ke baad center pe ruka — koi flexi hours allotted nahi</p>
            </div>
          </div>
        )}
        {/* Class Pills */}
        {enrolled.length > 0 && (
          <div>
            <p style={{ margin: '0 0 5px', fontSize: 9, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Classes</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {enrolled.slice(0, 2).map(cls => {
                const ti = getClassTimingLabel(student, cls);
                const tc = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';
                const TIcon = cls.classType === 'FIXED_TIME' ? AlarmClock : cls.classType === 'FLEX_TIME' ? Clock : Hourglass;
                return (
                  <div key={cls.id} style={{ borderRadius: 8, border: `1px solid ${T[tc].border}`, background: T[tc].bg, padding: '6px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{cls.name}{cls.section ? ` (${cls.section})` : ''}</span>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><TIcon size={9} color={T[tc].text} /><span style={{ fontSize: 10, color: T[tc].text, fontWeight: 600 }}>{ti.label}</span></div>
                  </div>
                );
              })}
              {enrolled.length > 2 && <p style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', margin: 0 }}>+{enrolled.length - 2} more</p>}
            </div>
          </div>
        )}
        {/* Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8, borderTop: '1px solid #F1F5F9', marginTop: 'auto' }}>
          {[
            { label: 'View', icon: Eye, bg: '#EFF6FF', color: '#1D4ED8', hoverBg: '#1D4ED8', action: () => onView(student) },
            { label: 'Edit', icon: Edit2, bg: '#FFFBEB', color: '#B45309', hoverBg: '#D97706', action: () => onEdit(student) },
            { label: 'QR', icon: QrCode, bg: '#FAF5FF', color: '#7E22CE', hoverBg: '#9333EA', action: () => onQR(student) },
            { label: 'Flex', icon: Hourglass, bg: '#F0FDFA', color: '#0F766E', hoverBg: '#0D9488', action: () => onFlexReport(student) },
            {label: student.status === 'Active' ? 'Disable' : 'Enable', icon: Activity, bg: student.status === 'Active' ? '#FFF1F2' : '#F0FDF4', color: student.status === 'Active' ? '#BE123C' : '#15803D', hoverBg: student.status === 'Active' ? '#E11D48' : '#16A34A', action: () => onToggleStatus(student) },
          ].map(({ label, icon: Icon, bg, color, hoverBg, action }) => (
            <button key={label} onClick={action} style={{ flex: 1, padding: '7px', borderRadius: 9, border: 'none', background: bg, color, fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; }}>
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminStudentsPage = () => {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState([]);
  const [classesData, setClassesData] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | 'qr'
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Debouncing ke liye naya state
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'error' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [saveLoading, setSaveLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // Default to grid
  const saveLockRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);

  const handleNavigateToRegister = () => {
    navigate('/teacher/manage-students/register');
  };

  const mapStudent = (s) => {
    if (!s) return null;
    return {
      id: s._id || s.id, _id: s._id || s.id,
      name: s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim(),
      enrollmentId: s.admissionNo || '',
      qrCode: s.qrCode || `BRAINBUILDER-STU-${s.admissionNo || s._id}`,
      gender: s.gender || 'Male', dob: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
      joiningDate: s.admissionDate ? s.admissionDate.split('T')[0] : '',
      status: s.status || 'Active',
      phone: s.parentDetails?.primaryPhone || '',
      fatherName: s.parentDetails?.fatherName || s.parentDetails?.primaryName || '',
      fatherMobile: s.parentDetails?.fatherPhone || s.parentDetails?.primaryPhone || '',
      fatherDob: s.fatherDob ? s.fatherDob.split('T')[0] : '',
      fatherEmail: s.fatherEmail || s.parentDetails?.primaryEmail || '',
      motherName: s.parentDetails?.motherName || '', motherMobile: s.parentDetails?.motherPhone || '',
      motherDob: s.motherDob ? s.motherDob.split('T')[0] : '', motherEmail: s.motherEmail || '',
      address: s.address?.street || '',
      admissionYear: s.admissionYear || null, admissionAY: s.admissionAY || '',
      className: s.className || '', section: s.section || '',
      classIds: s.classIds || [],
      classTimings: (() => { const ct = s.classTimings; if (!ct) return {}; if (typeof ct === 'object' && !Array.isArray(ct)) return ct; if (Array.isArray(ct)) return Object.fromEntries(ct); return {}; })(),
      paidFlexiHours: s.paidFlexiHours || 0, freeFlexiHours: s.freeFlexiHours || 0, consumedFlexiHours: s.consumedFlexiHours || 0,
      siblings: s.siblings || [], photo: s.photo || null,
    };
  };

  // Fetch classes from API (replaces hardcoded array)
  useEffect(() => {
    const fetchClasses = async () => {
      setClassesLoading(true);
      try {
        const res = await getClassesAPI({ limit: 100 });
        const d = res;
        const mapped = (d.data || []).map(c => ({
          id: c._id,
          _id: c._id,
          classId: c.classId || null,
          name: c.name || '',
          section: c.section || '',
          classType: c.classType,
          startTime: c.startTime || null,
          endTime: c.endTime || null,
          days: c.days || [],
          level: c.level || 0,
          baseFee: c.baseFee || 0,
          feeType: c.feeType || 'MONTHLY',
          monthlyFreeHours: c.monthlyFreeHours ?? 0,
        }));
        setClassesData(mapped);
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      setPageLoading(true);
      setError('');
      const params = { page: pagination.page, limit: pagination.limit };
      if (search?.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (classFilter !== 'all') {
        const cls = classesData.find(c => c.id === classFilter);
        if (cls) {
          params.className = cls.name;
          if (cls.section) params.section = cls.section;
        }
      }
      const res = await getStudentsAPI(params);

      // Handle different response formats safely
      let d;
      if (res && res.data && Array.isArray(res.data)) {
        // Format: { data: [...], total, ... }
        d = { data: res.data, total: res.total || res.data.length, pages: res.pages || 1 };
      } else if (res && res.data && res.data.data) {
        // Format: { data: { data: [...], total, ... } }
        d = res.data;
      } else if (res && res.students) {
        // Format: { students: [...], total, ... }
        d = { data: res.students, total: res.total || res.students.length, pages: res.pages || 1 };
      } else if (res && Array.isArray(res)) {
        // Format: [...]
        d = { data: res, total: res.length, pages: 1 };
      } else {
        d = { data: [], total: 0, pages: 0 };
      }

      const rawStudents = d.data || [];

      const mappedStudents = rawStudents.map(mapStudent).filter(Boolean);

      setStudentData(mappedStudents);
      setPagination(p => ({ ...p, total: d.total || 0, pages: d.pages || 0 }));
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to load students');
      setStudentData([]); // Ensure empty state on error
    } finally {
      setPageLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, classFilter, classesData]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Reset page on filter change
  useEffect(() => {
    setPagination(p => ({ ...p, page: 1 }));
  }, [search, classFilter, statusFilter]);

  // Debouncing effect: Typing rukne ke 500ms baad search API call hogi
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfileAPI();
        const profile = res?.data?.data || res?.data || res;
        setHasPermission(!!profile?.permissions?.canManageStudents);
      } catch (e) {
        setHasPermission(false);
      }
    })();
  }, []);

  const clearFilters = () => {
    setSearch('');
    setClassFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = search || classFilter !== 'all' || statusFilter !== 'all';

  const open = (type, s = null) => {
    if (type === 'edit' && s) {
      const studentIdForUrl = s.enrollmentId || s._id;
      navigate(`/teacher/manage-students/edit/${studentIdForUrl}`);
      return;
    }
    if (type === 'view' && s) {
      const studentIdForUrl = s.admissionNo || s._id;
      navigate(`/teacher/manage-students/${studentIdForUrl}`);
      return;
    }
    setSelected(s);
    setModal(type);
  };
  const close = () => { setModal(null); setSelected(null); };

  const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

  const handleSave = async (form) => {
    if (saveLockRef.current || saveLoading) return;
    saveLockRef.current = true;
    setSaveLoading(true); setError('');
    try {
      const classIdsToSend = form.classIds || [];
      const classTimingsToSend = {};
      for (const id of classIdsToSend) {
        const cls = classesData.find(c => c.id === id || c._id === id);
        if (cls) {
          classTimingsToSend[id] = form.classTimings?.[id] || form.classTimings?.[cls.classId] || form.classTimings?.[cls._id] || {};
        }
      }

      const { paid: totalPaidFlexiHours, free: totalFreeFlexiHours } = sumFlexiFromClassTimings(classIdsToSend, classTimingsToSend, classesData);

      if (selected?._id) {
        if (classIdsToSend.length > 0 && !classIdsToSend.every(isValidObjectId)) {
          setError('Invalid class IDs provided');
          return;
        }
        const body = { firstName: form.name?.split(' ')[0], lastName: form.name?.split(' ').slice(1).join(' ') || '.', dateOfBirth: form.dob || null, gender: form.gender, status: form.status, admissionYear: form.admissionYear, admissionAY: form.admissionAY, classIds: classIdsToSend, classTimings: classTimingsToSend, paidFlexiHours: totalPaidFlexiHours, freeFlexiHours: totalFreeFlexiHours, consumedFlexiHours: form.consumedFlexiHours || 0, siblings: form.siblings, fatherDob: form.fatherDob || null, fatherEmail: form.fatherEmail || '', motherDob: form.motherDob || null, motherEmail: form.motherEmail || '', address: { street: form.address || '' } };
        const res = await updateStudentAPI(selected._id, body);
        const updated = mapStudent(res.data.data);
        const feeSync = await syncFeeEnrollmentsForClasses({
          studentId: selected._id,
          classIds: classIdsToSend,
          previousClassIds: selected.classIds || [],
          classesData,
          classTimings: classTimingsToSend,
        });
        setStudentData(p => p.map(s => s._id === selected._id ? updated : s));
        close();
        if (feeSync.failed.length > 0) {
          setToast({ message: `Student updated, but fee enrollment failed for ${feeSync.failed.map(f => f.name).join(', ')}. Please ask admin to enroll from Fee Hub.`, type: 'warning' });
        } else if (feeSync.enrolled.length > 0) {
          setToast({ message: `Student updated and fee enrolled for ${feeSync.enrolled.join(', ')}.`, type: 'success' });
        } else {
          setToast({ message: 'Student updated successfully.', type: 'success' });
        }
      } else {
        if (classIdsToSend.length > 0 && !classIdsToSend.every(isValidObjectId)) {
          setError('Invalid class IDs provided');
          return;
        }
        const fd = new FormData();
        const np = (form.name || '').trim().split(' ');
        fd.append('firstName', np[0] || ''); fd.append('lastName', np.slice(1).join(' ') || '.');
        if (form.dob) fd.append('dateOfBirth', form.dob);
        fd.append('gender', form.gender || 'Male'); fd.append('status', form.status || 'Active');
        if (form.joiningDate) fd.append('admissionDate', form.joiningDate);
        if (form.admissionYear) fd.append('admissionYear', String(form.admissionYear));
        if (form.admissionAY) fd.append('admissionAY', form.admissionAY);
        if (form.fatherDob) fd.append('fatherDob', form.fatherDob);
        if (form.fatherEmail) fd.append('fatherEmail', form.fatherEmail);
        if (form.motherDob) fd.append('motherDob', form.motherDob);
        if (form.motherEmail) fd.append('motherEmail', form.motherEmail);
        fd.append('paidFlexiHours', String(totalPaidFlexiHours)); fd.append('freeFlexiHours', String(totalFreeFlexiHours)); fd.append('consumedFlexiHours', String(form.consumedFlexiHours || 0));
        fd.append('classIds', JSON.stringify(classIdsToSend || [])); fd.append('classTimings', JSON.stringify(classTimingsToSend || {})); fd.append('siblings', JSON.stringify(form.siblings || []));
        if (classIdsToSend?.length > 0) { const fc = classesData.find(c => c.id === classIdsToSend[0]); if (fc) { fd.append('className', fc.name); fd.append('section', fc.section || ''); } }
        fd.append('parent', JSON.stringify({ primaryName: form.fatherName || 'Parent', primaryEmail: form.fatherEmail || '', primaryPhone: form.fatherMobile || form.phone || '', password: form.parentPassword || 'parent@123', relation: 'Father', fatherName: form.fatherName || '', fatherPhone: form.fatherMobile || '', motherName: form.motherName || '', motherPhone: form.motherMobile || '' }));
        fd.append('address', JSON.stringify({ street: form.address || '' }));
        if (form.photo) fd.append('photo', form.photo);
        const res = await createStudentAPI(fd);
        const newStu = mapStudent(res.data.data?.student || res.data.data);
        const feeSync = await syncFeeEnrollmentsForClasses({
          studentId: newStu?._id,
          classIds: classIdsToSend,
          previousClassIds: [],
          classesData,
          classTimings: classTimingsToSend,
        });
        setStudentData(p => [newStu, ...p]);
        
        // Get parent account details
        const pa = res.data.data?.parentAccount;
        const studentData = res.data.data?.student || {};
        
        if (pa) {
          const creds = { 
            name: pa.name, 
            email: pa.email, 
            password: form.parentPassword || 'parent@123', 
            parentPhone: form.fatherMobile || form.phone || '', 
            fatherPhone: form.fatherMobile || '', 
            motherPhone: form.motherMobile || '',
            studentPhone: studentData.phone || form.phone || '',
            studentEmail: studentData.email || form.studentEmail || '',
            studentPassword: form.studentPassword || 'student@123',
            studentName: form.name
          };
          
          setCredentials(creds);
          if (feeSync.failed.length > 0) {
            setToast({ message: `Student created, but fee enrollment failed for ${feeSync.failed.map(f => f.name).join(', ')}. Please ask admin to enroll from Fee Hub.`, type: 'warning' });
          } else if (feeSync.enrolled.length > 0) {
            setToast({ message: `Student created and fee enrolled for ${feeSync.enrolled.join(', ')}.`, type: 'success' });
          }
          // Don't close modal or navigate - let user see and manually close credentials modal
        } else {
          close();
          if (feeSync.failed.length > 0) {
            setToast({ message: `Student created, but fee enrollment failed for ${feeSync.failed.map(f => f.name).join(', ')}. Please ask admin to enroll from Fee Hub.`, type: 'warning' });
          } else if (feeSync.enrolled.length > 0) {
            setToast({ message: `Student created and fee enrolled for ${feeSync.enrolled.join(', ')}.`, type: 'success' });
          }
        }
      }
    } catch (e) {
      const rawMessage = e.response?.data?.message || e.response?.data?.error || 'Failed to save student';
      const friendlyMessage = /duplicate value entered for admissionNo/i.test(rawMessage)
        ? 'Student save do baar trigger hua ya backend ne duplicate admission number generate kiya. Ek baar phir try kijiye; agar issue repeat ho to backend admission number generator check karna padega.'
        : rawMessage;
      setToast({ message: friendlyMessage, type: 'error' });
    } finally {
      setSaveLoading(false);
      saveLockRef.current = false;
    }
  };

  // Status Active/Inactive Toggle karne ka function
  const handleStatusToggle = async (student) => {
    const newStatus = student.status === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to mark ${student.name} as ${newStatus}?`)) return;

    try {
      // Backend api call
      await updateStudentAPI(student._id, { status: newStatus });

      // UI update
      setStudentData(prev => prev.map(s =>
        s._id === student._id ? { ...s, status: newStatus } : s
      ));
      setToast({ message: `Student marked as ${newStatus} successfully`, type: 'success' });
    } catch (e) {
      setToast({ message: 'Failed to update status', type: 'error' });
    }
  };
 
  const stats = [
    { label: 'Total', val: pagination.total || studentData.length, icon: Users, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    // { label: 'Active', val: studentData.filter(s => s.status === 'Active').length, icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    { label: 'Low Hours', val: studentData.filter(s => s.status === 'Active' && isHoursCritical(s)).length, icon: AlertTriangle, color: '#DC2626', bg: '#FFF1F2', border: '#FECDD3' },
    // { label: 'Classes', val: classesData.length, icon: BookOpen, color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
    // { label: 'Pending Fee(STD)', val: classesData.length, icon: BookOpen, color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
  ];

  return (
    <>
      {hasPermission === false && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, background: '#fff', borderRadius: 16, border: '1.5px solid #E9ECF0' }}>
            <Lock size={48} color="#94A3B8" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: '16px 0 8px' }}>Access Restricted</h2>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>You don't have permission to manage students. Contact an administrator.</p>
            <button onClick={() => navigate('/teacher/manage-students')} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Back to Students</button>
          </div>
        </div>
      )}
      {hasPermission === null && (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#2563EB' }} />
        </div>
      )}
      {hasPermission === true && (
        <div style={{ minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes modalIn { from { opacity:0; transform:scale(.96) translateY(8px); } to { opacity:1; transform:none; } }
        input:focus, select:focus, textarea:focus { border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.07); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        @media (max-width: 768px) {
          .filt { flex-direction: column !important; align-items: stretch !important; }
          .filt > * { width: 100% !important; max-width: 100% !important; }
          .filt-toggle button { flex: 1 !important; justify-content: center !important; }
        }
        @media (max-width: 480px) {
          .stu-grid { grid-template-columns: 1fr !important; }
          .stats-row { grid-template-columns: 1fr 1fr !important; }
          .hdr { flex-direction: column !important; align-items: stretch !important; }
        }
        @media (min-width: 481px) and (max-width: 900px) {
          .stu-grid { grid-template-columns: repeat(2,1fr) !important; }
          .stats-row { grid-template-columns: repeat(2,1fr) !important; }
        }
        @media (min-width: 901px) {
          .stu-grid { grid-template-columns: repeat(3,1fr) !important; }
          .stats-row { grid-template-columns: repeat(4,1fr) !important; }
        }
      `}</style>
      {/* Header */}
      <div className="hdr" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>Student Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>Register students, assign  s</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
          <button onClick={() => navigate('/teacher/reports/flexi-hours')} title="Comprehensive flex report for all students" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#F0FDFA', color: '#0F766E', border: '1.5px solid #99F6E4', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#0D9488'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.color = '#0F766E'; }}>
            <Zap size={15} /> Flex Reports
          </button>
          <button onClick={() => navigate('/teacher/flexi-hours-history')} title="Flexi hours history - view consumption by date & time" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#fff', color: '#B45309', border: '1.5px solid #FCD34D', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Hourglass size={15} /> Flexi Report
          </button>
          <button onClick={handleNavigateToRegister} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: 'linear-gradient(135deg,#1E88E5,#1565C0)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(30,136,229,0.3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            <UserPlus size={15} /> Register Student
          </button>
        </div>
      </div>
      {/* Error */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
          <AlertTriangle size={15} color="#E11D48" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#BE123C', flex: 1 }}>{error}</p>
          <button onClick={() => setError('')} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#FECDD3', color: '#BE123C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
        </div>
      )}
      {/* Stats */}
      <div className="stats-row" style={{ display: 'grid', gap: 12, marginBottom: 18 }}>
        {stats.map(({ label, val, icon: Icon, color, bg, border }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #F1F5F9', boxShadow: '0 1px 6px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon size={18} color={color} /></div>
            <div><p style={{ margin: 0, fontSize: 10, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{label}</p><p style={{ margin: '2px 0 0', fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{val}</p></div>
          </div>
        ))}
      </div>
      {/* Filters */}
      <div className="filt" style={{ background: '#fff', borderRadius: 14, padding: '12px 16px', border: '1px solid #F1F5F9', display: 'flex', gap: 9, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search name, ID, phone…"
            style={{ ...IS, paddingLeft: 32, background: '#F8FAFC' }}
          />
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          style={{ ...IS, width: 'auto', minWidth: 160, background: classFilter !== 'all' ? '#EFF6FF' : '#F8FAFC', borderColor: classFilter !== 'all' ? '#BFDBFE' : '#E2E8F0' }}
        >
          <option value="all">📚 All Classes</option>
          {classesData.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` — ${c.section}` : ''}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ ...IS, width: 'auto', minWidth: 120, background: statusFilter !== 'all' ? (statusFilter === 'Active' ? '#F0FDF4' : '#FFF1F2') : '#F8FAFC', borderColor: statusFilter !== 'all' ? (statusFilter === 'Active' ? '#BBF7D0' : '#FECDD3') : '#E2E8F0' }}
        >
          <option value="all">👥 All Status</option>
          <option value="Active">✅ Active</option>
          <option value="Inactive">⏸️ Inactive</option>
        </select>
        
        {/* Clear Filters */}
        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            style={{ 
              padding: '9px 14px', 
              borderRadius: 9, 
              border: '1.5px solid #E2E8F0', 
              background: '#F8FAFC', 
              color: '#64748B', 
              fontWeight: 700, 
              fontSize: 11, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 5,
              whiteSpace: 'nowrap'
            }}
            title="Clear all filters"
          >
            <X size={12} /> Clear
          </button>
        )}
        
        {/* View Mode Toggle */}
        <div className="filt-toggle" style={{ display: 'flex', borderRadius: 9, border: '1.5px solid #E2E8F0', overflow: 'hidden', flexShrink: 0 }}>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ 
              padding: '9px 12px', 
              background: viewMode === 'grid' ? 'linear-gradient(135deg,#1E88E5,#1565C0)' : '#fff', 
              color: viewMode === 'grid' ? '#fff' : '#64748B', 
              border: 'none', 
              fontWeight: 700, 
              fontSize: 11, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 5,
              transition: 'all 0.15s'
            }}
            title="Grid View"
          >
            ⊞ Grid
          </button>
          <button 
            onClick={() => setViewMode('table')}
            style={{ 
              padding: '9px 12px', 
              background: viewMode === 'table' ? 'linear-gradient(135deg,#1E88E5,#1565C0)' : '#fff', 
              color: viewMode === 'table' ? '#fff' : '#64748B', 
              border: 'none', 
              borderLeft: '1px solid #E2E8F0',
              fontWeight: 700, 
              fontSize: 11, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 5,
              transition: 'all 0.15s'
            }}
            title="Table View"
          >
            ☰ Table
          </button>
        </div>
      </div>
      {/* Grid/Table View */}
      {pageLoading
        ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: '#94A3B8' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #EFF6FF', borderTopColor: '#2563EB', animation: 'spin .8s linear infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Loading students…</span>
        </div>
        : studentData.length === 0
          ? <div style={{ background: '#fff', borderRadius: 18, padding: '48px 20px', textAlign: 'center', border: '1.5px dashed #E2E8F0' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Users size={28} color="#BFDBFE" /></div>
            <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No students found</p>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94A3B8' }}>Register your first student to get started</p>
            <button onClick={handleNavigateToRegister} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#1E88E5,#1565C0)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}><UserPlus size={14} /> Register</button>
          </div>
          : viewMode === 'grid'
            ? pageLoading
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: '#94A3B8' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #EFF6FF', borderTopColor: '#2563EB', animation: 'spin .8s linear infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Loading students…</span>
                </div>
              : studentData.length === 0
                ? <div style={{ background: '#fff', borderRadius: 18, padding: '48px 20px', textAlign: 'center', border: '1.5px dashed #E2E8F0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Users size={28} color="#BFDBFE" /></div>
                    <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No students found</p>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94A3B8' }}>Try adjusting your filters or register a new student</p>
                  </div>
                : <div className="stu-grid" style={{ display: 'grid', gap: 16 }}>
                    {studentData.map(s => <StudentCard key={s._id} student={s} onView={s => open('view', s)} onEdit={s => open('edit', s)} onQR={s => open('qr', s)} onToggleStatus={handleStatusToggle} onFlexReport={s => navigate(`/teacher/flex-report/${s._id}`)} classesData={classesData} />)}
                  </div>
            : pageLoading
              ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: '#94A3B8' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #EFF6FF', borderTopColor: '#2563EB', animation: 'spin .8s linear infinite' }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Loading students…</span>
                </div>
              : studentData.length === 0
                ? <div style={{ background: '#fff', borderRadius: 18, padding: '48px 20px', textAlign: 'center', border: '1.5px dashed #E2E8F0' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Users size={28} color="#BFDBFE" /></div>
                    <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>No students found</p>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94A3B8' }}>Try adjusting your filters or register a new student</p>
                  </div>
                : <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                            <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                            <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 800, color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Classes</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 800, color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {studentData.map((s, idx) => {
                            const enrolled = classesData.filter(c => s.classIds?.includes(c.id));
                            const [from, to] = avatarColor(s.name);
                            return (
                              <tr key={s._id} style={{ borderBottom: idx % 2 === 0 ? '1px solid #F1F5F9' : '1px solid #F8FAFC', background: idx % 2 === 0 ? '#fff' : '#FAFBFC', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                                onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? '#fff' : '#FAFBFC'}>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <Avatar name={s.name} photo={s.photo} size={38} radius={10} />
                                    <div>
                                      <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{s.name}</p>
                                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>{s.enrollmentId || '—'}</p>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {s.fatherMobile && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Phone size={10} color="#94A3B8" />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#334155' }}>{s.fatherMobile}</span>
                                      </div>
                                    )}
                                    {s.motherMobile && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <Phone size={10} color="#94A3B8" />
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{s.motherMobile}</span>
                                      </div>
                                    )}
                                    {!s.fatherMobile && !s.motherMobile && (
                                      <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{s.fatherName || '—'}</span>
                                    {s.fatherMobile && <span style={{ fontSize: 10, color: '#64748B' }}>{s.fatherMobile}</span>}
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span style={{
                                    padding: '3px 10px',
                                    borderRadius: 99,
                                    fontSize: 10,
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    background: s.status === 'Active' ? '#F0FDF4' : '#F1F5F9',
                                    color: s.status === 'Active' ? '#15803D' : '#64748B',
                                    border: `1px solid ${s.status === 'Active' ? '#BBF7D0' : '#E2E8F0'}`
                                  }}>
                                    {s.status}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{enrolled.length} class{enrolled.length !== 1 ? 'es' : ''}</span>
                                    {enrolled.length > 0 && (
                                      <span style={{ fontSize: 10, color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {enrolled.slice(0, 2).map(c => c.name).join(', ')}
                                        {enrolled.length > 2 && ` +${enrolled.length - 2}`}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                    <button onClick={() => open('view', s)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#EFF6FF', color: '#1D4ED8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="View">
                                      <Eye size={13} />
                                    </button>
                                    <button onClick={() => open('edit', s)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#FFFBEB', color: '#B45309', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Edit">
                                      <Edit2 size={13} />
                                    </button>
                                    <button onClick={() => open('qr', s)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: '#FAF5FF', color: '#7E22CE', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="QR Code">
                                      <QrCode size={13} />
                                    </button>
                                    <button onClick={() => handleStatusToggle(s)} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: s.status === 'Active' ? '#FFF1F2' : '#F0FDF4', color: s.status === 'Active' ? '#BE123C' : '#15803D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={s.status === 'Active' ? 'Mark Inactive' : 'Mark Active'}>
                                      <Activity size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
      }
      {/* Pagination */}
      {pagination.pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '24px 0' }}>
          <button onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: pagination.page === 1 ? 0.4 : 1 }}><ChevronLeft size={13} /> Prev</button>
          <span style={{ padding: '8px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#1E88E5,#1565C0)', color: '#fff', fontWeight: 700, fontSize: 12 }}>{pagination.page} / {pagination.pages}</span>
          <button onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', opacity: pagination.page === pagination.pages ? 0.4 : 1 }}>Next <ChevronRight size={13} /></button>
        </div>
      )}
      {/* Modals */}
      <Modal open={modal === 'edit'} onClose={close} title="Edit Student" subtitle={selected?.name} maxWidth={700}>
        <StudentForm initial={selected} onSave={handleSave} onCancel={close} saveLoading={saveLoading} classesData={classesData} />
      </Modal>
      {/* View — Centered modal, not side panel */}
      <Modal open={modal === 'view'} onClose={close} title="Student Profile" subtitle={selected?.name} maxWidth={560}>
        {selected && <StudentProfileView student={selected} onClose={close} onEdit={() => { close(); setTimeout(() => open('edit', selected), 150); }} classesData={classesData} />}
      </Modal>
      <QRModal open={modal === 'qr'} onClose={close} student={selected} classesData={classesData} />
      <ParentCredentialsModal 
        open={!!credentials} 
        onClose={() => setCredentials(null)} 
        credentials={credentials} 
        studentName={credentials?.studentName || 'Student'} 
        parentPhone={credentials?.parentPhone || ''} 
        fatherPhone={credentials?.fatherPhone || ''} 
        motherPhone={credentials?.motherPhone || ''}
        studentPhone={credentials?.studentPhone || ''}
        studentEmail={credentials?.studentEmail || ''}
        studentPassword={credentials?.studentPassword || ''}
      />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />
        </div>
      )}
    </>
  );
};

export default AdminStudentsPage;
