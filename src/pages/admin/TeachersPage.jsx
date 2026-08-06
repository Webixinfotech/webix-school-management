import { createElement, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Edit2, Trash2, X, Search,
  CheckCircle, Shield, ShieldCheck, Calendar, Mail, Phone,
  Briefcase, ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  Eye, Lock, Loader2, Share2, Copy, Smartphone, ChevronDown, ChevronUp,
  BookOpen, LayoutGrid, List, UserCheck, UserX, Clock,
  Star, ArrowUpRight, AlarmClock, Hourglass, CalendarDays, Plus, Minus, Lock as LockIcon,
  BarChart2, Sunrise, Wallet, GraduationCap, Cake, ClipboardList,
  Gift, Award, Activity,
} from 'lucide-react';
import { teacherService, getTeacherPhotoUrl, getEmployeeAttendanceSummary } from '../../api/teachers';
import { getClassesAPI } from '../../api/classes';

// WhatsApp Icon Component
const WhatsAppIcon = ({ size = 24, color = '#fff' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// ─── Class Types & Helpers ────────────────────────────────────────────────────
const CLASS_TYPES = {
  FIXED_TIME:  { id: 'FIXED_TIME',  label: 'Fixed Time',    color: '#0F4C5C', bg: '#EFF6FF', border: '#BFDBFE' },
  FLEX_TIME:   { id: 'FLEX_TIME',   label: 'Flexible Time', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  HOURS_BASED: { id: 'HOURS_BASED', label: 'Hours Based',   color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
};
const EMPLOYEE_TYPES = {
  FIXED_TIME:  { label: 'Fixed Time',  color: '#0F4C5C', bg: '#EFF6FF', border: '#BFDBFE' },
  FIXED_HOURS: { label: 'Fixed Hours', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  FLEXIBLE:    { label: 'Flexible',    color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
};
const HOLIDAY_CALENDARS = {
  TEACHING:     { label: 'Teaching',     color: '#0F4C5C' },
  NON_TEACHING: { label: 'Non-Teaching', color: '#8B5CF6' },
};
const WEEK_DAYS = [
  { id: 'MON', label: 'Mon' }, { id: 'TUE', label: 'Tue' }, { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' }, { id: 'FRI', label: 'Fri' }, { id: 'SAT', label: 'Sat' }, { id: 'SUN', label: 'Sun' },
];
const formatDays = (days) => {
  if (!days?.length || days.length === 7) return 'All Days';
  return WEEK_DAYS.filter(d => days.includes(d.id)).map(d => d.label).join(', ');
};
const fmt12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── API CONFIG ────────────────────────────────────────────────────────────────
// ─── HELPERS ───────────────────────────────────────────────────────────────────
const PALETTES = [
  ['#0EA5E9', '#0369A1'], ['#8B5CF6', '#5B21B6'], ['#10B981', '#065F46'],
  ['#F59E0B', '#92400E'], ['#EF4444', '#991B1B'], ['#06B6D4', '#0E7490'],
  ['#EC4899', '#9D174D'], ['#84CC16', '#3F6212'],
];
const getPalette = (name = 'A') => PALETTES[(name.charCodeAt(0) || 65) % PALETTES.length];

const statusConfig = {
  'Active':   { color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981' },
  'Inactive': { color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' },
  'On Leave': { color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' },
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const truncateEmail = (email) => {
  if (!email) return '—';
  if (email.length <= 15) return email;
  return email.substring(0, 12) + '..';
};

const photoUrl = (photo) => getTeacherPhotoUrl(photo);

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const colors = {
  bg: '#F4F6FB',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#FFF8F4',
  border: '#E7EAF3',
  borderLight: '#F3B594',
  text: '#172033',
  textMuted: '#667085',
  textDim: '#98A2B3',
  accent: '#E85D2A',
  accentHover: '#D9480F',
  accentLight: 'rgba(232,93,42,0.12)',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#06B6D4',
  pageGlow: 'radial-gradient(circle at top left, rgba(232,93,42,0.18), transparent 28%)',
  hero: 'linear-gradient(135deg, #1F2937 0%, #111827 58%, #7C2D12 100%)',
};

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
const Avatar = ({ name = 'A', photo, size = 'md' }) => {
  const [from, to] = getPalette(name);
  const dims = { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 }[size] || 44;
  const fs = { xs: 11, sm: 13, md: 16, lg: 20, xl: 26 }[size] || 16;
  const [imgErr, setImgErr] = useState(false);
  const src = photo && !imgErr ? photoUrl(photo) : null;

  return (
    <div style={{ position: 'relative', width: dims, height: dims, minWidth: dims, flexShrink: 0 }}>
      {src ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgErr(true)}
          style={{ width: dims, height: dims, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.border}` }}
        />
      ) : (
        <div style={{
          width: dims, height: dims, borderRadius: '50%',
          background: `linear-gradient(135deg, ${from}, ${to})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: fs, fontFamily: "'DM Sans', sans-serif",
          boxShadow: `0 0 0 2px ${colors.border}, 0 4px 16px rgba(0,0,0,0.4)`,
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: Math.max(10, dims * 0.22), height: Math.max(10, dims * 0.22),
        borderRadius: '50%', border: `2px solid ${colors.surface}`,
        background: colors.success, display: size === 'xs' ? 'none' : 'block',
      }} />
    </div>
  );
};

const StatusDot = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Inactive'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      letterSpacing: '0.02em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

const Tag = ({ children, color = colors.accent }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', padding: '3px 9px',
    borderRadius: 6, fontSize: 11, fontWeight: 600,
    background: `${color}20`, color: color, border: `1px solid ${color}40`,
    whiteSpace: 'nowrap',
  }}>
    {children}
  </span>
);

const Btn = ({ children, variant = 'primary', onClick, disabled, loading, icon: Icon, size = 'md', style: sx = {} }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    border: 'none', transition: 'all 0.18s', opacity: disabled ? 0.5 : 1,
    fontSize: size === 'sm' ? 12 : 13,
    padding: size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px',
    ...sx,
  };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`, color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
    secondary: { background: colors.card, color: colors.textMuted, border: `1px solid ${colors.border}` },
    danger: { background: 'rgba(239,68,68,0.12)', color: colors.danger, border: `1px solid rgba(239,68,68,0.25)` },
    success: { background: 'rgba(16,185,129,0.12)', color: colors.success, border: `1px solid rgba(16,185,129,0.25)` },
    ghost: { background: 'transparent', color: colors.textMuted },
  };
  return (
    <button onClick={!disabled && !loading ? onClick : undefined} style={{ ...base, ...variants[variant] }}>
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
};

const IconBtn = ({ icon: Icon, onClick, title, danger }) => (
  <button
    onClick={onClick} title={title}
    style={{
      width: 34, height: 34, borderRadius: 9, border: `1px solid ${colors.border}`,
      background: danger ? 'rgba(239,68,68,0.08)' : colors.card,
      color: danger ? colors.danger : colors.textMuted,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = danger ? colors.danger : colors.accent; e.currentTarget.style.color = danger ? colors.danger : colors.accent; e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.15)' : colors.accentLight; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = danger ? colors.danger : colors.textMuted; e.currentTarget.style.background = danger ? 'rgba(239,68,68,0.08)' : colors.card; }}
  >
    {createElement(Icon, { size: 15, strokeWidth: 2 })}
  </button>
);

const Input = ({ label, error, icon: Icon, type = 'text', value, onChange, placeholder, disabled, required, maxLength }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && (
      <label style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}{required && <span style={{ color: colors.danger }}> *</span>}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      {Icon && <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textDim, pointerEvents: 'none' }} />}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled} maxLength={maxLength}
        style={{
          width: '100%', padding: Icon ? '10px 12px 10px 36px' : '10px 12px',
          borderRadius: 10, border: `1.5px solid ${error ? colors.danger : colors.border}`,
          background: colors.surface, color: colors.text, fontSize: 13, fontWeight: 500,
          outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif",
          transition: 'border-color 0.15s', opacity: disabled ? 0.6 : 1,
        }}
        onFocus={e => e.target.style.borderColor = error ? colors.danger : colors.accent}
        onBlur={e => e.target.style.borderColor = error ? colors.danger : colors.border}
      />
    </div>
    {error && <span style={{ fontSize: 11, color: colors.danger }}>{error}</span>}
  </div>
);

const Select = ({ label, value, onChange, options, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</label>}
    <select value={value} onChange={onChange} style={{
      padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${error ? colors.danger : colors.border}`,
      background: colors.surface, color: colors.text, fontSize: 13, fontWeight: 500,
      outline: 'none', width: '100%', fontFamily: "'DM Sans', sans-serif",
    }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <span style={{ fontSize: 11, color: colors.danger }}>{error}</span>}
  </div>
);

const Toast = ({ message, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'success' ? 'rgba(16,185,129,0.95)' : type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(99,102,241,0.95)',
    color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    animation: 'slideUp 0.3s ease',
    maxWidth: 340,
  }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, opacity: 0.7, display: 'flex' }}><X size={14} /></button>
  </div>
);

// ─── Teacher Credentials Modal ─────────────────────────────────────────────────
const TeacherCredentialsModal = ({ open, onClose, credentials, teacherName, teacherPhone, fatherPhone, motherPhone }) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [passCopied, setPassCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showWhatsAppOptions, setShowWhatsAppOptions] = useState(false);

  if (!open || !credentials) return null;

  const copyEmail = () => {
    navigator.clipboard.writeText(credentials.email || '');
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const copyPass = () => {
    navigator.clipboard.writeText(credentials.password || '');
    setPassCopied(true);
    setTimeout(() => setPassCopied(false), 2000);
  };

  const formatPhoneForWhatsApp = (phone) => {
    const cleaned = phone?.replace(/\D/g, '') || '';
    if (cleaned.startsWith('91') && cleaned.length > 2) return cleaned;
    if (cleaned.length === 10) return '91' + cleaned;
    return cleaned;
  };

  const getShareMessage = () => {
    return `*BrainBuilder Staff Login Credentials*\n\n👤 Teacher: ${teacherName}\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}\n\n📱 Login with email and password above.\n\n*Save these credentials - password cannot be recovered!*`;
  };

  const handleWhatsApp = (phone) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    if (!formattedPhone || formattedPhone.length < 12) {
      alert('Invalid phone number for WhatsApp');
      return;
    }
    const encodedMsg = encodeURIComponent(getShareMessage());
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`BrainBuilder Staff Login Credentials - ${teacherName}`);
    const body = encodeURIComponent(`Dear Teacher,\n\nHere are your BrainBuilder login credentials:\n\nTeacher Name: ${teacherName}\nLogin Email: ${credentials.email}\nPassword: ${credentials.password}\n\n*Please save these credentials - the password cannot be recovered later.*\n\nRegards,\nBrainBuilder Team`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyAll = () => {
    const text = `BrainBuilder Staff Login Credentials\nStaff: ${teacherName}\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const hasFatherPhone = fatherPhone && fatherPhone.length === 10;
  const hasMotherPhone = motherPhone && motherPhone.length === 10;
  const hasMultiplePhones = hasFatherPhone || hasMotherPhone;

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .teacher-credentials-modal {
            max-height: 95vh !important;
            border-radius: 16px !important;
          }
          .teacher-modal-header {
            padding: 24px 16px 20px !important;
          }
          .teacher-modal-header h3 {
            font-size: 16px !important;
          }
          .teacher-modal-content {
            padding: 16px !important;
          }
          .teacher-modal-content button {
            font-size: 12px !important;
            padding: 12px 10px !important;
          }
          .teacher-modal-content input,
          .teacher-modal-content select {
            font-size: 13px !important;
          }
        }
        @media (max-width: 480px) {
          .teacher-credentials-modal {
            max-height: 98vh !important;
            border-radius: 12px !important;
          }
          .teacher-modal-header {
            padding: 20px 14px 18px !important;
          }
          .teacher-modal-header h3 {
            font-size: 15px !important;
          }
          .teacher-modal-content {
            padding: 14px !important;
          }
          .teacher-modal-content button {
            font-size: 11px !important;
            padding: 10px 8px !important;
          }
        }
        @media (max-width: 360px) {
          .teacher-credentials-modal {
            max-height: 99vh !important;
            border-radius: 10px !important;
          }
          .teacher-modal-header {
            padding: 18px 12px 16px !important;
          }
          .teacher-modal-header h3 {
            font-size: 14px !important;
          }
          .teacher-modal-content {
            padding: 12px !important;
          }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        padding: '16px',
      }} onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="teacher-credentials-modal" style={{
          width: '100%', maxWidth: 560, background: colors.card, borderRadius: 24,
          overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
          animation: 'fadeInUp 0.25s ease', position: 'relative',
          border: `1px solid ${colors.border}`,
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
        {/* Close Button - Top Right */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          width: 36, height: 36, borderRadius: 10,
          border: `1px solid rgba(255,255,255,0.1)`,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: colors.textMuted, transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = colors.text; e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <X size={20} />
        </button>

        {/* Success Header */}
        <div className="teacher-modal-header" style={{
          background: `linear-gradient(135deg, ${colors.success}, #059669)`,
          padding: '28px 20px 24px', position: 'relative', overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={28} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 180, paddingRight: 40 }}>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Staff Registered!</p>
              <h3 style={{ margin: '5px 0 4px', fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{teacherName}</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Account created successfully</p>
            </div>
          </div>
        </div>

        {/* Credentials Section */}
        <div className="teacher-modal-content" style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Warning Banner */}
          <div style={{
            background: 'rgba(245,158,11,0.1)', border: `1.5px solid rgba(245,158,11,0.3)`, borderRadius: 10,
            padding: '10px 12px', marginBottom: 16,
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <AlertCircle size={16} color={colors.warning} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: colors.warning }}>Save these credentials!</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: colors.textMuted, lineHeight: 1.5 }}>
                Share this login info with the teacher. The password cannot be recovered later.
              </p>
            </div>
          </div>

          {/* Share Options */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => { setShowShareOptions(!showShareOptions); setShowWhatsAppOptions(false); }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `2px solid ${colors.success}`,
                background: `${colors.success}15`, color: colors.success,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${colors.success}25`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${colors.success}15`; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Share2 size={14} />
              {showShareOptions ? 'Hide Share Options' : 'Share Credentials'}
              {showShareOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showShareOptions && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10,
                animation: 'fadeInUp 0.2s ease'
              }}>
                {/* WhatsApp & Email Buttons - Single Row */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setShowWhatsAppOptions(!showWhatsAppOptions)}
                    disabled={!teacherPhone && !hasMultiplePhones}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                      background: (teacherPhone || hasMultiplePhones) ? 'linear-gradient(135deg, #25D366, #128C7E)' : colors.surface,
                      color: (teacherPhone || hasMultiplePhones) ? '#fff' : colors.textDim,
                      fontWeight: 700, fontSize: 11, cursor: (teacherPhone || hasMultiplePhones) ? 'pointer' : 'not-allowed',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      opacity: (teacherPhone || hasMultiplePhones) ? 1 : 0.6, transition: 'all 0.2s',
                      boxShadow: (teacherPhone || hasMultiplePhones) ? '0 3px 10px rgba(37,211,102,0.3)' : 'none',
                    }}
                    onMouseEnter={e => { if (teacherPhone || hasMultiplePhones) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <WhatsAppIcon size={18} color="#fff" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={handleEmail}
                    style={{
                      flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #EA4335, #C5221F)', color: '#fff',
                      fontWeight: 700, fontSize: 11, cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      boxShadow: '0 3px 10px rgba(234,67,53,0.3)', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <Mail size={18} />
                    <span>Email</span>
                  </button>
                </div>

                {/* WhatsApp Options - Teacher/Father/Mother */}
                {showWhatsAppOptions && (teacherPhone || hasMultiplePhones) && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '10px', background: colors.surface, borderRadius: 10,
                    border: `1.5px solid ${colors.border}`,
                    animation: 'fadeInUp 0.2s ease'
                  }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', textAlign: 'center' }}>
                      Select Recipient
                    </p>

                    {/* Teacher */}
                    {teacherPhone && (
                      <button
                        onClick={() => handleWhatsApp(teacherPhone, teacherName)}
                        style={{
                          padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${colors.border}`,
                          background: colors.card, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.success; e.currentTarget.style.background = `${colors.success}10`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.card; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, #25D366, #128C7E)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <WhatsAppIcon size={16} color="#fff" />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.text }}>{teacherName}</p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: colors.textMuted }}>{teacherPhone}</p>
                        </div>
                      </button>
                    )}

                    {/* Father */}
                    {hasFatherPhone && (
                      <button
                        onClick={() => handleWhatsApp(fatherPhone, 'Father')}
                        style={{
                          padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${colors.border}`,
                          background: colors.card, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.success; e.currentTarget.style.background = `${colors.success}10`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.card; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, #25D366, #128C7E)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <WhatsAppIcon size={16} color="#fff" />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.text }}>Father</p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: colors.textMuted }}>{fatherPhone}</p>
                        </div>
                      </button>
                    )}

                    {/* Mother */}
                    {hasMotherPhone && (
                      <button
                        onClick={() => handleWhatsApp(motherPhone, 'Mother')}
                        style={{
                          padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${colors.border}`,
                          background: colors.card, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = colors.success; e.currentTarget.style.background = `${colors.success}10`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.card; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: 'linear-gradient(135deg, #25D366, #128C7E)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <WhatsAppIcon size={16} color="#fff" />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: colors.text }}>Mother</p>
                          <p style={{ margin: '2px 0 0', fontSize: 10, color: colors.textMuted }}>{motherPhone}</p>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>Login Email</label>
            <div style={{
              padding: '12px', background: colors.surface, borderRadius: 12,
              border: `1.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10,
              flexWrap: 'wrap',
            }}>
              <Mail size={16} color={colors.accent} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: colors.accent, flex: 1, fontFamily: 'monospace', minWidth: '120px', wordBreak: 'break-all' }}>
                {credentials.email || '—'}
              </span>
              <button onClick={copyEmail} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: emailCopied ? `${colors.success}20` : `${colors.accent}15`,
                color: emailCopied ? colors.success : colors.accent,
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {emailCopied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>Login Password</label>
            <div style={{
              padding: '12px', background: colors.surface, borderRadius: 12,
              border: `1.5px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 10,
              flexWrap: 'wrap',
            }}>
              <Lock size={16} color={colors.warning} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: colors.warning, flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em', minWidth: '120px', wordBreak: 'break-all' }}>
                {credentials.password || '—'}
              </span>
              <button onClick={copyPass} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                background: passCopied ? `${colors.success}20` : `${colors.warning}15`,
                color: passCopied ? colors.success : colors.warning,
                transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {passCopied ? <><CheckCircle size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          </div>

          {/* Copy All Button */}
          <button onClick={handleCopyAll} style={{
            width: '100%', padding: '10px', borderRadius: 10,
            border: `1.5px solid ${colors.border}`,
            background: colors.surface, color: colors.textMuted,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {emailCopied ? <><CheckCircle size={14} color={colors.success} /> All Copied!</> : <><Copy size={14} /> Copy All Credentials</>}
          </button>

          {/* App Info */}
          <div style={{
            background: colors.surface, borderRadius: 12, padding: '14px',
            border: `1.5px solid ${colors.border}`, marginBottom: 16,
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Smartphone size={12} />
              How to Login
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { step: '1', text: 'Open BrainBuilder application' },
                { step: '2', text: `Enter email: ${credentials.email}` },
                { step: '3', text: 'Enter the password above' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{step}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onClose} style={{
            width: '100%', padding: '12px', borderRadius: 12, border: 'none',
            background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`,
            color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
            boxShadow: `0 4px 12px ${colors.accent}40`,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${colors.accent}60`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}40`; }}
          >
            <CheckCircle size={16} /> Done — Close
          </button>
        </div>
      </div>
      </div>
    </>
  );
};

const Modal = ({ open, onClose, title, subtitle, children, maxWidth = 580, fullPage = false }) => {
  if (!open) return null;
  const isFullPage = fullPage;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: isFullPage ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.75)',
      backdropFilter: isFullPage ? 'blur(12px)' : 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: isFullPage ? 0 : 16,
    }} onClick={e => !isFullPage && e.target === e.currentTarget && onClose()}>
      <div style={{
        width: isFullPage ? '100vw' : '100%',
        height: isFullPage ? '100vh' : 'auto',
        maxWidth: isFullPage ? 'none' : maxWidth,
        background: colors.card,
        borderRadius: isFullPage ? 0 : 20,
        boxShadow: isFullPage ? 'none' : '0 32px 80px rgba(0,0,0,0.6)',
        border: isFullPage ? 'none' : `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column',
        maxHeight: isFullPage ? 'none' : 'calc(100vh - 40px)',
        overflow: isFullPage ? 'hidden' : 'hidden',
        animation: 'modalIn 0.25s ease',
      }}>
        <div className={isFullPage ? 'modal-full-page modal-header' : ''} style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          padding: isFullPage ? '28px 32px 20px' : '22px 26px 18px',
          borderBottom: `1px solid ${colors.border}`, flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isFullPage ? 20 : 17,
              fontWeight: 800,
              color: colors.text
            }}>{title}</h2>
            {subtitle && <p style={{
              margin: '6px 0 0',
              fontSize: isFullPage ? 14 : 12,
              color: colors.textMuted
            }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{
            width: 36, height: 36,
            borderRadius: 10,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: colors.textMuted, flexShrink: 0,
            transition: 'all 0.15s'
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = colors.accent;
              e.currentTarget.style.color = colors.accent;
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = colors.border;
              e.currentTarget.style.color = colors.textMuted;
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div className={isFullPage ? 'modal-full-page modal-content' : ''} style={{
          overflowY: 'auto',
          padding: isFullPage ? '24px 32px' : '22px 26px',
          flex: 1
        }}>{children}</div>
      </div>
      {isFullPage && (
        <style>{`
          @media (max-width: 768px) {
            .modal-full-page.modal-header {
              padding: 20px 20px 16px !important;
            }
            .modal-full-page.modal-header h2 {
              font-size: 18px !important;
            }
            .modal-full-page.modal-content {
              padding: 20px !important;
            }
          }
          @media (max-width: 480px) {
            .modal-full-page.modal-header {
              padding: 16px 16px 12px !important;
            }
            .modal-full-page.modal-header h2 {
              font-size: 16px !important;
            }
            .modal-full-page.modal-content {
              padding: 16px !important;
            }
          }
        `}</style>
      )}
    </div>
  );
};

// ─── PERMISSION KEYS ──────────────────────────────────────────────────────────
// Every key here must be backed by a real backend guard (see
// backend/src/middleware/auth.middleware.js#teacherPermissionGuard and the
// route files it's wired into) — a permission that only hides a button
// isn't a permission.
const PERMISSION_DEFS = [
  { key: 'canViewStudentMobile', label: 'View Student Mobile', icon: Phone, color: colors.info },
  { key: 'canMarkAttendance', label: 'Mark Attendance', icon: CheckCircle, color: colors.success },
  { key: 'canUploadPhotos', label: 'Upload Photos', icon: BookOpen, color: colors.accent },
  { key: 'canViewSalary', label: 'View Salary', icon: Shield, color: '#F97316' },
  { key: 'canViewFeeInfo', label: 'View Fee Status', icon: Eye, color: '#0EA5E9' },
  { key: 'canDisplayStaffQR', label: 'Display Staff QR', icon: Eye, color: '#06B6D4' },
  { key: 'canManageFees', label: 'Manage Fee Hub', icon: Wallet, color: '#16A34A' },
  { key: 'canManageStudents', label: 'Create/Edit Students', icon: GraduationCap, color: '#7C3AED' },
  { key: 'canManageEmployees', label: 'Create/Edit/View Employees', icon: Briefcase, color: '#DB2777' },
  { key: 'canManageBirthdays', label: 'Manage Birthdays', icon: Cake, color: '#EC4899' },
  { key: 'canManageEnquiries', label: 'Manage Enquiries', icon: ClipboardList, color: '#0891B2' },
  { key: 'canViewBirthdays', label: 'View Birthdays', icon: Gift, color: '#EC4899' },
  { key: 'canManageCertificates', label: 'Manage Certificates', icon: Award, color: '#C9A24B' },
  { key: 'canManageDailyActivity', label: 'Manage Daily Activity', icon: Activity, color: '#A78BFA' },
  { key: 'canManageLibraryCatalog', label: 'Manage Library Catalog', icon: BookOpen, color: '#3B82F6' },
  { key: 'canManageLibraryIssue', label: 'Manage Library Issue', icon: List, color: '#10B981' },
  { key: 'canViewLibraryReports', label: 'View Library Reports', icon: BarChart2, color: '#0F4C5C' },
  { key: 'canManageInventoryCatalog', label: 'Manage Store Catalog', icon: LayoutGrid, color: '#F59E0B' },
  { key: 'canManageInventoryStockIn', label: 'Manage Stock In', icon: Plus, color: '#14B8A6' },
  { key: 'canManageInventoryStockOut', label: 'Manage Stock Out', icon: Minus, color: '#EF4444' },
  { key: 'canViewInventoryReports', label: 'View Store Reports', icon: BarChart2, color: '#8B5CF6' },
];

// Verification permissions (separate from main permissions)
const VERIFICATION_DEFS = [
  { key: 'aadhaarVerified', label: 'Aadhaar Verified', icon: ShieldCheck, color: colors.success },
  { key: 'policeVerified', label: 'Police Verified', icon: ShieldCheck, color: colors.info },
];

const DEFAULT_PERMS = {
  canViewStudentMobile: false, canMarkAttendance: false, canUploadPhotos: false,
  canViewSalary: false, canViewFeeInfo: false, canDisplayStaffQR: false,
  canManageFees: false, canManageStudents: false, canManageEmployees: false,
  canManageBirthdays: false, canManageEnquiries: false,
  canManageLibraryCatalog: false, canManageLibraryIssue: false, canViewLibraryReports: false,
  canManageInventoryCatalog: false, canManageInventoryStockIn: false,
  canManageInventoryStockOut: false, canViewInventoryReports: false,
  // These 3 default to true on the backend (Teacher.model.js) to preserve
  // pre-existing behaviour for teachers created before the flags existed.
  // Keeping the same default here so a brand-new teacher form and the
  // "current value" shown to admin agree with what the backend will do
  // when a key is omitted.
  canViewBirthdays: true, canManageCertificates: true, canManageDailyActivity: true,
  aadhaarVerified: false, policeVerified: false,
};

// ─── TEACHER FORM ─────────────────────────────────────────────────────────────
const TeacherForm = ({ initial, onSave, onCancel, classesData = [], classesLoading = false, saveLoading = false }) => {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => ({
    name: '', email: '', phone: '', password: '',
    dob: '', dateOfJoining: '', subjects: '', status: 'Active',
    classIds: [],
    permissions: { ...DEFAULT_PERMS },
    photo: null,
    ...(isEdit ? {
      name: initial.name || '', phone: initial.phone || '',
      dob: initial.dob ? initial.dob.split('T')[0] : '',
      dateOfJoining: initial.dateOfJoining ? initial.dateOfJoining.split('T')[0] : '',
      subjects: initial.subjects || '',
      status: initial.status || 'Active',
      classIds: initial.classIds || [],
      permissions: { ...DEFAULT_PERMS, ...(initial.permissions || {}) },
    } : {}),
  }));
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(initial?.photo ? photoUrl(initial.photo) : null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPerm = (k, v) => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors(er => ({ ...er, photo: 'Only JPG, PNG, WEBP allowed' })); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(er => ({ ...er, photo: 'Max 5MB allowed' })); return;
    }
    setErrors(er => ({ ...er, photo: null }));
    set('photo', file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!isEdit && !form.email.trim()) e.email = 'Required';
    if (!isEdit && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit Indian mobile';
    if (!isEdit && (!form.password || form.password.length < 6)) e.password = 'Min 6 characters';
    if (!form.dateOfJoining) e.dateOfJoining = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    onSave(form, isEdit ? 'updated' : 'created');
  };

  const sectionTitle = (t) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: colors.border }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{t}</span>
      <div style={{ flex: 1, height: 1, background: colors.border }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {errors._global && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: colors.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={15} /> {errors._global}
        </div>
      )}

      {/* Photo Upload */}
      {sectionTitle('Profile Photo')}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${colors.border}`, background: colors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {photoPreview ? (
            <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Users size={28} style={{ color: colors.textDim }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px',
            borderRadius: 10, border: `1.5px dashed ${colors.border}`, background: colors.surface,
            color: colors.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            <ArrowUpRight size={14} /> Choose Photo
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />
          </label>
          <p style={{ margin: '6px 0 0', fontSize: 11, color: colors.textDim }}>JPG, PNG or WEBP · Max 5MB</p>
          {errors.photo && <p style={{ margin: '4px 0 0', fontSize: 11, color: colors.danger }}>{errors.photo}</p>}
        </div>
      </div>

      {/* Basic Info */}
      {sectionTitle('Basic Information')}
      <div className="teachers-form-grid">
        <Input label="Full Name" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Staff name" error={errors.name} />
        {!isEdit && <Input label="Email" required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@school.com" error={errors.email} />}
        <Input label="Phone" required value={form.phone} onChange={e => {
          const val = e.target.value.replace(/\D/g, '');
          if (val.length <= 10) set('phone', val);
        }} placeholder="9876543210" error={errors.phone} icon={Phone} maxLength={10} />
        {!isEdit && <Input label="Password" required type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" error={errors.password} icon={Lock} />}
      </div>

      <div className="teachers-form-grid-wide" style={{ marginTop: 12 }}>
        <Input label="Date of Birth" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
        <Input label="Date of Joining" required type="date" value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} error={errors.dateOfJoining} />
        <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={[
          { value: 'Active', label: '● Active' },
          { value: 'Inactive', label: '○ Inactive' },
          { value: 'On Leave', label: '◐ On Leave' },
        ]} />
      </div>

      <div style={{ marginTop: 12 }}>
        <Input label="Subjects" value={form.subjects} onChange={e => set('subjects', e.target.value)} placeholder="e.g., Math, Science, English" icon={BookOpen} />
      </div>

      {/* Class Assignment Widget */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BookOpen size={14} color="#4338CA" /></div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#051d24' }}>Assign Classes</h3>
          </div>
          {form.classIds.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, background: '#EEF2FF', color: '#4338CA', padding: '2px 9px', borderRadius: 99, border: '1px solid #C7D2FE' }}>
              {form.classIds.length} selected
            </span>
          )}
        </div>
        
        {classesLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: 12 }}>Loading classes...</div>
        ) : classesData.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0', fontSize: 12, color: '#94A3B8' }}>
            No classes available. Create classes first in Classes page.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '320px', overflowY: 'auto', padding: '4px' }}>
            {classesData.map(cls => {
              const selected = form.classIds.includes(cls.id);
              const ct = CLASS_TYPES[cls.classType];
              const typeColor = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';
              const TIcon = cls.classType === 'FIXED_TIME' ? AlarmClock : cls.classType === 'FLEX_TIME' ? Clock : Hourglass;
              
              return (
                <div
                  key={cls.id}
                  onClick={() => {
                    setForm(f => ({
                      ...f,
                      classIds: selected ? f.classIds.filter(id => id !== cls.id) : [...f.classIds, cls.id]
                    }));
                  }}
                  style={{
                    borderRadius: 12,
                    border: `2px solid ${selected ? '#7E22CE' : '#E2E8F0'}`,
                    background: selected ? '#FAF5FF' : '#fff',
                    padding: '11px 13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected ? '#7E22CE' : '#CBD5E1'}`, background: selected ? '#7E22CE' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selected && <CheckCircle size={10} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#051d24' }}>{cls.name}</span>
                        {cls.section && <span style={{ fontSize: 10, color: '#94A3B8' }}>§{cls.section}</span>}
                        {ct && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: CLASS_TYPES[cls.classType]?.bg || '#F1F5F9', color: CLASS_TYPES[cls.classType]?.text || '#64748B', border: `1px solid ${CLASS_TYPES[cls.classType]?.border || '#E2E8F0'}` }}>
                            {ct.label}
                          </span>
                        )}
                      </div>
                      {cls.days?.length > 0 && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#64748B' }}>{formatDays(cls.days)}</p>}
                      {cls.classType === 'FIXED_TIME' && cls.startTime && cls.endTime && (
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: '#0F4C5C', fontWeight: 600 }}>{fmt12(cls.startTime)} – {fmt12(cls.endTime)}</p>
                      )}
                    </div>
                    <TIcon size={14} color={selected ? '#7E22CE' : '#94A3B8'} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verifications */}
      {sectionTitle('Verifications')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VERIFICATION_DEFS.map(({ key, label, icon: VIcon, color }) => (
          <label key={key} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderRadius: 12, border: `1.5px solid ${form.permissions[key] ? color + '50' : colors.border}`,
            background: form.permissions[key] ? color + '12' : colors.surface,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${form.permissions[key] ? color : colors.border}`, background: form.permissions[key] ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
              {form.permissions[key] && <CheckCircle size={12} color="#fff" />}
            </div>
            <input type="checkbox" checked={form.permissions[key]} onChange={e => setPerm(key, e.target.checked)} style={{ display: 'none' }} />
            {createElement(VIcon, { size: 16, style: { color: form.permissions[key] ? color : colors.textDim, flexShrink: 0 } })}
            <span style={{ fontSize: 13, fontWeight: 600, color: form.permissions[key] ? color : colors.textMuted }}>{label}</span>
          </label>
        ))}
      </div>

      {/* Permissions */}
      {sectionTitle('Permissions')}
      <div className="teachers-permissions-grid">
        {PERMISSION_DEFS.map(({ key, label, icon: PIcon, color }) => (
          <label key={key} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 10, border: `1.5px solid ${form.permissions[key] ? color + '50' : colors.border}`,
            background: form.permissions[key] ? color + '12' : colors.surface,
            cursor: 'pointer', transition: 'all 0.15s',
          }}>
            <div style={{ width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${form.permissions[key] ? color : colors.border}`, background: form.permissions[key] ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
              {form.permissions[key] && <CheckCircle size={12} color="#fff" />}
            </div>
            <input type="checkbox" checked={form.permissions[key]} onChange={e => setPerm(key, e.target.checked)} style={{ display: 'none' }} />
            {createElement(PIcon, { size: 13, style: { color: form.permissions[key] ? color : colors.textDim, flexShrink: 0 } })}
            <span style={{ fontSize: 12, fontWeight: 600, color: form.permissions[key] ? color : colors.textMuted }}>{label}</span>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Btn onClick={handleSubmit} loading={saveLoading} size="lg" style={{ flex: 1 }}>
          {isEdit ? 'Update Teacher' : 'Create Teacher'}
        </Btn>
        <Btn variant="secondary" onClick={onCancel} size="lg" style={{ flex: 1 }}>Cancel</Btn>
      </div>
    </div>
  );
};

// ─── PERMISSIONS EDITOR ───────────────────────────────────────────────────────
const PermissionsEditor = ({ teacher, onSave, onCancel }) => {
  const [perms, setPerms] = useState({ ...DEFAULT_PERMS, ...(teacher.permissions || {}) });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (k) => setPerms(p => ({ ...p, [k]: !p[k] }));

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await onSave(teacher._id, perms);
    } catch (e) {
      setError(e.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = Object.values(perms).filter(Boolean).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: colors.accentLight, borderRadius: 12, border: `1px solid ${colors.accent}40` }}>
        <Shield size={18} style={{ color: colors.accent }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.text }}>{teacher.name}</p>
          <p style={{ margin: 0, fontSize: 11, color: colors.textMuted }}>{enabledCount} of {PERMISSION_DEFS.filter(p => !['aadhaarVerified', 'policeVerified'].includes(p.key)).length} permissions enabled</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: colors.danger, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PERMISSION_DEFS.filter(p => !['aadhaarVerified', 'policeVerified'].includes(p.key)).map(({ key, label, icon: PIcon, color }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 12,
            border: `1.5px solid ${perms[key] ? color + '40' : colors.border}`,
            background: perms[key] ? color + '0D' : colors.surface,
            transition: 'all 0.18s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: perms[key] ? color + '20' : colors.card, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${perms[key] ? color + '40' : colors.border}` }}>
                {createElement(PIcon, { size: 16, style: { color: perms[key] ? color : colors.textDim } })}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: perms[key] ? colors.text : colors.textMuted }}>{label}</span>
            </div>
            <button onClick={() => toggle(key)} style={{
              width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
              background: perms[key] ? color : colors.border,
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 3, left: perms[key] ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Btn onClick={handleSave} loading={loading} size="lg" style={{ flex: 1 }}>Save Permissions</Btn>
        <Btn variant="secondary" onClick={onCancel} size="lg" style={{ flex: 1 }}>Cancel</Btn>
      </div>
    </div>
  );
};

// ─── TEACHER CARD ─────────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, onView, onEdit, onDelete, onPermissions, onStatusChange }) => {
  const activePerms = PERMISSION_DEFS.filter(p => !['aadhaarVerified', 'policeVerified'].includes(p.key) && teacher.permissions?.[p.key]);
  const empType = EMPLOYEE_TYPES[teacher.employeeType] || EMPLOYEE_TYPES.FIXED_TIME;
  const classCount = teacher.classIds?.length || 0;

  return (
    <div style={{
      background: colors.card, borderRadius: 20, border: `1px solid ${colors.border}`,
      overflow: 'hidden', transition: 'all 0.3s', display: 'flex', flexDirection: 'column',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accentLight; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}
    >
      {/* Card Header */}
      <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start', background: '#FAFAFC', borderBottom: `1px solid ${colors.border}` }}>
        <Avatar name={teacher.name} photo={teacher.photo} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacher.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textDim, fontFamily: 'monospace', fontWeight: 600 }}>{teacher.employeeId}</p>
             </div>
              <select
                value={teacher.status}
                onChange={e => onStatusChange(teacher._id, e.target.value)}
                style={{
                  padding: '4px 10px', borderRadius: 12, border: `1px solid ${teacher.status === 'Active' ? '#10B981' : teacher.status === 'On Leave' ? '#F59E0B' : '#EF4444'}40`,
                  background: teacher.status === 'Active' ? '#ECFDF5' : teacher.status === 'On Leave' ? '#FFFBEB' : '#FEF2F2',
                  color: teacher.status === 'Active' ? '#10B981' : teacher.status === 'On Leave' ? '#D97706' : '#EF4444',
                  fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <option value="Active">● Active</option>
                <option value="Inactive">○ Inactive</option>
                <option value="On Leave">◐ On Leave</option>
              </select>
            </div>
          </div>
        </div>

      {/* Details Body */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }} title={teacher.email || teacher.userId?.email}>{truncateEmail(teacher.email || teacher.userId?.email)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>{teacher.phone || '—'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>{formatDate(teacher.dateOfJoining)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.textMuted, fontWeight: 500 }}>{teacher.holidayCalendar === 'TEACHING' ? 'Teaching' : 'Non-Teaching'}</span>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: empType.bg, color: empType.color, border: `1px solid ${empType.border}` }}>
          {empType.label}
        </span>
        {teacher.employeeType === 'FIXED_TIME' && teacher.fixedShift && (
           <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>
             {fmt12(teacher.fixedShift.entryTime)} - {fmt12(teacher.fixedShift.exitTime)}
           </span>
        )}
        {teacher.employeeType === 'FIXED_HOURS' && teacher.fixedHours && (
           <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>
             Min: {teacher.fixedHours.minimumHours} hrs/day
           </span>
        )}
        {teacher.monthlySalary > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>
            ₹{teacher.monthlySalary.toLocaleString('en-IN')}/mo
          </span>
        )}
        <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>
          {classCount} Classes
        </span>
      </div>

      {/* Subjects */}
      {teacher.subjects && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '8px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
          <BookOpen size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{teacher.subjects}</span>
        </div>
      )}
      </div>

      {/* Actions */}
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', background: '#FAFAFC', marginTop: 'auto' }}>
        <Btn variant="secondary" icon={Eye} onClick={() => onView(teacher)} size="sm" style={{ flex: 1, padding: '8px', border: '1px solid #E2E8F0' }}>View</Btn>
        <Btn variant="secondary" icon={Edit2} onClick={() => onEdit(teacher)} size="sm" style={{ flex: 1, padding: '8px', border: '1px solid #E2E8F0' }}>Edit</Btn>
        <div style={{ width: 1, height: 24, background: colors.border, margin: '0 4px' }} />
        <IconBtn icon={Shield} onClick={() => onPermissions(teacher)} title="Manage Permissions" />
        <IconBtn icon={Trash2} onClick={() => onDelete(teacher)} title="Delete" danger />
      </div>
    </div>
  );
};

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
const ConfirmDialog = ({ open, onConfirm, onCancel, teacher, loading }) => (
  <Modal open={open} onClose={onCancel} title="Delete Teacher" maxWidth={420}>
    <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: `2px solid rgba(239,68,68,0.3)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Trash2 size={24} style={{ color: colors.danger }} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: colors.text }}>Delete {teacher?.name}?</h3>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>
        This will permanently delete the teacher account, profile photo, and linked user record. This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="danger" onClick={onConfirm} loading={loading} style={{ flex: 1 }}>Yes, Delete</Btn>
        <Btn variant="secondary" onClick={onCancel} style={{ flex: 1 }}>Cancel</Btn>
      </div>
    </div>
  </Modal>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function TeachersPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState(''); // Debouncing ke liye
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const LIMIT = 12;

  // Modals
  const [modal, setModal] = useState(null); // 'add' | 'edit' | 'view' | 'perms' | 'delete'
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'


  // Helper: Map backend response to frontend model
  const mapBackendToFrontend = useCallback((teacher) => {
    if (!teacher) return null;
    return {
      id: teacher._id || teacher.id,
      _id: teacher._id || teacher.id,
      employeeId: teacher.employeeId || '',
      name: teacher.name || '',
      email: teacher.email || teacher.userId?.email || '',
      phone: teacher.phone || '',
      dob: teacher.dob ? teacher.dob.split('T')[0] : '',
      dateOfJoining: teacher.dateOfJoining ? teacher.dateOfJoining.split('T')[0] : '',
      status: teacher.status || 'Active',
      subjects: teacher.subjects || '',
      classIds: teacher.classIds || [],
      photo: teacher.photo || null,
      qrCode: teacher.qrCode || '',
      permissions: teacher.permissions || {
        canViewStudentMobile: false,
        canMarkAttendance: false,
        canUploadPhotos: false,
        canViewSalary: false,
        canViewFeeInfo: false,
        canDisplayStaffQR: false,
        canManageFees: false,
        canManageStudents: false,
        canManageEmployees: false,
        canManageBirthdays: false,
        canManageEnquiries: false,
        aadhaarVerified: false,
        policeVerified: false,
      },
      adminNotes: teacher.adminNotes || [],
      userId: teacher.userId,
      lastLogin: teacher.userId?.lastLogin || null,
      isActive: teacher.userId?.isActive ?? true,
      // New fields from API response
      employeeType: teacher.employeeType || 'FIXED_TIME',
      monthlySalary: teacher.monthlySalary || 0,
      extraHourlyRate: teacher.extraHourlyRate || 0,
      holidayCalendar: teacher.holidayCalendar || 'TEACHING',
      fixedShift: teacher.fixedShift || {
        entryTime: '09:00',
        exitTime: '17:00',
        gracePeriodMinutes: 15,
        halfDayThresholdHours: 3,
        extraHoursPayment: false,
      },
      fixedHours: teacher.fixedHours || {
        minimumHours: 2,
        halfDayThresholdHours: 1,
        extraHoursPayment: false,
      },
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch classes from API for class assignment (only when needed)
  useEffect(() => {
    const fetchClasses = async () => {
      setClassesLoading(true);
      try {
        const res = await getClassesAPI({ limit: 100 });
        const rawClasses = res?.data?.data || res?.data || [];
        const mapped = (Array.isArray(rawClasses) ? rawClasses : []).map(c => ({
          id: c._id || c.id,
          _id: c._id || c.id,
          name: c.name || '',
          section: c.section || '',
          classType: c.classType,
          startTime: c.startTime || null,
          endTime: c.endTime || null,
          days: c.days || [],
          level: c.level || 0,
          status: c.status || 'Active',
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

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const res = await teacherService.getAll(params);
      const teachersList = res.data || [];
      setTeachers(teachersList.map(mapBackendToFrontend).filter(Boolean));
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, mapBackendToFrontend]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset page when search or filters change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openModal = (type, teacher = null) => {
    if (type === 'view') return navigate(`/admin/teachers/${teacher._id}`);
    if (type === 'edit') return navigate(`/admin/teachers/edit/${teacher._id}`);
    setSelectedTeacher(teacher);
    setModal(type);
  };
  const closeModal = () => {
    setModal(null);
    setSelectedTeacher(null);
  };

  const handleStatusChange = async (teacherId, newStatus) => {
    try {
      await teacherService.updateBasic(teacherId, { status: newStatus });
      // Update local state
      setTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, status: newStatus } : t));
      showToast('Teacher status updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update status';
      showToast(msg, 'error');
    }
  };

  const handlePermsSave = async (teacherId, permissions) => {
    // The API helper wraps the payload, so we pass the raw object directly
    const response = await teacherService.updatePermissions(teacherId, permissions);
    const teacherData = response.data?.data || response.data || response;
    
    const updated = mapBackendToFrontend(teacherData);
    if (!updated) throw new Error('Failed to map updated permissions data');
    
    setTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, permissions: updated.permissions } : t));
    if (selectedTeacher?._id === teacherId) {
      setSelectedTeacher(prev => ({ ...prev, permissions: updated.permissions }));
    }
    closeModal();
    showToast('Permissions updated successfully!');
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;
    setDeleteLoading(true);
    try {
      await teacherService.delete(selectedTeacher._id);
      setTeachers(prev => prev.filter(t => t._id !== selectedTeacher._id));
      closeModal();
      showToast('Teacher deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete teacher');
      showToast(err.response?.data?.error || 'Failed to delete teacher', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };


  // Stats
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [allTeachersForStats, setAllTeachersForStats] = useState([]);
  const [statFilter, setStatFilter] = useState('all');
  
  // Fetch attendance summary
  useEffect(() => {
    const fetchAttendanceSummary = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await getEmployeeAttendanceSummary(today);
        if (res?.success && res?.data) {
          setAttendanceSummary(res.data.summary);
          setAttendanceData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch attendance summary:', err);
      }
    };
    fetchAttendanceSummary();
    
    const fetchAll = async () => {
      try {
        const res = await teacherService.getAll({ limit: 1000 });
        setAllTeachersForStats((res.data || []).map(mapBackendToFrontend).filter(Boolean));
      } catch (err) {}
    };
    fetchAll();
  }, [mapBackendToFrontend]);

  const computedStats = useMemo(() => {
    if (!attendanceData?.employees || !allTeachersForStats.length) {
      return {
        total: attendanceSummary?.total ?? total,
        present: attendanceSummary?.present ?? 0,
        absent: attendanceSummary?.absent ?? 0,
        late: attendanceSummary?.late ?? 0,
      };
    }
    
    let present = 0;
    let absent = 0;
    let late = 0;
    
    allTeachersForStats.forEach(t => {
      const att = attendanceData.employees.find(e => {
        const tid = e.teacherId?._id || e.teacherId || e.teacher?._id || e.teacher || e.employeeId;
        return String(tid) === String(t._id) || (e.employeeId && String(e.employeeId) === String(t.employeeId));
      });
      const isPresent = att && ['Present', 'Late', 'Half Day'].includes(att.status);
      
      if (isPresent) present++;
      else absent++;
      
      if (t.employeeType === 'FIXED_TIME' && t.fixedShift?.entryTime && att?.checkInTime) {
        const checkInDate = new Date(att.checkInTime);
        const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
        const [fixedH, fixedM] = t.fixedShift.entryTime.split(':').map(Number);
        const fixedMins = fixedH * 60 + fixedM;
        if (checkInMins > fixedMins) {
          late++;
        }
      } else if (att?.status === 'Late') {
        late++;
      }
    });
    
    return {
      total: allTeachersForStats.length,
      present,
      absent,
      late,
    };
  }, [attendanceData, allTeachersForStats, attendanceSummary, total]);

  const displayedTeachers = useMemo(() => {
    if (statFilter === 'all') return teachers;
    if (!attendanceData?.employees) return allTeachersForStats;
    
    return allTeachersForStats.filter(t => {
      const att = attendanceData.employees.find(e => {
        const tid = e.teacherId?._id || e.teacherId || e.teacher?._id || e.teacher || e.employeeId;
        return String(tid) === String(t._id) || (e.employeeId && String(e.employeeId) === String(t.employeeId));
      });
      if (statFilter === 'present') return att && ['Present', 'Late', 'Half Day'].includes(att.status);
      if (statFilter === 'absent') return !att || ['Absent', 'Leave', 'On Leave'].includes(att.status);
      if (statFilter === 'late') {
        if (t.employeeType === 'FIXED_TIME' && t.fixedShift?.entryTime && att?.checkInTime) {
           const checkInDate = new Date(att.checkInTime);
           const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
           const [fixedH, fixedM] = t.fixedShift.entryTime.split(':').map(Number);
           const fixedMins = fixedH * 60 + fixedM;
           return checkInMins > fixedMins;
        }
        return att && att.status === 'Late';
      }
      return true;
    });
  }, [teachers, statFilter, allTeachersForStats, attendanceData]);

  const statCards = [
    { id: 'all', label: 'Total Employee', value: computedStats.total, icon: Users, color: colors.accent, bg: colors.accentLight },
    { id: 'absent', label: 'Absent Today', value: computedStats.absent, icon: UserX, color: colors.danger, bg: 'rgba(239,68,68,0.12)' },
    { id: 'present', label: 'Present Today', value: computedStats.present, icon: UserCheck, color: colors.success, bg: 'rgba(16,185,129,0.12)' },
    { id: 'late', label: 'Total Late', value: computedStats.late, icon: Clock, color: colors.warning, bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: none; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        * { font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.surface}; }
        ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 99px; }
        .teachers-page {
          position: relative;
          min-height: 100vh;
          background:
            ${colors.pageGlow},
            linear-gradient(180deg, #fbfcfe 0%, ${colors.bg} 100%);
        }
        .teachers-shell {
          padding: 28px 28px 60px;
        }
        .teachers-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.8fr);
          gap: 18px;
          margin-bottom: 24px;
        }
        .teachers-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 24px;
        }
        .teachers-grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .teachers-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .teachers-form-grid-wide,
        .teachers-detail-grid,
        .teachers-permissions-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .teachers-detail-actions {
          display: flex;
          gap: 9px;
        }
        @media (max-width: 1100px) {
          .teachers-hero,
          .teachers-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 900px) {
          .teachers-shell {
            padding: 22px 16px 36px;
          }
          .teachers-hero,
          .teachers-stats-grid,
          .teachers-form-grid,
          .teachers-form-grid-wide,
          .teachers-detail-grid,
          .teachers-permissions-grid {
            grid-template-columns: 1fr;
          }
          .teachers-detail-actions,
          .teachers-pagination-wrap {
            flex-direction: column;
            align-items: stretch !important;
          }
        }
        @media (max-width: 720px) {
          .teachers-grid-view {
            grid-template-columns: 1fr;
          }
          .teachers-toolbar-wrap {
            flex-direction: column;
            align-items: stretch !important;
          }
          .teachers-toolbar-actions {
            width: 100%;
            margin-left: 0 !important;
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="teachers-page" style={{ color: colors.text }}>
        <div className="teachers-shell">

        {/* Error Banner */}
        {error && (
          <div style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ color: '#D4AF37', fontSize: 18 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#D4AF37', flex: 1 }}>{error}</p>
            <button onClick={() => setError('')} style={{ border: 'none', background: '#FECDD3', color: '#D4AF37', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
        )}

        {/* Loading Spinner */}
        {pageLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #EFF6FF', borderTopColor: '#0F4C5C', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: '#94A3B8', fontWeight: 600 }}>Loading teachers…</p>
          </div>
        )}

        {/* ── Header ── */}
        <div className="teachers-hero">
          <div style={{ background: colors.hero, borderRadius: 24, padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 50px rgba(17,24,39,0.16)' }}>
            <div style={{ position: 'absolute', top: -30, right: -24, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -50, left: -12, width: 170, height: 170, borderRadius: '50%', background: 'rgba(249,115,22,0.18)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                <Users size={14} /> Brain Builder Staff Desk
              </div>
              <h1 style={{ margin: '16px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Employee Management</h1>
              <p style={{ margin: 0, maxWidth: 560, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)' }}>
                Manage profiles, permissions, and onboarding in a cleaner workspace aligned with your admin panel.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
                <Btn variant="secondary" icon={RefreshCw} onClick={fetchTeachers} loading={loading} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)' }}>Refresh</Btn>
                <Btn icon={UserPlus} onClick={() => navigate('/admin/teachers/add')} style={{ boxShadow: '0 10px 26px rgba(232,93,42,0.32)' }}>Add Staff</Btn>
              </div>
            </div>
          </div>
         
        </div>

        {/* ── Stats ── */}
        <div className="teachers-stats-grid">
          {statCards.map(({ id, label, value, icon: Icon, color, bg }) => (
            <div 
              key={label} 
              onClick={() => { setStatFilter(id); setPage(1); }}
              style={{ 
                background: statFilter === id ? bg : colors.card, 
                borderRadius: 20, 
                border: `1.5px solid ${statFilter === id ? color : colors.border}`, 
                padding: '18px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 14, 
                boxShadow: statFilter === id ? `0 12px 28px ${color}20` : '0 12px 28px rgba(15,23,42,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: statFilter === id ? 'translateY(-2px)' : 'none'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: statFilter === id ? colors.card : bg, border: statFilter === id ? `1px solid ${color}40` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {createElement(Icon, { size: 20, style: { color } })}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: statFilter === id ? color : colors.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ margin: '3px 0 0', fontSize: 24, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{loading ? '—' : value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="teachers-toolbar-wrap" style={{ background: colors.card, borderRadius: 20, border: `1px solid ${colors.border}`, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 12px 28px rgba(15,23,42,0.05)' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textDim, pointerEvents: 'none' }} />
            <input
              type="text" placeholder="Search name, email, employee ID…"
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = colors.accent}
              onBlur={e => e.target.style.borderColor = colors.border}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', minWidth: 140 }}>
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>

          <div className="teachers-toolbar-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {['grid', 'list'].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={{ width: 36, height: 36, borderRadius: 9, border: `1.5px solid ${viewMode === v ? colors.accent : colors.border}`, background: viewMode === v ? colors.accentLight : colors.surface, color: viewMode === v ? colors.accent : colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {v === 'grid' ? <LayoutGrid size={15} /> : <List size={15} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error State ── */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: colors.danger }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{error}</span>
            <Btn variant="ghost" onClick={fetchTeachers} size="sm" style={{ marginLeft: 'auto', color: colors.danger }}>Retry</Btn>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: colors.textMuted }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: colors.accent }} />
            <span style={{ fontSize: 14 }}>Loading teachers…</span>
          </div>
        )}

        {/* ── Grid View ── */}
        {!loading && viewMode === 'grid' && (
          <div className="teachers-grid-view">
            {displayedTeachers.map(t => (
              <TeacherCard
                key={t._id} teacher={t}
                onView={t => openModal('view', t)}
                onEdit={t => openModal('edit', t)}
                onDelete={t => openModal('delete', t)}
                onPermissions={t => openModal('perms', t)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* ── List View ── */}
        {!loading && viewMode === 'list' && (
          <div style={{ background: colors.card, borderRadius: 20, border: `1px solid ${colors.border}`, overflow: 'hidden', boxShadow: '0 12px 28px rgba(15,23,42,0.05)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '44px 1.6fr 1.3fr 0.9fr 1.3fr 1fr 0.9fr auto', gap: 10, padding: '10px 20px', borderBottom: `1px solid ${colors.border}`, background: colors.surface }}>
              {['', 'Staff', 'Contact', 'Status', 'Employment', 'Classes', 'Subjects', 'Actions'].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: colors.textDim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>
            {displayedTeachers.map((t, i) => {
              const teacherClasses = classesData.filter(c => t.classIds?.includes(c._id));
              const classNames = teacherClasses.map(c => `${c.name}${c.section ? ' - ' + c.section : ''}`).join(', ');
              return (
                <div key={t._id} style={{
                  display: 'grid', gridTemplateColumns: '44px 1.6fr 1.3fr 0.9fr 1.3fr 1fr 0.9fr auto',
                  gap: 10, padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < displayedTeachers.length - 1 ? `1px solid ${colors.border}` : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = colors.cardHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={t.name} photo={t.photo} size="sm" />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.text }}>{t.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.textDim, fontFamily: 'monospace' }}>{t.employeeId}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{truncateEmail(t.email || t.userId?.email || '—')}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.textDim }}>{t.phone || '—'}</p>
                  </div>
                  <StatusDot status={t.status} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: EMPLOYEE_TYPES[t.employeeType]?.color || colors.text }}>{EMPLOYEE_TYPES[t.employeeType]?.label || 'Fixed Time'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: colors.textDim }}>{t.employeeType === 'FIXED_TIME' ? `${fmt12(t.fixedShift?.entryTime)} - ${fmt12(t.fixedShift?.exitTime)}` : t.employeeType === 'FIXED_HOURS' ? `Min ${t.fixedHours?.minimumHours || 0} hrs/day` : 'Flexible Hours'}</p>
                  </div>
                  <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={classNames}>
                    {classNames || '—'}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subjects || '—'}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <IconBtn icon={Eye} onClick={() => navigate(`/admin/teachers/${t._id}`)} title="View" />
                    <IconBtn icon={Edit2} onClick={() => navigate(`/admin/teachers/edit/${t._id}`)} title="Edit" />
                    <IconBtn icon={Shield} onClick={() => openModal('perms', t)} title="Permissions" />
                    <IconBtn icon={Trash2} onClick={() => openModal('delete', t)} title="Delete" danger />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && displayedTeachers.length === 0 && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: colors.textMuted }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: colors.card, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Users size={30} style={{ color: colors.textDim }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: colors.text }}>No staff found</h3>
            <p style={{ margin: 0, fontSize: 13 }}>Try adjusting your search filters or add a new teacher</p>
            <Btn icon={UserPlus} onClick={() => navigate('/admin/teachers/add')} style={{ marginTop: 20 }}>Add First Teacher</Btn>
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && statFilter === 'all' && pages > 1 && (
          <div className="teachers-pagination-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, padding: '16px 20px', background: colors.card, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: '0 12px 28px rgba(15,23,42,0.05)' }}>
            <span style={{ fontSize: 12, color: colors.textMuted }}>
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total} teachers
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Btn variant="secondary" icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} size="sm">Prev</Btn>
              <div style={{ display: 'flex', gap: 5 }}>
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const p = i + 1;
                  return (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${page === p ? colors.accent : colors.border}`, background: page === p ? colors.accentLight : colors.surface, color: page === p ? colors.accent : colors.textMuted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <Btn variant="secondary" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} size="sm">
                Next <ChevronRight size={14} />
              </Btn>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Modals ── */}

      <Modal open={modal === 'perms'} onClose={closeModal} title="Manage Permissions" subtitle="Toggle teacher access controls (Admin only)">
        {selectedTeacher && (
          <PermissionsEditor teacher={selectedTeacher} onSave={handlePermsSave} onCancel={closeModal} />
        )}
      </Modal>

      <ConfirmDialog
        open={modal === 'delete'}
        teacher={selectedTeacher}
        onConfirm={handleDelete}
        onCancel={closeModal}
        loading={deleteLoading}
      />


      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}