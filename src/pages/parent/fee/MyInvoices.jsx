import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import {
  GraduationCap, Zap, Receipt, CheckCircle2, Loader2,
  BadgeIndianRupee, FileText, Wallet, TrendingUp, Info, CalendarClock,
  Download, X, Clock, AlertTriangle
} from 'lucide-react';
import feeService from '../../../services/feeService';
import { getMyChildrenAPI } from '../../../api/students';
import { downloadPDFDocumentNode, A4_WIDTH, A4_HEIGHT } from '../../../utils/certificateDownload';
import logo from '../../../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';
import talentGymLogo from '../../../assets/optimized/logo/brain-builder-logo-talengym.webp';

/* ---------------------------------- helpers ---------------------------------- */

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatMonthYear = (month, year) => (!month || !year ? 'N/A' : `${MONTHS[(month - 1) % 12]} ${year}`);
const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};
const daysUntil = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return Math.ceil((date.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);
};

const STATUS_STYLE = {
  PAID: { text: '#1F7A4D', bg: '#E8F3EC', label: 'Paid' },
  UNPAID: { text: '#B5451B', bg: '#FBEDE7', label: 'Unpaid' },
  PARTIAL: { text: '#33448E', bg: '#EAEDF7', label: 'Partial' },
  WAIVED: { text: '#8A6D1F', bg: '#F6F0DF', label: 'Waived' },
};
const getStatus = (status) => STATUS_STYLE[status] || { ...STATUS_STYLE.UNPAID, label: status || 'Pending' };

const buildReceiptHtml = (invoice) => {
  const rows = [];
  (invoice.tuitionLines || []).forEach((line) => rows.push([line.className || line.description || 'Tuition fee', line.agreedFee || line.amount || 0]));
  if (Number(invoice.flexiCharge) > 0) rows.push([`Flexi hours (${Number(invoice.flexiNegativeHours || 0).toFixed(2)}h × ${formatCurrency(invoice.flexiChargeRate || 0)})`, invoice.flexiCharge]);
  if (Number(invoice.lateFine) > 0) rows.push(['Late fine', invoice.lateFine]);
  if (Number(invoice.adjustmentAmount) !== 0) rows.push([`Adjustment${invoice.adjustmentReason ? ` — ${invoice.adjustmentReason}` : ''}`, invoice.adjustmentAmount]);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt ${invoice.invoiceNo}</title>
  <style>body{font-family:Arial,sans-serif;padding:24px;color:#1C2430;}h1{font-size:22px;margin-bottom:4px;}.meta{color:#64707D;font-size:13px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;margin-top:12px;}td,th{padding:10px;border:1px solid #E2E5E0;text-align:left;font-size:14px;}th{background:#F5F6F2;font-weight:700;}.total-row td{font-weight:700;background:#F5F6F2;}</style></head><body>
  <h1>Receipt #${invoice.invoiceNo || 'N/A'}</h1>
  <p class="meta">${invoice.studentName || ''} ${invoice.studentAdmNo ? `(${invoice.studentAdmNo})` : ''} · ${formatMonthYear(invoice.billingMonth, invoice.billingYear)} · Status: ${invoice.status || 'N/A'} · Due: ${formatDate(invoice.dueDate)}</p>
  <table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody>
    ${rows.length ? rows.map(([label, amt]) => `<tr><td>${label}</td><td>${formatCurrency(amt)}</td></tr>`).join('') : `<tr><td>No monthly tuition charges this period</td><td>${formatCurrency(0)}</td></tr>`}
    <tr><td>Wallet used</td><td>-${formatCurrency(invoice.walletAmountUsed || 0)}</td></tr>
    <tr class="total-row"><td>Net due</td><td>${formatCurrency(invoice.netDue ?? invoice.totalDue ?? 0)}</td></tr>
  </tbody></table>
  <p style="margin-top:20px;font-size:12px;color:#64707D;">Generated on ${formatDate(new Date())}</p></body></html>`;
};

const downloadReceipt = (invoice) => {
  const blob = new Blob([buildReceiptHtml(invoice)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `receipt-${invoice.invoiceNo || 'invoice'}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/* --------------------------------- sub components ------------------------------ */

const StatCard = ({ icon: Icon, label, value, accent, sub }) => (
  <div className="flex-1 rounded-2xl border border-[#E2E5E0] bg-white px-5 py-4 min-w-[150px]">
    <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#8891A0]"><Icon size={12} /> {label}</p>
    <p className="mt-1.5 font-mono text-xl font-semibold break-words" style={{ color: accent }}>{value}</p>
    {sub && <p className="mt-0.5 text-[11px] font-medium text-[#8891A0]">{sub}</p>}
  </div>
);

/** Paid-vs-due progress bar — the single clearest answer to "kitna kiya, kitna
 *  baaki" for a parent: total ever paid (from the wallet ledger) against
 *  what's currently outstanding across every program. */
const PaidVsDueBar = ({ totalPaid, totalDue }) => {
  const grandTotal = totalPaid + totalDue;
  const paidPct = grandTotal > 0 ? Math.round((totalPaid / grandTotal) * 100) : (totalDue === 0 ? 100 : 0);
  return (
    <div className="rounded-2xl border border-[#E2E5E0] bg-white p-5">
      <div className="flex items-center justify-between text-xs font-semibold text-[#64707D]">
        <span className="flex items-center gap-1.5"><TrendingUp size={13} /> Fee progress</span>
        <span>{paidPct}% paid</span>
      </div>
      <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-[#F5F6F2]">
        <div className="h-full rounded-full bg-[#1F7A4D] transition-all" style={{ width: `${Math.min(100, paidPct)}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-1.5 text-[#1C2430]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1F7A4D]" /> Paid till date
          <b className="font-mono">{formatCurrency(totalPaid)}</b>
        </span>
        <span className="flex items-center gap-1.5 text-[#1C2430]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#B5451B]" /> Still due
          <b className="font-mono">{formatCurrency(totalDue)}</b>
        </span>
      </div>
    </div>
  );
};

/** Every installment shown with its full arithmetic — original amount,
 *  any discount/adjustment, what's been paid on it, and what's left — so
 *  a parent never has to guess how a "net due" figure was reached. */
const InstallmentRow = ({ ins }) => {
  const s = getStatus(ins.status);
  const original = Number(ins.amount || 0);
  const adjustment = Number(ins.adjustmentAmount || 0);
  const payable = original - adjustment;
  const paid = Number(ins.amountPaid || 0);
  const due = Number(ins.netDue || 0);
  const pct = payable > 0 ? Math.min(100, Math.round((paid / payable) * 100)) : 100;
  const overdueDays = daysUntil(ins.dueDate);
  const isOverdue = overdueDays !== null && overdueDays < 0 && due > 0;

  return (
    <div className={`rounded-xl border p-4 ${isOverdue ? 'border-rose-200 bg-rose-50/40' : 'border-transparent bg-[#F5F6F2]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1C2430]">{ins.label}</p>
          <p className="text-xs text-[#8891A0]">{ins.className} · {ins.installmentNo}</p>
        </div>
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase" style={{ color: s.text, background: s.bg }}>{s.label}</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-[#33448E] transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs sm:grid-cols-4">
        <div>
          <p className="text-[#8891A0]">Total amount</p>
          <p className="mt-0.5 font-mono font-semibold text-[#1C2430]">{formatCurrency(original)}</p>
        </div>
        {adjustment !== 0 && (
          <div>
            <p className="text-[#8891A0]">Adjustment</p>
            <p className="mt-0.5 font-mono font-semibold text-[#8A6D1F]">-{formatCurrency(adjustment)}</p>
          </div>
        )}
        <div>
          <p className="text-[#8891A0]">Paid so far</p>
          <p className="mt-0.5 font-mono font-semibold text-[#1F7A4D]">{formatCurrency(paid)}</p>
        </div>
        <div>
          <p className="text-[#8891A0]">Balance due</p>
          <p className="mt-0.5 font-mono font-bold text-[#B5451B]">{formatCurrency(due)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-[#E2E5E0] pt-2.5 text-[11px] text-[#8891A0]">
        <CalendarClock size={12} />
        {due === 0 ? 'Settled' : isOverdue ? <span className="font-semibold text-rose-600">Overdue by {Math.abs(overdueDays)} day{Math.abs(overdueDays) === 1 ? '' : 's'} · was due {formatDate(ins.dueDate)}</span> : `Due ${formatDate(ins.dueDate)}${overdueDays !== null ? ` · in ${overdueDays} day${overdueDays === 1 ? '' : 's'}` : ''}`}
      </div>
    </div>
  );
};

const InvoiceCard = ({ invoice }) => {
  const [open, setOpen] = useState(false);
  const status = getStatus(invoice.status);
  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && !['PAID', 'CANCELLED', 'WAIVED'].includes(invoice.status);
  const hasCharges = Number(invoice.totalDue) > 0 || (invoice.tuitionLines || []).length > 0;

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white ${isOverdue ? 'border-rose-300 ring-1 ring-rose-100' : 'border-[#E2E5E0]'}`}>
      <div className="px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-[#E2E5E0] pb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8891A0]">Monthly Tuition Invoice {isOverdue && <span className="ml-1 text-rose-600">· Overdue</span>}</p>
            <h2 className="mt-1 font-mono text-lg font-semibold text-[#1C2430]">{invoice.invoiceNo || 'N/A'}</h2>
            <p className="mt-1 text-xs text-[#64707D]">{formatMonthYear(invoice.billingMonth, invoice.billingYear)} · Due {formatDate(invoice.dueDate)}</p>
          </div>
          <span className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold uppercase" style={{ color: status.text, background: status.bg }}>{status.label}</span>
        </div>

        {!hasCharges ? (
          <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-[#F5F6F2] px-3 py-2.5 text-xs text-[#64707D]">
            <Info size={13} className="mt-0.5 shrink-0" />
            No monthly tuition charges for this period — this student's fees for this month come from installments or one-time fees, shown separately above, not from this monthly invoice.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-[11px] uppercase tracking-wide text-[#8891A0]">Total due</p><p className="mt-1 font-mono text-sm font-semibold text-[#1C2430]">{formatCurrency(invoice.totalDue)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-[#8891A0]">Wallet used</p><p className="mt-1 font-mono text-sm font-semibold text-[#1C2430]">{formatCurrency(invoice.walletAmountUsed)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-[#8891A0]">Paid</p><p className="mt-1 font-mono text-sm font-semibold text-[#1F7A4D]">{formatCurrency(invoice.amountPaid)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-[#8891A0]">Net due</p><p className="mt-1 font-mono text-sm font-bold" style={{ color: status.text }}>{formatCurrency(invoice.netDue)}</p></div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => downloadReceipt(invoice)} className="rounded-full bg-[#1C2430] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#33448E]">Download receipt</button>
          {(invoice.tuitionLines || []).length > 0 && (
            <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-full border border-[#E2E5E0] px-4 py-2 text-xs font-semibold text-[#1C2430] transition hover:bg-[#F5F6F2]">{open ? 'Hide details' : 'View details'}</button>
          )}
        </div>

        {open && (
          <div className="mt-3 space-y-1.5 border-t border-dashed border-[#E2E5E0] pt-3">
            {invoice.tuitionLines.map((line, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[#64707D]">{line.className || line.description}</span>
                <span className="font-mono font-semibold text-[#1C2430]">{formatCurrency(line.agreedFee || line.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ icon, title, desc }) => (
  <div className="rounded-2xl border border-dashed border-[#D8DCE1] bg-white px-6 py-10 text-center">
    <p className="text-2xl mb-2">{icon}</p>
    <p className="text-sm font-semibold text-[#1C2430]">{title}</p>
    <p className="mt-1 text-xs text-[#8891A0]">{desc}</p>
  </div>
);

const Section = ({ icon: Icon, title, subtitle, children }) => (
  <div className="rounded-2xl border border-[#E2E5E0] bg-white p-5">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1C2430] text-white"><Icon size={13} /></div>
      <div>
        <h3 className="text-sm font-bold text-[#1C2430]">{title}</h3>
        {subtitle && <p className="text-[11px] text-[#8891A0]">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

/* --------------------------- Fee Receipt (per-class PDF) ------------------------ */
/* Same "what you see is exactly what downloads" pattern used by the
 * Documents module (Leaving/Experience certificates) — a fixed A4 node
 * captured with html2canvas via downloadPDFDocumentNode. Kept deliberately
 * free of SVG gradients / box-shadows (known html2canvas pain points in
 * this codebase — see CertificateStudio/BirthdayPosterStudio fixes). */

const RECEIPT_NAVY = '#1e3a5f';
const RECEIPT_GOLD = '#C9A24B';
const RECEIPT_MUTED = '#6b7280';
const RECEIPT_RULE = '#e2e5e0';

const FeeReceiptDocument = forwardRef(function FeeReceiptDocument({ group, student }, ref) {
  const lines = group?.lines || [];
  const total = group?.total || 0;
  const generatedOn = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div
      ref={ref}
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        background: '#ffffff',
        boxSizing: 'border-box',
        fontFamily: '"Poppins", "Segoe UI", sans-serif',
        color: '#1f2937',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '32px 44px 20px', borderBottom: `3px solid ${RECEIPT_NAVY}` }}>
        <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 56, height: 56, objectFit: 'contain', display: 'block' }} />
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: RECEIPT_NAVY }}>Brain Builder International Pre School</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: RECEIPT_MUTED }}>brainbuilder.in · Fee Receipt</p>
        </div>
        <div style={{ textAlign: 'right', marginRight: 4 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: 1, color: RECEIPT_GOLD, textTransform: 'uppercase' }}>Fee Receipt</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: RECEIPT_MUTED }}>Generated {generatedOn}</p>
        </div>
        <img src={talentGymLogo} alt="" crossOrigin="anonymous" style={{ width: 52, height: 52, objectFit: 'contain', display: 'block' }} />
      </div>

      {/* Student / class info */}
      <div style={{ padding: '20px 44px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: RECEIPT_MUTED }}>Student</p>
          <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600 }}>{student?.fullName || student?.name || '—'}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: RECEIPT_MUTED }}>Admission No.</p>
          <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600 }}>{student?.admissionNo || '—'}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: RECEIPT_MUTED }}>Receipt For</p>
          <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: RECEIPT_NAVY }}>{group?.className || 'General'}</p>
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: RECEIPT_MUTED }}>Transactions</p>
          <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600 }}>{lines.length}</p>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '22px 44px 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Receipt No.', 'Date', 'Mode', 'Amount'].map((h, i) => (
                <th key={h} style={{
                  textAlign: i === 4 ? 'right' : 'left', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5,
                  color: '#ffffff', background: RECEIPT_NAVY, padding: '10px 12px',
                  borderTopLeftRadius: i === 0 ? 6 : 0, borderTopRightRadius: i === 4 ? 6 : 0,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '16px 12px', fontSize: 13, color: RECEIPT_MUTED, textAlign: 'center' }}>No transactions recorded.</td></tr>
            ) : lines.map((l, i) => (
              <React.Fragment key={`${l.receiptNo}-${i}`}>
                <tr style={{ background: i % 2 === 0 ? '#F7F8F6' : '#ffffff' }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: l.remarks ? 'none' : `1px solid ${RECEIPT_RULE}` }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', borderBottom: l.remarks ? 'none' : `1px solid ${RECEIPT_RULE}` }}>{l.receiptNo}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, borderBottom: l.remarks ? 'none' : `1px solid ${RECEIPT_RULE}` }}>{formatDate(l.paymentDate)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, textTransform: 'capitalize', borderBottom: l.remarks ? 'none' : `1px solid ${RECEIPT_RULE}` }}>{(l.paymentMode || '').replace('_', ' ')}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, textAlign: 'right', borderBottom: l.remarks ? 'none' : `1px solid ${RECEIPT_RULE}` }}>{formatCurrency(l.amountUsed)}</td>
                </tr>
                {l.remarks && (
                  <tr style={{ background: i % 2 === 0 ? '#F7F8F6' : '#ffffff' }}>
                    <td colSpan={5} style={{ padding: '0 12px 10px 12px', fontSize: 11.5, fontStyle: 'italic', color: RECEIPT_MUTED, borderBottom: `1px solid ${RECEIPT_RULE}` }}>
                      Remark: "{l.remarks}"
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <div style={{ minWidth: 260, background: '#F5F6F2', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: RECEIPT_NAVY }}>Total Paid</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: RECEIPT_NAVY }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', left: 44, right: 44, bottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: `1px dashed ${RECEIPT_RULE}`, paddingTop: 14 }}>
        <p style={{ margin: 0, fontSize: 10, color: RECEIPT_MUTED, maxWidth: 320 }}>
          This is a system-generated receipt and does not require a physical signature. For any query, please contact the school office.
        </p>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 26px', fontSize: 11, color: RECEIPT_MUTED }}>Authorized Signatory</p>
          <div style={{ width: 140, borderTop: `1px solid ${RECEIPT_MUTED}` }} />
        </div>
      </div>
    </div>
  );
});

const FeeReceiptModal = ({ group, student, onClose }) => {
  const nodeRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const namePart = (student?.fullName || student?.name || 'student').replace(/\s+/g, '_');
      const classPart = (group?.className || 'general').replace(/\s+/g, '_');
      await downloadPDFDocumentNode(nodeRef.current, `receipt-${classPart}-${namePart}`, { width: A4_WIDTH, height: A4_HEIGHT });
    } catch (err) {
      setError(err.message || 'PDF download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <style>{`
        .receipt-preview { zoom: 1; transform-origin: top center; }
        @media (max-width: 850px) { .receipt-preview { zoom: 0.8; } }
        @media (max-width: 650px) { .receipt-preview { zoom: 0.6; } }
        @media (max-width: 480px) { .receipt-preview { zoom: 0.42; } }
      `}</style>
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E2E5E0] px-5 py-4">
          <h3 className="text-sm font-bold text-[#1C2430]">{group?.className} Receipt</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-auto bg-[#f0f0f0] p-4 sm:p-8 flex justify-center items-start">
          <div className="receipt-preview shadow-sm" style={{ width: A4_WIDTH, backgroundColor: 'white' }}>
            <FeeReceiptDocument ref={nodeRef} group={group} student={student} />
          </div>
        </div>

        <div className="border-t border-[#E2E5E0] bg-white px-5 py-4">
          {error && <p className="mb-3 text-xs font-medium text-rose-600">{error}</p>}
          <button
            type="button" onClick={handleDownload} disabled={downloading}
            className="flex w-full sm:w-auto sm:ml-auto items-center justify-center gap-2 rounded-full bg-[#1C2430] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#33448E] disabled:opacity-50"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Preparing PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};


/* ------------------------------------- main -------------------------------------- */

const MyInvoices = () => {
  const [children, setChildren] = useState([]);
  const [statusByChild, setStatusByChild] = useState({});
  const [walletByChild, setWalletByChild] = useState({});
  const [installments, setInstallments] = useState([]);
  const [flexiCards, setFlexiCards] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChildId, setActiveChildId] = useState(null);
  const [receiptGroup, setReceiptGroup] = useState(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [childrenRes, statusRes, walletRes, instRes, flexiRes, invRes, payRes] = await Promise.all([
          getMyChildrenAPI(),
          feeService.getMyStatus().catch(() => ({ data: [] })),
          feeService.getMyWallet().catch(() => ({ data: [] })),
          feeService.getMyInstallments().catch(() => ({ data: [] })),
          feeService.getMyFlexiCard().catch(() => ({ data: [] })),
          feeService.getMyInvoices().catch(() => ({ data: [] })),
          feeService.getMyPayments().catch(() => ({ data: [] })),
        ]);

        const childrenList = Array.isArray(childrenRes?.data) ? childrenRes.data : (Array.isArray(childrenRes) ? childrenRes : []);
        setChildren(childrenList);

        const statusList = Array.isArray(statusRes?.data) ? statusRes.data : [];
        const sMap = {};
        statusList.forEach((s) => { sMap[s.studentId] = s; });
        setStatusByChild(sMap);

        // Wallet.totalReceived is the one figure that reflects every rupee
        // ever collected for this student — including installments already
        // fully paid off, which the pending-only endpoints below omit.
        const walletList = Array.isArray(walletRes?.data) ? walletRes.data : [];
        const wMap = {};
        walletList.forEach((w) => { wMap[String(w.studentId)] = w; });
        setWalletByChild(wMap);

        setInstallments(Array.isArray(instRes?.data) ? instRes.data : []);
        setFlexiCards(Array.isArray(flexiRes?.data) ? flexiRes.data : []);
        setInvoices(Array.isArray(invRes?.data) ? invRes.data : []);
        setPayments(Array.isArray(payRes?.data) ? payRes.data : []);

        if (childrenList.length > 0) setActiveChildId(childrenList[0]._id || childrenList[0].id);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const visibleChildId = activeChildId || (children[0]?._id || children[0]?.id);
  const visibleChild = children.find((c) => (c._id || c.id) === visibleChildId) || null;

  const visibleInstallments = useMemo(
    () => installments.filter((i) => (i.studentId?._id || i.studentId) === visibleChildId || children.length <= 1),
    [installments, visibleChildId, children.length]
  );
  const visibleInvoices = useMemo(
    () => invoices.filter((inv) => (inv.studentId?._id || inv.studentId) === visibleChildId || children.length <= 1),
    [invoices, visibleChildId, children.length]
  );
  const visibleFlexi = useMemo(() => {
    if (children.length <= 1) return flexiCards[0] || null;
    return flexiCards.find((f) => (f.purchases || []).some((p) => (p.studentId?._id || p.studentId) === visibleChildId)) || null;
  }, [flexiCards, visibleChildId, children.length]);
  const visibleStatus = statusByChild[visibleChildId] || null;
  const visibleWallet = walletByChild[visibleChildId] || null;

  const visiblePayments = useMemo(
    () => payments.filter((p) => (p.studentId?._id || p.studentId) === visibleChildId || children.length <= 1),
    [payments, visibleChildId, children.length]
  );

  // Resolves an INSTALLMENT/FLEXI_CARD billId (from a payment's allocations)
  // back to the class it was collected for — same technique as the admin
  // Payments tab — so a receipt can say "which program" instead of an
  // opaque bill number.
  const billClassLookup = useMemo(() => {
    const map = {};
    installments.forEach((i) => { map[`INSTALLMENT:${i._id}`] = i.className; });
    flexiCards.forEach((f) => (f?.purchases || []).forEach((p) => { map[`FLEXI_CARD:${p._id}`] = p.className; }));
    return map;
  }, [installments, flexiCards]);

  // Every payment split into its per-class allocation lines, then grouped
  // by class — this is what powers the "download receipt" per class/program.
  const classReceiptGroups = useMemo(() => {
    const map = {};
    visiblePayments.forEach((p) => {
      const allocs = (p.allocations || []).length > 0
        ? p.allocations
        : [{ billType: null, billId: null, billNo: '', amountUsed: p.amount }];
      allocs.forEach((a) => {
        const key = !a.billType
          ? 'Advance / Unallocated'
          : a.billType === 'INVOICE'
            ? 'Monthly Tuition'
            : (billClassLookup[`${a.billType}:${a.billId}`] || a.billNo || 'General');
        if (!map[key]) map[key] = { className: key, total: 0, lines: [] };
        map[key].total += Number(a.amountUsed || 0);
        map[key].lines.push({
          receiptNo: p.receiptNo,
          paymentDate: p.paymentDate,
          paymentMode: p.paymentMode,
          amountUsed: Number(a.amountUsed || 0),
          remarks: p.remarks || '',
        });
      });
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [visiblePayments, billClassLookup]);

  const lastPayment = useMemo(() => {
    if (visiblePayments.length === 0) return null;
    return [...visiblePayments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0];
  }, [visiblePayments]);

  const hasMultipleChildren = children.length > 1;

  // Split pending bills into overdue vs upcoming so the most urgent items
  // surface first — a flat chronological list buries what needs attention.
  const { overdueInstallments, upcomingInstallments } = useMemo(() => {
    const overdue = [];
    const upcoming = [];
    visibleInstallments.forEach((ins) => {
      const d = daysUntil(ins.dueDate);
      if (d !== null && d < 0 && Number(ins.netDue) > 0) overdue.push(ins);
      else upcoming.push(ins);
    });
    return { overdueInstallments: overdue, upcomingInstallments: upcoming };
  }, [visibleInstallments]);

  const advanceBalance = useMemo(() => {
    if (!visibleWallet) return 0;
    return Math.max(0, Number(visibleWallet.totalReceived || 0) - Number(visibleWallet.totalSettled || 0));
  }, [visibleWallet]);

  const nextDueItem = useMemo(() => {
    const allDues = [...overdueInstallments, ...upcomingInstallments].filter(i => Number(i.netDue) > 0);
    if (allDues.length === 0) return null;
    return allDues.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  }, [overdueInstallments, upcomingInstallments]);

  return (
    <div className="min-h-screen bg-[#F5F6F2] px-4 py-8 sm:px-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .font-mono { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
      `}</style>

      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#8891A0]">Parent portal</p>
          <h1 className="mt-1 text-3xl font-bold text-[#1C2430]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>My Fees</h1>
          <p className="mt-1 text-sm text-[#64707D]">Installments, Flexi Card balance, and invoices for your child.</p>
          <p className="mt-2 inline-block rounded-full bg-[#FFF7ED] px-4 py-2 text-xs font-semibold text-[#92400E]">Online payment is not available here. Please contact the school office to make payments.</p>
        </div>

        {hasMultipleChildren && (
          <div className="mb-6 flex flex-wrap gap-2">
            {children.map((child) => {
              const cid = child._id || child.id;
              const isActive = visibleChildId === cid;
              return (
                <button key={cid} type="button" onClick={() => setActiveChildId(cid)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? 'bg-[#1C2430] text-white shadow-lg' : 'bg-white text-[#64707D] hover:bg-slate-100'}`}>
                  {child.fullName || child.firstName || child.name || 'Child'}
                </button>
              );
            })}
          </div>
        )}

        {loading && <div className="flex items-center gap-2 rounded-2xl border border-[#E2E5E0] bg-white px-5 py-6 text-sm text-[#64707D]"><Loader2 size={15} className="animate-spin" /> Loading fee details…</div>}

        {!loading && error && (
          <div className="rounded-2xl border border-[#F0C9B8] bg-[#FBEDE7] px-5 py-4 text-sm font-medium text-[#B5451B]">
            <p className="font-semibold">We could not load your fee details right now.</p>
            <p className="mt-1 text-[#8B3F1F]">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-5">
            {/* 1. Advance Balance Banner */}
            {advanceBalance > 0 && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 p-5 shadow-lg shadow-emerald-500/20 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner">
                    <Wallet size={22} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">Advance Balance</p>
                    <h3 className="mt-0.5 text-2xl font-bold font-mono">{formatCurrency(advanceBalance)}</h3>
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-50 sm:text-right sm:max-w-[320px]">
                  This extra amount is safe in your child's wallet and will automatically adjust against future invoices.
                </p>
              </div>
            )}

            {/* 2. Next Due / All Clear Banner */}
            {visibleStatus?.grandTotalDue === 0 ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shadow-inner">
                    <span className="text-2xl leading-none">🎉</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-indigo-900">You're all caught up!</h3>
                    <p className="mt-0.5 text-sm font-medium text-indigo-600/80">There are no pending dues for {visibleChild?.fullName || visibleChild?.name || 'your child'} right now.</p>
                  </div>
                </div>
              </div>
            ) : nextDueItem ? (
              (() => {
                const days = daysUntil(nextDueItem.dueDate);
                const isOverdue = days !== null && days < 0;
                const theme = isOverdue 
                  ? { bg: 'bg-rose-50 border-rose-200', iconBg: 'bg-rose-100 text-rose-600', text: 'text-rose-900', sub: 'text-rose-700' }
                  : { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-900', sub: 'text-amber-700' };
                return (
                  <div className={`flex items-start sm:items-center gap-4 rounded-2xl border p-5 shadow-sm ${theme.bg}`}>
                    <div className={`mt-1 sm:mt-0 flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-inner ${theme.iconBg}`}>
                      {isOverdue ? <AlertTriangle size={20} /> : <CalendarClock size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className={`text-sm font-bold ${theme.text}`}>
                          {isOverdue ? 'Action Required: Overdue Payment' : 'Next Payment Upcoming'}
                        </h3>
                        <span className={`font-mono text-lg font-bold ${theme.text}`}>{formatCurrency(nextDueItem.netDue)}</span>
                      </div>
                      <p className={`mt-1 text-sm font-medium ${theme.sub}`}>
                        {nextDueItem.label || nextDueItem.className} · 
                        {isOverdue 
                          ? ` Overdue by ${Math.abs(days)} day${Math.abs(days)===1?'':'s'} (due on ${formatDate(nextDueItem.dueDate)})`
                          : ` Due ${days === 0 ? 'today' : `in ${days} day${days===1?'':'s'}`} (on ${formatDate(nextDueItem.dueDate)})`}
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : null}

            {/* Status stat cards */}
            <div className="flex flex-wrap gap-3">
              <StatCard icon={Wallet} label="Paid Till Date" value={formatCurrency(visibleWallet?.totalReceived)} accent="#1F7A4D" sub="Every payment ever received" />
              <StatCard icon={BadgeIndianRupee} label="Currently Due" value={formatCurrency(visibleStatus?.grandTotalDue)} accent="#B5451B" />
              <StatCard icon={GraduationCap} label="Active Programs" value={visibleStatus?.programs?.length ?? 0} accent="#1C2430" />
              <StatCard icon={Zap} label="Flexi Hours Left" value={`${visibleFlexi?.activeHoursRemaining ?? 0} hrs`} accent="#8A6D1F" />
              <StatCard icon={Clock} label="Last Payment" value={lastPayment ? formatCurrency(lastPayment.amount) : '—'} accent="#33448E" sub={lastPayment ? `${formatDate(lastPayment.paymentDate)} · ${lastPayment.receiptNo}` : 'No payments yet'} />
            </div>

            {visibleStatus?.carriedOverDue > 0 && (
              <div className="flex items-center gap-2 rounded-2xl border border-[#F0C9B8] bg-[#FBEDE7] px-5 py-3 text-sm font-medium text-[#B5451B]">
                <BadgeIndianRupee size={16} className="shrink-0" />
                Carried over from previous session: {formatCurrency(visibleStatus.carriedOverDue)}
              </div>
            )}

            {/* Paid vs due — the clear, single-glance answer to "kitna hua, kitna baaki" */}
            <PaidVsDueBar totalPaid={Number(visibleWallet?.totalReceived || 0)} totalDue={Number(visibleStatus?.grandTotalDue || 0)} />

            {/* Programs */}
            {visibleStatus?.programs?.length > 0 && (
              <Section icon={GraduationCap} title="Fee Programs" subtitle="What's owed, grouped by class">
                <div className="space-y-2">
                  {visibleStatus.programs.map((p) => (
                    <div key={p.classId} className="flex items-center justify-between rounded-xl bg-[#F5F6F2] px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[#1C2430]">{p.className}</p>
                        <p className="text-xs text-[#8891A0]">{(p.feeType || '').replace('_', ' ')}</p>
                      </div>
                      {p.totalDue > 0 ? (
                        <span className="font-mono text-sm font-bold text-[#B5451B]">{formatCurrency(p.totalDue)}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-[#1F7A4D]"><CheckCircle2 size={13} /> Paid</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Installments due — overdue surfaced first, each with a full breakdown */}
            <Section icon={Receipt} title="Installments Due" subtitle="Original amount, what's paid, and what's left — per bill">
              {visibleInstallments.length === 0 ? (
                <p className="text-sm text-[#8891A0]">No pending installments — you're all caught up! 🎉</p>
              ) : (
                <div className="space-y-4">
                  {overdueInstallments.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-rose-600">Overdue — needs attention</p>
                      <div className="space-y-2">{overdueInstallments.map((ins) => <InstallmentRow key={ins._id} ins={ins} />)}</div>
                    </div>
                  )}
                  {upcomingInstallments.length > 0 && (
                    <div>
                      {overdueInstallments.length > 0 && <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#8891A0]">Upcoming</p>}
                      <div className="space-y-2">{upcomingInstallments.map((ins) => <InstallmentRow key={ins._id} ins={ins} />)}</div>
                    </div>
                  )}
                </div>
              )}
            </Section>

            {/* Payment Receipts — grouped by class/program, each downloadable as its own PDF */}
            <Section icon={Download} title="Payment Receipts" subtitle="Every payment, grouped by class — download a separate receipt PDF for each">
              {classReceiptGroups.length === 0 ? (
                <p className="text-sm text-[#8891A0]">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {classReceiptGroups.map((group) => (
                    <div key={group.className} className="rounded-xl bg-[#F5F6F2] px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1C2430]">{group.className}</p>
                          <p className="text-xs text-[#8891A0]">{group.lines.length} payment{group.lines.length === 1 ? '' : 's'} · Total paid <b className="font-mono text-[#1F7A4D]">{formatCurrency(group.total)}</b></p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReceiptGroup(group)}
                          className="flex items-center gap-1.5 rounded-full bg-[#1C2430] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#33448E]"
                        >
                          <Download size={13} /> Download Receipt
                        </button>
                      </div>
                      <div className="mt-2.5 space-y-1 border-t border-dashed border-[#E2E5E0] pt-2.5">
                        {group.lines.slice(0, 3).map((l, i) => (
                          <div key={`${l.receiptNo}-${i}`} className="flex items-center justify-between text-[11px] text-[#64707D]">
                            <span className="font-mono">{l.receiptNo} · {formatDate(l.paymentDate)}</span>
                            <span className="font-mono font-semibold text-[#1C2430]">{formatCurrency(l.amountUsed)}</span>
                          </div>
                        ))}
                        {group.lines.length > 3 && (
                          <p className="text-[11px] text-[#8891A0]">+ {group.lines.length - 3} more — included in the downloaded receipt</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* Flexi Card */}
            {visibleFlexi && (visibleFlexi.purchases || []).length > 0 && (
              <Section icon={Zap} title="Flexi Card" subtitle="Prepaid hours cards purchased for this child">
                <div className="space-y-2">
                  {visibleFlexi.purchases.map((p) => {
                    const pct = p.price > 0 ? Math.min(100, Math.round((p.amountPaid / p.price) * 100)) : 100;
                    return (
                      <div key={p._id} className="rounded-xl bg-[#F5F6F2] px-4 py-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#1C2430]">{p.className}</p>
                          <span className="text-xs font-bold uppercase text-[#8891A0]">{p.status}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#64707D]">
                          <span>Hours remaining: <b className="text-[#1C2430]">{p.hoursRemaining} / {p.hoursPurchased} hrs</b></span>
                          <span>Paid: <b className="text-[#1F7A4D] font-mono">{formatCurrency(p.amountPaid)}</b> of <b className="font-mono">{formatCurrency(p.price)}</b></span>
                          {p.amountDue > 0 && <span className="font-semibold text-[#B5451B]">Due: {formatCurrency(p.amountDue)}</span>}
                        </div>
                        {p.amountDue > 0 && (
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
                            <div className="h-full rounded-full bg-[#33448E]" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* Invoices */}
            <div>
              <div className="mb-3 flex items-center gap-2 px-1">
                <FileText size={14} className="text-[#8891A0]" />
                <h3 className="text-sm font-bold text-[#1C2430]">Monthly Tuition Invoices</h3>
              </div>
              <p className="mb-3 px-1 text-xs text-[#8891A0]">
                These cover monthly-billed classes only. Installment and one-time class fees are shown separately above under "Installments Due".
              </p>
              {visibleInvoices.length === 0 ? (
                <EmptyState icon="📄" title="No invoices yet" desc={visibleChild ? `Invoices for ${visibleChild.fullName || visibleChild.name || 'your child'} will appear here once generated.` : 'Invoices will appear here once generated by the school.'} />
              ) : (
                <div className="space-y-3">{visibleInvoices.map((invoice) => <InvoiceCard key={invoice._id || invoice.invoiceNo} invoice={invoice} />)}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {receiptGroup && (
        <FeeReceiptModal group={receiptGroup} student={visibleChild} onClose={() => setReceiptGroup(null)} />
      )}
    </div>
  );
};

export default MyInvoices;
