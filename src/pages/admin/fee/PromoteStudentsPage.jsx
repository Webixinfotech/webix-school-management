import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, Search, GraduationCap, CheckCircle2,
  TrendingUp, RefreshCw, Sparkles,
} from 'lucide-react';
import feeService from '../../../services/feeService';
import { getClassesAPI } from '../../../api/classes';
import { listAcademicSessionsAPI } from '../../../api/academicSession.api';

const errMsg = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-600';

const DECISION_META = {
  promote: { label: 'Promote', tone: 'bg-primary text-white' },
  retain: { label: 'Retain', tone: 'bg-amber-500 text-white' },
  notContinuing: { label: 'Leaving', tone: 'bg-rose-600 text-white' },
  '': { label: 'Skip', tone: 'bg-slate-200 text-slate-500' },
};

const PromoteStudentsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fromSessionId, setFromSessionId] = useState(searchParams.get('fromSessionId') || '');
  const [toSessionId, setToSessionId] = useState('');

  const [rows, setRows] = useState({}); // studentId -> { decision, newClassId, className, admissionNo, studentName, enrollmentId }
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await listAcademicSessionsAPI();
        const list = res?.data || [];
        setSessions(list);
        if (!fromSessionId) {
          const active = list.find((s) => s.status === 'Active');
          if (active) setFromSessionId(active._id);
        }
        const upcoming = list.find((s) => s.status === 'Upcoming');
        if (upcoming) setToSessionId(upcoming._id);
      } catch (err) {
        setError(errMsg(err, 'Failed to load academic sessions.'));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await getClassesAPI({ limit: 100 });
        setClasses(res?.data || []);
      } catch { /* class picker just stays empty — row-level errors will surface on submit */ }
    })();
  }, []);

  const upcomingSessions = sessions.filter((s) => s.status === 'Upcoming');
  const eligibleFromSessions = sessions.filter((s) => s.status === 'Active' || s.status === 'Completed');

  const loadEnrollments = async () => {
    if (!fromSessionId) { setError('Choose a source session first.'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await feeService.getEnrollmentsBySession({ sessionId: fromSessionId, status: 'Active', limit: 500 });
      const list = res?.data || [];
      const initRows = {};
      list.forEach((e) => {
        const classId = e.classId?._id || e.classId;
        initRows[e.studentId?._id || e.studentId] = {
          decision: '',
          newClassId: classId,
          className: e.className,
          admissionNo: e.studentAdmNo,
          studentName: e.studentName,
          enrollmentId: e._id,
        };
      });
      setRows(initRows);
      setLoaded(true);
    } catch (err) {
      setError(errMsg(err, 'Failed to load enrollments for this session.'));
    } finally {
      setLoading(false);
    }
  };

  const setRow = (studentId, patch) => setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));

  const setAllDecision = (decision) => {
    setRows((prev) => {
      const next = {};
      Object.entries(prev).forEach(([sid, row]) => {
        next[sid] = { ...row, decision };
      });
      return next;
    });
  };

  const filteredStudentIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return Object.keys(rows).filter((sid) => {
      if (!q) return true;
      const row = rows[sid];
      return (row.studentName || '').toLowerCase().includes(q) || (row.admissionNo || '').toLowerCase().includes(q);
    });
  }, [rows, search]);

  const decidedCount = Object.values(rows).filter((r) => r.decision).length;

  const submit = async () => {
    if (!toSessionId) { setError('Choose a target (Upcoming) session.'); return; }
    const decisions = Object.entries(rows)
      .filter(([, r]) => r.decision)
      .map(([studentId, r]) => ({
        studentId,
        decision: r.decision,
        ...(r.decision !== 'notContinuing' && { newClassId: r.newClassId }),
      }));
    if (decisions.length === 0) { setError('Set a decision for at least one student before submitting.'); return; }
    const missingClass = decisions.find((d) => d.decision !== 'notContinuing' && !d.newClassId);
    if (missingClass) { setError('Every Promote/Retain row needs a class selected.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await feeService.promoteStudents({ fromSessionId, toSessionId, decisions });
      // Snapshot names now - successfully-processed rows get pruned below, so
      // the result panel (rendered after pruning) can't look them up from `rows`.
      const resultsWithNames = (res?.data?.results || []).map((r) => ({ ...r, studentName: rows[r.studentId]?.studentName }));
      setResult(res?.data ? { ...res.data, results: resultsWithNames } : null);
      // Drop successfully-processed students from the working list so a retry only shows what's left.
      const doneIds = new Set(resultsWithNames.filter((r) => !r.error).map((r) => r.studentId));
      setRows((prev) => {
        const next = { ...prev };
        doneIds.forEach((sid) => delete next[sid]);
        return next;
      });
    } catch (err) {
      setError(errMsg(err, 'Promotion batch failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <button onClick={() => navigate('/admin/academic-sessions')} className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft size={13} /> Academic Sessions
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Session Promotion</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Promote Students</h1>
          <p className="mt-1 text-sm text-slate-500">Bulk-move every actively enrolled student out of the source session — promote to a new class, retain in the same class, or mark as not continuing.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-5">
        {error && <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={16} /> {error}</div>}

        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-bold flex items-center gap-1.5"><CheckCircle2 size={15} /> Batch complete — {result.success} succeeded, {result.skipped} skipped, {result.failed} failed.</p>
            {(result.errors || []).length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-rose-700">
                {result.errors.map((e, i) => <li key={i}>• {rows[e.studentId]?.studentName || e.studentId}: {e.error}</li>)}
              </ul>
            )}
            {(result.results || []).some((r) => r.pendingDuesFromOldSession?.amount > 0) && (
              <ul className="mt-2 space-y-1 text-xs text-amber-700">
                {result.results
                  .filter((r) => r.pendingDuesFromOldSession?.amount > 0)
                  .map((r) => (
                    <li key={r.studentId} className="flex items-center gap-1.5">
                      <AlertTriangle size={12} className="shrink-0" />
                      {r.studentName || r.studentId}: ₹{r.pendingDuesFromOldSession.amount.toLocaleString('en-IN')} pending from last session
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>From Session</label>
              <select value={fromSessionId} onChange={(e) => setFromSessionId(e.target.value)} className={inputCls}>
                <option value="">Choose source session…</option>
                {eligibleFromSessions.map((s) => <option key={s._id} value={s._id}>{s.name} {s.status === 'Active' ? '(Active)' : '(Completed)'}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>To Session</label>
              <select value={toSessionId} onChange={(e) => setToSessionId(e.target.value)} className={inputCls}>
                <option value="">Choose target (Upcoming) session…</option>
                {upcomingSessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={loadEnrollments}
            disabled={loading || !fromSessionId}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} {loaded ? 'Reload' : 'Load'} Active Enrollments
          </button>
          {upcomingSessions.length === 0 && (
            <p className="mt-3 text-xs font-semibold text-amber-600">No "Upcoming" session exists yet — create one from Academic Sessions before promoting.</p>
          )}
        </div>

        {loaded && (
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Students in Source Session</h3>
                <p className="text-xs text-slate-500">{Object.keys(rows).length} active enrollments · {decidedCount} decided</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="rounded-full border border-slate-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary/50" />
                </div>
                <button onClick={() => setAllDecision('retain')} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100">Set all: Retain</button>
                <button onClick={() => setAllDecision('')} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50">Clear all</button>
              </div>
            </div>

            {Object.keys(rows).length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-12 text-center text-slate-400">
                <Sparkles size={20} />
                <p className="text-sm font-semibold text-slate-600">Nothing left to promote — every student in this session has been processed.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-bold">Student</th>
                      <th className="px-5 py-2.5 font-bold">Current Class</th>
                      <th className="px-5 py-2.5 font-bold">Decision</th>
                      <th className="px-5 py-2.5 font-bold">New Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudentIds.map((sid) => {
                      const row = rows[sid];
                      return (
                        <tr key={sid} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-900">{row.studentName}</p>
                            <p className="text-xs text-slate-400">{row.admissionNo}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{row.className}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5">
                              {['promote', 'retain', 'notContinuing'].map((d) => (
                                <button
                                  key={d} onClick={() => setRow(sid, { decision: d })}
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${row.decision === d ? DECISION_META[d].tone : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  {DECISION_META[d].label}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {row.decision === 'notContinuing' ? (
                              <span className="text-xs text-slate-300">—</span>
                            ) : (
                              <select
                                value={row.newClassId || ''} onChange={(e) => setRow(sid, { newClassId: e.target.value })}
                                disabled={!row.decision}
                                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary/50 disabled:bg-slate-50 disabled:text-slate-300"
                              >
                                <option value="">Choose class…</option>
                                {classes.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.classId || ''}</option>)}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {Object.keys(rows).length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-500 flex items-center gap-1.5"><GraduationCap size={13} /> Undecided rows are left untouched — you can re-run this later for stragglers.</p>
                <button
                  onClick={submit} disabled={submitting || decidedCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />} Submit {decidedCount > 0 ? `(${decidedCount})` : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoteStudentsPage;
