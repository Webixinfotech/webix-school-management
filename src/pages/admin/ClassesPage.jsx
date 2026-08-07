import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, X, Eye, Pencil, Trash2, Clock, BookOpen,
  Download, Copy, CheckCircle, Search, Info,
  AlarmClock, Hourglass, CalendarDays, AlertTriangle, Users, UserCheck, Loader2,
} from 'lucide-react';
import {
  getClassesAPI,
  createClassAPI,
  updateClassAPI,
  deleteClassAPI,
  getClassStudentsAPI,
  getClassTeachersAPI,
  assignTeacherAPI,
} from '../../api/classes';
import { getTeachersAPI } from '../../api/teachers';
import ConfirmModal from '../../components/photos/ConfirmModal';

// ─── Class Type Definitions ───────────────────────────────────────────────────
export const CLASS_TYPES = {
  FIXED_TIME:  { id: 'FIXED_TIME',  label: '1. Fixed Time',    desc: 'All students get the same fixed time',       color: '#0C2A47', bg: '#EFF6FF', border: '#BFDBFE', solid: '#0C2A47' },
  FLEX_TIME:   { id: 'FLEX_TIME',   label: '2. Flexible Time', desc: 'Admin picks exact time per student',          color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', solid: '#0D9488' },
  HOURS_BASED: { id: 'HOURS_BASED', label: '3. Hours Based',   desc: 'Admin assigns hours per student',             color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', solid: '#D97706' },
};

// ─── Days ─────────────────────────────────────────────────────────────────────
export const WEEK_DAYS = [
  { id: 'MON', label: 'Mon' }, { id: 'TUE', label: 'Tue' }, { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' }, { id: 'FRI', label: 'Fri' }, { id: 'SAT', label: 'Sat' }, { id: 'SUN', label: 'Sun' },
];

export const formatDays = (days) => {
  if (!days || days.length === 0) return 'All Days';
  if (days.length === 7) return 'All Days';
  return WEEK_DAYS.filter(d => days.includes(d.id)).map(d => d.label).join(', ');
};

const fmt12 = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  blue:   { bg: '#EFF6FF', text: '#0C2A47', border: '#BFDBFE', solid: '#0C2A47' },
  green:  { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', solid: '#16A34A' },
  red:    { bg: '#FFF1F2', text: '#E2B94D', border: '#FECDD3', solid: '#E2B94D' },
  amber:  { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', solid: '#D97706' },
  teal:   { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', solid: '#0D9488' },
  purple: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', solid: '#9333EA' },
  slate:  { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', solid: '#64748B' },
};

const IS = {
  width: '100%', padding: '11px 14px', borderRadius: 12,
  border: '1.5px solid #E2E8F0', fontSize: 13, fontWeight: 500,
  outline: 'none', boxSizing: 'border-box', background: '#fff',
  fontFamily: 'inherit', color: '#030B15', transition: 'border-color 0.15s',
};

const LS = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#64748B',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
};

// ─── Reusable UI ──────────────────────────────────────────────────────────────
const Badge = ({ children, color = 'slate' }) => {
  const s = T[color] || T.slate;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: s.bg, color: s.text, border: `1.5px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
};

const IconBtn = ({ icon: Icon, color = 'blue', onClick, title }) => {
  const s = T[color] || T.blue;
  return (
    <button onClick={onClick} title={title}
      style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${s.border}`, background: s.bg, color: s.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = s.solid; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = s.solid; }}
      onMouseLeave={e => { e.currentTarget.style.background = s.bg; e.currentTarget.style.color = s.text; e.currentTarget.style.borderColor = s.border; }}>
      <Icon size={15} strokeWidth={2.2} />
    </button>
  );
};

const Modal = ({ open, onClose, title, subtitle, children, maxWidth = 600 }) => {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,15,40,0.60)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth, background: '#fff', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 40px)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#030B15' }}>{title}</h2>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94A3B8' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: '#F1F5F9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', padding: 24, flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Day Selector (Fixed) ─────────────────────────────────────────────────────
const DaySelector = ({ selected = [], onChange, solidColor }) => {
  const toggle = (dayId) => {
    const next = selected.includes(dayId)
      ? selected.filter(d => d !== dayId)
      : [...selected, dayId];
    onChange(next);
  };

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {WEEK_DAYS.map(day => {
        const isSelected = selected.includes(day.id);
        return (
          <button
            key={day.id}
            type="button"
            onClick={() => toggle(day.id)}
            style={{
              minWidth: 48,
              padding: '8px 12px',
              borderRadius: 10,
              border: isSelected ? `2px solid ${solidColor || '#7B1FA2'}` : '2px solid #E2E8F0',
              cursor: 'pointer',
              background: isSelected ? solidColor || '#7B1FA2' : '#F8FAFC',
              color: isSelected ? '#fff' : '#64748B',
              fontWeight: 700,
              fontSize: 12,
              transition: 'all 0.15s ease',
              outline: 'none',
              boxShadow: isSelected ? `0 2px 8px ${solidColor || '#7B1FA2'}40` : 'none',
              transform: isSelected ? 'translateY(-1px)' : 'none',
            }}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
};

// ─── Full Page Form Layout ────────────────────────────────────────────────────
const FullPageForm = ({ mode, initial, onSave, onCancel, saveLoading }) => {
  return (
    <div style={{
      minHeight: 'calc(100vh - 100px)',
      background: 'linear-gradient(135deg, #F8F4FF 0%, #F0F9FF 100%)',
      margin: '-24px -16px',
      padding: '24px 16px'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '20px 28px',
        marginBottom: 20,
        boxShadow: '0 4px 20px rgba(123,31,162,0.08)',
        border: '1.5px solid #F3E8FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#0C2A47,#030B15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {mode === 'create' ? <Plus size={22} color="#fff" /> : <Pencil size={20} color="#fff" />}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#030B15' }}>
              {mode === 'create' ? 'Create New Class' : 'Edit Class'}
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
              {mode === 'create' ? 'Choose type and fill in class details' : 'Update the class information below'}
            </p>
          </div>
        </div>
        <button onClick={onCancel}
          style={{
            padding: '9px 18px',
            borderRadius: 10,
            border: '1.5px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#64748B',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s'
          }}>
          <X size={15} /> Cancel
        </button>
      </div>

      {/* Form Card */}
      <div style={{
        maxWidth: 860,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 20,
        padding: '28px 32px',
        boxShadow: '0 4px 20px rgba(123,31,162,0.06)',
        border: '1.5px solid #F3E8FF'
      }}>
        <ClassForm
          initial={initial}
          onSave={onSave}
          onCancel={onCancel}
          saveLoading={saveLoading}
        />
      </div>
    </div>
  );
};

// ─── Full Page Detail Layout ──────────────────────────────────────────────────
const FullPageDetail = ({ cls, onClose, onEdit }) => {
  return (
    <div style={{
      minHeight: 'calc(100vh - 100px)',
      background: 'linear-gradient(135deg, #F8F4FF 0%, #F0F9FF 100%)',
      margin: '-24px -16px',
      padding: '24px 16px'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '20px 28px',
        marginBottom: 20,
        boxShadow: '0 4px 20px rgba(123,31,162,0.08)',
        border: '1.5px solid #F3E8FF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#0C2A47,#030B15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Eye size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#030B15' }}>Class Details</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>View and manage class information</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onEdit(cls)}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: '1.5px solid #E9D5FF',
              background: '#FAF5FF',
              color: '#7E22CE',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
            <Pencil size={15} /> Edit
          </button>
          <button onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg,#0C2A47,#030B15)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
            <X size={15} /> Close
          </button>
        </div>
      </div>

      {/* Detail Card */}
      <div style={{
        maxWidth: 860,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 20,
        padding: '28px 32px',
        boxShadow: '0 4px 20px rgba(123,31,162,0.06)',
        border: '1.5px solid #F3E8FF'
      }}>
        <ClassDetail cls={cls} onClose={onClose} onEdit={onEdit} />
      </div>
    </div>
  );
};

// ─── Class Form Component ─────────────────────────────────────────────────────
const ClassForm = ({ initial, onSave, onCancel, saveLoading }) => {
  const [form, setForm] = useState({
    id: initial?.id || null,
    _id: initial?._id || null,
    name: initial?.name || '',
    section: initial?.section || '',
    classType: initial?.classType || 'FIXED_TIME',
    startTime: initial?.startTime || '09:00',
    endTime: initial?.endTime || '12:00',
    days: initial?.days || [],
    level: initial?.level || 0,
    status: initial?.status || 'Active',
    baseFee: initial?.baseFee != null ? initial.baseFee : '',
    monthlyFreeHours: initial?.monthlyFreeHours != null ? initial.monthlyFreeHours : '',
    lateFineApplicable: initial?.lateFineApplicable ?? false,
    feeType: initial?.feeType || 'MONTHLY',
  });

  const typeConfig = CLASS_TYPES[form.classType];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Class Type Selector */}
      <div>
        <label style={LS}>Class Type *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {Object.values(CLASS_TYPES).map(ct => {
            const isSelected = form.classType === ct.id;
            return (
              <button key={ct.id} onClick={() => setForm(f => ({ ...f, classType: ct.id }))}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  cursor: 'pointer',
                  border: `2px solid ${isSelected ? ct.solid : '#E2E8F0'}`,
                  background: isSelected ? ct.bg : '#F8FAFC',
                  color: isSelected ? ct.color : '#64748B',
                  fontWeight: 600,
                  fontSize: 13,
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: isSelected ? `0 4px 14px ${ct.solid}25` : 'none',
                  transform: isSelected ? 'translateY(-1px)' : 'none',
                }}>
                <div style={{ fontWeight: 800, marginBottom: 3 }}>{ct.label}</div>
                <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.4 }}>{ct.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name & Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={LS}>Class Name *</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Nursery, KG, Class 1"
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
        <div>
          <label style={LS}>Section</label>
          <input
            value={form.section}
            onChange={e => setForm(f => ({ ...f, section: e.target.value }))}
            placeholder="e.g., A, B, C"
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
      </div>

      {/* Days Selection — FIXED */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <label style={{ ...LS, marginBottom: 0 }}>Weekly Days</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button"
              onClick={() => setForm(f => ({ ...f, days: WEEK_DAYS.map(d => d.id) }))}
              style={{ fontSize: 11, fontWeight: 700, color: typeConfig.color, background: typeConfig.bg, border: `1px solid ${typeConfig.border}`, borderRadius: 7, padding: '3px 10px', cursor: 'pointer' }}>
              All
            </button>
            <button type="button"
              onClick={() => setForm(f => ({ ...f, days: [] }))}
              style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 7, padding: '3px 10px', cursor: 'pointer' }}>
              None
            </button>
          </div>
        </div>
        <div style={{
          background: '#F8FAFC',
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          padding: '14px 16px',
        }}>
          <DaySelector
            selected={form.days}
            onChange={(days) => setForm(f => ({ ...f, days }))}
            solidColor={typeConfig.solid}
          />
          {form.days.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: typeConfig.solid }} />
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {form.days.length === 7 ? 'All 7 days selected' : `${form.days.length} day${form.days.length > 1 ? 's' : ''} selected: ${formatDays(form.days)}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* FIXED_TIME: Time Fields */}
      {form.classType === 'FIXED_TIME' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={LS}>Start Time *</label>
            <input
              type="time"
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              style={IS}
              onFocus={e => e.target.style.borderColor = '#7B1FA2'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>
          <div>
            <label style={LS}>End Time *</label>
            <input
              type="time"
              value={form.endTime}
              onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              style={IS}
              onFocus={e => e.target.style.borderColor = '#7B1FA2'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>
        </div>
      )}

      {/* Level & Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={LS}>Level (0-100)</label>
          <input
            type="number"
            value={form.level !== 0 ? form.level : ''}
            onChange={e => setForm(f => ({ ...f, level: Math.min(100, Math.max(0, Number(e.target.value))) }))}
            placeholder="Enter level (0-100)"
            min="0"
            max="100"
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
        <div>
          <label style={LS}>Status</label>
          <select
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Fee Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={LS}>Base Fee (₹)</label>
          <input
            type="number"
            value={form.baseFee}
            onChange={e => setForm(f => ({ ...f, baseFee: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
            placeholder="Enter base fee"
            min="0"
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
        <div>
          <label style={LS}>Fee Type</label>
          <select
            value={form.feeType}
            onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))}
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          >
            <option value="MONTHLY">Monthly</option>
            <option value="ONE_TIME">One Time</option>
            <option value="FREE">Free</option>
          </select>
        </div>
      </div>

      {/* Monthly Free Hours & Late Fine */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={LS}>Monthly Free Hours</label>
          <input
            type="number"
            value={form.monthlyFreeHours}
            onChange={e => setForm(f => ({ ...f, monthlyFreeHours: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
            placeholder="Enter free hours"
            min="0"
            style={IS}
            onFocus={e => e.target.style.borderColor = '#7B1FA2'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <label style={{ ...LS, marginBottom: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={form.lateFineApplicable}
              onChange={e => setForm(f => ({ ...f, lateFineApplicable: e.target.checked }))}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            Late Fine Applicable
          </label>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4, paddingTop: 16, borderTop: '1.5px solid #F1F5F9' }}>
        <button onClick={onCancel} disabled={saveLoading}
          style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: saveLoading ? 'not-allowed' : 'pointer', opacity: saveLoading ? 0.5 : 1 }}>
          Cancel
        </button>
        <button onClick={() => onSave(form)} disabled={saveLoading || !form.name}
          style={{ flex: 2, padding: '12px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0C2A47,#030B15)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: (saveLoading || !form.name) ? 'not-allowed' : 'pointer', opacity: saveLoading || !form.name ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 14px rgba(123,31,162,0.30)' }}>
          {saveLoading && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />}
          {initial ? 'Update Class' : 'Create Class'}
        </button>
      </div>
    </div>
  );
};

// ─── Class Detail Component ───────────────────────────────────────────────────
const ClassDetail = ({ cls, onClose, onEdit }) => {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(cls.teacherId || '');
  const [assignLoading, setAssignLoading] = useState(false);
  const [allTeachers, setAllTeachers] = useState([]);

  useEffect(() => { fetchData(); }, [cls.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, teachersRes, allTeachersRes] = await Promise.all([
        getClassStudentsAPI(cls.id).catch(() => ({ data: [] })),
        getClassTeachersAPI(cls.id).catch(() => ({ data: [] })),
        getTeachersAPI({ limit: 1000 }).catch(() => ({ data: [] }))
      ]);
      setStudents(studentsRes.data || []);
      setTeachers(teachersRes.data || []);
      setAllTeachers(allTeachersRes.data || []);
    } catch (err) {
      console.error('Failed to fetch class details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async () => {
    try {
      setAssignLoading(true);
      await assignTeacherAPI(cls._id || cls.id, selectedTeacher || null);
      fetchData();
    } catch (err) {
      console.error('Failed to assign teacher:', err);
      alert(err.response?.data?.error || 'Failed to assign teacher');
    } finally {
      setAssignLoading(false);
    }
  };

  const typeConfig = CLASS_TYPES[cls.classType] || CLASS_TYPES.FIXED_TIME;
  const tc = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Class Info Banner */}
      <div style={{ padding: '20px 22px', background: typeConfig.bg, borderRadius: 16, border: `2px solid ${typeConfig.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: typeConfig.color }}>
              {cls.name} {cls.section && <span style={{ opacity: 0.7 }}>· {cls.section}</span>}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: typeConfig.color, opacity: 0.7 }}>
              {typeConfig.desc}
            </p>
          </div>
          <Badge color={tc}>{typeConfig.label}</Badge>
        </div>

<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
           {cls.classType === 'FIXED_TIME' && cls.startTime && (
             <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
               <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Time</p>
               <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>{fmt12(cls.startTime)}</p>
             </div>
           )}
           {cls.classType === 'FIXED_TIME' && cls.endTime && (
             <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
               <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Time</p>
               <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>{fmt12(cls.endTime)}</p>
             </div>
           )}
           {cls.baseFee > 0 && (
             <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
               <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Fee</p>
               <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>₹{cls.baseFee}</p>
             </div>
           )}
           {cls.monthlyFreeHours > 0 && (
             <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
               <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Free Hours</p>
               <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>{cls.monthlyFreeHours}</p>
             </div>
           )}
           {cls.lateFineApplicable && (
             <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
               <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Late Fine</p>
               <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>Applicable</p>
             </div>
           )}
           <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
             <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Type</p>
             <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>{cls.feeType}</p>
           </div>
           {cls.level !== undefined && cls.level !== null && (
             <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
               <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Level</p>
               <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: '#030B15' }}>{cls.level}</p>
             </div>
           )}
           <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px' }}>
             <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</p>
             <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800, color: cls.status === 'Active' ? '#15803D' : '#E2B94D' }}>{cls.status || 'Active'}</p>
           </div>
           <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 10, padding: '10px 14px', gridColumn: cls.classType !== 'FIXED_TIME' ? '1 / -1' : 'auto' }}>
             <p style={{ margin: 0, fontSize: 10, color: typeConfig.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days</p>
             <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 700, color: '#030B15' }}>{formatDays(cls.days)}</p>
           </div>
         </div>
      </div>

      {/* Teacher Assignment */}
      <div style={{ padding: '18px 20px', background: '#F8FAFC', borderRadius: 14, border: '1.5px solid #E2E8F0' }}>
        <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: '#030B15', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FAF5FF', border: '1.5px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserCheck size={14} color="#7B1FA2" />
          </div>
          Assign Teacher
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}
            style={{ ...IS, flex: 1 }}>
            <option value="">No Teacher Assigned</option>
            {allTeachers.map(t => (
              <option key={t._id || t.id} value={t._id || t.id}>
                {t.name} ({t.employeeId || t.email})
              </option>
            ))}
          </select>
          <button onClick={handleAssignTeacher} disabled={assignLoading}
            style={{
              padding: '10px 18px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg,#0C2A47,#030B15)',
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: assignLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 12px rgba(123,31,162,0.25)'
            }}>
            {assignLoading
              ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
              : <UserCheck size={14} />
            }
            Assign
          </button>
        </div>
        {teachers.length > 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0FDF4', borderRadius: 10, border: '1.5px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={13} color="#15803D" />
            <p style={{ margin: 0, fontSize: 12, color: '#15803D', fontWeight: 700 }}>
              Assigned: {teachers.map(t => t.name).join(', ')}
            </p>
          </div>
        )}
      </div>

      {/* Students List */}
      <div>
        <h4 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: '#030B15', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FAF5FF', border: '1.5px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={14} color="#7B1FA2" />
          </div>
          Students
          <span style={{ marginLeft: 4, padding: '2px 10px', borderRadius: 20, background: '#FAF5FF', color: '#7E22CE', fontSize: 11, fontWeight: 800, border: '1.5px solid #E9D5FF' }}>
            {students.length}
          </span>
        </h4>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, color: '#94A3B8' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #F3E8FF', borderTopColor: '#7B1FA2', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Loading students…</span>
          </div>
        ) : students.length === 0 ? (
          <div style={{ padding: '28px 24px', textAlign: 'center', color: '#94A3B8', fontSize: 13, background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0' }}>
            <Users size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
            No students enrolled yet
          </div>
        ) : (
          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {students.slice(0, 10).map(student => (
              <div key={student._id} style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#0C2A47,#030B15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {student.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#030B15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</p>
                  <p style={{ margin: '1px 0 0', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{student.admissionNo}</p>
                </div>
              </div>
            ))}
            {students.length > 10 && (
              <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, border: '1.5px dashed #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>+{students.length - 10} more</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1.5px solid #F1F5F9' }}>
        <button onClick={() => onEdit(cls)}
          style={{ flex: 1, padding: '11px', borderRadius: 12, border: '1.5px solid #E9D5FF', background: '#FAF5FF', color: '#7E22CE', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Pencil size={14} /> Edit Class
        </button>
        <button onClick={onClose}
          style={{ flex: 1, padding: '11px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0C2A47,#030B15)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(123,31,162,0.25)' }}>
          Close
        </button>
      </div>
    </div>
  );
};

// ─── Class Card Component ─────────────────────────────────────────────────────
const ClassCard = ({ cls, onView, onEdit, onDelete }) => {
  const typeConfig = CLASS_TYPES[cls.classType] || CLASS_TYPES.FIXED_TIME;
  const tc = cls.classType === 'FIXED_TIME' ? 'blue' : cls.classType === 'FLEX_TIME' ? 'teal' : 'amber';

  return (
    <div style={{
      background: '#fff',
      borderRadius: 18,
      border: '1.5px solid #E2E8F0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}
    >
      {/* Color top bar */}
      <div style={{ height: 4, background: typeConfig.solid }} />

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#030B15', lineHeight: 1.3 }}>
              {cls.name}
            </h3>
            {cls.section && (
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Section {cls.section}</span>
            )}
          </div>
          <Badge color={tc}>{typeConfig.label.split('. ')[1]}</Badge>
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {cls.classType === 'FIXED_TIME' && cls.startTime && cls.endTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: T.blue.bg, borderRadius: 9, border: `1px solid ${T.blue.border}` }}>
              <AlarmClock size={13} color={T.blue.text} />
              <span style={{ fontSize: 12, color: T.blue.text, fontWeight: 600 }}>
                {fmt12(cls.startTime)} – {fmt12(cls.endTime)}
              </span>
            </div>
          )}
          {cls.days && cls.days.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#F8FAFC', borderRadius: 9, border: '1px solid #E2E8F0' }}>
              <CalendarDays size={13} color="#64748B" />
              <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{formatDays(cls.days)}</span>
            </div>
          )}
        </div>

        {/* Badges row */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Badge color={cls.status === 'Active' ? 'green' : 'red'}>{cls.status === 'Active' ? '● Active' : '○ Inactive'}</Badge>
          {cls.level !== undefined && cls.level !== null && cls.level > 0 && (
            <Badge color="purple">Level {cls.level}</Badge>
          )}
          {cls.studentCount > 0 && (
            <Badge color="purple">
              <Users size={10} style={{ marginRight: 4 }} />
              {cls.studentCount}
            </Badge>
          )}
          {cls.baseFee > 0 && (
            <Badge color="green">₹{cls.baseFee}</Badge>
          )}
          {cls.lateFineApplicable && (
            <Badge color="amber">Late Fine</Badge>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F1F5F9' }}>
          <IconBtn icon={Eye} color="blue" onClick={() => onView(cls)} title="View Details" />
          <IconBtn icon={Pencil} color="green" onClick={() => onEdit(cls)} title="Edit Class" />
          <div style={{ flex: 1 }} />
          <IconBtn icon={Trash2} color="red" onClick={() => onDelete(cls._id)} title="Delete Class" />
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminClassesPage = () => {
  const [classData, setClassData] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editCls, setEditCls] = useState(null);
  const [viewCls, setViewCls] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
   const [saveLoading, setSaveLoading] = useState(false);
   const saveLockRef = useRef(false);
   const [confirmDeleteCls, setConfirmDeleteCls] = useState(null);
   const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);

  const mapClass = useCallback((c) => ({
    id: c._id || c.id,
    _id: c._id,
    classId: c.classId || null,
    name: c.name || '',
    section: c.section || '',
    classType: c.classType,
    startTime: c.startTime || null,
    endTime: c.endTime || null,
    days: c.days || [],
    level: c.level || 0,
    status: c.status || 'Active',
    teacherId: c.teacherId || null,
    studentCount: c.studentCount || 0,
    createdBy: c.createdBy,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    baseFee: c.baseFee ?? 0,
    monthlyFreeHours: c.monthlyFreeHours ?? 0,
    lateFineApplicable: c.lateFineApplicable ?? false,
    feeType: c.feeType || 'MONTHLY',
  }), []);

  const fetchClasses = useCallback(async () => {
    try {
      setPageLoading(true);
      setError('');
      const params = { page: pagination.page, limit: pagination.limit };
      if (search?.trim()) params.search = search.trim();
      if (typeFilter !== 'all') params.classType = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter === 'Active' ? 'Active' : 'Inactive';
      const res = await getClassesAPI(params);
      setClassData((res.data || []).map(mapClass));
      setPagination(p => ({ ...p, total: res.total || 0, pages: res.pages || 0 }));
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to load classes');
    } finally {
      setPageLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, statusFilter, mapClass]);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  
  useEffect(() => { 
    setPagination(p => p.page !== 1 ? { ...p, page: 1 } : p); 
  }, [search, typeFilter, statusFilter]);

  const handleSave = async (cls) => {
    if (saveLockRef.current || saveLoading) return;
    saveLockRef.current = true;
    setSaveLoading(true);
    setError('');

    try {
      const payload = {
        name: cls.name?.trim(),
        section: cls.section?.trim() || '',
        classType: cls.classType,
        days: cls.days || [],
        level: cls.level !== undefined ? Number(cls.level) : 0,
        status: cls.status || 'Active',
        baseFee: cls.baseFee !== undefined && cls.baseFee !== '' ? Number(cls.baseFee) : 0,
        monthlyFreeHours: cls.monthlyFreeHours !== undefined && cls.monthlyFreeHours !== '' ? Number(cls.monthlyFreeHours) : 0,
        lateFineApplicable: cls.lateFineApplicable || false,
        feeType: cls.feeType || 'MONTHLY',
      };
      
      // Handle startTime and endTime based on classType
      if (cls.classType === 'FIXED_TIME') {
        payload.startTime = cls.startTime || '00:00';
        payload.endTime = cls.endTime || '00:00';
      } else {
        // FLEX_TIME and HOURS_BASED should have null for times
        payload.startTime = null;
        payload.endTime = null;
      }

      // Use _id if available, fallback to id
      const classId = cls._id || cls.id;

      if (classId) {
        // UPDATE existing class
        const res = await updateClassAPI(classId, payload);
        setClassData(p => p.map(c => (c._id === classId || c.id === classId) ? mapClass(res.data) : c));
      } else {
        // CREATE new class
        const res = await createClassAPI(payload);
        setClassData(p => [mapClass(res.data), ...p]);
      }
      setShowAdd(false);
      setEditCls(null);
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to save class');
    } finally {
      setSaveLoading(false);
      saveLockRef.current = false;
    }
  };

   const handleDelete = async (id) => {
     setConfirmDeleteCls(id);
   };

  const executeDelete = async () => {
    if (!confirmDeleteCls) return;
    setConfirmDeleteLoading(true);
    setError('');
    try {
      await deleteClassAPI(confirmDeleteCls);
      setClassData(p => p.filter(c => c._id !== confirmDeleteCls && c.id !== confirmDeleteCls));
      setConfirmDeleteCls(null);
    } catch (e) {
      setError(e.response?.data?.message || e.response?.data?.error || 'Failed to delete class');
    } finally {
      setConfirmDeleteLoading(false);
    }
  };

  const handleEdit = (cls) => { setEditCls(cls); setShowAdd(false); setViewCls(null); };

  const stats = {
    total: pagination.total,
    fixed: classData.filter(c => c.classType === 'FIXED_TIME').length,
    flex: classData.filter(c => c.classType === 'FLEX_TIME').length,
    hoursBased: classData.filter(c => c.classType === 'HOURS_BASED').length,
  };

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .class-input:focus { border-color: #7B1FA2 !important; box-shadow: 0 0 0 3px rgba(123,31,162,0.08); }
      `}</style>

      {/* Full-page views */}
      {showAdd ? (
        <FullPageForm mode="create" onSave={handleSave} onCancel={() => setShowAdd(false)} saveLoading={saveLoading} />
      ) : editCls ? (
        <FullPageForm mode="edit" initial={editCls} onSave={handleSave} onCancel={() => setEditCls(null)} saveLoading={saveLoading} />
      ) : viewCls ? (
        <FullPageDetail cls={viewCls} onClose={() => setViewCls(null)} onEdit={handleEdit} />
      ) : (
        <>
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#030B15' }}>Class Management</h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>Create classes · Assign teachers · Manage schedules</p>
            </div>
            <button onClick={() => { setEditCls(null); setShowAdd(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px',
                background: 'linear-gradient(135deg,#0C2A47,#030B15)',
                color: '#fff', border: 'none', borderRadius: 14,
                fontWeight: 800, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(123,31,162,0.35)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              <Plus size={18} /> Create Class
            </button>
          </div>

          {/* ── Error ── */}
          {error && (
            <div style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 14, padding: '12px 18px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertTriangle size={16} color="#E2B94D" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#E2B94D', flex: 1 }}>{error}</p>
              <button onClick={() => setError('')} style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: '#FECDD3', color: '#E2B94D', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
            </div>
          )}

          {/* ── Stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
            {[
              { label: 'Total Classes', val: stats.total,      icon: BookOpen,   color: '#7B1FA2', bg: 'linear-gradient(135deg,#0C2A47,#030B15)', light: '#FAF5FF', border: '#E9D5FF' },
              { label: 'Fixed Time',    val: stats.fixed,      icon: AlarmClock, color: '#0C2A47', bg: 'linear-gradient(135deg,#0C2A47,#0C2A47)',  light: '#EFF6FF', border: '#BFDBFE' },
              { label: 'Flex Time',     val: stats.flex,       icon: Clock,      color: '#0F766E', bg: 'linear-gradient(135deg,#0D9488,#0F766E)',  light: '#F0FDFA', border: '#99F6E4' },
              { label: 'Hours Based',   val: stats.hoursBased, icon: Hourglass,  color: '#B45309', bg: 'linear-gradient(135deg,#D97706,#B45309)',  light: '#FFFBEB', border: '#FCD34D' },
            ].map(({ label, val, icon: Icon, color, bg, light, border }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 16, padding: '16px 18px', border: `1.5px solid ${border}`, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={22} color="#fff" strokeWidth={2} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 26, fontWeight: 900, color: '#030B15', lineHeight: 1 }}>{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div style={{ background: '#fff', borderRadius: 18, padding: '16px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', border: '1.5px solid #E2E8F0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search classes or sections…"
                style={{ ...IS, paddingLeft: 38 }}
                onFocus={e => e.target.style.borderColor = '#7B1FA2'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ ...IS, width: 'auto', minWidth: 140 }}
              onFocus={e => e.target.style.borderColor = '#7B1FA2'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            >
              <option value="all">All Types</option>
              {Object.values(CLASS_TYPES).map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ ...IS, width: 'auto', minWidth: 130 }}
              onFocus={e => e.target.style.borderColor = '#7B1FA2'}
              onBlur={e => e.target.style.borderColor = '#E2E8F0'}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* ── Grid ── */}
          {pageLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: 14, color: '#94A3B8' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #F3E8FF', borderTopColor: '#7B1FA2', animation: 'spin .8s linear infinite' }} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>Loading classes…</span>
            </div>
          ) : classData.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, padding: '56px 24px', textAlign: 'center', border: '2px dashed #E2E8F0' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: '#FAF5FF', border: '2px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <BookOpen size={28} color="#C4B5FD" />
              </div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#475569' }}>No classes found</p>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: '#94A3B8' }}>Create your first classroom to get started</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
              {classData.map(cls => (
                <ClassCard key={cls.id} cls={cls} onView={setViewCls} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '16px 0' }}>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.4 : 1 }}>
                ← Prev
              </button>
              <span style={{ padding: '8px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#0C2A47,#030B15)', color: '#fff', fontWeight: 800, fontSize: 13 }}>
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                style={{ padding: '8px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer', opacity: pagination.page === pagination.pages ? 0.4 : 1 }}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteCls && (
        <ConfirmModal
          title="Delete Class"
          message="Are you sure you want to delete this class? This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          confirmColor="rose"
          loading={confirmDeleteLoading}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDeleteCls(null)}
        />
      )}
    </div>
  );
};

export default AdminClassesPage;