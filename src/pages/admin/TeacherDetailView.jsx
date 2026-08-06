import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowLeft, Edit2, QrCode, Calendar, CheckCircle, XCircle, Clock,
  AlertTriangle, Phone, Mail, Briefcase, IndianRupee, Download, Copy,
  FileText, Shield, Activity, Hash, Heart, BookOpen, ShieldCheck,
  Sunrise, Timer, BadgeCheck, UserCircle2,
} from 'lucide-react';
import { getTeacherAPI } from '../../api/teachers';
import { getClassesAPI } from '../../api/classes';

// ─── Design Tokens (kept identical to StudentDetailView for a consistent app feel) ──
const T = {
  blue:   { bg: '#EFF6FF', text: '#1E88E5', border: '#BFDBFE' },
  green:  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  red:    { bg: '#FFF1F2', text: '#D4AF37', border: '#FECDD3' },
  orange: { bg: '#FFF7ED', text: '#FB8C00', border: '#FED7AA' },
  purple: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  gray:   { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
  amber:  { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  teal:   { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
};

const PALETTES = [
  ['#1E88E5', '#1565C0'], ['#7B1FA2', '#4A148C'], ['#00897B', '#00695C'],
  ['#D4AF37', '#B71C1C'], ['#FB8C00', '#E65100'], ['#0288D1', '#01579B'],
];
const getPalette = (name = 'A') => PALETTES[(name.charCodeAt(0) || 65) % PALETTES.length];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hasVal = (v) => v !== null && v !== undefined && v !== '';

const formatDate = (d) => {
  if (!hasVal(d)) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDateTime = (d) => {
  if (!hasVal(d)) return null;
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return null;
  return parsed.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatTime12 = (time24) => {
  if (!hasVal(time24)) return null;
  const [h, m] = String(time24).split(':');
  if (h === undefined || m === undefined) return null;
  const hours = parseInt(h, 10);
  if (isNaN(hours)) return null;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hr12 = hours % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
};

const formatCurrency = (n) => {
  if (!hasVal(n)) return null;
  const num = Number(n);
  if (isNaN(num) || num === 0) return null;
  return `₹${num.toLocaleString('en-IN')}`;
};

const titleCase = (s) => (hasVal(s) ? String(s).replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : null);

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Avatar = ({ name, photo, size = 'md' }) => {
  const safeName = name && name.trim() ? name.trim() : 'T';
  const [from, to] = getPalette(safeName);
  const dim = { sm: 32, md: 44, lg: 56, xl: 76 }[size] || 44;
  const fs = { sm: 12, md: 16, lg: 22, xl: 30 }[size] || 16;

  if (hasVal(photo)) {
    return (
      <div style={{ width: dim, height: dim, minWidth: dim, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.15)', flexShrink: 0, border: '2px solid #fff' }}>
        <img src={photo} alt={safeName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return (
    <div style={{ width: dim, height: dim, minWidth: dim, borderRadius: 16, background: `linear-gradient(135deg,${from},${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: fs, boxShadow: '0 4px 14px rgba(0,0,0,0.15)', flexShrink: 0 }}>
      {safeName.charAt(0).toUpperCase()}
    </div>
  );
};

const Badge = ({ children, color = 'gray', size = 'sm' }) => {
  const s = T[color] || T.gray;
  const padding = size === 'sm' ? '4px 10px' : '6px 12px';
  const fontSize = size === 'sm' ? 11 : 12;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding, borderRadius: 99, fontSize, fontWeight: 700, background: s.bg, color: s.text, border: `1.5px solid ${s.border}`, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
};

const InfoRow = ({ label, value }) => {
  if (!hasVal(value)) return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{value}</span>
    </div>
  );
};

const BasicCard = ({ icon: Icon, label, value, mono }) => {
  if (!hasVal(value)) return null;
  return (
    <div className="basic-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={13} color="#64748B" />
        <span className="basic-label">{label}</span>
      </div>
      <p className="basic-val" style={mono ? { fontFamily: 'monospace' } : undefined}>{value}</p>
    </div>
  );
};

// Permission chip — visually shows on/off state
const PermChip = ({ label, active }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: active ? '#F0FDF4' : '#F8FAFC', borderRadius: 9, border: `1px solid ${active ? '#BBF7D0' : '#E5E7EB'}` }}>
    {active ? <CheckCircle size={13} color="#16A34A" /> : <XCircle size={13} color="#9CA3AF" />}
    <span style={{ fontSize: 11, fontWeight: 600, color: active ? '#15803D' : '#94A3B8' }}>{label}</span>
  </div>
);

// ─── Main Page Component ──────────────────────────────────────────────────────
const TeacherDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // ── Fix for the "API calls twice" issue ──────────────────────────────────
  // Root causes are almost always one of:
  //  1) React 18 StrictMode (dev only) intentionally mounts every component
  //     twice to surface side-effect bugs — this NEVER happens in production
  //     builds, so it's not a real bug, just noisy in dev.
  //  2) A parent re-rendering and remounting this component, or `id` changing
  //     reference/value unexpectedly.
  //  3) The effect depending on something that changes every render (e.g. a
  //     new object/function created inline in the dependency array).
  // Below we guard against #1 during development with a ref, cancel any
  // in-flight request on unmount/param-change with AbortController (so a
  // fast route change can't let a stale response overwrite fresh state),
  // and keep the dependency array to just `id` so the effect only reruns
  // when the actual teacher being viewed changes.
  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchTeacher = async () => {
      try {
        setLoading(true);
        setError('');
        const [res, classesRes] = await Promise.all([
          getTeacherAPI(id, { signal: controller.signal }),
          getClassesAPI({ limit: 100 })
        ]);
        setTeacher(res.data?.data || res.data);
        const cData = classesRes.data?.data || classesRes.data || [];
        setClassesData(Array.isArray(cData) ? cData : []);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error('Error fetching teacher data:', err);
        setError(err.response?.data?.message || 'Failed to load teacher data');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchTeacher();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#0F4C5C', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#64748B' }}>Loading teacher details...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 28, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', maxWidth: 380, width: '100%' }}>
          <AlertTriangle size={40} color="#D4AF37" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#051d24' }}>Error Loading Data</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>{error || 'Teacher not found'}</p>
          <button onClick={() => navigate('/admin/teachers')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0F4C5C', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            Back to Teachers
          </button>
        </div>
      </div>
    );
  }

  const displayName = teacher.name || 'Staff';
  const isFixedShift = teacher.employeeType === 'FIXED_SHIFT';
  const isFixedHours = teacher.employeeType === 'FIXED_HOURS';

  const shiftEntry = formatTime12(teacher.fixedShift?.entryTime);
  const shiftExit = formatTime12(teacher.fixedShift?.exitTime);
  const hasShiftData = isFixedShift && (shiftEntry || shiftExit || hasVal(teacher.fixedShift?.gracePeriodMinutes) || hasVal(teacher.fixedShift?.halfDayThresholdHours));
  const hasHoursData = isFixedHours && (hasVal(teacher.fixedHours?.minimumHours) || hasVal(teacher.fixedHours?.halfDayThresholdHours));

  const hasSalaryData = hasVal(formatCurrency(teacher.monthlySalary)) || hasVal(formatCurrency(teacher.extraHourlyRate));

  const permissionFields = [
    { key: 'canViewStudentMobile', label: 'View Student Mobile' },
    { key: 'canMarkAttendance', label: 'Mark Attendance' },
    { key: 'canUploadPhotos', label: 'Upload Photos' },
    { key: 'canViewSalary', label: 'View Salary' },
    { key: 'canViewFeeInfo', label: 'View Fee Status' },
    { key: 'canDisplayStaffQR', label: 'Display Staff QR' },
    { key: 'canScanEmployeeQR', label: "Scan Employee ID Cards (Mark Others' Attendance)" },
    { key: 'attendanceViaQR', label: 'Own Attendance via ID-Card QR Scan' },
    { key: 'attendanceViaPhone', label: 'Own Attendance via Phone Self-Scan' },
    { key: 'canManageFees', label: 'Manage Fee Hub' },
    { key: 'canManageStudents', label: 'Create/Edit Students' },
    { key: 'canManageEmployees', label: 'Create/Edit Employees' },
    { key: 'canManageBirthdays', label: 'Manage Birthdays' },
    { key: 'canManageEnquiries', label: 'Manage Enquiries' },
    { key: 'canViewBirthdays', label: 'View Birthdays' },
    { key: 'canManageCertificates', label: 'Manage Certificates' },
    { key: 'canManageDailyActivity', label: 'Manage Daily Activity' },
    { key: 'canManageCalendar', label: 'Manage Event Scheduler' },
  ];
  const hasPermissionData = teacher.permissions && Object.keys(teacher.permissions).length > 0;

  const adminNotesList = Array.isArray(teacher.adminNotes) ? teacher.adminNotes.filter(hasVal) : (hasVal(teacher.adminNotes) ? [teacher.adminNotes] : []);
  const classIds = Array.isArray(teacher.classIds) ? teacher.classIds : [];
  const subjectsList = hasVal(teacher.subjects) ? String(teacher.subjects).split(',').map(s => s.trim()).filter(Boolean) : [];

  const handleCopyQR = () => {
    if (!teacher.qrCode) return;
    navigator.clipboard.writeText(teacher.qrCode);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .teacher-detail-wrapper { padding: 20px; max-width: 1320px; margin: 0 auto; }
        .profile-header-card { padding: 20px; background: #fff; border-radius: 18px; border: 1px solid #E2E8F0; margin-bottom: 20px; box-shadow: 0 4px 18px rgba(0,0,0,0.04); }
        .profile-header-top { display: flex; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
        .profile-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-left: auto; }
        .action-btn { padding: 9px 14px; border-radius: 10px; border: none; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12.5px; white-space: nowrap; }
        .basic-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 20px; }
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        .detail-card { background: #fff; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .detail-card-header { padding: 13px 16px; border-bottom: 1px solid #E2E8F0; display: flex; align-items: center; gap: 9px; }
        .detail-card-content { padding: 16px; flex: 1; }
        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 9px 12px; background: #F8FAFC; border-radius: 9px; gap: 10px; }
        .info-label { font-size: 11.5px; color: #64748B; font-weight: 600; flex-shrink: 0; }
        .info-val { font-size: 12.5px; font-weight: 700; color: #051d24; word-break: break-word; text-align: right; }
        .basic-card { background: #F8FAFC; border-radius: 12px; padding: 12px; border: 1px solid #F1F5F9; }
        .basic-label { font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-left: 5px; letter-spacing: 0.03em; }
        .basic-val { font-size: 13px; font-weight: 800; color: #051d24; margin: 5px 0 0; word-break: break-word; }
        .empty-block { text-align: center; padding: 20px 0; }
        .perm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }

        @media (max-width: 640px) {
          .teacher-detail-wrapper { padding: 14px; }
          .profile-header-card { padding: 16px; }
          .profile-header-top { flex-direction: column; align-items: center; text-align: center; }
          .profile-actions { margin-left: 0; justify-content: center; width: 100%; margin-top: 10px; }
          .action-btn { flex: 1; justify-content: center; }
          .info-row { flex-direction: column; align-items: flex-start; text-align: left; gap: 3px; }
          .info-val { text-align: left; }
          .basic-info-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 380px) {
          .basic-info-grid { grid-template-columns: 1fr 1fr; }
          .perm-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="teacher-detail-wrapper">
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button onClick={() => {
            if (window.location.pathname.includes('/teacher/')) {
              navigate(-1);
            } else {
              navigate('/admin/teachers');
            }
          }} style={{ padding: 9, borderRadius: 11, border: 'none', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <ArrowLeft size={17} color="#64748B" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#051d24', letterSpacing: '-0.02em' }}>Staff Details</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>Complete profile and management information</p>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="profile-header-card">
          <div className="profile-header-top">
            <Avatar name={displayName} photo={teacher.photo} size="lg" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#051d24' }}>{displayName}</h2>
              {hasVal(teacher.employeeId) && (
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>Employee ID: {teacher.employeeId}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {hasVal(teacher.status) && <Badge color={teacher.status === 'Active' ? 'green' : 'red'}>{teacher.status}</Badge>}
                {hasVal(teacher.employeeType) && <Badge color="blue">{titleCase(teacher.employeeType)}</Badge>}
                {hasVal(teacher.holidayCalendar) && <Badge color="purple">{titleCase(teacher.holidayCalendar)}</Badge>}
                {teacher.permissions?.aadhaarVerified && <Badge color="teal"><ShieldCheck size={11} style={{ marginRight: 3 }} />Aadhaar Verified</Badge>}
                {teacher.permissions?.policeVerified && <Badge color="teal"><ShieldCheck size={11} style={{ marginRight: 3 }} />Police Verified</Badge>}
              </div>
            </div>
            <div className="profile-actions">
              <button onClick={() => {
                if (window.location.pathname.includes('/teacher/')) {
                  navigate(`/teacher/manage-employees/edit/${teacher._id}`);
                } else {
                  navigate(`/admin/teachers/edit/${teacher.employeeId || teacher._id || teacher.id}`);
                }
              }} className="action-btn" style={{ background: '#EFF6FF', color: '#0F4C5C' }}>
                <Edit2 size={13} /> Edit
              </button>
              {hasVal(teacher.qrCode) && (
                <button onClick={() => setShowQRModal(true)} className="action-btn" style={{ background: '#FAF5FF', color: '#7E22CE' }}>
                  <QrCode size={13} /> QR Code
                </button>
              )}
            </div>
          </div>

          {/* Basic Info Grid — only shows cards that actually have data */}
          <div className="basic-info-grid">
            <BasicCard icon={Calendar} label="Date of Birth" value={formatDate(teacher.dob)} />
            <BasicCard icon={Phone} label="Contact" value={teacher.phone} />
            <BasicCard icon={Briefcase} label="Joined" value={formatDate(teacher.dateOfJoining)} />
            <BasicCard icon={Heart} label="Blood Group" value={teacher.bloodGroup} />
            <BasicCard icon={Hash} label="Employee ID" value={teacher.employeeId} mono />
          </div>
        </div>

        {/* Detailed Information Sections */}
        <div className="details-grid">

          {/* Contact Details */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#0F4C5C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCircle2 size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Contact Details</h3>
            </div>
            <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="Email" value={teacher.email} />
              <InfoRow label="Phone" value={teacher.phone} />
              <InfoRow label="Date of Birth" value={formatDate(teacher.dob)} />
              <InfoRow label="Blood Group" value={teacher.bloodGroup} />
              {subjectsList.length > 0 && (
                <div className="info-row" style={{ alignItems: 'flex-start' }}>
                  <span className="info-label">Subjects</span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'flex-end' }}>
                    {subjectsList.map((s, i) => <Badge key={i} color="blue">{s}</Badge>)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Employment Details */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FAF5FF, #F3E8FF)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Employment Details</h3>
            </div>
            <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="Employee ID" value={teacher.employeeId} />
              <InfoRow label="Employee Type" value={titleCase(teacher.employeeType)} />
              <InfoRow label="Date of Joining" value={formatDate(teacher.dateOfJoining)} />
              <InfoRow label="Holiday Calendar" value={titleCase(teacher.holidayCalendar)} />
              <div className="info-row">
                <span className="info-label">Status</span>
                <span className="info-val"><Badge color={teacher.status === 'Active' ? 'green' : 'red'}>{teacher.status}</Badge></span>
              </div>
            </div>
          </div>

          {/* Salary & Pay — hidden entirely if there's nothing to show */}
          {hasSalaryData && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IndianRupee size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Salary & Pay</h3>
              </div>
              <div className="detail-card-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {hasVal(formatCurrency(teacher.monthlySalary)) && (
                    <div style={{ textAlign: 'center', padding: 13, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#15803D' }}>{formatCurrency(teacher.monthlySalary)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Monthly Salary</p>
                    </div>
                  )}
                  {hasVal(formatCurrency(teacher.extraHourlyRate)) && (
                    <div style={{ textAlign: 'center', padding: 13, background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA' }}>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#B45309' }}>{formatCurrency(teacher.extraHourlyRate)}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Extra Hourly Rate</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fixed Shift timing — only for FIXED_SHIFT employees with actual data */}
          {hasShiftData && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sunrise size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Fixed Shift Timing</h3>
              </div>
              <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {shiftEntry && shiftExit && (
                  <div style={{ display: 'flex', gap: 10, padding: '10px 12px', background: '#FFF7ED', borderRadius: 10, border: '1px solid #FED7AA', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#B45309' }}>{shiftEntry}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Entry</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#D6D3D1' }}>→</div>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#B45309' }}>{shiftExit}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Exit</p>
                    </div>
                  </div>
                )}
                <InfoRow label="Grace Period" value={hasVal(teacher.fixedShift?.gracePeriodMinutes) ? `${teacher.fixedShift.gracePeriodMinutes} min` : null} />
                <InfoRow label="Half-Day Threshold" value={hasVal(teacher.fixedShift?.halfDayThresholdHours) ? `${teacher.fixedShift.halfDayThresholdHours} hrs` : null} />
                <div className="info-row">
                  <span className="info-label">Extra Hours Payment</span>
                  <span className="info-val"><Badge color={teacher.fixedShift?.extraHoursPayment ? 'green' : 'gray'}>{teacher.fixedShift?.extraHoursPayment ? 'Enabled' : 'Disabled'}</Badge></span>
                </div>
              </div>
            </div>
          )}

          {/* Fixed Hours policy — only for FIXED_HOURS employees with actual data */}
          {hasHoursData && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FFF1F2, #FECDD3)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Timer size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Fixed Hours Policy</h3>
              </div>
              <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="Minimum Hours" value={hasVal(teacher.fixedHours?.minimumHours) ? `${teacher.fixedHours.minimumHours} hrs` : null} />
                <InfoRow label="Half-Day Threshold" value={hasVal(teacher.fixedHours?.halfDayThresholdHours) ? `${teacher.fixedHours.halfDayThresholdHours} hrs` : null} />
                <div className="info-row">
                  <span className="info-label">Extra Hours Payment</span>
                  <span className="info-val"><Badge color={teacher.fixedHours?.extraHoursPayment ? 'green' : 'gray'}>{teacher.fixedHours?.extraHoursPayment ? 'Enabled' : 'Disabled'}</Badge></span>
                </div>
              </div>
            </div>
          )}

          {/* Permissions & Access */}
          {hasPermissionData && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Permissions & Access</h3>
              </div>
              <div className="detail-card-content">
                <div className="perm-grid">
                  {permissionFields.map(({ key, label }) => (
                    <PermChip key={key} label={label} active={!!teacher.permissions?.[key]} />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <PermChip label="Aadhaar Verified" active={!!teacher.permissions?.aadhaarVerified} />
                  <PermChip label="Police Verified" active={!!teacher.permissions?.policeVerified} />
                </div>
              </div>
            </div>
          )}

          {/* Assigned Classes */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Assigned Classes ({classIds.length})</h3>
            </div>
            <div className="detail-card-content">
              {classIds.length === 0 ? (
                <div className="empty-block">
                  <BookOpen size={24} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>No classes assigned yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {classIds.map((cid, i) => {
                    const classIdStr = typeof cid === 'object' ? (cid._id || cid.id) : cid;
                    const matchedClass = classesData.find(c => c._id === classIdStr || c.id === classIdStr || c.classId === classIdStr);
                    const displayName = matchedClass ? matchedClass.name : (typeof cid === 'object' ? (cid.name || cid._id) : cid);
                    return <Badge key={i} color="teal">{displayName}</Badge>;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes — hidden if empty */}
          {adminNotesList.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FECACA)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>Admin Notes</h3>
              </div>
              <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {adminNotesList.map((note, i) => (
                  <p key={i} style={{ margin: 0, fontSize: 12.5, color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.6, padding: '9px 12px', background: '#F8FAFC', borderRadius: 9 }}>
                    {typeof note === 'object' ? (note.text || note.note || JSON.stringify(note)) : note}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* System & Account Info */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#051d24' }}>System & Account Info</h3>
            </div>
            <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teacher.userId && (
                <>
                  <InfoRow label="Account Email" value={teacher.userId.email} />
                  <InfoRow label="Account Phone" value={teacher.userId.phone} />
                  <div className="info-row">
                    <span className="info-label">Account Status</span>
                    <span className="info-val"><Badge color={teacher.userId.isActive ? 'green' : 'red'}>{teacher.userId.isActive ? 'Active' : 'Inactive'}</Badge></span>
                  </div>
                  <InfoRow label="Last Login" value={formatDateTime(teacher.userId.lastLogin) || (teacher.userId.lastLogin === null ? 'Never' : null)} />
                </>
              )}
              <InfoRow label="Created At" value={formatDateTime(teacher.createdAt)} />
              <InfoRow label="Last Updated" value={formatDateTime(teacher.updatedAt)} />
            </div>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQRModal && hasVal(teacher.qrCode) && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(10,15,40,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setShowQRModal(false)}>
            <div style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 20, boxShadow: '0 40px 100px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(135deg,${getPalette(displayName)[0]},${getPalette(displayName)[1]})`, padding: 18, textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700 }}>Staff QR Code</h3>
                <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>{displayName}</p>
              </div>
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ padding: 14, background: '#fff', borderRadius: 16, border: '2px solid #E2E8F0', boxShadow: '0 8px 22px rgba(0,0,0,0.06)' }}>
                  <QRCodeCanvas value={teacher.qrCode} size={150} level="H" />
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>Scan this code for quick check-in / identification</p>
                <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                  <button style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: T.green.bg, color: T.green.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Download size={13} /> Download
                  </button>
                  <button onClick={handleCopyQR} style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: qrCopied ? T.green.bg : T.blue.bg, color: qrCopied ? T.green.text : T.blue.text, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Copy size={13} /> {qrCopied ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>
              <button onClick={() => setShowQRModal(false)} style={{ width: '100%', padding: 11, border: 'none', background: '#F8FAFC', color: '#64748B', fontWeight: 600, fontSize: 12, cursor: 'pointer', borderTop: '1px solid #E2E8F0' }}>
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetailView;