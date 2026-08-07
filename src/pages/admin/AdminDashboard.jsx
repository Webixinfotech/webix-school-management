import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentsAPI } from '../../api/students';
import { getTeachersAPI } from '../../api/teachers';
import { getClassesAPI } from '../../api/classes';
import { getEnquiryStats } from '../../api/enquiries';
import { birthdayAPI } from '../../api/birthday.api';
import { fetchDailySummary as getDailySummary } from '../../api/dailyActivity';
import { getDailyAttendanceSummary } from '../../api/attendance';
import { getEmployeeAttendanceSummary } from '../../api/employeeAttendance';
import studentAttendanceImg from '../../assets/optimized/activities/brain-builder-activity-studentattendance.webp';
import teacherAttendanceImg from '../../assets/optimized/activities/brain-builder-activity-teacherattendance.webp';
import { MdQrCodeScanner } from 'react-icons/md';
import { FiAlertCircle, FiUsers, FiBookOpen, FiAward, FiCalendar, FiArrowRight, FiGift, FiStar, FiMessageSquare, FiUserCheck } from 'react-icons/fi';

/* ─────────────── Loading Spinner ─────────────── */
function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className={`${s} border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto`} />
  );
}

/* ─────────────── Error Banner ─────────────── */
function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-red-700 text-sm">
      <FiAlertCircle className="text-lg shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ─────────────── Empty State ─────────────── */
function EmptyState({ icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs">{desc}</p>
    </div>
  );
}

/* ─────────────── Birthday Card (3D / Glowing) ─────────────── */
function BirthdayCard({ person }) {
  const { name, role, daysRemaining, photo, class: className, admissionNo } = person;

  const getRoleInfo = (role) => {
    switch (role) {
      case 'student':
        return { label: 'Student', color: '#0C2A47', from: '#38BDF8', to: '#0C2A47', bg: '#EFF6FF' };
      case 'staff':
        return { label: 'Staff', color: '#059669', from: '#34D399', to: '#059669', bg: '#ECFDF5' };
      case 'parent-father':
      case 'parent-mother':
      case 'parent':
        return { label: 'Parent', color: '#7C3AED', from: '#C084FC', to: '#7C3AED', bg: '#F5F3FF' };
      default:
        return { label: 'Guest', color: '#64748B', from: '#94A3B8', to: '#475569', bg: '#F1F5F9' };
    }
  };

  const roleInfo = getRoleInfo(role);
  const isToday = daysRemaining === 0;

  let dayLabel;
  let dayColor = '#16A34A';
  if (daysRemaining === 0) {
    dayLabel = 'Today';
    dayColor = '#E2B94D';
  } else if (daysRemaining === 1) {
    dayLabel = 'Tomorrow';
    dayColor = '#F59E0B';
  } else {
    dayLabel = `In ${daysRemaining} days`;
  }

  return (
    <div
      className={`birthday-card group ${isToday ? 'birthday-card-today' : ''}`}
      style={{ '--card-glow': `${roleInfo.to}55`, '--card-from': roleInfo.from, '--card-to': roleInfo.to }}
    >
      {/* confetti sparkle for today's birthdays */}
      {isToday && (
        <span className="birthday-spark birthday-spark-1"><FiStar size={10} fill="currentColor" /></span>
      )}
      {isToday && (
        <span className="birthday-spark birthday-spark-2"><FiStar size={10} fill="currentColor" /></span>
      )}

      {/* 3D-style glowing avatar / icon */}
      <div className="birthday-card-icon-wrap">
        <div className="birthday-card-icon-glow" />
        <div className="birthday-card-icon">
          {photo ? (
            <img src={photo} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <FiGift size={20} />
          )}
        </div>
        {isToday && (
          <span className="birthday-card-star">
            <FiStar size={10} />
          </span>
        )}
      </div>

      <div className="birthday-card-content">
        <p className="birthday-card-name">{name}</p>
        <div className="birthday-card-meta">
          <span className="birthday-card-role" style={{ background: roleInfo.bg, color: roleInfo.color }}>
            {roleInfo.label}
            {className ? ` · ${className}` : ''}
          </span>
        </div>
        <span className="birthday-card-days" style={{ color: dayColor }}>
          {dayLabel}
        </span>
      </div>
    </div>
  );
}

/* ─────────────── Birthday Ticker ─────────────── */
function BirthdayTicker({ birthdays }) {
  if (!birthdays || birthdays.length === 0) return null;

  // Only scroll and duplicate if there are enough items to actually warrant a ticker.
  // Otherwise, displaying duplicates is confusing to the user.
  const shouldScroll = birthdays.length >= 4;
  const extendedList = shouldScroll ? [...birthdays, ...birthdays] : birthdays;

  return (
    <div className="birthday-ticker-wrap">
      {shouldScroll && <div className="birthday-ticker-fade birthday-ticker-fade-left" />}
      {shouldScroll && <div className="birthday-ticker-fade birthday-ticker-fade-right" />}
      <div 
        className="birthday-ticker"
        style={shouldScroll ? {} : { animation: 'none' }}
      >
        {extendedList.map((b, i) => (
          <BirthdayCard key={`${b.id}-${i}`} person={b} />
        ))}
      </div>
    </div>
  );
}

function getLocalDate() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().split('T')[0];
}

/* ─────────────── Skeleton Card ─────────────── */
function SkeletonCard() {
  return (
    <article className="dashboard-stat animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3 flex-1">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-8 w-16 rounded bg-slate-200" />
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-200" />
      </div>
    </article>
  );
}

/* ─────────────── Attendance Card (3D / Glow) ─────────────── */
function AttendanceCard({
  title,
  description,
  to,
  icon,
  gradientFrom,
  gradientTo,
  glow,
  badgeBg,
  badgeText,
  badgeLabel,
  accentColor,
}) {
  return (
    <Link
      to={to}
      className="group relative flex min-h-[230px] flex-col overflow-hidden rounded-[28px] p-[1.5px]
                 transition-all duration-500 ease-out
                 hover:-translate-y-2 hover:scale-[1.01]
                 xs:flex-row sm:min-h-[240px]
                 [transform-style:preserve-3d]"
      style={{
        background: `linear-gradient(155deg, ${gradientFrom}55, transparent 35%, transparent 65%, ${gradientTo}55)`,
        boxShadow: `0 1px 2px rgba(15,23,42,0.06), 0 12px 24px -8px rgba(15,23,42,0.10), 0 24px 48px -24px ${glow}`,
      }}
    >
      {/* ── Inner surface ── */}
      <div
        className="relative flex flex-1 flex-col overflow-hidden rounded-[27px] bg-white
                   transition-shadow duration-500
                   xs:flex-row"
        style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}
      >
        {/* ambient gradient wash, brightens on hover */}
        <div
          className="absolute inset-0 opacity-[0.07] transition-opacity duration-500 group-hover:opacity-[0.14]"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        />

        {/* soft glow blob top-right for depth */}
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl transition-opacity duration-500 opacity-50 group-hover:opacity-90"
          style={{ background: `radial-gradient(circle, ${gradientTo}, transparent 70%)` }}
        />

        {/* ── Content column ── */}
        <div className="relative z-10 flex flex-1 flex-col justify-between gap-3 px-6 pt-7 pb-6 min-w-0">
          {/* Badge */}
          <span
            className="self-start inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide shadow-sm ring-1 ring-inset transition-transform duration-300 group-hover:scale-105"
            style={{
              backgroundColor: badgeBg,
              color: badgeText,
              boxShadow: `0 2px 8px -2px ${glow}`,
              '--tw-ring-color': `${accentColor}22`,
            }}
          >
            <MdQrCodeScanner className="h-3.5 w-3.5 shrink-0" />
            {badgeLabel}
          </span>

          {/* Text */}
          <div className="flex-1">
            <h2
              className="text-xl font-bold leading-snug mb-2 bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, #030B15, ${gradientTo})` }}
            >
              {title}
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          </div>

          {/* CTA */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold text-white transition-all duration-300 group-hover:gap-3 group-hover:px-4"
              style={{
                background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
                boxShadow: `0 6px 16px -4px ${glow}`,
              }}
            >
              Mark Attendance
              <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user } = useAuth();

  /* ── Data State ── */
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [enquiryStats, setEnquiryStats] = useState(null);
  const [enquiryLoading, setEnquiryLoading] = useState(true);
  const [enquiryError, setEnquiryError] = useState(null);
  const [dailySummary, setDailySummary] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailyError, setDailyError] = useState(null);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);
  const [birthdaysError, setBirthdaysError] = useState(null);
  const [studentAtt, setStudentAtt] = useState(null);
  const [employeeAtt, setEmployeeAtt] = useState(null);

  /* ── Loading & Error State ── */
  const [loading, setLoading] = useState({ students: true, teachers: true, classes: true });
  const [error, setError] = useState({ students: null, teachers: null, classes: null });

  /* ── Fetchers ── */
  const fetchStudents = useCallback(async () => {
    try {
      setError((e) => ({ ...e, students: null }));
      const res = await getStudentsAPI();
      const data = res?.data?.data || res?.data || res;
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((e) => ({ ...e, students: err.message || 'Failed to load students' }));
    } finally {
      setLoading((l) => ({ ...l, students: false }));
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    try {
      setError((e) => ({ ...e, teachers: null }));
      const res = await getTeachersAPI();
      const data = res?.data?.data || res?.data || res;
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((e) => ({ ...e, teachers: err.message || 'Failed to load teachers' }));
    } finally {
      setLoading((l) => ({ ...l, teachers: false }));
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      setError((e) => ({ ...e, classes: null }));
      const res = await getClassesAPI();
      const data = res?.data?.data || res?.data || res;
      setClasses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((e) => ({ ...e, classes: err.message || 'Failed to load classes' }));
    } finally {
      setLoading((l) => ({ ...l, classes: false }));
    }
  }, []);

  const fetchEnquiryStats = useCallback(async () => {
    try {
      setEnquiryError(null);
      setEnquiryLoading(true);
      const res = await getEnquiryStats();
      const data = res?.data || res;
      setEnquiryStats(data || null);
    } catch (err) {
      setEnquiryError(err.message || 'Failed to load enquiry stats');
    } finally {
      setEnquiryLoading(false);
    }
  }, []);

  const fetchDailySummary = useCallback(async () => {
    try {
      setDailyError(null);
      setDailyLoading(true);
      const data = await getDailySummary(getLocalDate());
      setDailySummary(Array.isArray(data) ? data : []);
    } catch (err) {
      setDailyError(err.message || 'Failed to load daily activity summary');
      setDailySummary([]);
    } finally {
      setDailyLoading(false);
    }
  }, []);

  const fetchUpcomingBirthdays = useCallback(async () => {
    try {
      setBirthdaysError(null);
      setBirthdaysLoading(true);
      const res = await birthdayAPI.getAdminUpcoming();
      if (res.success) {
        const allBirthdays = [
          ...(res.data.student || []),
          ...(res.data.staff || []),
          ...(res.data.parent || []),
        ];
        const within7Days = allBirthdays.filter((b) => b.daysRemaining >= 0 && b.daysRemaining <= 7);
        within7Days.sort((a, b) => a.daysRemaining - b.daysRemaining);
        setUpcomingBirthdays(within7Days);
      } else {
        setUpcomingBirthdays([]);
      }
    } catch (err) {
      setBirthdaysError('Failed to load upcoming birthdays.');
    } finally {
      setBirthdaysLoading(false);
    }
  }, []);

  const fetchStudentAtt = useCallback(async () => {
    try {
      const res = await getDailyAttendanceSummary(getLocalDate());
      if (res?.success) setStudentAtt(res.data);
      else if (res?.data) setStudentAtt(res.data);
      else setStudentAtt(res);
    } catch {
      setStudentAtt(null);
    }
  }, []);

  const fetchEmployeeAtt = useCallback(async () => {
    try {
      const res = await getEmployeeAttendanceSummary(getLocalDate());
      if (res?.success && res?.data?.summary) {
        setEmployeeAtt(res.data.summary);
      }
    } catch {
      setEmployeeAtt(null);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchTeachers();
    fetchClasses();
    fetchEnquiryStats();
    fetchDailySummary();
    fetchUpcomingBirthdays();
    fetchStudentAtt();
    fetchEmployeeAtt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Derived Stats ── */
  const activeStudents = useMemo(
    () => students.filter((s) => s.status === 'Active' || s.status === 'active'),
    [students]
  );

  const activeTeachers = useMemo(
    () => teachers.filter((t) => t.status === 'Active' || t.status === 'active'),
    [teachers]
  );

  const dailyReports = dailySummary.reduce((sum, item) => sum + Number(item.totalReports || 0), 0);
  const dailyAlerts = dailySummary.reduce((sum, item) => sum + Number(item.healthAlerts || 0), 0);

  const stats = useMemo(
  () => [
    {
      label: 'Enquiries',
      value: enquiryLoading ? '...' : (enquiryStats?.total ?? enquiryStats?.totalEnquiries ?? enquiryStats?.count ?? 0),
      accent: 'from-rose-500 to-pink-600',
      tone: 'bg-rose-50 text-rose-700',
      icon: <FiMessageSquare className="h-5 w-5" />,
      note: `Today ${enquiryStats?.todayEnquiries ?? 0} enquiry`,
      link: '/admin/user-enquiry',
    },
    {
      label: 'Students Present',
      value: studentAtt ? (studentAtt.presentCount || 0) : '...',
      accent: 'from-sky-500 to-blue-600',
      tone: 'bg-sky-50 text-sky-700',
      icon: <FiUsers className="h-5 w-5" />,
      note: `Total ${activeStudents.length}  students`,
      link: '/admin/attendance',
    },

    {
      label: 'Daily Activity',
      value: dailyLoading ? '...' : dailyReports,
      accent: 'from-violet-500 to-fuchsia-600',
      tone: 'bg-violet-50 text-violet-700',
      icon: <FiCalendar className="h-5 w-5" />,
      note: `${dailyAlerts} health alert${dailyAlerts === 1 ? '' : 's'}`,
      link: '/admin/daily-activity',
    },
    {
      label: 'Staff Present',
      value: employeeAtt ? (employeeAtt.present || 0) : '...',
      accent: 'from-fuchsia-500 to-violet-600',
      tone: 'bg-fuchsia-50 text-fuchsia-700',
      icon: <FiBookOpen className="h-5 w-5" />,
      note: `Total ${activeTeachers.length} Staff`,
      link: '/admin/employee-attendance',
    },
    
    {
      label: 'Classes',
      value: classes.length,
      accent: 'from-amber-500 to-orange-600',
      tone: 'bg-amber-50 text-amber-700',
      icon: <FiAward className="h-5 w-5" />,
      note: `Total ${classes.length} classes`,
      link: '/admin/classes',
    },
    
    
  ],
  [
    students.length,
    activeStudents.length,
    teachers.length,
    activeTeachers.length,
    classes.length,
    dailyLoading,
    dailyReports,
    dailyAlerts,
    enquiryLoading,
    enquiryStats,
    studentAtt,
    employeeAtt,
  ]
);

  const getClassName = useCallback(
    (classId) => {
      if (!classId) return '—';
      const cls = classes.find((c) => c.id === classId || c._id === classId);
      return cls?.name || cls?.className || '—';
    },
    [classes]
  );

  const getStudentCountForClass = useCallback(
    (classId) => {
      if (!classId) return 0;
      return students.filter((s) => {
        const sClassIds = s.classIds || (s.classId ? [s.classId] : []);
        return sClassIds.some((cid) => cid === classId || cid === String(classId));
      }).length;
    },
    [students]
  );

  const getParentName = useCallback(
    (parentId) => {
      if (!parentId) return '—';
      const parentStudent = students.find((s) => s.id === parentId || s._id === parentId);
      if (parentStudent) return parentStudent.name;
      return '—';
    },
    [students]
  );

  const recentStudents = useMemo(() => {
    const sorted = [...activeStudents].sort((a, b) => {
      const aId = a._id || a.id;
      const bId = b._id || b.id;
      if (aId?.length === 24 && bId?.length === 24) {
        return parseInt(bId.substring(0, 8), 16) - parseInt(aId.substring(0, 8), 16);
      }
      if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
      if (a.admissionYear && b.admissionYear) return b.admissionYear - a.admissionYear;
      return 0;
    });
    return sorted.slice(0, 8);
  }, [activeStudents]);

  const allLoaded = Object.values(loading).every((v) => !v);
  const anyError = Object.values(error).some((v) => v !== null);
  const isLoading = !allLoaded;

  /* ════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* ── Error Banners ── */}
      {anyError && (
        <div className="space-y-2">
          {Object.entries(error).map(
            ([key, msg]) =>
              msg && (
                <ErrorBanner
                  key={key}
                  message={`${key.charAt(0).toUpperCase() + key.slice(1)}: ${msg}`}
                  onRetry={() => {
                    if (key === 'students') fetchStudents();
                    if (key === 'teachers') fetchTeachers();
                    if (key === 'classes') fetchClasses();
                  }}
                />
              )
          )}
        </div>
      )}
      {enquiryError && <ErrorBanner message={`Enquiries: ${enquiryError}`} onRetry={fetchEnquiryStats} />}
      {dailyError && <ErrorBanner message={`Daily Activity: ${dailyError}`} onRetry={fetchDailySummary} />}

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0C2A47] via-[#081A2E] to-[#030B15] p-6 text-white shadow-[0_28px_60px_-30px_rgba(12,42,71,0.55)] sm:p-8">
        <div className="absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2),transparent_68%)]" />
        <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/80">Admin Overview</p>
            <h1 className="mt-3 text-3xl font-bold font-heading sm:text-4xl">
              Welcome back, {user?.name || 'Admin'}
            </h1>
            <p className="mt-3 max-w-xl text-sm text-white/90 sm:text-base">
              Real-time school management dashboard — students, teachers, and classes at a glance.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="metric-chip">
                <FiCalendar className="mr-1" />
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="metric-chip">
                <FiUsers className="inline mr-1" /> {students.length} students · <FiUserCheck className="inline ml-2 mr-1" /> {teachers.length} teachers
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          UPCOMING BIRTHDAYS — 3D Glowing Moving Ticker
          ════════════════════════════════════════════════════════ */}
      <style>{`
        .birthday-section {
          position: relative;
          overflow: hidden;
          border-radius: 28px;
          padding: 22px 0;
          background: linear-gradient(135deg, #0C2A47 0%, #081A2E 45%, #030B15 100%);
          box-shadow: 0 20px 50px -24px rgba(12,42,71, 0.55), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .birthday-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 12% 20%, rgba(244,114,182,0.28), transparent 40%),
            radial-gradient(circle at 85% 75%, rgba(56,189,248,0.25), transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(167,139,250,0.18), transparent 60%);
          animation: birthday-bg-pulse 8s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes birthday-bg-pulse {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .birthday-section-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 16px 16px;
        }
        @media (min-width: 640px) {
          .birthday-section-header { padding: 0 22px 16px; flex-wrap: nowrap; }
        }
        .birthday-section-title-wrap { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .birthday-section-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-left: auto;
        }
        .birthday-view-all-btn {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 999px;
          background: linear-gradient(135deg, #E2B94D, #b59223 55%, #8f7218);
          color: #fff;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          white-space: nowrap;
          box-shadow: 0 6px 16px -6px rgba(226,185,77,0.7), inset 0 1px 0 rgba(255,255,255,0.3);
          transition: transform 0.25s ease, box-shadow 0.25s ease, gap 0.25s ease;
        }
        .birthday-view-all-btn:hover {
          transform: translateY(-2px);
          gap: 9px;
          box-shadow: 0 10px 22px -6px rgba(226,185,77,0.85), inset 0 1px 0 rgba(255,255,255,0.4);
        }
        .birthday-view-all-btn:active { transform: translateY(0) scale(0.97); }
        .birthday-view-all-btn svg { transition: transform 0.25s ease; }
        .birthday-view-all-btn:hover svg { transform: translateX(2px); }
        .birthday-icon-3d {
          position: relative;
          width: 44px;
          height: 44px;
          shrink: 0;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(155deg, #E2B94D, #b59223 55%, #8f7218);
          box-shadow:
            0 6px 14px -4px rgba(226,185,77,0.7),
            inset 0 1px 0 rgba(255,255,255,0.45),
            inset 0 -3px 6px rgba(0,0,0,0.25);
          transform-style: preserve-3d;
          animation: birthday-icon-float 3s ease-in-out infinite;
        }
        @keyframes birthday-icon-float {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-5px) rotate(4deg); }
        }
        .birthday-icon-3d svg { color: white; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.25)); }
        .birthday-section-title { color: #fff; font-size: 1.05rem; font-weight: 700; font-family: inherit; }
        .birthday-section-sub { color: rgba(226,232,255,0.7); font-size: 0.78rem; margin-top: 2px; }
        .birthday-live-pill {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: #fde68a;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          backdrop-filter: blur(6px);
        }
        .birthday-live-dot {
          width: 7px; height: 7px; border-radius: 999px;
          background: #fbbf24;
          box-shadow: 0 0 0 0 rgba(251,191,36,0.7);
          animation: birthday-dot-ping 1.6s infinite;
        }
        @keyframes birthday-dot-ping {
          0% { box-shadow: 0 0 0 0 rgba(251,191,36,0.7); }
          70% { box-shadow: 0 0 0 8px rgba(251,191,36,0); }
          100% { box-shadow: 0 0 0 0 rgba(251,191,36,0); }
        }

        .birthday-ticker-wrap {
          position: relative;
          z-index: 2;
          overflow: hidden;
          padding: 4px 0 2px;
        }
        .birthday-ticker-fade {
          position: absolute;
          top: 0; bottom: 0;
          width: 60px;
          z-index: 3;
          pointer-events: none;
        }
        .birthday-ticker-fade-left { left: 0; background: linear-gradient(90deg, #081A2E, transparent); }
        .birthday-ticker-fade-right { right: 0; background: linear-gradient(270deg, #081A2E, transparent); }

        .birthday-ticker {
          display: flex;
          width: max-content;
          animation: ticker-scroll 38s linear infinite;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .birthday-ticker:hover { animation-play-state: paused; }

        .birthday-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          margin: 0 8px;
          min-width: 230px;
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          backdrop-filter: blur(8px);
          flex-shrink: 0;
          transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease;
        }
        .birthday-card:hover {
          transform: translateY(-4px) scale(1.025);
          border-color: var(--card-to);
          background: rgba(255,255,255,0.10);
          box-shadow: 0 14px 30px -12px var(--card-glow);
        }
        .birthday-card-today {
          border-color: rgba(251,191,36,0.55);
          box-shadow: 0 0 0 1px rgba(251,191,36,0.25), 0 10px 26px -10px rgba(251,191,36,0.45);
          animation: birthday-card-glow 2.2s ease-in-out infinite;
        }
        @keyframes birthday-card-glow {
          0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.25), 0 10px 26px -10px rgba(251,191,36,0.45); }
          50% { box-shadow: 0 0 0 1px rgba(251,191,36,0.55), 0 14px 34px -8px rgba(251,191,36,0.75); }
        }
        .birthday-spark {
          position: absolute;
          font-size: 12px;
          color: #fde68a;
          opacity: 0.9;
          animation: birthday-spark-float 2.4s ease-in-out infinite;
          pointer-events: none;
        }
        .birthday-spark-1 { top: 4px; right: 10px; animation-delay: 0s; }
        .birthday-spark-2 { bottom: 6px; right: 26px; font-size: 9px; animation-delay: 1.1s; }
        @keyframes birthday-spark-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-6px) scale(1.3); opacity: 1; }
        }

        .birthday-card-icon-wrap {
          position: relative;
          width: 46px;
          height: 46px;
          shrink: 0;
          flex-shrink: 0;
        }
        .birthday-card-icon-glow {
          position: absolute;
          inset: -6px;
          border-radius: 999px;
          background: radial-gradient(circle, var(--card-to), transparent 70%);
          opacity: 0.55;
          filter: blur(6px);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .birthday-card:hover .birthday-card-icon-glow { opacity: 0.9; transform: scale(1.15); }
        .birthday-card-icon {
          position: relative;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(155deg, var(--card-from), var(--card-to));
          color: white;
          box-shadow:
            0 6px 14px -4px var(--card-glow),
            inset 0 1px 0 rgba(255,255,255,0.5),
            inset 0 -3px 6px rgba(0,0,0,0.25);
          transition: transform 0.35s ease;
          overflow: hidden;
        }
        .birthday-card:hover .birthday-card-icon { transform: rotate(-8deg) scale(1.08); }
        .birthday-card-star {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #fbbf24;
          color: #78350f;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #081A2E;
          animation: birthday-star-spin 3s linear infinite;
        }
        @keyframes birthday-star-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .birthday-card-content { min-width: 0; }
        .birthday-card-name {
          font-size: 13.5px;
          font-weight: 700;
          color: #fff;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        .birthday-card-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
        .birthday-card-role {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .birthday-card-days {
          display: inline-block;
          margin-top: 4px;
          font-size: 11px;
          font-weight: 700;
        }
      `}</style>

      {birthdaysLoading ? (
        <div className="h-28 rounded-[28px] bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse" />
      ) : !birthdaysError && upcomingBirthdays.length > 0 ? (
        <section className="birthday-section">
          <div className="birthday-section-header">
            <div className="birthday-section-title-wrap">
              <div className="birthday-icon-3d">
                <FiGift size={20} />
              </div>
              <div className="min-w-0">
                <p className="birthday-section-title">Upcoming Birthdays</p>
                <p className="birthday-section-sub">Celebrate students, staff &amp; parents this week</p>
              </div>
            </div>
            <div className="birthday-section-actions">
              <span className="birthday-live-pill">
                <span className="birthday-live-dot" />
                {upcomingBirthdays.length} upcoming
              </span>
              <Link to="/admin/birthdays" className="birthday-view-all-btn">
                View All
                <FiArrowRight size={14} />
              </Link>
            </div>
          </div>
          <BirthdayTicker birthdays={upcomingBirthdays} />
        </section>
      ) : (
        birthdaysError && <ErrorBanner message={birthdaysError} onRetry={fetchUpcomingBirthdays} />
      )}

      {/* ── Stat Cards ── */}
<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : stats.map((stat) => (
              <Link
                key={stat.label}
                to={stat.link}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">{stat.value}</p>
                  </div>
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.accent} text-white shadow-lg`}
                  >
                    {stat.icon}
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stat.tone}`}>
                    {stat.note}
                  </span>
                </div>
              </Link>
            ))}
      </section>

      {/* ════════════════════════════════════════════════════════
          ATTENDANCE MANAGEMENT — Redesigned with Images
          ════════════════════════════════════════════════════════ */}
      <section>
        {/* Section label */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Attendance Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">Scan QR codes to mark attendance instantly</p>
          </div>
          <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live today
          </span>
        </div>

        {/* The two cards */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Student Attendance */}
          <AttendanceCard
            title="Student Attendance"
            description="Scan student QR badges to instantly record attendance for the day."
            to="/admin/attendance"
            icon={<FiUsers size={120} />}
            gradientFrom="#0EA5E9"
            gradientTo="#0C2A47"
            glow="rgba(37,99,235,0.35)"
            badgeBg="#EFF6FF"
            badgeText="#0C2A47"
            badgeLabel="Student QR Scan"
            accentColor="#0C2A47"
          />

          {/* Teacher Attendance */}
          <AttendanceCard
            title="Staff Attendance"
            description="Record staff attendance with QR scanning at the admin desk."
            to="/admin/employee-attendance"
            icon={<FiUserCheck size={120} />}
            gradientFrom="#A855F7"
            gradientTo="#7C3AED"
            glow="rgba(124,58,237,0.35)"
            badgeBg="#F5F3FF"
            badgeText="#6D28D9"
            badgeLabel="Show Staff QR "
            accentColor="#7C3AED"
          />
        </div>
      </section>

      {/* ── Daily Activity Snapshot ── */}
      <section className="dashboard-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-heading">Daily Activity Snapshot</h2>
            <p className="mt-1 text-sm text-slate-500">Class-wise report completion and health alerts for today.</p>
          </div>
          <Link to="/admin/daily-activity" className="text-sm font-semibold text-[#E2B94D] hover:underline shrink-0">
            Open activity reports →
          </Link>
        </div>
        <div className="p-4">
          {dailyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
              <span className="ml-3 text-sm text-slate-400">Loading daily activity...</span>
            </div>
          ) : dailySummary.length === 0 ? (
            <EmptyState icon={<FiBookOpen className="mx-auto" size={32} />} title="No activity reports yet" desc="Staff have not submitted daily activity reports for today." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dailySummary.map((item) => (
                <Link
                  key={item.classId}
                  to="/admin/daily-activity"
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.className}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.totalReports} reports submitted</p>
                    </div>
                    {item.healthAlerts > 0 ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                        {item.healthAlerts} alerts
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">OK</span>
                    )}
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                      style={{ width: `${Math.min(Number(item.totalReports || 0) * 20, 100)}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Classes Overview ── */}
      <section className="dashboard-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-heading">All Classes</h2>
            <p className="mt-1 text-sm text-slate-500">Overview of all registered classes and their student strength.</p>
          </div>
          <Link to="/admin/classes" className="text-sm font-semibold text-[#E2B94D] hover:underline shrink-0">
            Manage classes →
          </Link>
        </div>
        <div className="p-4">
          {loading.classes ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
              <span className="ml-3 text-sm text-slate-400">Loading classes...</span>
            </div>
          ) : error.classes ? (
            <ErrorBanner message={error.classes} onRetry={fetchClasses} />
          ) : classes.length === 0 ? (
            <EmptyState icon="🏫" title="No classes found" desc="Classes will appear here once created." />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls) => {
                const classColor = cls.classColor || cls.color || '#0C2A47';
                const totalStudents = getStudentCountForClass(cls.id || cls._id);
                return (
                  <div
                    key={cls.id || cls._id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                      style={{ background: classColor }}
                    >
                      {cls.name?.charAt(0) || cls.className?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{cls.name || cls.className}</p>
                      <p className="text-xs text-slate-500">
                        {cls.section || ''}{cls.teacherName ? ' · ' + cls.teacherName : ''}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-sky-50 text-sky-700">
                      {totalStudents} students
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Students Table ── */}
      <section className="dashboard-panel overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-heading">Recent Students</h2>
            <p className="mt-1 text-sm text-slate-500">Latest student registrations and their current class mapping.</p>
          </div>
          <Link to="/admin/students" className="text-sm font-semibold text-[#E2B94D] hover:underline shrink-0">
            View all students →
          </Link>
        </div>

        {loading.students ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
            <span className="ml-3 text-sm text-slate-400">Loading students...</span>
          </div>
        ) : error.students ? (
          <ErrorBanner message={error.students} onRetry={fetchStudents} />
        ) : students.length === 0 ? (
          <EmptyState icon="👥" title="No students found" desc="Student records will appear here after enrollment." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[680px] w-full">
              <thead>
                <tr>
                  <th className="text-left">ID</th>
                  <th className="text-left">Name</th>
                  <th className="text-left">Class</th>
                  <th className="text-left">Parent</th>
                  <th className="text-left">Gender</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.length > 0 ? (
                  recentStudents.map((student) => {
                    const sid = student._id || student.id;
                    const studentClassId =
                      student.classId || (Array.isArray(student.classIds) ? student.classIds[0] : null);
                    const parentId = student.parentId || student.parent?._id || student.parent;
                    return (
                      <tr
                        key={sid}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm text-slate-500">
                            {student.admissionNo || sid?.slice(-6).toUpperCase() || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-sm bg-gradient-to-r from-sky-500 to-blue-600 text-white shrink-0">
                              {(student.fullName || student.name || '??').charAt(0)}
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">
                              {student.fullName || student.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge badge-info">{getClassName(studentClassId)}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm">
                          {parentId ? getParentName(parentId) : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-sm capitalize">
                          {student.gender || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`badge ${
                              student.status === 'Active' || student.status === 'active'
                                ? 'badge-success'
                                : 'badge-info'
                            }`}
                          >
                            {student.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                      No students found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;