import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle, GraduationCap, Zap, CheckCircle2, Loader2, ArrowRight,
  Receipt, Sparkles, BadgeIndianRupee,
} from 'lucide-react';
import feeService from '../../../services/feeService';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const FEE_TYPE_META = {
  INSTALLMENT: { label: 'Installment', color: 'text-primary', bg: 'bg-primary/10' },
  ONE_TIME: { label: 'One-Time', color: 'text-purple-600', bg: 'bg-purple-50' },
  FREE: { label: 'Free / Hours', color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

/**
 * Compact fee summary widget — embedded inside StudentDetailView.
 * Full management (collect payment, enroll, flexi card, invoices) lives on
 * the dedicated Fee Hub page at /admin/students/:id/fee-overview.
 */
const FeeManagement = ({ studentId, studentName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isTeacher = location.pathname.includes('/teacher/');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const res = await feeService.getFeeStatus(studentId);
      setStatus(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load fee status');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const openHub = (action) => {
    const basePath = isTeacher ? `/teacher/fee-management/${studentId}` : `/admin/students/${studentId}/fee-overview`;
    navigate(`${basePath}${action ? `?action=${action}` : ''}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 size={16} className="animate-spin" /> Loading fee status…
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-5 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
        <AlertTriangle size={16} /> {error}
      </div>
    );
  }

  const programs = status?.programs || [];
  const grandTotalDue = status?.grandTotalDue ?? 0;
  const flexiHours = status?.flexiCard?.activeHoursRemaining ?? 0;
  const flexiDue = status?.flexiCard?.totalAmountDue ?? 0;

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className={`rounded-2xl border p-4 ${grandTotalDue > 0 ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase ${grandTotalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <BadgeIndianRupee size={13} /> Total Due
          </div>
          <p className={`mt-1.5 text-xl font-extrabold ${grandTotalDue > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{money(grandTotalDue)}</p>
        </div>
        <div className="rounded-2xl border border-primary/50 bg-primary/10 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-primary"><GraduationCap size={13} /> Programs</div>
          <p className="mt-1.5 text-xl font-extrabold text-primary">{programs.length}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-600"><Zap size={13} /> Flexi Hours</div>
          <p className="mt-1.5 text-xl font-extrabold text-amber-700">{flexiHours} hrs</p>
          {flexiDue > 0 && <p className="text-[10px] font-semibold text-rose-500">{money(flexiDue)} due</p>}
        </div>
      </div>

      {programs.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
          <p className="flex items-center gap-2 text-sm text-slate-500"><Sparkles size={15} /> No fee programs yet — enroll {studentName || 'this student'} in a class to auto-generate their fee plan.</p>
          <button
            type="button" onClick={() => openHub('enroll')}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
          >
            <GraduationCap size={15} /> Enroll in a Class
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {programs.slice(0, 4).map((p) => {
            const meta = FEE_TYPE_META[p.feeType] || FEE_TYPE_META.FREE;
            return (
              <div key={p.classId} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.color}`}>{meta.label}</span>
                  <span className="truncate text-sm font-medium text-slate-700">{p.className}</span>
                </div>
                {p.totalDue > 0 ? (
                  <span className="whitespace-nowrap text-sm font-bold text-rose-600">{money(p.totalDue)}</span>
                ) : (
                  <span className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-emerald-600"><CheckCircle2 size={12} /> Paid</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-col sm:flex-row gap-2">
        {grandTotalDue > 0 && (
          <button
            type="button" onClick={() => openHub('collect')}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-primary"
          >
            <BadgeIndianRupee size={15} /> Collect Payment
          </button>
        )}
        <button
          type="button" onClick={() => openHub()}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800"
        >
          <Receipt size={15} /> Open Full Fee Hub <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default FeeManagement;
