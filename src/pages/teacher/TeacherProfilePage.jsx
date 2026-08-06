import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyTeacherProfileAPI, getTeacherPhotoUrl } from '../../api/teachers';
import { QRCodeCanvas } from 'qrcode.react';
import Toast from '../../components/photos/Toast';
import {
  User, Mail, Phone, BookOpen, Shield, CheckCircle2, Clock, Timer, 
  Briefcase, IndianRupee, QrCode, CalendarDays, GraduationCap
} from 'lucide-react';

// ── Dummy enrichment data ─────────────────────────────────────────────────
const STATS = [
  { label: 'Students',    value: 48,   icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  { label: 'Classes',     value: 4,    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
  { label: 'Assignments', value: 12,   icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
  { label: 'Attendance %', value: '96%', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
];

const ACTIVITY = [
  { id: 1, action: 'Uploaded "Sports Day" photos',        time: '10 min ago',  icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z', color: '#34D399' },
  { id: 2, action: 'Marked attendance for KG-A',           time: '2 hr ago',    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                   color: '#38BDF8' },
  { id: 3, action: 'Replied to Priya Reddy\'s message',    time: 'Yesterday',   icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',   color: '#A78BFA' },
  { id: 4, action: 'Posted Math homework assignment',      time: '2 days ago',  icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',                                         color: '#FBBF24' },
  { id: 5, action: 'Updated class schedule for KG-B',     time: '3 days ago',  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',                                                                         color: '#FB923C' },
];

const SUBJECTS_LIST = ['Mathematics', 'Science', 'English', 'Hindi', 'EVS', 'Art & Craft', 'Physical Education'];

// ── Svg helper ────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = 'currentColor', sw = 2 }) => (
  <svg width={size} height={size} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);

const PERM_LABELS = {
  canViewStudentMobile: 'View Student Mobile',
  canMarkAttendance: 'Mark Attendance',
  canUploadPhotos: 'Upload Photos',
  canViewSalary: 'View Salary',
  canViewFeeInfo: 'View Fee Status',
  canDisplayStaffQR: 'Display Staff QR',
  canManageFees: 'Manage Fee Hub',
  canManageStudents: 'Create/Edit Students',
  canManageEmployees: 'Create/Edit Employees',
  canManageBirthdays: 'Manage Birthdays',
  canManageEnquiries: 'Manage Enquiries',
  canViewBirthdays: 'View Birthdays',
  canManageCertificates: 'Manage Certificates',
  canManageDailyActivity: 'Manage Daily Activity',
  aadhaarVerified: 'Aadhaar Verified',
  policeVerified: 'Police Verified'
};

const formatTime12 = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':');
  if (!h || !m) return time24;
  const hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hr12 = hours % 12 || 12;
  return `${hr12}:${m} ${ampm}`;
};

export default function TeacherProfilePage() {
  const { user, updateProfile } = useAuth();
  const [toast, setToast]       = useState(null);
  const [profile, setProfile]   = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [error, setError]       = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [editData, setEditData] = useState({
    name:     '',
    email:    '',
    phone:    '',
    subjects: '',
    bio:      '',
    join:     '',
    empId:    '',
    dept:     '',
  });

  // Fetch teacher profile from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        setError('');
        const response = await getMyTeacherProfileAPI();
        const profileData = response.data.data || response.data;
        setProfile(profileData);
        
        // Populate edit form
        setEditData({
          name:     profileData.name || '',
          email:    profileData.email || profileData.userId?.email || '',
          phone:    profileData.phone || '',
          subjects: profileData.subjects || '',
          bio:      profileData.bio || '',
          join:     profileData.dateOfJoining ? new Date(profileData.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          empId:    profileData.employeeId || '',
          dept:     profileData.department || 'Teaching',
        });
      } catch (err) {
        // Fallback to auth context user data
        console.error('Failed to fetch profile:', err);
        setError('Failed to load profile, showing cached data');
        if (user) {
          setEditData({
            name:     user.name || '',
            email:    user.email || '',
            phone:    user.phone || '',
            subjects: user.subjects || '',
            bio:      user.bio || '',
            join:     user.dateOfJoining || '',
            empId:    user.employeeId || '',
            dept:     user.department || 'Teaching',
          });
          setProfile(user);
        }
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError('');
    try {
      const result = await updateProfile({
        name: editData.name,
        phone: editData.phone,
        subjects: editData.subjects,
        bio: editData.bio,
      });
      
      if (result.success) {
        setToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been updated successfully!'
        });
      } else {
        setError(result.error);
        setToast({
          type: 'error',
          title: 'Update Failed',
          message: result.error
        });
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      const errorMsg = err.response?.data?.error || 'Failed to update profile';
      setError(errorMsg);
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: errorMsg
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const initials = editData.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  
  // Get Active Permissions Only
  const activePermissions = Object.entries(profile?.permissions || {})
    .filter(([key, val]) => val === true)
    .map(([key]) => PERM_LABELS[key] || key);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .tp-root { font-family: 'Nunito', sans-serif; }

        /* ── Field ── */
        .tp-label { display: block; font-size: 11px; font-weight: 800; color: #475569; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .05em; }
        .tp-input {
          width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0;
          border-radius: 12px; font-family: 'Nunito', sans-serif;
          font-size: 13.5px; font-weight: 600; color: #0F172A; outline: none;
          background: #F8FAFC; transition: border-color .2s, box-shadow .2s, background .2s;
        }
        .tp-input:focus { border-color: #16A34A; background: #fff; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }
        .tp-input::placeholder { color: #94A3B8; font-weight: 500; }
        .tp-input:read-only { background: #F1F5F9; color: #64748B; cursor: default; }

        /* ── Btn ── */
        .tp-btn-green { padding: 11px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg,#16A34A,#22C55E); color: #fff; font-family: 'Nunito',sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform .2s, box-shadow .2s; box-shadow: 0 4px 14px rgba(22,163,74,.3); }
        .tp-btn-green:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(22,163,74,.4); }
        .tp-btn-slate { padding: 11px 24px; border-radius: 12px; border: 1.5px solid #E2E8F0; background: #fff; color: #475569; font-family: 'Nunito',sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: background .15s; }
        .tp-btn-slate:hover { background: #F8FAFC; }
        .tp-btn-red { padding: 11px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg,#EF4444,#DC2626); color: #fff; font-family: 'Nunito',sans-serif; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform .2s, box-shadow .2s; box-shadow: 0 4px 14px rgba(239,68,68,.25); }
        .tp-btn-red:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,.35); }

        /* ── Tab ── */

        /* ── Stat card ── */
        .tp-stat { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 14px; background: #fff; border: 1px solid #E2E8F0; transition: all .2s; }
        .tp-stat:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(0,0,0,.07); }
        
        .tp-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .tp-info-box { background: #F8FAFC; border: 1px solid #F1F5F9; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 4px; }
        .tp-info-title { font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px; }
        .tp-info-value { font-size: 14px; font-weight: 800; color: #0F172A; }

        /* ── Activity item ── */
        .tp-act { display: flex; align-items: flex-start; gap: 12px; padding: 11px 0; border-bottom: 1px solid #F1F5F9; }
        .tp-act:last-child { border-bottom: none; }

        /* ── Avatar ring ── */
        .tp-avatar-ring { width: 88px; height: 88px; border-radius: 24px; background: linear-gradient(135deg,#16A34A,#FB8C00); display: flex; align-items: center; justify-content: center; font-family: 'Baloo 2',cursive; font-size: 28px; font-weight: 800; color: #fff; box-shadow: 0 8px 24px rgba(22,163,74,.35); position: relative; }
        .tp-avatar-edit { position: absolute; bottom: -6px; right: -6px; width: 26px; height: 26px; border-radius: 8px; background: #16A34A; border: 2.5px solid #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        /* ── Section card ── */
        .tp-card { background: #fff; border-radius: 18px; border: 1px solid #E2E8F0; padding: 22px; box-shadow: 0 2px 12px rgba(0,0,0,.04); }
        .tp-card-title { font-family: 'Baloo 2', cursive; font-size: 16px; font-weight: 800; color: #0F172A; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        
        .tp-hero { background: linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%); border-radius: 24px; padding: 32px 28px; color: #fff; position: relative; overflow: hidden; box-shadow: 0 10px 30px rgba(59,130,246,0.2); margin-bottom: 24px; display: flex; flex-direction: column; sm:flex-row; gap: 24px; align-items: center; sm:align-items: flex-start; text-align: center; sm:text-align: left; }
        .tp-hero::after { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%; filter: blur(30px); pointer-events: none; }

        @keyframes tpIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes tpFade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tp-fade { animation: tpFade .3s ease both; }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="tp-root">

        {/* ── Page title ── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily:"'Baloo 2',cursive", fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>My Profile</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0', fontWeight: 600 }}>View and manage your account</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="tp-fade" style={{ 
            padding: '12px 16px', 
            borderRadius: 12, 
            background: '#FEF2F2', 
            border: '1.5px solid #FECDD3',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span style={{ color: '#DC2626', fontSize: 16 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#991B1B', flex: 1 }}>{error}</p>
            <button 
              onClick={() => setError('')} 
              style={{ 
                border: 'none', 
                background: '#FECDD3', 
                color: '#991B1B', 
                borderRadius: 6, 
                width: 24, 
                height: 24, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading State */}
        {profileLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid #DCFCE7', borderTopColor: '#16A34A', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: '#64748B', fontWeight: 600 }}>Loading profile…</p>
          </div>
        ) : (

        <div>
          
          {/* ── HERO SECTION ── */}
          <div className="tp-hero sm:flex-row">
            <div className="relative flex-shrink-0">
              <div style={{ width: 96, height: 96, borderRadius: 24, background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 900, backdropFilter: 'blur(10px)' }}>
                {profile?.photo ? (
                  <img src={getTeacherPhotoUrl(profile.photo)} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 20 }} />
                ) : (
                  initials
                )}
              </div>
            </div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', sm: { justifyContent: 'flex-start' } }}>
                <span style={{ background: profile?.status === 'Active' ? '#10B981' : '#F59E0B', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {profile?.status || 'Active'}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {profile?.employeeType?.replace('_', ' ') || 'FIXED TIME'}
                </span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, margin: '8px 0 4px', letterSpacing: '-0.02em' }}>{profile?.name}</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', margin: 0, fontWeight: 600 }}>Employee ID: {profile?.employeeId}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, lg: { gridTemplateColumns: '2fr 1fr' } }} className="lg:grid-cols-3">
            
            {/* ══ LEFT COLUMN ══ */}
            <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Professional Info & Salary Card */}
              <div className="tp-card">
                <h3 className="tp-card-title"><Briefcase size={18} className="text-blue-600" /> Employment Details</h3>
                <div className="tp-info-grid">
                  <div className="tp-info-box">
                    <span className="tp-info-title"><CalendarDays size={13} /> Date of Joining</span>
                    <span className="tp-info-value">{profile?.dateOfJoining ? new Date(profile.dateOfJoining).toLocaleDateString('en-IN') : '—'}</span>
                  </div>
                  <div className="tp-info-box">
                    <span className="tp-info-title"><Clock size={13} /> Shift / Hours</span>
                    <span className="tp-info-value">
                      {profile?.employeeType === 'FIXED_TIME' ? `${formatTime12(profile?.fixedShift?.entryTime)} - ${formatTime12(profile?.fixedShift?.exitTime)}` 
                        : profile?.employeeType === 'FIXED_HOURS' ? `Min ${profile?.fixedHours?.minimumHours} hrs/day` 
                        : 'Flexible Schedule'}
                    </span>
                  </div>
                  <div className="tp-info-box">
                    <span className="tp-info-title"><Timer size={13} /> Grace Period</span>
                    <span className="tp-info-value">{profile?.employeeType === 'FIXED_TIME' ? `${profile?.fixedShift?.gracePeriodMinutes || 0} mins` : 'N/A'}</span>
                  </div>
                  <div className="tp-info-box">
                    <span className="tp-info-title"><CalendarDays size={13} /> Holiday Calendar</span>
                    <span className="tp-info-value">{profile?.holidayCalendar === 'TEACHING' ? 'Teaching Staff' : 'Non-Teaching Staff'}</span>
                  </div>
                  
                  {/* Salary section visible only if permitted */}
                  {profile?.permissions?.canViewSalary && (
                    <>
                      <div className="tp-info-box" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                        <span className="tp-info-title" style={{ color: '#166534' }}><IndianRupee size={13} /> Monthly Salary</span>
                        <span className="tp-info-value" style={{ color: '#15803D' }}>₹ {profile?.monthlySalary?.toLocaleString('en-IN') || 0}</span>
                      </div>
                      <div className="tp-info-box" style={{ background: '#F0FDF4', borderColor: '#BBF7D0' }}>
                        <span className="tp-info-title" style={{ color: '#166534' }}><IndianRupee size={13} /> Extra Hourly Rate</span>
                        <span className="tp-info-value" style={{ color: '#15803D' }}>₹ {profile?.extraHourlyRate?.toLocaleString('en-IN') || 0} / hr</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Edit Profile form */}
              <div className="tp-card">
                <h3 className="tp-card-title"><User size={18} className="text-blue-600" /> Edit Profile Info</h3>
                <form onSubmit={handleSave}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    {[
                      { label: 'Full Name',    key: 'name',     type: 'text',  placeholder: 'Your name' },
                      { label: 'Email',        key: 'email',    type: 'email', placeholder: 'your@email.com' },
                      { label: 'Phone',        key: 'phone',    type: 'text',  placeholder: '+91 XXXXX XXXXX' },
                      { label: 'Subjects',     key: 'subjects', type: 'text',  placeholder: 'e.g. Math, Science' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="tp-label">{f.label}</label>
                        <input
                          type={f.type}
                          value={editData[f.key]}
                          readOnly={f.readOnly}
                          onChange={e => !f.readOnly && setEditData(prev => ({ ...prev, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          className="tp-input"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Bio */}
                  <div style={{ marginBottom: 20 }}>
                    <label className="tp-label">Bio</label>
                    <textarea
                      rows={3}
                      value={editData.bio}
                      onChange={e => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Write a short bio…"
                      className="tp-input"
                      style={{ resize: 'vertical', lineHeight: 1.6 }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="tp-btn-green">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <Ico d="M5 13l4 4L19 7" size={15} stroke="#fff" sw={2.5} />
                        Save Changes
                      </span>
                    </button>
                    <button type="button" className="tp-btn-slate" onClick={() => setEditData({ name: user?.name||'', email: user?.email||'', phone: user?.phone||'', subjects: user?.subjects||'', bio: user?.bio||'', join: '12 July 2019', empId: 'BB-TCH-042', dept: 'Primary Education' })}>
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
          
          {/* ══ RIGHT COLUMN ══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Permissions */}
            <div className="tp-card">
              <h3 className="tp-card-title"><Shield size={18} className="text-emerald-600" /> Active Permissions</h3>
              {activePermissions.length === 0 ? (
                <p className="text-sm text-slate-500">No special permissions assigned.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activePermissions.map(perm => (
                    <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 14px', borderRadius: 12 }}>
                      <CheckCircle2 size={16} color="#16A34A" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>{perm}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* QR Code */}
            {profile?.permissions?.canDisplayStaffQR && profile?.qrCode && (
              <div className="tp-card text-center flex flex-col items-center">
                <h3 className="tp-card-title w-full"><QrCode size={18} className="text-purple-600" /> My QR Code</h3>
                <div style={{ padding: 12, background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0', display: 'inline-block' }}>
                  <QRCodeCanvas value={profile.qrCode} size={150} level="H" />
                </div>
                <p style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>{profile.qrCode}</p>
              </div>
            )}

          </div>
        </div>
      )}
      </div>
    </>
  );
}