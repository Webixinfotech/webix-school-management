import { useState, useEffect } from 'react';
import { getMyClassesAPI, getClassStudentsAPI } from '../../api/classes';
import { getMyTeacherProfileAPI } from '../../api/teachers';
import {
  Search, Users, AlertCircle, X, LayoutGrid, List,
  Phone, Mail, UserCircle, Clock, MessageCircle, ChevronRight,
  Calendar, Hash, BookOpen, ArrowLeft, GraduationCap, Layers
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const waUrl = (num) => {
  const cleaned = num.replace(/\D/g, '');
  return `https://wa.me/${cleaned.length === 10 ? '91' + cleaned : cleaned}`;
};

// ── Avatar ────────────────────────────────────────────────────────────────────
const StudentAvatar = ({ photo, name, size = 40 }) => {
  const [imgError, setImgError] = useState(false);
  const bgColors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];
  const bg = bgColors[(name?.charCodeAt(0) || 0) % bgColors.length];

  return (
    <div style={{
      width: size, height: size, minWidth: size,
      borderRadius: Math.round(size * 0.28),
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800,
      fontSize: size * 0.38,
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      border: '2px solid rgba(255,255,255,0.4)',
    }}>
      {photo && !imgError
        ? <img src={photo} alt={name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : name?.charAt(0)?.toUpperCase() || 'S'}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => (
  <span style={{
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
    background: status === 'Active' ? '#dcfce7' : '#f1f5f9',
    color: status === 'Active' ? '#16a34a' : '#64748b',
    border: `1px solid ${status === 'Active' ? '#bbf7d0' : '#e2e8f0'}`,
    whiteSpace: 'nowrap',
  }}>{status || 'Active'}</span>
);

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, label, color = '#0f766e', bg = '#f0fdf4', border = '#bbf7d0' }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 14, paddingBottom: 10,
    borderBottom: `2px solid ${border}`,
  }}>
    <div style={{ width: 28, height: 28, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${border}` }}>
      <Icon size={14} color={color} />
    </div>
    <span style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
  </div>
);

// ── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, color = '#0f766e' }) => {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', wordBreak: 'break-word', lineHeight: 1.3 }}>{value}</div>
      </div>
    </div>
  );
};

// ── Stat Tile ─────────────────────────────────────────────────────────────────
const StatTile = ({ label, value, color, bg, border }) => (
  <div style={{ background: bg, borderRadius: 14, padding: '14px 12px', border: `1px solid ${border}`, textAlign: 'center', flex: 1, minWidth: 80 }}>
    <div style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
  </div>
);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const TeacherStudentsPage = () => {
  const [searchTerm, setSearchTerm]         = useState('');
  const [classFilter, setClassFilter]       = useState('');
  const [statusFilter, setStatusFilter]     = useState('All');
  const [viewMode, setViewMode]             = useState('grid');
  const [selectedStudent, setSelectedStudent]           = useState(null);
  const [contactModalStudent, setContactModalStudent]   = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState('');
  const [myClasses, setMyClasses]           = useState([]);
  const [allStudents, setAllStudents]       = useState([]);
  const [permissions, setPermissions]       = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true); setError('');
      try {
        const r = await getMyTeacherProfileAPI();
        setPermissions((r.data?.data || r.data || {}).permissions || {});
      } catch { /* silent */ }

      const classesRes = await getMyClassesAPI();
      const classes = classesRes.data || [];
      setMyClasses(classes);

      const studentsResults = [];
      for (const cls of classes) {
        const res = await getClassStudentsAPI(cls._id || cls.classId).catch(() => ({ data: [] }));
        studentsResults.push(res);
      }

      const map = new Map();
      studentsResults.forEach((res, idx) => {
        const cls       = classes[idx];
        const classData = res.data || {};
        const list      = Array.isArray(classData) ? classData : (classData.data || []);
        const cName     = cls.name || '-';
        const classType = cls.classType || 'FIXED_TIME';

        list.forEach(s => {
          const id = s._id || s.id;
          const pd = s.parentDetails || {};
          const rawC = [
            { label: 'Primary', number: pd.primaryPhone || s.parentPhone || s.phone },
            { label: 'Father',  number: pd.fatherPhone  || s.fatherMobile },
            { label: 'Mother',  number: pd.motherPhone  || s.motherMobile },
          ];
          const contacts = Array.from(new Map(rawC.filter(c => c.number).map(c => [c.number, c])).values());

          if (map.has(id)) {
            const ex = map.get(id);
            if (!ex.classNames.includes(cName)) ex.classNames.push(cName);
          } else {
            map.set(id, {
              ...s,
              name:        s.name || s.fullName || `${s.firstName || ''} ${s.lastName !== '.' ? s.lastName || '' : ''}`.trim() || 'Unknown',
              parentName:  s.parentName  || pd.primaryName  || pd.fatherName  || s.parentUserId?.name  || '',
              parentEmail: s.parentEmail || pd.primaryEmail || s.fatherEmail  || s.parentUserId?.email || '',
              contacts,
              classNames: [cName],
              classId:    cls._id || cls.classId,
              classType,
              timing:     s.timing || null,
            });
          }
        });
      });
      setAllStudents(Array.from(map.values()));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load students');
    } finally { setLoading(false); }
  };

  const getClassName = (classId) => myClasses.find(c => c._id === classId || c.classId === classId)?.name || '-';

  const formatTiming = (student) => {
    const t   = student.timing;
    const ct  = student.classType || t?.classType || '';
    if (!t) return null;
    if (ct === 'HOURS_BASED') {
      const total = (t.paidFlexiHours || 0) + (t.freeFlexiHours || 0);
      return total > 0 ? `${total} hrs/month` : null;
    }
    const s = fmt12(t.startTime), e = fmt12(t.endTime);
    if (s && e) return `${s} – ${e}`;
    return s || e || null;
  };

  const filteredStudents = allStudents.filter(st => {
    const term = searchTerm.toLowerCase();
    const matchSearch = (st.name || '').toLowerCase().includes(term)
      || (st.admissionNo || '').toLowerCase().includes(term)
      || (st.parentName  || '').toLowerCase().includes(term)
      || (st.parentPhone || '').includes(term);
    const selCN = getClassName(classFilter);
    const matchClass  = classFilter && selCN !== '-' ? st.classNames?.includes(selCN) : true;
    const matchStatus = statusFilter === 'All' ? true : st.status === statusFilter;
    return matchSearch && matchClass && matchStatus;
  });

  // ══════════════════════════════════════════════════════════════════════════
  // FULL-PAGE STUDENT DETAIL
  // ══════════════════════════════════════════════════════════════════════════
  if (selectedStudent) {
    const s         = selectedStudent;
    const t         = s.timing;
    const isHours   = (s.classType || t?.classType || '') === 'HOURS_BASED';
    const remaining = isHours ? ((t?.paidFlexiHours || 0) + (t?.freeFlexiHours || 0)) - (t?.consumedFlexiHours || 0) : null;
    const hasTiming = t && (t.startTime || t.endTime || t.paidFlexiHours);

    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>

        {/* ── Sticky Top Bar ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          position: '', top: 0, zIndex: 20,
          boxShadow: '0 4px 24px rgba(15,118,110,0.3)',
          flexShrink: 0,
        }}>
          <button onClick={() => setSelectedStudent(null)} style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, transition: 'background .2s',
          }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Profile</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
          </div>
          <StatusBadge status={s.status} />
        </div>

        {/* ── Hero Banner (NOT overlapping) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
          padding: '24px 24px 28px',
        }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <StudentAvatar photo={s.photo} name={s.name} size={80} />
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 22, height: 22, borderRadius: '50%',
                background: s.status === 'Active' ? '#22c55e' : '#94a3b8',
                border: '2px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', marginBottom: 10 }}>{s.admissionNo}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {s.gender && (
                  <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>{s.gender}</span>
                )}
                {s.classNames?.map((cn, i) => (
                  <span key={i} style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>{cn}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 40px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* ── Desktop 2-col / Mobile 1-col ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
              alignItems: 'start',
            }}>

              {/* ── LEFT COL ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Student Details */}
                <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 8px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                  <SectionHeader icon={GraduationCap} label="Student Details" color="#0f766e" bg="#f0fdf4" border="#bbf7d0" />
                  <InfoRow icon={Hash}       label="Admission No"  value={s.admissionNo} />
                  <InfoRow icon={Layers}     label="Class"         value={s.classNames?.join(', ') || getClassName(s.classId)} />
                  <InfoRow icon={Calendar}   label="Date of Birth" value={(s.dateOfBirth || s.dob) ? new Date(s.dateOfBirth || s.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null} />
                  <InfoRow icon={UserCircle} label="Gender"        value={s.gender} />
                  <div style={{ height: 10 }} />
                </div>

                {/* Timing */}
                {hasTiming && (
                  <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #fde68a' }}>
                    <SectionHeader icon={Clock} label="Timing & Schedule" color="#b45309" bg="#fffbeb" border="#fde68a" />

                    {!isHours && (t?.startTime || t?.endTime) && (
                      <div style={{ display: 'flex', gap: 12 }}>
                        {t?.startTime && (
                          <div style={{ flex: 1, background: '#f0fdf4', borderRadius: 14, padding: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Start Time</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f766e' }}>{fmt12(t.startTime)}</div>
                          </div>
                        )}
                        {t?.endTime && (
                          <div style={{ flex: 1, background: '#fff1f2', borderRadius: 14, padding: '16px', border: '1px solid #fecdd3', textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#9f1239', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>End Time</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{fmt12(t.endTime)}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {isHours && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <StatTile label="Paid Hrs"  value={t?.paidFlexiHours || 0}    color="#0f766e" bg="#f0fdf4" border="#bbf7d0" />
                        <StatTile label="Free Hrs"  value={t?.freeFlexiHours || 0}    color="#7c3aed" bg="#f5f3ff" border="#ddd6fe" />
                        <StatTile label="Consumed"  value={t?.consumedFlexiHours || 0} color="#dc2626" bg="#fff1f2" border="#fecdd3" />
                        <StatTile label="Remaining" value={remaining}                  color="#0284c7" bg="#eff6ff" border="#bfdbfe" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── RIGHT COL ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Parent Details */}
                <div style={{ background: '#fff', borderRadius: 20, padding: '20px 20px 8px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #bfdbfe' }}>
                  <SectionHeader icon={UserCircle} label="Parent Details" color="#1d4ed8" bg="#eff6ff" border="#bfdbfe" />
                  <InfoRow icon={UserCircle} label="Parent Name"  value={s.parentName}  color="#1d4ed8" />
                  <InfoRow icon={Mail}       label="Parent Email" value={s.parentEmail} color="#1d4ed8" />
                  <div style={{ height: 10 }} />
                </div>

                {/* Contact Numbers */}
                {permissions?.canViewStudentMobile && s.contacts?.length > 0 && (
                  <div style={{ background: '#fff', borderRadius: 20, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #bfdbfe' }}>
                    <SectionHeader icon={Phone} label="Contact Numbers" color="#0369a1" bg="#f0f9ff" border="#bae6fd" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {s.contacts.map((c, i) => (
                        <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#0369a1', background: '#e0f2fe', padding: '2px 10px', borderRadius: 20, textTransform: 'uppercase' }}>{c.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{c.number}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a href={`tel:${c.number}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#fff', color: '#0369a1', borderRadius: 10, fontWeight: 700, fontSize: 13, border: '1px solid #bae6fd', textDecoration: 'none', transition: 'background .15s' }}>
                              <Phone size={14} /> Call
                            </a>
                            <a href={waUrl(c.number)} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', background: '#22c55e', color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', textDecoration: 'none', transition: 'background .15s' }}>
                              <MessageCircle size={14} /> WhatsApp
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LIST / GRID PAGE
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-teal-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">My Students</h1>
          <p className="text-teal-100 text-sm font-medium">View and manage students in your assigned classes</p>
        </div>
        <div className="relative z-10 flex items-center gap-3 bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/30">
          <Users size={20} className="text-white" />
          <div className="flex flex-col">
            <span className="text-2xl font-black leading-none">{allStudents.length}</span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-teal-100">Total Enrolled</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          <AlertCircle size={15} color="#E11D48" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#BE123C', flex: 1 }}>{error}</p>
          <button onClick={() => setError('')} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#FECDD3', color: '#BE123C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Name, admission no, or parent…"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 min-w-[140px] focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-500">
            <option value="">All Classes</option>
            {myClasses.map(cls => <option key={cls._id || cls.classId} value={cls._id || cls.classId}>{cls.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-500">
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setViewMode('grid')} title="Grid"
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('table')} title="Table"
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: '#94A3B8' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F0FDFA', borderTopColor: '#0F766E', animation: 'spin .8s linear infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Loading students…</span>
        </div>
      ) : allStudents.length === 0 ? (
        <div className="bg-white rounded-2xl p-14 text-center border border-dashed border-slate-200">
          <Users size={40} className="mx-auto text-slate-200 mb-3" />
          <p className="text-slate-500 font-medium">No students found</p>
          <p className="text-slate-400 text-sm mt-1">You have no students in your assigned classes yet.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredStudents.map(student => {
            const timing = formatTiming(student);
            return (
              <div key={student._id || student.id}
                onClick={() => setSelectedStudent(student)}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-teal-200 hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <StudentAvatar photo={student.photo} name={student.name} size={52} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate group-hover:text-teal-600 transition-colors text-sm">{student.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{student.admissionNo}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-md border border-teal-100 truncate max-w-[120px]">
                        {student.classNames?.join(', ') || 'No Class'}
                      </span>
                      <StatusBadge status={student.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  {student.parentName && (
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <UserCircle size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{student.parentName}</span>
                    </div>
                  )}
                  {timing && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={13} className="text-amber-500 shrink-0" />
                      <span className="font-bold text-amber-700">{timing}</span>
                    </div>
                  )}
                  {permissions?.canViewStudentMobile && student.contacts?.length > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); setContactModalStudent(student); }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-xs border border-blue-100 mt-1"
                    >
                      <Phone size={12} /> Contact Parent
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-end gap-1 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[11px] font-bold">View profile</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  {['Student', 'Parent / Contact', 'Class & Timing', 'Status', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => {
                  const timing = formatTiming(student);
                  return (
                    <tr key={student._id || student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <StudentAvatar photo={student.photo} name={student.name} size={40} />
                          <div>
                            <div className="text-sm font-semibold text-slate-800 whitespace-nowrap">{student.name}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">{student.admissionNo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{student.parentName || '-'}</span>
                          {permissions?.canViewStudentMobile && student.contacts?.length > 0 && (
                            <button onClick={e => { e.stopPropagation(); setContactModalStudent(student); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 font-semibold text-[11px] self-start border border-blue-100">
                              <Phone size={11} /> Contact
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-slate-700">{student.classNames?.join(', ') || '-'}</span>
                          {timing && (
                            <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">
                              <Clock size={11} /> {timing}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={student.status} /></td>
                      <td className="px-5 py-4">
                        <button onClick={() => setSelectedStudent(student)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center gap-1 whitespace-nowrap">
                          View <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contact Modal — bottom sheet on mobile */}
      {contactModalStudent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setContactModalStudent(null)}>
          <div className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ animation: 'slideUp .25s ease' }}
            onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Contact Parent</h3>
                <p className="text-xs text-slate-500 mt-0.5">Student: <span className="font-semibold">{contactModalStudent.name}</span></p>
              </div>
              <button onClick={() => setContactModalStudent(null)} className="p-2 bg-slate-200/60 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {contactModalStudent.contacts?.map((c, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full uppercase">{c.label}</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">{c.number}</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${c.number}`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-blue-600 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                      <Phone size={14} /> Call
                    </a>
                    <a href={waUrl(c.number)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-colors">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setContactModalStudent(null)} className="w-full py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default TeacherStudentsPage;