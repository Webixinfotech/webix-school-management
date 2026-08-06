// import { useState, useEffect, useCallback } from 'react';
// import { Calendar, ChevronLeft, ChevronRight, Search, Filter, AlertCircle, Star } from 'lucide-react';
// import { calendarAPI } from '../../api/calendar.api';

// // ─── HELPERS ─────────────────────────────────────────────────────────────────
// const CAL_TYPE_LABELS = {
//   SCHOOL_CAL:    'School',
//   KIDS_CLUB_CAL: 'Kids Club',
// };
// const CAL_TYPE_COLORS = {
//   SCHOOL_CAL:    'bg-indigo-100 text-indigo-700',
//   KIDS_CLUB_CAL: 'bg-emerald-100 text-emerald-700',
// };

// function fmtDate(iso) {
//   if (!iso) return '';
//   return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// }

// function Spinner() {
//   return <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />;
// }

// function CalTypePill({ calType }) {
//   return (
//     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAL_TYPE_COLORS[calType] || 'bg-slate-100 text-slate-600'}`}>
//       {CAL_TYPE_LABELS[calType] || calType}
//     </span>
//   );
// }

// // ─── EVENT CARD ───────────────────────────────────────────────────────────────
// function EventCard({ event }) {
//   const isHoliday     = event.isHoliday;
//   const isHighlighted = event.isHighlighted;
//   const accentColor   = event.rowColor && event.rowColor !== '#FFFFFF' ? event.rowColor : null;

//   return (
//     <div
//       className={`bg-white rounded-xl border p-3 sm:p-4 transition-shadow hover:shadow-sm
//         ${isHoliday ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200'}
//         ${isHighlighted ? 'ring-1' : ''}`}
//       style={{
//         ...(isHighlighted && accentColor ? { ringColor: accentColor, borderLeftColor: accentColor, borderLeftWidth: 3 } : {}),
//         ...(isHighlighted && accentColor ? { borderLeft: `3px solid ${accentColor}` } : {}),
//       }}
//     >
//       <div className="flex items-start justify-between gap-2">
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap mb-1">
//             {isHighlighted && <Star size={13} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
//             <span className="font-semibold text-slate-800 text-sm leading-snug">{event.eventName}</span>
//           </div>
//           <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500">
//             {event.time     && <span className="flex items-center gap-1">🕐 {event.time}</span>}
//             {event.className && event.className !== 'All Classes' && (
//               <span className="flex items-center gap-1">👥 {event.className}</span>
//             )}
//           </div>
//         </div>
//         <CalTypePill calType={event.calType} />
//       </div>
//     </div>
//   );
// }

// // ─── DAY GROUP ────────────────────────────────────────────────────────────────
// function DayGroup({ dateStr, day, date, events }) {
//   const isHolidayDay = events.some((e) => e.isHoliday || (e.time === 'School Holiday'));
//   const label = fmtDate(date);

//   return (
//     <div className="mb-4">
//       <div className={`flex items-center gap-2 mb-2 px-1 ${isHolidayDay ? 'text-rose-600' : 'text-slate-600'}`}>
//         <div className={`text-sm font-bold ${isHolidayDay ? 'text-rose-600' : 'text-slate-800'}`}>{day}</div>
//         <div className="text-xs text-slate-400">{label}</div>
//         {isHolidayDay && <span className="text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">Holiday</span>}
//         <div className="flex-1 h-px bg-slate-200" />
//       </div>
//       <div className="space-y-2 pl-0">
//         {events.map((ev) => (
//           <EventCard key={ev._id} event={ev} />
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// export default function ParentCalendarPage() {
//   const [events, setEvents]               = useState([]);
//   const [total, setTotal]                 = useState(0);
//   const [page, setPage]                   = useState(1);
//   const [pages, setPages]                 = useState(1);
//   const [allowedCalTypes, setAllowedCalTypes] = useState([]);
//   const LIMIT                             = 50;

//   const [calTypeFilter, setCalTypeFilter] = useState('');
//   const [loading, setLoading]             = useState(false);
//   const [error, setError]                 = useState('');

//   // Date range: default to current month
//   const now     = new Date();
//   const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
//   const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
//   const lastDayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;

//   const [fromDate, setFromDate] = useState(firstDay);
//   const [toDate, setToDate]     = useState(lastDayStr);

//   const fetchEvents = useCallback(async (pg = 1) => {
//     setLoading(true);
//     setError('');
//     try {
//       const filters = { page: pg, limit: LIMIT };
//       if (calTypeFilter) filters.calType = calTypeFilter;
//       if (fromDate)      filters.from    = fromDate;
//       if (toDate)        filters.to      = toDate;

//       const data = await calendarAPI.getMyEvents(filters);
//       setEvents(data.events || []);
//       setTotal(data.total   || 0);
//       setPages(data.pages   || 1);
//       setPage(pg);
//       if (data.allowedCalTypes) setAllowedCalTypes(data.allowedCalTypes);
//     } catch (err) {
//       setError(err?.response?.data?.message || 'Failed to load calendar.');
//     } finally {
//       setLoading(false);
//     }
//   }, [calTypeFilter, fromDate, toDate]);

//   useEffect(() => { fetchEvents(1); }, [calTypeFilter, fromDate, toDate]);

//   // ── Group events by date ──────────────────────────────────────────────────
//   const grouped = events.reduce((acc, ev) => {
//     const key = ev.dateStr || ev.date?.split('T')[0] || '';
//     if (!acc[key]) acc[key] = { dateStr: ev.dateStr, day: ev.day, date: ev.date, events: [] };
//     acc[key].events.push(ev);
//     return acc;
//   }, {});
//   const groupedList = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

//   // ─── RENDER ──────────────────────────────────────────────────────────────────
//   return (
//     <div className="min-h-screen bg-slate-50 p-4 md:p-6 max-w-2xl mx-auto">
//       {/* Header */}
//       <div className="mb-5">
//         <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
//           <Calendar size={22} className="text-indigo-500" /> School Calendar
//         </h1>
//         <p className="text-sm text-slate-500 mt-0.5">{total} events this period</p>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 space-y-3">
//         {/* Date range */}
//         <div className="grid grid-cols-2 gap-3">
//           <div>
//             <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
//             <input
//               type="date"
//               value={fromDate}
//               onChange={(e) => setFromDate(e.target.value)}
//               className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
//             />
//           </div>
//           <div>
//             <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
//             <input
//               type="date"
//               value={toDate}
//               onChange={(e) => setToDate(e.target.value)}
//               className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
//             />
//           </div>
//         </div>

//         {/* Cal type (only show types allowed for this parent) */}
//         {allowedCalTypes.length > 1 && (
//           <div className="flex gap-2 flex-wrap">
//             <button
//               onClick={() => setCalTypeFilter('')}
//               className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${!calTypeFilter ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
//             >
//               All
//             </button>
//             {allowedCalTypes.map((t) => (
//               <button
//                 key={t}
//                 onClick={() => setCalTypeFilter(t)}
//                 className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${calTypeFilter === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
//               >
//                 {CAL_TYPE_LABELS[t] || t}
//               </button>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Content */}
//       {error && (
//         <div className="flex items-center gap-2 bg-rose-50 text-rose-700 rounded-xl p-4 mb-4 text-sm">
//           <AlertCircle size={16} />{error}
//         </div>
//       )}

//       {loading ? (
//         <div className="flex justify-center py-16"><Spinner /></div>
//       ) : groupedList.length === 0 ? (
//         <div className="text-center py-16">
//           <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
//           <p className="text-slate-500 font-medium">No events found</p>
//           <p className="text-slate-400 text-sm mt-1">Try changing the date range.</p>
//         </div>
//       ) : (
//         <>
//           {groupedList.map((g) => (
//             <DayGroup key={g.dateStr || g.date} {...g} />
//           ))}

//           {/* Pagination */}
//           {pages > 1 && (
//             <div className="flex items-center justify-between pt-4">
//               <span className="text-xs text-slate-500">Page {page} of {pages}</span>
//               <div className="flex gap-1">
//                 <button
//                   onClick={() => fetchEvents(page - 1)}
//                   disabled={page <= 1}
//                   className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-white"
//                 >
//                   <ChevronLeft size={15} />
//                 </button>
//                 <button
//                   onClick={() => fetchEvents(page + 1)}
//                   disabled={page >= pages}
//                   className="p-2 rounded-xl border border-slate-200 disabled:opacity-30 hover:bg-white"
//                 >
//                   <ChevronRight size={15} />
//                 </button>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }



import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, AlertCircle, Star,
  BookOpen, Sparkles, School, RefreshCw, Sun, Moon
} from 'lucide-react';
import { calendarAPI } from '../../api/calendar.api';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CAL_TYPE_LABELS = {
  SCHOOL_CAL:    'School',
  KIDS_CLUB_CAL: 'Kids Club',
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtFullDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

function fmtShortDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function getDayInitial(day = '') {
  return day.slice(0, 3).toUpperCase();
}

// Generate year range options
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

function getMonthRange(year, month) {
  // month is 0-indexed
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

// ─── SPINNER ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-violet-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-400 font-medium">Loading events…</p>
    </div>
  );
}

// ─── CAL TYPE BADGE ───────────────────────────────────────────────────────────
function CalBadge({ calType }) {
  if (calType === 'SCHOOL_CAL') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
        <School size={9} /> School
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <Sparkles size={9} /> Kids Club
    </span>
  );
}

// ─── EVENT ROW ────────────────────────────────────────────────────────────────
function EventRow({ event, isLast }) {
  const isHighlighted = event.isHighlighted;
  const accent = event.rowColor && event.rowColor !== '#FFFFFF' && event.rowColor !== null
    ? event.rowColor
    : null;
  const isHolidayRow = event.time === 'School Holiday' || event.isHoliday;

  return (
    <div
      className={`relative flex items-start gap-3 py-3 ${!isLast ? 'border-b border-slate-100' : ''}`}
    >
      {/* Accent strip */}
      {accent && (
        <div
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full"
          style={{ backgroundColor: accent }}
        />
      )}

      <div className={`flex-1 min-w-0 ${accent ? 'pl-3' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Event name */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {isHighlighted && (
                <Star size={11} className="text-amber-400 flex-shrink-0" fill="currentColor" />
              )}
              {isHolidayRow && (
                <Moon size={11} className="text-rose-400 flex-shrink-0" />
              )}
              <span
                className={`text-sm font-semibold leading-snug
                  ${isHolidayRow ? 'text-rose-700' : 'text-slate-800'}`}
              >
                {event.eventName}
              </span>
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              {event.time && (
                <span className="text-xs text-slate-400">
                  🕐 {event.time}
                </span>
              )}
              {event.className && event.className !== 'All Classes' && (
                <span className="text-xs text-slate-400">
                  👥 {event.className}
                </span>
              )}
            </div>
          </div>

          <CalBadge calType={event.calType} />
        </div>
      </div>
    </div>
  );
}

// ─── DAY CARD ─────────────────────────────────────────────────────────────────
function DayCard({ day, date, events }) {
  const isHolidayDay = events.some(
    (e) => e.isHoliday || e.time === 'School Holiday'
  );
  const isWeekend = day === 'Saturday' || day === 'Sunday';

  return (
    <div
      className={`rounded-2xl border overflow-hidden transition-shadow hover:shadow-sm
        ${isHolidayDay || isWeekend
          ? 'border-rose-100 bg-rose-50/40'
          : 'border-slate-200 bg-white'}`}
    >
      {/* Day header */}
      <div
        className={`flex items-center gap-3 px-4 py-2.5
          ${isHolidayDay || isWeekend ? 'bg-rose-50' : 'bg-slate-50'}`}
      >
        {/* Day pill */}
        <div
          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center text-center shrink-0
            ${isHolidayDay || isWeekend
              ? 'bg-rose-500 text-white'
              : 'bg-indigo-500 text-white'}`}
        >
          <span className="text-[10px] font-bold leading-none opacity-80">
            {getDayInitial(day)}
          </span>
          <span className="text-sm font-bold leading-tight">
            {new Date(date).getDate()}
          </span>
        </div>

        <div>
          <p className={`text-sm font-bold ${isHolidayDay || isWeekend ? 'text-rose-700' : 'text-slate-800'}`}>
            {day}
          </p>
          <p className="text-xs text-slate-400">{fmtShortDate(date)}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {(isHolidayDay || isWeekend) && (
            <span className="text-[10px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
              Holiday
            </span>
          )}
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
        </div>
      </div>

      {/* Events list */}
      <div className="px-4">
        {events.map((ev, i) => (
          <EventRow key={ev._id} event={ev} isLast={i === events.length - 1} />
        ))}
      </div>
    </div>
  );
}

// ─── MONTH NAV ────────────────────────────────────────────────────────────────
function MonthNav({ year, month, onPrev, onNext, onYearChange, onMonthChange }) {
  return (
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <button
        onClick={onPrev}
        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <ChevronLeft size={16} className="text-slate-600" />
      </button>

      <div className="flex items-center gap-2">
        {/* Month selector */}
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="text-sm font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer appearance-none pr-1"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>

        {/* Year selector */}
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="text-sm font-semibold text-slate-500 bg-transparent border-none outline-none cursor-pointer appearance-none"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <button
        onClick={onNext}
        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <ChevronRight size={16} className="text-slate-600" />
      </button>
    </div>
  );
}

// ─── SUMMARY BAR ─────────────────────────────────────────────────────────────
function SummaryBar({ events }) {
  const schoolCount = events.filter((e) => e.calType === 'SCHOOL_CAL').length;
  const kidsCount   = events.filter((e) => e.calType === 'KIDS_CLUB_CAL').length;
  const holidayCount = events.filter((e) => e.isHoliday || e.time === 'School Holiday').length;
  const highlightCount = events.filter((e) => e.isHighlighted).length;

  const stats = [
    { label: 'Total',      value: events.length,  color: 'text-slate-700',  dot: 'bg-slate-400' },
    { label: 'School',     value: schoolCount,    color: 'text-indigo-700', dot: 'bg-indigo-400' },
    { label: 'Kids Club',  value: kidsCount,      color: 'text-emerald-700',dot: 'bg-emerald-400' },
    { label: 'Holidays',   value: holidayCount,   color: 'text-rose-700',   dot: 'bg-rose-400' },
    { label: 'Highlights', value: highlightCount, color: 'text-amber-700',  dot: 'bg-amber-400' },
  ].filter((s) => s.value > 0);

  if (stats.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          <span className={`text-xs font-semibold ${s.color}`}>{s.value}</span>
          <span className="text-xs text-slate-400">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ParentCalendarPage() {
  const now = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const [events,          setEvents]          = useState([]);
  const [total,           setTotal]           = useState(0);
  const [pages,           setPages]           = useState(1);
  const [page,            setPage]            = useState(1);
  const [allowedCalTypes, setAllowedCalTypes] = useState([]);
  const [calTypeFilter,   setCalTypeFilter]   = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');

  const LIMIT = 100;

  // ── Derived date range from year + month ─────────────────────────────────
  const { from, to } = getMonthRange(year, month);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const filters = { page: pg, limit: LIMIT, from, to };
      if (calTypeFilter) filters.calType = calTypeFilter;

      const data = await calendarAPI.getMyEvents(filters);
      setEvents(data.events || []);
      setTotal(data.total  || 0);
      setPages(data.pages  || 1);
      setPage(pg);
      if (data.allowedCalTypes?.length) setAllowedCalTypes(data.allowedCalTypes);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [from, to, calTypeFilter]);

  useEffect(() => { fetchEvents(1); }, [from, to, calTypeFilter]);

  // ── Month nav ──────────────────────────────────────────────────────────────
  const goPrev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setPage(1);
  };
  const goNext = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setPage(1);
  };

  // ── Group events by date ──────────────────────────────────────────────────
  const grouped = events.reduce((acc, ev) => {
    const key = ev.dateStr || ev.date?.split('T')[0] || '';
    if (!acc[key]) acc[key] = { key, dateStr: ev.dateStr, day: ev.day, date: ev.date, events: [] };
    acc[key].events.push(ev);
    return acc;
  }, {});
  const groupedList = Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-sm">
              <Calendar size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">School Calendar</h1>
              <p className="text-xs text-slate-400">Events & schedule for your child</p>
            </div>
            <button
              onClick={() => fetchEvents(page)}
              disabled={loading}
              className="ml-auto p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={15} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Month Navigator ── */}
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4 shadow-sm">
          <MonthNav
            year={year}
            month={month}
            onPrev={goPrev}
            onNext={goNext}
            onYearChange={(y) => { setYear(y); setPage(1); }}
            onMonthChange={(m) => { setMonth(m); setPage(1); }}
          />
        </div>

        {/* ── Cal Type Filter (show only if parent has access to multiple) ── */}
        {allowedCalTypes.length > 1 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', ...allowedCalTypes].map((t) => (
              <button
                key={t || 'all'}
                onClick={() => { setCalTypeFilter(t); setPage(1); }}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all
                  ${calTypeFilter === t
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'}`}
              >
                {t === '' ? 'All' : CAL_TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-4 py-3 mb-4 text-sm">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => fetchEvents(page)}
              className="text-rose-600 underline text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Summary bar ── */}
        {!loading && events.length > 0 && (
          <div className="mb-4">
            <SummaryBar events={events} />
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <Spinner />
        ) : groupedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <Sun size={28} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold">No events this month</p>
            <p className="text-slate-400 text-sm mt-1">
              {MONTHS[month]} {year} has no scheduled events yet.
            </p>
            <button
              onClick={goNext}
              className="mt-4 text-sm text-indigo-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Check next month <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedList.map((g) => (
              <DayCard
                key={g.key || g.date}
                day={g.day}
                date={g.date}
                events={g.events}
              />
            ))}
          </div>
        )}

        {/* ── Pagination (only if needed) ── */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              Showing {events.length} of {total} events · Page {page}/{pages}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => fetchEvents(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <button
                onClick={() => fetchEvents(page + 1)}
                disabled={page >= pages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}