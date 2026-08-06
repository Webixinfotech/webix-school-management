import { createElement, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, UserPlus, ArrowLeft, X, CheckCircle, AlertCircle,
  Phone, Lock, Mail, BookOpen, Calendar, Shield, ShieldCheck,
  CheckCircle as CheckCircleIcon, Loader2, Copy, Share2,
  ChevronDown, ChevronUp, Smartphone, Copy as CopyIcon,
  Upload, AlarmClock, Clock, Hourglass, Lock as LockIcon,
  Sparkles, GraduationCap, IndianRupee, Timer, UserCheck,
  CalendarDays, Key, Eye, EyeOff, Building2, Star,
  Wallet, Cake, ClipboardList, Briefcase,
  Gift, Award, Activity, QrCode, ScanLine,
} from 'lucide-react';

import { createTeacherAPI, getTeacherPhotoUrl, teacherService } from '../../api/teachers';
import { getClassesAPI } from '../../api/classes';

// WhatsApp Icon
const WhatsAppIcon = ({ size = 24, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ─── Class Types ─────────────────────────────────────────────────────────────
const CLASS_TYPES = {
  FIXED_TIME:  { id: 'FIXED_TIME',  label: 'Fixed Time',    color: '#0F4C5C', bg: '#EFF6FF', border: '#BFDBFE' },
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
const fmt12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const PALETTES = [
  ['#0F4C5C', '#4338CA'], ['#8B5CF6', '#5B21B6'], ['#EC4899', '#9D174D'],
  ['#0EA5E9', '#0369A1'], ['#10B981', '#065F46'], ['#F59E0B', '#92400E'],
  ['#EF4444', '#991B1B'], ['#06B6D4', '#0E7490'],
];
const getPalette = (name = 'A') => PALETTES[(name.charCodeAt(0) || 65) % PALETTES.length];

const statusConfig = {
  'Active':   { color: '#10B981', bg: '#ECFDF5', border: '#6EE7B7', dot: '#10B981' },
  'Inactive': { color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5', dot: '#EF4444' },
  'On Leave': { color: '#F59E0B', bg: '#FFFBEB', border: '#FCD34D', dot: '#F59E0B' },
};

const photoUrl = (photo) => getTeacherPhotoUrl(photo);

// ─── LIGHT DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardHover: '#F1F5F9',
  border: '#E2E8F0',
  borderGlow: '#BFDBFE',
  text: '#051d24',
  textMuted: '#475569',
  textDim: '#94A3B8',
  accent: '#0F4C5C',
  accentHover: '#0F4C5C',
  accentLight: '#EFF6FF',
  accentGlow: 'rgba(37, 99, 235, 0.2)',
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F5A623',
  warningBg: '#FFFBEB',
  danger: '#FF5B5B',
  dangerBg: '#FEF2F2',
  info: '#0EA5E9',
  infoBg: '#F0F9FF',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
  pink: '#EC4899',
  pinkBg: '#FCE7F3',
};

// ─── PERMISSION KEYS ──────────────────────────────────────────────────────────
const PERMISSION_DEFS = [
  { key: 'canViewStudentMobile', label: 'View Student Mobile', icon: Phone, color: C.info },
  { key: 'canMarkAttendance', label: 'Mark Attendance', icon: CheckCircleIcon, color: C.success },
  { key: 'canUploadPhotos', label: 'Upload Photos', icon: Upload, color: C.accent },
  { key: 'canViewSalary', label: 'View Salary', icon: IndianRupee, color: '#F97316' },
  { key: 'canViewFeeInfo', label: 'View Fee Status', icon: Eye, color: C.info },
  { key: 'canDisplayStaffQR', label: 'Display Staff QR', icon: Star, color: C.info },
  { key: 'canScanEmployeeQR', label: 'Scan Employee ID Cards (Mark Others\' Attendance)', icon: ScanLine, color: '#0891B2' },
  { key: 'attendanceViaQR', label: "Own Attendance via ID-Card QR Scan", icon: QrCode, color: '#0EA5E9' },
  { key: 'attendanceViaPhone', label: 'Own Attendance via Phone Self-Scan', icon: Smartphone, color: '#10B981' },
  { key: 'canManageFees', label: 'Manage Fee Hub', icon: Wallet, color: '#16A34A' },
  { key: 'canManageStudents', label: 'Create/Edit Students', icon: GraduationCap, color: C.purple },
  { key: 'canManageEmployees', label: 'Create/Edit Employees', icon: Briefcase, color: C.pink },
  { key: 'canManageBirthdays', label: 'Manage Birthdays', icon: Cake, color: C.pink },
  { key: 'canManageEnquiries', label: 'Manage Enquiries', icon: ClipboardList, color: '#0891B2' },
  { key: 'canViewBirthdays', label: 'View Birthdays', icon: Gift, color: C.pink },
  { key: 'canManageCertificates', label: 'Manage Certificates', icon: Award, color: '#C9A24B' },
  { key: 'canManageDailyActivity', label: 'Manage Daily Activity', icon: Activity, color: C.purple },
  { key: 'canManageCalendar', label: 'Manage Event Scheduler', icon: Calendar, color: '#0F4C5C' },
];

const VERIFICATION_DEFS = [
  { key: 'aadhaarVerified', label: 'Aadhaar Verified', icon: ShieldCheck, color: C.success },
  { key: 'policeVerified', label: 'Police Verified', icon: UserCheck, color: C.info },
];

const DEFAULT_PERMS = {
  canViewStudentMobile: false, canMarkAttendance: false, canUploadPhotos: false,
  canViewSalary: false, canViewFeeInfo: false, canDisplayStaffQR: false,
  canScanEmployeeQR: false, attendanceViaQR: false,
  canManageFees: false, canManageStudents: false, canManageEmployees: false,
  canManageBirthdays: false, canManageEnquiries: false, canManageCalendar: false,
  // Default true on the backend (Teacher.model.js) to preserve pre-existing
  // behaviour for teachers created before these flags existed — mirrored
  // here so a new-teacher form shows the same default the backend applies.
  canViewBirthdays: true, canManageCertificates: true, canManageDailyActivity: true,
  attendanceViaPhone: true,
  aadhaarVerified: false, policeVerified: false,
};

// ─── UI PRIMITIVES ─────────────────────────────────────────────────────────────
const Avatar = ({ name = 'A', photo, size = 'md' }) => {
  const [from, to] = getPalette(name);
  const dims = { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 }[size] || 44;
  const fs = { xs: 11, sm: 13, md: 16, lg: 20, xl: 26 }[size] || 16;
  const [imgErr, setImgErr] = useState(false);
  const src = photo && !imgErr ? photoUrl(photo) : null;
  return (
    <div style={{ position: 'relative', width: dims, height: dims, minWidth: dims, flexShrink: 0 }}>
      {src ? (
        <img src={src} alt={name} onError={() => setImgErr(true)}
          style={{ width: dims, height: dims, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.border}` }} />
      ) : (
        <div style={{
          width: dims, height: dims, borderRadius: '50%',
          background: `linear-gradient(135deg, ${from}, ${to})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 800, fontSize: fs, fontFamily: "'Outfit', sans-serif",
          boxShadow: `0 0 0 2px ${C.border}, 0 4px 16px rgba(0,0,0,0.1)`,
        }}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

const Toast = ({ message, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
    background: type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : C.card,
    color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
    animation: 'slideUp 0.3s ease', maxWidth: 340,
    border: `1px solid ${type === 'success' ? '#059669' : '#DC2626'}`,
  }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, opacity: 0.7 }}><X size={14} /></button>
  </div>
);

// ─── FORM INPUT COMPONENTS ────────────────────────────────────────────────────
const FormInput = ({ label, error, icon: Icon, type = 'text', value, onChange, placeholder, disabled, required, maxLength, hint, step }) => {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <label style={{ fontSize: 11, fontWeight: 700, color: focused ? C.accent : C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}{required && <span style={{ color: C.danger }}>*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? C.accent : C.textDim, pointerEvents: 'none', transition: 'color 0.2s' }} />}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          step={step}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: Icon ? '12px 14px 12px 40px' : '12px 14px',
            paddingRight: isPassword ? '44px' : '14px',
            borderRadius: 12,
            border: `1.5px solid ${error ? C.danger : focused ? C.accent : C.border}`,
            background: focused ? C.cardHover : C.surface,
            color: C.text,
            fontSize: 14,
            fontWeight: 500,
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
            boxShadow: focused ? `0 0 0 3px ${error ? C.dangerBg : C.accentLight}` : 'none',
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, display: 'flex', padding: 4 }}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && !error && <span style={{ fontSize: 11, color: C.textDim }}>{hint}</span>}
      {error && <span style={{ fontSize: 11, color: C.danger, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{error}</span>}
    </div>
  );
};

const FormSelect = ({ label, value, onChange, options, error, icon: Icon }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: focused ? C.accent : C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'color 0.2s' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focused ? C.accent : C.textDim, pointerEvents: 'none', zIndex: 1 }} />}
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            padding: Icon ? '12px 14px 12px 40px' : '12px 14px',
            borderRadius: 12,
            border: `1.5px solid ${error ? C.danger : focused ? C.accent : C.border}`,
            background: focused ? C.cardHover : C.surface,
            color: value ? C.text : C.textDim,
            fontSize: 14, fontWeight: 500,
            outline: 'none', width: '100%',
            fontFamily: "'Outfit', sans-serif",
            transition: 'all 0.2s',
            boxShadow: focused ? `0 0 0 3px ${C.accentLight}` : 'none',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map(o => <option key={o.value} value={o.value} style={{ background: C.card, color: C.text }}>{o.label}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: C.textDim, pointerEvents: 'none' }} />
      </div>
      {error && <span style={{ fontSize: 11, color: C.danger }}>{error}</span>}
    </div>
  );
};

// ─── SECTION DIVIDER ─────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, accent = C.accent }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '32px 0 18px', padding: '0 0 16px', borderBottom: `1px solid ${C.border}` }}>
    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}20`, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon size={17} color={accent} />
    </div>
    <div>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>{title}</h3>
      {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: C.textMuted }}>{subtitle}</p>}
    </div>
  </div>
);

// ─── TOGGLE SWITCH ───────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, label, icon: Icon, color = C.accent, description }) => (
  <label style={{
    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
    borderRadius: 12, border: `1.5px solid ${checked ? color + '40' : C.border}`,
    background: checked ? color + '0D' : C.surface,
    cursor: 'pointer', transition: 'all 0.2s',
  }}>
    {Icon && <div style={{ width: 32, height: 32, borderRadius: 9, background: checked ? color + '20' : C.card, border: `1px solid ${checked ? color + '40' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
      <Icon size={15} color={checked ? color : C.textDim} />
    </div>}
    <div style={{ flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: checked ? color : C.textMuted, display: 'block', transition: 'color 0.2s' }}>{label}</span>
      {description && <span style={{ fontSize: 11, color: C.textDim }}>{description}</span>}
    </div>
    <div style={{
      width: 42, height: 24, borderRadius: 99, background: checked ? color : C.border,
      position: 'relative', transition: 'all 0.25s', flexShrink: 0,
      boxShadow: checked ? `0 0 12px ${color}60` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.25s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
    <input type="checkbox" checked={checked} onChange={onChange} style={{ display: 'none' }} />
  </label>
);

// ─── TEACHER FORM ─────────────────────────────────────────────────────────────
const TeacherForm = ({ initialData, isEditMode, onSave, onCancel, classesData = [], classesLoading = false }) => {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    email: initialData?.email || initialData?.userId?.email || '',
    phone: initialData?.phone || '',
    password: '',
    dob: initialData?.dob ? initialData.dob.split('T')[0] : '',
    dateOfJoining: initialData?.dateOfJoining ? initialData.dateOfJoining.split('T')[0] : '',
    subjects: initialData?.subjects || '',
    status: initialData?.status || 'Active',
    classIds: initialData?.classIds || [],
    permissions: { ...DEFAULT_PERMS, ...(initialData?.permissions || {}) },
    photo: initialData?.photo || null,
    employeeType: initialData?.employeeType || 'FIXED_TIME',
    monthlySalary: initialData?.monthlySalary || '',
    extraHourlyRate: initialData?.extraHourlyRate || '',
    holidayCalendar: initialData?.holidayCalendar || 'TEACHING',
    fixedShift: {
      entryTime: initialData?.fixedShift?.entryTime || '',
      exitTime: initialData?.fixedShift?.exitTime || '',
      gracePeriodMinutes: initialData?.fixedShift?.gracePeriodMinutes || '',
      halfDayThresholdHours: initialData?.fixedShift?.halfDayThresholdHours || '',
      extraHoursPayment: initialData?.fixedShift?.extraHoursPayment || false,
    },
    fixedHours: {
      minimumHours: initialData?.fixedHours?.minimumHours || '',
      halfDayThresholdHours: initialData?.fixedHours?.halfDayThresholdHours || '',
      extraHoursPayment: initialData?.fixedHours?.extraHoursPayment || false,
    },
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(initialData?.photo ? getTeacherPhotoUrl(initialData.photo) : null);
  const submittingRef = useRef(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setPerm = (k, v) => setForm(f => ({ ...f, permissions: { ...f.permissions, [k]: v } }));
  const setFixedShift = (k, v) => setForm(f => ({ ...f, fixedShift: { ...f.fixedShift, [k]: v } }));
  const setFixedHours = (k, v) => setForm(f => ({ ...f, fixedHours: { ...f.fixedHours, [k]: v } }));

  useEffect(() => {
    if (initialData && isEditMode) {
      // Hydrate state directly mostly to handle any asynchronous loads seamlessly
      if (initialData.photo) {
        setPhotoPreview(getTeacherPhotoUrl(initialData.photo));
      }
    }
  }, [initialData, isEditMode]);

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
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter valid 10-digit Indian mobile';
    if (!isEditMode && (!form.password || form.password.length < 6)) e.password = 'Minimum 6 characters required';
    if (!form.dateOfJoining) e.dateOfJoining = 'Date of joining is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  // Build the employment/shift/payroll payload once, shared by create (step 2) and edit
  const buildEmploymentPayload = () => ({
    name: form.name.trim(), phone: form.phone.trim(),
    dob: form.dob || null, dateOfJoining: form.dateOfJoining,
    subjects: form.subjects.trim(), status: form.status, classIds: form.classIds,
    employeeType: form.employeeType,
    monthlySalary: Number(form.monthlySalary || 0),
    extraHourlyRate: Number(form.extraHourlyRate || 0),
    holidayCalendar: form.holidayCalendar,
    fixedShift: {
      entryTime: form.fixedShift.entryTime,
      exitTime: form.fixedShift.exitTime,
      gracePeriodMinutes: Number(form.fixedShift.gracePeriodMinutes) || 0,
      halfDayThresholdHours: Number(form.fixedShift.halfDayThresholdHours) || 0,
      extraHoursPayment: Boolean(form.fixedShift.extraHoursPayment)
    },
    fixedHours: {
      minimumHours: Number(form.fixedHours.minimumHours) || 0,
      halfDayThresholdHours: Number(form.fixedHours.halfDayThresholdHours) || 0,
      extraHoursPayment: Boolean(form.fixedHours.extraHoursPayment)
    }
  });

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!validate()) return;
    submittingRef.current = true;
    setLoading(true);
    try {
      if (isEditMode) {
        await teacherService.updateBasic(initialData._id || initialData.id, buildEmploymentPayload());

        await teacherService.updatePermissions(initialData._id || initialData.id, form.permissions);

        if (form.photo && typeof form.photo !== 'string') {
          await teacherService.updatePhoto(initialData._id || initialData.id, form.photo);
        }

        if (form.password && initialData?.userId?._id) {
           await teacherService.changeUserPassword(initialData.userId._id, form.password);
        }

        onSave(null, 'updated');
      } else {
        // ── STEP 1: create the account with core fields (multipart, needed for photo) ──
        // NOTE: fixedShift/fixedHours are intentionally NOT sent here as a stringified
        // nested object inside FormData. Sending nested JSON objects as a single
        // multipart text field is unreliable to parse on the backend (that's why
        // entryTime/exitTime were coming through empty on create). Instead we set
        // them in STEP 2 below using the same JSON-body update call that already
        // works correctly for the "Edit Teacher" flow.
        const fd = new FormData();
        fd.append('name', form.name.trim());
        fd.append('email', form.email.trim().toLowerCase());
        fd.append('phone', form.phone.trim());
        fd.append('password', form.password);
        fd.append('dateOfJoining', form.dateOfJoining);
        if (form.dob) fd.append('dob', form.dob);
        if (form.subjects) fd.append('subjects', form.subjects.trim());
        fd.append('status', form.status);
        fd.append('classIds', JSON.stringify(form.classIds || []));
        fd.append('employeeType', form.employeeType);
        fd.append('monthlySalary', String(form.monthlySalary || 0));
        fd.append('extraHourlyRate', String(form.extraHourlyRate || 0));
        fd.append('holidayCalendar', form.holidayCalendar);
        if (form.photo) fd.append('photo', form.photo);

        const res = await createTeacherAPI(fd);
        if (!res.success) throw new Error(res.error || 'Create failed');
        const teacherData = res.data?.teacher || res.data;
        const newTeacherId = teacherData?.id || teacherData?._id;

        // ── STEP 2: reliably set employment/shift/payroll details via JSON body ──
        // This reuses the exact same call used by "Edit Teacher", which is already
        // confirmed to save entryTime/exitTime correctly.
        if (newTeacherId) {
          await teacherService.updateBasic(newTeacherId, buildEmploymentPayload());

          // ── STEP 3: permissions (same as edit flow) ──
          await teacherService.updatePermissions(newTeacherId, form.permissions);
        }

        const email = teacherData?.email || form.email;
        const password = form.password;
        onSave({ data: res.data, email, password, name: teacherData?.name || form.name, phone: teacherData?.phone || form.phone, fatherPhone: '', motherPhone: '', teacherId: newTeacherId }, 'created');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create teacher';
      setErrors(e => ({ ...e, _global: errorMsg }));
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const empTypeOptions = [
    { value: 'FIXED_TIME', label: 'Fixed Time', icon: AlarmClock, desc: 'Set entry & exit time', color: C.info },
    { value: 'FIXED_HOURS', label: 'Fixed Hours', icon: Hourglass, desc: 'Minimum hours per day', color: C.purple },
    { value: 'FLEXIBLE', label: 'Flexible', icon: Clock, desc: 'No fixed schedule', color: C.success },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {errors._global && (
        <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: C.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} /> {errors._global}
          <button onClick={() => setErrors(e => ({ ...e, _global: null }))} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.danger, display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* ─── Profile Photo ─── */}
      <SectionHeader icon={Upload} title="Profile Photo" subtitle="Optional — JPG, PNG or WEBP, max 5MB" accent={C.purple} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 80, height: 80, borderRadius: 20, overflow: 'hidden', border: `2px solid ${photoPreview ? C.accent : C.border}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: photoPreview ? `0 0 0 4px ${C.accentLight}` : 'none', transition: 'all 0.3s' }}>
            {photoPreview ? (
              <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Users size={32} style={{ color: C.textDim }} />
            )}
          </div>
          {photoPreview && (
            <button onClick={() => { setPhotoPreview(null); set('photo', null); }} style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: C.danger, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={11} color="#fff" />
            </button>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            borderRadius: 12, border: `1.5px dashed ${C.border}`, background: C.surface,
            color: C.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; e.currentTarget.style.background = C.accentLight; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; e.currentTarget.style.background = C.surface; }}
          >
            <Upload size={15} /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />
          </label>
          {errors.photo && <p style={{ margin: '6px 0 0', fontSize: 11, color: C.danger }}>{errors.photo}</p>}
        </div>
      </div>

      {/* ─── Basic Info ─── */}
      <SectionHeader icon={GraduationCap} title="Basic Information" subtitle="Primary details for the teacher account" accent={C.accent} />
      <div className="at-grid-2">
        <FormInput label="Full Name" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Priya Sharma" error={errors.name} icon={Users} />
        <FormInput label="Email Address" required type="email" disabled={isEditMode} value={form.email} onChange={e => set('email', e.target.value)} placeholder="teacher@school.com" error={errors.email} icon={Mail} hint={isEditMode ? "Email cannot be changed" : ""} />
        <FormInput label="Mobile Number" required value={form.phone} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) set('phone', v); }} placeholder="10-digit Indian mobile" error={errors.phone} icon={Phone} maxLength={10} hint="Must start with 6, 7, 8, or 9" />
        <FormInput label="Login Password" required={!isEditMode} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={isEditMode ? "Leave blank to keep unchanged" : "Minimum 6 characters"} error={errors.password} icon={Key} hint={isEditMode ? "Leave blank to keep unchanged" : "Minimum 6 characters"} />
      </div>

      <div className="at-grid-3" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
            Date of Birth
          </label>
          <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)}
            style={{ padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface, color: form.dob ? C.text : C.textDim, fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: "'Outfit', sans-serif", width: '100%', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accentLight}`; }}
            onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4 }}>
            Date of Joining<span style={{ color: C.danger }}>*</span>
          </label>
          <input type="date" value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)}
            style={{ padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${errors.dateOfJoining ? C.danger : C.border}`, background: C.surface, color: form.dateOfJoining ? C.text : C.textDim, fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: "'Outfit', sans-serif", width: '100%', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = errors.dateOfJoining ? C.danger : C.accent; e.target.style.boxShadow = `0 0 0 3px ${C.accentLight}`; }}
            onBlur={e => { e.target.style.borderColor = errors.dateOfJoining ? C.danger : C.border; e.target.style.boxShadow = 'none'; }}
          />
          {errors.dateOfJoining && <span style={{ fontSize: 11, color: C.danger, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors.dateOfJoining}</span>}
        </div>
        <FormSelect label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={[
          { value: 'Active', label: '● Active' },
          { value: 'Inactive', label: '○ Inactive' },
          { value: 'On Leave', label: '◐ On Leave' },
        ]} />
      </div>

      <div style={{ marginTop: 16 }}>
        <FormInput label="Subjects Taught" value={form.subjects} onChange={e => set('subjects', e.target.value)} placeholder="e.g. Mathematics, Physics, Chemistry" icon={BookOpen} hint="Separate multiple subjects with commas" />
      </div>

      {/* ─── Assign Classes ─── */}
      <SectionHeader icon={Building2} title="Assign Classes" subtitle="Select classes this teacher will manage" accent={C.info} />
      {classesLoading ? (
        <div style={{ padding: '28px', textAlign: 'center', color: C.textMuted, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: C.accent }} />
          Loading classes...
        </div>
      ) : classesData.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', background: C.surface, borderRadius: 14, border: `1.5px dashed ${C.border}` }}>
          <Building2 size={28} style={{ color: C.textDim, marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13, color: C.textMuted, fontWeight: 600 }}>No classes available</p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: C.textDim }}>Create classes first in the Classes section</p>
        </div>
      ) : (
        <div>
          {form.classIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: C.textMuted }}>Selected:</span>
              <span style={{ fontSize: 12, fontWeight: 700, background: C.accentLight, color: C.accent, padding: '3px 10px', borderRadius: 99, border: `1px solid ${C.accentGlow}` }}>
                {form.classIds.length} class{form.classIds.length > 1 ? 'es' : ''}
              </span>
              <button onClick={() => set('classIds', [])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.danger, fontWeight: 600 }}>Clear all</button>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, maxHeight: 340, overflowY: 'auto', paddingRight: 4 }}>
            {classesData.map(cls => {
              const selected = form.classIds.includes(cls.id);
              const ct = CLASS_TYPES[cls.classType];
              const TIcon = cls.classType === 'FIXED_TIME' ? AlarmClock : cls.classType === 'FLEX_TIME' ? Clock : Hourglass;
              return (
                <div key={cls.id} onClick={() => {
                  setForm(f => ({ ...f, classIds: selected ? f.classIds.filter(id => id !== cls.id) : [...f.classIds, cls.id] }));
                }} style={{
                  borderRadius: 12, border: `2px solid ${selected ? C.accent : C.border}`,
                  background: selected ? C.accentLight : C.surface,
                  padding: '12px', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: selected ? `0 0 0 1px ${C.accent}40` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected ? C.accent : C.border}`, background: selected ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                      {selected && <CheckCircleIcon size={11} color="#fff" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cls.name}</span>
                        {cls.section && <span style={{ fontSize: 10, color: C.textDim }}>§{cls.section}</span>}
                        {ct && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: ct.bg, color: ct.color, border: `1px solid ${ct.border}` }}>{ct.label}</span>}
                      </div>
                      {cls.days?.length > 0 && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.textDim }}>{formatDays(cls.days)}</p>}
                      {cls.classType === 'FIXED_TIME' && cls.startTime && cls.endTime && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: C.info, fontWeight: 600 }}>{fmt12(cls.startTime)} – {fmt12(cls.endTime)}</p>
                      )}
                    </div>
                    <TIcon size={14} color={selected ? C.accent : C.textDim} style={{ flexShrink: 0 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Employment Type ─── */}
      <SectionHeader icon={Timer} title="Employee Type" subtitle="Determines how attendance & payroll is calculated" accent={C.warning} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {empTypeOptions.map(opt => {
          const selected = form.employeeType === opt.value;
          return (
            <div key={opt.value} onClick={() => set('employeeType', opt.value)} style={{
              padding: '16px 14px', borderRadius: 14, border: `2px solid ${selected ? opt.color : C.border}`,
              background: selected ? opt.color + '15' : C.surface, cursor: 'pointer', transition: 'all 0.2s',
              textAlign: 'center', boxShadow: selected ? `0 0 16px ${opt.color}30` : 'none',
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: selected ? opt.color + '25' : C.card, border: `1px solid ${selected ? opt.color + '40' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', transition: 'all 0.2s' }}>
                <opt.icon size={18} color={selected ? opt.color : C.textDim} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: selected ? opt.color : C.text }}>{opt.label}</p>
              <p style={{ margin: '3px 0 0', fontSize: 10, color: C.textDim }}>{opt.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Fixed Time Shift Config */}
      {form.employeeType === 'FIXED_TIME' && (
        <div style={{ marginTop: 16, padding: '20px', borderRadius: 16, background: C.surface, border: `1.5px solid ${C.info}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <AlarmClock size={15} color={C.info} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.info, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Shift Timing</span>
          </div>
          <div className="at-grid-2" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Entry Time</label>
              <input type="time" value={form.fixedShift.entryTime} onChange={e => setFixedShift('entryTime', e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, outline: 'none', fontFamily: "'Outfit', sans-serif", width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exit Time</label>
              <input type="time" value={form.fixedShift.exitTime} onChange={e => setFixedShift('exitTime', e.target.value)}
                style={{ padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.card, color: C.text, fontSize: 14, outline: 'none', fontFamily: "'Outfit', sans-serif", width: '100%', boxSizing: 'border-box' }} />
            </div>
            <FormInput label="Grace Period (minutes)" type="number" value={form.fixedShift.gracePeriodMinutes} onChange={e => setFixedShift('gracePeriodMinutes', parseInt(e.target.value) || '')} placeholder="e.g. 15" icon={Clock} />
            <FormInput label="Half Day Threshold (hours)" type="number" step="any" value={form.fixedShift.halfDayThresholdHours} onChange={e => setFixedShift('halfDayThresholdHours', e.target.value)} placeholder="e.g. 4.5" icon={Timer} />
          </div>
          <Toggle checked={form.fixedShift.extraHoursPayment} onChange={e => setFixedShift('extraHoursPayment', e.target.checked)} label="Pay for Extra Hours" description="Enable extra hour payments beyond shift" icon={IndianRupee} color={C.success} />
        </div>
      )}

      {/* Fixed Hours Config */}
      {form.employeeType === 'FIXED_HOURS' && (
        <div style={{ marginTop: 16, padding: '20px', borderRadius: 16, background: C.surface, border: `1.5px solid ${C.purple}30` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Hourglass size={15} color={C.purple} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.purple, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hours Configuration</span>
          </div>
          <div className="at-grid-2" style={{ marginBottom: 12 }}>
            <FormInput label="Minimum Hours Per Day" type="number" step="any" value={form.fixedHours.minimumHours} onChange={e => setFixedHours('minimumHours', e.target.value)} placeholder="e.g. 6.5" icon={Clock} />
            <FormInput label="Half Day Threshold (hours)" type="number" step="any" value={form.fixedHours.halfDayThresholdHours} onChange={e => setFixedHours('halfDayThresholdHours', e.target.value)} placeholder="e.g. 3.5" icon={Timer} />
          </div>
          <Toggle checked={form.fixedHours.extraHoursPayment} onChange={e => setFixedHours('extraHoursPayment', e.target.checked)} label="Pay for Extra Hours" description="Enable extra hour payments beyond minimum" icon={IndianRupee} color={C.success} />
        </div>
      )}

      {/* ─── Payroll ─── */}
      <SectionHeader icon={IndianRupee} title="Payroll Details" subtitle="Monthly salary and additional pay rates" accent={C.success} />
      <div className="at-grid-3">
        <FormInput label="Monthly Salary (₹)" type="number" value={form.monthlySalary} onChange={e => set('monthlySalary', e.target.value)} placeholder="e.g. 25000" icon={IndianRupee} />
        <FormInput label="Extra Hourly Rate (₹)" type="number" value={form.extraHourlyRate} onChange={e => set('extraHourlyRate', e.target.value)} placeholder="e.g. 200" icon={AlarmClock} />
        <FormSelect label="Holiday Calendar" value={form.holidayCalendar} onChange={e => set('holidayCalendar', e.target.value)} icon={CalendarDays} options={[
          { value: 'TEACHING', label: 'Teaching Staff' },
          { value: 'NON_TEACHING', label: 'Non-Teaching Staff' },
        ]} />
      </div>

      {/* ─── Verifications ─── */}
      <SectionHeader icon={ShieldCheck} title="Verifications" subtitle="Official identity and background checks" accent={C.success} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {VERIFICATION_DEFS.map(({ key, label, icon: VIcon, color }) => (
          <Toggle key={key} checked={form.permissions[key]} onChange={e => setPerm(key, e.target.checked)} label={label} icon={VIcon} color={color} />
        ))}
      </div>

      {/* ─── Permissions ─── */}
      <SectionHeader icon={Shield} title="Permissions" subtitle="Control what this teacher can access in the app" accent={C.accent} />
      <div className="at-grid-perms">
        {PERMISSION_DEFS.map(({ key, label, icon: PIcon, color }) => (
          <Toggle key={key} checked={form.permissions[key]} onChange={e => setPerm(key, e.target.checked)} label={label} icon={PIcon} color={color} />
        ))}
      </div>

      {/* ─── Actions ─── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 36, paddingTop: 24, borderTop: `1px solid ${C.border}` }}>
        <button onClick={handleSubmit} disabled={loading} style={{
          flex: 1, padding: '15px 24px', borderRadius: 14, border: 'none',
          background: loading ? C.surface : `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`,
          color: '#fff', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: loading ? 'none' : `0 6px 24px ${C.accentGlow}`,
          transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif",
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> {isEditMode ? 'Updating...' : 'Creating...'}</> : <><UserPlus size={16} /> {isEditMode ? 'Update Teacher' : 'Create Teacher'}</>}
        </button>
        <button onClick={onCancel} disabled={loading} style={{
          padding: '15px 24px', borderRadius: 14, border: `1.5px solid ${C.border}`,
          background: C.surface, color: C.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
        >
          <X size={15} /> Cancel
        </button>
      </div>
    </div>
  );
};

// ─── CREDENTIALS MODAL ────────────────────────────────────────────────────────
const TeacherCredentialsModal = ({ open, onClose, credentials, teacherName, teacherPhone, fatherPhone, motherPhone, teacherId, setToast }) => {
  const [emailCopied, setEmailCopied] = useState(false);
  const [passCopied, setPassCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showWhatsAppOptions, setShowWhatsAppOptions] = useState(false);

  if (!open || !credentials) return null;

  const loginUrl = 'https://brainbuilder.in/login';
  const loginMobile = teacherPhone || credentials.phone || '';

  const copyEmail = () => { navigator.clipboard.writeText(credentials.email || ''); setEmailCopied(true); setTimeout(() => setEmailCopied(false), 2000); };
  const copyPass = () => { navigator.clipboard.writeText(credentials.password || ''); setPassCopied(true); setTimeout(() => setPassCopied(false), 2000); };

  const formatPhoneForWhatsApp = (phone) => {
    const cleaned = phone?.replace(/\D/g, '') || '';
    if (cleaned.startsWith('91') && cleaned.length > 2) return cleaned;
    if (cleaned.length === 10) return '91' + cleaned;
    return cleaned;
  };

  const getShareMessage = () =>
    `*BrainBuilder Staff Login Credentials*\n\n👤 Teacher: ${teacherName}\n📧 Email: ${credentials.email}\n🔑 Password: ${credentials.password}\n\n📱 Login with email and password above.`;

  const getCredentialMessage = () => {
    if (!getShareMessage) return '';
    return `*BrainBuilder Staff Login Credentials*\n\nTeacher: ${teacherName}\nLogin URL: ${loginUrl}\nEmail: ${credentials.email}${loginMobile ? `\nMobile: ${loginMobile}` : ''}\nPassword: ${credentials.password}\n\nYou can login using either email or mobile number with the password above.\n\n*Save these credentials - password cannot be recovered!*`;
  };

  const handleWhatsApp = (phone) => {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    if (!formattedPhone || formattedPhone.length < 12) { alert('Invalid phone number'); return; }
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(getCredentialMessage())}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`BrainBuilder Staff Login Credentials - ${teacherName}`);
    const body = encodeURIComponent(`Dear Teacher,\n\nHere are your BrainBuilder login credentials:\n\nTeacher Name: ${teacherName}\nLogin URL: ${loginUrl}\nEmail: ${credentials.email}${loginMobile ? `\nMobile: ${loginMobile}` : ''}\nPassword: ${credentials.password}\n\nYou can login using either email or mobile number with the password above.\n\nPlease save these credentials.\n\nRegards,\nBrainBuilder Team`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleCopyAll = () => {
    const text = `BrainBuilder Staff Login Credentials\nName: ${teacherName}\nLogin URL: ${loginUrl}\nEmail: ${credentials.email}${loginMobile ? `\nMobile: ${loginMobile}` : ''}\nPassword: ${credentials.password}\n\nYou can login using either email or mobile number with the password above.`;
    navigator.clipboard.writeText(text);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const hasFatherPhone = fatherPhone && fatherPhone.length === 10;
  const hasMotherPhone = motherPhone && motherPhone.length === 10;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 520, background: C.card, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.7)', animation: 'fadeInUp 0.25s ease', position: 'relative', border: `1px solid ${C.border}`, maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>

        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMuted, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
        ><X size={16} /></button>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, #0D5C3A, #0A4A2F)`, padding: '28px 24px 22px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(16,217,142,0.08)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(16,217,142,0.05)' }} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(16,217,142,0.2)', border: '2px solid rgba(16,217,142,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle size={26} color={C.success} />
            </div>
            <div style={{ flex: 1, paddingRight: 40 }}>
              <p style={{ margin: 0, fontSize: 10, color: 'rgba(16,217,142,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Registration Successful</p>
              <h3 style={{ margin: '4px 0 3px', fontSize: 18, fontWeight: 900, color: '#fff' }}>{teacherName}</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Staff account created · Share credentials below</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Warning */}
          <div style={{ background: C.warningBg, border: `1px solid ${C.warning}40`, borderRadius: 12, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10 }}>
            <AlertCircle size={16} color={C.warning} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.warning }}>Save these credentials now!</p>
              <p style={{ margin: '3px 0 0', fontSize: 11, color: C.textMuted }}>The password cannot be recovered later. Share immediately with the staff.</p>
            </div>
          </div>

          {/* Credential Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {/* Email */}
            <div style={{ padding: '14px 16px', background: C.surface, borderRadius: 14, border: `1.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentLight, border: `1px solid ${C.accentGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail size={13} color={C.accent} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Login Email</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.accent, flex: 1, fontFamily: 'monospace', wordBreak: 'break-all' }}>{credentials.email || '—'}</span>
                <button onClick={copyEmail} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: emailCopied ? C.successBg : C.accentLight, color: emailCopied ? C.success : C.accent, transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {emailCopied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Password */}
            <div style={{ padding: '14px 16px', background: C.surface, borderRadius: 14, border: `1.5px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: C.warningBg, border: `1px solid ${C.warning}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={13} color={C.warning} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Password</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: C.warning, flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em', wordBreak: 'break-all' }}>{credentials.password || '—'}</span>
                <button onClick={copyPass} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: passCopied ? C.successBg : C.warningBg, color: passCopied ? C.success : C.warning, transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {passCopied ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>
          </div>

          {/* Copy All */}
          <button onClick={handleCopyAll} style={{ width: '100%', padding: '11px', borderRadius: 12, border: `1.5px solid ${C.border}`, background: C.surface, color: emailCopied ? C.success : C.textMuted, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14, transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = emailCopied ? C.success : C.textMuted; }}
          >
            {emailCopied ? <><CheckCircle size={14} color={C.success} /> Copied All!</> : <><Copy size={14} /> Copy All Credentials</>}
          </button>

          {/* Share */}
          <button onClick={() => { setShowShareOptions(!showShareOptions); setShowWhatsAppOptions(false); }} style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: `2px solid ${C.success}`, background: showShareOptions ? C.successBg : 'transparent', color: C.success, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s', fontFamily: "'Outfit', sans-serif", marginBottom: 14 }}>
            <Share2 size={14} />{showShareOptions ? 'Hide Share Options' : 'Share Credentials'}
            {showShareOptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showShareOptions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, animation: 'fadeInUp 0.2s ease' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowWhatsAppOptions(!showWhatsAppOptions)} disabled={!teacherPhone && !hasFatherPhone && !hasMotherPhone} style={{ flex: 1, padding: '11px 8px', borderRadius: 12, border: 'none', background: (teacherPhone || hasFatherPhone || hasMotherPhone) ? 'linear-gradient(135deg, #25D366, #128C7E)' : C.surface, color: '#fff', fontWeight: 700, fontSize: 12, cursor: (teacherPhone || hasFatherPhone || hasMotherPhone) ? 'pointer' : 'not-allowed', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: (teacherPhone || hasFatherPhone || hasMotherPhone) ? 1 : 0.5, boxShadow: '0 3px 10px rgba(37,211,102,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                  <WhatsAppIcon size={18} /><span>WhatsApp</span>
                </button>
                <button onClick={handleEmail} style={{ flex: 1, padding: '11px 8px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #EA4335, #C5221F)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, boxShadow: '0 3px 10px rgba(234,67,53,0.3)', fontFamily: "'Outfit', sans-serif" }}>
                  <Mail size={18} /><span>Email</span>
                </button>
              </div>

              {showWhatsAppOptions && (teacherPhone || hasFatherPhone || hasMotherPhone) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px', background: C.surface, borderRadius: 12, border: `1.5px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', textAlign: 'center', letterSpacing: '0.08em' }}>Select Recipient</p>
                  {[
                    teacherPhone && { name: teacherName, phone: teacherPhone, label: 'Staff' },
                    hasFatherPhone && { name: 'Father', phone: fatherPhone, label: 'Father' },
                    hasMotherPhone && { name: 'Mother', phone: motherPhone, label: 'Mother' },
                  ].filter(Boolean).map(({ name, phone, label }) => (
                    <button key={label} onClick={() => handleWhatsApp(phone)} style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${C.border}`, background: C.card, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.2s', width: '100%' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#25D366'; e.currentTarget.style.background = 'rgba(37,211,102,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.card; }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #25D366, #128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><WhatsAppIcon size={16} /></div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.text }}>{label === 'Staff' ? name : label}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 10, color: C.textMuted }}>{phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* How to Login */}
          <div style={{ background: C.surface, borderRadius: 12, padding: '14px', border: `1.5px solid ${C.border}`, marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.08em' }}>
              <Smartphone size={11} /> How to Login
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[`Open ${loginUrl}`, `Enter email ${credentials.email}${loginMobile ? ` or mobile ${loginMobile}` : ''}`, 'Enter the password and tap Login'].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#fff' }}>{i + 1}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <button onClick={onClose} style={{ width: '100%', padding: '13px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`, color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 6px 20px ${C.accentGlow}`, fontFamily: "'Outfit', sans-serif" }}>
            <CheckCircle size={16} /> Done — Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AddTeacherPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [classesData, setClassesData] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setClassesLoading(true);
      try {
        const res = await getClassesAPI({ limit: 100 });
        const classesArray = res.data?.data || res.data || [];
        const mapped = (Array.isArray(classesArray) ? classesArray : []).map(c => ({
          id: c._id, _id: c._id, name: c.name || '', section: c.section || '',
          classType: c.classType, startTime: c.startTime || null, endTime: c.endTime || null,
          days: c.days || [], level: c.level || 0,
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

  useEffect(() => {
    if (!isEditMode) return;
    const fetchTeacher = async () => {
      try {
        const res = await teacherService.getById(id);
        setInitialData(res.data?.data || res.data || res);
      } catch (err) {
        showToast('Failed to load teacher data', 'error');
        navigate('/admin/teachers');
      } finally {
        setLoadingData(false);
      }
    };
    fetchTeacher();
  }, [id, navigate]);

  const handleSave = async (responseData, action) => {
    setError('');
    try {
      if (action === 'updated') {
         showToast('Teacher updated successfully!');
         setTimeout(() => navigate('/admin/teachers'), 1500);
         return;
      }
      const teacherData = responseData.data?.teacher || responseData.data;
      const email = teacherData?.email || responseData.email;
      const password = responseData.password;
      const phone = teacherData?.phone || responseData.phone;
      const name = teacherData?.name || responseData.name;
      if (email && password) {
        setCreatedCredentials({ email, password, name: name || 'Staff', phone: phone || '', fatherPhone: '', motherPhone: '' });
        setShowCredentials(true);
      } else {
        showToast('Teacher created successfully!');
        navigate('/admin/teachers');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save teacher';
      setError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const handleCancel = () => navigate('/admin/teachers');

  if (loadingData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: C.accent }} />
      </div>
    );
  }

  return (
    <div className="at-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        *, *::before, *::after { box-sizing: border-box; font-family: 'Outfit', sans-serif; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 99px; }

        .at-page {
          min-height: 100vh;
          background: ${C.bg};
          position: relative;
        }

        .at-page::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0; height: 400px;
          background: radial-gradient(ellipse at 20% 0%, rgba(37,99,235,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 80% 0%, rgba(139,92,246,0.04) 0%, transparent 60%);
          pointer-events: none; z-index: 0;
        }

        .at-shell {
          position: relative; z-index: 1;
          padding: 24px 24px 80px;
          max-width: 860px;
          margin: 0 auto;
        }

        .at-topbar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .at-back-btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 16px; border-radius: 11px;
          border: 1px solid ${C.border}; background: ${C.card};
          color: ${C.textMuted}; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .at-back-btn:hover { border-color: ${C.accent}; color: ${C.accent}; transform: translateX(-2px); }

        .at-page-title { font-size: 22px; font-weight: 900; color: ${C.text}; margin: 0; letter-spacing: -0.02em; }
        .at-page-sub { font-size: 12px; color: ${C.textMuted}; margin: 4px 0 0; }

        .at-card {
          background: ${C.card};
          border-radius: 22px;
          border: 1px solid ${C.border};
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.04);
        }

        .at-card-header {
          padding: 22px 28px 18px;
          border-bottom: 1px solid ${C.border};
          display: flex; align-items: center; gap: 14px;
          background: linear-gradient(135deg, ${C.surface}, ${C.card});
        }

        .at-card-icon {
          width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
          background: linear-gradient(135deg, ${C.accent}, ${C.accentHover});
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 6px 20px ${C.accentGlow};
        }

        .at-card-body { padding: 28px; }

        .at-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .at-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
        .at-grid-perms { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

        @media (max-width: 800px) {
          .at-shell { padding: 16px 16px 60px; }
          .at-grid-3 { grid-template-columns: 1fr 1fr; }
          .at-grid-perms { grid-template-columns: 1fr; }
          .at-card-body { padding: 20px; }
          .at-card-header { padding: 18px 20px 14px; }
        }

        @media (max-width: 560px) {
          .at-shell { padding: 12px 12px 60px; }
          .at-grid-2 { grid-template-columns: 1fr; }
          .at-grid-3 { grid-template-columns: 1fr; }
          .at-topbar { flex-direction: column; align-items: flex-start; gap: 10px; }
          .at-back-btn { width: 100%; justify-content: center; }
          .at-page-title { font-size: 18px; }
          .at-card-header { flex-direction: column; text-align: center; }
          .at-card-body { padding: 16px; }
        }

        @media (max-width: 380px) {
          .at-grid-perms { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="at-shell">
        {/* Topbar */}
        <div className="at-topbar">
          <button className="at-back-btn" onClick={handleCancel}> 
            <ArrowLeft size={15} /> Back to Teachers
          </button>
          <div>
            <h1 className="at-page-title">{isEditMode ? 'Update Teacher' : 'Add New Teacher'}</h1>
            <p className="at-page-sub">{isEditMode ? 'Modify teacher profile and permissions' : 'Create teacher account with login credentials'}</p>
          </div>
        </div>

        {/* Card */}
        <div className="at-card">
          <div className="at-card-header">
            <div className="at-card-icon"><UserPlus size={22} color="#fff" /></div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Staff Information</h2>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: C.textMuted }}>Fields marked with <span style={{ color: C.danger }}>*</span> are required</p>
            </div>
          </div>

          <div className="at-card-body">
            {error && (
              <div style={{ background: C.dangerBg, border: `1px solid ${C.danger}40`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, color: C.danger, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} /><span style={{ flex: 1 }}>{error}</span>
                <button onClick={() => setError('')} style={{ border: 'none', background: 'none', color: C.danger, cursor: 'pointer', display: 'flex', padding: 0 }}><X size={15} /></button>
              </div>
            )}

            <TeacherForm initialData={initialData} isEditMode={isEditMode} onSave={handleSave} onCancel={handleCancel} classesData={classesData} classesLoading={classesLoading} />
          </div>
        </div>
      </div>

      <TeacherCredentialsModal
        open={showCredentials}
        onClose={() => { setShowCredentials(false); setCreatedCredentials(null); navigate('/admin/teachers'); }}
        credentials={createdCredentials}
        teacherName={createdCredentials?.name || 'Staff'}
        teacherPhone={createdCredentials?.phone || ''}
        fatherPhone={createdCredentials?.fatherPhone || ''}
        motherPhone={createdCredentials?.motherPhone || ''}
        teacherId={createdCredentials?.teacherId || createdCredentials?.data?._id}
        setToast={showToast}
      />

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}