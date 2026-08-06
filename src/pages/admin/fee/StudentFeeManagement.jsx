import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Wallet, CreditCard, Receipt, GraduationCap, Zap, Plus, X, Loader2,
  CheckCircle2, AlertTriangle, Clock, ChevronRight, ChevronDown, FileText, Ban, Pencil,
  BadgeIndianRupee, ShieldCheck, Sparkles, RefreshCw, Info, Layers, Calendar, User2, History,
  TrendingUp, UserX,
} from 'lucide-react';
import feeService from '../../../services/feeService';
import { getStudentAPI } from '../../../api/students';
import { getClassesAPI } from '../../../api/classes';
import { listAcademicSessionsAPI } from '../../../api/academicSession.api';
import FeeToast from './components/FeeToast';
import ConfirmDialog from './components/ConfirmDialog';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? '—' : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtDateTime = (d) => {
  if (!d) return '—';
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
// yyyy-mm-dd for <input type="date"> — plain toISOString would shift the
// date across midnight for IST users, so build it from local parts instead.
const dateInputValue = (d) => {
  if (!d) return '';
  const parsed = new Date(d);
  if (isNaN(parsed.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
};

const PAYMENT_EDIT_FIELD_LABEL = {
  amount: 'Amount',
  paymentMode: 'Payment Mode',
  transactionRef: 'Transaction Ref',
  paymentDate: 'Payment Date',
  remarks: 'Remarks',
};
const fmtHistoryValue = (field, v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (field === 'amount') return money(v);
  if (field === 'paymentDate') return fmtDateTime(v);
  if (field === 'paymentMode') return modeMeta(v).label;
  return String(v);
};

const STATUS_STYLE = {
  PAID: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  UNPAID: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  PARTIAL: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  CANCELLED: 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
  WAIVED: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  Inactive: 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  EXHAUSTED: 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200',
  Promoted: 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/50',
  Retained: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  Left: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
};
const StatusPill = ({ status }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200'}`}>
    {status || 'N/A'}
  </span>
);

const FEE_TYPE_META = {
  INSTALLMENT: { label: 'Installment Plan', icon: Receipt, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/50' },
  ONE_TIME: { label: 'One-Time Fee', icon: BadgeIndianRupee, color: 'text-purple-600', bg: 'bg-purple-50', ring: 'ring-purple-200' },
  FREE: { label: 'Free / Hours Based', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  MONTHLY: { label: 'Monthly Billing', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/50' },
  // classType === 'FLEX_TIME' — billed as baseFee (hourly rate) x hours
  // assigned, never the FREE/Hours-Based bucket above. Looked up by
  // classType, not feeType — see feeTypeMetaFor().
  FLEX_TIME: { label: 'Flexible Time (Hourly)', icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50', ring: 'ring-teal-200' },
};
// A program's displayed fee type must be driven by classType first — a
// FLEX_TIME class can have any class-level feeType (MONTHLY/ONE_TIME/FREE)
// set on it, but it's always billed hourly (baseFee x hoursAssigned), never
// via that feeType. Falling back to FEE_TYPE_META[feeType] for FLEX_TIME
// classes was silently mislabeling paid hourly enrollments as "Free / Hours".
const feeTypeMetaFor = (program) =>
  program?.classType === 'FLEX_TIME'
    ? FEE_TYPE_META.FLEX_TIME
    : (FEE_TYPE_META[program?.feeType] || FEE_TYPE_META.FREE);

const PAYMENT_MODES = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  { id: 'cheque', label: 'Cheque', icon: '📝' },
  { id: 'card', label: 'Card', icon: '💳' },
  { id: 'other', label: 'Other', icon: '💰' },
];
const modeMeta = (id) => PAYMENT_MODES.find((m) => m.id === id) || { label: id || '—', icon: '💰' };

const errMsg = (err, fallback) => err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;

/** Fetch every active/inactive class across pages using a safe page size
 *  (some backends reject large `limit` values, which previously caused the
 *  Enroll dropdown to silently appear empty). Throws on real failures so the
 *  caller can surface an actionable error instead of hiding it. */
const fetchAllClasses = async () => {
  const pageSize = 50;
  let page = 1;
  let all = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await getClassesAPI({ page, limit: pageSize });
    const batch = res?.data || [];
    all = all.concat(Array.isArray(batch) ? batch : []);
    const totalPages = res?.pages || 1;
    if (page >= totalPages || batch.length === 0) break;
    page += 1;
    if (page > 20) break; // hard safety cap (1000 classes)
  }
  return all;
};

/* ------------------------------------------------------------------ */
/*  Small primitives                                                   */
/* ------------------------------------------------------------------ */

const StatCard = ({ icon: Icon, label, value, tone = 'slate', sub }) => {
  const tones = {
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-primary/10 text-primary border-primary/50',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide opacity-70">
        <Icon size={14} /> {label}
      </div>
      <p className="mt-2 text-xl sm:text-2xl font-extrabold break-words">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] font-semibold opacity-60">{sub}</p>}
    </div>
  );
};

const SectionCard = ({ title, subtitle, icon: Icon, action, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 flex-wrap">
      <div className="flex items-center gap-2.5">
        {Icon && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"><Icon size={15} /></div>}
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

const EmptyRow = ({ text, icon: Icon = Sparkles }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
    <Icon size={20} className="text-slate-300" />
    {text}
  </div>
);

const ModalShell = ({ title, subtitle, onClose, children, wide }) => (
  <div className="fixed inset-0 z-[9997] flex items-end sm:items-center justify-center bg-slate-900/55 backdrop-blur-sm px-0 sm:px-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl`}>
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </div>
  </div>
);

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10';
const labelCls = 'mb-1.5 block text-xs font-semibold text-slate-600';

/** Group a flat list of payable/bill-like items by className for clearer,
 *  less confusing review before collecting or displaying money. */
const groupByClass = (items, classKey = 'className') => {
  const groups = [];
  const index = {};
  items.forEach((item) => {
    const key = item[classKey] || 'Other';
    if (!(key in index)) {
      index[key] = groups.length;
      groups.push({ className: key, items: [] });
    }
    groups[index[key]].items.push(item);
  });
  return groups;
};

/* ------------------------------------------------------------------ */
/*  Collect Payment Modal (split / partial allocation across bills)    */
/*  Items are grouped by class so it's obvious what money is going     */
/*  towards, especially when a student owes fees on several programs.  */
/* ------------------------------------------------------------------ */

const CollectPaymentModal = ({ studentId, payableItems, preselectId, onClose, onSuccess, onError }) => {
  const [selected, setSelected] = useState(() => {
    const init = {};
    payableItems.forEach((item) => {
      if (preselectId && item.key === preselectId) init[item.key] = item.max;
    });
    return init;
  });
  const [paymentMode, setPaymentMode] = useState('cash');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (item) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (item.key in next) delete next[item.key];
      else next[item.key] = item.max;
      return next;
    });
  };
  const setAmount = (item, val) => {
    const num = Math.max(0, Math.min(item.max, Number(val) || 0));
    setSelected((prev) => ({ ...prev, [item.key]: num }));
  };

  const total = Object.values(selected).reduce((s, v) => s + v, 0);
  const grouped = useMemo(() => groupByClass(payableItems), [payableItems]);

  const submit = async () => {
    const allocations = payableItems
      .filter((item) => selected[item.key] > 0)
      .map((item) => ({ billType: item.billType, billId: item.billId, amount: selected[item.key] }));
    if (allocations.length === 0) { onError('Select at least one item and amount to collect payment.'); return; }
    setSaving(true);
    try {
      const res = await feeService.collectPayment({ studentId, amount: total, paymentMode, remarks, allocations });
      onSuccess(res?.message || 'Payment collected successfully.');
    } catch (err) {
      onError(errMsg(err, 'Failed to collect payment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Collect Payment" subtitle="Grouped by class — tick what's being paid, split across programs in one receipt if needed." onClose={onClose} wide>
      {payableItems.length === 0 ? (
        <EmptyRow text="Nothing pending to collect for this student." />
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            const groupTotal = group.items.reduce((s, it) => s + (selected[it.key] || 0), 0);
            const groupDue = group.items.reduce((s, it) => s + it.max, 0);
            return (
              <div key={group.className} className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between gap-2 bg-slate-50 px-3.5 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
                    <Layers size={13} /> {group.className}
                  </div>
                  <span className="text-xs font-semibold text-slate-500">Due {money(groupDue)}</span>
                </div>
                <div className="space-y-2 p-2.5">
                  {group.items.map((item) => {
                    const checked = item.key in selected;
                    return (
                      <div key={item.key} className={`rounded-xl border p-3 transition ${checked ? 'border-primary/50 bg-primary/10/40' : 'border-slate-200'}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={checked} onChange={() => toggle(item)} className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/50" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{item.label}</p>
                                <p className="truncate text-xs text-slate-500">{item.subLabel} · Due {money(item.max)}</p>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.billType === 'FLEXI_CARD' ? 'Flexi Card' : 'Installment'}</span>
                            </div>
                            {checked && (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-slate-500">₹</span>
                                <input
                                  type="number" min={0} max={item.max} value={selected[item.key]}
                                  onChange={(e) => setAmount(item, e.target.value)}
                                  className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                                />
                                <button type="button" onClick={() => setAmount(item, item.max)} className="text-xs font-semibold text-primary hover:underline">Full amount</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {groupTotal > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-3.5 py-2 text-xs">
                    <span className="font-semibold text-slate-500">Collecting for {group.className}</span>
                    <span className="font-bold text-slate-800">{money(groupTotal)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Payment Mode</label>
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}>
            {PAYMENT_MODES.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Remarks (optional)</label>
          <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Split payment covering 2 programs" className={inputCls} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <span className="text-sm font-semibold opacity-80">Total to collect</span>
        <span className="text-2xl font-extrabold">{money(total)}</span>
      </div>

      <button
        type="button" onClick={submit} disabled={saving || total <= 0}
        className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Processing…' : `Collect ${money(total)}`}
      </button>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Enroll in Class Modal                                              */
/* ------------------------------------------------------------------ */

const EnrollModal = ({ studentId, availableClasses, defaultClassId, onClose, onSuccess, onError }) => {
  const [step, setStep] = useState('select'); // 'select' | 'pay'
  const [classId, setClassId] = useState(() => defaultClassId || (availableClasses[0] ? (availableClasses[0]._id || availableClasses[0].id) : ''));
  const [hoursAssigned, setHoursAssigned] = useState('');
  const [saving, setSaving] = useState(false);
  const [enrolledLabel, setEnrolledLabel] = useState('');
  const [newPayables, setNewPayables] = useState([]);
  const [selectedPay, setSelectedPay] = useState({});
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paying, setPaying] = useState(false);

  const selected = availableClasses.find((c) => (c._id || c.id) === classId);
  const isFlexTime = selected?.classType === 'FLEX_TIME';
  const meta = selected ? feeTypeMetaFor(selected) : null;
  const flexFeePreview = isFlexTime ? (Number(selected?.baseFee) || 0) * (Number(hoursAssigned) || 0) : 0;

  const doEnroll = async () => {
    if (!classId) { onError('Please select a class to enroll in.'); return; }
    if (isFlexTime && !(Number(hoursAssigned) > 0)) { onError('Please enter how many hours to assign for this Flexible Time class.'); return; }
    setSaving(true);
    try {
      const res = await feeService.createEnrollment(studentId, classId, isFlexTime ? hoursAssigned : undefined);
      const newEnrollmentId = res?.data?._id || res?.data?.id;
      setEnrolledLabel(selected?.name || 'the class');

      // Fetch freshly generated installments tied to this new enrollment so the
      // admin can collect payment immediately, in the same flow.
      let payables = [];
      try {
        const instRes = await feeService.getInstallmentsByStudent(studentId);
        payables = (instRes?.data || [])
          .filter((i) => (i.enrollmentId === newEnrollmentId) && Number(i.netDue) > 0)
          .map((i) => ({ key: `INSTALLMENT:${i._id}`, billType: 'INSTALLMENT', billId: i._id, max: Number(i.netDue), label: i.label, subLabel: i.installmentNo }));
      } catch { /* non-fatal — payables stays empty, Skip is still available */ }

      setNewPayables(payables);
      const initSel = {};
      payables.forEach((p) => { initSel[p.key] = p.max; });
      setSelectedPay(initSel);

      if (payables.length === 0) {
        // Nothing billable (e.g. FREE program) — nothing to collect, wrap up.
        onSuccess(res?.message || `Enrolled in ${selected?.name || 'class'} successfully.`);
        return;
      }
      setStep('pay');
    } catch (err) {
      onError(errMsg(err, 'Failed to enroll student.'));
    } finally {
      setSaving(false);
    }
  };

  const togglePay = (item) => {
    setSelectedPay((prev) => {
      const next = { ...prev };
      if (item.key in next) delete next[item.key];
      else next[item.key] = item.max;
      return next;
    });
  };
  const setPayAmount = (item, val) => {
    const num = Math.max(0, Math.min(item.max, Number(val) || 0));
    setSelectedPay((prev) => ({ ...prev, [item.key]: num }));
  };
  const payTotal = Object.values(selectedPay).reduce((s, v) => s + v, 0);

  const collectNow = async () => {
    const allocations = newPayables
      .filter((item) => selectedPay[item.key] > 0)
      .map((item) => ({ billType: item.billType, billId: item.billId, amount: selectedPay[item.key] }));
    if (allocations.length === 0) { onError('Select an amount to collect, or choose Skip for now.'); return; }
    setPaying(true);
    try {
      await feeService.collectPayment({ studentId, amount: payTotal, paymentMode, allocations });
      onSuccess(`Enrolled in ${enrolledLabel} and collected ${money(payTotal)}.`);
    } catch (err) {
      onError(errMsg(err, 'Enrolled, but payment collection failed — you can collect it from the Installments tab.'));
    } finally {
      setPaying(false);
    }
  };

  if (step === 'pay') {
    return (
      <ModalShell title="Collect Payment Now?" subtitle={`${enrolledLabel} was enrolled — settle the new due amount right away, or collect it later from Installments.`} onClose={onClose}>
        <div className="space-y-2">
          {newPayables.map((item) => {
            const checked = item.key in selectedPay;
            return (
              <div key={item.key} className={`rounded-2xl border p-3.5 transition ${checked ? 'border-primary/50 bg-primary/10/40' : 'border-slate-200'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={checked} onChange={() => togglePay(item)} className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.subLabel} · Due {money(item.max)}</p>
                      </div>
                    </div>
                    {checked && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-500">₹</span>
                        <input
                          type="number" min={0} max={item.max} value={selectedPay[item.key]}
                          onChange={(e) => setPayAmount(item, e.target.value)}
                          className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-semibold outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
                        />
                        <button type="button" onClick={() => setPayAmount(item, item.max)} className="text-xs font-semibold text-primary hover:underline">Full amount</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <label className={labelCls}>Payment Mode</label>
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}>
            {PAYMENT_MODES.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
          </select>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
          <span className="text-sm font-semibold opacity-80">Collecting now</span>
          <span className="text-2xl font-extrabold">{money(payTotal)}</span>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={() => onSuccess(`Enrolled in ${enrolledLabel}. Payment is still pending — collect it anytime from the Installments tab.`)} disabled={paying} className="flex-1 rounded-2xl border border-slate-200 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
            Skip for now
          </button>
          <button type="button" onClick={collectNow} disabled={paying || payTotal <= 0} className="flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50">
            {paying ? 'Processing…' : `Collect ${money(payTotal)}`}
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Enroll in a Class" subtitle="Fee plan (installments / one-time / free) is inherited automatically from the class. You'll be able to collect the first payment right after." onClose={onClose}>
      {availableClasses.length === 0 ? (
        <EmptyRow text="Student is already enrolled in every available class." icon={GraduationCap} />
      ) : (
        <>
          <label className={labelCls}>Select Class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
            <option value="">Choose a class…</option>
            {availableClasses.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name} · {c.classId || ''}</option>
            ))}
          </select>

          {selected && meta && (
            <div className={`mt-4 rounded-2xl border p-4 ${meta.bg} ${meta.ring} ring-1`}>
              <div className={`flex items-center gap-2 text-sm font-bold ${meta.color}`}>
                <meta.icon size={16} /> {meta.label}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-slate-500">{isFlexTime ? 'Rate / Hour' : 'Base Fee'}</p><p className="font-bold text-slate-900">{money(selected.baseFee)}</p></div>
                {isFlexTime ? (
                  <div>
                    <p className="text-xs text-slate-500">Hours to Assign</p>
                    <input
                      type="number" min="0.5" step="0.5" placeholder="e.g. 3"
                      value={hoursAssigned}
                      onChange={(e) => setHoursAssigned(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-white/70 bg-white/80 px-2.5 py-1.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10"
                    />
                  </div>
                ) : selected.isPrepaidHoursCard ? (
                  <div><p className="text-xs text-slate-500">Hours in Tier</p><p className="font-bold text-slate-900">{selected.hoursInTier || 0} hrs</p></div>
                ) : selected.feeType === 'INSTALLMENT' ? (
                  <div><p className="text-xs text-slate-500">Installments</p><p className="font-bold text-slate-900">{(selected.installmentTemplate || []).length}</p></div>
                ) : (
                  <div><p className="text-xs text-slate-500">Monthly Free Hours</p><p className="font-bold text-slate-900">{selected.monthlyFreeHours || 0} hrs</p></div>
                )}
              </div>
              {isFlexTime && (
                <div className="mt-3 flex items-center justify-between border-t border-white/60 pt-3 text-sm">
                  <span className="font-semibold text-slate-600">Fee due (unpaid until collected)</span>
                  <span className="font-extrabold text-slate-900">{money(flexFeePreview)}</span>
                </div>
              )}
              {selected.feeType === 'INSTALLMENT' && (selected.installmentTemplate || []).length > 0 && (
                <div className="mt-3 space-y-1.5 border-t border-white/60 pt-3">
                  {selected.installmentTemplate.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{t.label}</span>
                      <span className="font-semibold text-slate-800">{money(t.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="button" onClick={doEnroll} disabled={saving || !classId || (isFlexTime && !(Number(hoursAssigned) > 0))}
            className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Enrolling…' : 'Enroll Student →'}
          </button>
        </>
      )}
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Session Promotion Modal (Academic Session feature)                 */
/*  Moves this one enrollment into a target (Upcoming) session, per     */
/*  POST /fee/promotions — promote (new class), retain (same class),    */
/*  or notContinuing (student leaving).                                 */
/* ------------------------------------------------------------------ */

const PromoteModal = ({ studentId, enrollment, classes, academicSessions, onClose, onSuccess, onError }) => {
  const upcomingSessions = academicSessions.filter((s) => s.status === 'Upcoming');
  const activeSession = academicSessions.find((s) => s.status === 'Active');
  const fromSessionId = enrollment.sessionId || activeSession?._id || '';

  const [toSessionId, setToSessionId] = useState(upcomingSessions[0]?._id || '');
  const [decision, setDecision] = useState('promote');
  const [newClassId, setNewClassId] = useState('');
  const [saving, setSaving] = useState(false);

  const currentClassId = enrollment.classId?._id || enrollment.classId || '';

  useEffect(() => {
    if (decision === 'retain') setNewClassId(currentClassId);
    else if (decision === 'promote') setNewClassId((c) => (c === currentClassId ? '' : c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decision]);

  const submit = async () => {
    if (!fromSessionId) { onError('No active/source academic session found — create and activate one first.'); return; }
    if (!toSessionId) { onError('Please choose a target (Upcoming) session.'); return; }
    if (decision !== 'notContinuing' && !newClassId) { onError('Please choose a class for the new session.'); return; }
    setSaving(true);
    try {
      const res = await feeService.promoteStudents({
        fromSessionId, toSessionId,
        decisions: [{ studentId, decision, ...(decision !== 'notContinuing' && { newClassId }) }],
      });
      const failed = res?.data?.errors?.[0];
      if (failed) { onError(failed.error || 'Promotion failed.'); return; }
      const labels = { promote: 'promoted to', retain: 'retained in', notContinuing: 'marked not continuing for' };
      onSuccess(`Student ${labels[decision]} the next session.`);
    } catch (err) {
      onError(errMsg(err, 'Failed to process the promotion.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Promote to Next Session" subtitle={`Moves "${enrollment.className}" out of the current session and into the one you pick below.`} onClose={onClose}>
      {upcomingSessions.length === 0 ? (
        <EmptyRow text='No "Upcoming" academic session exists yet. Create one from Academic Sessions before promoting students.' icon={Calendar} />
      ) : (
        <>
          <label className={labelCls}>Target Session</label>
          <select value={toSessionId} onChange={(e) => setToSessionId(e.target.value)} className={inputCls}>
            {upcomingSessions.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          <label className={`${labelCls} mt-4`}>Decision</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'promote', label: 'Promote' },
              { id: 'retain', label: 'Retain' },
              { id: 'notContinuing', label: 'Leaving' },
            ].map((d) => (
              <button
                key={d.id} type="button" onClick={() => setDecision(d.id)}
                className={`rounded-xl border py-2.5 text-xs font-bold transition ${decision === d.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {decision !== 'notContinuing' && (
            <div className="mt-4">
              <label className={labelCls}>{decision === 'retain' ? 'Class (same grade)' : 'New Class'}</label>
              <select value={newClassId} onChange={(e) => setNewClassId(e.target.value)} className={inputCls}>
                <option value="">Choose a class…</option>
                {classes.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name} · {c.classId || ''}</option>
                ))}
              </select>
            </div>
          )}

          {decision === 'notContinuing' && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
              The current enrollment will be marked <b>Left</b>. No new enrollment is created.
            </div>
          )}

          <button
            type="button" onClick={submit} disabled={saving}
            className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Processing…' : 'Confirm'}
          </button>
        </>
      )}
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Mark Left Modal — correction/rollback for a promoted enrollment    */
/*  that turns out the student actually left (PUT .../mark-left)       */
/* ------------------------------------------------------------------ */

const MarkLeftModal = ({ enrollment, onClose, onSuccess, onError }) => {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await feeService.markEnrollmentLeft(enrollment._id, reason.trim());
      onSuccess('Enrollment marked Left.');
    } catch (err) {
      onError(errMsg(err, 'Failed to mark this enrollment Left.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Mark Enrollment Left" subtitle={`Correction for "${enrollment.className}" — use this when the student is later found to have actually left (e.g. transferred elsewhere).`} onClose={onClose}>
      <label className={labelCls}>Reason (optional)</label>
      <textarea
        value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
        placeholder="e.g. Family transferred to another school"
        className={`${inputCls} resize-none`}
      />
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
        This only touches this one enrollment record — attendance, invoices and other sessions are never affected.
      </div>
      <button
        type="button" onClick={submit} disabled={saving}
        className="mt-5 w-full rounded-2xl bg-rose-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Mark Left'}
      </button>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Add Flexi Hours Modal — top up hours on an existing FLEX_TIME       */
/*  enrollment. Every call bills baseFee x hoursAssigned as a fresh     */
/*  UNPAID installment on top of whatever's already assigned/paid.      */
/* ------------------------------------------------------------------ */

const AddFlexiHoursModal = ({ studentId, enrollment, baseFee, onClose, onSuccess, onError }) => {
  const [hours, setHours] = useState('');
  const [saving, setSaving] = useState(false);
  const amount = (Number(baseFee) || 0) * (Number(hours) || 0);

  const submit = async () => {
    if (!(Number(hours) > 0)) { onError('Enter how many hours to add.'); return; }
    setSaving(true);
    try {
      await feeService.assignFlexiHours(studentId, enrollment.classId?._id || enrollment.classId, hours);
      onSuccess(`Added ${hours} hrs to ${enrollment.className} — ${money(amount)} due, collect from Installments.`);
    } catch (err) {
      onError(errMsg(err, 'Failed to add Flexi Time hours.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Add Flexi Time Hours" subtitle={`Top up hours for "${enrollment.className}" — bills ${money(baseFee)}/hr as a new unpaid amount, on top of ${enrollment.flexiHoursAssigned || 0} hrs already assigned.`} onClose={onClose}>
      <label className={labelCls}>Hours to Add</label>
      <input
        type="number" min="0.5" step="0.5" placeholder="e.g. 3"
        value={hours} onChange={(e) => setHours(e.target.value)}
        className={inputCls}
      />
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white">
        <span className="text-sm font-semibold opacity-80">Fee due (unpaid until collected)</span>
        <span className="text-2xl font-extrabold">{money(amount)}</span>
      </div>
      <button
        type="button" onClick={submit} disabled={saving || !(Number(hours) > 0)}
        className="mt-5 w-full rounded-2xl bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? 'Adding…' : `Add ${hours || 0} hrs →`}
      </button>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Flexi Card Purchase Modal                                          */
/* ------------------------------------------------------------------ */

const FlexiPurchaseModal = ({ studentId, flexiClasses, onClose, onSuccess, onError }) => {
  const [classId, setClassId] = useState(flexiClasses[0] ? (flexiClasses[0]._id || flexiClasses[0].id) : '');
  const [amountPaidNow, setAmountPaidNow] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [saving, setSaving] = useState(false);
  const selected = flexiClasses.find((c) => (c._id || c.id) === classId);

  useEffect(() => {
    if (selected) setAmountPaidNow(String(selected.baseFee || ''));
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (!classId) { onError('Please select a Flexi Card tier.'); return; }
    setSaving(true);
    try {
      const res = await feeService.purchaseFlexiCard({ studentId, classId, amountPaidNow: Number(amountPaidNow) || 0, paymentMode });
      onSuccess(res?.message || 'Flexi Card purchased successfully.');
    } catch (err) {
      onError(errMsg(err, 'Failed to purchase Flexi Card.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Purchase Flexi Card" subtitle="Prepaid hours card — pay full amount now or make a partial payment." onClose={onClose}>
      {flexiClasses.length === 0 ? (
        <EmptyRow text="No Flexi Card tiers are configured. Ask admin to set one up in Classes." icon={Zap} />
      ) : (
        <>
          <label className={labelCls}>Flexi Card Tier</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
            {flexiClasses.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>{c.name} · {c.hoursInTier || 0} hrs · {money(c.baseFee)}</option>
            ))}
          </select>

          <div className="mt-4">
            <label className={labelCls}>Amount Paying Now</label>
            <input type="number" min={0} value={amountPaidNow} onChange={(e) => setAmountPaidNow(e.target.value)} className={inputCls} />
            {selected && Number(amountPaidNow) < Number(selected.baseFee || 0) && (
              <p className="mt-1.5 text-xs text-amber-600">Remaining {money(Number(selected.baseFee || 0) - Number(amountPaidNow || 0))} will stay due on this card.</p>
            )}
          </div>

          <div className="mt-4">
            <label className={labelCls}>Payment Mode</label>
            <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}>
              {PAYMENT_MODES.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>

          <button
            type="button" onClick={submit} disabled={saving}
            className="mt-5 w-full rounded-2xl bg-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition hover:bg-amber-600 disabled:opacity-50"
          >
            {saving ? 'Processing…' : 'Purchase Flexi Card'}
          </button>
        </>
      )}
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Adjust / Waive Installment Modal                                   */
/* ------------------------------------------------------------------ */

const AdjustInstallmentModal = ({ installment, onClose, onSuccess, onError }) => {
  const [adjustmentAmount, setAdjustmentAmount] = useState(installment.adjustmentAmount || 0);
  const [adjustmentReason, setAdjustmentReason] = useState(installment.adjustmentReason || '');
  const [notes, setNotes] = useState(installment.notes || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await feeService.updateInstallment(installment._id, {
        adjustmentAmount: Number(adjustmentAmount) || 0,
        adjustmentReason,
        notes,
      });
      onSuccess(res?.message || 'Installment updated.');
    } catch (err) {
      onError(errMsg(err, 'Failed to update installment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Adjust — ${installment.label}`} subtitle={`${installment.className ? installment.className + ' · ' : ''}${installment.installmentNo} · Original amount ${money(installment.amount)}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Adjustment Amount (₹) — reduces amount due; use negative to waive/discount</label>
          <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Adjustment Reason</label>
          <input value={adjustmentReason} onChange={(e) => setAdjustmentReason(e.target.value)} placeholder="e.g. Sibling discount" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Internal Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={inputCls} />
        </div>
      </div>
      <button
        type="button" onClick={submit} disabled={saving}
        className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Edit Payment Modal — admin-only correction of a past receipt        */
/*  (amount, mode, transaction ref, date, remarks). Every save appends  */
/*  an entry to the payment's editHistory.                              */
/* ------------------------------------------------------------------ */
const EditPaymentModal = ({ payment, onClose, onSuccess, onError }) => {
  const [amount, setAmount] = useState(payment.amount);
  const [paymentMode, setPaymentMode] = useState(payment.paymentMode || 'cash');
  const [transactionRef, setTransactionRef] = useState(payment.transactionRef || '');
  const [paymentDate, setPaymentDate] = useState(dateInputValue(payment.paymentDate));
  const [remarks, setRemarks] = useState(payment.remarks || '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const sumAllocated = (payment.allocations || []).reduce((s, a) => s + Number(a.amountUsed || 0), 0);

  const submit = async () => {
    if (!amount || Number(amount) < 1) { onError('Amount must be at least 1.'); return; }
    setSaving(true);
    try {
      const res = await feeService.updatePayment(payment._id, {
        amount: Number(amount),
        paymentMode,
        transactionRef,
        paymentDate: paymentDate ? new Date(paymentDate).toISOString() : undefined,
        remarks,
        note,
      });
      onSuccess(res?.message || 'Payment updated.');
    } catch (err) {
      onError(errMsg(err, 'Failed to update payment.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Edit Payment — ${payment.receiptNo}`} subtitle="Correct a data-entry mistake on this receipt. Every change is logged in the payment's edit history." onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Amount (₹)</label>
            <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
            {sumAllocated > 0 && (
              <p className="mt-1 text-[11px] text-slate-400">₹{sumAllocated.toLocaleString('en-IN')} already allocated to bills — can't reduce below this.</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Payment Date</label>
            <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Payment Mode</label>
          <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}>
            {PAYMENT_MODES.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Transaction Ref</label>
          <input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="UPI/bank/cheque ref (optional)" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Remarks</label>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Reason for this edit (shown in edit history)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Wrong date entered by mistake" className={inputCls} />
        </div>
      </div>
      <button
        type="button" onClick={submit} disabled={saving}
        className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </ModalShell>
  );
};

/* ------------------------------------------------------------------ */
/*  Main Page                                                           */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'enrollments', label: 'Enrollments', icon: GraduationCap },
  { id: 'installments', label: 'Installments', icon: Receipt },
  { id: 'flexi', label: 'Flexi Card', icon: Zap },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'payments', label: 'Payments', icon: Wallet },
];

const StudentFeeManagement = () => {
  const { id: studentId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [student, setStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [academicSessions, setAcademicSessions] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [flexiBalance, setFlexiBalance] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  const [showCollect, setShowCollect] = useState(false);
  const [preselectKey, setPreselectKey] = useState(null);
  const [showEnroll, setShowEnroll] = useState(false);
  const [showFlexiPurchase, setShowFlexiPurchase] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [promoteTarget, setPromoteTarget] = useState(null);
  const [markLeftTarget, setMarkLeftTarget] = useState(null);
  const [addHoursTarget, setAddHoursTarget] = useState(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [editPaymentTarget, setEditPaymentTarget] = useState(null);

  const [classesError, setClassesError] = useState('');

  const notify = (type, message) => setToast({ type, message, __t: Date.now() });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    setClassesError('');
    try {
      const [studentRes, classesResult, enrollRes, instRes, flexiRes, invRes, payRes, statusRes, sessionsRes] = await Promise.all([
        getStudentAPI(studentId).catch(() => null),
        fetchAllClasses().then((data) => ({ ok: true, data })).catch((err) => ({ ok: false, err })),
        feeService.getEnrollmentsByStudent(studentId).catch(() => ({ data: [] })),
        feeService.getInstallmentsByStudent(studentId).catch(() => ({ data: [] })),
        feeService.getFlexiCardBalance(studentId).catch(() => ({ data: null })),
        feeService.getInvoicesByStudent(studentId).catch(() => ({ data: [] })),
        feeService.getPaymentsByStudent(studentId).catch(() => ({ data: [] })),
        feeService.getFeeStatus(studentId).catch(() => ({ data: null })),
        listAcademicSessionsAPI().catch(() => ({ data: [] })),
      ]);

      setStudent(studentRes?.data || studentRes || null);
      if (classesResult.ok) {
        setClasses(classesResult.data);
      } else {
        setClasses([]);
        setClassesError(errMsg(classesResult.err, 'Failed to load classes list — Enroll will be unavailable until this is fixed.'));
      }
      setEnrollments(enrollRes?.data || []);
      setAcademicSessions(sessionsRes?.data || []);
      setInstallments(instRes?.data || []);
      setFlexiBalance(flexiRes?.data || null);
      setInvoices(invRes?.data || []);
      setPayments(payRes?.data || []);
      setStatus(statusRes?.data || null);
    } catch (err) {
      setError(errMsg(err, 'Failed to load fee data for this student.'));
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Deep-link support: /fee-overview?action=enroll or ?action=collect, used by the
  // compact widget on the Student Detail page so "enroll" and "collect payment"
  // are always one click away instead of buried behind extra navigation.
  useEffect(() => {
    if (loading) return;
    const action = searchParams.get('action');
    if (!action) return;
    if (action === 'enroll') setShowEnroll(true);
    if (action === 'collect') setShowCollect(true);
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  }, [loading, searchParams, setSearchParams]);

  const displayName = student?.fullName || [student?.firstName, student?.lastName].filter(Boolean).join(' ') || 'Student';
  const admissionNo = student?.admissionNo || student?.admissionNumber || '—';

  const enrolledClassIds = useMemo(() => new Set(enrollments.filter((e) => e.status === 'Active').map((e) => e.classId?._id || e.classId)), [enrollments]);
  const availableClasses = useMemo(() => classes.filter((c) => c.status === 'Active' && !enrolledClassIds.has(c._id || c.id)), [classes, enrolledClassIds]);
  const flexiClasses = useMemo(() => classes.filter((c) => c.isPrepaidHoursCard && c.status === 'Active'), [classes]);

  const defaultEnrollClassId = useMemo(() => {
    if (!student?.classIds?.length) {
      const first = availableClasses[0];
      return first ? (first._id || first.id) : '';
    }
    const match = availableClasses.find((c) => student.classIds.includes(c._id || c.id));
    return match ? (match._id || match.id) : (availableClasses[0] ? (availableClasses[0]._id || availableClasses[0].id) : '');
  }, [student, availableClasses]);

  // Every payable item carries its className so dues and the collect-payment
  // modal can be grouped/labelled per program instead of a flat bill list.
  const payableItems = useMemo(() => {
    const items = [];
    installments.filter((i) => Number(i.netDue) > 0 && !['CANCELLED', 'WAIVED'].includes(i.status)).forEach((i) => {
      items.push({ key: `INSTALLMENT:${i._id}`, billType: 'INSTALLMENT', billId: i._id, max: Number(i.netDue), label: i.label, subLabel: i.installmentNo, className: i.className || 'Other' });
    });
    (flexiBalance?.purchases || []).filter((p) => Number(p.amountDue) > 0).forEach((p) => {
      items.push({ key: `FLEXI_CARD:${p._id}`, billType: 'FLEXI_CARD', billId: p._id, max: Number(p.amountDue), label: p.className || 'Flexi Card', subLabel: p.purchaseNo, className: p.className || 'Flexi Card' });
    });
    return items;
  }, [installments, flexiBalance]);

  // Resolve a payment allocation's billId back to a human class name, so the
  // Payments tab can say *which program* a receipt was collected for instead
  // of just showing an opaque bill number.
  const billClassLookup = useMemo(() => {
    const map = {};
    installments.forEach((i) => { map[`INSTALLMENT:${i._id}`] = i.className; });
    (flexiBalance?.purchases || []).forEach((p) => { map[`FLEXI_CARD:${p._id}`] = p.className; });
    return map;
  }, [installments, flexiBalance]);

  const duesByClass = useMemo(() => {
    const groups = groupByClass(payableItems);
    return groups.map((g) => ({ className: g.className, total: g.items.reduce((s, it) => s + it.max, 0), count: g.items.length }));
  }, [payableItems]);

  const totalPaidTillDate = useMemo(() => payments.reduce((s, p) => s + Number(p.amount || 0), 0), [payments]);
  const grandTotalDue = status?.grandTotalDue ?? payableItems.reduce((s, i) => s + i.max, 0);
  const activePrograms = enrollments.filter((e) => e.status === 'Active').length;

  const openCollectFor = (key) => { setPreselectKey(key); setShowCollect(true); };

  const handleActionSuccess = (message) => {
    setShowCollect(false); setShowEnroll(false); setShowFlexiPurchase(false); setAdjustTarget(null); setEditPaymentTarget(null);
    setPromoteTarget(null); setMarkLeftTarget(null); setAddHoursTarget(null);
    notify('success', message);
    loadAll();
  };
  const handleActionError = (message) => notify('error', message);

  const sessionName = (id) => academicSessions.find((s) => s._id === (id?._id || id))?.name || null;

  const doGenerateInvoice = async () => {
    setBusy(true);
    try {
      const res = await feeService.generateInvoice(studentId);
      notify('success', res?.message || 'Invoice generated.');
      loadAll();
    } catch (err) {
      notify('error', errMsg(err, 'Failed to generate invoice.'));
    } finally {
      setBusy(false);
    }
  };

  const doCancelEnrollment = async () => {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      await feeService.cancelEnrollment(cancelTarget._id);
      notify('success', 'Enrollment cancelled.');
      setCancelTarget(null);
      loadAll();
    } catch (err) {
      notify('error', errMsg(err, 'Failed to cancel enrollment.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-slate-500">
        <Loader2 size={18} className="animate-spin" /> Loading fee hub…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 sm:pb-16">
      <FeeToast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft size={15} /> Back
          </button>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-lg font-extrabold text-white shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl sm:text-2xl font-extrabold text-slate-900">{displayName}</h1>
                <p className="text-xs font-semibold text-slate-500">Admission No: {admissionNo} · Fee Hub</p>
              </div>
            </div>
            <div className="hidden sm:flex gap-2">
              <button onClick={loadAll} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                <RefreshCw size={14} /> Refresh
              </button>
              <button onClick={() => setShowEnroll(true)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-900 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-50">
                <GraduationCap size={15} /> Enroll in Class
              </button>
              <button onClick={() => openCollectFor(null)} disabled={payableItems.length === 0} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-primary disabled:opacity-40">
                <BadgeIndianRupee size={15} /> Collect Payment
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <div className="flex gap-1 border-t border-slate-100 pt-1">
            {TABS.map((t) => (
              <button
                key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3.5 py-3 text-sm font-semibold transition ${tab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur">
        <button onClick={() => setShowEnroll(true)} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-900 bg-white px-3 py-2.5 text-xs font-bold text-slate-900">
          <GraduationCap size={14} /> Enroll
        </button>
        <button onClick={() => openCollectFor(null)} disabled={payableItems.length === 0} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 disabled:opacity-40">
          <BadgeIndianRupee size={14} /> Collect Payment
        </button>
        <button onClick={loadAll} className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-2.5 text-slate-600">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertTriangle size={16} /> {error}</div>
        )}
        {classesError && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="flex items-center gap-2"><AlertTriangle size={16} /> {classesError}</span>
            <button onClick={loadAll} className="whitespace-nowrap rounded-full bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">Retry</button>
          </div>
        )}

        {/* KPI row — always visible */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={AlertTriangle} label="Grand Total Due" value={money(grandTotalDue)} tone="rose" sub={duesByClass.length ? `${duesByClass.length} class${duesByClass.length > 1 ? 'es' : ''} pending` : 'All settled'} />
          <StatCard icon={GraduationCap} label="Active Programs" value={activePrograms} tone="blue" />
          <StatCard icon={Zap} label="Flexi Hours Left" value={`${flexiBalance?.activeHoursRemaining || 0} hrs`} tone="amber" />
          <StatCard icon={CheckCircle2} label="Total Paid Till Date" value={money(totalPaidTillDate)} tone="emerald" />
        </div>

        {status?.carriedOverDue > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0" />
            Carried over from previous session: {money(status.carriedOverDue)}
          </div>
        )}

        {/* Dues by class — quick, unambiguous strip of what's owed and where */}
        {duesByClass.length > 0 && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/60 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-700">
              <AlertTriangle size={14} /> Dues by Class
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {duesByClass.map((g) => (
                <div key={g.className} className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{g.className}</p>
                    <p className="text-xs text-slate-400">{g.count} bill{g.count > 1 ? 's' : ''} pending</p>
                  </div>
                  <span className="shrink-0 text-sm font-extrabold text-rose-600">{money(g.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─────────── Overview ─────────── */}
        {tab === 'overview' && (
          <div className="space-y-5">
            {(status?.programs || []).length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <GraduationCap size={26} className="text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No fee programs yet</p>
                <p className="max-w-sm text-xs text-slate-400">Enroll {displayName} in a class to auto-generate their installments, one-time fee, or free hours plan.</p>
                <button onClick={() => setShowEnroll(true)} className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800">
                  <Plus size={15} /> Enroll in Class
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {status.programs.map((p) => {
                  const meta = feeTypeMetaFor(p);
                  const firstPendingNo = p.installmentsPending?.[0]?.installmentNo;
                  const matchedInstallment = firstPendingNo ? installments.find((i) => i.installmentNo === firstPendingNo) : null;
                  return (
                    <div key={p.classId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{p.className}</p>
                          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.bg} ${meta.color}`}>
                            <meta.icon size={11} /> {meta.label}
                          </span>
                        </div>
                        <p className={`text-lg font-extrabold ${p.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{money(p.totalDue)}</p>
                      </div>
                      {(p.installmentsPending || []).length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                          {p.installmentsPending.map((ins) => (
                            <div key={ins.installmentNo} className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">{ins.label} <span className="text-slate-400">· due {fmtDate(ins.dueDate)}</span></span>
                              <span className="font-semibold text-slate-800">{money(ins.netDue)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {p.totalDue === 0 ? (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 size={13} /> Fully paid</p>
                      ) : (
                        <button
                          onClick={() => openCollectFor(matchedInstallment ? `INSTALLMENT:${matchedInstallment._id}` : null)}
                          className="mt-3 w-full rounded-xl bg-primary py-2 text-xs font-bold text-white hover:bg-primary"
                        >
                          Pay Now — {money(p.totalDue)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─────────── Installments ─────────── */}
        {tab === 'installments' && (
          <SectionCard title="Installments" subtitle="All installment & one-time fee bills across enrolled classes" icon={Receipt}>
            {installments.length === 0 ? <EmptyRow text="No installments generated yet." icon={Receipt} /> : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block overflow-x-auto -mx-5">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-2.5 font-bold">Bill</th>
                        <th className="px-5 py-2.5 font-bold">Class</th>
                        <th className="px-5 py-2.5 font-bold">Amount</th>
                        <th className="px-5 py-2.5 font-bold">Paid</th>
                        <th className="px-5 py-2.5 font-bold">Net Due</th>
                        <th className="px-5 py-2.5 font-bold">Due Date</th>
                        <th className="px-5 py-2.5 font-bold">Status</th>
                        <th className="px-5 py-2.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {installments.map((i) => (
                        <tr key={i._id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-900">{i.label}</p>
                            <p className="text-xs text-slate-400">{i.installmentNo}</p>
                            {i.adjustmentAmount ? <p className="text-[11px] font-semibold text-violet-600">Adj: {money(i.adjustmentAmount)} {i.adjustmentReason ? `— ${i.adjustmentReason}` : ''}</p> : null}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{i.className}</td>
                          <td className="px-5 py-3 font-medium text-slate-800">{money(i.amount)}</td>
                          <td className="px-5 py-3 text-emerald-600 font-medium">{money(i.amountPaid)}</td>
                          <td className="px-5 py-3 font-bold text-slate-900">{money(i.netDue)}</td>
                          <td className="px-5 py-3 text-slate-500">{fmtDate(i.dueDate)}</td>
                          <td className="px-5 py-3"><StatusPill status={i.status} /></td>
                          <td className="px-5 py-3">
                            <div className="flex justify-end gap-1.5">
                              {Number(i.netDue) > 0 && (
                                <button onClick={() => openCollectFor(`INSTALLMENT:${i._id}`)} className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary">Pay</button>
                              )}
                              <button onClick={() => setAdjustTarget(i)} className="rounded-full border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100" title="Adjust / Waive"><Pencil size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {installments.map((i) => (
                    <div key={i._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">{i.label}</p>
                          <p className="text-xs text-slate-400">{i.className} · {i.installmentNo}</p>
                        </div>
                        <StatusPill status={i.status} />
                      </div>
                      {i.adjustmentAmount ? <p className="mt-1 text-[11px] font-semibold text-violet-600">Adj: {money(i.adjustmentAmount)} {i.adjustmentReason ? `— ${i.adjustmentReason}` : ''}</p> : null}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div><p className="text-slate-400">Amount</p><p className="font-semibold text-slate-800">{money(i.amount)}</p></div>
                        <div><p className="text-slate-400">Paid</p><p className="font-semibold text-emerald-600">{money(i.amountPaid)}</p></div>
                        <div><p className="text-slate-400">Net Due</p><p className="font-bold text-slate-900">{money(i.netDue)}</p></div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                        <span className="text-slate-500 flex items-center gap-1"><Calendar size={12} /> {fmtDate(i.dueDate)}</span>
                        <div className="flex gap-1.5">
                          {Number(i.netDue) > 0 && (
                            <button onClick={() => openCollectFor(`INSTALLMENT:${i._id}`)} className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">Pay</button>
                          )}
                          <button onClick={() => setAdjustTarget(i)} className="rounded-full border border-slate-200 p-1.5 text-slate-500"><Pencil size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        )}

        {/* ─────────── Enrollments ─────────── */}
        {tab === 'enrollments' && (
          <SectionCard
            title="Enrollments" subtitle="Classes this student is enrolled in for fee purposes" icon={GraduationCap}
            action={<button onClick={() => setShowEnroll(true)} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"><Plus size={14} /> Enroll</button>}
          >
            {enrollments.length === 0 ? <EmptyRow text="Not enrolled in any class yet." icon={GraduationCap} /> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {enrollments.map((e) => {
                  const meta = feeTypeMetaFor(e);
                  const eClassId = e.classId?._id || e.classId;
                  const dueForClass = payableItems.filter((item) => item.billType === 'INSTALLMENT' && installments.find((i) => i._id === item.billId)?.classId === eClassId);
                  const dueAmount = dueForClass.reduce((s, item) => s + item.max, 0);
                  return (
                    <div key={e._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{e.className}</p>
                          <p className="text-xs text-slate-400">
                            {e.classCode}
                            {sessionName(e.sessionId) && <span className="ml-1.5 text-slate-300">· {sessionName(e.sessionId)}</span>}
                          </p>
                        </div>
                        <StatusPill status={e.status} />
                      </div>
                      <div className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.bg} ${meta.color}`}>
                        <meta.icon size={11} /> {meta.label}
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>Agreed Fee: <b className="text-slate-800">{money(e.agreedFee)}</b></span>
                        <span>Since {fmtDate(e.validFrom)}</span>
                      </div>
                      {dueAmount > 0 ? (
                        <button onClick={() => openCollectFor(dueForClass[0].key)} className="mt-3 w-full rounded-xl bg-primary py-2 text-xs font-bold text-white hover:bg-primary">
                          Pay Due — {money(dueAmount)}
                        </button>
                      ) : e.status === 'Active' && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><CheckCircle2 size={13} /> No dues pending</p>
                      )}
                      {e.status === 'Active' && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          {e.classType === 'FLEX_TIME' && (
                            <button onClick={() => setAddHoursTarget(e)} className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:underline">
                              <Clock size={12} /> Add hours
                            </button>
                          )}
                          <button onClick={() => setPromoteTarget(e)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            <TrendingUp size={12} /> Promote / next session
                          </button>
                          <button onClick={() => setMarkLeftTarget(e)} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
                            <UserX size={12} /> Mark left
                          </button>
                          <button onClick={() => setCancelTarget(e)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
                            <Ban size={12} /> Cancel enrollment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* ─────────── Flexi Card ─────────── */}
        {tab === 'flexi' && (
          <SectionCard
            title="Flexi Card" subtitle="Prepaid hours cards purchased for this student" icon={Zap}
            action={<button onClick={() => setShowFlexiPurchase(true)} className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"><Plus size={14} /> Purchase</button>}
          >
            <div className="mb-4 grid grid-cols-2 gap-3">
              <StatCard icon={Zap} label="Hours Remaining" value={`${flexiBalance?.activeHoursRemaining || 0} hrs`} tone="amber" />
              <StatCard icon={AlertTriangle} label="Amount Due" value={money(flexiBalance?.totalAmountDue)} tone="rose" />
            </div>
            {(flexiBalance?.purchases || []).length === 0 ? <EmptyRow text="No Flexi Card purchased yet." icon={Zap} /> : (
              <div className="space-y-2.5">
                {flexiBalance.purchases.map((p) => (
                  <div key={p._id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{p.className}</p>
                        <p className="text-xs text-slate-400">{p.purchaseNo} · {fmtDate(p.purchaseDate)}</p>
                      </div>
                      <StatusPill status={p.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                      <div><p className="text-slate-400">Hours Purchased</p><p className="font-bold text-slate-800">{p.hoursPurchased}</p></div>
                      <div><p className="text-slate-400">Consumed</p><p className="font-bold text-slate-800">{p.hoursConsumed}</p></div>
                      <div><p className="text-slate-400">Remaining</p><p className="font-bold text-emerald-600">{p.hoursRemaining}</p></div>
                      <div><p className="text-slate-400">Price</p><p className="font-bold text-slate-800">{money(p.price)}</p></div>
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                      <span className="text-slate-500">Paid {money(p.amountPaid)} of {money(p.price)}</span>
                      {Number(p.amountDue) > 0 ? (
                        <button onClick={() => openCollectFor(`FLEXI_CARD:${p._id}`)} className="rounded-full bg-primary px-3 py-1.5 font-bold text-white hover:bg-primary">Pay {money(p.amountDue)}</button>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600"><CheckCircle2 size={12} /> Fully paid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        )}

        {/* ─────────── Invoices ─────────── */}
        {tab === 'invoices' && (
          <SectionCard
            title="Invoices" subtitle="Monthly tuition / flexi-overage / late-fine invoices" icon={FileText}
            action={<button onClick={doGenerateInvoice} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"><Plus size={14} /> Generate Invoice</button>}
          >
            {invoices.length === 0 ? <EmptyRow text="No invoices generated for this student yet." icon={FileText} /> : (
              <>
                <div className="hidden sm:block overflow-x-auto -mx-5">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-2.5 font-bold">Invoice</th>
                        <th className="px-5 py-2.5 font-bold">Period</th>
                        <th className="px-5 py-2.5 font-bold">Total Due</th>
                        <th className="px-5 py-2.5 font-bold">Paid</th>
                        <th className="px-5 py-2.5 font-bold">Net Due</th>
                        <th className="px-5 py-2.5 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-slate-50/70">
                          <td className="px-5 py-3 font-semibold text-slate-900">{inv.invoiceNo}</td>
                          <td className="px-5 py-3 text-slate-600">{inv.billingMonth}/{inv.billingYear}</td>
                          <td className="px-5 py-3">{money(inv.totalDue)}</td>
                          <td className="px-5 py-3 text-emerald-600">{money(inv.amountPaid)}</td>
                          <td className="px-5 py-3 font-bold">{money(inv.netDue)}</td>
                          <td className="px-5 py-3"><StatusPill status={inv.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="sm:hidden space-y-3">
                  {invoices.map((inv) => (
                    <div key={inv._id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{inv.invoiceNo}</p>
                          <p className="text-xs text-slate-400">Period {inv.billingMonth}/{inv.billingYear}</p>
                        </div>
                        <StatusPill status={inv.status} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div><p className="text-slate-400">Total Due</p><p className="font-semibold text-slate-800">{money(inv.totalDue)}</p></div>
                        <div><p className="text-slate-400">Paid</p><p className="font-semibold text-emerald-600">{money(inv.amountPaid)}</p></div>
                        <div><p className="text-slate-400">Net Due</p><p className="font-bold text-slate-900">{money(inv.netDue)}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SectionCard>
        )}

        {/* ─────────── Payments ─────────── */}
        {tab === 'payments' && (
          <SectionCard title="Payment History" subtitle="Every receipt collected, with what class or program it settled" icon={Wallet}>
            {payments.length === 0 ? <EmptyRow text="No payments recorded yet." icon={Wallet} /> : (
              <div className="space-y-3">
                {payments.map((p) => {
                  const isOpen = expandedPaymentId === p._id;
                  const allocs = p.allocations || [];
                  // Class names touched by this receipt, de-duplicated, so the
                  // header line answers "what was this payment for" at a glance.
                  const classNames = [...new Set(allocs.map((a) => billClassLookup[`${a.billType}:${a.billId}`] || a.billNo))];
                  return (
                    <div key={p._id} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedPaymentId(isOpen ? null : p._id)}
                        className="flex w-full flex-wrap items-start justify-between gap-3 p-4 text-left hover:bg-slate-50/70"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                            {modeMeta(p.paymentMode).icon}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900">{p.receiptNo}</p>
                            <p className="truncate text-xs text-slate-500">
                              {classNames.length > 0 ? classNames.join(' · ') : 'General payment'}
                            </p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-400">
                              <span className="inline-flex items-center gap-1"><Clock size={11} /> {fmtDateTime(p.paymentDate)}</span>
                              <span className="inline-flex items-center gap-1"><User2 size={11} /> {p.collectedByName}</span>
                              <span>{modeMeta(p.paymentMode).label}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <p className="text-lg font-extrabold text-emerald-600">{money(p.amount)}</p>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditPaymentTarget(p); }}
                            title="Edit payment"
                            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <Pencil size={14} />
                          </button>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                          {allocs.length > 0 ? (
                            <div className="space-y-1.5">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Applied towards</p>
                              {allocs.map((a) => (
                                <div key={a._id || a.billId} className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-xs">
                                  <span className="flex items-center gap-1.5 text-slate-600 min-w-0">
                                    <span className="shrink-0">{a.billType === 'FLEXI_CARD' ? '⚡' : '📄'}</span>
                                    <span className="truncate">
                                      <b className="text-slate-800">{billClassLookup[`${a.billType}:${a.billId}`] || 'Bill'}</b> · {a.billNo}
                                    </span>
                                  </span>
                                  <span className="shrink-0 font-semibold text-slate-800">{money(a.amountUsed)}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No itemized allocation on this receipt.</p>
                          )}
                          {p.remarks && (
                            <p className="mt-2.5 flex items-start gap-1.5 text-xs italic text-slate-500">
                              <Info size={12} className="mt-0.5 shrink-0" /> "{p.remarks}"
                            </p>
                          )}
                          {(p.editHistory || []).length > 0 && (
                            <div className="mt-3 space-y-1.5 border-t border-slate-200 pt-2.5">
                              <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                <History size={12} /> Edit History
                              </p>
                              {[...p.editHistory].reverse().map((h, idx) => (
                                <div key={h._id || idx} className="rounded-xl bg-white px-3 py-2 text-xs">
                                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-400">
                                     <span className="inline-flex items-center gap-1"><User2 size={11} /> {h.editedBy?.name || h.editedByRole || 'Unknown'}{h.editedByRole ? ` (${h.editedByRole})` : ''}</span>
                                    <span className="inline-flex items-center gap-1"><Clock size={11} /> {fmtDateTime(h.editedAt)}</span>
                                  </div>
                                  <div className="mt-1 space-y-0.5">
                                    {(h.changedFields || []).map((field) => (
                                      <p key={field} className="text-slate-600">
                                        <span className="font-semibold text-slate-700">{PAYMENT_EDIT_FIELD_LABEL[field] || field}:</span>{' '}
                                        <span className="line-through text-slate-400">{fmtHistoryValue(field, h.beforeValues?.[field])}</span>
                                        {' → '}
                                        <span className="text-slate-800">{fmtHistoryValue(field, h.afterValues?.[field])}</span>
                                      </p>
                                    ))}
                                  </div>
                                  {h.note && <p className="mt-1 italic text-slate-500">"{h.note}"</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}
      </div>

      {/* Modals */}
      {showCollect && (
        <CollectPaymentModal
          studentId={studentId} payableItems={payableItems} preselectId={preselectKey}
          onClose={() => setShowCollect(false)} onSuccess={handleActionSuccess} onError={handleActionError}
        />
      )}
      {showEnroll && (
        <EnrollModal studentId={studentId} availableClasses={availableClasses} defaultClassId={defaultEnrollClassId} onClose={() => setShowEnroll(false)} onSuccess={handleActionSuccess} onError={handleActionError} />
      )}
      {showFlexiPurchase && (
        <FlexiPurchaseModal studentId={studentId} flexiClasses={flexiClasses} onClose={() => setShowFlexiPurchase(false)} onSuccess={handleActionSuccess} onError={handleActionError} />
      )}
      {adjustTarget && (
        <AdjustInstallmentModal installment={adjustTarget} onClose={() => setAdjustTarget(null)} onSuccess={handleActionSuccess} onError={handleActionError} />
      )}
      {editPaymentTarget && (
        <EditPaymentModal payment={editPaymentTarget} onClose={() => setEditPaymentTarget(null)} onSuccess={handleActionSuccess} onError={handleActionError} />
      )}
      {promoteTarget && (
        <PromoteModal
          studentId={studentId} enrollment={promoteTarget} classes={classes} academicSessions={academicSessions}
          onClose={() => setPromoteTarget(null)} onSuccess={handleActionSuccess} onError={handleActionError}
        />
      )}
      {markLeftTarget && (
        <MarkLeftModal enrollment={markLeftTarget} onClose={() => setMarkLeftTarget(null)} onSuccess={handleActionSuccess} onError={handleActionError} />
      )}
      {addHoursTarget && (
        <AddFlexiHoursModal
          studentId={studentId} enrollment={addHoursTarget}
          baseFee={classes.find((c) => (c._id || c.id) === (addHoursTarget.classId?._id || addHoursTarget.classId))?.baseFee || 0}
          onClose={() => setAddHoursTarget(null)} onSuccess={handleActionSuccess} onError={handleActionError}
        />
      )}
      <ConfirmDialog
        open={!!cancelTarget} title="Cancel this enrollment?"
        message={cancelTarget ? `This will cancel the student's enrollment in "${cancelTarget.className}". Pending installments will remain unless manually adjusted.` : ''}
        confirmLabel="Cancel Enrollment" danger loading={busy}
        onConfirm={doCancelEnrollment} onClose={() => setCancelTarget(null)}
      />
    </div>
  );
};

export default StudentFeeManagement;