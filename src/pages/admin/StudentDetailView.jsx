import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowLeft, Edit2, QrCode, Calendar, CheckCircle, XCircle, Clock,
  Users, AlertTriangle, Phone, MapPin, Baby, GraduationCap, DollarSign,
  Download, Copy, FileText, Shield, Star, Activity, Hash, Heart, BookOpen,
} from 'lucide-react';
import { getStudentAPI } from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import FeeManagement from './fee/FeeManagement';

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  blue:   { bg: '#EFF6FF', text: '#1E88E5', border: '#BFDBFE' },
  green:  { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  red:    { bg: '#FFF1F2', text: '#E2B94D', border: '#FECDD3' },
  orange: { bg: '#FFF7ED', text: '#FB8C00', border: '#FED7AA' },
  purple: { bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  gray:   { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' },
  amber:  { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  teal:   { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
};

const PALETTES = [
  ['#1E88E5', '#1565C0'], ['#7B1FA2', '#4A148C'], ['#00897B', '#00695C'],
  ['#E2B94D', '#B71C1C'], ['#FB8C00', '#E65100'], ['#0288D1', '#01579B'],
];
const getPalette = (name = 'A') => PALETTES[(name.charCodeAt(0) || 65) % PALETTES.length];

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Treat null / undefined / empty-string as "no data" — numbers (incl. 0) count as real data.
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

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Avatar = ({ name, size = 'md' }) => {
  const safeName = name && name.trim() ? name.trim() : 'S';
  const [from, to] = getPalette(safeName);
  const dim = { sm: 32, md: 44, lg: 56, xl: 76 }[size] || 44;
  const fs = { sm: 12, md: 16, lg: 22, xl: 30 }[size] || 16;
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

// Info row that renders nothing if the value is missing/empty
const InfoRow = ({ label, value }) => {
  if (!hasVal(value)) return null;
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-val">{value}</span>
    </div>
  );
};

// Small basic-info stat card, hides itself if value missing/empty
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

// ─── Main Page Component ──────────────────────────────────────────────────────
const StudentDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isTeacher = location.pathname.includes('/teacher/');
  const [student, setStudent] = useState(null);
  const [classesData, setClassesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  const refreshStudent = useCallback(async () => {
    if (!id) return;
    try {
      const studentRes = await getStudentAPI(id);
      setStudent(studentRes.data?.data || studentRes.data);
    } catch (err) {
      console.error('Error refreshing student data:', err);
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [studentRes, classesRes] = await Promise.all([
          getStudentAPI(id),
          getClassesAPI({ limit: 100 })
        ]);
        setStudent(studentRes.data?.data || studentRes.data);
        const cData = classesRes.data?.data || classesRes.data || [];
        setClassesData(Array.isArray(cData) ? cData : []);
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError(err.response?.data?.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid #E2E8F0', borderTopColor: '#0C2A47', animation: 'spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#64748B' }}>Loading student details...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: 16 }}>
        <div style={{ textAlign: 'center', padding: 28, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', maxWidth: 380, width: '100%' }}>
          <AlertTriangle size={40} color="#E2B94D" style={{ margin: '0 auto 14px' }} />
          <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#030B15' }}>Error Loading Data</h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>{error || 'Student not found'}</p>
          <button onClick={() => navigate(isTeacher ? '/teacher/manage-students' : '/admin/students')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#0C2A47', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  const displayName = student.fullName || [student.firstName, student.lastName].filter(Boolean).join(' ') || 'Student';

  const enrolledClasses = classesData.filter(c =>
    student.classIds?.includes(c._id) || student.classIds?.includes(c.id) || student.classIds?.includes(c.classId)
  );
  const displayClasses = enrolledClasses.length > 0
    ? enrolledClasses
    : (hasVal(student.className) ? [{ _id: student.classIds?.[0] || 'fallback', name: student.className, section: student.section, classType: null }] : []);

  // The real flexi-hour allocation lives per-class inside classTimings (not the
  // unreliable top-level paidFlexiHours/freeFlexiHours fields). Sum them across
  // every enrolled class, exactly like the Students list "stars" cards do.
  const flexiClassIds = student.classTimings ? Object.keys(student.classTimings) : (student.classIds || []);
  const totalPaid = flexiClassIds.reduce((sum, id) => sum + (Number(student.classTimings?.[id]?.paidFlexiHours) || 0), 0);
  const totalFree = flexiClassIds.reduce((sum, id) => sum + (Number(student.classTimings?.[id]?.freeFlexiHours) || 0), 0);
  const totalConsumed = flexiClassIds.reduce((sum, id) => sum + (Number(student.classTimings?.[id]?.consumedFlexiHours) || 0), 0) + (Number(student.consumedFlexiHours) || 0);
  const rawLeft = totalPaid + totalFree - totalConsumed;
  const remaining = Math.max(0, rawLeft);
  const hasAnyFlexi = totalPaid > 0 || totalFree > 0;
  const hasFlexiData = hasAnyFlexi || (+student.consumedFlexiHours || 0) > 0;
  const isCritical = hasAnyFlexi && remaining < 6;
  const overstayHours = hasAnyFlexi ? Math.max(0, -rawLeft) : (Number(student.consumedFlexiHours) || 0);
  const hasOverstay = overstayHours > 0;
  const fmtH = (n) => (Number(n) || 0).toFixed(2);

  const hasAnyAddress = hasVal(student.address?.street) || hasVal(student.address?.city) || hasVal(student.address?.state) || hasVal(student.address?.pincode);
 
  const documentFields = [
    { key: 'admissionForm', label: 'Admission Form' },
    { key: 'birthCertificate', label: 'Birth Certificate' },
    { key: 'studentAadharCard', label: 'Student Aadhar' },
    { key: 'motherAadharCard', label: 'Mother Aadhar' },
    { key: 'fatherAadharCard', label: 'Father Aadhar' },
    { key: 'studentPhoto', label: 'Student Photo' },
    { key: 'motherPhoto', label: 'Mother Photo' },
    { key: 'fatherPhoto', label: 'Father Photo' },
    { key: 'transferCertificate', label: 'Transfer Certificate' },
    { key: 'medicalCertificate', label: 'Medical Certificate' },
    { key: 'others', label: 'Others' },
  ];
  const hasDocumentData = student.documentVerification && Object.keys(student.documentVerification).length > 0;

  const handleCopyQR = () => {
    if (!student.qrCode) return;
    navigator.clipboard.writeText(student.qrCode);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .student-detail-wrapper { 
          font-family: 'Outfit', -apple-system, sans-serif;
          padding: 24px; 
          max-width: 1320px; 
          margin: 0 auto; 
        }
        
        /* Premium Header Card */
        .profile-header-card { 
          padding: 32px; 
          background: #ffffff; 
          border-radius: 24px; 
          border: 1px solid rgba(226, 232, 240, 0.8); 
          margin-bottom: 24px; 
          box-shadow: 0 10px 40px rgba(0,0,0,0.03); 
          position: relative;
          overflow: hidden;
        }
        
        .profile-header-card::before {
          content: '';
          position: absolute;
          top: -100px; right: -100px; width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(37,99,235,0.06) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .profile-header-top { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; z-index: 1; position: relative; }
        
        .profile-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-left: auto; }
        .action-btn { 
          padding: 10px 18px; 
          border-radius: 12px; 
          border: none; 
          font-weight: 700; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          gap: 8px; 
          font-size: 14px; 
          white-space: nowrap; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.08); }
        
        .basic-info-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); 
          gap: 12px; 
          margin-top: 32px; 
          position: relative;
          z-index: 1;
        }
        
        .basic-card { 
          background: #ffffff; 
          border-radius: 16px; 
          padding: 16px; 
          border: 1px solid #F1F5F9;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          transition: transform 0.2s;
        }
        .basic-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.04); }
        .basic-label { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-left: 6px; letter-spacing: 0.05em; }
        .basic-val { font-size: 15px; font-weight: 800; color: #030B15; margin: 8px 0 0; word-break: break-word; }

        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
        
        .detail-card { 
          background: #ffffff; 
          border-radius: 20px; 
          border: 1px solid rgba(226, 232, 240, 0.8); 
          overflow: hidden; 
          display: flex; 
          flex-direction: column; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.03); 
          transition: transform 0.2s;
        }
        .detail-card:hover { box-shadow: 0 8px 30px rgba(0,0,0,0.06); }
        
        .detail-card-header { 
          padding: 16px 20px; 
          border-bottom: 1px solid rgba(226, 232, 240, 0.6); 
          display: flex; 
          align-items: center; 
          gap: 12px; 
        }
        .detail-card-content { padding: 20px; flex: 1; }
        
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 12px 16px; 
          background: #F8FAFC; 
          border-radius: 12px; 
          gap: 12px;
          transition: background 0.2s;
        }
        .info-row:hover { background: #F1F5F9; }
        .info-label { font-size: 12.5px; color: #475569; font-weight: 600; flex-shrink: 0; }
        .info-val { font-size: 13.5px; font-weight: 700; color: #030B15; word-break: break-word; text-align: right; }
        
        .fee-management-card { grid-column: 1 / -1; }
        .empty-block { text-align: center; padding: 32px 0; }

        @media (max-width: 768px) {
          .student-detail-wrapper { padding: 12px; }
          .profile-header-card { padding: 20px; }
          .profile-header-top { flex-direction: column; align-items: center; text-align: center; gap: 16px; }
          .profile-actions { margin-left: 0; justify-content: center; width: 100%; margin-top: 12px; flex-direction: column; gap: 8px; }
          .action-btn { width: 100%; padding: 12px; }
          .info-row { flex-direction: column; align-items: flex-start; text-align: left; gap: 6px; padding: 12px; }
          .info-val { text-align: left; }
          .basic-info-grid { grid-template-columns: repeat(2, 1fr); margin-top: 24px; }
          .fee-management-card { grid-column: auto; }
          .details-grid { gap: 16px; }
        }
        @media (max-width: 480px) {
          .basic-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <div className="student-detail-wrapper">
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <button onClick={() => navigate(isTeacher ? '/teacher/manage-students' : '/admin/students')} style={{ padding: 9, borderRadius: 11, border: 'none', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <ArrowLeft size={17} color="#64748B" />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#030B15', letterSpacing: '-0.02em' }}>Student Details</h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>Complete profile and management information</p>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className="profile-header-card">
          <div className="profile-header-top">
            <Avatar name={displayName} size="lg" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#030B15' }}>{displayName}</h2>
              {hasVal(student.admissionNo) && (
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B', fontFamily: 'monospace' }}>Admission No: {student.admissionNo}</p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {hasVal(student.status) && <Badge color={student.status === 'Active' ? 'green' : 'red'}>{student.status}</Badge>}
                {hasVal(student.gender) && <Badge color="blue">{student.gender}</Badge>}
                {hasFlexiData && <Badge color={isCritical ? 'red' : 'green'}>{remaining} hrs left</Badge>}
                {hasVal(student.admissionAY) && <Badge color="purple">{student.admissionAY}</Badge>}
                {hasVal(student.className) && <Badge color="teal">{student.className}{hasVal(student.section) ? ` - ${student.section}` : ''}</Badge>}
              </div>
            </div>
            <div className="profile-actions">
              <button onClick={() => navigate(isTeacher ? `/teacher/manage-students/edit/${student.admissionNo || student._id || student.id}` : `/admin/students/edit/${student.admissionNo || student._id || student.id}`)} className="action-btn" style={{ background: '#EFF6FF', color: '#0C2A47' }}>
                <Edit2 size={13} /> Edit
              </button>
              {hasVal(student.qrCode) && (
                <button onClick={() => setShowQRModal(true)} className="action-btn" style={{ background: '#FAF5FF', color: '#7E22CE' }}>
                  <QrCode size={13} /> QR Code
                </button>
              )}
            </div>
          </div>

          {/* Basic Info Grid — only shows cards that actually have data */}
          <div className="basic-info-grid">
            <BasicCard icon={Calendar} label="Date of Birth" value={formatDate(student.dateOfBirth)} />
            <BasicCard icon={Phone} label="Contact" value={student.parentDetails?.primaryPhone} />
            <BasicCard icon={GraduationCap} label="Admission Date" value={formatDate(student.admissionDate)} />
            <BasicCard icon={Heart} label="Blood Group" value={student.bloodGroup} />
            <BasicCard icon={Hash} label="Roll No" value={student.rollNo} />
          </div>
        </div>

        {/* Detailed Information Sections */}
        <div className="details-grid">

          {/* Parent Details */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#0C2A47', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Parent Details</h3>
            </div>
            <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <InfoRow label="Primary Contact" value={student.parentDetails?.primaryName} />
              <InfoRow label="Primary Phone" value={student.parentDetails?.primaryPhone} />
              <InfoRow label="Primary Email" value={student.parentDetails?.primaryEmail} />
              <InfoRow label="Relation" value={student.parentDetails?.relation} />
              <InfoRow label="Father Name" value={student.parentDetails?.fatherName} />
              <InfoRow label="Father Phone" value={student.parentDetails?.fatherPhone} />
              <InfoRow label="Father Email" value={student.fatherEmail} />
              <InfoRow label="Father DOB" value={formatDate(student.fatherDob)} />
              <InfoRow label="Mother Name" value={student.parentDetails?.motherName} />
              <InfoRow label="Mother Phone" value={student.parentDetails?.motherPhone} />
              <InfoRow label="Mother Email" value={student.motherEmail} />
              <InfoRow label="Mother DOB" value={formatDate(student.motherDob)} />
            </div>
          </div>

          {/* Address — card hidden entirely if nothing is filled */}
          {hasAnyAddress && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Address</h3>
              </div>
              <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InfoRow label="Street" value={student.address?.street} />
                <InfoRow label="City" value={student.address?.city} />
                <InfoRow label="State" value={student.address?.state} />
                <InfoRow label="Pincode" value={student.address?.pincode} />
              </div>
            </div>
          )}

          {/* Referral Information */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#BE185D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Star size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Referral Information</h3>
            </div>
            <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="info-row">
                <span className="info-label">Was Referred</span>
                <span className="info-val">
                  <Badge color={student.referralInfo?.wasReferred ? 'green' : 'gray'}>
                    {student.referralInfo?.wasReferred ? 'Yes' : 'No'}
                  </Badge>
                </span>
              </div>
              <InfoRow label="Referral ID" value={student.referralInfo?.referralId} />
              <InfoRow label="Referred By" value={student.referralInfo?.referredByName || student.referralInfo?.referredByParentId} />
            </div>
          </div>

          {/* Siblings — hidden if none */}
          {student.siblings && student.siblings.length > 0 && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Baby size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Siblings ({student.siblings.length})</h3>
              </div>
              <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {student.siblings.map((sib, i) => (
                  <div key={i} style={{ padding: '11px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#030B15' }}>{sib.name}</span>
                      {hasVal(sib.relation) && <Badge color="purple">{sib.relation}</Badge>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                      {hasVal(sib.dob) && <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} />{formatDate(sib.dob)}</span>}
                      {hasVal(sib.class) && <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Class: {sib.class}</span>}
                      {hasVal(sib.school) && <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>School: {sib.school}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Notes — hidden if empty */}
          {hasVal(student.adminNotes) && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FEF2F2, #FECACA)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Admin Notes</h3>
              </div>
              <div className="detail-card-content">
                <p style={{ margin: 0, fontSize: 12.5, color: '#475569', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {student.adminNotes}
                </p>
              </div>
            </div>
          )}

          {/* System & Account Info */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>System & Account Info</h3>
            </div>
            <div className="detail-card-content" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {student.parentUserId && (
                <>
                  <InfoRow label="Parent Account" value={student.parentUserId.email || student.parentUserId.phone} />
                  <div className="info-row">
                    <span className="info-label">Parent Status</span>
                    <span className="info-val"><Badge color={student.parentUserId.isActive ? 'green' : 'red'}>{student.parentUserId.isActive ? 'Active' : 'Inactive'}</Badge></span>
                  </div>
                  <InfoRow label="Parent Last Login" value={formatDateTime(student.parentUserId.lastLogin) || (student.parentUserId.lastLogin === null ? 'Never' : null)} />
                </>
              )}
              <InfoRow label="Created At" value={formatDateTime(student.createdAt)} />
              <InfoRow label="Last Updated" value={formatDateTime(student.updatedAt)} />
            </div>
          </div>

          {/* Document Verification */}
          {hasDocumentData && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Document Verification</h3>
              </div>
              <div className="detail-card-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {documentFields.map(({ key, label }) => {
                    const verified = !!student.documentVerification?.[key];
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 9px', background: verified ? '#F0FDF4' : '#FEF2F2', borderRadius: 8, border: `1px solid ${verified ? '#BBF7D0' : '#FECACA'}` }}>
                        {verified ? <CheckCircle size={13} color="#16A34A" /> : <XCircle size={13} color="#DC2626" />}
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: verified ? '#15803D' : '#B91C1C' }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Enrolled Classes */}
          <div className="detail-card">
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FAF5FF, #F3E8FF)' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#7E22CE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={13} color="#fff" />
              </div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Enrolled Classes ({displayClasses.length})</h3>
            </div>
            <div className="detail-card-content">
              {displayClasses.length === 0 ? (
                <div className="empty-block">
                  <BookOpen size={24} color="#94A3B8" style={{ margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>No classes enrolled</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displayClasses.map(cls => {
                    const timing = student.classTimings?.[cls.classId] || student.classTimings?.[cls._id] || student.classTimings?.[cls.id] || {};
                    const sTime = formatTime12(timing.startTime || cls.startTime);
                    const eTime = formatTime12(timing.endTime || cls.endTime);
                    const hasDays = cls.days && cls.days.length > 0;
                    const hasHoursData = ((+timing.paidFlexiHours || 0) > 0 || (+timing.freeFlexiHours || 0) > 0 || (+timing.consumedFlexiHours || 0) > 0);

                    return (
                      <div key={cls._id} style={{ padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7, gap: 8, flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: '#030B15' }}>{cls.name}</h4>
                          {hasVal(cls.section) && <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: '#EFF6FF', color: '#0C2A47', border: '1px solid #BFDBFE' }}>{cls.section}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: hasHoursData || cls.teacherId ? 7 : 0 }}>
                          {hasVal(cls.classType) && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Type: {cls.classType.replace('_', ' ')}</span>}
                          {sTime && eTime && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Time: {sTime} - {eTime}</span>}
                          {hasDays && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Days: {cls.days.join(', ')}</span>}
                        </div>

                        {hasHoursData && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: cls.teacherId ? 7 : 0, background: '#fff', padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                            {(+timing.paidFlexiHours || 0) > 0 && <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>Paid Hrs: {timing.paidFlexiHours}</span>}
                            {(+timing.freeFlexiHours || 0) > 0 && <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>Free Hrs: {timing.freeFlexiHours}</span>}
                            {(+timing.consumedFlexiHours || 0) > 0 && <span style={{ fontSize: 10.5, color: '#DC2626', fontWeight: 700 }}>Used Hrs: {timing.consumedFlexiHours}</span>}
                          </div>
                        )}

                        {cls.teacherId && (
                          <div style={{ padding: '6px 9px', background: '#F0FDFA', borderRadius: 8, border: '1px solid #99F6E4' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <Users size={11} color="#0D9488" />
                              <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0D9488' }}>
                                Teacher: {typeof cls.teacherId === 'object' ? cls.teacherId.name : 'Assigned'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Flexi Hours Summary — hidden entirely if there's no flexi-hour data at all */}
          {hasFlexiData && (
            <div className="detail-card">
              <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)' }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={13} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>Flexi Hours Summary</h3>
              </div>
              <div className="detail-card-content">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  <div style={{ textAlign: 'center', padding: 13, background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA' }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#B45309' }}>{fmtH(totalPaid)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Paid Hours</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: 13, background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#15803D' }}>{fmtH(totalFree)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Free Hours</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: 13, background: '#FFF1F2', borderRadius: 12, border: '1px solid #FECDD3' }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#DC2626' }}>{fmtH(totalConsumed)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Used Hours</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: 13, background: isCritical ? '#FEF2F2' : '#F0FDF4', borderRadius: 12, border: `1px solid ${isCritical ? '#FECACA' : '#BBF7D0'}` }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: isCritical ? '#DC2626' : '#15803D' }}>{fmtH(hasAnyFlexi ? remaining : 0)}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Remaining</p>
                  </div>
                </div>

                {hasOverstay && (
                  <div style={{ marginTop: 10, padding: '11px 13px', background: '#FFF7ED', borderRadius: 12, border: '1px solid #FED7AA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Clock size={12} color="#C2410C" />
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>Extra Stay Hours</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '1px 7px', borderRadius: 99 }}>⚠ No Plan</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#C2410C' }}>{fmtH(overstayHours)} hrs</p>
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>Stayed back after class — no flexi plan purchased.</p>
                  </div>
                )}

                {isCritical && (
                  <div style={{ marginTop: 10, padding: '9px 12px', background: '#FFF1F2', borderRadius: 10, border: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={13} color="#DC2626" />
                    <p style={{ margin: 0, fontSize: 11, color: '#B91C1C', fontWeight: 600 }}>Low balance! Only {fmtH(remaining)} hours remaining.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fee Management */}
          <div className="detail-card fee-management-card" style={{ border: '1px solid #BAE6FD', boxShadow: '0 8px 28px rgba(2, 136, 209, 0.08)' }}>
            <div className="detail-card-header" style={{ background: 'linear-gradient(135deg, #0288D1, #0277BD)', padding: '16px 18px', borderBottom: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: '#fff' }}>Fee Management</h3>
                  <p style={{ margin: '1px 0 0', fontSize: 11.5, color: 'rgba(255,255,255,0.85)' }}>Manage enrollments, invoices, and payments</p>
                </div>
              </div>
            </div>
            <div className="detail-card-content" style={{ padding: 0, background: '#F8FAFC' }}>
              <FeeManagement
                studentId={student._id || student.id}
                studentName={displayName}
              />
            </div>
          </div>
        </div>

        {/* QR Code Modal — raw QR string is intentionally never displayed on screen */}
        {showQRModal && hasVal(student.qrCode) && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(10,15,40,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={e => e.target === e.currentTarget && setShowQRModal(false)}>
            <div style={{ width: '100%', maxWidth: 320, background: '#fff', borderRadius: 20, boxShadow: '0 40px 100px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
              <div style={{ background: `linear-gradient(135deg,${getPalette(displayName)[0]},${getPalette(displayName)[1]})`, padding: 18, textAlign: 'center' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 700 }}>Student QR Code</h3>
                <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>{displayName}</p>
              </div>
              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ padding: 14, background: '#fff', borderRadius: 16, border: '2px solid #E2E8F0', boxShadow: '0 8px 22px rgba(0,0,0,0.06)' }}>
                  <QRCodeCanvas value={student.qrCode} size={150} level="H" />
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

export default StudentDetailView;