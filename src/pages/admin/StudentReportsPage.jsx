import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Download, Users, UserCheck, UserX,
  GraduationCap, Repeat, Flag, CalendarOff, TrendingUp, ChevronRight,
  Sparkles, RefreshCw, PieChart,
} from 'lucide-react';
import {
  getAdminStudentStatsAPI, getRedFlaggedStudentsAPI, getStudentFreeDaysReportAPI,
  getStudentAttendanceRankingAPI, exportStudentsAPI,
} from '../../api/adminStudentReports.api';
import { getClassesAPI } from '../../api/classes';

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthStartStr = () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); };
const errMsg = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

const downloadCSV = (rows, headers, filename) => {
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

const TABS = [
  { key: 'overview', label: 'Overview', icon: PieChart },
  { key: 'redflagged', label: 'Red-Flagged', icon: Flag },
  { key: 'freedays', label: 'Free Days', icon: CalendarOff },
  { key: 'ranking', label: 'Attendance Ranking', icon: TrendingUp },
];

const StatCard = ({ icon: Icon, label, value, tone = 'slate' }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    blue: 'bg-primary/10 text-primary border-primary/50',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-70"><Icon size={13} /> {label}</div>
      <p className="mt-1.5 text-2xl font-extrabold">{value}</p>
    </div>
  );
};

const StudentReportsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const openStudent = (id) => id && navigate(`/admin/students/${id}`);

  // ── Overview ──
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError('');
    try {
      const res = await getAdminStudentStatsAPI();
      setStats(res?.data?.data || null);
    } catch (err) {
      setStatsError(errMsg(err, 'Failed to load student statistics.'));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportStudentsAPI();
      const rows = res?.data?.data || [];
      if (rows.length === 0) { setStatsError('No students to export.'); return; }
      const headers = ['admissionNo', 'fullName', 'gender', 'className', 'section', 'rollNo', 'status', 'parentName', 'parentEmail', 'parentPhone', 'admissionDate', 'bloodGroup'];
      downloadCSV(rows, headers, `students_export_${todayStr()}.csv`);
    } catch (err) {
      setStatsError(errMsg(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  // ── Red-Flagged ──
  const [flagged, setFlagged] = useState([]);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [flaggedLoaded, setFlaggedLoaded] = useState(false);
  const [flaggedError, setFlaggedError] = useState('');

  const loadFlagged = useCallback(async () => {
    setFlaggedLoading(true);
    setFlaggedError('');
    try {
      const res = await getRedFlaggedStudentsAPI();
      setFlagged(res?.data?.data || []);
      setFlaggedLoaded(true);
    } catch (err) {
      setFlaggedError(errMsg(err, 'Failed to load red-flagged students.'));
    } finally {
      setFlaggedLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'redflagged' && !flaggedLoaded) loadFlagged(); }, [tab, flaggedLoaded, loadFlagged]);

  // ── Free Days ──
  const [classes, setClasses] = useState([]);
  const [fdFrom, setFdFrom] = useState(monthStartStr());
  const [fdTo, setFdTo] = useState(todayStr());
  const [fdClassId, setFdClassId] = useState('');
  const [freeDays, setFreeDays] = useState([]);
  const [fdLoading, setFdLoading] = useState(false);
  const [fdLoaded, setFdLoaded] = useState(false);
  const [fdError, setFdError] = useState('');

  useEffect(() => {
    getClassesAPI().then((res) => setClasses(res?.data?.data || res?.data || [])).catch(() => {});
  }, []);

  const loadFreeDays = async () => {
    setFdLoading(true);
    setFdError('');
    try {
      const res = await getStudentFreeDaysReportAPI({ fromDate: fdFrom, toDate: fdTo, ...(fdClassId && { classId: fdClassId }) });
      setFreeDays(res?.data?.data || []);
      setFdLoaded(true);
    } catch (err) {
      setFdError(errMsg(err, 'Failed to load free-days report.'));
    } finally {
      setFdLoading(false);
    }
  };

  // ── Attendance Ranking ──
  const [rkFrom, setRkFrom] = useState(monthStartStr());
  const [rkTo, setRkTo] = useState(todayStr());
  const [rkOrder, setRkOrder] = useState('desc');
  const [ranking, setRanking] = useState([]);
  const [rkLoading, setRkLoading] = useState(false);
  const [rkLoaded, setRkLoaded] = useState(false);
  const [rkError, setRkError] = useState('');

  const loadRanking = async () => {
    setRkLoading(true);
    setRkError('');
    try {
      const res = await getStudentAttendanceRankingAPI({ fromDate: rkFrom, toDate: rkTo, order: rkOrder });
      setRanking(res?.data?.data || []);
      setRkLoaded(true);
    } catch (err) {
      setRkError(errMsg(err, 'Failed to load attendance ranking.'));
    } finally {
      setRkLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Link to="/admin/students" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} /> Back to Students
          </Link>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Students</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">Enrollment stats, attendance-based flags and CSV export — across all students.</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${tab === key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* ─────────────────────── Overview ─────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="flex items-center justify-end">
              <button
                onClick={handleExport} disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export CSV
              </button>
            </div>

            {statsError && <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={16} /> {statsError}</div>}

            {statsLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-12 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading statistics…</div>
            ) : stats && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <StatCard icon={Users} label="Total" value={stats.total} tone="slate" />
                  <StatCard icon={UserCheck} label="Active" value={stats.Active} tone="emerald" />
                  <StatCard icon={UserX} label="Inactive" value={stats.Inactive} tone="rose" />
                  <StatCard icon={GraduationCap} label="Graduated" value={stats.Graduated} tone="blue" />
                  <StatCard icon={Repeat} label="Transferred" value={stats.Transferred} tone="amber" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-bold text-slate-900">Gender Breakdown</h3>
                    <div className="space-y-2.5">
                      {Object.entries(stats.genderBreakdown || {}).map(([g, count]) => {
                        const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={g}>
                            <div className="flex justify-between text-xs font-semibold text-slate-600"><span>{g}</span><span>{count} ({pct}%)</span></div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-sm font-bold text-slate-900">Top Classes by Enrollment</h3>
                    {(stats.topClasses || []).length === 0 ? (
                      <p className="text-xs text-slate-400">No class data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.topClasses.map((c) => (
                          <div key={c.classId || c.className} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                            <span className="font-semibold text-slate-700">{c.className || 'Unnamed class'}</span>
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">{c.studentCount}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-sm font-bold text-slate-900">Monthly Admission Trend</h3>
                  {(stats.monthlyTrend || []).length === 0 ? (
                    <p className="text-xs text-slate-400">No admissions recorded yet.</p>
                  ) : (
                    <div className="flex items-end gap-2 overflow-x-auto pb-1">
                      {[...stats.monthlyTrend].reverse().map((m) => {
                        const max = Math.max(...stats.monthlyTrend.map((x) => x.count), 1);
                        return (
                          <div key={`${m.year}-${m.month}`} className="flex min-w-[52px] flex-col items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-700">{m.count}</span>
                            <div className="flex h-24 w-8 items-end rounded-lg bg-slate-100">
                              <div className="w-full rounded-lg bg-primary" style={{ height: `${Math.max((m.count / max) * 100, 4)}%` }} />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400">{MONTH_NAMES[m.month]} {String(m.year).slice(2)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─────────────────────── Red-Flagged ─────────────────────── */}
        {tab === 'redflagged' && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Red-Flagged Students</h3>
                <p className="text-xs text-slate-500">Absent 3 or more times in the last 7 days.</p>
              </div>
              <button onClick={loadFlagged} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {flaggedError && <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={14} /> {flaggedError}</div>}

            {flaggedLoading ? (
              <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : flagged.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-12 text-center text-slate-400">
                <Sparkles size={22} />
                <p className="text-sm font-semibold text-slate-600">No red-flagged students 🎉</p>
                <p className="text-xs">Nobody has 3+ absences in the last 7 days.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-bold">Student</th>
                      <th className="px-5 py-2.5 font-bold">Admission No.</th>
                      <th className="px-5 py-2.5 font-bold">Absences (7 days)</th>
                      <th className="px-5 py-2.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flagged.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-900">{row.studentName}</td>
                        <td className="px-5 py-3 text-slate-500">{row.admissionNo}</td>
                        <td className="px-5 py-3"><span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-200">{row.absentInLast7Days}</span></td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => openStudent(row.studentId)} className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
                            Open <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────── Free Days ─────────────────────── */}
        {tab === 'freedays' && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Free Days Report</h3>
                <p className="text-xs text-slate-500">Days each active student was not marked present, over a date range.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={fdFrom} onChange={(e) => setFdFrom(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50" />
                <span className="text-xs text-slate-400">to</span>
                <input type="date" value={fdTo} onChange={(e) => setFdTo(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50" />
                <select value={fdClassId} onChange={(e) => setFdClassId(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50">
                  <option value="">All Classes</option>
                  {classes.map((c) => <option key={c._id} value={c._id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                </select>
                <button onClick={loadFreeDays} disabled={fdLoading} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {fdLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Load
                </button>
              </div>
            </div>

            {fdError && <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={14} /> {fdError}</div>}

            {!fdLoaded ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
                <CalendarOff size={20} />
                <p className="text-sm">Pick a date range above and click Load.</p>
              </div>
            ) : freeDays.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400"><p className="text-sm">No active students found for this range.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-bold">Student</th>
                      <th className="px-5 py-2.5 font-bold">Admission No.</th>
                      <th className="px-5 py-2.5 font-bold">Days in Range</th>
                      <th className="px-5 py-2.5 font-bold">Attended</th>
                      <th className="px-5 py-2.5 font-bold">Free Days</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {freeDays.map((row) => (
                      <tr key={row.studentId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-900">{row.name}</td>
                        <td className="px-5 py-3 text-slate-500">{row.admissionNo}</td>
                        <td className="px-5 py-3 text-slate-600">{row.totalDaysInRange}</td>
                        <td className="px-5 py-3 text-emerald-700 font-semibold">{row.attendedDays}</td>
                        <td className="px-5 py-3 font-bold text-amber-700">{row.freeDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────── Attendance Ranking ─────────────────────── */}
        {tab === 'ranking' && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Attendance Ranking</h3>
                <p className="text-xs text-slate-500">Students ranked by days present over a date range.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input type="date" value={rkFrom} onChange={(e) => setRkFrom(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50" />
                <span className="text-xs text-slate-400">to</span>
                <input type="date" value={rkTo} onChange={(e) => setRkTo(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50" />
                <select value={rkOrder} onChange={(e) => setRkOrder(e.target.value)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50">
                  <option value="desc">Highest first</option>
                  <option value="asc">Lowest first</option>
                </select>
                <button onClick={loadRanking} disabled={rkLoading} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  {rkLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Load
                </button>
              </div>
            </div>

            {rkError && <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={14} /> {rkError}</div>}

            {!rkLoaded ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
                <TrendingUp size={20} />
                <p className="text-sm">Pick a date range above and click Load.</p>
              </div>
            ) : ranking.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400"><p className="text-sm">No attendance recorded for this range.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-bold">#</th>
                      <th className="px-5 py-2.5 font-bold">Student</th>
                      <th className="px-5 py-2.5 font-bold">Admission No.</th>
                      <th className="px-5 py-2.5 font-bold">Present Days</th>
                      <th className="px-5 py-2.5 font-bold">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ranking.map((row, i) => (
                      <tr key={row.studentId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-5 py-3 font-semibold text-slate-900">{row.studentName}</td>
                        <td className="px-5 py-3 text-slate-500">{row.admissionNo}</td>
                        <td className="px-5 py-3 text-slate-600">{row.presentDays} / {row.totalDays}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${row.percentage >= 75 ? 'bg-emerald-500' : row.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(row.percentage, 100)}%` }} />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{row.percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReportsPage;
