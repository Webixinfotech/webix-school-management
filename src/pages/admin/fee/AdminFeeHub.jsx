import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ChevronRight, Loader2, AlertTriangle, Wallet, Users, Receipt,
  Sparkles, RefreshCw, GraduationCap, Layers, Calendar, X, FileText, Settings,
} from 'lucide-react';
import feeService from '../../../services/feeService';
import { getStudentsAPI } from '../../../api/students';
import { listAcademicSessionsAPI } from '../../../api/academicSession.api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const STATUS_STYLE = {
  UNPAID: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  PARTIAL: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  PAID: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
  WAIVED: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
};

const StatCard = ({ icon: Icon, label, value, tone }) => {
  const tones = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    blue: 'bg-primary/10 text-primary border-primary/50',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  };
  return (
    <div className={`rounded-3xl border p-5 ${tones[tone] || tones.slate}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-70"><Icon size={14} /> {label}</div>
      <p className="mt-2 text-2xl font-extrabold break-words">{value}</p>
    </div>
  );
};

const AdminFeeHub = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState({ total: 0, totalPending: 0, data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);

  // Filter defaulters list down to a single class so a large, mixed list
  // never feels like a confusing wall of rows.
  const [classFilter, setClassFilter] = useState('ALL');

  // ── Invoices by Session (session-wide report) ──
  const [academicSessions, setAcademicSessions] = useState([]);
  const [invSessionId, setInvSessionId] = useState('');
  const [invStatus, setInvStatus] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');
  const [invLoaded, setInvLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await listAcademicSessionsAPI();
        const list = res?.data || [];
        setAcademicSessions(list);
        const active = list.find((s) => s.status === 'Active');
        if (active) setInvSessionId(active._id);
      } catch { /* session filter just stays empty */ }
    })();
  }, []);

  const loadInvoices = async () => {
    if (!invSessionId) { setInvError('Choose a session first.'); return; }
    setInvLoading(true);
    setInvError('');
    try {
      const res = await feeService.getInvoices({ sessionId: invSessionId, ...(invStatus && { status: invStatus }), limit: 100 });
      setInvoices(res?.data || []);
      setInvLoaded(true);
    } catch (err) {
      setInvError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load invoices for this session.');
    } finally {
      setInvLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await feeService.getInstallmentDefaulters();
      setReport(res?.data || { total: 0, totalPending: 0, data: [] });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load defaulters report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    const controller = new AbortController();
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await getStudentsAPI({ search: q, limit: 8 });
        const list = res?.data?.data || res?.data?.students || res?.data || [];
        setResults(Array.isArray(list) ? list : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  const uniqueStudents = useMemo(() => {
    const set = new Set((report.data || []).map((r) => r.studentAdmNo));
    return set.size;
  }, [report.data]);

  // Class-wise breakdown — lets admins instantly see which classes have the
  // most defaulters before scrolling the full table.
  const classBreakdown = useMemo(() => {
    const map = {};
    (report.data || []).forEach((r) => {
      const key = r.className || 'Other';
      if (!map[key]) map[key] = { className: key, total: 0, count: 0 };
      map[key].total += Number(r.netDue || 0);
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [report.data]);

  const filteredRows = useMemo(() => {
    if (classFilter === 'ALL') return report.data || [];
    return (report.data || []).filter((r) => (r.className || 'Other') === classFilter);
  }, [report.data, classFilter]);

  const goToStudent = (studentId) => {
    if (!studentId) return;
    navigate(`/admin/students/${studentId}/fee-overview`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Fee Module</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Fee Hub</h1>
            </div>
            <Link
              to="/admin/fee-hub/settings"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              <Settings size={13} /> Settings
            </Link>
          </div>
          <p className="mt-1 text-sm text-slate-500">Installments, Flexi Card, split payments and defaulters — across all students. Search a student to open their full fee management.</p>

          {/* Search */}
          <div className="relative mt-5 max-w-xl">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search student by name or admission no…"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-9 text-sm outline-none focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
            {(searching || results.length > 0) && query.trim().length >= 2 && (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {searching ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Searching…</div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-400">No students found.</div>
                ) : (
                  results.map((s) => (
                    <button
                      key={s._id || s.id} onClick={() => goToStudent(s._id || s.id)}
                      className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-slate-50"
                    >
                      <span>
                        <span className="font-semibold text-slate-800">{s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim()}</span>
                        <span className="ml-2 text-xs text-slate-400">{s.admissionNo}</span>
                      </span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {error && <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={16} /> {error}</div>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={Wallet} label="Total Pending" value={money(report.totalPending)} tone="rose" />
          <StatCard icon={Receipt} label="Overdue Installments" value={report.total || 0} tone="amber" />
          <StatCard icon={Users} label="Students Affected" value={uniqueStudents} tone="blue" />
          {/* <StatCard icon={GraduationCap} label="Avg. Due / Student" value={uniqueStudents ? money(Math.round((report.totalPending || 0) / uniqueStudents)) : money(0)} tone="slate" /> */}
        </div>

        {/* Class-wise breakdown — quick visual of where the pending money sits */}
        {classBreakdown.length > 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Layers size={14} /> Pending by Class
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setClassFilter('ALL')}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${classFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All Classes · {money(report.totalPending)}
              </button>
              {classBreakdown.map((c) => (
                <button
                  key={c.className}
                  onClick={() => setClassFilter(c.className)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${classFilter === c.className ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
                  title={`${c.count} bill${c.count > 1 ? 's' : ''} pending`}
                >
                  {c.className} · {money(c.total)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 flex-wrap">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Installment Defaulters</h3>
              <p className="text-xs text-slate-500">
                Unpaid & partially-paid installments, sorted by due date
                {classFilter !== 'ALL' && <span className="ml-1 font-semibold text-rose-600">· filtered: {classFilter}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {classFilter !== 'ALL' && (
                <button onClick={() => setClassFilter('ALL')} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                  <X size={12} /> Clear filter
                </button>
              )}
              <button onClick={load} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading defaulters…</div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-center text-slate-400">
              <Sparkles size={22} />
              <p className="text-sm font-semibold text-slate-600">{classFilter === 'ALL' ? 'No pending installments 🎉' : `No pending installments for ${classFilter} 🎉`}</p>
              <p className="text-xs">{classFilter === 'ALL' ? 'Every installment across the school is fully paid.' : 'Try clearing the filter to see other classes.'}</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2.5 font-bold">Student</th>
                      <th className="px-5 py-2.5 font-bold">Class</th>
                      <th className="px-5 py-2.5 font-bold">Installment</th>
                      <th className="px-5 py-2.5 font-bold">Net Due</th>
                      <th className="px-5 py-2.5 font-bold">Due Date</th>
                      <th className="px-5 py-2.5 font-bold">Status</th>
                      <th className="px-5 py-2.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => {
                      const sid = row.studentId?._id || (typeof row.studentId === 'string' ? row.studentId : null);
                      return (
                        <tr key={row._id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-900">{row.studentName}</p>
                            <p className="text-xs text-slate-400">{row.studentAdmNo}</p>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{row.className}</td>
                          <td className="px-5 py-3">
                            <p className="text-slate-700">{row.label}</p>
                            <p className="text-xs text-slate-400">{row.installmentNo}</p>
                          </td>
                          <td className="px-5 py-3 font-bold text-rose-600">{money(row.netDue)}</td>
                          <td className="px-5 py-3 text-slate-500">{fmtDate(row.dueDate)}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_STYLE[row.status] || 'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            {sid && typeof sid === 'string' ? (
                              <button onClick={() => goToStudent(sid)} className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
                                Open <ChevronRight size={12} />
                              </button>
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile / tablet cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const sid = row.studentId?._id || (typeof row.studentId === 'string' ? row.studentId : null);
                  return (
                    <div key={row._id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{row.studentName}</p>
                          <p className="text-xs text-slate-400">{row.studentAdmNo} · {row.className}</p>
                        </div>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[row.status] || 'bg-slate-100 text-slate-600'}`}>{row.status}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500">{row.label} <span className="text-slate-400">· {row.installmentNo}</span></span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar size={12} /> {fmtDate(row.dueDate)}</span>
                          <span className="font-extrabold text-rose-600 text-sm">{money(row.netDue)}</span>
                        </div>
                        {sid && typeof sid === 'string' ? (
                          <button onClick={() => goToStudent(sid)} className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                            Open <ChevronRight size={12} />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Invoices by Session — session-wide report */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><FileText size={15} /> Invoices by Session</h3>
              <p className="text-xs text-slate-500">Session-wide invoice report — pick a session and (optionally) a status.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={invSessionId} onChange={(e) => setInvSessionId(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50"
              >
                <option value="">Choose session…</option>
                {academicSessions.map((s) => <option key={s._id} value={s._id}>{s.name}{s.status === 'Active' ? ' (Active)' : ''}</option>)}
              </select>
              <select
                value={invStatus} onChange={(e) => setInvStatus(e.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary/50"
              >
                <option value="">All Status</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="WAIVED">Waived</option>
              </select>
              <button onClick={loadInvoices} disabled={invLoading || !invSessionId} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                {invLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Load
              </button>
            </div>
          </div>

          {invError && <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={14} /> {invError}</div>}

          {!invLoaded ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
              <FileText size={20} />
              <p className="text-sm">Choose a session above and click Load to see its invoices.</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-slate-400">
              <Sparkles size={20} />
              <p className="text-sm font-semibold text-slate-600">No invoices found for this session{invStatus ? ` with status ${invStatus}` : ''}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 font-bold">Invoice</th>
                    <th className="px-5 py-2.5 font-bold">Student</th>
                    <th className="px-5 py-2.5 font-bold">Period</th>
                    <th className="px-5 py-2.5 font-bold">Total Due</th>
                    <th className="px-5 py-2.5 font-bold">Net Due</th>
                    <th className="px-5 py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-slate-900">{inv.invoiceNo}</td>
                      <td className="px-5 py-3">
                        <p className="text-slate-800">{inv.studentName || inv.studentId?.fullName || '—'}</p>
                        <p className="text-xs text-slate-400">{inv.studentAdmNo}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{inv.billingMonth}/{inv.billingYear}</td>
                      <td className="px-5 py-3">{money(inv.totalDue)}</td>
                      <td className="px-5 py-3 font-bold text-slate-900">{money(inv.netDue)}</td>
                      <td className="px-5 py-3"><span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_STYLE[inv.status] || 'bg-slate-100 text-slate-600'}`}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
          Looking for a specific student's enrollments, invoices, Flexi Card or payment history? Use the search box above, or open any student's profile and go to their Fee Hub.
        </div>
      </div>
    </div>
  );
};

export default AdminFeeHub;