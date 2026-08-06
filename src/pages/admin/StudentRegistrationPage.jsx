import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  GraduationCap, User, Heart, MapPin, Baby, BookOpen,
  Camera, Key, AlertCircle, Loader2, Plus, X, ChevronUp,
  ChevronDown, CheckCircle, ArrowLeft, Shield, Calendar, FileText, Clock, Hourglass,
} from 'lucide-react';
import { createStudentAPI, updateStudentAPI, updateStudentPhotoAPI, getStudentAPI } from '../../api/students';
import { API_BASE_URL as SHARED_API_BASE_URL } from '../../api/axios';
import { getClassesAPI } from '../../api/classes';
import { listAcademicSessionsAPI } from '../../api/academicSession.api';
import feeService from '../../services/feeService';
import { sumFlexiFromClassTimings } from '../../utils/flexiHours';
import { FaWhatsapp } from "react-icons/fa";

// ─── Constants ────────────────────────────────────────────────────────────────
const CLASS_TYPES = {
  FIXED_TIME:  { id: 'FIXED_TIME',  label: 'Fixed Time',    tc: 'blue' },
  FLEX_TIME:   { id: 'FLEX_TIME',   label: 'Flexible Time', tc: 'teal' },
  HOURS_BASED: { id: 'HOURS_BASED', label: 'Hours Based',   tc: 'amber' },
};

const WEEK_DAYS = [
  { id: 'MON', label: 'Mon' }, { id: 'TUE', label: 'Tue' }, { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' }, { id: 'FRI', label: 'Fri' }, { id: 'SAT', label: 'Sat' },
  { id: 'SUN', label: 'Sun' },
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

const normalizeTimings = (rawTimings, classes) => {
  if (!rawTimings || !classes?.length) return rawTimings || {};
  const normalized = {};
  for (const [key, val] of Object.entries(rawTimings)) {
    const cls = classes.find(c => c._id === key || c.id === key || c.classId === key);
    if (cls) {
      normalized[cls._id] = val;
    } else {
      normalized[key] = val;
    }
  }
  return normalized;
};

// ─── Color Tokens ─────────────────────────────────────────────────────────────
const T = {
  blue:   { bg: '#EFF6FF', text: '#0F4C5C', border: '#BFDBFE', solid: '#0F4C5C' },
  green:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', solid: '#16A34A' },
  red:    { bg: '#FFF1F2', text: '#D4AF37', border: '#FECDD3', solid: '#D4AF37' },
  amber:  { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', solid: '#D97706' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', solid: '#0D9488' },
  purple: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', solid: '#9333EA' },
  slate:  { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', solid: '#64748B' },
};

const EMPTY_STUDENT = {
  name: '', phone: '', gender: 'Male', dob: '',
  joiningDate: new Date().toISOString().split('T')[0],
  fatherName: '', fatherMobile: '', fatherEmail: '', fatherDob: '',
  motherName: '', motherMobile: '', motherEmail: '', motherDob: '',
  address: '', status: 'Active', classIds: [], classTimings: {}, siblings: [],
  parentPassword: '', admissionAY: CURRENT_AY, admissionYear: CURRENT_START_YR, photo: null,
  sessionId: '',
  adminNotes: '',
  documentVerification: {
    admissionForm: false,
    birthCertificate: false,
    studentAadharCard: false,
    motherAadharCard: false,
    fatherAadharCard: false,
    studentPhoto: false,
    motherPhoto: false,
    fatherPhoto: false,
    transferCertificate: false,
    medicalCertificate: false,
    others: false,
  },
};

// ─── Build payload for API ────────────────────────────────────────────────────
const buildPayload = (form, classesData = []) => {
  const nameParts = (form.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ').trim() || '.';

  const classIdsToSend = form.classIds || [];

  const classTimingsToSend = {};
  for (const id of classIdsToSend) {
    const cls = classesData.find(c => c.id === id || c._id === id);
    if (cls) {
      classTimingsToSend[id] = form.classTimings?.[id] || form.classTimings?.[cls._id] || form.classTimings?.[cls.classId] || {};
    }
  }

  const { paid: totalPaidFlexiHours, free: totalFreeFlexiHours } = sumFlexiFromClassTimings(classIdsToSend, classTimingsToSend, classesData);

  const parentObj = {
    // Father/mother name are optional; the parent login account still needs
    // a display name, so fall back to whichever one was actually filled in.
    primaryName:  form.fatherName?.trim() || form.motherName?.trim() || 'Parent',
    primaryEmail: form.fatherEmail?.trim().toLowerCase() || '',
    primaryPhone: form.fatherMobile?.trim() || '',
    relation:     'Father',
    fatherName:   form.fatherName?.trim() || '',
    fatherPhone:  form.fatherMobile?.trim() || '',
    fatherEmail:  form.fatherEmail?.trim().toLowerCase() || '',
    fatherDob:    form.fatherDob || null,
    motherName:   form.motherName?.trim() || '',
    motherPhone:  form.motherMobile?.trim() || '',
    motherEmail:  form.motherEmail?.trim().toLowerCase() || '',
    motherDob:    form.motherDob || null,
    password:     form.parentPassword?.trim() || '',
  };

  const addressObj = {
    street:  form.address?.trim() || '',
    city:    '',
    state:   '',
    pincode: '',
  };

  const fd = new FormData();
  fd.append('firstName', firstName);
  fd.append('lastName', lastName);
  fd.append('gender', form.gender || 'Male');
  fd.append('status', form.status || 'Active');
  if (form.dob) fd.append('dateOfBirth', form.dob);
  if (form.joiningDate) fd.append('admissionDate', form.joiningDate);
  fd.append('admissionAY', form.admissionAY || CURRENT_AY);
  fd.append('admissionYear', String(form.admissionYear || CURRENT_START_YR));
  fd.append('parent', JSON.stringify(parentObj));
  if (form.fatherEmail) fd.append('fatherEmail', form.fatherEmail.trim().toLowerCase());
  if (form.fatherDob) fd.append('fatherDob', form.fatherDob);
  if (form.motherEmail) fd.append('motherEmail', form.motherEmail.trim().toLowerCase());
  if (form.motherDob) fd.append('motherDob', form.motherDob);
  fd.append('address', JSON.stringify(addressObj));
  fd.append('classIds', JSON.stringify(classIdsToSend || []));

  if (form.classIds?.length > 0) {
    const firstClass = classesData.find(c => c.id === form.classIds[0] || c._id === form.classIds[0]);
    if (firstClass) {
      fd.append('className', firstClass.name);
      fd.append('section', firstClass.section || '');
    }
  }

  fd.append('classTimings', JSON.stringify(classTimingsToSend || {}));
  fd.append('siblings', JSON.stringify(form.siblings || []));
  // Optional: pre-admit into a specific (usually Upcoming) academic session.
  // Omitted entirely when not chosen — backend then auto-tags with whichever
  // session is currently Active.
  if (form.sessionId) fd.append('sessionId', form.sessionId);
  fd.append('paidFlexiHours', String(totalPaidFlexiHours));
  fd.append('freeFlexiHours', String(totalFreeFlexiHours));
  fd.append('consumedFlexiHours', String(form.consumedFlexiHours || 0));
  if (form.adminNotes) fd.append('adminNotes', form.adminNotes);
  if (form.photo) fd.append('photo', form.photo);

  return { data: fd, isFormData: true };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INDIAN_PHONE_RE = /^[6-9]\d{9}$/;

// ─── Shared Styles ────────────────────────────────────────────────────────────
const IS = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 500,
  outline: 'none', boxSizing: 'border-box', background: '#fff',
  fontFamily: 'inherit', color: '#051d24',
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const LS = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5,
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const FieldErr = ({ k, errors }) =>
  errors[k] ? (
    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#D4AF37', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
      <AlertCircle size={10} />{errors[k]}
    </p>
  ) : null;

const SectionCard = ({ title, icon: Icon, accent = '#0F4C5C', children, extra }) => (
  <div className="section-card" style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #E9ECF0', overflow: 'hidden' }}>
    <div style={{ padding: '12px 16px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={13} color={accent} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#051d24', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
      </div>
      {extra && <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>{extra}</div>}
    </div>
    <div style={{ padding: '14px 16px' }}>{children}</div>
  </div>
);

const Grid = ({ cols = 2, children }) => (
  <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 1 ? '100%' : '180px'}, 1fr))`, gap: 12 }}>
    {children}
  </div>
);

const Field = ({ label, required, children, span }) => (
  <div style={span === 'full' ? { gridColumn: '1/-1' } : {}}>
    {label && <label style={LS}>{label}{required && <span style={{ color: '#D4AF37', marginLeft: 2 }}>*</span>}</label>}
    {children}
  </div>
);

const TimePicker = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('hour');
  const hour24 = value ? parseInt(value.split(':')[0]) : 9;
  const hour12 = hour24 % 12 || 12;
  const minute = value ? value.split(':')[1] : '00';
  const period = value ? (hour24 >= 12 ? 'PM' : 'AM') : 'AM';

  const pickHour = (h) => {
    const h24 = period === 'AM' ? (h % 12) : ((h % 12) + 12);
    onChange(`${String(h24).padStart(2, '0')}:${minute}`);
    setPanel('minute');
  };

  const pickMinute = (m) => {
    onChange(`${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    setOpen(false);
  };

  const togglePeriod = () => {
    const next = hour24 < 12 ? hour24 + 12 : hour24 - 12;
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
          background: '#fff', fontSize: 13, fontWeight: 600, color: '#051d24',
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
              <button type="button" onClick={() => setPanel('hour')} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: panel === 'hour' ? '#0F4C5C' : '#F1F5F9',
                color: panel === 'hour' ? '#fff' : '#475569',
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              }}>Hour</button>
              <button type="button" onClick={() => setPanel('minute')} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: panel === 'minute' ? '#0F4C5C' : '#F1F5F9',
                color: panel === 'minute' ? '#fff' : '#475569',
                fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
              }}>Minute</button>
              <button type="button" onClick={togglePeriod} style={{
                flex: 1, padding: '6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: period === 'AM' ? '#EFF6FF' : '#FEF3C7',
                color: period === 'AM' ? '#0F4C5C' : '#B45309',
                fontWeight: 800, fontSize: 12, fontFamily: 'inherit',
              }}>{period}</button>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 180, overflowY: 'auto',
            }}>
              {(panel === 'hour' ? hours : minutes).map((num) => {
                const isSelected = panel === 'hour' ? num === hour12 : String(num).padStart(2, '0') === minute;
                return (
                  <button key={num} type="button" onClick={() => panel === 'hour' ? pickHour(num) : pickMinute(num)} style={{
                    padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isSelected ? '#0F4C5C' : '#FAFAFA',
                    color: isSelected ? '#fff' : '#051d24',
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

// ─── Flexi Add-on Widget ──────────────────────────────────────────────────────
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

// ─── Class Assignment Widget ──────────────────────────────────────────────────
const ClassWidget = ({ classIds, classTimings, onToggle, onTimingChange, onHoursChange, classesData }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {classesData.length === 0 && (
      <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, padding: '20px 0', margin: 0 }}>No classes available</p>
    )}
    {classesData.map(cls => {
      const sel = classIds.includes(cls.id);
      const ct = CLASS_TYPES[cls.classType];
      const tc = ct?.tc || 'blue';
      const timing = classTimings[cls.id] || classTimings[cls._id] || classTimings[cls.classId] || {};
      return (
        <div key={cls.id} style={{
          borderRadius: 10, border: `1.5px solid ${sel ? T[tc].solid : '#E2E8F0'}`,
          background: sel ? T[tc].bg : '#FAFAFA', transition: 'all .18s',
        }}>
          <div onClick={() => onToggle(cls.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', cursor: 'pointer' }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              border: `2px solid ${sel ? T[tc].solid : '#CBD5E1'}`,
              background: sel ? T[tc].solid : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s',
            }}>
              {sel && <CheckCircle size={10} color="#fff" strokeWidth={3} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#051d24' }}>{cls.name}</span>
                {cls.section && <span style={{ fontSize: 10, color: '#94A3B8' }}>§{cls.section}</span>}
                {ct && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: T[tc].bg, color: T[tc].text, border: `1.5px solid ${T[tc].border}` }}>
                    {ct.label}
                  </span>
                )}
                {cls.baseFee > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 99, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
                    ₹{cls.baseFee} {cls.feeType === 'MONTHLY' ? '/mo' : ''}
                  </span>
                )}
              </div>
              {cls.days?.length > 0 && <p style={{ margin: '2px 0 0', fontSize: 10, color: '#64748B' }}>{formatDays(cls.days)}</p>}
            </div>
          </div>

          {sel && (
            <div style={{ padding: '0 13px 12px', borderTop: `1px solid ${T[tc].border}` }}>
              {cls.classType === 'FIXED_TIME' && (
                <div style={{ marginTop: 9, padding: '9px 11px', background: '#fff', borderRadius: 8, border: `1.5px solid ${T.blue.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={13} color={T.blue.text} />
                  <div>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: T.blue.text }}>Fixed schedule — auto applied</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 800, color: '#051d24' }}>
                      {cls.startTime && cls.endTime ? `${cls.startTime} – ${cls.endTime}` : 'Time not set in class'}
                    </p>
                  </div>
                </div>
              )}
              {cls.classType === 'FLEX_TIME' && (
                <div style={{ marginTop: 9 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={LS}>Start Time</label>
                      <TimePicker value={timing.startTime || ''} onChange={val => onTimingChange(cls.id, 'startTime', val)} />
                    </div>
                    <div>
                      <label style={LS}>End Time</label>
                      <TimePicker value={timing.endTime || ''} onChange={val => onTimingChange(cls.id, 'endTime', val)} />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, padding: '9px 11px', background: '#fff', borderRadius: 8, border: `1.5px solid ${T.teal.border}` }}>
                    <label style={LS}>Hours to Assign <span style={{ color: '#D4AF37' }}>*</span></label>
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
              {cls.classType === 'HOURS_BASED' && (
                <div style={{ marginTop: 9, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={LS}>Paid Hours</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      step="1"
                      placeholder="Enter paid hours"
                      value={timing.paidFlexiHours != null ? timing.paidFlexiHours : ''}
                      onChange={e => onHoursChange(cls.id, 'paidFlexiHours', e.target.value === '' ? '' : Number(e.target.value))}
                      style={IS}
                    />
                  </div>
                  <div>
                    <label style={LS}>Free Hours</label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      step="1"
                      placeholder="Enter free hours"
                      value={timing.freeFlexiHours != null ? timing.freeFlexiHours : ''}
                      onChange={e => onHoursChange(cls.id, 'freeFlexiHours', e.target.value === '' ? '' : Number(e.target.value))}
                      style={IS}
                    />
                  </div>
                </div>
              )}
              {cls.classType !== 'HOURS_BASED' && (
                <FlexiAddOn cls={cls} timing={timing} onHoursChange={onHoursChange} />
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  const s = {
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C', icon: '✕' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: '✓' },
    warning: { bg: '#FFFBEB', border: '#FCD34D', text: '#B45309', icon: '!' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', text: '#0F4C5C', icon: 'i' },
  }[type] || {};

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, left: 16, zIndex: 9999,
      maxWidth: 380, marginLeft: 'auto',
      background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 12,
      padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      animation: 'toastIn 0.25s ease',
    }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.text, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{s.icon}</div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: s.text, flex: 1, lineHeight: 1.4 }}>{message}</p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.text, padding: 2, lineHeight: 1, fontSize: 16 }}>×</button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const checkStudentExists = async (studentId) => {
  try {
    const API_BASE_URL = SHARED_API_BASE_URL.replace(/\/$/, '');
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};

const StudentRegistrationPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [form, setForm] = useState({ ...EMPTY_STUDENT });
  const [errors, setErrors] = useState({});
  const [showSiblings, setShowSiblings] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [classesData, setClassesData] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [loading, setLoading] = useState(isEditMode);
  const [toast, setToast] = useState({ message: '', type: 'error' });
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState('Father');
  const [studentId, setStudentId] = useState('');
  const [realId, setRealId] = useState(id);
  const [newStudentId, setNewStudentId] = useState(null);
  const [feeEnrollSummary, setFeeEnrollSummary] = useState(null); // { enrolled: [], failed: [] }
  const [originalClassIds, setOriginalClassIds] = useState([]);
  const [parentUserIdState, setParentUserIdState] = useState(null);
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getTimingForClass = (classTimings, cls) => {
    return (
      classTimings?.[cls._id] ||
      classTimings?.[cls.id] ||
      classTimings?.[cls.classId] ||
      {}
    );
  };

  const formatWhatsAppPhone = (phone) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return digits;
    return digits;
  };

  const getRecipientData = () => {
    if (!createdCredentials) return null;
    if (selectedRecipient === 'Mother' && createdCredentials.motherPhone) {
      return {
        label: 'Mother',
        name: createdCredentials.motherName || 'Mother',
        phone: createdCredentials.motherPhone,
        email: createdCredentials.motherEmail || createdCredentials.email || 'N/A',
      };
    }
    return {
      label: 'Father',
      name: createdCredentials.fatherName || 'Father',
      phone: createdCredentials.fatherPhone,
      email: createdCredentials.fatherEmail || createdCredentials.email || 'N/A',
    };
  };

  const buildCredentialMessage = () => {
    const recipient = getRecipientData();
    if (!recipient) return '';
    
    const loginUrl = 'https://brainbuilder.in/login';

    return `🎉 *Congratulations!* 🎉\n\n` +
      `Your child *${createdCredentials.name || 'Student'}* has been successfully registered at *BrainBuilder*.\n\n` +
      `👋 *Dear ${recipient.name},*\n` +
      `Welcome aboard! Here are your login details for the parent app.\n\n` +
      `📱 *Phone:* ${recipient.phone || 'N/A'}\n` +
      `📧 *Email:* ${recipient.email || 'N/A'}\n` +
      `🔐 *Password:* ${createdCredentials.password}\n\n` +
      `🌐 *Login Link:* ${loginUrl}\n\n` +
      `✅ Use *Email OR Phone* with the password above to login.\n` +
      `If you need help, please contact the school office. Thank you for choosing BrainBuilder!`;
  };

  const syncNewFeeEnrollments = async (studentIdToSync, nextClassIds = [], previousClassIds = [], classTimings = {}) => {
    if (!studentIdToSync || !nextClassIds.length) return { enrolled: [], failed: [] };
    const previous = new Set((previousClassIds || []).filter(Boolean).map(String));
    const newClassIds = nextClassIds.filter(cid => cid && !previous.has(String(cid)));
    const enrolled = [];
    const failed = [];

    for (const cid of newClassIds) {
      const cls = classesData.find((c) => c._id === cid || c.id === cid || c.classId === cid);
      const label = cls ? `${cls.name}${cls.section ? ` - ${cls.section}` : ''}` : cid;
      const assignedHours = cls?.classType === 'FLEX_TIME' ? (classTimings?.[cid]?.assignedHours || undefined) : undefined;
      try {
        await feeService.createEnrollment(studentIdToSync, cid, assignedHours);
        enrolled.push(label);
      } catch (enrollErr) {
        const reason = enrollErr?.response?.data?.error || enrollErr?.response?.data?.message || enrollErr?.message || 'Failed to enroll';
        if (/already|duplicate|exist/i.test(reason)) {
          enrolled.push(label);
        } else {
          failed.push({ name: label, reason });
        }
      }
    }

    return { enrolled, failed };
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await getClassesAPI();
        const mapped = (res.data?.data || res.data || []).map(c => ({
          ...c,
          id: c._id || c.id,
          _id: c._id || c.id,
          classId: c.classId || null,
          monthlyFreeHours: c.monthlyFreeHours ?? 0,
        }));
        setClassesData(mapped);
      } catch (e) {
        console.error('Failed to load classes', e);
      }
    })();
  }, []);

  // Academic sessions — only meaningful for new admissions (pre-admission
  // into an Upcoming session). Defaults selection to whichever is Active.
  useEffect(() => {
    if (isEditMode) return;
    (async () => {
      try {
        const res = await listAcademicSessionsAPI();
        const list = res?.data || [];
        setAcademicSessions(list);
        const active = list.find((s) => s.status === 'Active');
        if (active) set('sessionId', active._id);
      } catch (e) {
        console.error('Failed to load academic sessions', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      const exists = await checkStudentExists(id);
      if (!exists) {
        setToast({ message: `Student with ID "${id}" not found. Redirecting...`, type: 'error' });
        setTimeout(() => navigate('/admin/students'), 2000);
        return;
      }
      try {
        setLoading(true);
        const res = await getStudentAPI(id);
        const s = res.data?.data || res.data;
        if (!s) throw new Error('Student not found');

        // Normalize classTimings: convert classId-keyed entries to _id-keyed
        const normalizeTimings = (rawTimings, classes) => {
          if (!rawTimings || !classes?.length) return rawTimings || {};
          const normalized = {};
          for (const [key, val] of Object.entries(rawTimings)) {
            const cls = classes.find(c => c._id === key || c.id === key || c.classId === key);
            if (cls) {
              normalized[cls._id] = val;
            } else {
              normalized[key] = val;
            }
          }
          return normalized;
        };

        const pd = s.parentDetails || {};
        const pUser = s.parentUserId || {};
        const addr = s.address || {};
        const loadedName = s.fullName || `${s.firstName || ''} ${s.lastName === '.' ? '' : (s.lastName || '')}`.trim();

        setForm({
          name: loadedName || '',
          phone: pd.primaryPhone || pd.fatherPhone || pUser.phone || '',
          gender: s.gender || 'Male',
          dob: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
          joiningDate: s.admissionDate ? s.admissionDate.split('T')[0] : '',
          fatherName: pd.primaryName || pd.fatherName || pUser.name || '',
          fatherMobile: pd.primaryPhone || pd.fatherPhone || pUser.phone || '',
          fatherEmail: s.fatherEmail || pd.primaryEmail || pd.fatherEmail || pUser.email || '',
          fatherDob: s.fatherDob ? s.fatherDob.split('T')[0] : (pd.fatherDob ? pd.fatherDob.split('T')[0] : ''),
          motherName: pd.motherName || '',
          motherMobile: pd.motherPhone || '',
          motherEmail: s.motherEmail || pd.motherEmail || '',
          motherDob: s.motherDob ? s.motherDob.split('T')[0] : (pd.motherDob ? pd.motherDob.split('T')[0] : ''),
          address: addr.street || '',
          status: s.status || 'Active',
          classIds: s.classIds || [],
          classTimings: normalizeTimings(s.classTimings, classesData),
          siblings: s.siblings || [],
          parentPassword: '',
          admissionAY: s.admissionAY || CURRENT_AY,
          admissionYear: s.admissionYear || CURRENT_START_YR,
          photo: null,
          adminNotes: s.adminNotes || '',
          documentVerification: s.documentVerification || EMPTY_STUDENT.documentVerification,
        });
        setOriginalClassIds(s.classIds || []);
        if (pUser && pUser._id) {
          setParentUserIdState(pUser._id);
        }

        if (s.photo) setPhotoPreview(s.photo);
        setRealId(s._id);
        if (s._id || s.enrollmentId || s.admissionNo) {
          setStudentId(s.admissionNo || s.enrollmentId || s._id);
        }
      } catch (e) {
        setToast({ message: e.message || 'Failed to load student', type: 'error' });
        const errMsg = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to load student';
        setToast({ message: errMsg, type: 'error' });
        setTimeout(() => navigate('/admin/students'), 1500);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEditMode, navigate]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Photo must be less than 5MB', type: 'error' });
      return;
    }
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
    const e = {};
    if (!form.name?.trim()) e.name = 'Student name is required';
    if (!form.fatherMobile?.trim()) e.fatherMobile = 'Mobile number is required';
    else if (!INDIAN_PHONE_RE.test(form.fatherMobile.trim())) e.fatherMobile = 'Enter a valid 10-digit Indian mobile';
    if (!form.fatherEmail?.trim()) e.fatherEmail = 'Email is required for parent login';
    else if (!EMAIL_RE.test(form.fatherEmail.trim())) e.fatherEmail = 'Enter a valid email address';
    if (form.motherEmail?.trim() && !EMAIL_RE.test(form.motherEmail.trim())) e.motherEmail = 'Enter a valid email address';
    if (form.motherMobile?.trim() && !INDIAN_PHONE_RE.test(form.motherMobile.trim())) e.motherMobile = 'Enter a valid 10-digit Indian mobile';

    if (!isEditMode && (!form.parentPassword || form.parentPassword.length < 6)) {
      e.parentPassword = 'Minimum 6 characters required';
    } else if (isEditMode && form.parentPassword && form.parentPassword.length < 6) {
      e.parentPassword = 'Minimum 6 characters required';
    }
    if (!form.classIds.length) e.classIds = 'Please select at least one class';

    form.classIds.forEach(cid => {
      const cls = classesData.find(c => c.id === cid);
      const timing = form.classTimings?.[cid] || {};
      if (cls?.classType === 'FLEX_TIME' && (!timing.startTime || !timing.endTime)) {
        e.classIds = 'Please set start and end time for all flexible classes';
      }
      if (cls?.classType === 'FLEX_TIME' && timing.startTime && timing.endTime && timing.startTime >= timing.endTime) {
        e.classIds = 'End time must be after start time for flexible classes';
      }
      if (cls?.classType === 'FLEX_TIME' && !(Number(timing.assignedHours) > 0)) {
        e.classIds = 'Please enter hours to assign for all flexible classes';
      }
    });

    const filledSib = form.siblings.find(s => s.class || s.school || s.dob);
    if (filledSib && !filledSib.name) e.siblings = 'Sibling name is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      setToast({ message: 'Please fix the highlighted errors before submitting', type: 'error' });
      return;
    }
    setSaveLoading(true);
    try {
      if (isEditMode) {
        const classIdsToSend = form.classIds || [];
        const classTimingsToSend = {};
        for (const id of classIdsToSend) {
          const cls = classesData.find(c => c.id === id || c._id === id);
          if (cls) {
            classTimingsToSend[id] = form.classTimings?.[id] || form.classTimings?.[cls._id] || form.classTimings?.[cls.classId] || {};
          }
        }

        const invalidClassIds = classIdsToSend.filter(id => id && !/^[a-fA-F0-9]{24}$/.test(id));
        if (invalidClassIds.length > 0) {
          setToast({ message: `Invalid class IDs detected: ${invalidClassIds.join(', ')}. Please reselect classes.`, type: 'error' });
          return;
        }

        const nameParts = (form.name || '').trim().split(' ');
        const payload = {
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ').trim() || '.',
          gender: form.gender || 'Male',
          status: form.status || 'Active',
          ...(form.dob && { dateOfBirth: form.dob }),
          fatherEmail: form.fatherEmail?.trim().toLowerCase() || '',
          fatherDob: form.fatherDob || null,
          motherEmail: form.motherEmail?.trim().toLowerCase() || '',
          motherDob: form.motherDob || null,
          admissionAY: form.admissionAY || CURRENT_AY,
          admissionYear: form.admissionYear || CURRENT_START_YR,
          address: { street: form.address?.trim() || '', city: '', state: '', pincode: '' },
          classIds: classIdsToSend,
          classTimings: classTimingsToSend,
          siblings: form.siblings || [],
          documentVerification: {
            ...EMPTY_STUDENT.documentVerification,
            ...(form.documentVerification || {}),
          },
          ...(form.classIds?.length > 0 && (() => {
            const firstClass = classesData.find(c => c.id === form.classIds[0] || c._id === form.classIds[0]);
            return firstClass ? { className: firstClass.name, section: firstClass.section || '' } : {};
          })()),
        };

        const API_BASE_URL = SHARED_API_BASE_URL.replace(/\/$/, '');
        const token = localStorage.getItem('token');

        if (!token) {
          setToast({ message: 'Authentication required. Please log in again.', type: 'error' });
          navigate('/login');
          return;
        }

        console.log('Update payload:', payload);

        const updateResponse = await fetch(`${API_BASE_URL}/students/${realId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });

        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
          if (updateResponse.status === 404) throw new Error(`Student with ID "${id}" not found. Please check the ID or create the student first.`);
          if (updateResponse.status === 401) { localStorage.removeItem('token'); throw new Error('Authentication expired. Please log in again.'); }
          if (updateResponse.status === 403) throw new Error('You do not have permission to update students.');
          if (updateResponse.status === 400) throw new Error(updateResult.error || 'Invalid data provided. Please check all fields.');
          throw new Error(updateResult.error || updateResult.message || `Server error (${updateResponse.status})`);
        }

        if (!updateResult.success) throw new Error(updateResult.error || updateResult.message || 'Update failed');

        if (form.parentPassword && form.parentPassword.length >= 6 && parentUserIdState) {
          try {
            const pwResponse = await fetch(`${API_BASE_URL}/auth/admin/change-password/${parentUserIdState}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ newPassword: form.parentPassword })
            });
            if (!pwResponse.ok) {
              console.warn("Parent password update failed", await pwResponse.text());
            }
          } catch(err) {
            console.error("Password update error", err);
          }
        }

        const feeSync = await syncNewFeeEnrollments(realId, classIdsToSend, originalClassIds, classTimingsToSend);

        if (form.photo && typeof form.photo !== 'string') {
          try {
            await updateStudentPhotoAPI(realId, form.photo);
          } catch (photoError) {
            console.warn('Photo update failed, but student data was updated:', photoError);
            setToast({ message: `${form.name} updated successfully, but photo upload failed.`, type: 'warning' });
            setTimeout(() => navigate('/admin/students'), 3000);
            return;
          }
        }

        if (feeSync.failed.length > 0) {
          setToast({ message: `${form.name} updated, but fee enrollment failed for ${feeSync.failed.map(f => f.name).join(', ')}. Please enroll from Fee Hub.`, type: 'warning' });
        } else if (feeSync.enrolled.length > 0) {
          setToast({ message: `${form.name} updated and fee enrolled for ${feeSync.enrolled.join(', ')}.`, type: 'success' });
        } else {
          setToast({ message: `${form.name} updated successfully!`, type: 'success' });
        }
        setTimeout(() => navigate('/admin/students'), 1500);
      } else {
        const { data, isFormData } = buildPayload(form, classesData);
        const res = await createStudentAPI(data, isFormData);
        const d = res.data;
        const studentName = d?.data?.student?.fullName || d?.data?.fullName || form.name;
        const parentEmail = d?.data?.parentAccount?.email || form.fatherEmail;
        const parentPhone = d?.data?.parentAccount?.phone || form.fatherMobile;
        const parentPassword = form.parentPassword || 'parent@123';
        const studentData = d?.data?.student || {};
        const createdStudentId = studentData._id || studentData.id || d?.data?._id || d?.data?.id;

        if (createdStudentId) {
          await updateStudentAPI(createdStudentId, {
            documentVerification: {
              ...EMPTY_STUDENT.documentVerification,
              ...(form.documentVerification || {}),
            },
          });
        }

        // Auto fee-enrollment: as soon as a student is registered into a class,
        // enroll them in the Fee Module too, so installments/one-time fee are
        // generated right away and payment can be collected in the same flow.
        setNewStudentId(createdStudentId || null);
        if (createdStudentId && (form.classIds || []).length > 0) {
          const enrolled = [];
          const failed = [];
          for (const cid of form.classIds) {
            const cls = classesData.find((c) => c._id === cid || c.id === cid);
            const assignedHours = cls?.classType === 'FLEX_TIME' ? (form.classTimings?.[cid]?.assignedHours || undefined) : undefined;
            try {
              await feeService.createEnrollment(createdStudentId, cid, assignedHours);
              enrolled.push(cls?.name || cid);
            } catch (enrollErr) {
              failed.push({ name: cls?.name || cid, reason: enrollErr?.response?.data?.error || enrollErr?.response?.data?.message || 'Failed to enroll' });
            }
          }
          setFeeEnrollSummary({ enrolled, failed });
        } else {
          setFeeEnrollSummary(null);
        }

        const creds = {
          email: parentEmail,
          password: parentPassword,
          name: studentName,
          fatherName: form.fatherName || '',
          fatherPhone: form.fatherMobile || '',
          fatherEmail: form.fatherEmail || '',
          motherName: form.motherName || '',
          motherPhone: form.motherMobile || '',
          motherEmail: form.motherEmail || '',
          studentPhone: studentData.phone || form.phone || '',
          studentEmail: studentData.email || '',
          studentPassword: form.parentPassword || 'parent@123'
        };

        setCreatedCredentials(creds);
        setSelectedRecipient('Father');
        setShowCredentials(true);
        setToast({ message: `Student created successfully!`, type: 'success' });
      }
    } catch (e) {
      console.error('Update error:', e);
      const errorMessage = e.response?.data?.error || e.response?.data?.message || e.message || 'Failed to update student. Please try again.';
      setToast({ message: errorMessage, type: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

        @keyframes toastIn { from { opacity:0; transform:translateX(20px) } to { opacity:1; transform:translateX(0) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }

        *, *::before, *::after { box-sizing: border-box; }

        input:focus, select:focus, textarea:focus {
          border-color: #0F4C5C !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08) !important;
          outline: none;
        }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #F1F5F9; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }

        /* ── Top Bar ── */
        .topbar-inner {
          max-width: 960px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 10px;
          height: 56px;
          padding: 0 16px;
        }
        .topbar-title { flex: 1; min-width: 0; }
        .topbar-title h1 { margin: 0; font-size: 15px; font-weight: 800; color: #051d24; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-title p  { margin: 0; font-size: 10px; color: #94A3B8; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .topbar-actions { display: flex; gap: 8px; flex-shrink: 0; }
        .btn-cancel-top { padding: 7px 12px; border-radius: 8px; border: 1.5px solid #E2E8F0; background: #fff; color: #475569; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; }
        .btn-save-top   { padding: 7px 14px; border-radius: 8px; border: none; color: #fff; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; display: flex; align-items: center; gap: 6px; }

        /* ── Page Content ── */
        .page-content {
          max-width: 960px;
          margin: 0 auto;
          padding: 16px 12px 48px;
          animation: fadeUp 0.3s ease;
        }

        /* ── Two column layout ── */
        .two-col {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 440px), 1fr));
          gap: 14px;
        }

        /* ── Form grid ── */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }

        /* ── Admission session ── */
        .admission-session {
          background: #fff;
          border-radius: 12px;
          border: 1.5px solid #E9ECF0;
          padding: 14px 16px;
        }
        .ay-buttons { display: flex; gap: 8px; flex-wrap: wrap; }

        /* ── Student ID badge in header ── */
        .student-id-badge {
          margin-left: auto;
          padding: 5px 10px;
          background: #F1F5F9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        /* ── Photo area ── */
        .photo-area { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

        /* ── Bottom bar ── */
        .bottom-bar {
          background: #fff;
          border-radius: 12px;
          border: 1.5px solid #E9ECF0;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }
        .bottom-bar-info { display: flex; align-items: center; gap: 6px; color: #94A3B8; font-size: 11px; font-weight: 500; }
        .bottom-bar-btns { display: flex; gap: 8px; }

        /* ── Sibling grid ── */
        .sibling-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; }

        /* ── Modal ── */
        .modal-overlay {
          position: fixed; inset: 0; z-index: 1200;
          background: rgba(2,8,32,0.8);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 12px;
        }
        .modal-box {
          width: 100%; max-width: 500px;
          background: #fff; border-radius: 20px; overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.35);
          animation: toastIn 0.25s ease;
          max-height: 92vh;
          display: flex; flex-direction: column;
        }
        .modal-header { background: linear-gradient(135deg,#064E3B,#059669); padding: 16px 18px; flex-shrink: 0; }
        .modal-body   { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; overflow-y: auto; }

        .cred-box { border-radius: 12px; padding: 12px 14px; }
        .cred-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
        .cred-label { font-size: 11px; font-weight: 700; width: 54px; flex-shrink: 0; }
        .cred-value { font-size: 12px; font-weight: 700; color: #051d24; font-family: monospace; flex: 1; word-break: break-all; }

        .btn-wa   { flex: 1; padding: 11px 8px; border-radius: 12px; border: none; background: linear-gradient(135deg,#25D366,#128C7E); color: #fff; font-weight: 700; font-size: 13px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-done { width: 100%; padding: 12px; border-radius: 12px; border: none; background: linear-gradient(135deg,#051d24,#051d24); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-copy { padding: 4px 8px; border-radius: 6px; border: none; background: #fff; font-weight: 700; font-size: 10px; cursor: pointer; flex-shrink: 0; }

        /* ── Mobile overrides ── */
        @media (max-width: 480px) {
          .topbar-inner { height: auto; min-height: 52px; padding: 8px 12px; flex-wrap: wrap; gap: 8px; }
          .topbar-title h1 { font-size: 13px; }
          .topbar-title p  { font-size: 9px; }
          .btn-cancel-top { display: none; }
          .btn-save-top   { padding: 7px 12px; font-size: 11px; }

          .page-content { padding: 10px 8px 40px; }

          .form-grid { grid-template-columns: 1fr; }
          .two-col   { grid-template-columns: 1fr; gap: 10px; }

          .photo-area { gap: 6px; }
          .student-id-badge { font-size: 10px; padding: 4px 8px; }

          .bottom-bar { flex-direction: column; align-items: stretch; }
          .bottom-bar-btns { justify-content: stretch; }
          .bottom-bar-btns button { flex: 1; }

          .modal-box { max-width: 100%; border-radius: 16px; }
          .modal-header { padding: 14px 14px; }
          .modal-body   { padding: 14px 14px; }
          .btn-wa, .btn-done { font-size: 12px; padding: 10px 6px; }

          .sibling-grid { grid-template-columns: 1fr; }
          .ay-buttons button { flex: 1; text-align: center; }
        }

        @media (min-width: 481px) and (max-width: 768px) {
          .topbar-inner { padding: 0 14px; }
          .btn-cancel-top { padding: 6px 10px; font-size: 11px; }
          .page-content { padding: 12px 10px 40px; }
          .form-grid { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .page-content { padding: 16px 14px 40px; }
          .form-grid { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); }
        }
      `}</style>

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'error' })} />

      {loading ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#0F4C5C' }} />
            <p style={{ marginTop: 16, fontSize: 14, color: '#64748B', fontWeight: 600 }}>Loading student data...</p>
          </div>
        </div>
      ) : ( 
        <>
          {/* ── Top Bar ── */}
          <div style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="topbar-inner">
              <button
                onClick={() => navigate('/admin/students')}
                style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}
              >
                <ArrowLeft size={16} />
              </button>
              <div className="topbar-title">
                <h1>{isEditMode ? 'Edit Student' : 'Register New Student'}</h1>
                <p>{isEditMode ? 'Update student information and save changes' : 'Fill in all required fields to create a student account'}</p>
              </div>
              <div className="topbar-actions">
                <button className="btn-cancel-top" onClick={() => navigate('/admin/students')}>Cancel</button>
                <button
                  className="btn-save-top"
                  onClick={handleSave}
                  disabled={saveLoading}
                  style={{ background: saveLoading ? '#93C5FD' : '#0F4C5C', cursor: saveLoading ? 'not-allowed' : 'pointer', boxShadow: saveLoading ? 'none' : '0 2px 8px rgba(37,99,235,0.3)' }}
                >
                  {saveLoading
                    ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{isEditMode ? 'Updating...' : 'Saving...'}</>
                    : <><GraduationCap size={13} />{isEditMode ? 'Update' : 'Register'}</>
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ── Page Content ── */}
          <div className="page-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Admission Session */}
              <div className="admission-session">
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admission Session</p>
                <div className="ay-buttons">
                  {[CURRENT_AY, NEXT_AY].map(ay => {
                    const active = form.admissionAY === ay;
                    return (
                      <button key={ay} type="button"
                        onClick={() => setForm(f => ({ ...f, admissionAY: ay, admissionYear: parseInt(ay.split('-')[0]) }))}
                        style={{
                          padding: '8px 16px', borderRadius: 8,
                          border: `2px solid ${active ? '#0F4C5C' : '#E2E8F0'}`,
                          background: active ? '#0F4C5C' : '#fff',
                          color: active ? '#fff' : '#475569',
                          fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {ay} <span style={{ fontSize: 10, opacity: 0.8 }}>({ay === NEXT_AY ? 'Next' : 'Current'})</span>
                      </button>
                    );
                  })}
                </div>
                {!isEditMode && academicSessions.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <label style={LS}>Academic Session</label>
                    <select
                      value={form.sessionId}
                      onChange={(e) => set('sessionId', e.target.value)}
                      style={{ ...IS, maxWidth: 320 }}
                    >
                      {academicSessions
                        .filter((s) => s.status === 'Active' || s.status === 'Upcoming')
                        .map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name} {s.status === 'Active' ? '(Active)' : '(Upcoming — pre-admission)'}
                          </option>
                        ))}
                    </select>
                    <p style={{ margin: '4px 0 0', fontSize: 10.5, color: '#94A3B8' }}>
                      Defaults to the Active session. Pick an Upcoming session to pre-admit this student into next year while the current year is still running.
                    </p>
                  </div>
                )}
              </div>

              {/* Two Column */}
              <div className="two-col">

                {/* ── Left Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Student Details */}
                  <SectionCard title="Student Details" icon={GraduationCap} accent="#0F4C5C"
                    extra={
                      <div className="photo-area">
                        {photoPreview
                          ? <img src={photoPreview} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '2px solid #E9D5FF', cursor: 'pointer', flexShrink: 0 }} onClick={() => fileRef.current?.click()} />
                          : form.name
                            ? <div onClick={() => fileRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#0F4C5C,#051d24)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>{form.name.charAt(0).toUpperCase()}</div>
                            : <button type="button" onClick={() => fileRef.current?.click()} style={{ width: 36, height: 36, borderRadius: 8, border: '2px dashed #CBD5E1', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Camera size={14} color="#94A3B8" /></button>
                        }
                        <button type="button" onClick={() => fileRef.current?.click()} style={{ fontSize: 11, fontWeight: 700, color: '#7E22CE', background: '#FAF5FF', border: '1.5px solid #E9D5FF', padding: '5px 9px', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {photoPreview ? 'Change Photo' : '+ Photo'}
                        </button>
                        <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhoto} style={{ display: 'none' }} />
                        {isEditMode && studentId && (
                          <div className="student-id-badge">
                            <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>Adm No:</span>
                            <span style={{ fontSize: 11, color: '#051d24', fontWeight: 800, fontFamily: 'monospace' }}>{studentId}</span>
                          </div>
                        )}
                      </div>
                    }
                  >
                    <div className="form-grid">
                      <Field label="Full Name" required span="full">
                        <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Student's full name" style={{ ...IS, borderColor: errors.name ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="name" errors={errors} />
                      </Field>
                      <Field label="Gender">
                        <select value={form.gender} onChange={e => set('gender', e.target.value)} style={IS}>
                          {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                        </select>
                      </Field>
                      <Field label="Status">
                        <select value={form.status} onChange={e => set('status', e.target.value)} style={IS}>
                          <option>Active</option><option>Inactive</option>
                        </select>
                      </Field>
                      <Field label="Date of Birth">
                        <input type="date" value={form.dob} onChange={e => set('dob', e.target.value)} style={IS} />
                      </Field>
                      <Field label="Joining Date">
                        <input type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} style={IS} />
                      </Field>
                    </div>
                  </SectionCard>

                  {/* Father's Info */}
                  <SectionCard title="Father's Info & Parent Login" icon={User} accent="#0F4C5C">
                    <div className="form-grid">
                      <Field label="Father's Name">
                        <input value={form.fatherName} onChange={e => set('fatherName', e.target.value)} placeholder="Father's full name" style={{ ...IS, borderColor: errors.fatherName ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="fatherName" errors={errors} />
                      </Field>
                      <Field label="Mobile Number" required>
                        <input value={form.fatherMobile} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) set('fatherMobile', v); }} placeholder="10-digit mobile" maxLength={10} style={{ ...IS, borderColor: errors.fatherMobile ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="fatherMobile" errors={errors} />
                      </Field>
                      <Field label="Date of Birth">
                        <input type="date" value={form.fatherDob} onChange={e => set('fatherDob', e.target.value)} style={IS} />
                      </Field>
                      <Field label="Email Address" required>
                        <input type="email" value={form.fatherEmail} onChange={e => set('fatherEmail', e.target.value)} placeholder="Used for parent login" style={{ ...IS, borderColor: errors.fatherEmail ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="fatherEmail" errors={errors} />
                      </Field>
                    </div>
                    {/* {isEditMode && (
                      <div style={{ marginTop: 12, background: '#F0FDF4', borderRadius: 9, padding: '10px 12px', border: '1.5px solid #BBF7D0', fontSize: 11, color: '#15803D', fontWeight: 500 }}>
                        ℹ️ <strong>Note:</strong> Name & Phone can be viewed but not updated here. To change parent contact details, please use the parent management section (when available) or update through the parent account settings.
                      </div>
                    )} */}
                    <div style={{ marginTop: 12, background: '#EFF6FF', borderRadius: 9, padding: '12px 13px', border: '1.5px solid #BFDBFE' }}>
                      <label style={{ ...LS, color: '#0F4C5C', marginBottom: 6 }}>
                        Parent Login Password {!isEditMode && <span style={{ color: '#D4AF37' }}>*</span>}
                      </label>
                      <input type="text" value={form.parentPassword || ''} onChange={e => set('parentPassword', e.target.value)} placeholder={isEditMode ? 'Leave blank to keep current' : 'Min 6 characters'} style={{ ...IS, fontFamily: 'monospace', borderColor: errors.parentPassword ? '#D4AF37' : '#BFDBFE', background: '#fff' }} />
                      <FieldErr k="parentPassword" errors={errors} />
                      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#3B82F6', fontWeight: 500 }}>💡 Share this password with the parent after registration</p>
                    </div>
                  </SectionCard>

                  {/* Mother's Info */}
                  <SectionCard title="Mother's Info" icon={Heart} accent="#9333EA">
                    <div className="form-grid">
                      <Field label="Mother's Name">
                        <input value={form.motherName} onChange={e => set('motherName', e.target.value)} placeholder="Mother's full name" style={{ ...IS, borderColor: errors.motherName ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="motherName" errors={errors} />
                      </Field>
                      <Field label="Mobile Number">
                        <input value={form.motherMobile} onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v.length <= 10) set('motherMobile', v); }} placeholder="10-digit mobile" maxLength={10} style={{ ...IS, borderColor: errors.motherMobile ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="motherMobile" errors={errors} />
                      </Field>
                      <Field label="Date of Birth">
                        <input type="date" value={form.motherDob} onChange={e => set('motherDob', e.target.value)} style={IS} />
                      </Field>
                      <Field label="Email Address">
                        <input type="email" value={form.motherEmail} onChange={e => set('motherEmail', e.target.value)} placeholder="Optional" style={{ ...IS, borderColor: errors.motherEmail ? '#D4AF37' : '#E2E8F0' }} />
                        <FieldErr k="motherEmail" errors={errors} />
                      </Field>
                    </div>
                  </SectionCard>
                </div>

                {/* ── Right Column ── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                  {/* Address */}
                  <SectionCard title="Address" icon={MapPin} accent="#0D9488">
                    <textarea
                      value={form.address} onChange={e => set('address', e.target.value)}
                      rows={3} placeholder="Full home address"
                      style={{ ...IS, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                    />
                  </SectionCard>

                  {/* Admin Notes */}
                  <SectionCard title="Admin Notes" icon={FileText} accent="#F59E0B"
                    extra={
                      isEditMode ? (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: '#FEF3C7', padding: '2px 8px', borderRadius: 99, border: '1.5px solid #FCD34D' }}>Internal</span>
                      ) : null
                    }
                  >
                    <textarea
                      value={form.adminNotes || ''} onChange={e => set('adminNotes', e.target.value)}
                      rows={3} placeholder="Internal admin notes from enquiry (if any)..."
                      style={{ ...IS, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, background: isEditMode ? '#FFFBEB' : '#fff' }}
                    />
                  </SectionCard>

                  {/* Siblings */}
                  <SectionCard title="Siblings" icon={Baby} accent="#0D9488"
                    extra={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {form.siblings.length > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: T.teal.text, background: T.teal.bg, padding: '2px 8px', borderRadius: 99, border: `1.5px solid ${T.teal.border}` }}>
                            {form.siblings.length} added
                          </span>
                        )}
                        <button type="button" onClick={() => setShowSiblings(!showSiblings)}
                          style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
                          {showSiblings ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          {showSiblings ? 'Hide' : 'Manage'}
                        </button>
                      </div>
                    }
                  >
                    {showSiblings ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <FieldErr k="siblings" errors={errors} />
                        {form.siblings.length === 0
                          ? <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>No siblings added yet</p>
                          : form.siblings.map((sib, i) => (
                            <div key={i} style={{ background: '#F8FAFC', borderRadius: 9, padding: '11px 12px', border: '1.5px solid #E2E8F0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sibling {i + 1}</span>
                                <button type="button" onClick={() => setForm(f => ({ ...f, siblings: f.siblings.filter((_, idx) => idx !== i) }))}
                                  style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: T.red.bg, color: T.red.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <X size={11} />
                                </button>
                              </div>
                              <div className="sibling-grid">
                                <div><label style={LS}>Name</label><input value={sib.name} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, name: e.target.value } : s) }))} style={IS} /></div>
                                <div><label style={LS}>Relation</label><select value={sib.relation} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, relation: e.target.value } : s) }))} style={IS}><option>Brother</option><option>Sister</option></select></div>
                                <div><label style={LS}>DOB</label><input type="date" value={sib.dob} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, dob: e.target.value } : s) }))} style={IS} /></div>
                                <div><label style={LS}>Class</label><input value={sib.class} onChange={e => setForm(f => ({ ...f, siblings: f.siblings.map((s, idx) => idx === i ? { ...s, class: e.target.value } : s) }))} placeholder="e.g. KG-A" style={IS} /></div>
                              </div>
                            </div>
                          ))
                        }
                        <button type="button"
                          onClick={() => { setForm(f => ({ ...f, siblings: [...f.siblings, { name: '', relation: 'Brother', dob: '', school: '', class: '' }] })); setShowSiblings(true); }}
                          style={{ width: '100%', padding: '9px', borderRadius: 9, border: '2px dashed #CBD5E1', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}
                        >
                          <Plus size={12} /> Add Sibling
                        </button>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '8px 0' }}>
                        {form.siblings.length > 0 ? `${form.siblings.length} sibling(s) added — click Manage to edit` : 'Click Manage to add siblings'}
                      </p>
                    )}
                  </SectionCard>

                  {/* Class Assignment */}
                  <SectionCard
                    title="Assign Classes"
                    icon={BookOpen}
                    accent="#0F4C5C"
                    extra={
                      form.classIds.length > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: T.blue.bg, color: T.blue.text, padding: '2px 8px', borderRadius: 99, border: `1.5px solid ${T.blue.border}` }}>
                          {form.classIds.length} selected
                        </span>
                      )
                    }
                  >
                    <FieldErr k="classIds" errors={errors} />
                    <div style={{ marginTop: errors.classIds ? 8 : 0 }}>
                      <ClassWidget
                        classIds={form.classIds} classTimings={form.classTimings}
                        onToggle={toggleClass} onTimingChange={setTiming} onHoursChange={setHours}
                        classesData={classesData}
                      />
                    </div>
                  </SectionCard>

                  {/* Document Verification */}
                  <SectionCard title="Document Verification" icon={FileText} accent="#F59E0B">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      {Object.entries(form.documentVerification || {}).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={e => set('documentVerification', { ...form.documentVerification, [key]: e.target.checked })}
                            style={{ width: 16, height: 16, accentColor: '#F59E0B', cursor: 'pointer' }}
                          />
                          <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', textTransform: 'capitalize' }}>
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </label>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="bottom-bar">
                <div className="bottom-bar-info">
                  <Shield size={12} />
                  All data is securely stored and accessible only to authorized staff
                </div>
                <div className="bottom-bar-btns">
                  <button
                    onClick={() => navigate('/admin/students')}
                    style={{ padding: '9px 16px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    style={{
                      padding: '9px 20px', borderRadius: 9, border: 'none',
                      background: saveLoading ? '#93C5FD' : '#0F4C5C',
                      color: '#fff', fontWeight: 700, fontSize: 13,
                      cursor: saveLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit',
                      boxShadow: saveLoading ? 'none' : '0 3px 10px rgba(37,99,235,0.3)',
                    }}
                  >
                    {saveLoading
                      ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />{isEditMode ? 'Updating...' : 'Registering...'}</>
                      : <><GraduationCap size={14} />{isEditMode ? 'Update Student' : 'Register Student'}</>
                    }
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Credentials Modal ── */}
      {showCredentials && createdCredentials && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCredentials(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={24} color="#fff" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase' }}>Student Registered!</p>
                    <h3 style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 900, color: '#fff' }}>{createdCredentials.name}</h3>
                  </div>
                </div>
                <button onClick={() => { setShowCredentials(false); setCreatedCredentials(null); }} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
              </div>
            </div>
            <div className="modal-body">
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 14px' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#15803D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={13} color="#16A34A" /> Parent Login Options:
                </p>
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 11, color: '#166534', fontWeight: 600, lineHeight: 1.7 }}>
                  <li>Email + Password</li>
                  <li>Phone + Password</li>
                </ul>
              </div>

              {feeEnrollSummary && (feeEnrollSummary.enrolled.length > 0 || feeEnrollSummary.failed.length > 0) && (
                <div style={{ marginTop: 10, background: feeEnrollSummary.failed.length > 0 ? '#FFFBEB' : '#EFF6FF', border: `1.5px solid ${feeEnrollSummary.failed.length > 0 ? '#FDE68A' : '#BFDBFE'}`, borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ margin: 0, fontSize: 11, color: feeEnrollSummary.failed.length > 0 ? '#92400E' : '#0F4C5C', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <GraduationCap size={13} /> Fee Enrollment:
                  </p>
                  {feeEnrollSummary.enrolled.length > 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#1E3A8A', fontWeight: 600 }}>
                      ✅ Enrolled in {feeEnrollSummary.enrolled.join(', ')} — installments/fee generated, ready to collect payment.
                    </p>
                  )}
                  {feeEnrollSummary.failed.length > 0 && (
                    <p style={{ margin: '6px 0 0', fontSize: 11, color: '#92400E', fontWeight: 600 }}>
                      ⚠️ Could not auto-enroll: {feeEnrollSummary.failed.map((f) => f.name).join(', ')}. You can enroll manually from the Fee Hub.
                    </p>
                  )}
                </div>
              )}

              <div style={{ padding: '10px 0 0' }}>
                <label style={{ ...LS, marginBottom: 6 }}>Send credentials to</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient('Father')}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      borderRadius: 10,
                      border: selectedRecipient === 'Father' ? '2px solid #0F4C5C' : '1.5px solid #CBD5E1',
                      background: selectedRecipient === 'Father' ? '#EFF6FF' : '#fff',
                      color: selectedRecipient === 'Father' ? '#0F4C5C' : '#475569',
                      padding: '10px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    Father
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginTop: 4 }}>{createdCredentials.fatherPhone || 'No phone'}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRecipient('Mother')}
                    disabled={!createdCredentials.motherPhone}
                    style={{
                      flex: 1,
                      minWidth: 120,
                      borderRadius: 10,
                      border: selectedRecipient === 'Mother' ? '2px solid #9333EA' : '1.5px solid #CBD5E1',
                      background: selectedRecipient === 'Mother' ? '#F5F3FF' : '#fff',
                      color: selectedRecipient === 'Mother' ? '#5B21B6' : '#475569',
                      padding: '10px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: createdCredentials.motherPhone ? 'pointer' : 'not-allowed',
                      opacity: createdCredentials.motherPhone ? 1 : 0.55,
                      textAlign: 'center',
                    }}
                  >
                    Mother
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#64748B', marginTop: 4 }}>{createdCredentials.motherPhone || 'Not available'}</div>
                  </button>
                </div>
              </div>

              {/* Parent Credentials */}
              <div className="cred-box" style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', border: '1.5px solid #BFDBFE' }}>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#0F4C5C', marginBottom: 4 }}>Parent Credentials</p>
                <div className="cred-row">
                  <span className="cred-label" style={{ color: '#0F4C5C' }}>Email:</span>
                  <span className="cred-value">{createdCredentials.email}</span>
                  <button className="btn-copy" style={{ color: '#0F4C5C' }} onClick={() => navigator.clipboard.writeText(createdCredentials.email)}>Copy</button>
                </div>
                {createdCredentials.fatherPhone && (
                  <div className="cred-row">
                    <span className="cred-label" style={{ color: '#0F4C5C' }}>Phone:</span>
                    <span className="cred-value">{createdCredentials.fatherPhone}</span>
                  </div>
                )}
                <div className="cred-row">
                  <span className="cred-label" style={{ color: '#0F4C5C' }}>Password:</span>
                  <span className="cred-value" style={{ color: '#DC2626' }}>{createdCredentials.password}</span>
                  <button className="btn-copy" style={{ color: '#DC2626' }} onClick={() => navigator.clipboard.writeText(createdCredentials.password)}>Copy</button>
                </div>
              </div>

              {/* Student Credentials */}
              {createdCredentials.studentPhone && (
                <div className="cred-box" style={{ background: 'linear-gradient(135deg,#FAF5FF,#F3E8FF)', border: '1.5px solid #E9D5FF' }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#7E22CE', marginBottom: 4 }}>Student Credentials</p>
                  <div className="cred-row">
                    <span className="cred-label" style={{ color: '#7E22CE' }}>Phone:</span>
                    <span className="cred-value">{createdCredentials.studentPhone}</span>
                  </div>
                  {createdCredentials.studentEmail && (
                    <div className="cred-row">
                      <span className="cred-label" style={{ color: '#7E22CE' }}>Email:</span>
                      <span className="cred-value">{createdCredentials.studentEmail}</span>
                    </div>
                  )}
                  <div className="cred-row">
                    <span className="cred-label" style={{ color: '#7E22CE' }}>Password:</span>
                    <span className="cred-value" style={{ color: '#DC2626' }}>{createdCredentials.studentPassword || createdCredentials.password}</span>
                  </div>
                </div>
              )}

              {/* Share Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-wa"
                  onClick={() => {
                    const recipient = getRecipientData();
                    const waPhone = formatWhatsAppPhone(recipient?.phone || '');
                    if (!waPhone || waPhone.length < 12) {
                      alert('No valid phone number available for WhatsApp. Please check the selected parent phone.');
                      return;
                    }

                    const waMsg = buildCredentialMessage();
                    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`, '_blank');
                  }}
                >
                  <FaWhatsapp size={18} /> Send WhatsApp
                </button>
              </div>

              <button className="btn-done" onClick={() => { setShowCredentials(false); setCreatedCredentials(null); navigate('/admin/students'); }}>
                <CheckCircle size={16} /> Done - Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentRegistrationPage;
