import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, DoorOpen, ClipboardList, Eye,
  CheckCircle2, Clock, ChevronRight, X, Search,
  GraduationCap, LayoutGrid, AlarmClock, Hourglass,
  CalendarDays, Settings2, ArrowRight, AlertCircle, Loader2,
} from 'lucide-react';
import { getMyClassesAPI, getClassStudentsAPI } from '../../api/classes';

// ── Helpers ───────────────────────────────────────────────────────────────────
const CLASS_TYPE_META = {
  FIXED_TIME:  { label: 'Fixed Time',    color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE', Icon: AlarmClock },
  FLEX_TIME:   { label: 'Flexible Time', color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4', Icon: Clock      },
  HOURS_BASED: { label: 'Hours Based',   color: '#B45309', bg: '#FFFBEB', border: '#FCD34D', Icon: Hourglass  },
};

const fmt12 = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const WEEK_DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const DAY_SHORT = { MON:'Mo', TUE:'Tu', WED:'We', THU:'Th', FRI:'Fr', SAT:'Sa', SUN:'Su' };

// ── Student detail modal ───────────────────────────────────────────────────────
const StudentModal = ({ cls, students: stuList, onClose }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const filtered = stuList.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    s.admissionNo?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,40,0.65)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.22)', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal header */}
        <div style={{ padding: '20px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${cls._color || '#6D28D9'}, ${cls._color || '#6D28D9'}bb)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2',cursive", fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {cls.name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>{cls.name} — Students</p>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, fontWeight: 600 }}>{stuList.length} student{stuList.length !== 1 ? 's' : ''} enrolled</p>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, background: '#F1F5F9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #F8FAFC', flexShrink: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search students…"
              style={{ width: '100%', padding: '9px 14px 9px 36px', borderRadius: 11, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, color: '#0F172A', outline: 'none', boxSizing: 'border-box', background: '#F8FAFC' }}
              onFocus={e => { e.currentTarget.style.borderColor = cls._color || '#6D28D9'; e.currentTarget.style.background = '#fff'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
            />
          </div>
        </div>

        {/* Student list */}
        <div style={{ overflowY: 'auto', padding: '10px 14px 14px', flex: 1 }}>
          {stuList.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8' }}>
              <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <p style={{ fontSize: 13, fontWeight: 700 }}>No students found</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94A3B8' }}>
              <p style={{ fontSize: 13, fontWeight: 700 }}>No students match your search</p>
            </div>
          ) : filtered.map((s, i) => (
            <div key={s._id || s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderRadius: 13, marginBottom: 6,
              border: '1.5px solid #F1F5F9', background: '#FAFCFF',
              transition: 'all .15s', cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = (cls._color || '#6D28D9') + '40'; e.currentTarget.style.background = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#F1F5F9'; e.currentTarget.style.background = '#FAFCFF'; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 11, background: `linear-gradient(135deg, ${cls._color || '#6D28D9'}cc, ${cls._color || '#6D28D9'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2',cursive", fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {s.name?.charAt(0) || 'S'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{s.name || 'Unknown'}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0', fontWeight: 600 }}>{s.admissionNo || 'N/A'}</p>
              </div>
              <span style={{ padding: '4px 11px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: (s.status || 'Active') === 'Active' ? '#DCFCE7' : '#FEE2E2', color: (s.status || 'Active') === 'Active' ? '#15803D' : '#DC2626', border: `1.5px solid ${(s.status || 'Active') === 'Active' ? '#BBF7D0' : '#FECACA'}` }}>
                {s.status || 'Active'}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#2563EB,#1D4ED8)', border: 'none', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(37,99,235,.3)' }}
          >
            <Eye size={14} strokeWidth={2.5} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Class Card ─────────────────────────────────────────────────────────────────
const ClassCard = ({ cls, studentCount, onViewStudents, index }) => {
  const typeMeta = CLASS_TYPE_META[cls.classType] || CLASS_TYPE_META.FIXED_TIME;
  const TypeIcon = typeMeta.Icon;

  const PALETTE = ['#6D28D9','#0F766E','#B45309','#1D4ED8','#0891B2','#DC2626'];
  const clsColor = cls.color || PALETTE[index % PALETTE.length];

  const timeDisplay = cls.classType === 'FIXED_TIME' && cls.startTime && cls.endTime
    ? `${fmt12(cls.startTime)} – ${fmt12(cls.endTime)}`
    : cls.classType === 'FLEX_TIME'
    ? 'Time per student'
    : 'Hours per student';

  const hasDays = cls.days && cls.days.length > 0;

  return (
    <div
      style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E2E8F0',
        overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.22s cubic-bezier(.34,1.2,.64,1)',
        animation: `ccIn .4s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
    >
      {/* Top color strip */}
      <div style={{ height: 5, background: `linear-gradient(90deg, ${clsColor}, ${clsColor}88)` }} />

      {/* Card body */}
      <div style={{ padding: '18px 18px 14px', flex: 1 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `linear-gradient(135deg, ${clsColor}, ${clsColor}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Baloo 2',cursive", fontSize: 20, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: `0 4px 12px ${clsColor}44` }}>
              {cls.name?.charAt(0)}
            </div>
            <div>
              <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>{cls.name}</p>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0', fontWeight: 600 }}>Section {cls.section || 'N/A'}</p>
            </div>
          </div>
          {/* Class type badge */}
          <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: typeMeta.bg, color: typeMeta.color, border: `1.5px solid ${typeMeta.border}`, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
            <TypeIcon size={10} strokeWidth={2.5} />
            {typeMeta.label}
          </span>
        </div>

        {/* Info rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {/* Students count */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 11, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: clsColor + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={14} color={clsColor} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Students</span>
            </div>
            <span style={{ fontFamily: "'Baloo 2',cursive", fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{studentCount}</span>
          </div>

          {/* Time */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: 11, background: typeMeta.bg, border: `1px solid ${typeMeta.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: typeMeta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TypeIcon size={14} color={typeMeta.color} strokeWidth={2.2} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: typeMeta.color }}>Timing</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: typeMeta.color }}>{timeDisplay}</span>
          </div>
        </div>

        {/* Weekly days */}
        {hasDays && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.05em', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 5 }}>
              <CalendarDays size={10} strokeWidth={2.5} /> Schedule
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {WEEK_DAYS.map(d => {
                const active = cls.days.includes(d);
                return (
                  <span key={d} style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${active ? clsColor : '#E2E8F0'}`, background: active ? clsColor : '#F8FAFC', color: active ? '#fff' : '#CBD5E1', fontWeight: 800, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {DAY_SHORT[d]}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {!hasDays && (
          <div style={{ marginBottom: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}>
              <CalendarDays size={10} strokeWidth={2.5} /> All Days
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 14px 14px', display: 'flex', gap: 8 }}>
        <button
          onClick={() => onViewStudents({ ...cls, _color: clsColor })}
          style={{ flex: 1, padding: '10px', borderRadius: 11, border: `1.5px solid ${clsColor}`, background: clsColor + '0D', color: clsColor, fontFamily: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = clsColor + '18'; }}
          onMouseLeave={e => { e.currentTarget.style.background = clsColor + '0D'; }}
        >
          <Eye size={13} strokeWidth={2.5} />
          View Students
        </button>
        <Link
          to="/teacher/daily-activity"
          style={{ flex: 1, padding: '10px', borderRadius: 11, border: 'none', background: `linear-gradient(135deg, ${clsColor}, ${clsColor}cc)`, color: '#fff', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: `0 3px 10px ${clsColor}33`, transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          <ClipboardList size={13} strokeWidth={2.5} />
          Activity Log
        </Link>
      </div>

      {/* Take attendance bottom strip */}
      <Link
        to={`/teacher/attendance?class=${cls._id || cls.id}`}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', color: '#2563EB', textDecoration: 'none', fontSize: 12, fontWeight: 800, transition: 'background .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; }}
      >
        <CheckCircle2 size={13} color="#2563EB" strokeWidth={2.5} />
        Take Attendance
        <ArrowRight size={12} color="#2563EB" strokeWidth={2.5} />
      </Link>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────
const TeacherClassesPage = () => {
  const [selectedClass, setSelectedClass] = useState(null);
  const [search, setSearch] = useState('');
  const [myClasses, setMyClasses] = useState([]);
  const [classStudents, setClassStudents] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError('');
      const classesRes = await getMyClassesAPI();
      const classes = classesRes.data || [];
      setMyClasses(classes);

      // Fetch students for each class sequentially to avoid overwhelming the API
      const studentsData = {};
      for (const cls of classes) {
        try {
          const studentsRes = await getClassStudentsAPI(cls._id || cls.classId);
          studentsData[cls._id || cls.classId] = studentsRes.data || [];
        } catch (err) {
          studentsData[cls._id || cls.classId] = [];
        }
      }
      setClassStudents(studentsData);
    } catch (err) {
      console.error('Failed to fetch classes:', err);
      setError(err.response?.data?.error || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const getClassStudents = (classId) => classStudents[classId] || [];

  const filteredClasses = myClasses.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.classId?.toLowerCase().includes(search.toLowerCase()) ||
    c._id?.toLowerCase().includes(search.toLowerCase())
  );

  const totalStudents = Object.values(classStudents).reduce((sum, students) => sum + students.length, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .tcc-root { font-family: 'Nunito', sans-serif; }
        @keyframes ccIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pageIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tcc-page { animation: pageIn .35s ease both; }
      `}</style>

      <div className="tcc-root">
        <div className="tcc-page">

          {/* ── Page Header ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>My Classes</p>
              <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0', fontWeight: 600 }}>View and manage your assigned classes</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 12, padding: '11px 16px', display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
              <AlertCircle size={15} color="#E11D48" style={{ flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#BE123C', flex: 1 }}>{error}</p>
              <button onClick={() => setError('')} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: '#FECDD3', color: '#BE123C', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
            </div>
          )}

          {/* ── Summary stats ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'My Classes',    value: myClasses.length,  color: '#6D28D9', bg: '#F5F3FF', Icon: BookOpen         },
              { label: 'Total Students',value: totalStudents,   color: '#0F766E', bg: '#F0FDFA', Icon: Users            },
              { label: 'Active',  value: myClasses.filter(c => c.status === 'Active').length,  color: '#2563EB', bg: '#EFF6FF', Icon: GraduationCap    },
              { label: 'Fixed Time',  value: myClasses.filter(c => c.classType === 'FIXED_TIME').length,  color: '#B45309', bg: '#FFFBEB', Icon: AlarmClock    },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '13px 16px', border: `1.5px solid ${s.color}18`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <s.Icon size={17} color={s.color} strokeWidth={2.2} />
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: s.color, margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</p>
                  <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.1 }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search ── */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search classes by name or ID…"
              style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 13, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', fontWeight: 600, color: '#0F172A', outline: 'none', background: '#fff', boxSizing: 'border-box', maxWidth: 400 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* ── Classes grid ── */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, color: '#94A3B8' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #F5F3FF', borderTopColor: '#6D28D9', animation: 'spin .8s linear infinite' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Loading classes…</span>
            </div>
          ) : filteredClasses.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 20, border: '2px dashed #E2E8F0', padding: '60px 24px', textAlign: 'center' }}>
              <BookOpen size={40} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontFamily: "'Baloo 2',cursive", fontSize: 16, fontWeight: 800, color: '#475569', margin: '0 0 4px' }}>No classes found</p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Contact admin to assign you to classes</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
              {filteredClasses.map((cls, i) => (
                <ClassCard
                  key={cls._id || cls.id}
                  cls={cls}
                  studentCount={getClassStudents(cls._id || cls.classId).length}
                  onViewStudents={setSelectedClass}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Student Modal ── */}
        {selectedClass && (
          <StudentModal
            cls={selectedClass}
            students={getClassStudents(selectedClass._id || selectedClass.id)}
            onClose={() => setSelectedClass(null)}
          />
        )}
      </div>
    </>
  );
};

export default TeacherClassesPage;
