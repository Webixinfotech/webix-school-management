import { useState, useEffect, useCallback } from 'react';
import {
  Gift, Bell, RefreshCw, Search, Users, GraduationCap,
  Briefcase, Heart, AlertCircle, Share2, X, Cake,
  Phone, BookOpen, Building2, UserCheck, Sparkles,
  PartyPopper, CalendarDays, ChevronRight, Lock
} from 'lucide-react';
import { birthdayAPI, openWhatsAppShare } from '../../api/birthday.api';
import { getMyProfileAPI } from '../../api/teachers';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatDaysRemaining = (days) => {
  if (days === 0) return { label: 'Today!', color: 'text-rose-600 font-bold', badge: 'bg-rose-100 text-rose-600 border border-rose-200' };
  if (days === 1) return { label: 'Tomorrow', color: 'text-amber-600 font-semibold', badge: 'bg-amber-100 text-amber-600 border border-amber-200' };
  return { label: `In ${days} days`, color: 'text-slate-500', badge: 'bg-slate-100 text-slate-500 border border-slate-200' };
};

const getRoleBadge = (role) => {
  if (role === 'student')       return { label: 'Student',  bg: 'bg-blue-50 text-blue-700 border border-blue-200',   icon: GraduationCap };
  if (role === 'staff')         return { label: 'Staff',    bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', icon: Briefcase };
  if (role === 'parent-father') return { label: 'Father',   bg: 'bg-violet-50 text-violet-700 border border-violet-200', icon: UserCheck };
  if (role === 'parent-mother') return { label: 'Mother',   bg: 'bg-pink-50 text-pink-700 border border-pink-200',   icon: Heart };
  return { label: role, bg: 'bg-slate-100 text-slate-600 border border-slate-200', icon: Users };
};

const getInitials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

const getAvatarGradient = (role) => {
  if (role === 'student')       return 'from-blue-400 via-blue-500 to-indigo-600';
  if (role === 'staff')         return 'from-emerald-400 via-emerald-500 to-teal-600';
  if (role === 'parent-father') return 'from-violet-400 via-violet-500 to-purple-600';
  if (role === 'parent-mother') return 'from-pink-400 via-pink-500 to-rose-600';
  return 'from-slate-400 to-slate-600';
};

const getGlowColor = (role) => {
  if (role === 'student')       return 'shadow-blue-200';
  if (role === 'staff')         return 'shadow-emerald-200';
  if (role === 'parent-father') return 'shadow-violet-200';
  if (role === 'parent-mother') return 'shadow-pink-200';
  return 'shadow-slate-200';
};

// Birthday WhatsApp message builder
const buildWhatsAppMessage = (person) => {
  const name = person.name;
  const isParent = person.role?.startsWith('parent');
  const isStaff = person.role === 'staff';

  if (isParent) {
    return `🎂 *Happy Birthday, ${name}!* 🎉\n\nWishing you a day filled with joy, love, and wonderful surprises! May this year bring you health, happiness, and every blessing you deserve. 🌟\n\nWith warm wishes,\n*School Team* 🏫`;
  }
  if (isStaff) {
    return `🎊 *Happy Birthday, ${name}!* 🎂\n\nThank you for your dedication and the wonderful impact you make every day. Wishing you a spectacular birthday and an amazing year ahead full of success and joy! ✨🌟\n\nWith appreciation,\n*School Family* 🏫`;
  }
  return `🎈 *Happy Birthday, ${name}!* 🎂🎉\n\nHope your special day is filled with laughter, cake, and everything you love! Keep shining and making us proud. You're amazing! ⭐🌟\n\nWith love,\n*Your School Family* 🏫`;
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-7 h-7';
  return (
    <div className={`${s} border-2 border-white/30 border-t-white rounded-full animate-spin`} />
  );
}

function SpinnerDark() {
  return <div className="w-7 h-7 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />;
}

function Toast({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl text-sm font-medium pointer-events-auto backdrop-blur-sm border animate-[fadeSlideIn_0.3s_ease]
            ${t.type === 'success'
              ? 'bg-emerald-600/95 text-white border-emerald-500'
              : 'bg-rose-600/95 text-white border-rose-500'}`}
          style={{ animation: 'slideIn 0.25s ease' }}
        >
          {t.type === 'success'
            ? <PartyPopper size={15} className="shrink-0" />
            : <AlertCircle size={15} className="shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100 transition-opacity ml-1">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  return { toasts, add, remove };
}

function AvatarOrPhoto({ person }) {
  const [imgError, setImgError] = useState(false);
  const isToday = person.daysRemaining === 0;

  if (person.photo && !imgError) {
    return (
      <div className={`relative shrink-0 ${isToday ? 'ring-2 ring-rose-400 ring-offset-2 rounded-full' : ''}`}>
        <img
          src={person.photo}
          alt={person.name}
          className="w-12 h-12 rounded-full object-cover"
          onError={() => setImgError(true)}
        />
        {isToday && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
            <Cake size={10} className="text-white" />
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 ${isToday ? 'ring-2 ring-rose-400 ring-offset-2 rounded-full' : ''}`}>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(person.role)} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
        {getInitials(person.name)}
      </div>
      {isToday && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-sm">
          <Cake size={10} className="text-white" />
        </span>
      )}
    </div>
  );
}

function BirthdayCard({ person, onWhatsApp, whatsAppLoading }) {
  const { label: daysLabel, badge: daysBadge } = formatDaysRemaining(person.daysRemaining);
  const { label: roleLabel, bg: roleBg, icon: RoleIcon } = getRoleBadge(person.role);
  const isToday = person.daysRemaining === 0;
  const glowColor = getGlowColor(person.role);

  return (
    <div
      className={`group relative bg-white rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5
        ${isToday
          ? `border-rose-200 shadow-lg shadow-rose-100 ring-1 ring-rose-100`
          : `border-slate-100 shadow-sm hover:shadow-md hover:${glowColor} hover:border-slate-200`
        }`}
    >
      {isToday && (
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400" />
      )}

      <div className="flex items-start gap-3">
        <AvatarOrPhoto person={person} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 text-sm leading-tight truncate">{person.name}</h3>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap shrink-0 ${daysBadge}`}>
              {daysLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${roleBg}`}>
              <RoleIcon size={10} />
              {roleLabel}
            </span>
            {person.class && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                <BookOpen size={9} />
                Class {person.class}
              </span>
            )}
            {person.department && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                <Building2 size={9} />
                {person.department}
              </span>
            )}
          </div>

          {person.phone && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
              <Phone size={10} />
              {person.phone}
            </p>
          )}

          <div className="mt-3">
            <button
              onClick={() => onWhatsApp(person)}
              disabled={whatsAppLoading === person.id}
              className="w-full flex items-center justify-center gap-2 text-[11px] px-3 py-2 rounded-xl
                bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold
                hover:from-green-600 hover:to-emerald-600 active:scale-95
                transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-green-200
                disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {whatsAppLoading === person.id ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <Share2 size={11} />
                  Send WhatsApp Wish
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center col-span-full">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${filtered ? 'bg-slate-100' : 'bg-rose-50'}`}>
        {filtered
          ? <Search size={22} className="text-slate-400" />
          : <CalendarDays size={22} className="text-rose-400" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-700">
        {filtered ? 'No results found' : 'No upcoming birthdays'}
      </h3>
      <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
        {filtered ? 'Try adjusting your filter or search term.' : 'No birthdays in the next 7 days.'}
      </p>
    </div>
  );
}

function NoPermissionState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">No Permission</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          You do not have permission to manage birthdays. Please contact an administrator to request access.
        </p>
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',     label: 'All',      icon: Users },
  { key: 'student', label: 'Students', icon: GraduationCap },
  { key: 'staff',   label: 'Staff',    icon: Briefcase },
  { key: 'parent',  label: 'Parents',  icon: Heart },
];

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const TeacherManageBirthdaysPage = () => {
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [canManageBirthdays, setCanManageBirthdays] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [data, setData]           = useState({ student: [], staff: [], parent: [] });
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch]       = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(null);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await getMyProfileAPI();
      const profile = res.data?.data || res.data || {};
      setCanManageBirthdays(!!profile.permissions?.canManageBirthdays);
    } catch {
      setCanManageBirthdays(false);
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  useEffect(() => { fetchPermissions(); }, [fetchPermissions]);

  const fetchBirthdays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await birthdayAPI.getAdminUpcoming();
      if (res.success) {
        setData({
          student: res.data.student || [],
          staff:   res.data.staff   || [],
          parent:  res.data.parent  || [],
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canManageBirthdays) {
      fetchBirthdays();
    }
  }, [canManageBirthdays, fetchBirthdays]);

  const handleSendNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await birthdayAPI.sendAdminNotifications();
      if (res.success) {
        const { sent, skipped, failed } = res.data;
        addToast(`Sent ${sent} · Skipped ${skipped} · Failed ${failed}`, 'success');
      }
    } catch (err) {
      addToast(err?.response?.data?.message || 'Failed to send notifications', 'error');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleWhatsApp = async (person) => {
    const type = person.role.startsWith('parent') ? 'parent' : person.role;
    const baseId = person.id.replace(/-(father|mother)$/, '');

    try {
      setWhatsAppLoading(person.id);
      if (type === 'student' || type === 'staff') {
        const res = await birthdayAPI.getWhatsAppShare(type, baseId);
        if (res.success) {
          openWhatsAppShare(res.data.shareText, person.phone);
        } else {
          openWhatsAppShare(buildWhatsAppMessage(person), person.phone);
        }
      } else {
        openWhatsAppShare(buildWhatsAppMessage(person), person.phone);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        addToast(err?.response?.data?.message || `You don't have permission to view ${type} birthdays. Using a default message instead.`, 'error');
      }
      openWhatsAppShare(buildWhatsAppMessage(person), person.phone);
    } finally {
      setWhatsAppLoading(null);
    }
  };

  if (permissionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerDark />
      </div>
    );
  }

  if (!canManageBirthdays) {
    return <NoPermissionState />;
  }

  const allPeople = [...data.student, ...data.staff, ...data.parent]
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  const tabData = { all: allPeople, student: data.student, staff: data.staff, parent: data.parent };

  const filtered = (tabData[activeTab] || []).filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    all:     allPeople.length,
    student: data.student.length,
    staff:   data.staff.length,
    parent:  data.parent.length,
  };

  const todayCount = allPeople.filter((p) => p.daysRemaining === 0).length;

  const summaryCards = [
    { label: 'Total',    count: counts.all,     icon: Gift,         gradient: 'from-slate-500 to-slate-700',     bg: 'bg-slate-50 border-slate-200' },
    { label: 'Students', count: counts.student, icon: GraduationCap, gradient: 'from-blue-500 to-indigo-600',   bg: 'bg-blue-50 border-blue-200' },
    { label: 'Staff',    count: counts.staff,   icon: Briefcase,    gradient: 'from-emerald-500 to-teal-600',   bg: 'bg-emerald-50 border-emerald-200' },
    { label: 'Parents',  count: counts.parent,  icon: Heart,        gradient: 'from-violet-500 to-purple-600',  bg: 'bg-violet-50 border-violet-200' },
  ];

  return (
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.15); }
          50%       { box-shadow: 0 0 0 8px rgba(244, 63, 94, 0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .glow-today { animation: pulse-glow 2.5s ease-in-out infinite; }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 40%, #fff 60%, rgba(255,255,255,0.6) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="min-h-screen space-y-5 py-5">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 rounded-2xl p-5 text-white shadow-lg shadow-rose-200">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Cake size={16} className="text-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">Upcoming Birthdays</h1>
              </div>
              <p className="text-pink-100 text-xs flex items-center gap-1.5">
                <CalendarDays size={12} />
                {todayCount > 0
                  ? <span className="font-semibold text-white">{todayCount} birthday{todayCount > 1 ? 's' : ''} today!</span>
                  : 'Next 7 days'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={fetchBirthdays}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl text-xs font-medium transition-all duration-200 disabled:opacity-50 border border-white/20"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={handleSendNotifications}
                disabled={notifLoading || todayCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-white text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg disabled:shadow-none"
                title={todayCount === 0 ? 'No birthdays today' : 'Send push notifications'}
              >
                {notifLoading
                  ? <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                  : <Bell size={13} />}
                Send Notifications
              </button>
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-xs">
            <AlertCircle size={14} className="shrink-0" />
            <span className="flex-1 font-medium">{error}</span>
            <button
              onClick={fetchBirthdays}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-[11px] font-semibold hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary Cards ── */}
        {!loading && !error && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summaryCards.map(({ label, count, icon: Icon, bg }) => (
              <div
                key={label}
                className={`${bg} border rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-sm`}
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${
                  label === 'Total'    ? 'from-slate-400 to-slate-600' :
                  label === 'Students' ? 'from-blue-400 to-indigo-600' :
                  label === 'Staff'    ? 'from-emerald-400 to-teal-600' :
                                         'from-violet-400 to-purple-600'
                } flex items-center justify-center shadow-sm shrink-0`}>
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-800 leading-none">{count}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Tabs */}
          <div className="flex items-center border-b border-slate-100 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSearch(''); }}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all duration-200
                  ${activeTab === key
                    ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon size={13} />
                {label}
                {counts[key] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none
                    ${activeTab === key ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                    {counts[key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/30">
            <div className="relative max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 bg-white placeholder:text-slate-300 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-14">
                <SpinnerDark />
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState filtered={!!search || activeTab !== 'all'} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((person) => (
                  <BirthdayCard
                    key={person.id}
                    person={person}
                    onWhatsApp={handleWhatsApp}
                    whatsAppLoading={whatsAppLoading}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Toast */}
        <Toast toasts={toasts} remove={removeToast} />
      </div>
    </>
  );
};

export default TeacherManageBirthdaysPage;
