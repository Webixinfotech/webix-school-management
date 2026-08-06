import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { getMyProfileAPI } from '../../api/teachers';
import {
  getEnquiryStats,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  updateEnquiryStatus,
  convertEnquiryToStudent,
} from '../../api/enquiries';
import { getClassesAPI } from '../../api/classes';
import Toast from '../../components/photos/Toast';

// ── Service map (keep as-is) ─────────────────────────────────────────────────
const serviceMap = {
  school:           { label: 'School',           color: '#E82928', icon: '🏫' },
  daycare:          { label: 'Daycare',          color: '#F28E3A', icon: '🧸' },
  evening_club:     { label: 'Evening Kids Club',color: '#29A9E1', icon: '🎨' },
  talent_course:    { label: 'Talent Course',    color: '#16a34a', icon: '⭐' },
  teachers_training:{ label: 'Teachers Training',color: '#0B3A64', icon: '📚' },
  job:              { label: 'Job',              color: '#8B5CF6', icon: '💼' },
  others:           { label: 'Others',           color: '#EC4899', icon: '✨' },
  english_speaking_kids: { label: 'English Speaking Course', color: '#29A9E1', icon: '🗣️' },
  phonics_vocab:    { label: 'Phonics and English Vocab', color: '#10B981', icon: '🔤' },
  personality_dev: { label: 'Personality Development', color: '#F59E0B', icon: '🌟' },
  library:          { label: 'Library',          color: '#0EA5E9', icon: '🏛️' },
  reading_library:  { label: 'Reading Library',  color: '#0891B2', icon: '📖' },
};

// ── Full Service Display Map (includes all frontend form service IDs) ───────
const fullServiceDisplayMap = {
  // KIDS services - Multicolour tags (Gradient rainbow colors)
  school:           { label: 'School',           color: 'linear-gradient(135deg, #E82928, #F28E3A)', icon: '🏫', isKids: true },
  daycare:          { label: 'Daycare',          color: 'linear-gradient(135deg, #F28E3A, #FBBF24)', icon: '🧸', isKids: true },
  evening_club:     { label: 'Evening Kids Club',color: 'linear-gradient(135deg, #29A9E1, #06B6D4)', icon: '🎨', isKids: true },
  book_writing:     { label: 'Book Writing',     color: 'linear-gradient(135deg, #16a34a, #10B981)', icon: '📖', isKids: true },
  drawing:          { label: 'Drawing/Art & Craft',color: 'linear-gradient(135deg, #8B5CF6, #A855F7)', icon: '✏️', isKids: true },
  workshops_kids:   { label: 'Workshops',        color: 'linear-gradient(135deg, #EC4899, #F472B6)', icon: '🎭', isKids: true },
  others_kids:      { label: 'Others',           color: 'linear-gradient(135deg, #0B3A64, #3B82F6)', icon: '✨', isKids: true },
  english_speaking_kids: { label: 'English Speaking Course', color: 'linear-gradient(135deg, #29A9E1, #06B6D4)', icon: '🗣️', isKids: true },
  phonics_vocab:    { label: 'Phonics and English Vocab', color: 'linear-gradient(135deg, #10B981, #34D399)', icon: '🔤', isKids: true },
  personality_dev:   { label: 'Personality Development', color: 'linear-gradient(135deg, #F59E0B, #FBBF24)', icon: '🌟', isKids: true },
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

// ── Status config (added Rejected) ───────────────────────────────────────────
const statusConfig = {
  New:       { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  Contacted: { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  Visited:   { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  Admitted:  { bg: '#f0fdf4', color: '#14532d', dot: '#16a34a' },
  Rejected:  { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
};

const ALL_STATUSES = ['All', 'New', 'Contacted', 'Visited', 'Admitted', 'Rejected'];

const LIMIT = 20;

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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

// ── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{ height: '14px', borderRadius: '6px', background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
        </td>
      ))}
    </tr>
  );
}

// ── Detail Drawer ────────────────────────────────────────────────────────────
function EnquiryDrawer({ enquiry, onClose, onStatusChange, onUpdate, onDeleteRequest, onConvert }) {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (enquiry && enquiry !== null) {
      setEditData({
        childName: enquiry.childName || '',
        childDob: enquiry.childDob ? enquiry.childDob.split('T')[0] : '',
        childGender: enquiry.childGender || '',
        applicantName: enquiry.applicantName || '',
        position: enquiry.position || '',
        qualification: enquiry.qualification || '',
        experience: enquiry.experience || '',
        currentSalary: enquiry.currentSalary || '',
        expectedSalary: enquiry.expectedSalary || '',
        fatherName: enquiry.fatherName || '',
        fatherMobile: enquiry.fatherMobile || '',
        fatherDob: enquiry.fatherDob ? enquiry.fatherDob.split('T')[0] : '',
        fatherEmail: enquiry.fatherEmail || '',
        motherName: enquiry.motherName || '',
        motherMobile: enquiry.motherMobile || '',
        motherDob: enquiry.motherDob ? enquiry.motherDob.split('T')[0] : '',
        motherEmail: enquiry.motherEmail || '',
        address: enquiry.address || '',
        visitPreference: enquiry.visitPreference || 'visit',
        preferredDate: enquiry.preferredDate ? enquiry.preferredDate.split('T')[0] : '',
        preferredTime: Array.isArray(enquiry.preferredTime) ? enquiry.preferredTime : (enquiry.preferredTime ? [enquiry.preferredTime] : []),
        callbackPreferredDate: enquiry.callbackPreferredDate ? enquiry.callbackPreferredDate.split('T')[0] : '',
        callbackPreferredTime: Array.isArray(enquiry.callbackPreferredTime) ? enquiry.callbackPreferredTime : [],
        referredBySource: enquiry.referredBySource || '',
        referralName: enquiry.referralName || '',
        referralMobile: enquiry.referralMobile || '',
        message: enquiry.message || '',
        adminNotes: enquiry.adminNotes || '',
        status: enquiry.status || 'New',
      });
      setEditing(false);
    }
  }, [enquiry]);

  if (!enquiry) return null;
  const sc = statusConfig[enquiry.status];
  // Treat these service keys as "student/kids" services — if any selected, allow conversion
  const kidServiceKeys = new Set([
    'school', 'daycare', 'evening_club', 'book_writing', 'drawing', 'workshops_kids', 'others_kids',
    'english_speaking_kids', 'phonics_vocab', 'personality_dev', 'talent_course', 'library'
  ]);
  const hasStudentService = (enquiry.services || []).some(s => kidServiceKeys.has(s));
  const canConvert = hasStudentService && !enquiry.isConverted && (enquiry.status === 'Visited' || enquiry.status === 'Admitted');
  const canDelete = !enquiry.isConverted;

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await onUpdate(enquiry._id, editData);
      setEditing(false);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }} onClick={onClose}>
      <div style={{ flex: 1, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }} />
      <div
        style={{ width: '100%', maxWidth: '520px', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ animation: 'spin 1s linear infinite' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E82928"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #E82928, #F28E3A)', padding: '24px', color: 'white', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', opacity: 0.85, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Enquiry Detail</p>
                  <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '4px 0 0', fontFamily: 'Nunito, sans-serif' }}>
                    {(enquiry.type === 'job' || enquiry.type === 'course') ? (enquiry.applicantName || enquiry.fatherName) : (enquiry.childName || 'N/A')}
                  </h2>
                  <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '4px' }}>
                    ID: {enquiry.enquiryId || enquiry._id.slice(-6)} · {formatDate(enquiry.createdAt)} {formatTime(enquiry.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {/* Edit button */}
                  <button 
                    onClick={() => setEditing(!editing)} 
                    disabled={!enquiry}
                    style={{ 
                      background: editing ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)', 
                      border: 'none', 
                      borderRadius: '10px', 
                      padding: '8px', 
                      cursor: !enquiry ? 'not-allowed' : 'pointer', 
                      color: 'white', 
                      lineHeight: 0,
                      transition: 'background 0.2s',
                      opacity: !enquiry ? 0.5 : 1
                    }}
                    title={editing ? "Cancel Editing" : "Edit Enquiry"}
                  >
                    {editing ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    )}
                  </button>
                  <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', color: 'white', lineHeight: 0 }}>
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              {/* Services */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                {(enquiry.services || []).map(s => {
                  const sv = fullServiceDisplayMap[s] || serviceMap[s] || { label: s, color: '#64748B', icon: '❓' };
                  const isGradient = String(sv.color).includes('gradient');
                  return (
                    <span 
                      key={s} 
                      style={{ 
                        padding: '3px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        background: sv.color,
                        color: 'white',
                        boxShadow: isGradient ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      {sv.icon} {sv.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Status changer */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>Status:</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ALL_STATUSES.filter(s => s !== 'All').map(s => {
                  const c = statusConfig[s];
                  const active = enquiry.status === s;
                  return (
                    <button key={s} onClick={() => onStatusChange(enquiry._id, s)}
                      style={{ padding: '4px 12px', borderRadius: '20px', border: active ? 'none' : `1.5px solid ${c.dot}`, background: active ? c.bg : 'white', color: active ? c.color : c.dot, fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'Nunito, sans-serif' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {editing ? (
                /* ════════════════ EDIT FORM ════════════════ */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'linear-gradient(135deg, rgba(232,41,40,0.05), rgba(242,142,58,0.05))', borderRadius: '12px', border: '1px solid rgba(232,41,40,0.2)' }}>
                    <span style={{ fontSize: '16px' }}>✏️</span>
                    <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>Editing Enquiry</span>
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Fill fields below and click Save</span>
                  </div>

                  {/* Status */}
                  <DrawerSection title="📊 Status">
                    <select 
                      value={editData.status || 'New'} 
                      onChange={e => handleEditChange('status', e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b', background: 'white' }}
                    >
                      {ALL_STATUSES.filter(s => s !== 'All').map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </DrawerSection>

                  {/* Contact */}
                  <DrawerSection title="📞 Contact">
                    <div style={{ padding: '10px', background: '#f1f5f9', borderRadius: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{enquiry.mobile}</span>
                    </div>
                  </DrawerSection>

                  {/* Child Info - shown for 'child' and 'both' types */}
                  {(enquiry.type === 'child' || enquiry.type === 'both') && (
                    <DrawerSection title="🧒 Child Information">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Child Name</label>
                          <input
                            type="text"
                            value={editData.childName || ''}
                            onChange={e => handleEditChange('childName', e.target.value)}
                            placeholder="Child's full name"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Child DOB</label>
                          <input
                            type="date"
                            value={editData.childDob || ''}
                            onChange={e => handleEditChange('childDob', e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Gender</label>
                          <select
                            value={editData.childGender || ''}
                            onChange={e => handleEditChange('childGender', e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          >
                            <option value="">Select Gender</option>
                            <option value="Boy">👦 Boy</option>
                            <option value="Girl">👧 Girl</option>
                          </select>
                        </div>
                      </div>
                    </DrawerSection>
                  )}

                  {/* Job Info - shown for 'job' and 'both' types */}
                  {(enquiry.type === 'job' || enquiry.type === 'both') && (
                    <DrawerSection title="💼 Job Application">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Applicant Name</label>

                  {/* Course Info - shown for 'course' type */}
                  {enquiry.type === 'course' && (
                    <DrawerSection title="📚 Course Information">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Applicant Name</label>
                          <input type="text" className="bb-input-plain" style={{ padding: '8px 12px' }}
                            value={editData.applicantName || ''}
                            onChange={e => handleEditChange('applicantName', e.target.value)}
                          />
                        </div>
                      </div>
                    </DrawerSection>
                  )}
                          <input
                            type="text"
                            value={editData.applicantName || ''}
                            onChange={e => handleEditChange('applicantName', e.target.value)}
                            placeholder="Full name"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Position</label>
                          <select
                            value={editData.position || ''}
                            onChange={e => handleEditChange('position', e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          >
                            <option value="">Select Position</option>
                            <option value="Teaching">Teaching</option>
                            <option value="Non-Teaching">Non-Teaching</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Qualification</label>
                          <input
                            type="text"
                            value={editData.qualification || ''}
                            onChange={e => handleEditChange('qualification', e.target.value)}
                            placeholder="e.g. B.Ed, M.A."
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Experience</label>
                          <input
                            type="text"
                            value={editData.experience || ''}
                            onChange={e => handleEditChange('experience', e.target.value)}
                            placeholder="e.g. 5 years"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Current Salary</label>
                          <input
                            type="text"
                            value={editData.currentSalary || ''}
                            onChange={e => handleEditChange('currentSalary', e.target.value)}
                            placeholder="e.g. 25000"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Expected Salary</label>
                          <input
                            type="text"
                            value={editData.expectedSalary || ''}
                            onChange={e => handleEditChange('expectedSalary', e.target.value)}
                            placeholder="e.g. 35000"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                      </div>
                    </DrawerSection>
                  )}

                  {/* Parent Info - shown for 'child' and 'both' types */}
                  {(enquiry.type === 'child' || enquiry.type === 'both') && (
                    <DrawerSection title="👨‍👩‍👧 Parent Information">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Father Name *</label>
                          <input 
                            type="text" 
                            value={editData.fatherName || ''} 
                            onChange={e => handleEditChange('fatherName', e.target.value)}
                            placeholder="Father's name"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Father Mobile *</label>
                          <input 
                            type="text" 
                            value={editData.fatherMobile || ''} 
                            onChange={e => handleEditChange('fatherMobile', e.target.value)}
                            placeholder="Mobile number"
                            maxLength={10}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Father DOB</label>
                          <input 
                            type="date" 
                            value={editData.fatherDob || ''} 
                            onChange={e => handleEditChange('fatherDob', e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Father Email</label>
                          <input 
                            type="email" 
                            value={editData.fatherEmail || ''} 
                            onChange={e => handleEditChange('fatherEmail', e.target.value)}
                            placeholder="email@example.com"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div style={{ height: '1px', background: '#e2e8f0', margin: '8px 0' }} />
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Mother Name</label>
                          <input 
                            type="text" 
                            value={editData.motherName || ''} 
                            onChange={e => handleEditChange('motherName', e.target.value)}
                            placeholder="Mother's name"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Mother Mobile</label>
                          <input 
                            type="text" 
                            value={editData.motherMobile || ''} 
                            onChange={e => handleEditChange('motherMobile', e.target.value)}
                            placeholder="Mobile number"
                            maxLength={10}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Mother DOB</label>
                          <input 
                            type="date" 
                            value={editData.motherDob || ''} 
                            onChange={e => handleEditChange('motherDob', e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Mother Email</label>
                          <input 
                            type="email" 
                            value={editData.motherEmail || ''} 
                            onChange={e => handleEditChange('motherEmail', e.target.value)}
                            placeholder="email@example.com"
                            style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                          />
                        </div>
                      </div>
                    </DrawerSection>
                  )}

                  {/* Address */}
                  <DrawerSection title="📍 Address">
                    <textarea 
                      value={editData.address || ''} 
                      onChange={e => handleEditChange('address', e.target.value)}
                      placeholder="Full address"
                      rows={2}
                      style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b', resize: 'vertical' }}
                    />
                  </DrawerSection>

                  {/* Visit Details */}
                  <DrawerSection title="📅 Visit Details">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Visit Preference</label>
                        <select 
                          value={editData.visitPreference || 'visit'} 
                          onChange={e => handleEditChange('visitPreference', e.target.value)}
                          style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b', background: 'white' }}
                        >
                          <option value="visit">Visit Center</option>
                          <option value="callback">Request Callback</option>
                        </select>
                      </div>
                      {editData.visitPreference === 'visit' ? (
                        <>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Preferred Date</label>
                            <input 
                              type="date" 
                              value={editData.preferredDate || ''} 
                              onChange={e => handleEditChange('preferredDate', e.target.value)}
                              style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                            />
                          </div>
                           <div>
                             <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', display: 'block' }}>Preferred Time</label>
                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                               {[
                                 'Morning 9am to 12pm',
                                 'Noon 12pm to 3pm',
                                 'Afternoon 3pm to 6pm',
                                 'Evening 6pm to 9pm'
                               ].map(time => {
                                 const isSelected = (editData.preferredTime || []).includes(time);
                                 return (
                                   <button
                                     key={time}
                                     type="button"
                                     onClick={() => {
                                       const current = editData.preferredTime || [];
                                       const newTimes = isSelected
                                         ? current.filter(t => t !== time)
                                         : [...current, time];
                                       handleEditChange('preferredTime', newTimes);
                                     }}
                                     style={{
                                       padding: '12px 8px',
                                       borderRadius: '12px',
                                       border: '1px solid rgba(255,255,255,0.2)',
                                       background: isSelected
                                         ? 'rgba(59,130,246,0.15)'
                                         : 'rgba(255,255,255,0.1)',
                                       backdropFilter: 'blur(10px)',
                                       color: isSelected ? '#3b82f6' : '#64748b',
                                       fontSize: '12px',
                                       fontWeight: '600',
                                       fontFamily: 'Nunito, sans-serif',
                                       cursor: 'pointer',
                                       transition: 'all 0.2s ease',
                                       boxShadow: isSelected
                                         ? '0 4px 12px rgba(59,130,246,0.2)'
                                         : '0 2px 8px rgba(0,0,0,0.05)',
                                       textAlign: 'center',
                                       whiteSpace: 'nowrap',
                                       overflow: 'hidden',
                                       textOverflow: 'ellipsis',
                                     }}
                                     onMouseEnter={e => {
                                       if (!isSelected) {
                                         e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                         e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                                       }
                                     }}
                                     onMouseLeave={e => {
                                       if (!isSelected) {
                                         e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                         e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                       }
                                     }}
                                   >
                                     {time}
                                   </button>
                                 );
                               })}
                             </div>
                             {(!editData.preferredTime || editData.preferredTime.length === 0) && (
                               <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px' }}>⚠ Please select at least one preferred time slot</p>
                             )}
                           </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Callback Preferred Date</label>
                            <input 
                              type="date" 
                              value={editData.callbackPreferredDate || ''} 
                              onChange={e => handleEditChange('callbackPreferredDate', e.target.value)}
                              style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Callback Preferred Time</label>
                            <input 
                              type="text" 
                              value={Array.isArray(editData.callbackPreferredTime) ? editData.callbackPreferredTime.join(', ') : ''} 
                              onChange={e => handleEditChange('callbackPreferredTime', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                              placeholder="Morning 9am to 12pm, Afternoon 3pm to 6pm"
                              style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b' }}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Message / Notes</label>
                        <textarea 
                          value={editData.message || ''} 
                          onChange={e => handleEditChange('message', e.target.value)}
                          placeholder="Additional notes"
                          rows={2}
                          style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b', resize: 'vertical' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px', display: 'block' }}>Admin Notes</label>
                        <textarea 
                          value={editData.adminNotes || ''} 
                          onChange={e => handleEditChange('adminNotes', e.target.value)}
                          placeholder="Internal admin notes"
                          rows={3}
                          style={{ width: '100%', padding: '10px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', color: '#1e293b', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  </DrawerSection>

                  {/* Save/Cancel buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleSaveEdit} 
                      disabled={saving}
                      style={{ 
                        flex: 1,
                        padding: '14px', 
                        background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #22c55e, #16a34a)', 
                        border: 'none', 
                        borderRadius: '12px', 
                        color: 'white', 
                        fontSize: '14px', 
                        fontWeight: '800', 
                        cursor: saving ? 'not-allowed' : 'pointer', 
                        fontFamily: 'Nunito, sans-serif',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      {saving ? (
                        <>
                          <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          Save Changes
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => setEditing(false)} 
                      disabled={saving}
                      style={{ 
                        flex: 1,
                        padding: '14px', 
                        background: '#f1f5f9', 
                        border: 'none', 
                        borderRadius: '12px', 
                        color: '#64748b', 
                        fontSize: '14px', 
                        fontWeight: '800', 
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontFamily: 'Nunito, sans-serif'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>  
              {/* Converted badge */}
              {enquiry.isConverted && (
                <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '14px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>✅</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#166534' }}>Converted to Student — Admission No: {enquiry.studentId?.admissionNo || enquiry.studentInfo?.admissionNo || 'N/A'}</span>
                </div>
              )}

              {/* Contact */}
              <DrawerSection title="📞 Contact">
                <Row label="Enquiry Mobile " value={enquiry.mobile} isPhone />
              </DrawerSection>

              {/* Child Information - shown for 'child' and 'both' types */}
              {(enquiry.type === 'child' || enquiry.type === 'both') && (
                <DrawerSection title="🧒 Child Information">
                  <Row label="Name"    value={enquiry.childName} />
                  <Row label="DOB"     value={enquiry.childDob ? `${formatDate(enquiry.childDob)} (${calcAge(enquiry.childDob)})` : '—'} />
                  <Row label="Gender"  value={enquiry.childGender} />
                </DrawerSection>
              )}

              {/* Job Application - shown for 'job' and 'both' types */}
              {(enquiry.type === 'job' || enquiry.type === 'both') && (
                <DrawerSection title="💼 Job Application">
                  <Row label="Name"            value={enquiry.applicantName || enquiry.fatherName} />

              {/* Course Information - shown for 'course' type */}
              {enquiry.type === 'course' && (
                <DrawerSection title="📚 Course Information">
                  <Row label="Name"            value={enquiry.applicantName || enquiry.fatherName} />
                </DrawerSection>
              )}
                  <Row label="Applying For"    value={enquiry.position} />
                  <Row label="Qualification"   value={enquiry.qualification} />
                  {enquiry.experience    && <Row label="Experience"       value={enquiry.experience} />}
                  {enquiry.currentSalary && <Row label="Current Salary"   value={`₹${Number(enquiry.currentSalary).toLocaleString()}/mo`} />}
                  {enquiry.expectedSalary && <Row label="Expected Salary" value={`₹${Number(enquiry.expectedSalary).toLocaleString()}/mo`} />}
                </DrawerSection>
              )}

              {/* Parent info - shown for 'child' and 'both' types */}
              {(enquiry.type === 'child' || enquiry.type === 'both') && (
                <DrawerSection title="👨‍👩‍👧 Parent Information">
                  {enquiry.fatherName   && <Row label="Father"        value={enquiry.fatherName} />}
                  {enquiry.fatherMobile && <Row label="Father Mobile" value={enquiry.fatherMobile} isPhone />}
                  {enquiry.fatherEmail  && <Row label="Father Email"  value={enquiry.fatherEmail} />}
                  {enquiry.motherName   && <Row label="Mother"        value={enquiry.motherName} />}
                  {enquiry.motherMobile && <Row label="Mother Mobile" value={enquiry.motherMobile} isPhone />}
                  {enquiry.motherEmail  && <Row label="Mother Email"  value={enquiry.motherEmail} />}
                </DrawerSection>
              )}

              {/* Visit details */}
              <DrawerSection title="📅 Visit Details">
                <Row label="Visit Preference" value={enquiry.visitPreference === 'callback' ? 'Request Callback' : 'Visit Center'} />
                {enquiry.visitPreference === 'visit' ? (
                  <>
                    <Row label="Preferred Date" value={enquiry.preferredDate ? formatDate(enquiry.preferredDate) : '—'} />
                    <Row label="Preferred Time" value={Array.isArray(enquiry.preferredTime) ? enquiry.preferredTime.join(', ') : enquiry.preferredTime} />
                  </>
                ) : (
                  <>
                    <Row label="Callback Date" value={enquiry.callbackPreferredDate ? formatDate(enquiry.callbackPreferredDate) : '—'} />
                    <Row label="Callback Time" value={enquiry.callbackPreferredTime} />
                  </>
                )}
                {enquiry.address && <Row label="Address" value={enquiry.address} />}
                {enquiry.message && <Row label="Message" value={enquiry.message} />}
              </DrawerSection>

              {/* Admin Notes */}
              <DrawerSection title="📝 Admin Notes">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', color: enquiry.adminNotes ? '#1e293b' : '#94a3b8', fontWeight: '600', flex: 1 }}>
                    {enquiry.adminNotes || 'No notes added yet'}
                  </span>
                </div>
              </DrawerSection>

              {/* Assigned To */}
              <DrawerSection title="👤 Assigned To">
                <Row label="Staff" value={enquiry.assignedTo?.name || 'Unassigned'} />
              </DrawerSection>

              {/* Audit Trail */}
              {enquiry.auditTrail && enquiry.auditTrail.length > 0 && (
                <DrawerSection title="📜 Audit Trail">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    {[...enquiry.auditTrail].reverse().map((entry, idx) => (
                      <div key={entry._id || idx} style={{ padding: '12px', background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        {/* Entry header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: '#1e293b' }}>
                            {entry.note || 'Updated'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                            {new Date(entry.changedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Changed fields */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {entry.changedFields.map(field => {
                            const before = entry.beforeValues?.[field];
                            const after = entry.afterValues?.[field];
                            const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
                            
                            const isEmpty = (v) => v === null || v === undefined || v === '' || v === 'null';
                            if (isEmpty(before) && isEmpty(after)) return null;
                            if (areAuditValuesEqual(before, after, field)) return null;

                            return (
                              <div key={field} style={{ fontSize: '11px', padding: '6px 8px', background: '#f8fafc', borderRadius: '6px' }}>
                                <div style={{ fontWeight: '700', color: '#64748b', marginBottom: '2px' }}>{label}</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: '#ef4444', textDecoration: 'line-through', flex: 1, wordBreak: 'break-word' }}>
                                    {typeof before === 'object' ? JSON.stringify(before) : (before || '—')}
                                  </span>
                                  <span style={{ color: '#94a3b8' }}>→</span>
                                  <span style={{ color: '#22c55e', fontWeight: '600', flex: 1, wordBreak: 'break-word' }}>
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
                </DrawerSection>
              )}
                </>
              )}
            </div>

            {/* Footer actions */}
            {!editing && (
            <div style={{ padding: '16px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
              {canConvert && (
                <button onClick={() => onConvert(enquiry)}
                  style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                  Convert to Student
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDeleteRequest(enquiry._id, enquiry.enquiryId || enquiry.mobile || 'this enquiry')}
                  style={{ width: '100%', padding: '10px', background: 'white', border: '2px solid #ef4444', borderRadius: '10px', color: '#ef4444', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Enquiry
                </button>
              )}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DrawerSection({ title, children }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div style={{ padding: '10px 14px', background: 'white', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{title}</span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</div>
    </div>
  );
}

function Row({ label, value, isPhone }) {
  const waNumber = value ? String(value).replace(/\D/g, '') : '';
  const finalWaNumber = waNumber.length === 10 ? '91' + waNumber : waNumber;

  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '13px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <span style={{ color: '#94a3b8', fontWeight: '600', minWidth: '110px', flexShrink: 0, marginTop: '4px' }}>{label}</span>
      <span style={{ color: '#1e293b', fontWeight: '700', wordBreak: 'break-word', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
        <span style={{ marginTop: '4px' }}>{value || '—'}</span>
        {isPhone && value && value !== '—' && (
          <>
            <a href={`tel:${value}`} title={`Call ${value}`} onClick={e => e.stopPropagation()} className="contact-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'linear-gradient(135deg, #10B981, #059669)', color: '#ffffff', textDecoration: 'none', fontWeight: '800', fontSize: '11px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span className="contact-btn-text">CALL</span>
            </a>
            <a href={`https://wa.me/${finalWaNumber}`} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${value}`} onClick={e => e.stopPropagation()} className="contact-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#ffffff', textDecoration: 'none', fontWeight: '800', fontSize: '11px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)', whiteSpace: 'nowrap' }}>
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              <span className="contact-btn-text">WHATSAPP</span>
            </a>
          </>
        )}
      </span>
    </div>
  );
}

// ── Convert Modal ────────────────────────────────────────────────────────────
function ConvertModal({ enquiry, onClose, onConvert }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      setClassesLoading(true);
      try {
        const res = await getClassesAPI({ limit: 100 });
        const d = res;
        const mapped = (d.data || []).map(c => ({
          id: c._id,
          name: c.name || '',
          section: c.section || '',
        }));
        setClasses(mapped);
        console.log('✅ Classes loaded:', mapped.length, mapped);
      } catch (err) {
        console.error('❌ Failed to fetch classes in ConvertModal:', err);
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleConvert = async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await convertEnquiryToStudent(enquiry._id, {
        password,
        className: selectedClass || undefined,
        section: section || undefined,
        rollNo: rollNo || undefined,
      });
      
      if (!res.success) {
        throw new Error(res.error || 'Failed to convert enquiry');
      }
      
      setResult(res.data);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to convert enquiry. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const childName = enquiry.childName || 'N/A';
  const fatherName = enquiry.fatherName || '—';
  const fatherEmail = enquiry.fatherEmail || '';
  const fatherMobile = enquiry.fatherMobile || '';
  const motherName = enquiry.motherName || '';
  const motherMobile = enquiry.motherMobile || '';
  const parentEmail = enquiry.fatherEmail || enquiry.motherEmail || 'N/A';
  const loginEmail = result?.loginCredentials?.email || parentEmail;
  const admissionNo = result?.student?.admissionNo || '—';
  const studentFullName = result?.student?.fullName || childName;

  const fmtWA = (p) => { const c = p?.replace(/\D/g,'') || ''; return c.startsWith('91') && c.length > 2 ? c : c.length === 10 ? '91'+c : c; };
  const credentialsMsg = `*BrainBuilder Parent Login*\n\n👤 Student: ${studentFullName}\n🎫 Admission No: ${admissionNo}\n📧 Email: ${loginEmail}\n🔑 Password: ${password}\n\n*Save these credentials!*`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }} onClick={!result ? undefined : onClose} />
      <div style={{ position: 'relative', background: 'white', borderRadius: '24px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {result ? (
          /* ── Success Panel ── */
          <div style={{ padding: '28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(34,197,94,0.3)' }}>
                <svg width="32" height="32" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b', margin: '0 0 6px', fontFamily: 'Nunito, sans-serif' }}>Student Created!</h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0', fontFamily: 'Nunito, sans-serif' }}>{studentFullName}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0', fontFamily: 'monospace' }}>Admission No: {admissionNo}</p>
            </div>

            {/* Warning */}
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <svg width="15" height="15" fill="none" stroke="#D97706" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '1px' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p style={{ margin: 0, fontSize: '12px', color: '#92400E', fontWeight: '600', fontFamily: 'Nunito, sans-serif' }}>Share with parent.....</p>
            </div>

            {/* Share Credentials Button */}
            <button onClick={() => setShowShare(!showShare)} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #10B981', background: '#F0FDF4', color: '#059669', fontWeight: '700', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'Nunito, sans-serif', marginBottom: '14px' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              Share Credentials {showShare ? '▲' : '▼'}
            </button>

            {showShare && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {/* WhatsApp buttons */}
                {fatherMobile && fatherMobile.length >= 10 && (
                  <a href={`https://wa.me/${fmtWA(fatherMobile)}?text=${encodeURIComponent(credentialsMsg)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Father</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{fatherName} · {fatherMobile}</p>
                    </div>
                  </a>
                )}
                {motherMobile && motherMobile.length >= 10 && (
                  <a href={`https://wa.me/${fmtWA(motherMobile)}?text=${encodeURIComponent(credentialsMsg)}`} target="_blank" rel="noopener noreferrer" style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FAF5FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Mother</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748B' }}>{motherName} · {motherMobile}</p>
                    </div>
                  </a>
                )}
                {/* Email button */}
                {loginEmail && loginEmail !== 'N/A' && (
                  <a href={`mailto:?subject=${encodeURIComponent('BrainBuilder Parent Login - ' + studentFullName)}&body=${encodeURIComponent(credentialsMsg)}`} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                    <svg width="18" height="18" fill="none" stroke="#EA4335" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>Send via Email</span>
                  </a>
                )}
              </div>
            )}

            {/* Credentials Card */}
            <div style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Row label="Student" value={studentFullName} />
                <Row label="Admission No." value={admissionNo} />
                <Row label="Login Email" value={loginEmail} />
                <div style={{ display: 'flex', gap: '8px', fontSize: '13px' }}>
                  <span style={{ color: '#94a3b8', fontWeight: '600', minWidth: '110px', flexShrink: 0 }}>Password</span>
                  <span style={{ color: '#1e293b', fontWeight: '700' }}>As set by admin</span>
                </div>
                {result.referralTracking?.found && (
                  <div style={{ padding: '8px 14px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>✅</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#166534' }}>Referral auto-linked!</span>
                  </div>
                )}
              </div>
            </div>

            <button onClick={onClose} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#0F172A,#1E293B)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              Done
            </button>
          </div>
        ) : (
          /* ── Convert Form ── */
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#8B5CF6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Convert Enquiry</p>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1e293b', margin: '4px 0 0', fontFamily: 'Nunito, sans-serif' }}>Convert to Student</h2>
              </div>
              <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}>
                <svg width="18" height="18" fill="none" stroke="#64748b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Summary */}
            <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(109,40,217,0.05))', borderRadius: '14px', border: '1px solid rgba(139,92,246,0.15)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Row label="Child Name" value={childName} />
                {fatherName !== '—' && <Row label="Father" value={fatherName} />}
                <Row label="Login Email" value={parentEmail} />
              </div>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Min. 6 characters"
                    style={{ width: '100%', padding: '11px 42px 11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1e293b', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#94a3b8' }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Class Dropdown */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Class Name</label>
                <select
                  value={selectedClass}
                  onChange={e => {
                    const val = e.target.value;
                    setSelectedClass(val);
                    // Auto-fill section from class
                    const cls = classes.find(c => c.id === val);
                    if (cls) setSection(cls.section || '');
                  }}
                  style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1e293b', background: 'white', cursor: 'pointer', boxSizing: 'border-box', appearance: 'none' }}
                >
                  <option value="">Select class (optional)</option>
                  {classesLoading ? (
                    <option disabled>Loading classes...</option>
                  ) : classes.length === 0 ? (
                    <option disabled>No classes available</option>
                  ) : classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}{cls.section ? ` — ${cls.section}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Section</label>
                  <input value={section} onChange={e => setSection(e.target.value)} placeholder="Auto-filled or type" style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1e293b', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>Roll Number</label>
                  <input value={rollNo} onChange={e => setRollNo(e.target.value)} placeholder="Optional" style={{ width: '100%', padding: '11px 14px', border: '2px solid #e2e8f0', borderRadius: '12px', fontSize: '14px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1e293b', boxSizing: 'border-box' }} />
                </div>
              </div> */}
            </div>

            {error && (
              <div style={{ marginTop: '14px', padding: '10px 14px', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '10px', color: '#991b1b', fontSize: '13px', fontWeight: '700' }}>{error}</div>
            )}

            <button
              onClick={handleConvert}
              disabled={submitting}
              style={{ width: '100%', marginTop: '20px', padding: '14px', background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '800', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}
            >
              {submitting ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round"/></svg>
                  Converting...
                </>
              ) : 'Confirm Conversion'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminEnquiries() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterService, setFilterService] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [convertModal, setConvertModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [viewMode, setViewMode] = useState(window.innerWidth < 768 ? 'grid' : 'table');
  
  // Sorting state
  const [sortBy, setSortBy] = useState('createdAt'); // Default sort by date
  const [sortOrder, setSortOrder] = useState('desc'); // Default descending

  const searchTimer = useRef(null);

  // ── Toast helper ──
  const showToast = useCallback((message, type = 'error') => {
    setToast({
      type,
      title: type === 'success' ? 'Success' : 'Error',
      message
    });
  }, []);

  // ── Refresh stats helper ──
  const refreshStats = useCallback(async () => {
    try {
      const res = await getEnquiryStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    }
  }, []);

  // ── Fetch stats ──
  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // ── Permission check ──
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyProfileAPI();
        const profile = res?.data?.data || res?.data || res;
        setHasPermission(!!profile?.permissions?.canManageEnquiries);
      } catch (e) {
        setHasPermission(false);
      }
    })();
  }, []);

  // ── Fetch enquiries ──
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    setStatsLoading(true);
    try {
      const params = {
        ...(search && { search }),
        ...(filterStatus !== 'All' && { status: filterStatus }),
        ...(filterType !== 'All' && { type: filterType === 'Child Admission' ? 'child' : 'job' }),
        ...(filterService !== 'All' && { service: filterService }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      };

      // If sorting is active, fetch all data first, then paginate client-side
      // Otherwise use backend pagination
      if (sortBy) {
        params.limit = 1000; // Fetch all filtered data for sorting
      } else {
        params.page = page;
        params.limit = LIMIT;
      }

      const res = await getEnquiries(params);
      let allData = res.data || [];

      // We rely on refreshStats() for the global summary cards and service breakdown.
      // Therefore, we don't overwrite stats with filtered summary.

      // Client-side sorting
      if (sortBy && sortOrder) {
        allData.sort((a, b) => {
          let valA, valB;
          
          // Get values based on sort field
          if (sortBy === 'createdAt') {
            valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          } else if (sortBy === 'preferredDate') {
            valA = a.preferredDate ? new Date(a.preferredDate).getTime() : 0;
            valB = b.preferredDate ? new Date(b.preferredDate).getTime() : 0;
          }
          
          // Apply sort order: asc = oldest first, desc = newest first
          if (sortOrder === 'asc') {
            return valA - valB;
          } else {
            return valB - valA;
          }
        });
      }
      
      // Paginate client-side if sorting is active
      let paginatedData;
      if (sortBy) {
        const totalItems = allData.length;
        const totalPagesCount = Math.ceil(totalItems / LIMIT);
        const startIdx = (page - 1) * LIMIT;
        const endIdx = startIdx + LIMIT;
        paginatedData = allData.slice(startIdx, endIdx);
        
        setTotal(totalItems);
        setTotalPages(totalPagesCount);
      } else {
        paginatedData = allData;
        setTotal(res.data.total);
        setTotalPages(res.data.pages);
      }
      
      setEnquiries(paginatedData);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load enquiries');
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [page, search, filterStatus, filterType, filterService, dateFrom, dateTo, sortBy, sortOrder, showToast, refreshStats]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ── Debounced search ──
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  // ── Filter reset helpers ──
  const hasActiveFilters = search || filterStatus !== 'All' || filterType !== 'All' || filterService !== 'All' || dateFrom || dateTo;
  const clearFilters = () => {
    setSearch('');
    setFilterStatus('All');
    setFilterType('All');
    setFilterService('All');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  // ── Sort handler ──
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle order if same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to descending
      setSortBy(column);
      setSortOrder('desc');
    }
    setPage(1); // Reset to first page on sort change
  };

  // ── Row click: navigate to detail page ──
  const handleRowClick = (enquiry) => {
    navigate(`/teacher/manage-enquiries/${enquiry._id}`);
  };

  // ── Status change ──
  const handleStatusChange = async (id, newStatus) => {
    try {
      const statusRes = await updateEnquiryStatus(id, newStatus);
      
      if (!statusRes.success) {
        throw new Error(statusRes.error || 'Failed to update status');
      }
      
      // Refetch selected detail
      if (selectedDetail?._id === id) {
        const detailRes = await getEnquiryById(id);
        setSelectedDetail(detailRes.data);
      }
      
      // Refresh enquiries and stats
      await fetchEnquiries();
      await refreshStats();
      
      showToast(`Status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to update status');
    }
  };

  // ── Update details (edit / admin notes) ──
  const handleUpdate = async (id, editData) => {
    try {
      const updateData = { ...editData };
      
      if (editData.visitPreference === 'callback') {
        delete updateData.preferredDate;
        delete updateData.preferredTime;
        if (!editData.callbackPreferredTime || !Array.isArray(editData.callbackPreferredTime)) {
          updateData.callbackPreferredTime = [];
        }
      } else {
        delete updateData.callbackPreferredDate;
        delete updateData.callbackPreferredTime;
      }

      // Prevent backend validation errors for empty enum and date fields
      if (updateData.childGender === '') delete updateData.childGender;
      if (updateData.position === '') delete updateData.position;
      if (updateData.childDob === '') delete updateData.childDob;
      if (updateData.fatherDob === '') delete updateData.fatherDob;
      if (updateData.motherDob === '') delete updateData.motherDob;
      if (updateData.preferredDate === '') delete updateData.preferredDate;
      if (updateData.callbackPreferredDate === '') delete updateData.callbackPreferredDate;
      
      const updateRes = await updateEnquiry(id, updateData);
      
      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Failed to update enquiry');
      }
      
      if (selectedDetail?._id === id) {
        const detailRes = await getEnquiryById(id);
        setSelectedDetail(detailRes.data);
      }
      
      // Refresh enquiries and stats
      await fetchEnquiries();
      await refreshStats();
      
      showToast('Enquiry updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Failed to update enquiry');
      throw err;
    }
  };

  // ── Convert open/close ──
  const handleConvertOpen = (enquiry) => setConvertModal(enquiry);
  const handleConvertClose = () => {
    setConvertModal(null);
    setSelectedDetail(null);
    // Refresh enquiries and stats after conversion
    fetchEnquiries();
    refreshStats();
  };

  // ── Filter labels for service dropdown ──
  const serviceOptions = stats?.serviceBreakdown 
    ? Object.keys(stats.serviceBreakdown).map(key => ({
        key,
        ...(fullServiceDisplayMap[key] || serviceMap[key] || { label: key, icon: '' })
      }))
    : Object.entries(serviceMap).map(([key, val]) => ({ key, ...val }));

  if (hasPermission === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 32, background: '#fff', borderRadius: 16, border: '1.5px solid #E9ECF0' }}>
          <Lock size={48} color="#94A3B8" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1E293B', margin: '16px 0 8px' }}>Access Restricted</h2>
          <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>You don't have permission to manage enquiries. Contact an administrator.</p>
          <button onClick={() => navigate('/teacher/manage-enquiries')} style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: '#2563EB', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Back to Enquiries</button>
        </div>
      </div>
    );
  }
  if (hasPermission === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#2563EB' }} /></div>;
  }

  return (
    <div style={{ fontFamily: 'Nunito, sans-serif' }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      {/* ── Toast notification ── */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* ── Convert Modal ── */}
      {convertModal && (
        <ConvertModal
          enquiry={convertModal}
          onClose={handleConvertClose}
          onConvert={handleConvertOpen}
        />
      )}

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @media (max-width: 768px) {
          .enquiry-filt { flex-direction: column !important; align-items: stretch !important; }
          .enquiry-filt > * { width: 100% !important; max-width: 100% !important; flex: 1 1 100% !important; box-sizing: border-box !important; }
          .enquiry-filt-date { flex-direction: column !important; align-items: stretch !important; }
          .enquiry-filt-date > input { width: 100% !important; box-sizing: border-box !important; }
          .enquiry-filt-date > div { width: 100% !important; }
          .enquiry-filt-date > span { text-align: center; }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════ */}
      {/* SUMMARY CARDS — ROW 1: Status                      */}
      {/* ════════════════════════════════════════════════════ */}
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ height: '80px', borderRadius: '16px', background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {[
            { label: 'Total',     value: stats.total ?? 0,      bg: 'linear-gradient(135deg,#E82928,#F28E3A)', color: 'white', status: 'All' },
            { label: 'New',       value: stats.New ?? 0,   bg: '#dbeafe', color: '#1d4ed8', status: 'New' },
            { label: 'Contacted', value: stats.Contacted ?? 0, bg: '#fef9c3', color: '#92400e', status: 'Contacted' },
            { label: 'Visited',   value: stats.Visited ?? 0,   bg: '#dcfce7', color: '#166534', status: 'Visited' },
            { label: 'Admitted',  value: stats.Admitted ?? 0,  bg: '#f0fdf4', color: '#14532d', status: 'Admitted' },
            { label: 'Rejected',  value: stats.Rejected ?? 0,  bg: '#fee2e2', color: '#991b1b', status: 'Rejected' },
          ].map(c => (
            <div
              key={c.label}
              onClick={() => { setFilterStatus(c.status); setPage(1); }}
              style={{ background: c.bg, borderRadius: '16px', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <span style={{ fontSize: '28px', fontWeight: '900', color: c.color, lineHeight: 1 }}>{c.value}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: c.color, opacity: 0.8 }}>{c.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Summary cards — ROW 2: Time stats + Conversion */}
      {statsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: '64px', borderRadius: '16px', background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      ) : stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {[
            { label: 'Today',     value: stats.todayEnquiries ?? 0,       icon: '📅' },
            { label: 'This Week', value: stats.thisWeekEnquiries ?? 0,    icon: '🗓️' },
            { label: 'This Month',value: stats.thisMonthEnquiries ?? 0,   icon: '📆' },
          ].map(c => (
            <div key={c.label} style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>{c.icon}</span>
              <div>
                <span style={{ fontSize: '22px', fontWeight: '900', color: '#1e293b', lineHeight: 1 }}>{c.value}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', display: 'block' }}>{c.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service breakdown pills */}
      {stats && stats.serviceBreakdown && Object.keys(stats.serviceBreakdown).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {Object.entries(stats.serviceBreakdown).map(([key, count]) => {
            const sv = fullServiceDisplayMap[key] || serviceMap[key] || { label: key, color: '#64748B', icon: '❓' };
            const isActive = filterService === key;
            const isGradient = String(sv.color).includes('gradient');
            return (
              <button
                key={key}
                onClick={() => { 
                  if (filterService === key) {
                    setFilterService('All'); 
                  } else {
                    setFilterService(key); 
                  }
                  setPage(1); 
                }}
                style={{
                  padding: '5px 14px', borderRadius: '20px', border: isActive ? '2px solid #1E293B' : 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '700', fontFamily: 'Nunito, sans-serif',
                  background: sv.color,
                  color: 'white',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.transform = ''; }}
              >
                {isActive && <span>✓ </span>}{sv?.icon} {sv?.label || key} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* FILTERS BAR                                          */}
      {/* ════════════════════════════════════════════════════ */}
      <div className="enquiry-filt" style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px 18px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: '180px' }}>
          <svg width="15" height="15" fill="none" stroke="#94a3b8" viewBox="0 0 24 24" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={search} onChange={handleSearchChange}
            placeholder="Search name, mobile, ID…"
            style={{ width: '100%', padding: '9px 12px 9px 36px', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', fontFamily: 'Nunito, sans-serif', outline: 'none', color: '#1e293b', boxSizing: 'border-box' }}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ALL_STATUSES.map(s => {
            const c = s === 'All' ? { dot: '#64748b' } : statusConfig[s];
            return (
              <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
                style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', background: filterStatus === s ? 'linear-gradient(135deg,#E82928,#F28E3A)' : '#f1f5f9', color: filterStatus === s ? 'white' : '#64748b', transition: 'all 0.15s' }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* Type filter */}
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setPage(1); }}
          style={{ padding: '7px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '12px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', color: '#475569', background: 'white', cursor: 'pointer', outline: 'none', flex: '1 1 140px' }}
        >
          <option value="All">All Types</option>
          <option value="Child Admission">Child Admission</option>
          <option value="Job / Training">Job &amp; Training</option>
        </select>

        {/* Service filter */}
        <select
          value={filterService}
          onChange={e => { setFilterService(e.target.value); setPage(1); }}
          style={{ padding: '7px 14px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '12px', fontWeight: '700', fontFamily: 'Nunito, sans-serif', color: '#475569', background: 'white', cursor: 'pointer', outline: 'none', flex: '1 1 140px' }}
        >
          <option value="All">All Services</option>
          {serviceOptions.map(sv => (
            <option key={sv.key} value={sv.key}>{sv.icon} {sv.label}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="enquiry-filt-date" style={{ 
          display: 'flex', 
          gap: '8px', 
          alignItems: 'center',
          padding: '6px 12px',
          borderRadius: '12px',
          background: '#f8fafc',
          border: '2px solid #e2e8f0',
          flexWrap: 'wrap',
          flex: '1 1 300px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" fill="none" stroke="#64748b" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>From</span>
          </div>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            style={{ 
              padding: '6px 10px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0', 
              fontSize: '12px', 
              fontFamily: 'Nunito, sans-serif', 
              color: '#475569', 
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
            }} 
          />
          <span style={{ fontSize: '16px', color: '#E82928', fontWeight: '700' }}>→</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" fill="none" stroke="#64748b" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', whiteSpace: 'nowrap' }}>To</span>
          </div>
          <input 
            type="date" 
            value={dateTo} 
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            style={{ 
              padding: '6px 10px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0', 
              fontSize: '12px', 
              fontFamily: 'Nunito, sans-serif', 
              color: '#475569', 
              outline: 'none',
              background: 'white',
              cursor: 'pointer',
            }} 
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button onClick={clearFilters}
            style={{ padding: '7px 14px', borderRadius: '10px', border: '1.5px solid #E82928', background: 'white', color: '#E82928', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
            ✕ Clear
          </button>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '4px' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', background: viewMode === 'table' ? 'white' : 'transparent', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'table' ? '#1e293b' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              title="Table View"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', background: viewMode === 'grid' ? 'white' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'grid' ? '#1e293b' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              title="Grid View"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700', whiteSpace: 'nowrap' }}>
            {total} result{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════ */}
      {/* TABLE OR GRID                                        */}
      {/* ════════════════════════════════════════════════════ */}
      {viewMode === 'table' ? (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                {['Serial No. & Date', 'Enquirer', 'Services', 'Contact', 'Visit Schedule', 'Status', 'Actions'].map(h => {
                  // Determine if this column is currently sorted
                  const sortColumn = h === 'Serial No. & Date' ? 'createdAt' : h === 'Visit Schedule' ? 'preferredDate' : null;
                  const isSorted = sortBy === sortColumn;
                  const canSort = sortColumn !== null;
                  
                  return (
                    <th 
                      key={h} 
                      onClick={() => canSort && handleSort(sortColumn)}
                      style={{ 
                        padding: '12px 16px', 
                        textAlign: 'left', 
                        fontSize: '11px', 
                        fontWeight: '800', 
                        color: isSorted ? '#E82928' : '#64748b', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.06em', 
                        whiteSpace: 'nowrap',
                        cursor: canSort ? 'pointer' : 'default',
                        userSelect: 'none',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={e => { if (canSort) { e.currentTarget.style.color = '#E82928'; e.currentTarget.style.background = '#fef2f2'; } }}
                      onMouseLeave={e => { if (canSort) { e.currentTarget.style.color = isSorted ? '#E82928' : '#64748b'; e.currentTarget.style.background = 'transparent'; } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {h}
                        {isSorted && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#E82928',
                            fontWeight: '900',
                            animation: 'fadeIn 0.2s ease',
                          }}>
                            {sortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

              {!loading && enquiries.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700' }}>No enquiries found</div>
                    {hasActiveFilters && (
                      <button onClick={clearFilters} style={{ marginTop: '12px', padding: '8px 20px', background: 'linear-gradient(135deg,#E82928,#F28E3A)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                        Clear Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {!loading && enquiries.map((e, i) => {
                const sc = statusConfig[e.status] || statusConfig.New;
                // For 'both' type, show both names or prioritize based on which has data
                let name, sub;
                if (e.type === 'job') {
                  name = e.applicantName || e.fatherName || 'N/A';
                  sub = `${e.position || ''} · ${e.qualification || ''}`;
                } else if (e.type === 'both' || e.type === 'course') {
                  // Show both child and applicant info if available
                  const hasChildData = e.childName;
                  const hasJobData = e.applicantName || e.position;
                  if (hasChildData && hasJobData) {
                    name = `${e.childName} / ${e.applicantName || 'N/A'}`;
                    sub = `Child: ${e.childGender || ''} · Job: ${e.position || ''}`;
                  } else if (hasChildData) {
                    name = e.childName;
                    sub = `${e.childGender || ''} · Age ${calcAge(e.childDob)}`;
                  } else {
                    name = e.applicantName || e.fatherName || 'N/A';
                    sub = `${e.position || ''} · ${e.qualification || ''}`;
                  }
                } else {
                  name = e.childName || 'N/A';
                  sub = `${e.childGender || ''} · Age ${calcAge(e.childDob)}`;
                }
                // Calculate serial number based on page and index
                const serialNumber = ((page - 1) * LIMIT) + i + 1;
                return (
                  <tr key={e._id}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.12s', background: i % 2 === 0 ? 'white' : '#fafafa' }}
                    onMouseEnter={ev => ev.currentTarget.style.background = '#fff7f7'}
                    onMouseLeave={ev => ev.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa'}
                    onClick={() => handleRowClick(e)}
                  >
                    {/* Serial No. & Date */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minWidth: '32px',
                        height: '32px',
                        padding: '0 10px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #E82928, #F28E3A)',
                        color: 'white',
                        fontSize: '13px', 
                        fontWeight: '900',
                        marginBottom: '6px'
                      }}>
                        {serialNumber}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{formatDate(e.createdAt)}</div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{formatTime(e.createdAt)}</div>
                    </td>

                    {/* Enquirer */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: e.type === 'job' ? 'linear-gradient(135deg,#8B5CF6,#6D28D9)' : 'linear-gradient(135deg,#E82928,#F28E3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '14px', flexShrink: 0 }}>
                          {name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b' }}>{name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>{sub}</div>
                          {e.type === 'child' && e.fatherName && (
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>👨 {e.fatherName}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Services */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {(e.services || []).map(s => {
                          const sv = fullServiceDisplayMap[s] || serviceMap[s] || { label: s, color: '#64748B', icon: '❓' };
                          const isGradient = String(sv.color).includes('gradient');
                          return (
                            <span key={s} style={{ 
                              padding: '3px 8px', 
                              borderRadius: '20px', 
                              fontSize: '10px', 
                              fontWeight: '700', 
                              color: 'white', 
                              background: sv.color,
                              whiteSpace: 'nowrap',
                              boxShadow: isGradient ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                            }}>
                              {sv.icon} {sv.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>📱 {e.mobile}</div>
                      {e.fatherEmail && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>✉️ {e.fatherEmail}</div>}
                    </td>

                    {/* Visit */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1e293b' }}>{e.preferredDate ? formatDate(e.preferredDate) : '—'}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>🕐 {Array.isArray(e.preferredTime) ? e.preferredTime.join(', ') : e.preferredTime || '—'}</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: '800', whiteSpace: 'nowrap', width: 'fit-content' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                          {e.status}
                        </span>
                        {e.isConverted && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', fontSize: '10px', fontWeight: '800', whiteSpace: 'nowrap', width: 'fit-content' }}>
                            ✅ Admitted
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={ev => { ev.stopPropagation(); handleRowClick(e); }}
                        style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#E82928,#F28E3A)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '11px', fontWeight: '800', cursor: 'pointer', fontFamily: 'Nunito, sans-serif', whiteSpace: 'nowrap' }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {loading && Array.from({ length: 6 }).map((_, i) => (
             <div key={i} style={{ height: '200px', borderRadius: '16px', background: '#f8fafc', animation: 'pulse 1.5s ease-in-out infinite', border: '1px solid #e2e8f0' }} />
          ))}
          {!loading && enquiries.length === 0 && (
             <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
               <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
               <div style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '700' }}>No enquiries found</div>
               {hasActiveFilters && (
                 <button onClick={clearFilters} style={{ marginTop: '12px', padding: '8px 20px', background: 'linear-gradient(135deg,#E82928,#F28E3A)', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Nunito, sans-serif' }}>
                   Clear Filters
                 </button>
               )}
             </div>
          )}
          {!loading && enquiries.map((e, i) => {
             const sc = statusConfig[e.status] || statusConfig.New;
             let name, sub;
             if (e.type === 'job') {
               name = e.applicantName || e.fatherName || 'N/A';
               sub = `${e.position || ''} · ${e.qualification || ''}`;
             } else if (e.type === 'both' || e.type === 'course') {
               const hasChildData = e.childName;
               const hasJobData = e.applicantName || e.position;
               if (hasChildData && hasJobData) {
                 name = `${e.childName} / ${e.applicantName || 'N/A'}`;
                 sub = `Child: ${e.childGender || ''} · Job: ${e.position || ''}`;
               } else if (hasChildData) {
                 name = e.childName;
                 sub = `${e.childGender || ''} · Age ${calcAge(e.childDob)}`;
               } else {
                 name = e.applicantName || e.fatherName || 'N/A';
                 sub = `${e.position || ''} · ${e.qualification || ''}`;
               }
             } else {
               name = e.childName || 'N/A';
               sub = `${e.childGender || ''} · Age ${calcAge(e.childDob)}`;
             }
             const serialNumber = ((page - 1) * LIMIT) + i + 1;
             
             return (
               <div key={e._id} 
                 onClick={() => handleRowClick(e)}
                 style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                 onMouseEnter={ev => { ev.currentTarget.style.transform = 'translateY(-2px)'; ev.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)'; }}
                 onMouseLeave={ev => { ev.currentTarget.style.transform = ''; ev.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
               >
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: e.type === 'job' ? 'linear-gradient(135deg,#8B5CF6,#6D28D9)' : 'linear-gradient(135deg,#E82928,#F28E3A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '16px', flexShrink: 0 }}>
                       {name.charAt(0)}
                     </div>
                     <div>
                       <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                         {name}
                       </div>
                       <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{sub}</div>
                     </div>
                   </div>
                   <div style={{ padding: '4px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: '800', color: '#64748b' }}>
                     #{serialNumber}
                   </div>
                 </div>

                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                     <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: '800' }}>
                       <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot }} />
                       {e.status}
                     </span>
                     {e.isConverted && (
                       <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '20px', background: '#f0fdf4', color: '#16a34a', fontSize: '11px', fontWeight: '800' }}>
                         ✅ Admitted
                       </span>
                     )}
                   </div>
                   <div style={{ textAlign: 'right' }}>
                     <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569' }}>{formatDate(e.createdAt)}</div>
                     <div style={{ fontSize: '10px', color: '#94a3b8' }}>{formatTime(e.createdAt)}</div>
                   </div>
                 </div>

                 <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                   <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>📱 {e.mobile}</div>
                   {e.fatherEmail && <div style={{ fontSize: '11px', color: '#64748b' }}>✉️ {e.fatherEmail}</div>}
                 </div>

                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                   {(e.services || []).map(s => {
                     const sv = fullServiceDisplayMap[s] || serviceMap[s] || { label: s, color: '#64748B', icon: '❓' };
                     const isGradient = String(sv.color).includes('gradient');
                     return (
                       <span key={s} style={{ 
                         padding: '3px 8px', 
                         borderRadius: '12px', 
                         fontSize: '10px', 
                         fontWeight: '700', 
                         color: 'white', 
                         background: sv.color,
                         boxShadow: isGradient ? '0 1px 4px rgba(0,0,0,0.2)' : 'none',
                       }}>
                         {sv.icon} {sv.label}
                       </span>
                     );
                   })}
                 </div>
               </div>
             );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════ */}
      {/* PAGINATION                                           */}
      {/* ════════════════════════════════════════════════════ */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px', paddingBottom: '20px' }}>
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            style={{ padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: '700', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif', color: page <= 1 ? '#cbd5e1' : '#1e293b' }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#64748b' }}>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: 'white', fontSize: '13px', fontWeight: '700', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontFamily: 'Nunito, sans-serif', color: page >= totalPages ? '#cbd5e1' : '#1e293b' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
