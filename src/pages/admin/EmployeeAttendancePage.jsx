import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, AlertTriangle, CalendarDays, Check, CheckCircle2, CheckSquare,
  ChevronLeft, ChevronRight, Clock, Download, History, GraduationCap,
  Phone, QrCode, RefreshCw, Search, Sparkles, Square, Timer, Trash2, Umbrella,
  UserCheck, UserMinus, Users, X, Plus, Pencil, ArrowLeft, List, LayoutGrid,
  ScanLine,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Loader from '../../components/Loader';
import StaticEmployeeQRScanner from '../../components/attendance/StaticEmployeeQRScanner';
import {
  getEmployeeAttendanceSummary,
  markEmployeeAttendanceManual,
  getTeacherAttendanceHistory,
  deleteAttendanceRecord,
  createHoliday,
  getHolidays,
  updateHoliday,
  deleteHoliday,
  getWeeklyOffDays,
  updateWeeklyOffDays,
  fmtTime,
  fmtDate,
  fmtMinutes,
  getStatusConfig,
} from '../../api/employeeAttendance';
import { getQRCode } from '../../api/staffAttendance';
import { teacherService } from '../../api/teachers';

// ─── UTILITIES ────────────────────────────────────────────────────────────────

const todayIso = () => new Date().toISOString().split('T')[0];

const prettyType = (type) =>
  String(type || '-').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

const toIsoTimestamp = (date, time) => {
  if (!date || !time) return undefined;
  const v = new Date(`${date}T${time}:00`);
  return Number.isNaN(v.getTime()) ? undefined : v.toISOString();
};

// Reverse of toIsoTimestamp — pulls a local "HH:mm" out of an ISO string so
// an existing check-in/check-out timestamp can prefill a <input type="time">.
const toHHMM = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

// Normalizes any date-ish string (ISO timestamp or plain "YYYY-MM-DD") down
// to the "YYYY-MM-DD" shape a <input type="date"> needs.
const toDateInputValue = (d) => {
  if (!d) return '';
  const s = String(d);
  return s.length >= 10 ? s.slice(0, 10) : s;
};

// Formats a 24h "HH:mm" shift time (as stored on the teacher record) into a
// friendlier 12h display, e.g. "08:00" -> "8:00 AM".
const fmtShiftTime = (t) => {
  if (!t) return '';
  const [h, m] = String(t).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

// Formats a late duration (in minutes) as "Xh Ym" so it rolls
// up to hours past 60, e.g. 122 -> "2h 2m".
const fmtLateDuration = (mins) => {
  const m = Number(mins) || 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
};

// Compares an employee's actual check-in (ISO timestamp) against their
// scheduled fixed-shift entry time plus the grace period, and reports how
// many minutes late they were. Returns null when a comparison isn't possible
// (no check-in, or no configured entry time on the teacher record).
const computeLateMinutes = (checkInTime, fixedShift) => {
  if (!checkInTime || !fixedShift?.entryTime) return null;
  const [eh, em] = String(fixedShift.entryTime).split(':').map(Number);
  if (Number.isNaN(eh) || Number.isNaN(em)) return null;
  const grace = Number(fixedShift.gracePeriodMinutes ?? 0);
  const d = new Date(checkInTime);
  if (Number.isNaN(d.getTime())) return null;
  const expected = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0);
  const diff = Math.round((d.getTime() - expected.getTime()) / 60000);
  const lateBy = Math.max(0, diff - grace);
  return {
    isLate: lateBy > 0,
    lateByMinutes: lateBy,
    scheduledEntry: fixedShift.entryTime,
    gracePeriodMinutes: grace,
  };
};

// Resolves the final late state for a record: prefers the client-side
// comparison (so late detection honours the employee's own grace/entry),
// and falls back to the backend flag when we can't compute locally.
const getLateInfo = (rec, fixedShift) => {
  const computed = computeLateMinutes(rec?.checkInTime, fixedShift);
  if (computed) return computed;
  if (rec?.isLate || rec?.status === 'Late') {
    return { isLate: true, lateByMinutes: null, scheduledEntry: fixedShift?.entryTime ?? null, gracePeriodMinutes: fixedShift?.gracePeriodMinutes ?? null };
  }
  return null;
};

const statusIcons = {
  Present: CheckCircle2,
  Absent: UserMinus,
  Late: Clock,
  'Half Day': Timer,
  Leave: Umbrella,
  'On Leave': Umbrella,
  Holiday: CalendarDays,
};

const getStatusIcon = (status) => statusIcons[status] || AlertCircle;

// ─── TOAST ────────────────────────────────────────────────────────────────────

const ToastContainer = ({ toasts, remove }) => (
  <div className="fixed top-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl text-sm font-semibold pointer-events-auto transition-all duration-300 border
          ${t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ''}
          ${t.type === 'error'   ? 'bg-rose-50    text-rose-800    border-rose-200'    : ''}
          ${t.type === 'info'    ? 'bg-primary/10    text-primary    border-primary/50'    : ''}
        `}
      >
        {t.type === 'success' && <Check size={16} className="shrink-0 text-emerald-600" />}
        {t.type === 'error'   && <AlertCircle size={16} className="shrink-0 text-rose-600" />}
        {t.type === 'info'    && <AlertCircle size={16} className="shrink-0 text-primary" />}
        <span>{t.message}</span>
        <button onClick={() => remove(t.id)} className="ml-2 opacity-50 hover:opacity-100"><X size={14} /></button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  return { toasts, toast: add, removeToast: remove };
};

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger = false }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl p-6 space-y-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${danger ? 'bg-rose-100' : 'bg-amber-100'}`}>
          <AlertTriangle size={22} className={danger ? 'text-rose-600' : 'text-amber-600'} />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="h-10 px-5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className={`h-10 px-5 rounded-2xl text-sm font-bold text-white transition ${danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-3 text-left transition-all duration-200 w-full
      ${isActive
        ? 'border-rose-300 ring-2 ring-rose-200 shadow-lg'
        : 'border-slate-100 hover:shadow-md hover:-translate-y-0.5'
      }`}
  >
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color} text-white`}>
      <Icon size={18} />
    </div>
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`text-2xl font-black leading-tight ${isActive ? 'text-rose-600' : 'text-slate-900'}`}>{value ?? 0}</p>
    </div>
  </button>
);

// ─── HISTORY DRAWER ───────────────────────────────────────────────────────────

const HistoryDrawer = ({ employee, onClose, toast, staffDirectory = {}, onChanged }) => {
  const [records, setRecords]       = useState([]);
  const [summary, setSummary]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmEdit, setConfirmEdit]     = useState(null); // record pending edit confirmation
  const [editRecord, setEditRecord]       = useState(null); // record currently open in the edit modal

  // Shift/timing reference for this employee, looked up from the directory
  // built on the main page — passed straight through to the edit modal.
  const shiftInfo = staffDirectory?.[employee?.teacherId] || null;

  const now      = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const fetchHistory = useCallback(async () => {
    if (!employee) return;
    setLoading(true); setError('');
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end   = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
    try {
      const res = await getTeacherAttendanceHistory(employee.teacherId, {
        startDate: start, endDate: end, page: 1, limit: 31,
      });
      setSummary(res?.monthlySummary || null);
      setRecords(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }, [employee, year, month]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (recordId) => {
    try {
      const res = await deleteAttendanceRecord(recordId);
      if (res?.success) {
        toast(res.message || 'Record deleted.', 'success');
        setRecords(r => r.filter(x => (x._id || x.id) !== recordId));
        onChanged?.();
      } else toast(res?.message || 'Delete failed.', 'error');
    } catch (err) {
      toast(err?.response?.data?.message || 'Delete failed.', 'error');
    }
    setConfirmDelete(null);
  };

  const handleEditSuccess = () => {
    fetchHistory();
    onChanged?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex">
      <div className="flex-1 bg-slate-900/50" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-red-600">Attendance History</p>
            <h3 className="text-lg font-black text-slate-950">{employee?.employeeName || 'Employee'}</h3>
            <p className="text-xs text-slate-400 font-mono">{employee?.employeeId}</p>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Month navigator */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100">
          <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition">
            <ChevronLeft size={16} />
          </button>
          <span className="font-black text-slate-800 text-sm">{monthName} {year}</span>
          <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Monthly summary pills */}
        {summary && (
          <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-slate-100">
            {[
              { label: 'Present', val: summary.present, cls: 'bg-emerald-100 text-emerald-800' },
              { label: 'Absent',  val: summary.absent,  cls: 'bg-rose-100 text-rose-800'       },
              { label: 'Late',    val: summary.late,    cls: 'bg-amber-100 text-amber-800'      },
              { label: 'Half Day',val: summary.halfDay, cls: 'bg-orange-100 text-orange-800'    },
              { label: 'Leave',   val: summary.leave,   cls: 'bg-sky-100 text-sky-800'          },
              { label: 'Holiday', val: summary.holiday, cls: 'bg-violet-100 text-violet-800'    },
            ].map(({ label, val, cls }) => val > 0 && (
              <span key={label} className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
                {label}: {val}
              </span>
            ))}
          </div>
        )}

        {/* Records */}
        <div className="flex-1 p-5 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader /></div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertCircle size={16} /> {error}
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-500 font-semibold">No records for this month.</div>
          ) : (
            records.map((rec) => {
              const cfg  = getStatusConfig(rec.status);
              const Icon = getStatusIcon(rec.status);
              const rid  = rec._id || rec.id;
              return (
                <div key={rid} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 hover:border-slate-200 transition">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                        <Icon size={14} />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-900">{fmtDate(rec.attendanceDate)}</p>
                        <p className={`text-xs font-bold ${cfg.text}`}>{rec.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className="text-xs text-slate-500">{fmtTime(rec.checkInTime)} → {fmtTime(rec.checkOutTime)}</p>
                        {rec.totalMinutes != null && (
                          <p className="text-xs font-bold text-slate-700">{fmtMinutes(rec.totalMinutes)}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setConfirmEdit(rec)}
                        title="Edit record"
                        className="h-7 w-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(rid)}
                        title="Delete record"
                        className="h-7 w-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {rec.remarks && (
                    <p className="mt-2 text-xs text-slate-500 bg-white rounded-xl px-3 py-2 border border-slate-100 italic">
                      {rec.remarks}
                    </p>
                  )}
                  {rec.markedByRole === 'admin' && (
                    <p className="mt-1.5 text-xs text-slate-400 font-medium">Marked by admin</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Record"
        message="This attendance record will be permanently removed. This action cannot be undone."
        danger
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ConfirmDialog
        open={!!confirmEdit}
        title="Edit Record"
        message={
          confirmEdit
            ? `You're about to edit the ${fmtDate(confirmEdit.attendanceDate)} attendance entry for ${employee?.employeeName || 'this employee'}.`
            : ''
        }
        onConfirm={() => { setEditRecord(confirmEdit); setConfirmEdit(null); }}
        onCancel={() => setConfirmEdit(null)}
      />

      {editRecord && (
        <ManualMarkModal
          employee={employee}
          editRecord={editRecord}
          selectedDate={toDateInputValue(editRecord.attendanceDate)}
          shiftInfo={shiftInfo}
          onClose={() => setEditRecord(null)}
          onSuccess={handleEditSuccess}
          toast={toast}
        />
      )}
    </div>
  );
};

// ─── QR MODAL ────────────────────────────────────────────────────────────────

const QrModal = ({ onClose, toast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remainingTime, setRemainingTime] = useState(0); // seconds remaining for display
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getQRCode();
      const payload = res?.data || res;
      if (payload?.token || payload?.qrPayload) {
        setData(payload);
        // Note: remaining time and timeout will be set up in useEffect below
      } else {
        setError('No QR data received.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load QR code.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── QR REFRESH TIMER ────────────────────────────────────────────────
  // Auto-refresh QR code based on expiresIn from response
  useEffect(() => {
    if (data) {
      const generatedAt = new Date(data.generatedAt).getTime();
      const expiresInMs = data.expiresIn * 1000;
      const expiresAt = generatedAt + expiresInMs;
      const now = Date.now();

      // Calculate initial remaining time
      const initialRemainingMs = Math.max(0, expiresAt - now);
      setRemainingTime(Math.ceil(initialRemainingMs / 1000));

      // Clear any existing timeout and interval
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Set timeout to refresh QR when it expires
      timeoutRef.current = setTimeout(() => {
        load(); // Refresh QR code
      }, initialRemainingMs);

      // Set interval to update remaining time display every second
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingMs = Math.max(0, expiresAt - now);
        setRemainingTime(Math.ceil(remainingMs / 1000));
      }, 1000);

      // Cleanup function
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [data]);

  // Handle expiration check and auto-retry
  useEffect(() => {
    if (data && remainingTime <= 0) {
      // QR has expired, show error and auto-refresh
      toast('QR expired — refreshing…', 'error');
      load(); // Trigger immediate refresh
    }
  }, [data, remainingTime, toast, load]);

  const pct = data ? (Math.min(remainingTime, 60) / 60) * 100 : 0;
  const circumference = 2 * Math.PI * 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="font-black text-slate-950">Staff QR Code</h3>
              <p className="text-xs text-slate-500">Scan to check-in / check-out</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex h-52 items-center justify-center"><Loader /></div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
          ) : data ? (
            <>
              <div className="flex justify-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg width="60" height="60" className="-rotate-90">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                    <circle
                      cx="30" cy="30" r="24" fill="none"
                      stroke={remainingTime > 15 ? '#16a34a' : '#dc2626'}
                      strokeWidth="5"
                      strokeDasharray={circumference}
                      strokeDashoffset={circumference * (1 - pct / 100)}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className={`absolute text-sm font-black ${remainingTime > 15 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {remainingTime}s
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-3 flex justify-center">
                {data.qrPayload ? (
                  <div className="rounded-2xl bg-white p-3">
                    <QRCodeCanvas value={data.qrPayload} size={212} bgColor="#ffffff" fgColor="#111827" level="H" />
                  </div>
                ) : (
                  <div className="h-52 w-52 flex items-center justify-center text-xs text-slate-500 font-mono break-all p-4">{data.token}</div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">QR Payload</p>
                <p className="text-xs font-mono font-semibold text-slate-800 break-all">{data.qrPayload || data.token}</p>
                <p className="text-xs font-mono font-semibold text-slate-800 break-all">{data.token}</p>
              </div>

              <button
                onClick={load}
                className="w-full h-11 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} /> Refresh QR Code
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

// ─── MANUAL MARK MODAL ───────────────────────────────────────────────────────

const ManualMarkModal = ({ employee, selectedDate, editRecord = null, shiftInfo = null, onClose, onSuccess, toast }) => {
  const isEdit = !!editRecord;
  const recordId = editRecord?._id || editRecord?.id;

  const [status,    setStatus]    = useState(editRecord?.status || employee?.status || 'Present');
  const [date,      setDate]      = useState(toDateInputValue(editRecord?.attendanceDate) || selectedDate);
  const [checkIn,   setCheckIn]   = useState(toHHMM(editRecord?.checkInTime));
  const [checkOut,  setCheckOut]  = useState(toHHMM(editRecord?.checkOutTime));
  const [remarks,   setRemarks]   = useState(editRecord?.remarks || '');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const needsTimes = ['Present', 'Late', 'Half Day'].includes(status);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const handleSave = async () => {
    setError('');
    if (date > todayStr) {
      setError('Cannot mark attendance for a future date');
      return;
    }
    if (needsTimes && checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out time must be after check-in time');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        teacherId:      employee.teacherId,
        status,
        attendanceDate: date,
        ...(checkIn  && needsTimes && { checkInTime:  toIsoTimestamp(date, checkIn)  }),
        ...(checkOut && needsTimes && { checkOutTime: toIsoTimestamp(date, checkOut) }),
        ...(remarks  && { remarks }),
        // When editing an existing record, include its id so the backend
        // updates that entry in place instead of creating a duplicate.
        ...(isEdit && recordId && { recordId }),
      };
      const res = await markEmployeeAttendanceManual(payload);
      if (res?.success) {
        toast(res.message || (isEdit ? 'Attendance updated.' : 'Attendance saved.'), 'success');
        onSuccess();
        onClose();
      } else {
        setError(res?.message || 'Failed to save attendance.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const cfg = getStatusConfig(status);

  // Shift/timing reference pulled from the teacher directory (fixedShift for
  // FIXED_TIME staff, fixedHours for FIXED_HOURS staff) so whoever is
  // marking attendance can see what "on time" looks like for this employee.
  const renderShiftInfo = () => {
    if (!shiftInfo) {
      return (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
            <Clock size={16} />
          </div>
          <p className="text-xs font-semibold text-slate-500">No scheduled timing found for this employee.</p>
        </div>
      );
    }

    const { employeeType, fixedShift, fixedHours } = shiftInfo;

    const ShiftChip = ({ label, value }) => (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-slate-700 border border-primary/50">
        <span className="text-[10px] font-black uppercase tracking-wider text-primary/50">{label}</span>
        {value}
      </span>
    );

    if (employeeType === 'FIXED_TIME' && fixedShift?.entryTime && fixedShift?.exitTime) {
      return (
        <div className="rounded-2xl border border-primary/50 bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Clock size={16} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Scheduled Timing</p>
                <p className="text-sm font-black text-slate-800">Fixed Shift</p>
              </div>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              {prettyType(employeeType)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 rounded-2xl bg-white/70 border border-primary/50 py-4">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Entry</p>
              <p className="text-2xl font-black text-slate-900">{fmtShiftTime(fixedShift.entryTime)}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ArrowLeft size={16} className="rotate-180" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Exit</p>
              <p className="text-2xl font-black text-slate-900">{fmtShiftTime(fixedShift.exitTime)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <ShiftChip label="Grace" value={`${fixedShift.gracePeriodMinutes ?? 0} min`} />
            {fixedShift.halfDayThresholdHours != null && (
              <ShiftChip label="Half Day" value={`< ${fixedShift.halfDayThresholdHours}h`} />
            )}
            {fixedShift.extraHoursPayment && (
              <ShiftChip label="Extra" value="Paid" />
            )}
          </div>
        </div>
      );
    }

    if (employeeType === 'FIXED_HOURS' && fixedHours) {
      return (
        <div className="rounded-2xl border border-primary/50 bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Timer size={16} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">Scheduled Timing</p>
                <p className="text-sm font-black text-slate-800">Fixed Hours</p>
              </div>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
              {prettyType(employeeType)}
            </span>
          </div>

          <div className="flex items-center justify-center rounded-2xl bg-white/70 border border-primary/50 py-4">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Minimum / Day</p>
              <p className="text-2xl font-black text-slate-900">{fixedHours.minimumHours ?? '-'}h</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {fixedHours.halfDayThresholdHours != null && (
              <ShiftChip label="Half Day" value={`< ${fixedHours.halfDayThresholdHours}h`} />
            )}
            {fixedHours.extraHoursPayment && (
              <ShiftChip label="Extra" value="Paid" />
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
          <Clock size={16} />
        </div>
        <p className="text-xs font-semibold text-slate-500">
          {prettyType(employeeType) || 'Employee'} — no fixed timing configured.
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-6">
      <div className="flex w-full max-w-lg flex-col rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[92vh]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-red-50 to-rose-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">{isEdit ? 'Edit Entry' : 'Manual Entry'}</p>
              <h3 className="font-black text-slate-950 leading-tight">{employee?.employeeName || 'Employee'}</h3>
              <p className="text-xs font-mono text-slate-400">{employee?.employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-9 w-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-100 text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {renderShiftInfo()}

          {/* Status chips */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {['Present', 'Absent', 'Late', 'Half Day', 'Leave', 'Holiday'].map((s) => {
                const c = getStatusConfig(s);
                const sel = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`rounded-full px-4 py-2 text-xs font-bold border transition ${sel ? `${c.bg} ${c.text} ${c.border} ring-2 ring-offset-1` : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Attendance Date</label>
            <input
              type="date" value={date} max={todayStr} onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition"
            />
          </div>

          {/* Times (conditional) */}
          {needsTimes && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Check In</label>
                <input
                  type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Check Out</label>
                <input
                  type="time" value={checkOut} min={checkIn || undefined} onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition"
                />
              </div>
            </div>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Remarks (optional)</label>
            <textarea
              value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3}
              placeholder="Add a note…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button onClick={onClose} className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition">
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="flex-1 h-12 rounded-2xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Attendance' : 'Save Attendance'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── HOLIDAY MODAL (full-page) ────────────────────────────────────────────────
// Fetches the full staff list from teacherService.getAll() to build the
// "assign to specific users" searchable picker (independent of any single
// day's attendance records). Confirmed API shape: { success, total, page,
// pages, count, data: [{ _id, employeeId, name, status, holidayCalendar
// ('TEACHING' | 'NON_TEACHING'), photo, phone, classIds, employeeType, ... }] }.
// `employees` (today's summary) is kept only as a fallback in case the
// teacher list API call fails.

const normalizeStaff = (t) => ({
  id:           t._id || t.id,
  name:         t.name || 'Unknown',
  code:         t.employeeId || '',
  type:         String(t.holidayCalendar || '').toUpperCase(), // TEACHING | NON_TEACHING
  status:       t.status || 'Active',
  photo:        t.photo || null,
  phone:        t.phone || '',
  email:        t.email || '',
  employeeType: t.employeeType || '',
  classCount:   Array.isArray(t.classIds) ? t.classIds.length : 0,
  // Alternate identifiers a holiday's `users` array might reference instead
  // of the teacher document's own _id (e.g. the linked login-user's _id).
  altIds: [t._id, t.id, t.userId?._id, t.userId?.id, t.employeeId].filter(Boolean),
});

const StaffAvatar = ({ name, photo, size = 56 }) => {
  const [broken, setBroken] = useState(false);
  const initials = (name || '?').trim().charAt(0).toUpperCase();
  if (photo && !broken) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setBroken(true)}
        style={{ height: size, width: size }}
        className="rounded-2xl object-cover shadow-md ring-1 ring-black/5"
      />
    );
  }
  return (
    <div
      style={{ height: size, width: size }}
      className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-600 text-white font-black shadow-md ring-1 ring-black/5"
    >
      <span style={{ fontSize: size * 0.36 }}>{initials}</span>
    </div>
  );
};

const HolidayModal = ({ holiday, employees = [], onClose, onSuccess, toast }) => {
  const isEdit = !!holiday;
  const [form, setForm] = useState({
    date:         holiday?.date         || todayIso(),
    name:         holiday?.name         || '',
    applicableTo: holiday?.applicableTo || 'BOTH',
    description:  holiday?.description  || '',
    isPaid:       holiday?.isPaid       ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // ── Full staff list (fetched once, filtered client-side by type) ──
  const [staffList,    setStaffList]    = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStaffLoading(true);
      try {
        const res = await teacherService.getAll({ limit: 1000 });
        const raw = Array.isArray(res?.data) ? res.data
                  : Array.isArray(res?.teachers) ? res.teachers
                  : Array.isArray(res) ? res
                  : [];
        if (!cancelled) setStaffList(raw.map(normalizeStaff));
      } catch {
        if (!cancelled) {
          // Fallback: derive whatever staff we already have from today's summary
          setStaffList(
            employees.map((e) => ({
              id: e.teacherId || e.employeeId,
              name: e.employeeName || 'Unknown',
              code: e.employeeId || '',
              type: String(e.employeeType || '').toUpperCase(),
              photo: e.photo || null,
              phone: e.phone || '',
              employeeType: e.employeeType || '',
              classCount: Array.isArray(e.classIds) ? e.classIds.length : 0,
              altIds: [e.teacherId, e.employeeId].filter(Boolean),
            }))
          );
        }
      } finally {
        if (!cancelled) setStaffLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Specific-user assignment state ──
  // Raw users saved on this holiday (could be plain id strings, or populated
  // objects like { _id, name, employeeId }) — kept as-is for re-matching
  // once the full staff list has loaded.
  const rawInitialUsersRef = useRef(Array.isArray(holiday?.users) ? holiday.users : []);
  const usersResolvedRef   = useRef(false);

  const [selectedUsers, setSelectedUsers] = useState(
    rawInitialUsersRef.current.map((u) => (typeof u === 'string' ? u : (u._id || u.id))).filter(Boolean)
  );
  const [userSearch, setUserSearch] = useState('');

  // Once the real staff list has loaded, reconcile the holiday's saved users
  // against it — matching on teacher _id, linked user _id, or employeeId —
  // so previously-assigned staff show up checked even if the saved id format
  // differs from the teacher document's own _id.
  useEffect(() => {
    if (usersResolvedRef.current) return;
    if (!isEdit || rawInitialUsersRef.current.length === 0) { usersResolvedRef.current = true; return; }
    if (staffList.length === 0) return; // wait for staff list to finish loading
    const matchedIds = staffList
      .filter((s) => rawInitialUsersRef.current.some((ru) => {
        if (typeof ru === 'string') return ru === s.id || s.altIds.includes(ru);
        const ruId = ru._id || ru.id;
        return ruId === s.id || s.altIds.includes(ruId) || (ru.employeeId && ru.employeeId === s.code);
      }))
      .map((s) => s.id);
    if (matchedIds.length > 0) setSelectedUsers(matchedIds);
    usersResolvedRef.current = true;
  }, [staffList, isEdit]);

  const isFirstRender = useRef(true);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const showUserPicker = form.applicableTo === 'TEACHING' || form.applicableTo === 'NON_TEACHING';

  // Reset the specific-user selection whenever the applicableTo group changes
  // (skip on first render so an existing holiday's pre-selected users survive open).
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSelectedUsers([]);
    setUserSearch('');
  }, [form.applicableTo]);

  const eligibleUsers = useMemo(
    () => staffList
      .filter((s) => s.type === form.applicableTo)
      .sort((a, b) => {
        const aActive = a.status === 'Active' ? 0 : 1;
        const bActive = b.status === 'Active' ? 0 : 1;
        if (aActive !== bActive) return aActive - bActive;
        return String(a.name).localeCompare(String(b.name));
      }),
    [staffList, form.applicableTo]
  );

  const filteredEligible = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return eligibleUsers;
    return eligibleUsers.filter((s) =>
      [s.name, s.code, s.phone].some((v) => String(v || '').toLowerCase().includes(term))
    );
  }, [eligibleUsers, userSearch]);

  const toggleUser = (uid) => {
    setSelectedUsers((s) => (s.includes(uid) ? s.filter((x) => x !== uid) : [...s, uid]));
  };

  const allFilteredSelected = filteredEligible.length > 0 &&
    filteredEligible.every((u) => selectedUsers.includes(u.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const idsToRemove = new Set(filteredEligible.map((u) => u.id));
      setSelectedUsers((prev) => prev.filter((id) => !idsToRemove.has(id)));
    } else {
      setSelectedUsers((prev) => Array.from(new Set([...prev, ...filteredEligible.map((u) => u.id)])));
    }
  };

  const userLabel = (uid) => {
    const u = staffList.find((s) => s.id === uid);
    return u?.name || 'Unknown Staff';
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.date) { setError('Name and date are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        ...(showUserPicker && selectedUsers.length > 0 && { users: selectedUsers }),
      };
      const res = isEdit
        ? await updateHoliday(holiday._id || holiday.id, payload)
        : await createHoliday(payload);
      if (res?.success) {
        toast(res.message || (isEdit ? 'Holiday updated.' : 'Holiday created.'), 'success');
        onSuccess();
        onClose();
      } else {
        setError(res?.message || 'Operation failed.');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 overflow-hidden">
      {/* ── Ambient background flourish ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
      </div>

      {/* ── Header ── */}
      <div className="relative z-10 shrink-0 bg-gradient-to-r from-violet-700 via-violet-600 to-indigo-600 shadow-lg shadow-violet-900/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <ArrowLeft size={19} />
            </button>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-inner backdrop-blur-sm">
              <CalendarDays size={20} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-100">
                <Sparkles size={11} /> Holiday Calendar
              </p>
              <h1 className="truncate text-lg font-black text-white sm:text-xl">
                {isEdit ? 'Edit Holiday' : 'Add New Holiday'}
              </h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 sm:flex"
          >
            <X size={19} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[400px_1fr] xl:items-start">

            {/* ── Details card ── */}
            <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_20px_45px_-20px_rgba(76,29,149,0.35)] backdrop-blur-sm sm:p-6 xl:sticky xl:top-6">
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-violet-700">Holiday Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Holiday Name *</label>
                  <input
                    type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
                    placeholder="e.g. Independence Day"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Date *</label>
                  <input
                    type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Applicable To</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: 'BOTH', l: 'Both' },
                      { v: 'TEACHING', l: 'Teaching' },
                      { v: 'NON_TEACHING', l: 'Non-Teach' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => set('applicableTo', opt.v)}
                        className={`h-10 rounded-2xl text-xs font-bold transition ${
                          form.applicableTo === opt.v
                            ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-300'
                            : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                  <textarea
                    value={form.description} onChange={(e) => set('description', e.target.value)} rows={3}
                    placeholder="Optional description…"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-bold text-slate-700">Paid Holiday</span>
                  <div
                    onClick={() => set('isPaid', !form.isPaid)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${form.isPaid ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isPaid ? 'translate-x-5' : ''}`} />
                  </div>
                </label>

                {showUserPicker && (
                  <div className="rounded-2xl border border-violet-100 bg-violet-50 px-4 py-3 text-xs font-semibold text-violet-700">
                    {selectedUsers.length > 0
                      ? `${selectedUsers.length} specific ${prettyType(form.applicableTo)} staff selected →`
                      : `Applies to all ${prettyType(form.applicableTo)} staff unless you pick specific staff →`}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    <AlertCircle size={15} /> {error}
                  </div>
                )}
              </div>
            </div>

            {/* ── Staff picker ── */}
            {showUserPicker ? (
              <div className="rounded-3xl border border-white bg-white/90 p-5 shadow-[0_20px_45px_-20px_rgba(76,29,149,0.35)] backdrop-blur-sm sm:p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-violet-700">
                      Assign to Specific Staff
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Leave empty to apply to every {prettyType(form.applicableTo)} staff member.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-black text-violet-700">
                      {selectedUsers.length} selected
                    </span>
                    {selectedUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedUsers([])}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Search + select all */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder={`Search ${prettyType(form.applicableTo)} staff by name, code or phone…`}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={filteredEligible.length === 0}
                    className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 text-xs font-bold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {allFilteredSelected ? <CheckSquare size={15} /> : <Square size={15} />}
                    {allFilteredSelected ? 'Unselect All' : 'Select All'}
                  </button>
                </div>

                {/* Staff grid */}
                {staffLoading ? (
                  <div className="flex items-center justify-center py-16"><Loader /></div>
                ) : eligibleUsers.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                    <Users size={26} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">No {prettyType(form.applicableTo)} staff found.</p>
                  </div>
                ) : filteredEligible.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
                    <Search size={26} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">No matching staff found.</p>
                  </div>
                ) : (
                  <div className="grid max-h-[60vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
                    {filteredEligible.map((u) => {
                      const checked = selectedUsers.includes(u.id);
                      const inactive = u.status && u.status !== 'Active';
                      return (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => toggleUser(u.id)}
                          className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3 pt-4 text-center transition-all duration-200 ${
                            checked
                              ? 'border-violet-500 bg-gradient-to-b from-violet-50 to-white shadow-[0_10px_25px_-10px_rgba(124,58,237,0.5)] -translate-y-0.5'
                              : 'border-slate-100 bg-white hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg'
                          } ${inactive ? 'opacity-60' : ''}`}
                        >
                          {checked && (
                            <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg ring-2 ring-white">
                              <Check size={13} />
                            </span>
                          )}

                          <StaffAvatar name={u.name} photo={u.photo} size={56} />

                          <div className="w-full min-w-0">
                            <p className="truncate text-xs font-black text-slate-900">{u.name}</p>
                            {u.code && <p className="truncate font-mono text-[10px] text-slate-400">{u.code}</p>}
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-1">
                            {u.classCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-700">
                                <GraduationCap size={9} /> {u.classCount}
                              </span>
                            )}
                            {u.employeeType && (
                              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                                {prettyType(u.employeeType)}
                              </span>
                            )}
                            {inactive && (
                              <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">
                                Inactive
                              </span>
                            )}
                          </div>

                          {u.phone && (
                            <p className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
                              <Phone size={9} /> {u.phone}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-violet-200 bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Users size={26} />
                </div>
                <p className="text-sm font-bold text-slate-600">This holiday applies to everyone</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">
                  Choose &ldquo;Teaching&rdquo; or &ldquo;Non-Teach&rdquo; on the left to pick specific staff members instead of the whole school.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="relative z-10 shrink-0 border-t border-slate-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_-15px_rgba(15,23,42,0.15)] backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-12 rounded-2xl border border-slate-200 px-6 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-sm font-black text-white shadow-lg shadow-violet-300 transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : isEdit ? 'Update Holiday' : 'Add Holiday'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── HOLIDAY CALENDAR SECTION ────────────────────────────────────────────────
// employees: passed down from the main page (the daily attendance summary
// records) so the "Add Holiday" modal can offer a specific-user picker
// without a second API call.

const HolidayCalendarSection = ({ toast, employees = [] }) => {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [modal,    setModal]    = useState(null); // null | 'add' | holidayObj
  const [confirmDel, setConfirmDel] = useState(null);

  // Weekly-off days (0=Sun..6=Sat) — school-wide, applies to every employee.
  // Without this, any day with no attendance record and no Holiday entry
  // (e.g. every Sunday) was wrongly counted as Absent.
  const [weeklyOffDays, setWeeklyOffDays] = useState([]);
  const [savingWeeklyOff, setSavingWeeklyOff] = useState(false);

  const fetchWeeklyOff = useCallback(async () => {
    try {
      const res = await getWeeklyOffDays();
      setWeeklyOffDays(res?.data?.weeklyOffDays || []);
    } catch { /* silently ignore — defaults to none configured */ }
  }, []);

  useEffect(() => { fetchWeeklyOff(); }, [fetchWeeklyOff]);

  const toggleWeeklyOffDay = async (dayIndex) => {
    const next = weeklyOffDays.includes(dayIndex)
      ? weeklyOffDays.filter((d) => d !== dayIndex)
      : [...weeklyOffDays, dayIndex];
    setSavingWeeklyOff(true);
    try {
      const res = await updateWeeklyOffDays(next);
      setWeeklyOffDays(res?.data?.weeklyOffDays || next);
      toast('Weekly-off days updated.', 'success');
    } catch (err) {
      toast(err?.response?.data?.message || 'Failed to update weekly-off days.', 'error');
    } finally {
      setSavingWeeklyOff(false);
    }
  };

  const monthName = new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' });

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHolidays({ year, month, ...(filter && { applicableTo: filter }) });
      setHolidays(Array.isArray(res?.data) ? res.data : []);
    } catch { setHolidays([]); }
    finally { setLoading(false); }
  }, [year, month, filter]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  const handleDelete = async (id) => {
    try {
      const res = await deleteHoliday(id);
      if (res?.success) { toast(res.message || 'Holiday deleted.', 'success'); fetchHolidays(); }
      else toast(res?.message || 'Delete failed.', 'error');
    } catch (err) { toast(err?.response?.data?.message || 'Delete failed.', 'error'); }
    setConfirmDel(null);
  };

  // Build mini-calendar days
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const holidayDates = new Set(holidays.map((h) => h.date));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <CalendarDays size={17} />
          </div>
          <div>
            <h2 className="font-black text-slate-950">Holiday Calendar</h2>
            <p className="text-xs text-slate-500">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''} this month</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none">
            <option value="">All Staff</option>
            <option value="TEACHING">Teaching</option>
            <option value="NON_TEACHING">Non-Teaching</option>
            <option value="BOTH">Both</option>
          </select>
          <button onClick={() => setModal('add')}
            className="h-9 px-4 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-violet-700 transition">
            <Plus size={14} /> Add Holiday
          </button>
        </div>
      </div>

      {/* Weekly Off — school-wide, applies to every employee's Absent calculation */}
      <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-600">Weekly Off:</span>
        <div className="flex flex-wrap gap-1.5">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => {
            const active = weeklyOffDays.includes(i);
            return (
              <button
                key={i}
                disabled={savingWeeklyOff}
                onClick={() => toggleWeeklyOffDay(i)}
                className={`h-7 px-3 rounded-lg text-xs font-bold transition disabled:opacity-60 ${
                  active ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <span className="text-[11px] text-slate-400">Selected days are treated as a holiday for every employee's attendance.</span>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Mini calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition">
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-black text-slate-800">{monthName} {year}</span>
            <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition">
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="text-xs font-bold text-slate-400 py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isHol = holidayDates.has(iso);
              const isToday = iso === todayIso();
              return (
                <div key={day} className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition
                  ${isHol ? 'bg-violet-600 text-white' : isToday ? 'bg-red-100 text-red-700' : 'text-slate-700 hover:bg-slate-100'}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Holiday list */}
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader /></div>
          ) : holidays.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 font-semibold">No holidays this month.</div>
          ) : (
            holidays.map((h) => {
              const hid = h._id || h.id;
              return (
                <div key={hid} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 hover:border-violet-200 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700 text-xs font-black text-center leading-tight flex-col shrink-0">
                      <span>{new Date(`${h.date}T00:00:00`).toLocaleString('en-IN', { day: '2-digit' })}</span>
                      <span className="text-[9px] uppercase">{new Date(`${h.date}T00:00:00`).toLocaleString('en-IN', { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate">{h.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500">{prettyType(h.applicableTo)}</span>
                        {h.isPaid && <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5">Paid</span>}
                        {Array.isArray(h.users) && h.users.length > 0 && (
                          <span className="rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5">
                            {h.users.length} specific staff
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setModal(h)}
                      className="h-7 w-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDel(hid)}
                      className="h-7 w-7 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {(modal === 'add' || (modal && modal !== 'add')) && (
        <HolidayModal
          holiday={modal === 'add' ? null : modal}
          employees={employees}
          onClose={() => setModal(null)}
          onSuccess={fetchHolidays}
          toast={toast}
        />
      )}
      <ConfirmDialog
        open={!!confirmDel}
        title="Delete Holiday"
        message="This holiday will be removed from the calendar."
        danger
        onConfirm={() => handleDelete(confirmDel)}
        onCancel={() => setConfirmDel(null)}
      />
    </section>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const EmployeeAttendancePage = () => {
  const { toasts, toast, removeToast } = useToast();

  const [records,      setRecords]      = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [statusFilter, setStatusFilter] = useState('All');
  const [query,        setQuery]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  // View mode: defaults to grid on narrow screens, table on wide screens —
  // once the user picks manually it stays put (no auto-switch on resize).
  const [viewMode, setViewMode] = useState(() =>
    (typeof window !== 'undefined' && window.innerWidth < 1024) ? 'grid' : 'table'
  );

  // Staff directory (phone + class) merged in client-side from the existing
  // teacher list endpoint, purely to power search — the attendance summary
  // endpoint itself doesn't return these fields. Keyed by teacherId.
  const [staffDirectory, setStaffDirectory] = useState({});

  // Late/grace calculations only make sense for FIXED_TIME staff — a FIXED_HOURS
  // employee has no scheduled entry time, so returns null (and any stale
  // fixedShift data left over from a past employeeType change is ignored).
  const fixedShiftFor = useCallback((teacherId) => {
    const dir = staffDirectory[teacherId];
    return dir?.employeeType === 'FIXED_TIME' ? dir.fixedShift : null;
  }, [staffDirectory]);

  const [qrOpen,       setQrOpen]       = useState(false);
  const [scanOpen,     setScanOpen]     = useState(false);
  const [manualEmp,    setManualEmp]    = useState(null);
  const [historyEmp,   setHistoryEmp]   = useState(null);

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res     = await getEmployeeAttendanceSummary(selectedDate);
      const payload = res?.data ?? res;
      setSummary(Array.isArray(payload) ? null : (payload?.summary || null));
      setRecords(Array.isArray(payload?.employees) ? payload.employees : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to load attendance.');
      setSummary(null); setRecords([]);
    } finally { setLoading(false); }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Staff directory (phone + class) — fetched once, used only for search ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await teacherService.getAll({ limit: 1000 });
        const raw = Array.isArray(res?.data) ? res.data
                  : Array.isArray(res?.teachers) ? res.teachers
                  : Array.isArray(res) ? res
                  : [];
        if (cancelled) return;
        const byId = {};
        raw.forEach((t) => {
          const classLabels = Array.isArray(t.classIds)
            ? t.classIds
                .map((c) => (c && typeof c === 'object') ? (c.className || c.name || '') : '')
                .filter(Boolean)
            : [];
          byId[t._id || t.id] = {
            phone: t.phone || '',
            classLabels,
            employeeType: t.employeeType || '',
            fixedShift: t.fixedShift || null,
            fixedHours: t.fixedHours || null,
          };
        });
        setStaffDirectory(byId);
      } catch {
        // Silently ignore — search just falls back to name/ID/type/status matching.
        if (!cancelled) setStaffDirectory({});
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Export CSV ──
  const exportCSV = () => {
    if (!records.length) { toast('No data to export.', 'info'); return; }
    const header = ['Name', 'Employee ID', 'Type', 'Status', 'Check In', 'Check Out', 'Hours', 'Late', 'Half Day'];
    const rows = filtered.map((r) => [
      r.employeeName || '-', r.employeeId || r.teacherId || '-', prettyType(r.employeeType),
      r.status || '-', fmtTime(r.checkInTime), fmtTime(r.checkOutTime),
      fmtMinutes(r.totalMinutes), r.isLate ? 'Yes' : 'No', r.isHalfDay ? 'Yes' : 'No'
    ]);
    const csv = [header, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `Attendance_${selectedDate}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    toast('CSV exported successfully.', 'success');
  };

  // ── Filter ──
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return records.filter((r) => {
      // "Late" is derived client-side (status stays "Present"), so match it
      // specially against the computed late info instead of r.status.
      const sm = statusFilter === 'All'
        ? true
        : statusFilter === 'Late'
          ? !!getLateInfo(r, fixedShiftFor(r.teacherId))?.isLate
          : r.status === statusFilter;
      const extra = staffDirectory[r.teacherId] || {};
      const haystack = [
        r.employeeName, r.employeeId, r.employeeType, r.status,
        extra.phone, ...(extra.classLabels || []),
      ];
      const tm = !term || haystack.some((v) => String(v || '').toLowerCase().includes(term));
      return sm && tm;
    });
  }, [records, statusFilter, query, staffDirectory]);

  // Client-side late detection: for every attendance record, compare the
  // actual check-in against that employee's fixed shift entry time + grace
  // period (pulled from the staff directory built above). This is what the
  // summary endpoint's own `isLate` flag fails to honour reliably, so we
  // derive it here from the real scheduled timing. Late employees are a
  // SUBSET of present — never add them into the overall total.
  const lateCount = useMemo(() =>
    records.filter((r) => {
      const fs = fixedShiftFor(r.teacherId);
      return getLateInfo(r, fs)?.isLate;
    }).length,
    [records, staffDirectory]
  );

  const enriched = useMemo(() =>
    filtered.map((r) => {
      const fs = fixedShiftFor(r.teacherId);
      return { ...r, lateInfo: getLateInfo(r, fs) };
    }),
    [filtered, staffDirectory]
  );

  const presentPct = summary?.total ? Math.round(((summary.present || 0) / summary.total) * 100) : 0;
  const statCards  = [
    { label: 'Total',    value: summary?.total,    icon: Users,      color: 'bg-slate-800',    status: 'All' },
    { label: 'Present',  value: summary?.present,  icon: UserCheck,  color: 'bg-emerald-600',  status: 'Present' },
    { label: 'Absent',   value: summary?.absent,   icon: UserMinus,  color: 'bg-rose-600',     status: 'Absent' },
    { label: 'Late',     value: lateCount,         icon: Clock,      color: 'bg-amber-500',    status: 'Late' },
    { label: 'Half Day', value: summary?.halfDay,   icon: Timer,      color: 'bg-orange-500',   status: 'Half Day' },
    { label: 'Holiday',  value: summary?.holiday,   icon: CalendarDays,color:'bg-violet-600',   status: 'Holiday' },
  ];
  const statusOptions = ['All', 'Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday'];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 sm:px-6 lg:px-8">
      <ToastContainer toasts={toasts} remove={removeToast} />

      <div className="mx-auto max-w-7xl space-y-4">

        {/* ── Page Header ── */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm">
                <Users size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">Brain Builder International</p>
                <h1 className="text-xl font-black text-slate-950 sm:text-2xl leading-tight">Employee Attendance</h1>
                <p className="text-xs font-medium text-slate-500">Daily check-in · check-out · payroll status</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-600 cursor-pointer">
                <CalendarDays size={14} className="text-red-500" />
                <input
                  type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none text-xs"
                />
              </label>
              <button onClick={fetchData} disabled={loading}
                className="h-9 px-4 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 transition disabled:opacity-60">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
              <button onClick={() => setQrOpen(true)}
                className="h-9 px-4 rounded-xl bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-red-700 transition">
                <QrCode size={13} /> QR Code
              </button>
              <button onClick={() => setScanOpen(true)}
                title="Scan an employee's ID card to mark their attendance — for staff without a phone"
                className="h-9 px-4 rounded-xl bg-cyan-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-700 transition">
                <ScanLine size={13} /> Scan ID Card
              </button>
              <button onClick={exportCSV}
                className="h-9 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition">
                <Download size={13} /> Export
              </button>
            </div>
          </div>
        </section>

        {/* ── Stat Cards ── */}
        {summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-3 gap-2 sm:gap-3">
              {statCards.map((s) => (
                <StatCard
                  key={s.label}
                  {...s}
                  isActive={statusFilter === s.status}
                  onClick={() => setStatusFilter(s.status)}
                />
              ))}
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-black text-slate-800">{fmtDate(summary.date || selectedDate)}</p>
                  <p className="text-xs text-slate-500">Present strength</p>
                </div>
                <span className={`text-2xl font-black ${presentPct >= 75 ? 'text-emerald-600' : presentPct >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {presentPct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${presentPct >= 75 ? 'bg-emerald-500' : presentPct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${presentPct}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Employee Records ── */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Toolbar */} 
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-950">Employee Records</h2>
                <p className="text-xs text-slate-500">{filtered.length} of {records.length} employees</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query} onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, number, class…"
                    className="h-9 w-52 rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs font-semibold text-slate-800 outline-none focus:border-red-400 transition"
                  />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 outline-none focus:border-red-400 transition">
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    title="Table view"
                    className={`h-9 w-9 flex items-center justify-center transition ${viewMode === 'table' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Grid view"
                    className={`h-9 w-9 flex items-center justify-center transition border-l border-slate-200 ${viewMode === 'grid' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-16 flex items-center justify-center"><Loader /></div>
          ) : error ? (
            <div className="m-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <AlertCircle size={16} /> {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Users size={22} />
              </div>
              <p className="mt-3 text-sm font-bold text-slate-600">No records found</p>
            </div>
          ) : (
            <>
              {/* Table view */}
              {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Employee</th>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Check In</th>
                      <th className="px-4 py-3 text-left">Check Out</th>
                      <th className="px-4 py-3 text-left">Hours</th>
                      <th className="px-4 py-3 text-left">Flags</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {enriched.map((rec, i) => {
                      const cfg  = getStatusConfig(rec.status);
                      const Icon = getStatusIcon(rec.status);
                      return (
                        <tr key={rec.teacherId || rec.employeeId || i} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-red-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {(rec.employeeName || 'E').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-sm leading-tight">{rec.employeeName || 'Unknown'}</p>
                                <p className="font-mono text-xs text-slate-400">{rec.employeeId || rec.teacherId || '-'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-1">
                              {prettyType(rec.employeeType)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                              <Icon size={12} />{rec.status || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">{fmtTime(rec.checkInTime)}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">{fmtTime(rec.checkOutTime)}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-slate-700">{fmtMinutes(rec.totalMinutes)}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1 items-center">
                              {rec.lateInfo?.isLate ? (
                                <span
                                  title={rec.lateInfo.scheduledEntry ? `Late by ${rec.lateInfo.lateByMinutes} min — scheduled ${fmtShiftTime(rec.lateInfo.scheduledEntry)} + ${rec.lateInfo.gracePeriodMinutes}m grace` : `Late by ${rec.lateInfo.lateByMinutes} min`}
                                  className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5"
                                >
                                  <Clock size={10} /> Late{rec.lateInfo.lateByMinutes != null ? ` · ${fmtLateDuration(rec.lateInfo.lateByMinutes)}` : ''}
                                </span>
                              ) : rec.isLate ? (
                                <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">Late</span>
                              ) : null}
                              {rec.isHalfDay && <span className="rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5">Half Day</span>}
                              {rec.holidayName && <span className="rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold px-2 py-0.5">{rec.holidayName}</span>}
                              {!rec.lateInfo?.isLate && !rec.isLate && !rec.isHalfDay && !rec.holidayName && <span className="text-xs text-slate-300">—</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setHistoryEmp(rec)}
                                title="View History"
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition">
                                <History size={13} />
                              </button>
                              <button onClick={() => setManualEmp(rec)}
                                title="Mark Attendance"
                                className="h-7 px-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition">
                                Mark
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              )}

              {/* Grid / card view */}
              {viewMode === 'grid' && (
              <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
                {enriched.map((rec, i) => {
                  const cfg  = getStatusConfig(rec.status);
                  const Icon = getStatusIcon(rec.status);
                  return (
                    <div key={rec.teacherId || rec.employeeId || i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                            {(rec.employeeName || 'E').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-950 text-sm">{rec.employeeName || 'Unknown'}</p>
                            <p className="font-mono text-xs text-slate-400">{rec.employeeId || rec.teacherId || '-'}</p>
                            <p className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">{prettyType(rec.employeeType)}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <Icon size={11} />{rec.status || '-'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 py-2 px-1">
                          <p className="text-[10px] font-bold uppercase text-slate-400">In</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{fmtTime(rec.checkInTime)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 py-2 px-1">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Out</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{fmtTime(rec.checkOutTime)}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 py-2 px-1">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Hrs</p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">{fmtMinutes(rec.totalMinutes)}</p>
                        </div>
                      </div>
                      {(rec.lateInfo?.isLate || rec.isLate || rec.isHalfDay) && (
                        <div className="mt-2 flex gap-1 flex-wrap">
                          {rec.lateInfo?.isLate && (
                            <span
                              title={rec.lateInfo.scheduledEntry ? `Late by ${rec.lateInfo.lateByMinutes} min — scheduled ${fmtShiftTime(rec.lateInfo.scheduledEntry)} + ${rec.lateInfo.gracePeriodMinutes}m grace` : `Late by ${rec.lateInfo.lateByMinutes} min`}
                              className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                            >
                              <Clock size={10} /> Late · {fmtLateDuration(rec.lateInfo.lateByMinutes)}
                            </span>
                          )}
                          {!rec.lateInfo?.isLate && rec.isLate && <span className="rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5">Late</span>}
                          {rec.isHalfDay && <span className="rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5">Half Day</span>}
                        </div>
                      )}
                      {rec.lateInfo?.isLate && (
                        <p className="mt-1.5 text-[9px] font-semibold text-amber-600">
                          Scheduled {rec.lateInfo.scheduledEntry ? fmtShiftTime(rec.lateInfo.scheduledEntry) : '—'} · Grace {rec.lateInfo.gracePeriodMinutes ?? 0}m
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button onClick={() => setHistoryEmp(rec)}
                          className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 hover:bg-slate-100 transition">
                          <History size={12} /> History
                        </button>
                        <button onClick={() => setManualEmp(rec)}
                          className="flex-1 h-9 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition">
                          Mark
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </>
          )}
        </section>

        {/* ── Holiday Calendar ── */}
        <HolidayCalendarSection toast={toast} employees={records} />

      </div>

      {/* ── Modals / Drawers ── */}
      {qrOpen && <QrModal onClose={() => setQrOpen(false)} toast={toast} />}

      {scanOpen && (
        <StaticEmployeeQRScanner
          onClose={() => setScanOpen(false)}
          onSuccess={() => { toast('Attendance marked.', 'success'); fetchData(); }}
        />
      )}

      {manualEmp && (
        <ManualMarkModal
          employee={manualEmp}
          selectedDate={selectedDate}
          shiftInfo={staffDirectory[manualEmp?.teacherId]}
          onClose={() => setManualEmp(null)}
          onSuccess={fetchData}
          toast={toast}
        />
      )}

      {historyEmp && (
        <HistoryDrawer
          employee={historyEmp}
          onClose={() => setHistoryEmp(null)}
          toast={toast}
          staffDirectory={staffDirectory}
          onChanged={fetchData}
        />
      )}
    </div>
  );
};

export default EmployeeAttendancePage;