import { useState, useEffect, useCallback } from 'react';
import { Gift, Bell, RefreshCw, Search, Users, GraduationCap, CalendarDays, Share2, Cake, AlertCircle, X, Palette } from 'lucide-react';
import { birthdayAPI, openWhatsAppShare } from '../../api/birthday.api';
import { getMyTeacherProfileAPI } from '../../api/teachers';
import PosterStudio from '../../components/BirthdayPosterStudio';

const formatDaysRemaining = (days) => {
  if (days === 0) return { label: 'Today!', color: '#E11D48', badge: 'bg-rose-100 text-rose-600 border border-rose-200' };
  if (days === 1) return { label: 'Tomorrow', color: '#D97006', badge: 'bg-amber-100 text-amber-600 border border-amber-200' };
  return { label: `In ${days} days`, color: '#64748B', badge: 'bg-slate-100 text-slate-500 border border-slate-200' };
};

const getInitials = (name = '') =>
  name.trim().split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

const getAvatarGradient = (role) => {
  if (role === 'student') return 'from-blue-400 via-blue-500 to-indigo-600';
  return 'from-emerald-400 via-emerald-500 to-teal-600';
};

function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-7 h-7';
  return <div className={`${s} border-2 border-white/30 border-t-white rounded-full animate-spin`} />;
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
            ? <Cake size={15} className="shrink-0" />
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

function BirthdayCard({ person, onWhatsApp, whatsAppLoading, canViewMobile }) {
  const { label: daysLabel, badge: daysBadge } = formatDaysRemaining(person.daysRemaining);
  const isToday = person.daysRemaining === 0;

  return (
    <div
      className={`group relative bg-white rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5
        ${isToday
          ? `border-rose-200 shadow-lg shadow-rose-100 ring-1 ring-rose-100`
          : 'border-slate-100 shadow-sm hover:shadow-md hover:shadow-blue-200 hover:border-slate-200'}`}
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
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <GraduationCap size={9} />
              Student
            </span>
            {person.class && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                <GraduationCap size={9} />
                Class {person.class}
              </span>
            )}
          </div>

          {canViewMobile && person.phone && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5">
              📱 {person.phone}
            </p>
          )}

          {canViewMobile && person.phone && (
            <div className="mt-3">
              <button
                onClick={() => onWhatsApp(person)}
                disabled={whatsAppLoading === person.id}
                className="w-full flex items-center justify-center gap-2 text-[11px] px-3 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold hover:from-green-600 hover:to-emerald-600 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-green-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
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
          )}
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

const TeacherBirthdaysPage = () => {
  const { toasts, add: addToast, remove: removeToast } = useToast();

  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [whatsAppLoading, setWhatsAppLoading] = useState(null);
  const [canViewMobile, setCanViewMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('birthdays');

  const fetchBirthdays = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await birthdayAPI.getTeacherUpcoming();
      if (res.success) {
        setBirthdays(res.data || []);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load birthdays');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const res = await getMyTeacherProfileAPI();
      const profileData = res.data?.data || res.data || {};
      setCanViewMobile(profileData.permissions?.canViewStudentMobile || false);
    } catch {
      setCanViewMobile(false);
    }
  }, []);

  useEffect(() => {
    fetchBirthdays();
    fetchPermissions();
  }, [fetchBirthdays, fetchPermissions]);

  const handleWhatsApp = async (person) => {
    const message = `🎈 *Happy Birthday, ${person.name}!* 🎂🎉\n\nHope your special day is filled with laughter, cake, and everything you love! Keep shining and making us proud. You're amazing! ⭐🌟\n\nWith love,\n*Your School Family* 🏫`;
    openWhatsAppShare(message, person.phone);
  };

  const filteredBirthdays = birthdays.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const todayCount = birthdays.filter((p) => p.daysRemaining === 0).length;
  const totalCount = birthdays.length;

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="min-h-screen space-y-5 py-5">
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
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
          <button
            onClick={() => setActiveTab('birthdays')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeTab === 'birthdays'
                ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-md'
                : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <CalendarDays size={16} />
            Birthdays
          </button>
          <button
            onClick={() => setActiveTab('poster')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
              ${activeTab === 'poster'
                ? 'bg-gradient-to-r from-rose-500 to-fuchsia-500 text-white shadow-md'
                : 'bg-transparent text-slate-500 hover:bg-slate-50'}`}
          >
            <Palette size={16} />
            Poster Studio
          </button>
        </div>

        {activeTab === 'birthdays' && (
          <>
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

            {!loading && !error && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 transition-all duration-200 hover:shadow-sm">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
                    <GraduationCap size={15} className="text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-800 leading-none">{totalCount}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Students</div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
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

              <div className="p-4">
                {loading ? (
                  <div className="flex justify-center py-14">
                    <SpinnerDark />
                  </div>
                ) : filteredBirthdays.length === 0 ? (
                  <EmptyState filtered={!!search} />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredBirthdays.map((person) => (
                      <BirthdayCard
                        key={person.id}
                        person={person}
                        onWhatsApp={handleWhatsApp}
                        whatsAppLoading={whatsAppLoading}
                        canViewMobile={canViewMobile}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Toast toasts={toasts} remove={removeToast} />
          </>
        )}

        {activeTab === 'poster' && (
          <div className="h-[calc(100vh-220px)] min-h-[640px]">
            <PosterStudio birthdays={birthdays} onToast={addToast} />
          </div>
        )}
      </div>
    </>
  );
};

export default TeacherBirthdaysPage;