import { createElement, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Edit2, X, Search,
  CheckCircle, Eye, Calendar, Mail, Phone,
  Briefcase, ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  LayoutGrid, List, UserCheck, UserX, Clock,
  BarChart2, Sunrise, Wallet, GraduationCap, Cake, ClipboardList,
  Gift, Award, Activity, BookOpen, CalendarDays, Plus, Minus,
} from 'lucide-react';
import { teacherService, getTeacherPhotoUrl, getEmployeeAttendanceSummary, getMyProfileAPI } from '../../api/teachers';
import { getClassesAPI } from '../../api/classes';

const CLASS_TYPES = {
  FIXED_TIME:  { id: 'FIXED_TIME',  label: 'Fixed Time',    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  FLEX_TIME:   { id: 'FLEX_TIME',   label: 'Flexible Time', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  HOURS_BASED: { id: 'HOURS_BASED', label: 'Hours Based',   color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
};
const EMPLOYEE_TYPES = {
  FIXED_TIME:  { label: 'Fixed Time',  color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  FIXED_HOURS: { label: 'Fixed Hours', color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
  FLEXIBLE:    { label: 'Flexible',    color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
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

const Avatar = ({ name = 'A', photo, size = 'md' }) => {
  const [from, to] = getPalette(name);
  const dims = { xs: 28, sm: 36, md: 44, lg: 56, xl: 72 }[size] || 44;
  const fs = { xs: 11, sm: 13, md: 16, lg: 20, xl: 26 }[size] || 16;
  const [imgErr, setImgErr] = useState(false);
  const src = photo && !imgErr ? photoUrl(photo) : null;
  return (
    <div style={{ position: 'relative', width: dims, height: dims, minWidth: dims, flexShrink: 0 }}>
      {src ? (
        <img src={src} alt={name} onError={() => setImgErr(true)} style={{ width: dims, height: dims, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${colors.border}` }} />
      ) : (
        <div style={{ width: dims, height: dims, borderRadius: '50%', background: `linear-gradient(135deg, ${from}, ${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: fs, fontFamily: "'DM Sans', sans-serif", boxShadow: `0 0 0 2px ${colors.border}, 0 4px 16px rgba(0,0,0,0.4)` }}>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};

const StatusDot = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig['Inactive'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, letterSpacing: '0.02em' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {status}
    </span>
  );
};

const Btn = ({ children, variant = 'primary', onClick, disabled, loading, icon: Icon, size = 'md', style: sx = {} }) => {
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 10, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: disabled || loading ? 'not-allowed' : 'pointer', border: 'none', transition: 'all 0.18s', opacity: disabled ? 0.5 : 1, fontSize: size === 'sm' ? 12 : 13, padding: size === 'sm' ? '7px 14px' : size === 'lg' ? '13px 24px' : '10px 18px', ...sx };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentHover})`, color: '#fff', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' },
    secondary: { background: colors.card, color: colors.textMuted, border: `1px solid ${colors.border}` },
    danger: { background: 'rgba(239,68,68,0.12)', color: colors.danger, border: `1px solid rgba(239,68,68,0.25)` },
    success: { background: 'rgba(16,185,129,0.12)', color: colors.success, border: `1px solid rgba(16,185,129,0.25)` },
    ghost: { background: 'transparent', color: colors.textMuted },
  };
  return (
    <button onClick={!disabled && !loading ? onClick : undefined} style={{ ...base, ...variants[variant] }}>
      {loading ? <span style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}>⟳</span> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  );
};

const IconBtn = ({ icon: Icon, onClick, title }) => (
  <button onClick={onClick} title={title} style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${colors.border}`, background: colors.card, color: colors.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; e.currentTarget.style.background = colors.accentLight; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.background = colors.card; }}>
    {createElement(Icon, { size: 15, strokeWidth: 2 })}
  </button>
);

const Toast = ({ message, type = 'success', onClose }) => (
  <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: type === 'success' ? 'rgba(16,185,129,0.95)' : type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(99,102,241,0.95)', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'slideUp 0.3s ease', maxWidth: 340 }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    <span style={{ flex: 1 }}>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, opacity: 0.7, display: 'flex' }}><X size={14} /></button>
  </div>
);

const TeacherCard = ({ teacher, onView, onEdit, onStatusChange }) => {
  const empType = EMPLOYEE_TYPES[teacher.employeeType] || EMPLOYEE_TYPES.FIXED_TIME;
  const classCount = teacher.classIds?.length || 0;
  return (
    <div style={{ background: colors.card, borderRadius: 20, border: `1px solid ${colors.border}`, overflow: 'hidden', transition: 'all 0.3s', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accentLight; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }}>
      <div style={{ padding: '20px', display: 'flex', gap: 16, alignItems: 'flex-start', background: '#FAFAFC', borderBottom: `1px solid ${colors.border}` }}>
        <Avatar name={teacher.name} photo={teacher.photo} size="lg" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacher.name}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textDim, fontFamily: 'monospace', fontWeight: 600 }}>{teacher.employeeId}</p>
            </div>
            <select value={teacher.status} onChange={e => onStatusChange(teacher._id, e.target.value)} style={{ padding: '4px 10px', borderRadius: 12, border: `1px solid ${teacher.status === 'Active' ? '#10B981' : teacher.status === 'On Leave' ? '#F59E0B' : '#EF4444'}40`, background: teacher.status === 'Active' ? '#ECFDF5' : teacher.status === 'On Leave' ? '#FFFBEB' : '#FEF2F2', color: teacher.status === 'Active' ? '#10B981' : teacher.status === 'On Leave' ? '#D97706' : '#EF4444', fontSize: 11, fontWeight: 700, outline: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <option value="Active">● Active</option>
              <option value="Inactive">○ Inactive</option>
              <option value="On Leave">◐ On Leave</option>
            </select>
          </div>
        </div>
      </div>
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
          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: empType.bg, color: empType.color, border: `1px solid ${empType.border}` }}>{empType.label}</span>
          {teacher.employeeType === 'FIXED_TIME' && teacher.fixedShift && (
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>{fmt12(teacher.fixedShift.entryTime)} - {fmt12(teacher.fixedShift.exitTime)}</span>
          )}
          {teacher.employeeType === 'FIXED_HOURS' && teacher.fixedHours && (
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>Min: {teacher.fixedHours.minimumHours} hrs/day</span>
          )}
          {teacher.monthlySalary > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>₹{teacher.monthlySalary.toLocaleString('en-IN')}/mo</span>
          )}
          <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, background: '#F1F5F9', padding: '4px 10px', borderRadius: 8, border: `1px solid #E2E8F0` }}>{classCount} Classes</span>
        </div>
        {teacher.subjects && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, padding: '8px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
            <BookOpen size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>{teacher.subjects}</span>
          </div>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${colors.border}`, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', background: '#FAFAFC', marginTop: 'auto' }}>
        <Btn variant="secondary" icon={Eye} onClick={() => onView(teacher)} size="sm" style={{ flex: 1, padding: '8px', border: '1px solid #E2E8F0' }}>View</Btn>
        <Btn variant="secondary" icon={Edit2} onClick={() => onEdit(teacher)} size="sm" style={{ flex: 1, padding: '8px', border: '1px solid #E2E8F0' }}>Edit</Btn>
      </div>
    </div>
  );
};

const NoPermissionView = ({ navigate }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg, padding: 24 }}>
    <div style={{ textAlign: 'center', maxWidth: 420, padding: 40, background: colors.card, borderRadius: 24, border: `1px solid ${colors.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
        <AlertCircle size={32} color={colors.danger} />
      </div>
      <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: colors.text }}>Access Denied</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: colors.textMuted, lineHeight: 1.6 }}>You do not have permission to manage employees. Contact your administrator to get access.</p>
      <button onClick={() => navigate('/teacher')} style={{ padding: '10px 20px', borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.card, color: colors.textMuted, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Go to Dashboard</button>
    </div>
  </div>
);

export default function TeacherManageEmployeesPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [allTeachersForStats, setAllTeachersForStats] = useState([]);
  const [statFilter, setStatFilter] = useState('all');
  const [hasPermission, setHasPermission] = useState(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const LIMIT = 12;

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
      employeeType: teacher.employeeType || 'FIXED_TIME',
      monthlySalary: teacher.monthlySalary || 0,
      extraHourlyRate: teacher.extraHourlyRate || 0,
      holidayCalendar: teacher.holidayCalendar || 'TEACHING',
      fixedShift: teacher.fixedShift || { entryTime: '09:00', exitTime: '17:00', gracePeriodMinutes: 15, halfDayThresholdHours: 3, extraHoursPayment: false },
      fixedHours: teacher.fixedHours || { minimumHours: 2, halfDayThresholdHours: 1, extraHoursPayment: false },
    };
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyProfileAPI();
        const canManage = profile?.data?.permissions?.canManageEmployees;
        if (canManage === false) {
          setHasPermission(false);
        } else {
          setHasPermission(true);
        }
      } catch {
        setHasPermission(true);
      } finally {
        setPermissionLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const fetchClasses = async () => {
      setClassesLoading(true);
      try {
        const res = await getClassesAPI({ limit: 100 });
        const rawClasses = res?.data?.data || res?.data || [];
        const mapped = (Array.isArray(rawClasses) ? rawClasses : []).map(c => ({ id: c._id || c.id, _id: c._id || c.id, name: c.name || '', section: c.section || '', classType: c.classType, startTime: c.startTime || null, endTime: c.endTime || null, days: c.days || [], level: c.level || 0, status: c.status || 'Active' }));
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
      setPageLoading(false);
    }
  }, [search, statusFilter, page, mapBackendToFrontend]);

  useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setPage(1); }, [search, statusFilter]);

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

  const handleStatusChange = async (teacherId, newStatus) => {
    try {
      await teacherService.updateBasic(teacherId, { status: newStatus });
      setTeachers(prev => prev.map(t => t._id === teacherId ? { ...t, status: newStatus } : t));
      showToast('Employee status updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to update status';
      showToast(msg, 'error');
    }
  };

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

  // const statCards = [
  //   { id: 'all', label: 'Total Employee', value: computedStats.total, icon: Users, color: colors.accent, bg: colors.accentLight },
  //   { id: 'absent', label: 'Absent Today', value: computedStats.absent, icon: UserX, color: colors.danger, bg: 'rgba(239,68,68,0.12)' },
  //   { id: 'present', label: 'Present Today', value: computedStats.present, icon: UserCheck, color: colors.success, bg: 'rgba(16,185,129,0.12)' },
  //   { id: 'late', label: 'Total Late', value: computedStats.late, icon: Clock, color: colors.warning, bg: 'rgba(245,158,11,0.12)' },
  // ];

  if (permissionLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: colors.bg }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block', fontSize: 24 }}>⟳</span>
      </div>
    );
  }

  if (hasPermission === false) {
    return <NoPermissionView navigate={navigate} />;
  }

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
          background: ${colors.pageGlow}, linear-gradient(180deg, #fbfcfe 0%, ${colors.bg} 100%);
        }
        .teachers-shell { padding: 28px 28px 60px; }
        .teachers-hero { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.8fr); gap: 18px; margin-bottom: 24px; }
        .teachers-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 24px; }
        .teachers-grid-view { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        @media (max-width: 1100px) { .teachers-hero, .teachers-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 900px) { .teachers-shell { padding: 22px 16px 36px; } .teachers-hero, .teachers-stats-grid, .teachers-form-grid, .teachers-form-grid-wide { grid-template-columns: 1fr; } }
        @media (max-width: 720px) { .teachers-grid-view { grid-template-columns: 1fr; } .teachers-toolbar-wrap { flex-direction: column; align-items: stretch !important; } .teachers-toolbar-actions { width: 100%; margin-left: 0 !important; justify-content: flex-start; } }
      `}</style>

      <div className="teachers-page" style={{ color: colors.text }}>
        <div className="teachers-shell">
          {error && (
            <div style={{ background: '#FFF1F2', border: '1.5px solid #FECDD3', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ color: '#E11D48', fontSize: 18 }}>⚠️</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#BE123C', flex: 1 }}>{error}</p>
              <button onClick={() => setError('')} style={{ border: 'none', background: '#FECDD3', color: '#BE123C', borderRadius: 7, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          )}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: colors.textMuted }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-flex' }}>⟳</span>
              <span style={{ fontSize: 14 }}>Loading employees…</span>
            </div>
          )}

          <div className="teachers-hero">
            <div style={{ background: colors.hero, borderRadius: 24, padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 50px rgba(17,24,39,0.16)' }}>
              <div style={{ position: 'absolute', top: -30, right: -24, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ position: 'absolute', bottom: -50, left: -12, width: 170, height: 170, borderRadius: '50%', background: 'rgba(249,115,22,0.18)' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.14)', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  <Briefcase size={14} /> Manage Employees
                </div>
                <h1 style={{ margin: '16px 0 8px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em' }}>Employee Management</h1>
                <p style={{ margin: 0, maxWidth: 560, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)' }}>
                  View and manage employee profiles, employment details, and status.
                </p>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
                  <Btn variant="secondary" icon={RefreshCw} onClick={fetchTeachers} loading={loading} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)' }}>Refresh</Btn>
                  <Btn icon={UserPlus} onClick={() => navigate('/teacher/manage-employees/add')} style={{ boxShadow: '0 10px 26px rgba(232,93,42,0.32)' }}>Add Employee</Btn>
                </div>
              </div>
            </div>
          </div>

            {/* <div className="teachers-stats-grid">
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
                    <p style={{ margin: 0, fontSize: 11, color: statFilter === id ? color : colors.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                    <p style={{ margin: '3px 0 0', fontSize: 24, fontWeight: 800, color: colors.text, lineHeight: 1 }}>{loading ? '—' : value}</p>
                  </div>
                </div>
              ))}
            </div> */}

          <div className="teachers-toolbar-wrap" style={{ background: colors.card, borderRadius: 20, border: `1px solid ${colors.border}`, padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 12px 28px rgba(15,23,42,0.05)' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: colors.textDim, pointerEvents: 'none' }} />
              <input type="text" placeholder="Search name, email, employee ID…" value={searchInput} onChange={e => setSearchInput(e.target.value)} style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = colors.accent} onBlur={e => e.target.style.borderColor = colors.border} />
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

          {!loading && viewMode === 'grid' && (
            <div className="teachers-grid-view">
              {displayedTeachers.map(t => (
                <TeacherCard key={t._id} teacher={t} onView={t => navigate(`/teacher/manage-employees/view/${t._id}`)} onEdit={t => navigate(`/teacher/manage-employees/edit/${t._id}`)} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}

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
                  <div key={t._id} style={{ display: 'grid', gridTemplateColumns: '44px 1.6fr 1.3fr 0.9fr 1.3fr 1fr 0.9fr auto', gap: 10, padding: '14px 20px', alignItems: 'center', borderBottom: i < displayedTeachers.length - 1 ? `1px solid ${colors.border}` : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = colors.cardHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Avatar name={t.name} photo={t.photo} size="sm" />
                    <div><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: colors.text }}>{t.name}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: colors.textDim, fontFamily: 'monospace' }}>{t.employeeId}</p></div>
                    <div><p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>{truncateEmail(t.email || t.userId?.email || '—')}</p><p style={{ margin: '2px 0 0', fontSize: 12, color: colors.textDim }}>{t.phone || '—'}</p></div>
                    <StatusDot status={t.status} />
                    <div><p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: EMPLOYEE_TYPES[t.employeeType]?.color || colors.text }}>{EMPLOYEE_TYPES[t.employeeType]?.label || 'Fixed Time'}</p><p style={{ margin: '2px 0 0', fontSize: 11, color: colors.textDim }}>{t.employeeType === 'FIXED_TIME' ? `${fmt12(t.fixedShift?.entryTime)} - ${fmt12(t.fixedShift?.exitTime)}` : t.employeeType === 'FIXED_HOURS' ? `Min ${t.fixedHours?.minimumHours || 0} hrs/day` : 'Flexible Hours'}</p></div>
                    <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={classNames}>{classNames || '—'}</span>
                    <span style={{ fontSize: 12, color: colors.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subjects || '—'}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <IconBtn icon={Eye} onClick={() => navigate(`/teacher/manage-employees/view/${t._id}`)} title="View" />
                      <IconBtn icon={Edit2} onClick={() => navigate(`/teacher/manage-employees/edit/${t._id}`)} title="Edit" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && displayedTeachers.length === 0 && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: colors.textMuted }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: colors.card, border: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Users size={30} style={{ color: colors.textDim }} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: colors.text }}>No employees found</h3>
              <p style={{ margin: 0, fontSize: 13 }}>Try adjusting your search filters or add a new employee</p>
              <Btn icon={UserPlus} onClick={() => navigate('/teacher/manage-employees/add')} style={{ marginTop: 20 }}>Add First Employee</Btn>
            </div>
          )}

          {!loading && statFilter === 'all' && pages > 1 && (
            <div className="teachers-pagination-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, padding: '16px 20px', background: colors.card, borderRadius: 18, border: `1px solid ${colors.border}`, boxShadow: '0 12px 28px rgba(15,23,42,0.05)' }}>
              <span style={{ fontSize: 12, color: colors.textMuted }}>Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total} employees</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Btn variant="secondary" icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} size="sm">Prev</Btn>
                <div style={{ display: 'flex', gap: 5 }}>
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const p = i + 1;
                    return (
                      <button key={p} onClick={() => setPage(p)} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${page === p ? colors.accent : colors.border}`, background: page === p ? colors.accentLight : colors.surface, color: page === p ? colors.accent : colors.textMuted, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>{p}</button>
                    );
                  })}
                </div>
                <Btn variant="secondary" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} size="sm">Next <ChevronRight size={14} /></Btn>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </>
  );
}
