import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Save, IndianRupee,
  Clock, CalendarDays, ShieldAlert, Zap,
} from 'lucide-react';
import feeService from '../../../services/feeService';

const EMPTY = {
  flexiHourlyRate: '',
  flexiGracePeriodMinutes: '',
  invoiceDueDay: '',
  lateFineAmount: '',
  autoInvoiceEnabled: true,
};

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} style={{ height: 18, width: 18 }} />
  </button>
);

const Field = ({ icon: Icon, label, help, children }) => (
  <div className="flex flex-col gap-2 border-b border-slate-100 py-5 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
    <div className="flex items-start gap-3 sm:max-w-sm">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={16} />
      </span>
      <div>
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{help}</p>
      </div>
    </div>
    <div className="sm:w-56 sm:shrink-0">{children}</div>
  </div>
);

const inputCls = 'w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50 disabled:text-slate-400';

const FeeSettingsPage = () => {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setSaved(false); };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await feeService.getSettings();
      const s = res?.data || {};
      setForm({
        flexiHourlyRate: s.flexiHourlyRate ?? 100,
        flexiGracePeriodMinutes: s.flexiGracePeriodMinutes ?? 15,
        invoiceDueDay: s.invoiceDueDay ?? 1,
        lateFineAmount: s.lateFineAmount ?? 100,
        autoInvoiceEnabled: s.autoInvoiceEnabled ?? true,
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to load fee settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await feeService.updateSettings({
        flexiHourlyRate: Number(form.flexiHourlyRate),
        flexiGracePeriodMinutes: Number(form.flexiGracePeriodMinutes),
        invoiceDueDay: Number(form.invoiceDueDay),
        lateFineAmount: Number(form.lateFineAmount),
        autoInvoiceEnabled: !!form.autoInvoiceEnabled,
      });
      setSaved(true);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Failed to save fee settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <Link to="/admin/fee-hub" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">
            <ArrowLeft size={14} /> Back to Fee Hub
          </Link>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Fee Module</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Fee Settings</h1>
          <p className="mt-1 text-sm text-slate-500">These apply school-wide — every student's Flexi Card deduction, invoice due date and late fine uses these values.</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle size={16} /> {error}
          </div>
        )}
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={16} /> Settings saved.
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" /> Loading settings…
          </div>
        ) : (
          <form onSubmit={handleSave} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <Field
              icon={IndianRupee}
              label="Flexi hourly rate"
              help="Charged per hour when a student's Flexi Card balance goes negative."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                <input
                  type="number" min="0" step="1" required disabled={saving}
                  value={form.flexiHourlyRate}
                  onChange={(e) => set('flexiHourlyRate', e.target.value)}
                  className={`${inputCls} pl-7`}
                />
              </div>
            </Field>

            <Field
              icon={Clock}
              label="Flexi grace period"
              help="Minutes a student can go over their booked hours before deduction starts."
            >
              <div className="relative">
                <input
                  type="number" min="0" step="1" required disabled={saving}
                  value={form.flexiGracePeriodMinutes}
                  onChange={(e) => set('flexiGracePeriodMinutes', e.target.value)}
                  className={`${inputCls} pr-16`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">minutes</span>
              </div>
            </Field>

            <Field
              icon={CalendarDays}
              label="Invoice due day"
              help="Day of the month monthly invoices are due (1–28)."
            >
              <input
                type="number" min="1" max="28" step="1" required disabled={saving}
                value={form.invoiceDueDay}
                onChange={(e) => set('invoiceDueDay', e.target.value)}
                className={inputCls}
              />
            </Field>

            <Field
              icon={ShieldAlert}
              label="Late fine amount"
              help="Flat fine added to an invoice once it's overdue."
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                <input
                  type="number" min="0" step="1" required disabled={saving}
                  value={form.lateFineAmount}
                  onChange={(e) => set('lateFineAmount', e.target.value)}
                  className={`${inputCls} pl-7`}
                />
              </div>
            </Field>

            <Field
              icon={Zap}
              label="Auto-generate invoices"
              help="Automatically create next month's invoices on the 1st for every enrolled student."
            >
              <div className="flex items-center gap-2 sm:justify-end">
                <Toggle checked={form.autoInvoiceEnabled} onChange={(v) => set('autoInvoiceEnabled', v)} disabled={saving} />
                <span className="text-xs font-bold text-slate-500">{form.autoInvoiceEnabled ? 'On' : 'Off'}</span>
              </div>
            </Field>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeeSettingsPage;
