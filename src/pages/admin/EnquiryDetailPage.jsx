import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEnquiryById, updateEnquiryStatus } from '../../api/enquiries';
import { getClassesAPI } from '../../api/classes';
import Toast from '../../components/photos/Toast';

// Service map
const serviceMap = {
  school:           { label: 'School',           color: '#E82928', icon: '🏫' },
  daycare:          { label: 'Daycare',          color: '#F28E3A', icon: '🧸' },
  evening_club:     { label: 'Evening Kids Club',color: '#29A9E1', icon: '🎨' },
  book_writing:     { label: 'Little Author Program', color: '#16a34a', icon: '📖' },
  drawing:          { label: 'Drawing/Art & Craft',color: '#8B5CF6', icon: '✏️' },
  english_speaking_kids: { label: 'English Speaking Course', color: '#29A9E1', icon: '🗣️' },
  phonics_vocab:    { label: 'Phonics and English Vocab', color: '#10B981', icon: '🔤' },
  personality_dev: { label: 'Personality Development', color: '#F59E0B', icon: '🌟' },
  workshops_kids:   { label: 'Workshops (Kids)', color: '#EC4899', icon: '🎭' },
  others_kids:      { label: 'Others (Kids)',    color: '#0B3A64', icon: '✨' },
  jobs:             { label: 'Jobs',             color: '#8B5CF6', icon: '💼' },
  english_speaking: { label: 'SPEAKWELL English', color: '#29A9E1', icon: '🗣️' },
  teachers_training:{ label: 'Teachers Training',color: '#0B3A64', icon: '📚' },
  hobby_courses:    { label: 'Hobby Courses',    color: '#F28E3A', icon: '🎯' },
  workshops_adults: { label: 'Workshops (Adults)', color: '#EC4899', icon: '🎪' },
  others_adults:    { label: 'Others (Adults)',  color: '#16a34a', icon: '✨' },
  // Legacy support
  talent_course:    { label: 'Talent Course',    color: '#16a34a', icon: '⭐' },
  job:              { label: 'Job',              color: '#8B5CF6', icon: '💼' },
  others:           { label: 'Others',           color: '#EC4899', icon: '✨' },
  library:          { label: 'Library',          color: '#0EA5E9', icon: '🏛️' },
  reading_library:  { label: 'Reading Library',  color: '#0891B2', icon: '📖' },
};

// Full Service Display Map - with multicolour gradient for kids, grey for adults
const fullServiceDisplayMap = {
  // KIDS services - Multicolour tags (Gradient rainbow colors)
  school:           { label: 'School',           color: 'linear-gradient(135deg,#D4AF37,#B8860B)', icon: '🏫', isKids: true },
  daycare:          { label: 'Daycare',          color: 'linear-gradient(135deg, #F28E3A, #FBBF24)', icon: '🧸', isKids: true },
  evening_club:     { label: 'Evening Kids Club',color: 'linear-gradient(135deg,#0F4C5C,#051d24)', icon: '🎨', isKids: true },
  book_writing:     { label: 'Book Writing',     color: 'linear-gradient(135deg, #16a34a, #10B981)', icon: '📖', isKids: true },
  drawing:          { label: 'Drawing/Art & Craft',color: 'linear-gradient(135deg, #8B5CF6, #A855F7)', icon: '✏️', isKids: true },
  english_speaking_kids: { label: 'English Speaking Course', color: 'linear-gradient(135deg,#0F4C5C,#051d24)', icon: '🗣️', isKids: true },
  phonics_vocab:    { label: 'Phonics and English Vocab', color: 'linear-gradient(135deg, #10B981, #34D399)', icon: '🔤', isKids: true },
  personality_dev:   { label: 'Personality Development', color: 'linear-gradient(135deg, #F59E0B, #FBBF24)', icon: '🌟', isKids: true },
  workshops_kids:   { label: 'Workshops',        color: 'linear-gradient(135deg, #EC4899, #F472B6)', icon: '🎭', isKids: true },
  others_kids:      { label: 'Others',           color: 'linear-gradient(135deg, #0B3A64, #3B82F6)', icon: '✨', isKids: true },
  library:          { label: 'Library',          color: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', icon: '🏛️', isKids: true },
  // ADULT services - Grey colour tags
  jobs:             { label: 'Jobs',              color: '#64748B', icon: '💼', isKids: false },
  english_speaking: { label: 'SPEAKWELL English',color: '#64748B', icon: '🗣️', isKids: false },
  teachers_training:{ label: 'Teachers Training',color: '#64748B', icon: '📚', isKids: false },
  hobby_courses:    { label: 'Hobby Courses',    color: '#64748B', icon: '🎯', isKids: false },
  workshops_adults: { label: 'Workshops',        color: '#64748B', icon: '🎪', isKids: false },
  others_adults:    { label: 'Others',           color: '#64748B', icon: '✨', isKids: false },
  reading_library:  { label: 'Reading Library',  color: '#64748B', icon: '📖', isKids: false },
};

// Status config
const statusConfig = {
  New:       { bg: '#dbeafe', color: '#0F4C5C', dot: '#3b82f6', gradient: 'linear-gradient(135deg,#0F4C5C,#051d24)' },
  Contacted: { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  Visited:   { bg: '#dcfce7', color: '#166534', dot: '#22c55e', gradient: 'linear-gradient(135deg, #22c55e, #16a34a)' },
  Admitted:  { bg: '#f0fdf4', color: '#14532d', dot: '#16a34a', gradient: 'linear-gradient(135deg, #16a34a, #15803d)' },
  Rejected:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
};

const ALL_STATUSES = ['New', 'Contacted', 'Visited', 'Admitted', 'Rejected'];

// Helper functions
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit'
  });
}
function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function calcAge(dob) {
  if (!dob) return '—';
  const diff = Date.now() - new Date(dob).getTime();
  const y = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  const m = Math.floor((diff % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30));
  return y > 0 ? `${y}y ${m}m` : `${m} months`;
}

function normalizeAuditValue(value, field) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((item) => normalizeAuditValue(item, field)).filter(Boolean).sort();
  if (typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeAuditValue(value[key], key);
        return acc;
      }, {});
  }

  const text = String(value).trim();
  const isDateField = /(date|dob|time)/i.test(field);
  if (isDateField) {
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }
  }

  return text;
}

function areAuditValuesEqual(before, after, field) {
  return JSON.stringify(normalizeAuditValue(before, field)) === JSON.stringify(normalizeAuditValue(after, field));
}

// Info Card Component
function InfoCard({ icon, title, children, className = '' }) {
  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '16px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
      border: '1px solid #f1f5f9',
      overflow: 'hidden',
      ...className
    }}>
      {title && (
        <div style={{ 
          padding: '16px 20px', 
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>{icon}</span>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#051d24', margin: 0 }}>{title}</h3>
        </div>
      )}
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({ label, value, icon, color = '#051d24' }) {
  if (!value || value === '—') return null;
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'flex-start', 
      gap: '12px', 
      padding: '12px 0',
      borderBottom: '1px solid #f8fafc'
    }}>
      {icon && <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '14px', color, fontWeight: '700', wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  );
}

export default function EnquiryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchEnquiry = async () => {
      try {
        setLoading(true);
        const res = await getEnquiryById(id);
        if (!res.success) {
          throw new Error(res.error || 'Failed to fetch enquiry');
        }
        setEnquiry(res.data);
        setEditData({
          childName: res.data.childName || '',
          childDob: res.data.childDob ? res.data.childDob.split('T')[0] : '',
          childGender: res.data.childGender || '',
          applicantName: res.data.applicantName || '',
          position: res.data.position || '',
          qualification: res.data.qualification || '',
          experience: res.data.experience || '',
          currentSalary: res.data.currentSalary || '',
          expectedSalary: res.data.expectedSalary || '',
          fatherName: res.data.fatherName || '',
          fatherMobile: res.data.fatherMobile || '',
          fatherDob: res.data.fatherDob ? res.data.fatherDob.split('T')[0] : '',
          fatherEmail: res.data.fatherEmail || '',
          motherName: res.data.motherName || '',
          motherMobile: res.data.motherMobile || '',
          motherDob: res.data.motherDob ? res.data.motherDob.split('T')[0] : '',
          motherEmail: res.data.motherEmail || '',
          address: res.data.address || '',
          preferredDate: res.data.preferredDate ? res.data.preferredDate.split('T')[0] : '',
          preferredTime: res.data.preferredTime || '',
          referredBySource: res.data.referredBySource || '',
          referralName: res.data.referralName || '',
          referralMobile: res.data.referralMobile || '',
          message: res.data.message || '',
          adminNotes: res.data.adminNotes || '',
          status: res.data.status || 'New',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEnquiry();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!enquiry || statusChanging) return;
    setStatusChanging(true);
    try {
      const res = await updateEnquiryStatus(enquiry._id, newStatus);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update status');
      }
      setEnquiry(prev => ({ ...prev, status: newStatus }));
      setToast({ type: 'success', title: 'Status Updated', message: `Status changed to ${newStatus}` });
    } catch (err) {
      setToast({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setStatusChanging(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // TODO: Implement update enquiry API
      setToast({ type: 'success', title: 'Saved', message: 'Enquiry updated successfully' });
      setEditing(false);
    } catch (err) {
      setToast({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite', width: '48px', height: '48px' }} viewBox="0 0 24 24" fill="none" stroke="#E82928">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748b', fontWeight: '700' }}>Loading enquiry details...</p>
        </div>
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '48px 32px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', maxWidth: '480px', width: '100%' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#051d24', marginBottom: '8px' }}>Error Loading Enquiry</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>{error || 'Enquiry not found'}</p>
          <button 
            onClick={() => navigate('/admin/user-enquiry')}
            style={{ 
              padding: '14px 28px', 
              background: 'linear-gradient(135deg,#D4AF37,#B8860B)', 
              border: 'none', 
              borderRadius: '12px', 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: '800', 
              cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif'
            }}
          >
            ← Back to Enquiries
          </button>
        </div>
      </div>
    );
  }

  const sc = statusConfig[enquiry.status] || statusConfig.New;
  const showJobInfo = enquiry.type === 'job' || enquiry.type === 'both';
  const showChildInfo = enquiry.type === 'child' || enquiry.type === 'both';
  const showCourseInfo = enquiry.type === 'course';
  const typeConfig = {
    child: { icon: '🧒', label: 'Child Enquiry', gradient: 'linear-gradient(135deg,#D4AF37,#B8860B)' },
    job: { icon: '💼', label: 'Job Enquiry', gradient: 'linear-gradient(135deg,#0F4C5C,#051d24)' },
    both: { icon: '🎯', label: 'Child + Job Enquiry', gradient: 'linear-gradient(135deg, #E82928, #8B5CF6)' },
    course: { icon: '📚', label: 'Course Enquiry', gradient: 'linear-gradient(135deg, #0ea5e9, #0F4C5C)' },
  };
  const tc = typeConfig[enquiry.type] || typeConfig.child;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: 'Nunito', sans-serif; }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        fontFamily: "'Nunito', sans-serif"
      }}>
        {/* Header */}
        <div style={{ 
          background: 'white', 
          borderBottom: '1px solid #e2e8f0', 
          padding: '20px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ 
            maxWidth: '1200px', 
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Back button & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => navigate('/admin/user-enquiry')}
                style={{ 
                  padding: '10px', 
                  background: '#f8fafc', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="20" height="20" fill="none" stroke="#64748b" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#051d24', margin: 0 }}>Enquiry Details</h1>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>ID: {enquiry.enquiryId}</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Status Badge */}
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '8px 16px', 
                borderRadius: '20px', 
                background: sc.bg, 
                color: sc.color, 
                fontSize: '13px', 
                fontWeight: '800' 
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.dot }} />
                {enquiry.status}
              </span>

              {/* Edit Button */}
              <button 
                onClick={() => setEditing(!editing)}
                style={{ 
                  padding: '10px 16px', 
                  background: editing ? '#fee2e2' : '#f8fafc', 
                  border: editing ? '1px solid #fca5a5' : '1px solid #e2e8f0', 
                  borderRadius: '10px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: editing ? '#dc2626' : '#64748b'
                }}
              >
                {editing ? '✕ Cancel' : '✏️ Edit'}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {/* Left Column - Main Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Basic Info Card */}
              <InfoCard>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    borderRadius: '50%', 
                    background: tc.gradient,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontWeight: '900', 
                    fontSize: '28px',
                    flexShrink: 0
                  }}>
                    {showChildInfo ? (enquiry.childName || enquiry.applicantName || 'N').charAt(0).toUpperCase() : (enquiry.applicantName || 'N').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#051d24', margin: '0 0 4px' }}>
                      {showChildInfo ? (enquiry.childName || 'N/A') : (enquiry.applicantName || 'N/A')}
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '600' }}>
                      {tc.icon} {tc.label}
                    </p>
                  </div>
                </div>

                {/* Services */}
                {enquiry.services && enquiry.services.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', marginBottom: '8px' }}>Selected Services</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {enquiry.services.map(s => {
                        const sv = fullServiceDisplayMap[s] || serviceMap[s];
                        const isGradient = sv.color.includes('gradient');
                        return (
                          <span key={s} style={{ 
                            padding: '6px 12px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: '700', 
                            color: 'white', 
                            background: sv?.color || '#94a3b8',
                            boxShadow: isGradient ? '0 2px 6px rgba(0,0,0,0.2)' : 'none',
                          }}>
                            {sv?.icon} {sv?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </InfoCard>

              {/* Child Information */}
              {showChildInfo && (
                <InfoCard icon="🧒" title="Child Information">
                  <InfoRow label="Full Name" value={enquiry.childName || '—'} icon="👤" />
                  <InfoRow label="Date of Birth" value={enquiry.childDob ? `${formatDate(enquiry.childDob)}` : '—'} icon="📅" />
                  <InfoRow label="Age" value={calcAge(enquiry.childDob)} icon="⏳" />
                  <InfoRow label="Gender" value={enquiry.childGender ? `${enquiry.childGender === 'Boy' ? '👦' : '👧'} ${enquiry.childGender}` : '—'} icon="⚧" />
                </InfoCard>
              )}

              {/* Job Application */}
              {showJobInfo && (
                <InfoCard icon="💼" title="Job Application">
                  <InfoRow label="Applicant Name" value={enquiry.applicantName || '—'} icon="👤" />
                  <InfoRow label="Applying For" value={enquiry.position || '—'} icon="💼" />
                  <InfoRow label="Qualification" value={enquiry.qualification || '—'} icon="🎓" />
                  {enquiry.experience && <InfoRow label="Experience" value={enquiry.experience} icon="⏱️" />}
                  {enquiry.currentSalary && <InfoRow label="Current Salary" value={`₹${Number(enquiry.currentSalary).toLocaleString()}/mo`} icon="💰" />}
                  {enquiry.expectedSalary && <InfoRow label="Expected Salary" value={`₹${Number(enquiry.expectedSalary).toLocaleString()}/mo`} icon="🎯" />}
                </InfoCard>
              )}

              {/* Course Information */}
              {showCourseInfo && (
                <InfoCard icon="📚" title="Course Information">
                  <InfoRow label="Applicant Name" value={enquiry.applicantName || '—'} icon="👤" />
                </InfoCard>
              )}

              {/* Contact Information */}
              <InfoCard icon="📞" title="Contact Information">
                <InfoRow label="Mobile" value={enquiry.mobile} icon="📱" color="#051d24" />
                {(showChildInfo || enquiry.fatherEmail) && (
                  <>
                    {enquiry.fatherName && <InfoRow label="Father's Name" value={enquiry.fatherName} icon="👨" />}
                    {enquiry.fatherMobile && <InfoRow label="Father's Mobile" value={enquiry.fatherMobile} icon="📱" />}
                    {enquiry.fatherEmail && <InfoRow label="Father's Email" value={enquiry.fatherEmail} icon="✉️" />}
                    {enquiry.motherName && <InfoRow label="Mother's Name" value={enquiry.motherName} icon="👩" />}
                    {enquiry.motherMobile && <InfoRow label="Mother's Mobile" value={enquiry.motherMobile} icon="📱" />}
                    {enquiry.motherEmail && <InfoRow label="Mother's Email" value={enquiry.motherEmail} icon="✉️" />}
                  </>
                )}
                {enquiry.address && <InfoRow label="Address" value={enquiry.address} icon="📍" />}
              </InfoCard>

              {/* Visit Details */}
              {(enquiry.preferredDate || enquiry.message) && (
                <InfoCard icon="📅" title="Visit Details">
                  <InfoRow label="Preferred Date" value={formatDate(enquiry.preferredDate)} icon="📅" />
                  <InfoRow label="Preferred Time" value={Array.isArray(enquiry.preferredTime) ? enquiry.preferredTime.join(', ') : enquiry.preferredTime} icon="🕐" />
                  {enquiry.message && <InfoRow label="Message" value={enquiry.message} icon="💬" />}
                  {enquiry.referredBySource && <InfoRow label="Referred By" value={enquiry.referredBySource} icon="🔗" />}
                  {enquiry.referralName && <InfoRow label="Referral Name" value={enquiry.referralName} icon="👤" />}
                  {enquiry.referralMobile && <InfoRow label="Referral Mobile" value={enquiry.referralMobile} icon="📱" />}
                </InfoCard>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Status Change Card */}
              <InfoCard icon="📊" title="Change Status">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ALL_STATUSES.map(status => {
                    const c = statusConfig[status];
                    const active = enquiry.status === status;
                    return (
                      <button 
                        key={status} 
                        onClick={() => !active && handleStatusChange(status)}
                        disabled={active || statusChanging}
                        style={{ 
                          padding: '12px 16px', 
                          borderRadius: '10px', 
                          border: active ? `2px solid ${c.dot}` : '2px solid #e2e8f0', 
                          background: active ? c.bg : 'white', 
                          color: active ? c.color : '#64748b', 
                          fontSize: '13px', 
                          fontWeight: '800', 
                          cursor: active || statusChanging ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          opacity: statusChanging && !active ? 0.5 : 1
                        }}
                      >
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.dot }} />
                        {status}
                        {active && <span style={{ marginLeft: 'auto', fontSize: '16px' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </InfoCard>

              {/* Timeline Card */}
              <InfoCard icon="⏱️" title="Timeline">
                <InfoRow label="Created" value={formatDateTime(enquiry.createdAt)} icon="📅" />
                <InfoRow label="Last Updated" value={formatDateTime(enquiry.updatedAt)} icon="🔄" />
                <InfoRow label="Submitted" value={formatDateTime(enquiry.submittedAt)} icon="✅" />
                {enquiry.isConverted && (
                  <InfoRow label="Converted to Student" value={formatDateTime(enquiry.admittedAt)} icon="🎉" />
                )}
              </InfoCard>

              {/* Admin Notes */}
              <InfoCard icon="📝" title="Admin Notes">
                <div style={{ 
                  padding: '16px', 
                  background: enquiry.adminNotes ? '#f8fafc' : '#f1f5f9', 
                  borderRadius: '10px',
                  fontSize: '14px', 
                  color: enquiry.adminNotes ? '#051d24' : '#94a3b8', 
                  fontWeight: '600',
                  lineHeight: '1.6'
                }}>
                  {enquiry.adminNotes || 'No notes added yet'}
                </div>
              </InfoCard>

              {/* Audit Trail */}
              {enquiry.auditTrail && enquiry.auditTrail.length > 0 && (
                <InfoCard icon="📜" title="Audit Trail">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                    {[...enquiry.auditTrail].reverse().slice(0, 10).map((entry, idx) => (
                      <div key={entry._id || idx} style={{ 
                        padding: '16px', 
                        background: '#f8fafc', 
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {/* Entry header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#051d24' }}>
                            {entry.note || 'Updated'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                            {formatDateTime(entry.changedAt)}
                          </span>
                        </div>

                        {/* Changed fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {entry.changedFields.map(field => {
                            const before = entry.beforeValues?.[field];
                            const after = entry.afterValues?.[field];
                            const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());

                            const isEmpty = (v) => v === null || v === undefined || v === '' || v === 'null';
                            if (isEmpty(before) && isEmpty(after)) return null;
                            if (areAuditValuesEqual(before, after, field)) return null;

                            return (
                              <div key={field} style={{ 
                                padding: '10px', 
                                background: 'white', 
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>{label}</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                                  <span style={{ color: '#ef4444', textDecoration: 'line-through', flex: 1, wordBreak: 'break-word' }}>
                                    {typeof before === 'object' ? JSON.stringify(before) : (before || '—')}
                                  </span>
                                  <span style={{ color: '#94a3b8', fontWeight: '700' }}>→</span>
                                  <span style={{ color: '#22c55e', fontWeight: '700', flex: 1, wordBreak: 'break-word' }}>
                                    {typeof after === 'object' ? JSON.stringify(after) : (after || '—')}
                                  </span>
                                </div>
                              </div>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
