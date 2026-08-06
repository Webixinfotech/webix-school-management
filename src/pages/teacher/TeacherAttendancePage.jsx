import { createElement, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, CameraOff, ScanLine, CheckCircle, XCircle, AlertCircle,
  Users, Calendar, UserCheck, History, BarChart3, Download,
  Search, Edit, QrCode, ChevronLeft, ChevronRight,
  RefreshCw, Clock, BookOpen, Layers, X, Volume2, VolumeX, Info,
  LayoutGrid, List, Eye, ArrowLeft, Timer, TrendingUp, TrendingDown,
  CalendarDays, Activity, LogOut
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

import {
  getAttendanceList,
  getDailyAttendanceSummary,
  markAttendanceAPI,
  scanAttendanceAPI,
  updateAttendanceRecord,
  getStudentAttendanceHistory,
  centerCheckInAPI,
  centerCheckOutAPI
} from '../../api/attendance';
import { getClassStudentsAPI, getMyClassesAPI } from '../../api/classes';
import { classifyAlreadyMarked, formatElapsed } from '../../utils/attendanceFlow';
import {
  getActiveClasses,
  getUnmarkedClasses,
  describeAttendanceResult,
  getRecordCheckOut
} from '../../utils/attendanceEngine';
import { FALLBACK_SESSION_LABEL, CLASS_TYPES } from '../../utils/attendanceConstants';
import AttendanceHistoryPanel from '../../components/attendance/AttendanceHistoryPanel';

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Normalizes any id-ish value (string, number, or a populated object like
// { _id, name }) down to a plain string so comparisons never break just
// because one side is a populated object and the other is a raw id.
const getId = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return String(val._id || val.id || '');
  return String(val);
};

const getStudentDisplayName = (student) =>
  student?.name || `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Unknown';

const truncateEmail = (email) => {
  if (!email) return null;
  return email.length <= 15 ? email : email.substring(0, 15) + '...';
};

const formatDate = (value) => {
  if (!value) return '—';
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value) => {
  if (!value) return '—';
  if (/^\d{1,2}:\d{2}/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const getRecordCheckIn = (record) => record?.checkInTime || record?.markedAt;

const getRecordSchedule = (record, classes = []) => {
  const populatedClass = typeof record?.classId === 'object' ? record.classId : null;
  const classId = getId(record?.classId);
  const matchedClass = classes.find(cls =>
    getId(cls?._id || cls?.id || cls?.classId) === classId ||
    (record?.className && (cls?.name || cls?.className) === record.className)
  );
  const studentTiming = record?.studentId?.timing || record?.studentTiming;
  return {
    startTime: studentTiming?.startTime || populatedClass?.startTime || matchedClass?.startTime || null,
    endTime: studentTiming?.endTime || populatedClass?.endTime || matchedClass?.endTime || null,
  };
};

const getTimingStatus = (record, classes = []) => {
  const checkIn = getRecordCheckIn(record);
  const { startTime } = getRecordSchedule(record, classes);
  if (!checkIn || !startTime) return null;
  const timeOnly = typeof checkIn === 'string' && /^\d{1,2}:\d{2}/.test(checkIn);
  const checkInDate = timeOnly ? null : new Date(checkIn);
  if (!timeOnly && Number.isNaN(checkInDate.getTime())) return null;
  const [hours, minutes] = startTime.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const [actualHours, actualMinutes] = timeOnly
    ? checkIn.split(':').map(Number)
    : [checkInDate.getHours(), checkInDate.getMinutes()];
  const difference = (actualHours * 60 + actualMinutes) - (hours * 60 + minutes);
  if (difference === 0) return { type: 'ontime', minutes: 0, label: 'On time' };
  const absolute = Math.abs(difference);
  const duration = absolute < 60 ? `${absolute} min` : `${Math.floor(absolute / 60)}h ${absolute % 60}m`;
  return difference > 0
    ? { type: 'late', minutes: absolute, label: `Late by ${duration}` }
    : { type: 'early', minutes: absolute, label: `Early by ${duration}` };
};

const TimingBadge = ({ record, classes, compact = false }) => {
  const timing = getTimingStatus(record, classes);
  if (!timing) return <span className="text-xs text-slate-400">—</span>;
  const styles = {
    ontime: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',
    early: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  const Icon = timing.type === 'late' ? TrendingUp : timing.type === 'early' ? TrendingDown : CheckCircle;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border font-bold ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'} ${styles[timing.type]}`}>
      <Icon size={compact ? 11 : 13}/>{timing.label}
    </span>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────────

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-blue-600 text-white'
  };
  return (
    <div className={`fixed bottom-6 right-6 z-[200] px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-3 animate-slide-up ${colors[type] || colors.info}`}>
      {type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">✕</button>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const cfg = {
    Present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Absent:  'bg-rose-50 text-rose-700 border-rose-200',
    Late:    'bg-amber-50 text-amber-700 border-amber-200',
    Leave:   'bg-blue-50 text-blue-700 border-blue-200',
    Pending: 'bg-slate-50 text-slate-500 border-slate-200'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${cfg[status] || cfg.Pending}`}>
      {status}
    </span>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 min-w-[110px]">
    <div className={`p-2 rounded-xl ${color}`}>{createElement(icon, { size: 16 })}</div>
    <div>
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-xl font-extrabold text-slate-800 leading-none">{value}</p>
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────────
const HistoryRecordDetail = ({ record, recentRecords, recentLoading, classes, onClose, sessionMap }) => {
  if (!record) return null;
  const schedule = getRecordSchedule(record, classes);
  const timing = getTimingStatus(record, classes);
  const recordCheckOut = getRecordCheckOut(record, sessionMap);
  const admissionNo = record.studentAdmissionNo || record.studentId?.admissionNo;
  const studentName = record.studentName || record.studentId?.name || 'Student';
  const recent = (recentRecords || []).slice(0, 4);
  const fields = [
    ['Record ID', record._id], ['Admission No.', admissionNo],
    ['Session', (record.sessionLabel || 'FULL_DAY').replace(/_/g, ' ')],
    ['Method', record.method], ['Marked by', record.markedBy?.name || record.markedByName],
    ['Role', record.markedByRole || record.markedBy?.role],
    ['Class code', record.classCode || record.classId?.classId],
    ['Class type', record.classId?.classType?.replace?.(/_/g, ' ')],
    ['Section', record.section || record.classId?.section],
    ['Auto checkout', record.isAutoCheckedOut === undefined ? null : record.isAutoCheckedOut ? 'Yes' : 'No'],
    ['Remarks', record.remarks],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  const extraTimeValue = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const minutes = Number(value);
    if (!Number.isFinite(minutes)) return null;
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  };

  const checkoutSourceLabel = record.checkoutSource === 'center_session'
    ? 'Center check-out'
    : record.checkoutSource === 'cron_auto'
      ? 'Auto (class end)'
      : record.checkoutSource === 'manual'
        ? 'Manually entered'
        : '—';

  return (
    <div className="fixed inset-0 z-[250] overflow-y-auto bg-slate-100">
      <header className="sticky top-0 z-10 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/10">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 transition hover:bg-white/25" aria-label="Close attendance detail"><ArrowLeft size={19}/></button>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">Attendance detail</p><h2 className="truncate text-lg font-extrabold sm:text-xl">{studentName}</h2></div>
          <StatusBadge status={record.status}/>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-3 py-4 sm:px-6 sm:py-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-xl sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-emerald-500 text-2xl font-black shadow-lg">
              {record.studentId?.photo ? <img src={record.studentId.photo} alt={studentName} className="h-full w-full object-cover"/> : studentName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-2xl font-black">{studentName}</h3><p className="mt-1 font-mono text-xs text-slate-300">{admissionNo || '—'}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold"><span className="rounded-full bg-white/10 px-3 py-1.5">{record.className || record.classId?.name || '—'}</span><span className="rounded-full bg-white/10 px-3 py-1.5">{formatDate(record.attendanceDateKey || record.attendanceDate)}</span></div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-800"><Timer size={17} className="text-amber-600"/> Timing analysis</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Scheduled start', formatTime(schedule.startTime)], ['Scheduled end', formatTime(schedule.endTime)],
                ['Check in', formatTime(getRecordCheckIn(record))], ['Check out', formatTime(recordCheckOut)],
              ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-base font-extrabold text-slate-800">{value}</p></div>)}
            </div>
            <div className={`mt-4 flex items-center gap-3 rounded-2xl border p-4 ${!timing ? 'border-slate-200 bg-slate-50' : timing.type === 'late' ? 'border-amber-200 bg-amber-50' : timing.type === 'early' ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}>
              <Clock size={20} className={!timing ? 'text-slate-400' : timing.type === 'late' ? 'text-amber-600' : timing.type === 'early' ? 'text-blue-600' : 'text-emerald-600'}/>
              <div><p className="text-sm font-extrabold text-slate-800">{timing?.label || 'Schedule timing unavailable'}</p><p className="mt-0.5 text-xs text-slate-500">Arrival is compared with the scheduled class start.</p></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-800"><Activity size={17} className="text-emerald-600"/> Record information</h3>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-4 py-2.5"><span className="text-xs font-semibold text-slate-400">Status</span><StatusBadge status={record.status}/></div>
              {fields.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 py-2.5"><span className="shrink-0 text-xs font-semibold text-slate-400">{label}</span><span className="break-all text-right text-xs font-bold capitalize text-slate-700">{String(value)}</span></div>)}
              {record.stayMinutes !== undefined && record.stayMinutes !== null && (
                <div className="flex items-start justify-between gap-4 py-2.5"><span className="shrink-0 text-xs font-semibold text-slate-400">Stay Duration</span><span className="break-all text-right text-xs font-bold text-slate-700">{extraTimeValue(record.stayMinutes)}</span></div>
              )}
              {record.extraMinutes !== undefined && record.extraMinutes !== null && (
                <div className="flex items-start justify-between gap-4 py-2.5"><span className="shrink-0 text-xs font-semibold text-slate-400">Extra/Idle Time</span><span className={`break-all text-right text-xs font-bold ${record.extraMinutes > 15 ? 'text-amber-600' : 'text-slate-700'}`}>{extraTimeValue(record.extraMinutes)}</span></div>
              )}
              {record.flexiHoursDeducted !== undefined && record.flexiHoursDeducted > 0 && (
                <div className="flex items-start justify-between gap-4 py-2.5"><span className="shrink-0 text-xs font-semibold text-slate-400">Flexi Hours Deducted</span><span className="break-all text-right text-xs font-bold text-slate-700">{Number(record.flexiHoursDeducted).toFixed(2)} hrs</span></div>
              )}
              {record.checkoutSource && (
                <div className="flex items-start justify-between gap-4 py-2.5"><span className="shrink-0 text-xs font-semibold text-slate-400">Checked Out Via</span><span className="break-all text-right text-xs font-bold text-slate-700">{checkoutSourceLabel}</span></div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800"><CalendarDays size={17} className="text-blue-600"/> Previous attendance</h3><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Last 4 records</span></div>
          {recentLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100"/>)}</div> : recent.length ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{recent.map((item, index) => <div key={item._id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-start justify-between gap-2"><p className="text-xs font-extrabold text-slate-700">{formatDate(item.attendanceDateKey || item.attendanceDate)}</p><StatusBadge status={item.status}/></div><p className="mt-3 text-xs font-semibold text-slate-500">In: <span className="text-slate-800">{formatTime(getRecordCheckIn(item))}</span></p><div className="mt-2"><TimingBadge record={item} classes={classes} compact/></div></div>)}</div>
          ) : <p className="rounded-2xl bg-slate-50 py-8 text-center text-sm text-slate-400">No previous records found.</p>}
        </section>

        {record.editHistory && record.editHistory.length > 0 && (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-800">
              <History size={17} className="text-purple-600"/> Edit history
            </h3>
            <AttendanceHistoryPanel history={record.editHistory} variant="teacher" />
          </section>
        )}
      </main>
    </div>
  );
};

const TeacherAttendancePage = () => {
  const navigate = useNavigate();
  // Core state
  const [classes, setClasses]               = useState([]);
  const [selectedClass, setSelectedClass]   = useState('');
  const [students, setStudents]             = useState([]);
  const [attendance, setAttendance]         = useState([]);
  const [date, setDate]                     = useState(new Date().toISOString().split('T')[0]);
  const [sessionLabel, setSessionLabel]     = useState(FALLBACK_SESSION_LABEL);

  // Loading / UI
  const [pageLoading, setPageLoading]       = useState(true);
  const [dataLoading, setDataLoading]       = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [activeTab, setActiveTab]           = useState('scanner');
  const [toast, setToast]                   = useState(null);
  const [successData, setSuccessData]       = useState(null);
  const [viewImage, setViewImage]           = useState(null); // { url, name }
  const [viewStudent, setViewStudent]       = useState(null);
  const [voiceEnabled, setVoiceEnabled]     = useState(true);
  const [checkedInStudents, setCheckedInStudents] = useState([]);
  // Live cache of Center Session checkouts (studentId[/_dateKey] -> outTime),
  // populated straight from the center-checkout API response. Lets the
  // checkout time appear immediately everywhere (cards, table, detail
  // modal) without waiting on the next backend re-fetch. See
  // getRecordCheckOut() in attendanceEngine.js.
  const [checkoutSessions, setCheckoutSessions] = useState({});

  // Scanner
  const [isScanning, setIsScanning]         = useState(false);
  const [cameraError, setCameraError]       = useState('');
  const scannerRef                          = useRef(null);
  // Refs mirror the latest state so the html5-qrcode callback (which is only
  // "snapshotted" once, when qr.start() is called) never reads stale values.
  const isSavingRef                         = useRef(false);
  const voiceEnabledRef                     = useRef(true);

  // History tab
  const [historyRecords, setHistoryRecords] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [histSearch, setHistSearch]         = useState('');
  const [histDateFrom, setHistDateFrom]     = useState('');
  const [histDateTo, setHistDateTo]         = useState('');
  const [histPage, setHistPage]             = useState(1);
  const [histTotal, setHistTotal]           = useState(0);
  const [exportingCSV, setExportingCSV]     = useState(false);
  const [historyView, setHistoryView]       = useState('table');
  const [historyDetail, setHistoryDetail]   = useState(null);
  const [recentHistory, setRecentHistory]   = useState([]);
  const [recentHistoryLoading, setRecentHistoryLoading] = useState(false);
  const HIST_LIMIT = 20;

  // Reports tab
  const [summary, setSummary]               = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportDate, setReportDate]         = useState(new Date().toISOString().split('T')[0]);

  // Edit modal
  const [editRecord, setEditRecord]         = useState(null);
  const [editStatus, setEditStatus]         = useState('');
  const [editRemarks, setEditRemarks]       = useState('');
  const [editAttendanceDate, setEditAttendanceDate] = useState('');
  const [editCheckInTime, setEditCheckInTime] = useState('');
  const [editCheckOutTime, setEditCheckOutTime] = useState('');
  const [editNote, setEditNote]             = useState('');
  const [editTimeError, setEditTimeError] = useState('');

  // Bulk
  const [bulkSelected, setBulkSelected]     = useState([]);

  const debounceRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchClasses();
    return () => {
      stopCamera();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  useEffect(() => {
    if (!selectedClass || !date) { setStudents([]); setAttendance([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchClassData, 300);
  }, [selectedClass, date, sessionLabel]);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, histDateFrom, histDateTo, histPage]);

  useEffect(() => {
    if (activeTab === 'reports') fetchSummary();
  }, [activeTab, reportDate]);

  // Keep bulk-selection in sync: if a student already in bulkSelected gets
  // marked some other way (e.g. via its own row button), drop it from the
  // selection so a stale id can't linger and trip up bulk actions.
  useEffect(() => {
    const pendingIds = new Set(
      students
        .filter(s => getStudentStatus(getId(s._id || s.id)) === 'Pending')
        .map(s => getId(s._id || s.id))
    );
    setBulkSelected(prev => prev.filter(id => pendingIds.has(id)));
  }, [attendance, students]);

  // ── API calls ─────────────────────────────────────────────────────────────────
  const unwrapResponse = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    if (response.data?.data && Array.isArray(response.data.data)) return response.data.data;
    if (response.data?.students && Array.isArray(response.data.students)) return response.data.students;
    return [];
  };

  const fetchClasses = async () => {
    setPageLoading(true);
    try {
      const res = await getMyClassesAPI();
      const list = unwrapResponse(res);
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0]._id || list[0].id || list[0].classId);
    } catch (err) {
      console.error('Failed to load classes:', err);
      showToast('Failed to load classes', 'error');
    } finally {
      setPageLoading(false);
    }
  };

  const fetchClassData = async () => {
    setDataLoading(true);
    try {
      const [stuRes, attRes] = await Promise.all([
        getClassStudentsAPI(selectedClass).catch(() => ({})),
        getAttendanceList({ classId: selectedClass, date, sessionLabel, limit: 200 }).catch(() => ({}))
      ]);
      const studentList = unwrapResponse(stuRes);
      const attList = unwrapResponse(attRes);
      setStudents(studentList);
      setAttendance(attList);
    } catch (err) {
      console.error('Failed to load class data:', err);
      showToast('Failed to load class data', 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = { dateFrom: histDateFrom, dateTo: histDateTo, page: histPage, limit: HIST_LIMIT };
      const res = await getAttendanceList(params);
      setHistoryRecords(res.data || []);
      setHistTotal(res.total || 0);
    } catch { showToast('Failed to load history', 'error'); }
    finally { setHistoryLoading(false); }
  };

  const openHistoryDetail = async (record) => {
    setHistoryDetail(record);
    setRecentHistory([]);
    setRecentHistoryLoading(true);
    try {
      const admissionNo = record.studentAdmissionNo || record.studentId?.admissionNo;
      const studentId = getId(record.studentId);
      const response = admissionNo
        ? await getStudentAttendanceHistory(admissionNo, { limit: 10 })
        : await getAttendanceList({ studentId, limit: 10 });
      const list = unwrapResponse(response)
        .filter(item => item._id !== record._id)
        .sort((a, b) => new Date(b.attendanceDateKey || b.attendanceDate) - new Date(a.attendanceDateKey || a.attendanceDate));
      const uniqueDays = list.filter((item, index, items) => {
        const key = item.attendanceDateKey || item.attendanceDate?.slice?.(0, 10);
        return items.findIndex(candidate => (candidate.attendanceDateKey || candidate.attendanceDate?.slice?.(0, 10)) === key) === index;
      });
      setRecentHistory(uniqueDays.slice(0, 4));
    } catch {
      const local = historyRecords.filter(item => {
        const sameStudent = getId(item.studentId) === getId(record.studentId) || item.studentName === record.studentName;
        return sameStudent && item._id !== record._id;
      });
      setRecentHistory(local.slice(0, 4));
    } finally {
      setRecentHistoryLoading(false);
    }
  };

  const fetchSummary = async () => {
    setReportsLoading(true);
    try {
      const res = await getDailyAttendanceSummary(reportDate);
      if (res.success) setSummary(res.data);
      else if (res.data) setSummary(res.data);
      else setSummary(res);
    } catch { showToast('Failed to load report', 'error'); }
    finally { setReportsLoading(false); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });

  // Reads aloud, e.g. "Riya Sharma marked Present". Uses a ref (not state)
  // so it always reflects the latest mute setting even when called from the
  // QR scanner's long-lived callback.
  const speak = (text) => {
    if (!voiceEnabledRef.current) return;
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1;
      utter.volume = 1;
      window.speechSynthesis.speak(utter);
    } catch {
      // speech synthesis unavailable/blocked - fail silently
    }
  };

  const getAttendanceRecord = (studentId) => {
    const target = getId(studentId);
    return attendance.find(a => getId(a.studentId) === target);
  };

  const getStudentStatus = (studentId) => getAttendanceRecord(studentId)?.status || 'Pending';
  const isStudentCheckedIn = (studentId) => checkedInStudents.includes(getId(studentId));

  // Always matches/dedupes using normalized string ids, so it no longer
  // matters whether a given record's studentId is a raw id or a populated
  // student object - this was the root cause of marks "not sticking" for
  // some records (a populated object was being compared with `===` against
  // a plain string id, which can never be equal).
  const upsertAttendance = (record, studentId) => {
    const target = getId(studentId);
    setAttendance(prev => {
      const idx = prev.findIndex(a => getId(a.studentId) === target);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...record };
        return updated;
      }
      return [...prev, record];
    });
  };

  // ── Counts ────────────────────────────────────────────────────────────────────
  const presentCount = attendance.filter(a => a.status === 'Present').length;
  const absentCount  = attendance.filter(a => a.status === 'Absent').length;
  const lateCount    = attendance.filter(a => a.status === 'Late').length;

  // Roster only ever shows students who haven't been marked yet for this
  // date/session - once marked (by scan or manually) they drop out of view.
  const pendingStudents = students.filter(s => getStudentStatus(getId(s._id || s.id)) === 'Pending');

  // ── Scanner ───────────────────────────────────────────────────────────────────
  const startCamera = () => {
    isSavingRef.current = false;
    setIsScanning(true);
    setCameraError('');
    setTimeout(() => {
      const qr = new Html5Qrcode('qr-reader');
      scannerRef.current = qr;
      qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        handleQRScan,
        () => {}
      ).catch(() => {
        setCameraError('Camera access denied. Check browser permissions.');
        setIsScanning(false);
      });
    }, 200);
  };

  const stopCamera = async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop(); scannerRef.current.clear(); } catch { /* scanner may already be stopped */ }
    }
    scannerRef.current = null;
    isSavingRef.current = false;
    setIsScanning(false);
  };

  const handleQRScan = async (decoded) => {
    // isSavingRef (not the isSaving state) is the guard here on purpose:
    // html5-qrcode keeps calling the *original* handleQRScan closure from
    // when the camera started, so a stale `isSaving` state value would
    // always read as `false` and let duplicate/overlapping scans of the
    // same code fire multiple requests at once. The ref is a stable object,
    // so it's always read/written live regardless of which closure touches it.
    if (isSavingRef.current || !scannerRef.current?.isScanning) return;
    isSavingRef.current = true;
    scannerRef.current.pause();
    setIsSaving(true);
    try {
      const res = await scanAttendanceAPI(decoded, date, sessionLabel);
      if (res?.success) {
        const d = res.data || {};
        const att = d.attendance || {};
        const studentId = getId(att.studentId ?? d.student?.id ?? d.student?._id);
        const studentProfile = d.student || students.find(item => getId(item._id || item.id) === studentId) || null;
        const displayName = att.studentName || studentProfile?.fullName || studentProfile?.name || 'Student';
        const status = att.status || 'Present';
        const isAlreadyMarked = d.action === 'already_marked';
        const { elapsed, withinWindow } = classifyAlreadyMarked(att.checkInTime || att.markedAt);
        const activeClasses = getActiveClasses(studentProfile || { classIds: [], classTimings: {} }, classes, new Date());
        const todayRecordsResponse = await getAttendanceList({ studentId, date, limit: 200 }).catch(() => ({ data: [] }));
        const todayRecords = unwrapResponse(todayRecordsResponse);
        const unmarkedClasses = getUnmarkedClasses(activeClasses, todayRecords);

        const result = isAlreadyMarked
          ? (withinWindow ? describeAttendanceResult('ALREADY_MARKED_RECENT', { name: displayName }) : describeAttendanceResult('ALREADY_MARKED_STALE', { name: displayName, time: formatElapsed(elapsed) }))
          : describeAttendanceResult('MARKED', { name: displayName, hasPlan: false });

        upsertAttendance({
          _id: att._id,
          studentId,
          status,
          method: att.method || 'qr',
          attendanceDateKey: date,
          markedAt: att.markedAt,
          checkInTime: att.checkInTime,
          className: att.className || studentProfile?.className || ''
        }, studentId);

        for (const entry of unmarkedClasses.filter(item => item.classType !== CLASS_TYPES.HOURS_BASED)) {
          try {
            await scanAttendanceAPI(decoded, date, entry.sessionLabel);
          } catch {
            // continue with the remainder of the engine-driven scan flow
          }
        }

        await stopCamera();
        setSuccessData({
          name: displayName,
          status,
          alreadyMarked: isAlreadyMarked,
          withinWindow,
          elapsed,
          qrCode: decoded,
          studentId,
          checkInTime: att.checkInTime || att.markedAt,
          checkedIn: false
        });
        showToast(result.message, result.tone === 'error' ? 'error' : result.tone === 'warning' ? 'warning' : 'success');
        speak(result.message);

        if (studentId) {
          void (async () => {
            try {
              const checkInRes = await centerCheckInAPI(decoded, studentId);
              const alreadyIn = /already checked in/i.test(checkInRes?.message || checkInRes?.error || '');
              if (checkInRes?.success || alreadyIn) {
                setCheckedInStudents(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
                setSuccessData(prev => prev?.studentId === studentId ? { ...prev, checkedIn: true } : prev);
                if (!alreadyIn) {
                  const checkInResult = describeAttendanceResult('CHECKED_IN', { name: displayName });
                  showToast(checkInResult.message, checkInResult.tone === 'error' ? 'error' : checkInResult.tone === 'warning' ? 'warning' : 'success');
                  speak(checkInResult.message);
                }
                const hoursBasedClasses = unmarkedClasses.filter(item => item.classType === CLASS_TYPES.HOURS_BASED);
                for (const entry of hoursBasedClasses) {
                  try {
                    await scanAttendanceAPI(decoded, date, entry.sessionLabel);
                  } catch {
                    // Ignore auto-cover failures and keep the teacher flow moving
                  }
                }
              } else {
                const checkInResult = describeAttendanceResult('NETWORK_ERROR');
                showToast(checkInResult.message, 'error');
              }
            } catch (err) {
              const msg = err?.response?.data?.error || err?.response?.data?.message || 'Check-in failed';
              if (/already checked in/i.test(msg)) {
                setCheckedInStudents(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
                setSuccessData(prev => prev?.studentId === studentId ? { ...prev, checkedIn: true } : prev);
              } else {
                showToast(msg, 'error');
              }
            }
          })();
        }
      } else {
        const result = describeAttendanceResult('INVALID_QR');
        showToast(result.message, 'error');
        speak(result.message);
        setTimeout(() => { isSavingRef.current = false; scannerRef.current?.resume?.(); }, 2000);
      }
    } catch (err) {
      const apiErrorMessage = describeAttendanceResult('NETWORK_ERROR').message;
      showToast(apiErrorMessage, 'error');
      speak(apiErrorMessage);
      setTimeout(() => { isSavingRef.current = false; scannerRef.current?.resume?.(); }, 2000);
    } finally {
      setIsSaving(false);
    }
  };

  // Offered from the success card when a QR is scanned again 5+ minutes
  // after the student was already marked Present - this is the real
  // "leaving the center" action. Uses the existing /center-out endpoint,
  // so total stay time + flexi-hour deduction are computed by the backend
  // exactly like they are from the dedicated Center panel.
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const handleCenterCheckout = async (qrCode) => {
    if (checkoutBusy || !successData?.studentId) return;
    setCheckoutBusy(true);
    try {
      const res = await centerCheckOutAPI(qrCode, successData.studentId);
      if (res.success) {
        // Backend is the single source of truth for the checkout time.
        // Only session.outTime is used here — never updatedAt/createdAt or
        // the attendance record's own timestamp, which belong to a
        // different collection (Attendance, not Center Session).
        const outTime = res.data?.session?.outTime;
        const mins = Math.floor(res.data?.math?.totalStayMinutes ?? 0);
        const deducted = res.data?.math?.deductedHours ?? 0;
        const outTimeLabel = outTime ? formatTime(outTime) : null;
        const studentId = successData.studentId;
        const todayKey = date;

        setCheckedInStudents(prev => prev.filter(id => id !== studentId));
        if (outTime && studentId) {
          setCheckoutSessions(prev => ({
            ...prev,
            [studentId]: { outTime },
            [`${studentId}_${todayKey}`]: { outTime },
          }));
        }

        const base = outTimeLabel
          ? `Checked out at ${outTimeLabel} • stayed ${mins} min`
          : `Checked out • stayed ${mins} min`;
        const message = deducted > 0 ? `${base} • ${deducted} flexi-hrs deducted` : base;
        showToast(message, 'success');
        speak(message);
        setSuccessData(null);

        // Never leave the UI holding onto stale local state after a
        // mutation - re-pull Attendance, Today's Attendance, History and
        // the summary card straight from the backend so the checkout
        // shows up everywhere (table, cards, detail modal, reports)
        // without needing a page refresh.
        await Promise.all([
          fetchClassData(),
          fetchHistory(),
          activeTab === 'reports' ? fetchSummary() : Promise.resolve(),
        ]);
      } else {
        showToast(res.message || 'Check-out failed', 'error');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Check-out failed';
      showToast(msg, 'error');
    } finally {
      setCheckoutBusy(false);
    }
  };

  // ── Mark manual ───────────────────────────────────────────────────────────────
  const markAttendance = async (student, status, remarks = '') => {
    if (isSaving) return;
    const studentId = getId(student._id || student.id);
    const displayName = getStudentDisplayName(student);
    setIsSaving(true);
    try {
      const res = await markAttendanceAPI(studentId, status, date, remarks, sessionLabel);
      if (res.success) {
        const att = res.data?.attendance || {};
        const finalStatus = att.status || status;
        upsertAttendance({
          _id: att._id || Date.now(),
          studentId,
          status: finalStatus,
          method: att.method || 'manual',
          attendanceDateKey: date,
          markedAt: att.markedAt,
          checkInTime: att.checkInTime
        }, studentId);
        const result = describeAttendanceResult('MARKED', { name: displayName, hasPlan: false });
        showToast(result.message, 'success');
        speak(result.message);
      } else { const result = describeAttendanceResult('NETWORK_ERROR'); showToast(result.message, 'error'); }
    } catch { const result = describeAttendanceResult('NETWORK_ERROR'); showToast(result.message, 'error'); }
    finally { setIsSaving(false); }
  };

  // ── Update ────────────────────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!editRecord) return;
    if (editCheckInTime && editCheckOutTime && editCheckOutTime <= editCheckInTime) {
      setEditTimeError('Check-out must be after check-in');
      return;
    }
    setEditTimeError('');
    setIsSaving(true);
    try {
      const dateKey = editAttendanceDate || new Date().toISOString().split('T')[0];
      const checkInTime = editCheckInTime ? new Date(`${dateKey}T${editCheckInTime}:00`).toISOString() : null;
      const checkOutTime = editCheckOutTime ? new Date(`${dateKey}T${editCheckOutTime}:00`).toISOString() : null;
      const payload = {
        attendanceDate: dateKey,
        status: editStatus,
        remarks: editRemarks,
        note: editNote,
        checkInTime: editCheckInTime ? checkInTime : null,
        checkOutTime: editCheckOutTime ? checkOutTime : null,
      };
      const res = await updateAttendanceRecord(editRecord._id, payload);
      if (res.success) {
        setAttendance(prev => prev.map(a => a._id === editRecord._id ? { ...a, status: editStatus, remarks: editRemarks, attendanceDateKey: dateKey } : a));
        showToast('Updated successfully', 'success');
        setEditRecord(null);
        setEditNote('');
      } else { showToast(res.message || 'Update failed', 'error'); }
    } catch { showToast('Update error', 'error'); }
    finally { setIsSaving(false); }
  };

  // ── Bulk mark ─────────────────────────────────────────────────────────────────
  const markBulk = async (status) => {
    if (bulkSelected.length === 0) { showToast('Select students first', 'info'); return; }
    setIsSaving(true);
    let ok = 0;
    for (const studentId of bulkSelected) {
      try {
        const res = await markAttendanceAPI(studentId, status, date, '', sessionLabel);
        if (res.success) {
          const att = res.data?.attendance || {};
          upsertAttendance({ _id: att._id || Date.now(), studentId, status: att.status || status, method: 'manual', attendanceDateKey: date, markedAt: att.markedAt, checkInTime: att.checkInTime }, studentId);
          ok++;
        }
      } catch { /* continue marking the remaining selected students */ }
    }
    setIsSaving(false);
    showToast(`Marked ${ok}/${bulkSelected.length} students as ${status}`, 'success');
    if (ok > 0) speak(`${ok} students marked ${status}`);
    setBulkSelected([]);
  };

  // ── Export CSV ────────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    if (exportingCSV) return;
    setExportingCSV(true);
    try {
      const baseFilters = {
        ...(histDateFrom && { dateFrom: histDateFrom }),
        ...(histDateTo && { dateTo: histDateTo }),
      };
      const allRecords = [];
      const pageSize = 100;
      let page = 1;

      // Fetch every API page. With no date filters this intentionally exports
      // the complete attendance history rather than only the visible page.
      while (true) {
        const response = await getAttendanceList({ ...baseFilters, page, limit: pageSize });
        const batch = unwrapResponse(response);
        if (batch.length === 0) break;
        allRecords.push(...batch);

        const total = response?.total ?? response?.data?.total ?? response?.pagination?.total;
        if (batch.length < pageSize || (Number.isFinite(Number(total)) && allRecords.length >= Number(total))) break;
        page += 1;
      }

      const search = histSearch.trim().toLowerCase();
      const exportRecords = search
        ? allRecords.filter(record => (record.studentName || record.studentId?.name || '').toLowerCase().includes(search))
        : allRecords;

      if (exportRecords.length === 0) {
        showToast('No attendance records match the applied filters', 'info');
        return;
      }

      const rows = [[
        'Date', 'Student', 'Admission No', 'Class', 'Session', 'Status',
        'Method', 'Check In', 'Check Out', 'Arrival', 'Remarks'
      ]];
      exportRecords.forEach(record => rows.push([
        record.attendanceDateKey || record.attendanceDate || '',
        record.studentName || record.studentId?.name || '',
        record.studentAdmissionNo || record.studentId?.admissionNo || '',
        record.className || record.classId?.name || record.studentId?.className || '',
        (record.sessionLabel || 'FULL_DAY').replace(/_/g, ' '),
        record.status || '',
        record.method || 'manual',
        formatTime(getRecordCheckIn(record)),
        formatTime(getRecordCheckOut(record, checkoutSessions)),
        getTimingStatus(record, classes)?.label || '',
        record.remarks || '',
      ]));

      const escapeCSV = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const csv = `\uFEFF${rows.map(row => row.map(escapeCSV).join(',')).join('\r\n')}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const filterSuffix = histDateFrom || histDateTo ? `_${histDateFrom || 'start'}_to_${histDateTo || 'today'}` : '_all';
      const link = Object.assign(document.createElement('a'), { href: url, download: `attendance${filterSuffix}.csv` });
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast(`${exportRecords.length} records exported`, 'success');
    } catch (error) {
      console.error('Attendance CSV export failed:', error);
      showToast('Failed to export attendance data', 'error');
    } finally {
      setExportingCSV(false);
    }
  };

  // ─── Filtered history for search ──────────────────────────────────────────────
  const filteredHistory = histSearch
    ? historyRecords.filter(r => (r.studentName || '').toLowerCase().includes(histSearch.toLowerCase()))
    : historyRecords;

  const histPages = Math.max(1, Math.ceil(histTotal / HIST_LIMIT));

  // ─── Page loading ─────────────────────────────────────────────────────────────
  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"/>
        <p className="text-slate-500 text-sm font-medium">Loading attendance system...</p>
      </div>
    );
  }

  // ─── TABS CONFIG ──────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'scanner',  label: 'Mark Attendance', icon: ScanLine },
    { id: 'history',  label: 'History',          icon: History },
    { id: 'reports',  label: 'Reports',           icon: BarChart3 },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5 px-2 sm:px-0">
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl"><ScanLine size={20}/></div>
            Attendance
          </h1>
          <p className="text-slate-500 text-sm mt-1">Smart attendance management for your classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoiceEnabled(v => !v)}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title={voiceEnabled ? 'Mute voice announcements' : 'Enable voice announcements'}
          >
            {voiceEnabled ? <Volume2 size={16}/> : <VolumeX size={16}/>}
          </button>
          <button onClick={fetchClasses} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
            <RefreshCw size={16}/>
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex gap-1 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <tab.icon size={15}/>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═════════════════════════ SCANNER TAB ═════════════════════════ */}
      {activeTab === 'scanner' && (
        <>
          {/* No classes warning */}
          {classes.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
              <BookOpen size={40} className="text-amber-400 mx-auto mb-3"/>
              <h3 className="font-bold text-amber-800">No Classes Assigned</h3>
              <p className="text-amber-700 text-sm mt-1">Contact your administrator to get classes assigned.</p>
            </div>
          ) : (
            <>
              {/* ── Filters Row ── */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Layers size={11}/> Class</label>
                  <select
                    value={selectedClass}
                    onChange={e => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {classes.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name || c.className}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Calendar size={11}/> Date</label>
                  <input
                    type="date"
                    value={date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
            {/* <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Clock size={11}/> Session</label>
              <select
                value={sessionLabel}
                onChange={e => setSessionLabel(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="FULL_DAY">Full Day</option>
                <option value="MORNING">Morning</option>
                <option value="AFTERNOON">Afternoon</option>
                <option value="EVENING">Evening</option>
              </select>
            </div> */}
              </div>

              {/* ── Stats ── */}
              <div className="flex gap-3 overflow-x-auto pb-1">
                <StatCard icon={Users}     label="Total"   value={students.length} color="bg-slate-100 text-slate-600"/>
                <StatCard icon={UserCheck} label="Present" value={presentCount}    color="bg-emerald-50 text-emerald-600"/>
                <StatCard icon={XCircle}   label="Absent"  value={absentCount}     color="bg-rose-50 text-rose-600"/>
                <StatCard icon={Clock}     label="Late"    value={lateCount}       color="bg-amber-50 text-amber-600"/>
              </div>

              {/* ── Main Grid ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Scanner panel */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Camera size={15} className="text-emerald-600"/> QR Scanner
                      </h3>
                      {isScanning && (
                        <span className="flex h-2.5 w-2.5 relative">
                          <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                          <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500"/>
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      {cameraError && (
                        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex gap-2 items-start">
                          <AlertCircle size={14} className="mt-0.5 shrink-0"/>
                          {cameraError}
                        </div>
                      )}
                      <div
                        id="qr-reader"
                        className={`w-full rounded-xl overflow-hidden bg-black ${!isScanning ? 'hidden' : ''}`}
                        style={{ minHeight: 220 }}
                      />
                      {!isScanning ? (
                        <div className="py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <QrCode size={28}/>
                          </div>
                          <p className="text-slate-600 text-xs font-semibold mb-4">Point camera at student QR code</p>
                          <button
                            onClick={startCamera}
                            disabled={!selectedClass}
                            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-600/20"
                          >
                            Start Camera
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={stopCamera}
                          className="mt-4 w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                          <CameraOff size={16}/> Stop Camera
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Student List */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm">
                        Student Roster
                        {students.length > 0 && (
                          <span className="ml-2 text-slate-400 font-normal">
                            ({pendingStudents.length} pending{students.length !== pendingStudents.length ? ` · ${students.length - pendingStudents.length} marked` : ''})
                          </span>
                        )}
                      </h3>
                      {pendingStudents.length > 0 && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setBulkSelected(pendingStudents.map(s => getId(s._id || s.id)))}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors"
                          >Select All</button>
                          {bulkSelected.length > 0 && (
                            <>
                              <button onClick={() => markBulk('Present')} className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold transition-colors hover:bg-emerald-700">
                                Mark Present ({bulkSelected.length})
                              </button>
                              <button onClick={() => markBulk('Absent')} className="text-[11px] px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold transition-colors hover:bg-rose-700">
                                Absent
                              </button>
                              <button onClick={() => setBulkSelected([])} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-200 text-slate-600 font-medium">Clear</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {dataLoading ? (
                      <div className="p-4 space-y-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-9 h-9 rounded-full bg-slate-200"/>
                            <div className="flex-1 space-y-1.5">
                              <div className="h-3.5 bg-slate-200 rounded w-3/5"/>
                              <div className="h-2.5 bg-slate-200 rounded w-2/5"/>
                            </div>
                            <div className="w-20 h-7 bg-slate-200 rounded-lg"/>
                          </div>
                        ))}
                      </div>
                    ) : students.length === 0 ? (
                      <div className="py-20 text-center text-slate-400">
                        <Users size={40} className="mx-auto opacity-20 mb-3"/>
                        <p className="text-sm font-medium">Select a class to view students</p>
</div>
                     ) : pendingStudents.length === 0 ? (
                       <div className="py-20 text-center text-emerald-600">
                         <CheckCircle size={40} className="mx-auto opacity-40 mb-3"/>
                         <p className="text-sm font-bold">All students marked for today</p>
                         <p className="text-xs text-slate-400 mt-1">Switch to the History tab to review or edit records.</p>
                       </div>
                     ) : (
                       <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: '400px' }}>
                         <table className="w-full text-left">
                           <thead>
                             <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                               <th className="pl-4 pr-2 py-2.5 font-bold w-8">
                                 <input
                                   type="checkbox"
                                   checked={bulkSelected.length === pendingStudents.length && pendingStudents.length > 0}
                                   onChange={e => setBulkSelected(e.target.checked ? pendingStudents.map(s => getId(s._id || s.id)) : [])}
                                   className="rounded"
                                 />
                               </th>
                               <th className="px-3 py-2.5 font-bold">Student</th>
                               <th className="px-3 py-2.5 font-bold text-right">Actions</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                             {pendingStudents.map(student => {
                               const sid = getId(student._id || student.id);
                               const displayName = getStudentDisplayName(student);

                               return (
                                 <tr key={sid} className="hover:bg-slate-50 transition-colors group">
                                   <td className="pl-4 pr-2 py-2.5">
                                     <input
                                       type="checkbox"
                                       checked={bulkSelected.includes(sid)}
                                       onChange={e => setBulkSelected(e.target.checked ? [...bulkSelected, sid] : bulkSelected.filter(id => id !== sid))}
                                       className="rounded"
                                     />
                                   </td>
                                   <td className="px-3 py-2.5">
                                     <div className="flex items-center gap-2.5">
                                       <div
                                         onClick={() => student.photo && setViewImage({ url: student.photo, name: displayName })}
                                         className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 overflow-hidden ${student.photo ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all' : ''}`}
                                         title={student.photo ? 'View photo' : undefined}
                                       >
                                         {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover"/> : displayName.charAt(0).toUpperCase()}
                                       </div>
                                       <div>
                                         <p className="text-sm font-semibold text-slate-800 leading-tight">
                                           {displayName}
                                         </p>
                                         <p className="text-[10px] text-slate-400 font-mono">{student.admissionNo || student.enrollmentId || ''}</p>
                                       </div>
                                     </div>
                                   </td>
<td className="px-3 py-2.5">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => setViewStudent(student)}
                                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-all"
                                          title="View Details"
                                        ><BarChart3 size={14}/></button>
                                        <button
                                          onClick={() => markAttendance(student, 'Present')}
                                          disabled={isSaving}
                                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600 transition-all disabled:opacity-50"
                                          title="Present"
                                        ><CheckCircle size={14}/></button>
                                       <button
                                         onClick={() => markAttendance(student, 'Absent')}
                                         disabled={isSaving}
                                         className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-all disabled:opacity-50"
                                         title="Absent"
                                       ><XCircle size={14}/></button>
                                       <button
                                         onClick={() => markAttendance(student, 'Late')}
                                         disabled={isSaving}
                                         className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600 transition-all disabled:opacity-50"
                                         title="Late"
                                       ><Clock size={14}/></button>
                                     </div>
                                   </td>
                                 </tr>
                               );
                             })}
                           </tbody>
                         </table>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </>
           )}
         </>
       )}

      {/* ═════════════════════════ HISTORY TAB ═════════════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-wrap gap-3 items-end w-full">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search Student</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input
                  type="text"
                  value={histSearch}
                  onChange={e => setHistSearch(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">From</label>
              <input type="date" value={histDateFrom} onChange={e => { setHistDateFrom(e.target.value); setHistPage(1); }} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">To</label>
              <input type="date" value={histDateTo} onChange={e => { setHistDateTo(e.target.value); setHistPage(1); }} className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"/>
            </div>
            <button
              onClick={exportCSV}
              disabled={exportingCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors whitespace-nowrap disabled:cursor-wait disabled:opacity-60"
            >
              {exportingCSV ? <RefreshCw size={15} className="animate-spin"/> : <Download size={15}/>}
              {exportingCSV ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Attendance Records</h3>
              <div className="flex items-center gap-2">
                {histTotal > 0 && <span className="hidden text-xs text-slate-500 sm:inline">{histTotal} total records</span>}
                <div className="flex rounded-xl border border-slate-200 bg-white p-1" aria-label="History layout">
                  <button onClick={() => setHistoryView('table')} className={`rounded-lg p-1.5 transition ${historyView === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`} title="Table view"><List size={15}/></button>
                  <button onClick={() => setHistoryView('grid')} className={`rounded-lg p-1.5 transition ${historyView === 'grid' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-700'}`} title="Grid view"><LayoutGrid size={15}/></button>
                </div>
              </div>
            </div>
            {historyLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse"/>)}
              </div>
            ) : historyView === 'grid' ? (
              filteredHistory.length > 0 ? (
                <div className="grid gap-4 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
                  {filteredHistory.map(r => (
                    <article key={r._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 font-extrabold text-white">{r.studentId?.photo ? <img src={r.studentId.photo} alt="" className="h-full w-full object-cover"/> : (r.studentName || 'S').charAt(0).toUpperCase()}</div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-slate-800">{r.studentName || '—'}</p><p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{r.studentAdmissionNo || r.studentId?.admissionNo || '—'}</p></div>
                        <StatusBadge status={r.status}/>
                      </div>
                      <div className="my-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-400">Date</p><p className="mt-1 font-bold text-slate-700">{formatDate(r.attendanceDateKey || r.attendanceDate)}</p></div>
                        <div className="rounded-xl bg-slate-50 p-2.5"><p className="text-[9px] font-bold uppercase text-slate-400">Check in</p><p className="mt-1 font-bold text-slate-700">{formatTime(getRecordCheckIn(r))}</p></div>
                        <div className="rounded-xl bg-slate-50 p-2.5 col-span-2"><p className="text-[9px] font-bold uppercase text-slate-400">Check out</p><p className="mt-1 font-bold text-slate-700">{formatTime(getRecordCheckOut(r, checkoutSessions))}</p></div>
                      </div>
                      <div className="mb-4 flex min-h-7 items-center"><TimingBadge record={r} classes={classes} compact/></div>
                      <p className="mb-4 truncate text-xs text-slate-500"><span className="font-bold text-slate-700">{r.className || r.classId?.name || '—'}</span>{r.remarks ? ` · ${r.remarks}` : ''}</p>
                      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
                        <button onClick={() => openHistoryDetail(r)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"><Eye size={14}/> View</button>
                        <button onClick={() => {
                          const recCheckOut = getRecordCheckOut(r, checkoutSessions);
                          setEditRecord(r);
                          setEditStatus(r.status);
                          setEditRemarks(r.remarks || '');
                          setEditAttendanceDate(r.attendanceDateKey || (r.attendanceDate ? r.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0]));
                          setEditCheckInTime((r.checkInTime || r.markedAt) ? new Date(r.checkInTime || r.markedAt).toTimeString().slice(0, 5) : '');
                          setEditCheckOutTime(recCheckOut ? new Date(recCheckOut).toTimeString().slice(0, 5) : '');
                          setEditNote('');
                        }} className="rounded-xl bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100" title="Edit"><Edit size={14}/></button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="px-4 py-12 text-center text-slate-400"><History size={32} className="mx-auto mb-2 opacity-20"/>No records found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 bg-white">
                      <th className="px-4 py-3 font-bold">Date</th>
                      <th className="px-4 py-3 font-bold">Student</th>
                      <th className="px-4 py-3 font-bold">Class</th>
                      <th className="px-4 py-3 font-bold">Status</th>
                      <th className="px-4 py-3 font-bold">Method</th>
                      <th className="px-4 py-3 font-bold">Time</th>
                      <th className="px-4 py-3 font-bold">Check-out</th>
                      <th className="px-4 py-3 font-bold">Arrival</th>
                      <th className="px-4 py-3 font-bold">Remarks</th>
                      <th className="px-4 py-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistory.length > 0 ? filteredHistory.map(r => (
                      <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-slate-600">{r.attendanceDateKey}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{r.studentName || '—'}</p>
                          {r.studentId?.admissionNo && <p className="text-[10px] text-slate-400 font-mono">{r.studentId.admissionNo}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{r.className || r.studentId?.className || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={r.status}/></td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium capitalize">{r.method || 'manual'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatTime(getRecordCheckIn(r))}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {formatTime(getRecordCheckOut(r, checkoutSessions))}
                        </td>
                        <td className="px-4 py-3"><TimingBadge record={r} classes={classes} compact/></td>
                        <td className="px-4 py-3 text-sm text-slate-500 max-w-[160px] truncate">{r.remarks || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openHistoryDetail(r)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all" title="View full details"><Eye size={14}/></button>
                            <button
                              onClick={() => {
                                const recCheckOut = getRecordCheckOut(r, checkoutSessions);
                                setEditRecord(r);
                                setEditStatus(r.status);
                                setEditRemarks(r.remarks || '');
                                setEditAttendanceDate(r.attendanceDateKey || (r.attendanceDate ? r.attendanceDate.split('T')[0] : new Date().toISOString().split('T')[0]));
                                setEditCheckInTime((r.checkInTime || r.markedAt) ? new Date(r.checkInTime || r.markedAt).toTimeString().slice(0, 5) : '');
                                setEditCheckOutTime(recCheckOut ? new Date(recCheckOut).toTimeString().slice(0, 5) : '');
                                setEditNote('');
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-100 hover:text-blue-600 transition-all"
                              title="Edit"
                            ><Edit size={14}/></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                          <History size={32} className="mx-auto opacity-20 mb-2"/>
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {histPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-500">Page {histPage} of {histPages}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setHistPage(p => Math.max(1, p - 1))}
                    disabled={histPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  ><ChevronLeft size={14}/></button>
                  <button
                    onClick={() => setHistPage(p => Math.min(histPages, p + 1))}
                    disabled={histPage === histPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  ><ChevronRight size={14}/></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═════════════════════════ REPORTS TAB ═════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Date Picker */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-end gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Report Date</label>
              <input
                type="date"
                value={reportDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setReportDate(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button onClick={fetchSummary} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">
              Load Report
            </button>
          </div>

          {reportsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse"/>)}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Summary card */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-emerald-600"/> Daily Summary
                </h3>
                <p className="text-xs text-slate-500 mb-4">{summary.summary?.date || reportDate}</p>
                {[
                  { label: 'Present', val: summary.summary?.Present || 0, color: 'text-emerald-600' },
                  { label: 'Absent',  val: summary.summary?.Absent  || 0, color: 'text-rose-600' },
                  { label: 'Late',    val: summary.summary?.Late    || 0, color: 'text-amber-600' },
                  { label: 'Leave',   val: summary.summary?.Leave   || 0, color: 'text-blue-600' },
                  { label: 'Total',   val: summary.summary?.total   || 0, color: 'text-slate-700' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-500">{label}</span>
                    <span className={`font-bold ${color}`}>{val}</span>
                  </div>
                ))}
                {summary.summary?.total > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Attendance Rate</span>
                      <span className="font-bold text-emerald-600">
                        {Math.round(((summary.summary?.Present || 0) / summary.summary.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.round(((summary.summary?.Present || 0) / summary.summary.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Class-wise */}
              {summary.classWise && summary.classWise.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 md:col-span-1 lg:col-span-2">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Layers size={16} className="text-emerald-600"/> Class-wise Breakdown
                  </h3>
                  <div className="space-y-3 overflow-y-auto max-h-72">
                    {summary.classWise.map((cls, i) => {
                      const pct = cls.total > 0 ? Math.round((cls.present / cls.total) * 100) : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-28 shrink-0">
                            <p className="text-sm font-semibold text-slate-800">{cls.className}</p>
                            <p className="text-[10px] text-slate-400">Section {cls.section}</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>{cls.present}/{cls.total} present</span>
                              <span className="font-bold text-emerald-600">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}/>
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs shrink-0">
                            <span className="text-rose-600 font-medium">{cls.absent}A</span>
                            <span className="text-amber-600 font-medium">{cls.late}L</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <BarChart3 size={36} className="mx-auto text-slate-300 mb-3"/>
              <p className="text-slate-500 text-sm font-medium">Select a date and click "Load Report"</p>
            </div>
          )}
        </div>
      )}

      {historyDetail && (
        <HistoryRecordDetail
          record={historyDetail}
          recentRecords={recentHistory}
          recentLoading={recentHistoryLoading}
          classes={classes}
          onClose={() => setHistoryDetail(null)}
          sessionMap={checkoutSessions}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}

      {/* ── Success Modal ── */}
      {successData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-2xl">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              successData.alreadyMarked
                ? (successData.withinWindow ? 'bg-amber-100' : 'bg-orange-100')
                : 'bg-emerald-100'
            }`}>
              {successData.alreadyMarked
                ? <Info size={26} className={successData.withinWindow ? 'text-amber-600' : 'text-orange-600'} />
                : <CheckCircle size={26} className="text-emerald-600" />}
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">
              {successData.alreadyMarked
                ? (successData.withinWindow ? 'Already Marked' : 'Already Marked Earlier')
                : 'Attendance Marked!'}
            </h2>
            <p className="text-slate-500 text-xs mb-1">
              <strong className="text-slate-800">{successData.name}</strong> marked as{' '}
              <span className="text-emerald-600 font-bold">{successData.status}</span>
            </p>
            {successData.alreadyMarked && (
              <p className="text-[11px] text-slate-400 mb-4">
                {successData.elapsed !== null ? `Marked ${formatElapsed(successData.elapsed)}` : 'Marked earlier today'}
                {!successData.withinWindow && ' — still checked in'}
              </p>
            )}
            {!successData.alreadyMarked && <div className="mb-4" />}

            {successData.alreadyMarked && !successData.withinWindow && (isStudentCheckedIn(successData.studentId) || successData.checkedIn) && (
              <button
                onClick={() => handleCenterCheckout(successData.qrCode)}
                disabled={checkoutBusy}
                className="w-full mb-2 py-2.5 rounded-xl bg-orange-600 text-white text-sm font-bold hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <LogOut size={15} /> {checkoutBusy ? 'Checking out…' : 'Check-Out Now'}
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setSuccessData(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors"
              >Done</button>
              <button
                onClick={() => { setSuccessData(null); startCamera(); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >Scan Next</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">Update Attendance</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {['Present', 'Absent', 'Late', 'Leave'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Attendance Date</label>
                  <input
                    type="date"
                    value={editAttendanceDate}
                    onChange={e => setEditAttendanceDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Check-In Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={editCheckInTime}
                      onChange={e => setEditCheckInTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {editCheckInTime && (
                      <button type="button" onClick={() => setEditCheckInTime('')} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Clear">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Check-Out Time</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={editCheckOutTime}
                      onChange={e => setEditCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    {editCheckOutTime && (
                      <button type="button" onClick={() => setEditCheckOutTime('')} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50" title="Clear">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {editTimeError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {editTimeError}
                </div>
              ) : editCheckInTime && editCheckOutTime && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Ensure the check-out time is after the check-in time.
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remarks (optional)</label>
                <textarea
                  value={editRemarks}
                  onChange={e => setEditRemarks(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  placeholder="Add remarks..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500">Reason for edit (optional)</label>
                <textarea rows={2} maxLength={500}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                  placeholder="Why are you changing this record?"
                  value={editNote} onChange={e => setEditNote(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setEditRecord(null); setEditNote(''); }}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >Cancel</button>
              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >{isSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {viewStudent && (
         <div
           className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4"
           onClick={() => setViewStudent(null)}
         >
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto scrollbar-hide p-4 sm:p-6" onClick={e => e.stopPropagation()}>
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-extrabold text-slate-800">Student Details</h2>
               <button
                 onClick={() => setViewStudent(null)}
                 className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                 title="Close"
               >
                 <X size={20}/>
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <div className="flex items-center gap-4 mb-4">
                   <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700 shrink-0 overflow-hidden">
                     {viewStudent.photo ? <img src={viewStudent.photo} alt="" className="w-full h-full object-cover"/> : getStudentDisplayName(viewStudent).charAt(0).toUpperCase()}
                   </div>
                   <div>
                     <p className="text-lg font-bold text-slate-800">{getStudentDisplayName(viewStudent)}</p>
                     <p className="text-xs text-slate-400 font-mono">{viewStudent.admissionNo || viewStudent.enrollmentId || ''}</p>
                   </div>
                 </div>
                 <div className="space-y-3">
                   <div><span className="text-[11px] font-bold text-slate-500 uppercase">Email</span><p className="text-sm text-slate-700">{truncateEmail(viewStudent.email) || '—'}</p></div>
                   <div><span className="text-[11px] font-bold text-slate-500 uppercase">Phone</span><p className="text-sm text-slate-700">{viewStudent.phone || viewStudent.parentPhone || '—'}</p></div>
                   <div><span className="text-[11px] font-bold text-slate-500 uppercase">Class</span><p className="text-sm text-slate-700">{viewStudent.className || viewStudent.classId?.name || classes?.find(c=>getId(c._id||c.id)===selectedClass)?.name || '—'}</p></div>
                   <div><span className="text-[11px] font-bold text-slate-500 uppercase">Timing</span><p className="text-sm text-slate-700">{viewStudent.timing?.startTime && viewStudent.timing?.endTime ? `${viewStudent.timing.startTime} - ${viewStudent.timing?.endTime}` : '—'}</p></div>
                 </div>
               </div>
               <div>
                 <h3 className="text-sm font-bold text-slate-700 mb-3">Attendance Status</h3>
                 <div className="grid grid-cols-2 gap-2">
                   {['Present','Absent','Late','Leave'].map(status => {
                     const rec = getAttendanceRecord(getId(viewStudent._id || viewStudent.id));
                     const active = rec?.status === status;
                     return (
                       <div key={status} className={`p-3 rounded-xl border-2 text-center ${active ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                         <StatusBadge status={status}/>
                         <p className="text-[10px] text-slate-500 mt-1.5">{active ? `Marked at ${rec?.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : '—'}` : '—'}</p>
                       </div>
                     );
                   })}
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* ── Full Image Modal ── */}
      {viewImage && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4"
          onClick={() => setViewImage(null)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setViewImage(null)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X size={18}/>
            </button>
            <img
              src={viewImage.url}
              alt={viewImage.name}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-white"
            />
            <p className="text-center text-white font-semibold mt-3">{viewImage.name}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(1rem); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default TeacherAttendancePage;