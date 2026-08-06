import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Users, CheckCircle, Clock, Search, Download,
  GraduationCap, Phone, TrendingUp, AlertTriangle,
  ArrowUpDown, RefreshCw, LayoutGrid, List, ChevronDown,
  Calendar, Filter, X, Wifi, WifiOff, Briefcase, Heart, Mail, User, Eye, Edit2,
  Shield, MoreVertical, ChevronLeft, ChevronRight, MessageCircle, MapPin,
  IdCard, Droplet, Users2, Hash, History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { getStudentsAPI } from '../../api/students';
import { teacherService, getTeacherPhotoUrl } from '../../api/teachers';
import { API_ORIGIN } from '../../utils/photoUtils';
import {
  fetchActiveClasses,
  fetchDailyAttendanceSummary,
  fetchPresentStudents,
  fetchActiveStudents,
} from '../../api/reports';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];

const fmtTime = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return null; }
};

// Build the per-class flexi breakdown straight from the student document.
// Works for ANY class type (Fixed/Flex/Hours-based) — flexi hours are an
// optional add-on that can exist on classTimings[classId] regardless of the
// class's own schedule type, so we never filter by classType here.
// classMap (optional) is used to resolve a friendly class name/type label.
const buildFlexiClassDetails = (s = {}, classMap = {}) => {
  const classTimings = s.classTimings || {};
  const ids = Array.isArray(s.classIds) && s.classIds.length > 0
    ? s.classIds
    : Object.keys(classTimings);
  return ids
    .map(raw => {
      const cid = (raw && typeof raw === 'object') ? (raw._id || raw.id) : raw;
      const ct = classTimings[cid] || {};
      const cls = classMap[cid];
      return {
        classId: cid,
        className: cls?.name ? `${cls.name}${cls.section ? ' · ' + cls.section : ''}` : (cls?.className || 'Class'),
        classType: cls?.classType || '—',
        paid: Number(ct.paidFlexiHours) || 0,
        free: Number(ct.freeFlexiHours) || 0,
        consumed: Number(ct.consumedFlexiHours) || 0,
      };
    })
    // Only keep classes that actually have flexi hours attached — a Fixed/Flex
    // class the admin never added an add-on to should not show a fake row.
    .filter(f => f.paid > 0 || f.free > 0 || f.consumed > 0);
};

// Single source of truth for a student's flexi totals.
// Paid/Free entitlement is derived from the real per-class classTimings
// (source of truth, works for any class type). consumedFlexiHours is only
// ever incremented at the top-level student field by the backend right now
// (attendance/cron does not yet sync per-class consumption), so that one
// field is always read from the top level.
const computeFlexiTotals = (s = {}, classMap = {}) => {
  const details = s.flexiClassDetails || buildFlexiClassDetails(s, classMap);
  const classPaid = details.reduce((sum, f) => sum + f.paid, 0);
  const classFree = details.reduce((sum, f) => sum + f.free, 0);
  // Fall back to the top-level summary only if no per-class breakdown exists
  // at all (e.g. legacy student records saved before this add-on flow).
  const paid = classPaid > 0 ? classPaid : (Number(s.paidFlexiHours) || 0);
  const free = classFree > 0 ? classFree : (Number(s.freeFlexiHours) || 0);
  const consumed = Number(s.consumedFlexiHours) || 0;
  const total = paid + free;
  const remaining = Math.max(0, total - consumed);
  return { paid, free, consumed, total, remaining, isCritical: remaining < 6, details };
};

const calcRemainingFlexi = (s) => computeFlexiTotals(s).remaining;
const isFlexiCritical = (s) => computeFlexiTotals(s).isCritical;

const getPhotoUrl = (p, type) => {
  if (!p) return null;
  if (type === 'teacher') return getTeacherPhotoUrl(p);
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('data:')) return p;
  let c = p.replace(/\\/g, '/');
  const m = c.match(/(uploads\/.*)$/);
  if (m) c = m[1];
  return `${API_ORIGIN}/${c}`;
};

// Normalize any 10-digit Indian number (or already-prefixed) into a WhatsApp-ready digit string
const toWaNumber = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

// Pull the best "name / phone / email / photo" out of any student-shaped object
const deriveStudentBasics = (s = {}) => ({
  name: s.fullName || s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
  enrollmentId: s.admissionNo || s.enrollmentId || '—',
  phone: s.parentDetails?.primaryPhone || s.parentUserId?.phone || s.phone || s.parentPhone || s.parent?.phone || null,
  email: s.parentDetails?.primaryEmail || s.parentUserId?.email || s.email || null,
  photo: s.photo || null,
});

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  blue:   { bg: '#EFF6FF', text: '#0F4C5C', border: '#BFDBFE', light: '#DBEAFE' },
  green:  { bg: '#ECFDF5', text: '#065F46', border: '#6EE7B7', light: '#D1FAE5' },
  red:    { bg: '#FFF1F2', text: '#D4AF37', border: '#FECDD3', light: '#FFE4E6' },
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', light: '#FFEDD5' },
  purple: { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', light: '#EDE9FE' },
  gray:   { bg: '#F9FAFB', text: '#374151', border: '#E5E7EB', light: '#F3F4F6' },
  amber:  { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D', light: '#FEF3C7' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#5EEAD4', light: '#CCFBF1' },
  pink:   { bg: '#FDF2F8', text: '#9D174D', border: '#FBCFE8', light: '#FCE7F3' },
};

const PALETTES = [
  ['#3B82F6','#0F4C5C'],['#8B5CF6','#6D28D9'],['#10B981','#065F46'],
  ['#EF4444','#B91C1C'],['#F97316','#C2410C'],['#06B6D4','#0E7490'],
  ['#EC4899','#9D174D'],['#84CC16','#3F6212'],
];
const getPalette = (name='?') => PALETTES[name.charCodeAt(0) % PALETTES.length];

// ─── Micro Components ─────────────────────────────────────────────────────────
const Avatar = ({ name = '?', photo, type, size = 'md' }) => {
  const [imgErr, setImgErr] = useState(false);
  const src = photo && !imgErr ? getPhotoUrl(photo, type) : null;
  const [from, to] = getPalette(name);
  const dim = { sm: 32, md: 40, lg: 52, xl: 84 }[size] || 40;
  const fs  = { sm: 12, md: 14, lg: 20, xl: 32 }[size] || 14;
  return src ? (
    <img src={src} alt={name} onError={() => setImgErr(true)} style={{ width: dim, height: dim, minWidth: dim, borderRadius: size === 'xl' ? 20 : 10, objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: dim, height: dim, minWidth: dim, borderRadius: size === 'xl' ? 20 : 10, background: `linear-gradient(135deg,${from},${to})`, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:fs, flexShrink:0, letterSpacing:'-0.5px' }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const Badge = ({ children, color = 'gray' }) => {
  const s = C[color] || C.gray;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background:s.bg, color:s.text, border:`1.5px solid ${s.border}`, whiteSpace:'nowrap' }}>
      {children}
    </span>
  );
};

const StatCard = ({ label, value, icon: Icon, color = 'blue', sub }) => {
  const s = C[color] || C.blue;
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:'20px', border:'1px solid #F1F5F9', boxShadow:'0 1px 6px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${s.text}22,${s.border})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={22} color={s.text} />
      </div>
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{label}</p>
        <p style={{ fontSize:28, fontWeight:800, color:'#051d24', lineHeight:1 }}>{value}</p>
        {sub && <p style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>{sub}</p>}
      </div>
    </div>
  );
};

const Spinner = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80 }}>
    <div style={{ width:40, height:40, border:'3px solid #E2E8F0', borderTopColor:'#3B82F6', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const ErrorBanner = ({ msg, onRetry }) => (
  <div style={{ background:C.red.bg, border:`1px solid ${C.red.border}`, borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <WifiOff size={18} color={C.red.text} />
      <span style={{ color:C.red.text, fontWeight:600, fontSize:14 }}>{msg}</span>
    </div>
    <button onClick={onRetry} style={{ background:C.red.text, color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
      <RefreshCw size={14} /> Retry
    </button>
  </div>
);

const EmptyState = ({ icon: Icon = Users, msg }) => (
  <div style={{ textAlign:'center', padding:'64px 24px' }}>
    <div style={{ width:72, height:72, borderRadius:20, background:'#F8FAFC', border:'2px dashed #E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
      <Icon size={32} color='#CBD5E1' />
    </div>
    <p style={{ color:'#94A3B8', fontWeight:600, fontSize:15 }}>{msg}</p>
  </div>
);

// ─── View / Action Button ─────────────────────────────────────────────────────
const ViewButton = ({ onClick, variant = 'icon' }) => {
  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        title="View full details"
        style={{ width:32, height:32, borderRadius:9, border:'1.5px solid #E2E8F0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#BFDBFE'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
      >
        <Eye size={15} color="#3B82F6" />
      </button>
    );
  }
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ padding:'7px 12px', borderRadius:8, border:'1.5px solid #BFDBFE', background:'#EFF6FF', color:'#0F4C5C', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700 }}
    >
      <Eye size={13} /> View
    </button>
  );
};

// ─── Contact Buttons (Call / WhatsApp) ────────────────────────────────────────
const ContactButtons = ({ phone, size = 'md' }) => {
  if (!phone) return null;
  const wa = toWaNumber(phone);
  const pad = size === 'sm' ? '7px 12px' : '10px 18px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
      <a href={`tel:${phone}`} onClick={e => e.stopPropagation()}
        style={{ display:'inline-flex', alignItems:'center', gap:7, padding:pad, borderRadius:10, background:'linear-gradient(135deg,#0F4C5C,#051d24)', color:'#fff', textDecoration:'none', fontSize:fs, fontWeight:700, boxShadow:'0 2px 8px rgba(59,130,246,0.3)' }}>
        <Phone size={14} /> Call
      </a>
      {wa && (
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
          style={{ display:'inline-flex', alignItems:'center', gap:7, padding:pad, borderRadius:10, background:'linear-gradient(135deg,#25D366,#128C7E)', color:'#fff', textDecoration:'none', fontSize:fs, fontWeight:700, boxShadow:'0 2px 8px rgba(37,211,102,0.3)' }}>
          <MessageCircle size={14} /> WhatsApp
        </a>
      )}
    </div>
  );
};

// ─── Student / User Detail Modal (full-page) ──────────────────────────────────
const DetailRow = ({ icon: Icon, label, value, color = 'gray' }) => {
  if (!value) return null;
  const s = C[color] || C.gray;
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 0', borderBottom:'1px solid #F1F5F9' }}>
      <div style={{ width:34, height:34, borderRadius:9, background:s.bg, border:`1px solid ${s.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} color={s.text} />
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:10.5, color:'#94A3B8', fontWeight:700, marginBottom:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</p>
        <p style={{ fontSize:14, fontWeight:700, color:'#051d24', wordBreak:'break-word', margin:0 }}>{value}</p>
      </div>
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <p style={{ fontSize:12.5, fontWeight:800, color:'#051d24', textTransform:'uppercase', letterSpacing:'0.05em', margin:'24px 0 4px', display:'flex', alignItems:'center', gap:8 }}>
    {children}
  </p>
);

// Renders as a normal full-page view (NOT a fixed-position overlay/dialog) —
// the parent report component swaps its entire body for this when a record
// is selected, and swaps back on "Back". This gives a proper full-page detail
// experience instead of a popup modal.
const DetailPage = ({ record, onBack }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onBack(); };
    window.addEventListener('keydown', onKey);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  if (!record) return null;
  const s = record;
  const type = s.__type || 'student';
  const basics = deriveStudentBasics(s);
  const fatherName = s.parentDetails?.fatherName;
  const fatherPhone = s.parentDetails?.fatherPhone;
  const motherName = s.parentDetails?.motherName;
  const motherPhone = s.parentDetails?.motherPhone;
  const dob = fmtDate(s.dateOfBirth);
  const admissionDate = fmtDate(s.admissionDate);
  const addressObj = s.address;
  const address = addressObj ? [addressObj.street, addressObj.city, addressObj.state, addressObj.pincode].filter(Boolean).join(', ') : null;
  const siblings = s.siblings || [];

  // Flexi totals — computed fresh from classTimings (any class type) so this
  // always matches what's really saved, even if this record came from a
  // screen that didn't already attach flexiClassDetails/remainingFlexiHours.
  const flexi = type === 'student' ? computeFlexiTotals(s) : null;
  const flexiDetails = flexi?.details || [];

  const headerGradient = type === 'teacher'
    ? 'linear-gradient(135deg,#0F4C5C,#051d24)'
    : type === 'parent'
      ? 'linear-gradient(135deg,#F59E0B,#C2410C)'
      : 'linear-gradient(135deg,#0F4C5C,#051d24)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <button onClick={onBack}
        style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', marginBottom: 16, border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
        <ChevronLeft size={16} /> Back to list
      </button>

      <div style={{ background: '#fff', borderRadius: 22, width: '100%', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>

        {/* Header */}
        <div style={{ background: headerGradient, padding: '28px 28px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ boxShadow: '0 4px 14px rgba(0,0,0,0.25)', borderRadius: 20, border: '3px solid rgba(255,255,255,0.5)' }}>
              <Avatar name={basics.name} photo={basics.photo} type={type} size="xl" />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 22, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{basics.name}</h2>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 12.5, fontFamily: 'monospace' }}>{basics.enrollmentId}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                {s.className && (
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                    {s.className}{s.section ? ` · ${s.section}` : ''}
                  </span>
                )}
                {s.status && (
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
                    {s.status}
                  </span>
                )}
                {type !== 'student' && (
                  <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.22)', color: '#fff', textTransform: 'capitalize' }}>
                    {type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick contact actions */}
        {basics.phone && (
          <div style={{ padding: '16px 28px', borderBottom: '1px solid #F1F5F9' }}>
            <ContactButtons phone={basics.phone} />
          </div>
        )}

        {/* Body */}
        <div style={{ padding: '8px 28px 32px', maxWidth: 900 }}>

          <SectionTitle><User size={13} /> Contact & Identity</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', columnGap: 24 }}>
            <DetailRow icon={Phone} label="Primary Phone" value={basics.phone} color="green" />
            <DetailRow icon={Mail} label="Email" value={basics.email} color="blue" />
            <DetailRow icon={Calendar} label="Date of Birth" value={dob} color="amber" />
            <DetailRow icon={Shield} label="Gender" value={s.gender} color="purple" />
            <DetailRow icon={Droplet} label="Blood Group" value={s.bloodGroup} color="red" />
            <DetailRow icon={Hash} label="Roll No" value={s.rollNo} color="gray" />
          </div>

          {(fatherName || motherName || s.parentDetails?.primaryName) && (
            <>
              <SectionTitle><Heart size={13} /> Parent / Guardian</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', columnGap: 24 }}>
                <DetailRow icon={User} label="Father" value={fatherName ? `${fatherName}${fatherPhone ? ' · ' + fatherPhone : ''}` : null} color="blue" />
                <DetailRow icon={User} label="Mother" value={motherName ? `${motherName}${motherPhone ? ' · ' + motherPhone : ''}` : null} color="pink" />
                <DetailRow icon={IdCard} label="Relation" value={s.parentDetails?.relation} color="gray" />
              </div>
            </>
          )}

          <SectionTitle><GraduationCap size={13} /> Academic</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', columnGap: 24 }}>
            <DetailRow icon={IdCard} label="Admission No" value={s.admissionNo} color="teal" />
            <DetailRow icon={Calendar} label="Admission Date" value={admissionDate} color="teal" />
            <DetailRow icon={Calendar} label="Academic Year" value={s.admissionAY} color="gray" />
            <DetailRow icon={GraduationCap} label="Class" value={s.className ? `${s.className}${s.section ? ' · ' + s.section : ''}` : null} color="purple" />
            {s.employeeId && <DetailRow icon={IdCard} label="Employee ID" value={s.employeeId} color="purple" />}
            {s.subjects && <DetailRow icon={GraduationCap} label="Subjects" value={s.subjects} color="amber" />}
          </div>

          {address && (
            <>
              <SectionTitle><MapPin size={13} /> Address</SectionTitle>
              <DetailRow icon={MapPin} label="Address" value={address} color="gray" />
            </>
          )}

          {/* Flexi Hours — shown only if this student genuinely has flexi hours
              on ANY enrolled class (Fixed/Flex/Hours-based, doesn't matter) */}
          {flexi && (flexi.total > 0 || flexi.consumed > 0) && (
            <>
              <SectionTitle><Clock size={13} /> Flexi Hours</SectionTitle>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  ['Paid', flexi.paid, 'blue'],
                  ['Free', flexi.free, 'green'],
                  ['Total', flexi.total, 'gray'],
                  ['Consumed', flexi.consumed, 'orange'],
                  ['Remaining', flexi.remaining, flexi.isCritical ? 'red' : 'teal'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: C[c].bg, border: `1px solid ${C[c].border}`, borderRadius: 10, padding: '10px 16px', textAlign: 'center', minWidth: 84, flex: '1 0 auto' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: C[c].text, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{l}</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: C[c].text, margin: '2px 0 0' }}>{v}</p>
                  </div>
                ))}
              </div>
              {flexiDetails.length > 0 && (
                <div style={{ border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        {['Class', 'Type', 'Paid', 'Free', 'Consumed'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: (h === 'Class' || h === 'Type') ? 'left' : 'center', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flexiDetails.map(f => (
                        <tr key={f.classId} style={{ borderTop: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 700, color: '#051d24' }}>{f.className}</td>
                          <td style={{ padding: '8px 12px', fontSize: 11.5, color: '#64748B' }}>{f.classType.replace('_', ' ')}</td>
                          <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'center', color: C.blue.text, fontWeight: 700 }}>{f.paid}</td>
                          <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'center', color: C.green.text, fontWeight: 700 }}>{f.free}</td>
                          <td style={{ padding: '8px 12px', fontSize: 13, textAlign: 'center', color: C.orange.text, fontWeight: 700 }}>{f.consumed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {siblings.length > 0 && (
            <>
              <SectionTitle><Users2 size={13} /> Siblings</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {siblings.map((sib, i) => (
                  <Badge key={i} color="purple">{sib.name || sib.firstName || 'Sibling'}</Badge>
                ))}
              </div>
            </>
          )}

          {s.subtitle && type !== 'student' && (
            <>
              <SectionTitle><LayoutGrid size={13} /> Additional Info</SectionTitle>
              <DetailRow icon={LayoutGrid} label="Details" value={s.subtitle} color="gray" />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Toolbar ──────────────────────────────────────────────────────────────────
const Toolbar = ({ children }) => (
  <div style={{ background:'#fff', borderRadius:14, padding:'14px 16px', border:'1px solid #F1F5F9', boxShadow:'0 1px 4px rgba(0,0,0,0.05)', display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
    {children}
  </div>
);

const SearchBox = ({ value, onChange, placeholder }) => (
  <div style={{ position:'relative', flex:1, minWidth:200 }}>
    <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }} />
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width:'100%', paddingLeft:38, paddingRight: value ? 36 : 12, paddingTop:10, paddingBottom:10, border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, outline:'none', background:'#FAFAFA', boxSizing:'border-box', fontFamily:'inherit', transition:'border-color 0.2s' }}
      onFocus={e => e.target.style.borderColor='#3B82F6'}
      onBlur={e => e.target.style.borderColor='#E2E8F0'}
    />
    {value && (
      <button onClick={() => onChange('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:2, display:'flex' }}>
        <X size={14} color='#94A3B8' />
      </button>
    )}
  </div>
);

const SelectBox = ({ value, onChange, children }) => (
  <div style={{ position:'relative' }}>
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ appearance:'none', padding:'10px 32px 10px 14px', border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, background:'#FAFAFA', cursor:'pointer', outline:'none', fontFamily:'inherit', minWidth:140 }}>
      {children}
    </select>
    <ChevronDown size={14} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#64748B', pointerEvents:'none' }} />
  </div>
);

const SortBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ padding:'10px 12px', border:'1.5px solid #E2E8F0', borderRadius:10, background:'#FAFAFA', cursor:'pointer', display:'flex', alignItems:'center' }}>
    <ArrowUpDown size={16} color='#64748B' />
  </button>
);

const ViewToggle = ({ view, setView }) => (
  <div style={{ display:'flex', gap:4, background:'#F1F5F9', borderRadius:10, padding:4 }}>
    {[['grid', LayoutGrid], ['list', List]].map(([v, Icon]) => (
      <button key={v} onClick={() => setView(v)}
        style={{ padding:'7px 10px', borderRadius:8, border:'none', cursor:'pointer', background: view===v ? '#fff' : 'transparent', boxShadow: view===v ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', display:'flex', alignItems:'center', transition:'all 0.15s' }}>
        <Icon size={16} color={view===v ? '#3B82F6' : '#94A3B8'} />
      </button>
    ))}
  </div>
);

// ─── CSV Export ───────────────────────────────────────────────────────────────
const exportCSV = (rows, filename) => {
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ─── PRESENT STUDENTS REPORT ──────────────────────────────────────────────────
export const PresentStudentsReport = () => {
  const [date, setDate] = useState(today());
  const [classes, setClasses]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [rawAttendance, setRaw] = useState([]);
  const [allStudents, setAll]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [search, setSearch]     = useState('');
  const [classFilter, setClass] = useState('all');
  const [sortBy, setSort]       = useState('name');
  const [sortDir, setDir]       = useState('asc');
  const [view, setView]         = useState('list');
  const [viewRecord, setViewRecord] = useState(null);

   const load = useCallback(async () => {
     setLoading(true); setError(null);
     try {
       // Fetch all data in parallel, but don't fail entirely if one fails
       const [clsRes, smryRes, attRes, studsRes] = await Promise.allSettled([
         fetchActiveClasses(),
         fetchDailyAttendanceSummary(date),
         fetchPresentStudents(date),
         fetchActiveStudents(),
       ]);
       
       // Process successful results
       let classes = [];
       let summary = {};
       let rawAttendance = [];
       let allStudents = [];
       let successCount = 0;
       
       if (clsRes.status === 'fulfilled') {
         successCount++;
         classes = clsRes.value || [];
       }
       
       if (smryRes.status === 'fulfilled') {
         successCount++;
         summary = smryRes.value?.summary || {};
       }
       
       if (attRes.status === 'fulfilled') {
         successCount++;
         rawAttendance = attRes.value || [];
       }
       
       if (studsRes.status === 'fulfilled') {
         successCount++;
         allStudents = studsRes.value || [];
       }
       
       // Only set error if all requests failed
       if (successCount === 0) {
         setError('Failed to load data');
       } else {
         setClasses(classes);
         setSummary(summary);
         
         // Merge attendance with student details (only if we have both attendance and students)
         if (attRes.status === 'fulfilled' && studsRes.status === 'fulfilled') {
           const studMap = {};
           allStudents.forEach(s => { studMap[s._id] = s; studMap[s.id] = s; });
           const merged = rawAttendance.map(a => {
             const s = studMap[a.studentId] || studMap[a.student?._id] || {};
             const cls2 = classes.find(c => c._id === (a.classId || s.classId));
             const basics = deriveStudentBasics(s);
             return {
               ...s, ...a,
               __type: 'student',
               id: a._id || a.id,
               name: a.studentName || basics.name || a.student?.name || '—',
               enrollmentId: s.enrollmentId || a.enrollmentId || basics.enrollmentId || '—',
               className: cls2?.name || a.className || s.className || '—',
               section: cls2?.section || '',
               checkInTime: fmtTime(a.checkInTime || a.checkIn),
               checkOutTime: fmtTime(a.checkOutTime || a.checkOut),
               phone: basics.phone || '—',
               scheduleStart: cls2?.startTime, scheduleEnd: cls2?.endTime,
               remainingFlexi: calcRemainingFlexi(s),
               isCritical: isFlexiCritical(s),
             };
           });
           setRaw(merged);
         } else if (attRes.status === 'fulfilled') {
           // If we only have attendance, set it as raw (limited functionality)
           setRaw(rawAttendance);
         }
         
         setAll(allStudents);
       }
     } catch (e) {
       // Only set error if it's a general catch-all error (shouldn't happen with allSettled)
       setError('Failed to load data');
     } finally { setLoading(false); }
   }, [date]);

  useEffect(() => { load(); }, [load]);

  const displayed = useMemo(() => {
    let d = [...rawAttendance];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.enrollmentId?.toLowerCase().includes(q) ||
        s.className?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
      );
    }
    if (classFilter !== 'all') {
      d = d.filter(s => s.classId === classFilter || s.className === classFilter);
    }
    d.sort((a, b) => {
      const v = sortBy === 'name' ? a.name?.localeCompare(b.name)
        : sortBy === 'class' ? a.className?.localeCompare(b.className)
        : sortBy === 'checkIn' ? (a.checkInTime||'').localeCompare(b.checkInTime||'')
        : 0;
      return sortDir === 'asc' ? v : -v;
    });
    return d;
  }, [rawAttendance, search, classFilter, sortBy, sortDir]);

  const classWise = useMemo(() => {
    const map = {};
    displayed.forEach(s => { map[s.className] = (map[s.className]||0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [displayed]);

  const total = summary?.total ?? rawAttendance.length;
  const totalActive = allStudents.length || 0;
  const pct = totalActive > 0 ? Math.round((displayed.length / totalActive) * 100) : 0;

  const handleExport = () => {
    exportCSV([
      ['Name','Enrollment ID','Class','Check-in','Check-out','Phone','Flexi Hours'],
      ...displayed.map(s => [s.name, s.enrollmentId, s.className, s.checkInTime, s.checkOutTime, s.phone, s.remainingFlexi]),
    ], `present_${date}_${classFilter === 'all' ? 'all-classes' : (classes.find(c => c._id === classFilter)?.name || classFilter)}.csv`);
  };

  if (loading) return <Spinner />;

  // Full-page detail view replaces the list entirely while a record is selected
  if (viewRecord) return <DetailPage record={viewRecord} onBack={() => setViewRecord(null)} />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#051d24', margin:0 }}>Present Students</h1>
          <p style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>Real-time attendance for <strong style={{color:'#475569'}}>{date}</strong></p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Calendar size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#64748B' }} />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ paddingLeft:32, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid #E2E8F0', borderRadius:10, fontSize:13, fontFamily:'inherit', outline:'none', background:'#fff' }} />
          </div>
          <button onClick={load} style={{ padding:'9px 14px', border:'1.5px solid #E2E8F0', borderRadius:10, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#64748B' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleExport} style={{ padding:'9px 16px', background:'linear-gradient(135deg,#10B981,#059669)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700 }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error} onRetry={load} />}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
        <StatCard label="Present Today" value={displayed.length} icon={CheckCircle} color="green" />
        <StatCard label="Total Students" value={totalActive} icon={Users} color="blue" />
        <StatCard label="Attendance %" value={`${pct}%`} icon={TrendingUp} color="purple" />
        <StatCard label="Classes Active" value={classWise.length} icon={GraduationCap} color="amber" />
      </div>

      {/* Class Breakdown */}
      {classWise.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9', padding:'18px 20px' }}>
          <p style={{ fontSize:13, fontWeight:700, color:'#475569', marginBottom:12, textTransform:'uppercase', letterSpacing:'0.05em' }}>Class Breakdown</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            {classWise.map(c => (
              <div key={c.name} style={{ background:C.purple.bg, border:`1px solid ${C.purple.border}`, borderRadius:10, padding:'10px 16px', textAlign:'center', minWidth:80 }}>
                <p style={{ fontSize:12, fontWeight:600, color:C.purple.text, marginBottom:4 }}>{c.name}</p>
                <p style={{ fontSize:22, fontWeight:800, color:'#6D28D9' }}>{c.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, class, enrollment, phone..." />
        <SelectBox value={classFilter} onChange={setClass}>
          <option value="all">All Classes</option>
          {classes.map(c => (
            <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
          ))}
        </SelectBox>
        <SelectBox value={sortBy} onChange={setSort}>
          <option value="name">Sort: Name</option>
          <option value="class">Sort: Class</option>
          <option value="checkIn">Sort: Check-in</option>
        </SelectBox>
        <SortBtn onClick={() => setDir(d => d==='asc'?'desc':'asc')} />
        <ViewToggle view={view} setView={setView} />
        <span style={{ fontSize:12, color:'#94A3B8', marginLeft:'auto' }}>{displayed.length} students</span>
      </Toolbar>

      {/* Content */}
      {displayed.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9' }}>
          <EmptyState icon={CheckCircle} msg="No students present matching your criteria" />
        </div>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {displayed.map(s => (
            <div key={s.id} style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9', padding:18, boxShadow:'0 1px 6px rgba(0,0,0,0.05)', transition:'box-shadow 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 1px 6px rgba(0,0,0,0.05)'}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <Avatar name={s.name} photo={s.photo} type="student" size="lg" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:800, fontSize:15, color:'#051d24', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</p>
                  <p style={{ fontSize:11, color:'#94A3B8', fontFamily:'monospace' }}>{s.enrollmentId}</p>
                </div>
                <Badge color={s.isCritical ? 'red' : 'green'}>{s.remainingFlexi}h</Badge>
                <ViewButton onClick={() => setViewRecord(s)} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'#94A3B8', fontWeight:600, marginBottom:2 }}>CLASS</p>
                  <p style={{ fontSize:12, fontWeight:700, color:'#475569' }}>{s.className}{s.section ? ` · ${s.section}` : ''}</p>
                </div>
                <div style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'#94A3B8', fontWeight:600, marginBottom:2 }}>CHECK-IN</p>
                  <p style={{ fontSize:12, fontWeight:700, color:'#10B981' }}>{s.checkInTime}</p>
                </div>
                <div style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'#94A3B8', fontWeight:600, marginBottom:2 }}>SCHEDULE</p>
                  <p style={{ fontSize:12, fontWeight:700, color:'#475569' }}>{s.scheduleStart ? `${fmtTime(s.scheduleStart)}–${fmtTime(s.scheduleEnd)}` : '—'}</p>
                </div>
                <div style={{ background:'#F8FAFC', borderRadius:8, padding:'8px 10px' }}>
                  <p style={{ fontSize:10, color:'#94A3B8', fontWeight:600, marginBottom:2 }}>PHONE</p>
                  <p style={{ fontSize:12, fontWeight:700, color:'#475569', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.phone}</p>
                </div>
              </div>
              <div style={{ marginTop:10 }}>
                <ContactButtons phone={s.phone !== '—' ? s.phone : null} size="sm" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Student','Enrollment ID','Class','Schedule','Check-in','Check-out','Phone','Flexi Hrs',''].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((s, i) => (
                  <tr key={s.id} style={{ borderTop:'1px solid #F1F5F9', background: i%2===0 ? '#fff' : '#FAFAFA', cursor:'pointer' }}
                    onClick={() => setViewRecord(s)}
                    onMouseEnter={e => e.currentTarget.style.background='#F0F9FF'}
                    onMouseLeave={e => e.currentTarget.style.background= i%2===0 ? '#fff' : '#FAFAFA'}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <Avatar name={s.name} photo={s.photo} type="student" size="sm" />
                        <span style={{ fontWeight:700, fontSize:14, color:'#051d24' }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:12, fontFamily:'monospace', color:'#64748B', background:'#F1F5F9', padding:'2px 8px', borderRadius:6 }}>{s.enrollmentId}</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <Badge color="purple">{s.className}{s.section ? ` · ${s.section}` : ''}</Badge>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'#64748B', whiteSpace:'nowrap' }}>
                      {s.scheduleStart ? `${fmtTime(s.scheduleStart)} – ${fmtTime(s.scheduleEnd)}` : '—'}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:13, fontWeight:700, color:'#10B981', display:'flex', alignItems:'center', gap:5 }}>
                        <Clock size={13} />{s.checkInTime}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px', fontSize:13, color:'#64748B' }}>{s.checkOutTime}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:13, color:'#475569', display:'flex', alignItems:'center', gap:5 }}>
                        <Phone size={13} />{s.phone}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <Badge color={s.isCritical ? 'red' : 'green'}>{s.remainingFlexi} hrs</Badge>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <ViewButton onClick={() => setViewRecord(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── FLEXI HOURS REPORT ───────────────────────────────────────────────────────
export const FlexiHoursReport = () => {
  const navigate = useNavigate();
  const [allStudents, setAll]   = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [search, setSearch]     = useState('');
  const [filterType, setFilter] = useState('all');
  const [sortBy, setSort]       = useState('remaining');
  const [sortDir, setDir]       = useState('desc');
  const [view, setView]         = useState('list');
  const [viewRecord, setViewRecord] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [classesRes, studsRes] = await Promise.allSettled([
        fetchActiveClasses(),
        fetchActiveStudents(),
      ]);

      // Keep every class (any type) so we can label per-class flexi breakdowns by name
      if (classesRes.status === 'fulfilled') {
        setAllClasses(classesRes.value || []);
      }

      // Show every active student that has any flexi-hours data at all —
      // regardless of which class(es) they're enrolled in.
      let students = [];
      if (studsRes.status === 'fulfilled') {
        const allStuds = studsRes.value || [];
        students = allStuds.filter(s =>
          (s.paidFlexiHours || 0) > 0 ||
          (s.freeFlexiHours || 0) > 0 ||
          (s.consumedFlexiHours || 0) > 0 ||
          Object.values(s.classTimings || {}).some(ct =>
            (ct.paidFlexiHours || 0) > 0 || (ct.freeFlexiHours || 0) > 0 || (ct.consumedFlexiHours || 0) > 0
          )
        );
      }

      // Set error only if both requests failed
      if (classesRes.status === 'rejected' && studsRes.status === 'rejected') {
        setError('Failed to load flexi hours data');
      }

      setAll(students);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load students');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flexiData = useMemo(() => {
    const classMap = {};
    allClasses.forEach(c => { classMap[c._id || c.id] = c; });

    let d = allStudents.map(s => {
      const basics = deriveStudentBasics(s);

      // Real source of truth: sum flexi hours from each class's classTimings
      // entry (works for ANY class type — Fixed/Flex/Hours-based — since
      // flexi hours are an optional add-on, not tied to classType). Falls
      // back to the top-level summary only for legacy records that predate
      // the per-class add-on flow.
      const flexiClassDetails = buildFlexiClassDetails(s, classMap);
      const totals = computeFlexiTotals({ ...s, flexiClassDetails });

      return {
        ...s,
        __type: 'student',
        id: s._id || s.id,
        name: basics.name,
        enrollmentId: basics.enrollmentId,
        phone: basics.phone,
        email: basics.email,
        photo: basics.photo,
        flexiClassNames: flexiClassDetails.map(f => f.className).join(', ') || '—',
        flexiClassDetails,
        paidFlexiHours: totals.paid,
        freeFlexiHours: totals.free,
        consumedFlexiHours: totals.consumed,
        totalFlexiHours: totals.total,
        remainingFlexiHours: totals.remaining,
        isCritical: totals.isCritical,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      d = d.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.enrollmentId?.toLowerCase().includes(q) ||
        s.className?.toLowerCase().includes(q) ||
        s.flexiClassNames?.toLowerCase().includes(q) ||
        s.phone?.includes(q)
      );
    }

    if (filterType === 'critical') d = d.filter(s => s.isCritical);
    if (filterType === 'zero')     d = d.filter(s => s.remainingFlexiHours === 0);
    if (filterType === 'good')     d = d.filter(s => s.remainingFlexiHours >= 6);

    d.sort((a, b) => {
      const v = sortBy === 'remaining' ? a.remainingFlexiHours - b.remainingFlexiHours
        : sortBy === 'total'    ? a.totalFlexiHours - b.totalFlexiHours
        : sortBy === 'consumed' ? a.consumedFlexiHours - b.consumedFlexiHours
        : a.name?.localeCompare(b.name);
      return sortDir === 'asc' ? v : -v;
    });
    return d;
  }, [allStudents, allClasses, search, filterType, sortBy, sortDir]);

  const stats = useMemo(() => ({
    total: flexiData.length,
    critical: flexiData.filter(s => s.isCritical).length,
    zero: flexiData.filter(s => s.remainingFlexiHours === 0).length,
    avg: flexiData.length > 0
      ? Math.round(flexiData.reduce((sum, s) => sum + s.remainingFlexiHours, 0) / flexiData.length)
      : 0,
  }), [flexiData]);

  const handleExport = () => {
    // flexiData already has search + filterType (critical/zero/good) + sort applied,
    // so the CSV always matches exactly what's on screen right now.
    exportCSV([
      ['Name','Enrollment ID','Classes','Paid Hrs','Free Hrs','Total Hrs','Consumed Hrs','Remaining Hrs','Status'],
      ...flexiData.map(s => [s.name, s.enrollmentId, s.flexiClassNames, s.paidFlexiHours, s.freeFlexiHours, s.totalFlexiHours, s.consumedFlexiHours, s.remainingFlexiHours, s.isCritical ? 'Critical' : s.remainingFlexiHours === 0 ? 'Zero' : 'Good']),
    ], `flexi_hours_${filterType}_${today()}.csv`);
  };

  // Progress bar helper
  const FlexiBar = ({ consumed, total }) => {
    const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;
    const color = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F97316' : '#10B981';
    return (
      <div style={{ width:'100%' }}>
        <div style={{ background:'#F1F5F9', borderRadius:99, height:6, overflow:'hidden', marginBottom:4 }}>
          <div style={{ width:`${pct}%`, height:'100%', background:color, borderRadius:99, transition:'width 0.4s' }} />
        </div>
        <span style={{ fontSize:10, color:'#94A3B8' }}>{pct}% used</span>
      </div>
    );
  };

  if (loading) return <Spinner />;

  // Full-page detail view replaces the list entirely while a record is selected
  if (viewRecord) return <DetailPage record={viewRecord} onBack={() => setViewRecord(null)} />;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#051d24', margin:0 }}>Flexi Hours Report</h1>
          <p style={{ fontSize:13, color:'#94A3B8', marginTop:4 }}>All students with flexi hours — Paid & Free hours, across every class they're enrolled in</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? '/teacher/flexi-hours-history' : '/admin/flexi-hours-history')} title="Flexi Hours History"
            style={{ padding:'9px 14px', border:'1.5px solid #E2E8F0', borderRadius:10, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#64748B' }}>
            <History size={15} /> History
          </button>
          <button onClick={load} style={{ padding:'9px 14px', border:'1.5px solid #E2E8F0', borderRadius:10, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'#64748B' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleExport} style={{ padding:'9px 16px', background:'linear-gradient(135deg,#F97316,#EA580C)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700 }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error} onRetry={load} />}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}>
        <StatCard label="Flexi Students" value={stats.total} icon={Users} color="blue" />
        <StatCard label="Critical (<6 hrs)" value={stats.critical} icon={AlertTriangle} color="red" />
        <StatCard label="Zero Balance" value={stats.zero} icon={TrendingUp} color="gray" />
        {/* <StatCard label="Avg Remaining" value={`${stats.avg}h`} icon={Clock} color="teal" /> */}
      </div>

      {/* Filters */}
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, enrollment, flexi class, phone..." />
        <SelectBox value={filterType} onChange={setFilter}>
          <option value="all">All Students</option>
          <option value="critical">Critical (&lt;6 hrs)</option>
          <option value="zero">Zero Balance</option>
          <option value="good">6+ Hours</option>
        </SelectBox>
        <SelectBox value={sortBy} onChange={setSort}>
          <option value="remaining">Sort: Remaining</option>
          <option value="total">Sort: Total</option>
          <option value="consumed">Sort: Consumed</option>
          <option value="name">Sort: Name</option>
        </SelectBox>
        <SortBtn onClick={() => setDir(d => d==='asc'?'desc':'asc')} />
        <ViewToggle view={view} setView={setView} />
        <span style={{ fontSize:12, color:'#94A3B8', marginLeft:'auto' }}>{flexiData.length} students</span>
      </Toolbar>

      {/* Content */}
      {flexiData.length === 0 ? (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9' }}>
          <EmptyState icon={TrendingUp} msg="No students with flexi hours found matching your criteria" />
        </div>
      ) : view === 'grid' ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {flexiData.map(s => (
            <div key={s.id} style={{ background:'#fff', borderRadius:14, border:`1.5px solid ${s.isCritical ? C.red.border : '#F1F5F9'}`, padding:18, boxShadow: s.isCritical ? `0 0 0 3px ${C.red.bg}` : '0 1px 6px rgba(0,0,0,0.05)', transition:'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow=s.isCritical ? `0 4px 16px rgba(239,68,68,0.2)` : '0 4px 16px rgba(0,0,0,0.1)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow=s.isCritical ? `0 0 0 3px ${C.red.bg}` : '0 1px 6px rgba(0,0,0,0.05)'}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <Avatar name={s.name} photo={s.photo} type="student" size="md" />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:800, fontSize:14, color:'#051d24', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</p>
                  <p style={{ fontSize:11, color:'#94A3B8', fontFamily:'monospace' }}>{s.enrollmentId}</p>
                </div>
                {s.isCritical ? (
                  <Badge color="red"><AlertTriangle size={10} /> Critical</Badge>
                ) : s.remainingFlexiHours === 0 ? (
                  <Badge color="gray">Zero</Badge>
                ) : (
                  <Badge color="green">Good</Badge>
                )}
                <ViewButton onClick={() => setViewRecord(s)} />
              </div>
              {s.flexiClassNames && (
                <p style={{ fontSize:11, color:'#94A3B8', marginBottom:8 }}>Classes: <strong style={{ color:'#475569' }}>{s.flexiClassNames}</strong></p>
              )}
              <FlexiBar consumed={s.consumedFlexiHours} total={s.totalFlexiHours} />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginTop:12 }}>
                {[
                  ['Paid', s.paidFlexiHours, 'blue'],
                  ['Free', s.freeFlexiHours, 'green'],
                  ['Used', s.consumedFlexiHours, 'orange'],
                  ['Left', s.remainingFlexiHours, s.isCritical ? 'red' : 'teal'],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: C[c].bg, borderRadius:8, padding:'8px 6px', textAlign:'center' }}>
                    <p style={{ fontSize:9, fontWeight:700, color: C[c].text, textTransform:'uppercase', letterSpacing:'0.05em' }}>{l}</p>
                    <p style={{ fontSize:18, fontWeight:800, color: C[c].text }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12 }}>
                <ContactButtons phone={s.phone} size="sm" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #F1F5F9', overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#F8FAFC' }}>
                  {['Student','Enrollment ID','Classes','Paid','Free','Total','Consumed','Remaining','Progress','Status',''].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign: ['Paid','Free','Total','Consumed','Remaining'].includes(h) ? 'center' : 'left', fontSize:11, fontWeight:700, color:'#94A3B8', textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {flexiData.map((s, i) => {
                  const pct = s.totalFlexiHours > 0 ? Math.min(100, Math.round((s.consumedFlexiHours / s.totalFlexiHours) * 100)) : 0;
                  const barColor = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F97316' : '#10B981';
                  return (
                    <tr key={s.id} style={{ borderTop:'1px solid #F1F5F9', background: s.isCritical ? '#FFF5F5' : i%2===0 ? '#fff' : '#FAFAFA', cursor:'pointer' }}
                      onClick={() => setViewRecord(s)}
                      onMouseEnter={e => e.currentTarget.style.background='#F0F9FF'}
                      onMouseLeave={e => e.currentTarget.style.background = s.isCritical ? '#FFF5F5' : i%2===0 ? '#fff' : '#FAFAFA'}>
                      <td style={{ padding:'12px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <Avatar name={s.name} photo={s.photo} type="student" size="sm" />
                          <div>
                            <p style={{ fontWeight:700, fontSize:14, color:'#051d24' }}>{s.name}</p>
                            {s.className && <p style={{ fontSize:11, color:'#94A3B8' }}>{s.className}</p>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <span style={{ fontSize:12, fontFamily:'monospace', color:'#64748B', background:'#F1F5F9', padding:'2px 8px', borderRadius:6 }}>{s.enrollmentId}</span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <Badge color="amber">{s.flexiClassNames || '—'}</Badge>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:C.blue.text }}>{s.paidFlexiHours}</span>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:C.green.text }}>{s.freeFlexiHours}</span>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        <span style={{ fontSize:14, fontWeight:800, color:'#051d24' }}>{s.totalFlexiHours}</span>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        <span style={{ fontSize:14, fontWeight:700, color:C.orange.text }}>{s.consumedFlexiHours}</span>
                      </td>
                      <td style={{ padding:'12px 16px', textAlign:'center' }}>
                        <span style={{ fontSize:20, fontWeight:800, color: s.isCritical ? C.red.text : C.green.text }}>{s.remainingFlexiHours}</span>
                      </td>
                      <td style={{ padding:'12px 16px', minWidth:120 }}>
                        <div style={{ background:'#F1F5F9', borderRadius:99, height:8, overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:barColor, borderRadius:99, transition:'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize:10, color:'#94A3B8' }}>{pct}% used</span>
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        {s.isCritical ? (
                          <Badge color="red"><AlertTriangle size={10} /> Critical</Badge>
                        ) : s.remainingFlexiHours === 0 ? (
                          <Badge color="gray">Zero</Badge>
                        ) : (
                          <Badge color="green">Good</Badge>
                        )}
                      </td>
                      <td style={{ padding:'12px 16px' }}>
                        <ViewButton onClick={() => setViewRecord(s)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export const AllUsersDirectory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, student, teacher, parent
  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [viewRecord, setViewRecord] = useState(null);
  const itemsPerPage = 24;

  const navigate = useNavigate();

   const loadData = useCallback(async () => {
     setLoading(true);
     setError(null);
     try {
       const [studentsRes, teachersRes, parentsRes] = await Promise.allSettled([
         getStudentsAPI({ page: 1, limit: 100 }),
         teacherService.getAll({ page: 1, limit: 100 }),
         api.get('/parents?page=1&limit=100')
       ]);

       let combined = [];
       let successCount = 0;

       if (studentsRes.status === 'fulfilled') {
         successCount++;
         const sData = studentsRes.value?.data?.data || studentsRes.value?.data || [];
         const arr = Array.isArray(sData) ? sData : [];
         combined.push(...arr.map(s => ({
           id: s._id || s.id,
           type: 'student',
           name: s.fullName || `${s.firstName || ''} ${s.lastName !== '.' ? s.lastName : ''}`.trim() || 'Unknown',
           email: s.email || s.parentDetails?.primaryEmail || '',
           phone: s.parentDetails?.primaryPhone || s.phone || '',
           avatar: s.photo || null,
           status: s.status || 'Active',
           subtitle: `Class: ${s.className || 'N/A'}${s.section ? ' - ' + s.section : ''}`,
           identifier: s.admissionNo || s.enrollmentId || 'No ID',
           raw: s
         })));
       }

       if (teachersRes.status === 'fulfilled') {
         successCount++;
         const tData = teachersRes.value?.data || [];
         const arr = Array.isArray(tData) ? tData : [];
         combined.push(...arr.map(t => ({
           id: t._id || t.id,
           type: 'teacher',
           name: t.name || 'Unknown',
           email: t.email || t.userId?.email || '',
           phone: t.phone || '',
           avatar: t.photo || null,
           status: t.status || 'Active',
           subtitle: `Subjects: ${t.subjects || 'N/A'}`,
           identifier: t.employeeId || 'No ID',
           raw: t
         })));
       }

       if (parentsRes.status === 'fulfilled') {
         successCount++;
         const pData = parentsRes.value?.data?.data || parentsRes.value?.data || [];
         const arr = Array.isArray(pData) ? pData : [];
         combined.push(...arr.map(p => ({
           id: p.userId?._id || p._id,
           type: 'parent',
           name: p.userId?.name || p.name || 'Unknown',
           email: p.userId?.email || p.email || '',
           phone: p.userId?.phone || p.phone || '',
           avatar: p.photo || null,
           status: p.userId?.isActive ? 'Active' : 'Inactive',
           subtitle: `Children: ${p.children?.map(c => c.firstName || c.name || c.fullName).join(', ') || 'N/A'}`,
           identifier: 'Parent',
           raw: p
         })));
       }

       // Only set error if all requests failed AND we have no data
       if (successCount === 0 && combined.length === 0) {
         setError('Failed to load users directory');
       }

       setData(combined);
     } catch (e) {
       // Only set error if it's a general catch-all error
       setError('Failed to load users directory');
     } finally {
       setLoading(false);
     }
   }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayed = useMemo(() => {
    let d = data;
    if (roleFilter !== 'all') {
      d = d.filter(item => item.type === roleFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(item => 
        (item.name || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q) ||
        (item.phone || '').toLowerCase().includes(q) ||
        (item.identifier || '').toLowerCase().includes(q)
      );
    }
    return d.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [data, roleFilter, search]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / itemsPerPage));
  const paginated = displayed.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  useEffect(() => { setPage(1); }, [search, roleFilter]);

  const handleExport = () => {
    // `displayed` already has the search text AND role filter applied (across
    // all pages, not just the currently visible page), so the export always
    // matches what's currently filtered on screen.
    exportCSV([
      ['Name', 'Role', 'ID/Identifier', 'Email', 'Phone', 'Status', 'Additional Info'],
      ...displayed.map(u => [
        u.name, u.type, u.identifier, u.email, u.phone, u.status, u.subtitle
      ])
    ], `users_directory_${roleFilter}_${today()}.csv`);
  };

  const handleView = (user) => {
    if (user.type === 'student') {
      const routeId = user.raw.admissionNo || user.raw.enrollmentId || user.id;
      navigate(window.location.pathname.includes('/teacher') ? `/teacher/manage-students/${routeId}` : `/admin/students/${routeId}`);
    } else if (user.type === 'teacher') {
      navigate(`/admin/teachers/${user.id}`);
    }
  };

  // Open the full-page detail view with everything the API gave us about this user
  const handlePreview = (user) => {
    setViewRecord({
      ...user.raw,
      __type: user.type,
      name: user.name,
      photo: user.avatar,
      phone: user.phone,
      email: user.email,
      subtitle: user.subtitle,
      admissionNo: user.raw?.admissionNo || (user.type === 'student' ? user.identifier : undefined),
      employeeId: user.type === 'teacher' ? user.identifier : user.raw?.employeeId,
    });
  };

  if (loading) return <Spinner />;

  // Full-page detail view replaces the list entirely while a record is selected
  if (viewRecord) return <DetailPage record={viewRecord} onBack={() => setViewRecord(null)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#051d24', margin: 0 }}>Unified Directory</h1>
          <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Manage all students, teachers, and parents in one place</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={loadData} style={{ padding: '9px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#64748B' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button onClick={handleExport} style={{ padding: '9px 16px', background: 'linear-gradient(135deg,#0F4C5C,#051d24)', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>
      {error && <ErrorBanner msg={error} onRetry={loadData} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard label="Total Users" value={data.length} icon={Users} color="blue" />
        <StatCard label="Students" value={data.filter(u => u.type === 'student').length} icon={GraduationCap} color="teal" />
        <StatCard label="Staff" value={data.filter(u => u.type === 'teacher').length} icon={Briefcase} color="purple" />
        <StatCard label="Parents" value={data.filter(u => u.type === 'parent').length} icon={Heart} color="amber" />
      </div>
      <Toolbar>
        <SearchBox value={search} onChange={setSearch} placeholder="Search name, email, phone, ID..." />
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 10, padding: 4, overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All', icon: Users },
            { id: 'student', label: 'Students', icon: GraduationCap },
            { id: 'teacher', label: 'Staff', icon: Briefcase },
            { id: 'parent', label: 'Parents', icon: Heart }
          ].map(t => (
            <button key={t.id} onClick={() => setRoleFilter(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
              background: roleFilter === t.id ? '#fff' : 'transparent', color: roleFilter === t.id ? '#3B82F6' : '#64748B',
              boxShadow: roleFilter === t.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
        <ViewToggle view={view} setView={setView} />
      </Toolbar>
      {displayed.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }}>
          <EmptyState icon={Users} msg="No users found matching your criteria" />
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {paginated.map(u => {
            const roleColor = u.type === 'teacher' ? 'purple' : u.type === 'student' ? 'teal' : 'amber';
            return (
              <div key={u.id} style={{ background: '#fff', borderRadius: 16, border: '1px solid #F1F5F9', padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={() => handlePreview(u)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)'}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <Avatar name={u.name} photo={u.avatar} type={u.type} size="md" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#051d24', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{u.identifier}</p>
                  </div>
                  <ViewButton onClick={() => handlePreview(u)} />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  <Badge color={roleColor}>{u.type.toUpperCase()}</Badge>
                  <Badge color={u.status === 'Active' ? 'green' : 'red'}>{u.status}</Badge>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: '#475569' }}>
                  {u.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={13} color="#94A3B8"/> {u.phone}</div>}
                  {u.email && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={13} color="#94A3B8"/> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span></div>}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><LayoutGrid size={13} color="#94A3B8" style={{ marginTop: 2, flexShrink: 0 }}/> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{u.subtitle}</span></div>
                </div>
                {u.phone && (
                  <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                    <ContactButtons phone={u.phone} size="sm" />
                  </div>
                )}
                {(u.type === 'student' || u.type === 'teacher') && (
                  <button onClick={(e) => { e.stopPropagation(); handleView(u); }}
                    style={{ marginTop: 10, width: '100%', padding: '7px 0', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#FAFAFA', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                    Open Full Profile Page →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  {['User', 'Role', 'Identifier', 'Contact', 'Status', 'Info', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, i) => {
                  const roleColor = u.type === 'teacher' ? 'purple' : u.type === 'student' ? 'teal' : 'amber';
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 === 0 ? '#fff' : '#FAFAFA', cursor: 'pointer' }}
                      onClick={() => handlePreview(u)}
                      onMouseEnter={e => e.currentTarget.style.background = '#F0F9FF'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#FAFAFA'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={u.name} photo={u.avatar} type={u.type} size="sm" />
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#051d24', whiteSpace: 'nowrap' }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge color={roleColor}>{u.type}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>{u.identifier}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {u.phone && <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={11} /> {u.phone}</span>}
                          {u.email && <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={11} /> {u.email}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Badge color={u.status === 'Active' ? 'green' : 'red'}>{u.status}</Badge>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200, display: 'inline-block' }} title={u.subtitle}>{u.subtitle}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <ViewButton onClick={() => handlePreview(u)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9' }}>
          <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#475569', opacity: page === 1 ? 0.5 : 1 }}>
              <ChevronLeft size={14} /> Prev
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#475569', opacity: page === totalPages ? 0.5 : 1 }}>
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default { PresentStudentsReport, FlexiHoursReport, AllUsersDirectory };
