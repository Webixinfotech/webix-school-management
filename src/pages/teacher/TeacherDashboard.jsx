import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertCircle, BookOpen, CheckCircle2, ClipboardList,
  Heart, Users, Clock, Gift, ArrowRight, Star
} from 'lucide-react';
import teacherService from '../../services/teacher.service';
import { birthdayAPI } from '../../api/birthday.api';

const getLocalDate = () => {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().split('T')[0];
};

const normalizeClass = cls => ({
  id: cls?._id || cls?.id,
  name: cls?.name || cls?.className || 'Class',
  classType: cls?.classType || 'FIXED_TIME',
  studentCount: cls?.studentCount || 0,
  raw: cls,
});

const typeTone = type => {
  if (type === 'HOURS_BASED') return { bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' };
  if (type === 'FLEX_TIME') return { bg: '#F0FDFA', text: '#0F766E', border: '#99F6E4' };
  return { bg: '#EFF6FF', text: '#0C2A47', border: '#BFDBFE' };
};

const HEALTH_LABELS = {
  fever: 'Fever',
  cough: 'Cough',
  cold: 'Cold',
  vomiting: 'Vomiting',
  stomach_ache: 'Stomach ache',
};

const StatCard = ({ icon: Icon, label, value, sub, tone = '#0C2A47', to }) => {
  const content = (
    <>
      <div className="td-stat-top">
        <div className="td-icon" style={{ background: `${tone}15`, color: tone }}>
          <Icon size={18} strokeWidth={2.4} />
        </div>
        {sub && <span className="td-sub">{sub}</span>}
      </div>
      <p className="td-stat-label">{label}</p>
      <p className="td-stat-value">{value}</p>
    </>
  );
  return to ? <Link to={to} className="td-stat" style={{ display: 'block', textDecoration: 'none' }}>{content}</Link> : <div className="td-stat">{content}</div>;
};

const ActionCard = ({ to, icon: Icon, label, desc, color }) => (
  <Link to={to} className="td-action" style={{ borderColor: `${color}22` }}>
    <div className="td-action-icon" style={{ background: `${color}14`, color }}>
      <Icon size={18} strokeWidth={2.4} />
    </div>
    <strong>{label}</strong>
    <span>{desc}</span>
  </Link>
);

const HealthAlertItem = ({ alert }) => {
  const concernsList = Array.isArray(alert.healthConcerns) ? alert.healthConcerns : [];
  const concerns = concernsList.map(id => HEALTH_LABELS[id] || id).join(', ');

  return (
    <div className="td-alert">
      <div className="td-alert-icon">
        <AlertCircle size={16} />
      </div>
      <div className="td-alert-body">
        <strong>{alert.studentName || 'Student'}</strong>
        <span>{concerns || `${alert.healthConcerns?.length || 0} health concern(s)`}</span>
      </div>
      <span className="td-alert-time">{alert.updatedAt ? new Date(alert.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Today'}</span>
    </div>
  );
};

/* ─────────────── Birthday Card (Zorix Theme) ─────────────── */
function BirthdayCard({ person }) {
  const { name, role, daysRemaining, photo, class: className } = person;

  const getRoleInfo = (role) => {
    switch (role) {
      case 'student':
        return { label: 'Student', color: '#0C2A47', bg: '#EFF6FF' };
      case 'staff':
        return { label: 'Staff', color: '#16A34A', bg: '#F0FDF4' };
      case 'parent-father':
      case 'parent-mother':
      case 'parent':
        return { label: 'Parent', color: '#E2B94D', bg: '#FFFBEB' };
      default:
        return { label: 'Guest', color: '#64748B', bg: '#F1F5F9' };
    }
  };

  const roleInfo = getRoleInfo(role);
  const isToday = daysRemaining === 0;

  let dayLabel;
  let dayColor = '#16A34A';
  if (daysRemaining === 0) {
    dayLabel = 'Today 🎉';
    dayColor = '#E2B94D';
  } else if (daysRemaining === 1) {
    dayLabel = 'Tomorrow';
    dayColor = '#0C2A47';
  } else {
    dayLabel = `In ${daysRemaining} days`;
  }

  return (
    <div className={`birthday-card group ${isToday ? 'birthday-card-today' : ''}`}>
      <div className="birthday-card-icon-wrap">
        <div className="birthday-card-icon">
          {photo ? (
            <img src={photo} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <Gift size={20} color={isToday ? '#E2B94D' : '#0C2A47'} />
          )}
        </div>
        {isToday && (
          <span className="birthday-card-star">
            <Star size={10} color="#fff" />
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

function BirthdayTicker({ birthdays }) {
  if (!birthdays || birthdays.length === 0) return null;
  const extendedList = [...birthdays, ...birthdays];
  return (
    <div className="birthday-ticker-wrap">
      <div className="birthday-ticker-fade birthday-ticker-fade-left" />
      <div className="birthday-ticker-fade birthday-ticker-fade-right" />
      <div className="birthday-ticker">
        {extendedList.map((b, i) => (
          <BirthdayCard key={`${b.id}-${i}`} person={b} />
        ))}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [classes, setClasses] = useState([]);
  const [activityMap, setActivityMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [birthdaysLoading, setBirthdaysLoading] = useState(true);
  const [birthdaysError, setBirthdaysError] = useState(null);
  const date = getLocalDate();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await teacherService.getMyClasses();
        const rawClasses = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
        const normalized = rawClasses.map(normalizeClass).filter(c => c.id);
        setClasses(normalized);
        if (!cancelled) setActivityMap({});
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [date]);

  const fetchUpcomingBirthdays = useCallback(async () => {
    try {
      setBirthdaysError(null);
      setBirthdaysLoading(true);
      const res = await birthdayAPI.getTeacherUpcoming();
      if (res.success) {
        const all = res.data || [];
        const within7Days = all
          .filter((b) => (b.role === 'student' || !b.role) && b.daysRemaining >= 0 && b.daysRemaining <= 7)
          .sort((a, b) => a.daysRemaining - b.daysRemaining);
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

  useEffect(() => {
    fetchUpcomingBirthdays();
  }, [fetchUpcomingBirthdays]);

  const totals = useMemo(() => {
    const students = classes.reduce((sum, c) => sum + Number(c.studentCount || 0), 0);
    const filled = classes.reduce((sum, c) => sum + (activityMap[c.id]?.filled || 0), 0);
    const alerts = classes.reduce((sum, c) => sum + (activityMap[c.id]?.alerts?.length || 0), 0);
    return { students, filled, pending: Math.max(students - filled, 0), alerts };
  }, [classes, activityMap]);

  const alerts = activityMap._alerts || [];

  if (loading) {
    return (
      <div className="td-root td-loading">
        <div className="td-spinner" />
        <p>Loading teacher dashboard…</p>
      </div>
    );
  }

  return (
    <div className="td-root">
      <style>{`
        .td-root { font-family: 'Inter', -apple-system, sans-serif; color: #030B15; }
        .td-page { display:flex; flex-direction:column; gap:18px; max-width:1180px; margin:0 auto; }
        .td-hero { position:relative; overflow:hidden; border-radius:24px; padding:32px; color:#fff; background:linear-gradient(135deg, #0C2A47, #030B15); box-shadow:0 10px 30px rgba(12,42,71,.15); }
        .td-hero::after { content:''; position:absolute; width:400px; height:400px; border-radius:999px; background:linear-gradient(135deg, rgba(226,185,77,0.1), rgba(226,185,77,0)); right:-100px; top:-150px; }
        .td-hero > * { position:relative; z-index:1; }
        .td-eyebrow { font-size:11px; font-weight:800; letter-spacing:.15em; text-transform:uppercase; color: #E2B94D; }
        .td-title { font-size:28px; font-weight:900; line-height:1.2; margin:8px 0 8px; }
        .td-hero p { margin:0; opacity:.85; font-size:14px; font-weight:500; }
        .td-chips { display:flex; gap:8px; flex-wrap:wrap; margin-top:20px; }
        .td-chip { display:inline-flex; align-items:center; gap:6px; border-radius:999px; padding:7px 14px; font-size:12px; font-weight:700; background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.15); backdrop-filter:blur(8px); }
        .td-grid { display:grid; gap:14px; }
        .td-stats { grid-template-columns:repeat(4,minmax(0,1fr)); }
        .td-stat { background:#fff; border:1px solid #F1F5F9; border-radius:20px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,.03); transition:transform .2s ease,box-shadow .2s ease; }
        .td-stat:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(0,0,0,.06); }
        .td-stat-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
        .td-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; }
        .td-sub { font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; background:#F8FAFC; color:#64748B; border: 1px solid #E2E8F0; }
        .td-stat-label { margin:14px 0 4px; color:#64748B; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
        .td-stat-value { font-size:32px; font-weight:900; line-height:1; margin:0; color:#030B15; }
        .td-actions { grid-template-columns:repeat(4,minmax(0,1fr)); }
        .td-action { display:flex; flex-direction:column; gap:12px; text-decoration:none; color:#030B15; background:#fff; border:1px solid #F1F5F9; border-radius:20px; padding:20px; box-shadow:0 4px 12px rgba(0,0,0,.03); transition:all .2s ease; }
        .td-action:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(0,0,0,.06); border-color: #E2E8F0; }
        .td-action-icon { width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
        .td-action strong { font-size:15px; font-weight: 800; }
        .td-action span { font-size:13px; color:#64748B; line-height:1.4; }
        .td-panel { background:#fff; border:1px solid #F1F5F9; border-radius:24px; padding:24px; box-shadow:0 4px 16px rgba(0,0,0,.03); }
        .td-panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; }
        .td-panel-title { display:flex; align-items:center; gap:10px; font-size:18px; font-weight: 900; margin:0; color: #030B15; }
        .td-panel-link { font-size:13px; font-weight:800; color:#0C2A47; text-decoration:none; background: #EFF6FF; padding: 6px 14px; border-radius: 999px; transition: background 0.2s; }
        .td-panel-link:hover { background: #DBEAFE; }
        .td-class-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; }
        .td-class { border:1px solid #F1F5F9; border-radius:18px; padding:16px; background:#fff; box-shadow:0 2px 8px rgba(0,0,0,.02); transition:transform .2s ease,box-shadow .2s ease; }
        .td-class:hover { transform:translateY(-2px); box-shadow:0 8px 16px rgba(0,0,0,.05); border-color: #E2E8F0; }
        .td-class-top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
        .td-class-name { font-weight:800; font-size:15px; }
        .td-type { font-size:10px; font-weight:800; padding:4px 10px; border-radius:999px; text-transform:uppercase; letter-spacing:0.03em; }
        .td-progress { height:6px; border-radius:999px; background:#F1F5F9; overflow:hidden; }
        .td-progress > span { display:block; height:100%; border-radius:999px; background:#E2B94D; }
        .td-meta { display:flex; justify-content:space-between; gap:8px; margin-top:10px; font-size:12px; font-weight:700; color:#64748B; }
        .td-alerts { display:flex; flex-direction:column; gap:10px; }
        .td-alert { display:grid; grid-template-columns:40px 1fr auto; align-items:center; gap:12px; border:1px solid #FECDD3; background:#FFF1F2; border-radius:16px; padding:12px 14px; }
        .td-alert-icon { width:40px; height:40px; border-radius:12px; background:#FECDD3; color:#DC2626; display:flex; align-items:center; justify-content:center; }
        .td-alert-body { min-width:0; }
        .td-alert-body strong { display:block; font-size:14px; font-weight: 800; color: #881337; }
        .td-alert-body span { display:block; margin-top:2px; font-size:12px; color:#BE123C; font-weight:600; }
        .td-alert-time { font-size:12px; font-weight:800; color:#9F1239; white-space:nowrap; }
        .td-empty { text-align:center; padding:32px 12px; color:#94A3B8; font-weight:700; background: #F8FAFC; border-radius: 16px; border: 1px dashed #E2E8F0; }
        .td-loading { min-height:100vh; display: flex; flex-direction: column; align-items:center; justify-content:center; gap:16px; font-weight: 600; color: #64748B; }
        .td-spinner { width:48px; height:48px; border-radius:999px; border:4px solid #F1F5F9; border-top-color:#0C2A47; animation:tdSpin .8s linear infinite; }
        @keyframes tdSpin { to { transform:rotate(360deg); } }
        @media (max-width:980px){ .td-stats,.td-actions,.td-class-grid{grid-template-columns:repeat(2,minmax(0,1fr));} }
        @media (max-width:640px){ .td-hero{padding:24px;border-radius:24px}.td-title{font-size:24px}.td-stats,.td-actions,.td-class-grid{grid-template-columns:1fr}.td-alert{grid-template-columns:36px 1fr}.td-alert-time{grid-column:2}.td-panel-head{align-items:flex-start;flex-direction:column}.td-chip{font-size:11px}.td-panel{padding:18px}.td-stat-value{font-size:28px} }
      `}</style>

      <style>{`
        .birthday-section {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 24px 0;
          background: #fff;
          border: 1px solid #F1F5F9;
          box-shadow: 0 4px 16px rgba(0,0,0,0.03);
        }
        .birthday-section-header {
          position: relative;
          z-index: 2;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 0 24px 20px;
        }
        .birthday-section-title-wrap { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .birthday-section-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-left: auto;
        }
        .birthday-view-all-btn {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          background: #EFF6FF;
          color: #0C2A47;
          font-size: 13px;
          font-weight: 800;
          transition: background 0.2s;
          text-decoration: none;
        }
        .birthday-view-all-btn:hover { background: #DBEAFE; }
        .birthday-icon-3d {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FFFBEB;
          color: #E2B94D;
        }
        .birthday-section-title { color: #030B15; font-size: 18px; font-weight: 900; margin: 0; }
        .birthday-section-sub { color: #64748B; font-size: 13px; font-weight: 600; margin-top: 2px; }
        .birthday-live-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #64748B;
          font-size: 12px;
          font-weight: 800;
        }
        .birthday-live-dot {
          width: 8px; height: 8px; border-radius: 999px;
          background: #10B981;
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
        .birthday-ticker-fade-left { left: 0; background: linear-gradient(90deg, #fff, transparent); }
        .birthday-ticker-fade-right { right: 0; background: linear-gradient(270deg, #fff, transparent); }
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
          gap: 14px;
          padding: 14px 20px;
          margin: 0 8px;
          min-width: 240px;
          border-radius: 18px;
          background: #F8FAFC;
          border: 1px solid #F1F5F9;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .birthday-card:hover {
          transform: translateY(-2px);
          background: #fff;
          border-color: #E2E8F0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .birthday-card-today {
          background: #FFFBEB;
          border-color: #FDE68A;
        }
        .birthday-card-today:hover {
          background: #FFFBEB;
          border-color: #FCD34D;
        }
        .birthday-card-icon-wrap {
          position: relative;
          width: 46px;
          height: 46px;
          flex-shrink: 0;
        }
        .birthday-card-icon {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          border: 1px solid #E2E8F0;
          overflow: hidden;
        }
        .birthday-card-today .birthday-card-icon {
          border-color: #FCD34D;
        }
        .birthday-card-star {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #E2B94D;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #FFFBEB;
        }
        .birthday-card-content { min-width: 0; }
        .birthday-card-name {
          font-size: 14px;
          font-weight: 800;
          color: #030B15;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        .birthday-card-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
        .birthday-card-role {
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          white-space: nowrap;
        }
        .birthday-card-days {
          display: inline-block;
          margin-top: 4px;
          font-size: 12px;
          font-weight: 800;
        }
      `}</style>

      <div className="td-page">
        <section className="td-hero">
          <div className="td-eyebrow">Staff Overview</div>
          <h1 className="td-title">Daily Activity Dashboard</h1>
          <p>Track reports, pending students, and health alerts for your classes today.</p>
          <div className="td-chips">
            <span className="td-chip"><CheckCircle2 size={14} /> {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span className="td-chip"><Users size={14} /> {totals.students} students</span>
            <span className="td-chip"><Heart size={14} /> {totals.alerts} health alert{totals.alerts === 1 ? '' : 's'}</span>
          </div>
        </section>

        {birthdaysLoading ? (
          <div className="h-32 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
        ) : !birthdaysError && upcomingBirthdays.length > 0 ? (
          <section className="birthday-section">
            <div className="birthday-section-header">
              <div className="birthday-section-title-wrap">
                <div className="birthday-icon-3d">
                  <Gift size={24} />
                </div>
                <div className="min-w-0">
                  <p className="birthday-section-title">Upcoming Birthdays</p>
                  <p className="birthday-section-sub">Celebrate your students this week</p>
                </div>
              </div>
              <div className="birthday-section-actions">
                <span className="birthday-live-pill">
                  <span className="birthday-live-dot" />
                  {upcomingBirthdays.length} upcoming
                </span>
                <Link to="/teacher/birthdays" className="birthday-view-all-btn">
                  View All
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            <BirthdayTicker birthdays={upcomingBirthdays} />
          </section>
        ) : (
          birthdaysError && (
            <div style={{ borderRadius: 18, border: '1px solid #FECDD3', background: '#FFF1F2', padding: 16, color: '#9F1239', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              {birthdaysError}
              <button onClick={fetchUpcomingBirthdays} style={{ padding: '8px 16px', background: '#DC2626', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )
        )}

        {error && (
          <div style={{ borderRadius: 18, border: '1px solid #FECDD3', background: '#FFF1F2', padding: 16, color: '#9F1239', fontWeight: 800 }}>
            {error}
          </div>
        )}

        <section className="td-grid td-stats">
          <StatCard to="/teacher/classes" icon={BookOpen} label="My Classes" value={classes.length} tone="#0C2A47" />
          <StatCard to="/teacher/manage-students" icon={Users} label="Students" value={totals.students} tone="#0C2A47" />
          <StatCard to="/teacher/daily-activity" icon={ClipboardList} label="Reports Filled" value={totals.filled} sub={`${totals.students ? Math.round(totals.filled / totals.students * 100) : 0}%`} tone="#E2B94D" />
          <StatCard to="/teacher/daily-activity" icon={Clock} label="Pending" value={totals.pending} tone="#E2B94D" />
        </section>

        <section className="td-grid td-actions">
          <ActionCard to="/teacher/daily-activity" icon={Activity} label="Daily Activity" desc="Mark today's student reports" color="#0C2A47" />
          <ActionCard to="/teacher/classes" icon={Users} label="My Classes" desc="Open class-wise student list" color="#0C2A47" />
          <ActionCard to="/teacher/attendance" icon={CheckCircle2} label="Attendance" desc="Mark Student attendance" color="#E2B94D" />
          <ActionCard to="/teacher/my-attendance" icon={CheckCircle2} label="My Attendance" desc="Mark Your attendance" color="#E2B94D" />
        </section>

        <section className="td-grid" style={{ gridTemplateColumns: totals.alerts ? '1.2fr .8fr' : '1fr' }}>
          <div className="td-panel">
            <div className="td-panel-head">
              <h2 className="td-panel-title"><BookOpen size={20} color="#0C2A47" /> Classes</h2>
              <Link className="td-panel-link" to="/teacher/classes">Manage</Link>
            </div>
            {classes.length === 0 ? (
              <div className="td-empty">No classes assigned yet.</div>
            ) : (
              <div className="td-class-grid">
                {classes.map(cls => {
                  const tone = typeTone(cls.classType);
                  const data = activityMap[cls.id] || { filled: 0, alerts: [] };
                  const pct = cls.studentCount ? Math.round(data.filled / cls.studentCount * 100) : 0;
                  return (
                    <div className="td-class" key={cls.id}>
                      <div className="td-class-top">
                        <span className="td-class-name">{cls.name}</span>
                        <span className="td-type" style={{ background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{cls.classType.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="td-progress"><span style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                      <div className="td-meta">
                        <span>{data.filled}/{cls.studentCount} reports</span>
                        <span style={{ color: data.alerts.length ? '#DC2626' : '#64748B' }}>{data.alerts.length} alert{data.alerts.length === 1 ? '' : 's'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {totals.alerts > 0 && (
            <div className="td-panel">
              <div className="td-panel-head">
                <h2 className="td-panel-title"><AlertCircle size={20} color="#DC2626" /> Health Alerts</h2>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#DC2626', background: '#FECDD3', borderRadius: 999, padding: '4px 10px' }}>{alerts.length}</span>
              </div>
              <div className="td-alerts">
                {alerts.slice(0, 5).map((alert, idx) => <HealthAlertItem key={`${alert.classId}-${alert.studentId}-${idx}`} alert={alert} />)}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}