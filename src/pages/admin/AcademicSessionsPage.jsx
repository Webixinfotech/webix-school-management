import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange, Plus, Loader2, AlertTriangle, CheckCircle2, Clock,
  Sparkles, X, ArrowRight, Users, TrendingUp, Pencil, Trash2,
} from 'lucide-react';
import {
  listAcademicSessionsAPI, createAcademicSessionAPI, activateAcademicSessionAPI,
  updateAcademicSessionAPI, deleteAcademicSessionAPI,
} from '../../api/academicSession.api';
import { useAuth } from '../../context/AuthContext';
import FeeToast from './fee/components/FeeToast';
import ConfirmDialog from './fee/components/ConfirmDialog';

// input[type=date] needs "YYYY-MM-DD"; backend returns full ISO strings.
const toDateInputValue = (d) => {
  if (!d) return '';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

const fmtDate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const errMsg = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

const STATUS_META = {
  Active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', icon: CheckCircle2 },
  Upcoming:  { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/50', icon: Clock },
  Completed: { bg: 'bg-slate-100', text: 'text-slate-500', ring: 'ring-slate-200', icon: Sparkles },
};

const StatusPill = ({ status }) => {
  const m = STATUS_META[status] || STATUS_META.Completed;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${m.bg} ${m.text} ${m.ring}`}>
      <Icon size={11} /> {status}
    </span>
  );
};

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-600';

const CreateSessionModal = ({ onClose, onCreated, onError }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !startDate || !endDate) return;
    if (startDate >= endDate) { onError('End date must be after start date.'); return; }
    setBusy(true);
    try {
      const res = await createAcademicSessionAPI({ name: name.trim(), startDate, endDate });
      onCreated(res?.data);
    } catch (err) {
      onError(errMsg(err, 'Failed to create academic session.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-sm px-0 sm:px-4" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Create Academic Session</h3>
            <p className="mt-0.5 text-xs text-slate-500">Always created as "Upcoming" — activate it separately when the school is ready to cut over.</p>
          </div>
          <button onClick={onClose} disabled={busy} className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="px-5 py-5 sm:px-6 space-y-4">
          <div>
            <label className={labelCls}>Session Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-27" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <button
            onClick={submit}
            disabled={busy || !name.trim() || !startDate || !endDate}
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditSessionModal = ({ session, onClose, onUpdated, onError }) => {
  const [name, setName] = useState(session.name || '');
  const [startDate, setStartDate] = useState(toDateInputValue(session.startDate));
  const [endDate, setEndDate] = useState(toDateInputValue(session.endDate));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !startDate || !endDate) return;
    if (startDate >= endDate) { onError('End date must be after start date.'); return; }
    setBusy(true);
    try {
      const res = await updateAcademicSessionAPI(session._id, { name: name.trim(), startDate, endDate });
      onUpdated(res?.data);
    } catch (err) {
      onError(errMsg(err, 'Failed to update academic session.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-sm px-0 sm:px-4" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Edit Academic Session</h3>
            <p className="mt-0.5 text-xs text-slate-500">Name and dates only — to change status, use Activate instead.</p>
          </div>
          <button onClick={onClose} disabled={busy} className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="px-5 py-5 sm:px-6 space-y-4">
          <div>
            <label className={labelCls}>Session Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-27" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          <button
            onClick={submit}
            disabled={busy || !name.trim() || !startDate || !endDate}
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const AcademicSessionsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activateTarget, setActivateTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listAcademicSessionsAPI();
      setSessions(res?.data || []);
    } catch (err) {
      setError(errMsg(err, 'Failed to load academic sessions.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const activeSession = sessions.find((s) => s.status === 'Active');
  const upcomingSessions = sessions.filter((s) => s.status === 'Upcoming');
  const completedSessions = sessions.filter((s) => s.status === 'Completed');

  const doActivate = async () => {
    if (!activateTarget) return;
    setBusy(true);
    try {
      await activateAcademicSessionAPI(activateTarget._id);
      setToast({ type: 'success', message: `"${activateTarget.name}" is now the Active session.` });
      setActivateTarget(null);
      await load();
    } catch (err) {
      setToast({ type: 'error', message: errMsg(err, 'Failed to activate session.') });
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteAcademicSessionAPI(deleteTarget._id);
      setToast({ type: 'success', message: `"${deleteTarget.name}" deleted.` });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      // Backend messages ("Cannot delete the active session...", "N linked
      // record(s)...") are meant to be shown to the user verbatim.
      setToast({ type: 'error', message: errMsg(err, 'Failed to delete session.') });
    } finally {
      setBusy(false);
    }
  };

  const SessionRow = ({ s }) => (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">{s.name}</p>
          <StatusPill status={s.status} />
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          {fmtDate(s.startDate)} <ArrowRight size={11} /> {fmtDate(s.endDate)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {s.status === 'Upcoming' && (
          <button
            onClick={() => setActivateTarget(s)}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 size={13} /> Activate
          </button>
        )}
        {s.status === 'Active' && (
          <Link
            to={`/admin/academic-sessions/promote?fromSessionId=${s._id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary"
          >
            <TrendingUp size={13} /> Promote from here
          </Link>
        )}
        {isAdmin && (
          <button
            onClick={() => setEditTarget(s)}
            title="Edit name/dates"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <Pencil size={14} />
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => setDeleteTarget(s)}
            disabled={s.status === 'Active'}
            title={s.status === 'Active' ? 'Activate a different session first to retire this one' : 'Delete session'}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-500"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Academic Setup</p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Academic Sessions</h1>
              <p className="mt-1 text-sm text-slate-500">Manage school years — create the next session ahead of time for pre-admissions, then activate it when ready.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/admin/fee-hub"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <Users size={13} /> Fee Hub
              </Link>
              <Link
                to="/admin/academic-sessions/promote"
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/10"
              >
                <TrendingUp size={13} /> Promote Students
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Plus size={14} /> New Session
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-6">
        {error && <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={16} /> {error}</div>}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
            <CalendarRange size={22} />
            <p className="text-sm font-semibold text-slate-600">No academic sessions yet.</p>
            <p className="text-xs">Create the first one to start tagging admissions, fees and attendance by school year.</p>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <CheckCircle2 size={14} className="text-emerald-600" /> Currently Active
              </div>
              {activeSession ? (
                <SessionRow s={activeSession} />
              ) : (
                <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                  No session is Active yet — admissions, invoices and attendance won't be tagged to any session until you activate one.
                </div>
              )}
            </div>

            {upcomingSessions.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Clock size={14} className="text-primary" /> Upcoming ({upcomingSessions.length})
                </div>
                <div className="space-y-2.5">
                  {upcomingSessions.map((s) => <SessionRow key={s._id} s={s} />)}
                </div>
              </div>
            )}

            {completedSessions.length > 0 && (
              <div>
                <div className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Sparkles size={14} className="text-slate-400" /> Completed ({completedSessions.length})
                </div>
                <div className="space-y-2.5">
                  {completedSessions.map((s) => <SessionRow key={s._id} s={s} />)}
                </div>
              </div>
            )}
          </>
        )}

        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
          Tip: to admit students into next year while this year is still running, create next year's session here (it stays "Upcoming"), then pick it explicitly on the admission form. Don't activate it until the school actually wants to cut over — activating immediately closes out the current year for all new records. Use "Fee Hub → a student → Enrollments → Promote" to move existing students into a new session once it's active.
        </div>
      </div>

      {showCreate && (
        <CreateSessionModal
          onClose={() => setShowCreate(false)}
          onCreated={(session) => {
            setShowCreate(false);
            setToast({ type: 'success', message: `Session "${session?.name}" created as Upcoming.` });
            load();
          }}
          onError={(msg) => setToast({ type: 'error', message: msg })}
        />
      )}

      <ConfirmDialog
        open={!!activateTarget}
        title="Activate this session?"
        message={activateTarget ? `"${activateTarget.name}" will become the Active session. This closes out the current year for all new admissions, enrollments, invoices and attendance — only activate when the school is ready to cut over.` : ''}
        confirmLabel="Activate"
        loading={busy}
        onConfirm={doActivate}
        onClose={() => setActivateTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this session?"
        message={deleteTarget ? `"${deleteTarget.name}" will be permanently deleted. This is meant for cleaning up a session created by mistake — if it has real students, fees or attendance linked, the delete will be blocked.` : ''}
        confirmLabel="Delete"
        danger
        loading={busy}
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {editTarget && (
        <EditSessionModal
          session={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={(session) => {
            setEditTarget(null);
            setToast({ type: 'success', message: `Session "${session?.name}" updated.` });
            load();
          }}
          onError={(msg) => setToast({ type: 'error', message: msg })}
        />
      )}

      <FeeToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AcademicSessionsPage;
