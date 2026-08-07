import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Download, Clock, User,
  AlertCircle, CheckCircle, TrendingDown, TrendingUp, Loader2,
  Info, AlertTriangle, X, CalendarDays, List, LogIn, LogOut,
  Timer, Zap, Wallet, PiggyBank,
} from 'lucide-react';
import { getStudentsAPI } from '../../api/students';
import { getClassesAPI } from '../../api/classes';
import {
  getAttendanceHistory,
  calculateFlexHoursSummary,
  processFlexHistory,
  formatFlexHistoryDisplay,
  buildCalendarMap,
  generateDailyHistoryCsvRows,
  formatHoursMinutes,
} from '../../api/flexReport.api';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'error', onClose }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);
  if (!message) return null;
  const styles = {
    error: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#0C2A47' },
  }[type] || {};
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, left: 20, zIndex: 9999,
      marginLeft: 'auto', maxWidth: 340, marginRight: 0,
      background: styles.bg, border: `1.5px solid ${styles.border}`,
      borderRadius: 12, padding: '11px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
    }}>
      <AlertCircle size={16} color={styles.text} style={{ flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: styles.text, flex: 1 }}>{message}</p>
      <button onClick={onClose} style={{
        width: 24, height: 24, borderRadius: 6, border: 'none', flexShrink: 0,
        background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>✕</button>
    </div>
  );
};

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  blue: { bg: '#EFF6FF', text: '#0C2A47', border: '#BFDBFE', from: '#60A5FA', to: '#0C2A47' },
  green: { bg: '#F0FDF4', text: '#15803D', border: '#BBF7D0', from: '#4ADE80', to: '#16A34A' },
  red: { bg: '#FFF1F2', text: '#E2B94D', border: '#FECDD3', from: '#E2B94D', to: '#E2B94D' },
  amber: { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D', from: '#FBBF24', to: '#D97706' },
  teal: { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4', from: '#2DD4BF', to: '#0D9488' },
  purple: { bg: '#FAF5FF', text: '#7E22CE', border: '#E9D5FF', from: '#C084FC', to: '#9333EA' },
  orange: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', from: '#FB923C', to: '#EA580C' },
  slate: { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0', from: '#94A3B8', to: '#64748B' },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const fmt12 = (date) => {
  if (!date) return null;
  try {
    return new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return null; }
};

const formatDateFull = (dateKey) => {
  if (!dateKey) return '—';
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const buildMonthMatrix = (year, month) => {
  // month: 1-indexed
  const firstDay = new Date(year, month - 1, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

const dateKeyFor = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const todayKey = () => {
  const d = new Date();
  return dateKeyFor(d.getFullYear(), d.getMonth() + 1, d.getDate());
};

// ─── Status Badge ────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const config = {
    Present: { bg: '#F0FDF4', text: '#15803D', label: 'Present' },
    Absent: { bg: '#FFF1F2', text: '#E2B94D', label: 'Absent' },
    Late: { bg: '#FFFBEB', text: '#B45309', label: 'Late' },
    Leave: { bg: '#EFF6FF', text: '#0C2A47', label: 'Leave' },
  }[status] || { bg: '#F8FAFC', text: '#475569', label: status || '—' };
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: config.bg, color: config.text, whiteSpace: 'nowrap' }}>
      {config.label}
    </span>
  );
};

// ─── 3D-style Icon Bubble ─────────────────────────────────────────────────────
const IconBubble = ({ icon: Icon, color, size = 52, iconSize = 24 }) => {
  const c = T[color];
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.32, flexShrink: 0,
      background: `linear-gradient(150deg, ${c.from}, ${c.to})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 10px 18px -6px ${c.to}88, inset 0 -4px 6px rgba(0,0,0,0.18), inset 0 2px 3px rgba(255,255,255,0.45)`,
    }}>
      <Icon size={iconSize} color="#fff" strokeWidth={2.3} />
    </div>
  );
};

// ─── Stat Card (now shows Xh Ym instead of raw decimals) ──────────────────────
const StatCard = ({ icon, label, hours, color, sublabel }) => {
  const c = T[color];
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '16px', border: `1.5px solid ${c.border}`,
      display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      transition: 'transform .15s, box-shadow .15s', minWidth: 0,
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}>
      <IconBubble icon={icon} color={color} />
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ margin: '3px 0 0', fontSize: 21, fontWeight: 900, color: '#030B15', whiteSpace: 'nowrap' }}>
          {formatHoursMinutes(hours, { showZeroHours: true })}
        </p>
        {sublabel && <p style={{ margin: '2px 0 0', fontSize: 10.5, fontWeight: 600, color: '#94A3B8' }}>{sublabel}</p>}
      </div>
    </div>
  );
};

// ─── One flexi time-window row (e.g. "After class · 1:00 PM – 1:45 PM · 45m") ──
const FlexiWindowRow = ({ w }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, fontWeight: 700,
    color: '#C2410C', background: '#FFEDD5', padding: '6px 10px', borderRadius: 8,
    flexWrap: 'wrap',
  }}>
    <Zap size={12} style={{ flexShrink: 0 }} />
    <span>{w.label}</span>
    <span style={{ color: '#9A3412', fontWeight: 600 }}>{w.startClock} → {w.endClock}</span>
    <span style={{ marginLeft: 'auto', background: '#FDBA74', color: '#7C2D12', padding: '1px 8px', borderRadius: 99 }}>
      {formatHoursMinutes(w.hours)}
    </span>
  </div>
);

// ─── Visual stay breakdown bar: class time vs before/after extra time ────────
const StayBreakdownBar = ({ scheduledHours, beforeClassHours, afterClassHours, totalStayHours }) => {
  const sched = Math.max(0, scheduledHours || 0);
  const before = Math.max(0, beforeClassHours || 0);
  const after = Math.max(0, afterClassHours || 0);
  const total = totalStayHours != null ? totalStayHours : (sched + before + after);
  if (!total || total <= 0) return null;

  const segments = [
    { key: 'before', hours: before, color: '#FBBF24', darkColor: '#D97706', label: 'Before class' },
    { key: 'class', hours: sched, color: '#60A5FA', darkColor: '#0C2A47', label: 'Class time' },
    { key: 'after', hours: after, color: '#FB923C', darkColor: '#EA580C', label: 'After class' },
  ].filter(s => s.hours > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{
        display: 'flex', width: '100%', height: 14, borderRadius: 8, overflow: 'hidden',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)', background: '#F1F5F9',
      }}>
        {segments.map(s => (
          <div key={s.key} title={`${s.label}: ${formatHoursMinutes(s.hours)}`} style={{
            width: `${(s.hours / total) * 100}%`,
            background: `linear-gradient(180deg, ${s.color}, ${s.darkColor})`,
            boxShadow: 'inset 0 -3px 4px rgba(0,0,0,0.18), inset 0 2px 2px rgba(255,255,255,0.35)',
            minWidth: 3,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 10.5, fontWeight: 700 }}>
        {segments.map(s => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 5, color: s.darkColor }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: s.darkColor, display: 'inline-block' }} />
            {s.label}: {formatHoursMinutes(s.hours)}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: '#030B15', fontWeight: 800 }}>Total: {formatHoursMinutes(total, { showZeroHours: true })}</span>
      </div>
    </div>
  );
};

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
const DayDetailPanel = ({ dateKey, day, onClose }) => {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, border: '1.5px solid #BFDBFE',
      overflow: 'hidden', boxShadow: '0 8px 30px rgba(37,99,235,0.12)',
    }}>
      <div style={{
        padding: '14px 18px', background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        borderBottom: '1.5px solid #BFDBFE', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <CalendarDays size={18} color="#0C2A47" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>{formatDateFull(dateKey)}</p>
        </div>
        <button onClick={onClose} style={{
          width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(29,78,216,0.1)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><X size={14} color="#0C2A47" /></button>
      </div>

      {!day ? (
        <div style={{ padding: '28px 18px', textAlign: 'center' }}>
          <AlertCircle size={28} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#64748B' }}>No attendance recorded on this date</p>
        </div>
      ) : (
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {day.records.map((rec, i) => (
            <div key={rec.id || i} style={{
              padding: '14px', borderRadius: 12, background: rec.flexiHoursDeducted > 0 ? '#FFF7ED' : '#F8FAFC',
              border: `1px solid ${rec.flexiHoursDeducted > 0 ? '#FED7AA' : '#E2E8F0'}`,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#030B15' }}>{rec.className}</span>
                <StatusBadge status={rec.status} />
              </div>

              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LogIn size={14} color="#16A34A" />
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>In: <strong style={{ color: '#030B15' }}>{fmt12(rec.checkInTime) || '—'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LogOut size={14} color="#DC2626" />
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    Out: <strong style={{ color: '#030B15' }}>{rec.checkOutTime ? fmt12(rec.checkOutTime) : (rec.stillCheckedIn ? 'Still inside' : '—')}</strong>
                  </span>
                </div>
                {rec.stayHours != null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Timer size={14} color="#0C2A47" />
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>Stayed: <strong style={{ color: '#030B15' }}>{formatHoursMinutes(rec.stayHours)}</strong></span>
                  </div>
                )}
              </div>

              {(rec.scheduledHours != null || rec.flexiHoursDeducted > 0) && (
                <div style={{ paddingTop: 8, borderTop: '1px dashed rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <StayBreakdownBar
                    scheduledHours={rec.scheduledHours}
                    beforeClassHours={rec.beforeClassHours}
                    afterClassHours={rec.afterClassHours}
                    totalStayHours={rec.stayHours}
                  />
                  {rec.flexiHoursDeducted > 0 && (
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: '#C2410C', background: '#FFEDD5',
                      padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                    }}>
                      <Zap size={11} /> Flexi hours deducted: {formatHoursMinutes(rec.flexiHoursDeducted)}
                    </span>
                  )}
                </div>
              )}

              {/* Exact time windows where flexi hours were deducted */}
              {rec.flexiWindows?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {rec.flexiWindows.map((w, wi) => <FlexiWindowRow key={wi} w={w} />)}
                </div>
              )}

              {rec.remarks && (
                <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>“{rec.remarks}”</p>
              )}
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              <span>Total stay: {formatHoursMinutes(day.totalStayHours)}</span>
              <span style={{ color: day.totalFlexiHours > 0 ? '#C2410C' : '#94A3B8' }}>Flexi used: {formatHoursMinutes(day.totalFlexiHours, { showZeroHours: true })}</span>
            </div>
            {(day.totalBeforeClassHours > 0 || day.totalAfterClassHours > 0) && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, fontWeight: 700 }}>
                <span style={{ color: '#475569' }}>Class time: {formatHoursMinutes(day.totalScheduledHours, { showZeroHours: true })}</span>
                {day.totalBeforeClassHours > 0 && <span style={{ color: '#B45309' }}>Before class: {formatHoursMinutes(day.totalBeforeClassHours)}</span>}
                {day.totalAfterClassHours > 0 && <span style={{ color: '#C2410C' }}>After class: {formatHoursMinutes(day.totalAfterClassHours)}</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentFlexReportPage = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [flexHistory, setFlexHistory] = useState([]); // per-day, flat
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  // ── Fetch data ──
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        setLoading(true);
        setNotFound(false);

        // classes are needed to resolve which of the student's classTimings
        // entries are paid/free flexi hour packages
        const classRes = await getClassesAPI({ limit: 100 });
        const classes = Array.isArray(classRes) ? classRes : (classRes?.data || []);

        // getStudentsAPI returns the RAW axios response, so the backend
        // envelope lives at studentsRes.data, and the actual array at
        // studentsRes.data.data.
        const studentsRes = await getStudentsAPI({ limit: 1000 });
        const envelope = studentsRes?.data || {};
        const students = Array.isArray(envelope) ? envelope : (Array.isArray(envelope.data) ? envelope.data : []);
        const currentStudent = students.find(s => s._id === studentId || s.admissionNo === studentId);

        if (!currentStudent) {
          if (!cancelled) {
            setNotFound(true);
            setToast({ message: 'Student not found', type: 'error' });
            setTimeout(() => navigate(window.location.pathname.includes('/teacher') ? '/teacher/flexi-hours-history' : '/admin/flexi-hours-history'), 1800);
          }
          return;
        }

        if (cancelled) return;
        setStudent(currentStudent);
        setSummary(calculateFlexHoursSummary(currentStudent, classes));

        const attRes = await getAttendanceHistory(currentStudent._id);
        if (cancelled) return;

        if (attRes.success) {
          const processed = processFlexHistory(attRes.data);
          setFlexHistory(processed);

          // Default calendar to the most recent month that actually has
          // records, so admins land somewhere meaningful; falls back to
          // the real current month if there's no history at all yet.
          if (processed.length > 0) {
            const [y, m] = processed[0].date.split('-').map(Number);
            setCalYear(y);
            setCalMonth(m);
          }
        } else {
          setToast({ message: attRes.error || 'Error loading attendance history', type: 'error' });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (!cancelled) setToast({ message: 'Error loading data', type: 'error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (studentId) fetchData();
    return () => { cancelled = true; };
  }, [studentId, navigate]);

  const monthlyGroups = useMemo(() => formatFlexHistoryDisplay(flexHistory), [flexHistory]);
  const calendarMap = useMemo(() => buildCalendarMap(flexHistory), [flexHistory]);

  const currentMonthGroup = useMemo(
    () => monthlyGroups.find(m => m.year === calYear && m.month === calMonth) || null,
    [monthlyGroups, calYear, calMonth]
  );

  const monthMatrix = useMemo(() => buildMonthMatrix(calYear, calMonth), [calYear, calMonth]);

  const goToMonth = (deltaMonths) => {
    let m = calMonth + deltaMonths;
    let y = calYear;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDateKey(null);
  };

  const goToToday = () => {
    const d = new Date();
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth() + 1);
    setSelectedDateKey(todayKey());
  };

  const downloadCsv = () => {
    try {
      const { headers, rows } = generateDailyHistoryCsvRows(flexHistory);
      const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${student?.fullName || 'Student'}_FlexReport_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast({ message: 'Report downloaded', type: 'success' });
    } catch {
      setToast({ message: 'Error downloading report', type: 'error' });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#0C2A47' }} />
          <p style={{ fontSize: 14, fontWeight: 600, color: '#64748B' }}>Loading flex report...</p>
        </div>
      </div>
    );
  }

  if (notFound || !student) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', gap: 8 }}>
        <AlertCircle size={40} color="#DC2626" />
        <p style={{ fontSize: 14, fontWeight: 600, color: '#DC2626' }}>Student not found — redirecting...</p>
      </div>
    );
  }

  const selectedDay = selectedDateKey ? calendarMap[selectedDateKey] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '16px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .flex-report-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
        .flex-report-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; }
        .flex-cal-cell { aspect-ratio: 1 / 0.9; }
        .flex-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
        .flex-toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .flex-view-toggle { margin-left: auto; }
        @media (max-width: 900px) {
          .flex-report-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .flex-report-stats { grid-template-columns: repeat(2, 1fr); }
          .flex-cal-cell { aspect-ratio: 1 / 1; }
          .flex-view-toggle { margin-left: 0; width: 100%; }
          .flex-view-toggle button { flex: 1; justify-content: center; }
          .flex-toolbar { justify-content: center; }
        }
        @media (max-width: 420px) {
          .flex-report-stats { grid-template-columns: 1fr 1fr; }
          .flex-cal-grid > div > span:first-child { font-size: 10px !important; }
        }
      `}</style>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header */}
      <div style={{ maxWidth: 1240, margin: '0 auto 20px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate(window.location.pathname.includes('/teacher') ? '/teacher/flexi-hours-history' : '/admin/flexi-hours-history')} style={{
          width: 40, height: 40, borderRadius: 10, border: 'none', background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
          <ChevronLeft size={20} color="#0C2A47" />
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: '#030B15' }}>Flex Hours Report</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B', fontWeight: 600 }}>Full check-in / check-out history & flexi hour usage</p>
        </div>
        <button onClick={downloadCsv} style={{
          padding: '10px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)',
          color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 12px rgba(5,150,105,0.3)', transition: 'all .15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
          <Download size={15} /> Download CSV
        </button>
      </div>

      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Student Card */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(150deg,#60A5FA,#0C2A47)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 22,
            boxShadow: '0 10px 18px -6px rgba(37,99,235,0.5), inset 0 -4px 6px rgba(0,0,0,0.18), inset 0 2px 3px rgba(255,255,255,0.45)',
            flexShrink: 0,
          }}>
            {(student.fullName || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#030B15' }}>{student.fullName}</h2>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, color: '#64748B', fontWeight: 600, flexWrap: 'wrap' }}>
              <span>ID: {student.admissionNo}</span>
              <span>Status: {student.status}</span>
              {student.className && <span>Class: {student.className}</span>}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="flex-report-stats">
            <StatCard icon={PiggyBank} label="Free Hours" hours={summary.totalFree} color="green" sublabel="gifted with plan" />
            <StatCard icon={Wallet} label="Paid Hours" hours={summary.totalPaid} color="amber" sublabel="purchased" />
            <StatCard icon={TrendingDown} label="Consumed" hours={summary.totalConsumed} color="orange" sublabel={`of ${formatHoursMinutes(summary.totalPaid + summary.totalFree, { showZeroHours: true })} available`} />
            <StatCard icon={Clock} label="Remaining" hours={summary.totalLeft} color={summary.isLow ? 'red' : 'teal'} sublabel={summary.isLow ? 'running low' : 'balance left'} />
            {summary.overstayHours > 0 && (
              <StatCard icon={AlertTriangle} label="Over Balance" hours={summary.overstayHours} color="red" sublabel="beyond free + paid" />
            )}
          </div>
        )}

        <div className="flex-report-grid">
          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Toolbar */}
            <div className="flex-toolbar" style={{ background: '#fff', borderRadius: 14, padding: '12px 14px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => goToMonth(-1)} style={navBtnStyle}><ChevronLeft size={17} /></button>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#030B15', minWidth: 140, textAlign: 'center' }}>
                  {MONTH_NAMES[calMonth - 1]} {calYear}
                </span>
                <button onClick={() => goToMonth(1)} style={navBtnStyle}><ChevronRight size={17} /></button>
              </div>
              <button onClick={goToToday} style={{
                padding: '7px 12px', borderRadius: 8, border: '1.5px solid #BFDBFE', background: '#EFF6FF',
                color: '#0C2A47', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}>Today</button>

              <div className="flex-view-toggle" style={{ display: 'flex', gap: 6, background: '#F1F5F9', borderRadius: 10, padding: 4 }}>
                <button onClick={() => setViewMode('calendar')} style={toggleBtnStyle(viewMode === 'calendar')}>
                  <CalendarDays size={14} /> Calendar
                </button>
                <button onClick={() => setViewMode('list')} style={toggleBtnStyle(viewMode === 'list')}>
                  <List size={14} /> List
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              <>
                {/* Month totals strip */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <MiniStat label="Days attended" value={currentMonthGroup?.days.length || 0} color="blue" isCount />
                  <MiniStat label="Class time" value={formatHoursMinutes(currentMonthGroup?.totalScheduledHours || 0, { showZeroHours: true })} color="slate" />
                  <MiniStat label="Total stay" value={formatHoursMinutes(currentMonthGroup?.totalStayHours || 0, { showZeroHours: true })} color="teal" />
                  <MiniStat label="Flexi used" value={formatHoursMinutes(currentMonthGroup?.totalFlexiHours || 0, { showZeroHours: true })} color="orange" />
                </div>

                {/* Calendar Grid */}
                <div style={{
                  background: '#fff', borderRadius: 18, border: '1px solid #E2E8F0', overflow: 'hidden',
                  boxShadow: '0 12px 32px -12px rgba(15,23,42,0.15), 0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div className="flex-cal-grid" style={{ background: 'linear-gradient(180deg,#F8FAFC,#F1F5F9)', borderBottom: '1.5px solid #E2E8F0' }}>
                    {WEEKDAYS.map(w => (
                      <div key={w} style={{ padding: '10px 4px', textAlign: 'center', fontSize: 11, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>{w}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {monthMatrix.map((week, wi) => (
                      <div key={wi} className="flex-cal-grid">
                        {week.map((day, di) => {
                          if (!day) return <div key={di} style={{ borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }} />;
                          const key = dateKeyFor(calYear, calMonth, day);
                          const dayData = calendarMap[key];
                          const isToday = key === todayKey();
                          const isSelected = key === selectedDateKey;
                          const hasFlexi = dayData?.hasExtraStay;
                          return (
                            <button key={di} onClick={() => setSelectedDateKey(key)} className="flex-cal-cell" style={{
                              border: 'none', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
                              background: isSelected
                                ? 'linear-gradient(160deg,#DBEAFE,#EFF6FF)'
                                : (dayData ? '#fff' : '#FAFBFC'),
                              cursor: 'pointer', padding: '6px 6px',
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4,
                              position: 'relative', transition: 'background .15s, transform .1s',
                              boxShadow: isSelected ? 'inset 0 0 0 1.5px #93C5FD' : 'none',
                            }}
                              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#F8FAFC'; }}
                              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = dayData ? '#fff' : '#FAFBFC'; }}>
                              <span style={{
                                fontSize: 12, fontWeight: isToday ? 900 : 700, color: isToday ? '#fff' : (dayData ? '#030B15' : '#CBD5E1'),
                                background: isToday ? 'linear-gradient(150deg,#60A5FA,#0C2A47)' : 'transparent',
                                width: 20, height: 20, borderRadius: 6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: isToday ? '0 3px 8px -2px rgba(37,99,235,0.7)' : 'none',
                              }}>{day}</span>
                              {dayData && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                                  <span style={{
                                    fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 5, alignSelf: 'flex-start',
                                    background: hasFlexi ? '#FFEDD5' : '#ECFDF5', color: hasFlexi ? '#C2410C' : '#059669',
                                  }}>
                                    {formatHoursMinutes(dayData.totalStayHours)}
                                  </span>
                                  {hasFlexi && (
                                    <span style={{ fontSize: 9, fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Zap size={9} /> {formatHoursMinutes(dayData.totalFlexiHours)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected day detail (shows below the grid so it works well on mobile too) */}
                {selectedDateKey && (
                  <DayDetailPanel dateKey={selectedDateKey} day={selectedDay} onClose={() => setSelectedDateKey(null)} />
                )}
              </>
            ) : (
              // List view
              monthlyGroups.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {monthlyGroups.map((monthData) => (
                    <div key={monthData.monthKey} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ padding: '12px 16px', background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#030B15' }}>{monthData.monthName}</h3>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', background: '#F1F5F9', padding: '4px 10px', borderRadius: 99 }}>
                            {formatHoursMinutes(monthData.totalScheduledHours, { showZeroHours: true })} class
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#0F766E', background: '#F0FDFA', padding: '4px 10px', borderRadius: 99 }}>
                            {formatHoursMinutes(monthData.totalStayHours, { showZeroHours: true })} stay
                          </span>
                          {monthData.totalFlexiHours > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '4px 10px', borderRadius: 99 }}>
                              {formatHoursMinutes(monthData.totalFlexiHours)} flexi
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ padding: '8px' }}>
                        {monthData.days.map((dayData) => (
                          <div key={dayData.date} style={{ padding: '12px', marginBottom: 8, borderRadius: 10, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#030B15' }}>{formatDateFull(dayData.date)}</p>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>{formatHoursMinutes(dayData.totalScheduledHours, { showZeroHours: true })} class</span>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>{formatHoursMinutes(dayData.totalStayHours)} stay</span>
                                {dayData.totalFlexiHours > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#C2410C' }}>+{formatHoursMinutes(dayData.totalFlexiHours)} flexi</span>}
                              </div>
                            </div>
                            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {dayData.records.map((rec, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Clock size={12} color="#94A3B8" />
                                    <span>{fmt12(rec.checkInTime) || '—'} → {rec.checkOutTime ? fmt12(rec.checkOutTime) : (rec.stillCheckedIn ? 'Still in' : '—')}</span>
                                    <span>({rec.className})</span>
                                    <StatusBadge status={rec.status} />
                                    {rec.flexiHoursDeducted > 0 && (
                                      <span style={{ color: '#C2410C', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Zap size={11} /> {formatHoursMinutes(rec.flexiHoursDeducted)}
                                      </span>
                                    )}
                                  </div>
                                  {(rec.scheduledHours != null && rec.flexiHoursDeducted > 0) && (
                                    <StayBreakdownBar
                                      scheduledHours={rec.scheduledHours}
                                      beforeClassHours={rec.beforeClassHours}
                                      afterClassHours={rec.afterClassHours}
                                      totalStayHours={rec.stayHours}
                                    />
                                  )}
                                </div>
                              ))}
                              {dayData.records.some(r => r.flexiWindows?.length) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                                  {dayData.records.flatMap(r => r.flexiWindows).map((w, wi) => <FlexiWindowRow key={wi} w={w} />)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 14, padding: '40px 20px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                  <AlertCircle size={32} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#64748B' }}>No attendance data available for this student yet</p>
                </div>
              )
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Month jump list */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto' }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Jump to Month</label>
              {monthlyGroups.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>No history yet</p>
              ) : monthlyGroups.map(month => (
                <button key={month.monthKey} onClick={() => { setCalYear(month.year); setCalMonth(month.month); setSelectedDateKey(null); }} style={{
                  padding: '8px 12px', borderRadius: 8, border: 'none',
                  background: (calYear === month.year && calMonth === month.month) ? '#0C2A47' : '#F8FAFC',
                  color: (calYear === month.year && calMonth === month.month) ? '#fff' : '#64748B',
                  fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                }}>
                  <span>{month.monthName}</span>
                  <span style={{ opacity: 0.75, fontSize: 10 }}>{month.days.length}d</span>
                </button>
              ))}
            </div>

            {/* Info Card */}
            <div style={{ background: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)', borderRadius: 14, padding: 14, border: '1.5px solid #BFDBFE', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Info size={14} color="#0C2A47" style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#0C2A47' }}>About Flex Hours</p>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 16, fontSize: 10.5, color: '#0F766E', fontWeight: 600, lineHeight: 1.6 }}>
                    <li>Free / Paid: hours gifted with the plan or purchased separately</li>
                    <li>Consumed: total flexi hours billed so far, from the student's wallet</li>
                    <li>Remaining: hours still left before extra charges apply</li>
                    <li>For fixed-time classes, flexi hours are the time before/after class beyond a 15 min grace window</li>
                    <li>For hours-based / flexi-time classes, the entire check-in to check-out session counts as flexi time</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const navBtnStyle = {
  width: 32, height: 32, borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
};

const toggleBtnStyle = (active) => ({
  padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: active ? '#fff' : 'transparent', color: active ? '#0C2A47' : '#64748B',
  fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none', transition: 'all .15s',
});

const MiniStat = ({ label, value, color }) => {
  const c = T[color];
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: c.text }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 900, color: c.text }}>{value}</span>
    </div>
  );
};

export default StudentFlexReportPage; 
