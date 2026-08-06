import api from '../api/axios';

// Bearer token is already attached by the axios interceptor (src/api/axios.js).
// We still accept an optional `opts` object ({ signal }) on every call so callers
// can cancel in-flight requests (e.g. on unmount).

const asOpts = (opts) => (opts && typeof opts === 'object' ? opts : {});

const feeService = {
  // ───────────────────────── Settings (global, singleton) ─────────────────────────
  // Admin, or teacher with canManageFees. Fields: flexiHourlyRate,
  // flexiGracePeriodMinutes, invoiceDueDay, lateFineAmount, autoInvoiceEnabled.
  getSettings: async (opts) => {
    const { data } = await api.get('/fee/settings', asOpts(opts));
    return data;
  },
  updateSettings: async (settings, opts) => {
    const { data } = await api.put('/fee/settings', settings, asOpts(opts));
    return data;
  },

  // ───────────────────────── Enrollments ─────────────────────────
  // hoursAssigned is required for FLEX_TIME classes — backend computes
  // amount = class.baseFee * hoursAssigned and bills it as an UNPAID
  // installment; it's ignored (and unnecessary) for other class types.
  createEnrollment: async (studentId, classId, hoursAssigned, opts) => {
    const body = { studentId, classId };
    if (hoursAssigned !== undefined && hoursAssigned !== null && hoursAssigned !== '') {
      body.hoursAssigned = Number(hoursAssigned);
    }
    const { data } = await api.post('/fee/enrollments', body, asOpts(opts));
    return data;
  },
  // Assign (more) Flexi Time hours to a student already enrolled in a
  // FLEX_TIME class — bills baseFee * hoursAssigned as a fresh UNPAID
  // installment on top of whatever's already been assigned/paid.
  assignFlexiHours: async (studentId, classId, hoursAssigned, opts) => {
    const { data } = await api.post('/fee/flexi-hours/assign', { studentId, classId, hoursAssigned: Number(hoursAssigned) }, asOpts(opts));
    return data;
  },
  getEnrollmentsByStudent: async (studentId, opts) => {
    const { data } = await api.get(`/fee/enrollments/${studentId}`, asOpts(opts));
    return data;
  },
  // Session-wide enrollment list (bulk Promote screen). params: { sessionId, status, classId, page, limit }
  getEnrollmentsBySession: async (params, opts) => {
    const { data } = await api.get('/fee/enrollments', { ...asOpts(opts), params });
    return data;
  },
  cancelEnrollment: async (enrollmentId, opts) => {
    const { data } = await api.delete(`/fee/enrollments/${enrollmentId}`, asOpts(opts));
    return data;
  },

  // ─────────────────────────── Session Promotion ───────────────────────────
  // decisions: [{ studentId, decision: 'promote'|'retain'|'notContinuing', newClassId? }]
  promoteStudents: async ({ fromSessionId, toSessionId, decisions }, opts) => {
    const { data } = await api.post('/fee/promotions', { fromSessionId, toSessionId, decisions }, asOpts(opts));
    return data;
  },
  // Pass the NEW session's enrollment id (correction/rollback when a promoted
  // student is later found to have actually left).
  markEnrollmentLeft: async (enrollmentId, reason, opts) => {
    const { data } = await api.put(`/fee/enrollments/${enrollmentId}/mark-left`, { reason }, asOpts(opts));
    return data;
  },

  // ───────────────────────── Installments ─────────────────────────
  getInstallmentsByStudent: async (studentId, opts) => {
    const { data } = await api.get(`/fee/installments/student/${studentId}`, asOpts(opts));
    return data;
  },
  getInstallmentById: async (installmentId, opts) => {
    const { data } = await api.get(`/fee/installments/${installmentId}`, asOpts(opts));
    return data;
  },
  updateInstallment: async (installmentId, payload, opts) => {
    const { data } = await api.put(`/fee/installments/${installmentId}`, payload, asOpts(opts));
    return data;
  },
  getInstallmentDefaulters: async (opts) => {
    const { data } = await api.get('/fee/reports/installment-defaulters', asOpts(opts));
    return data;
  },

  // ───────────────────────── Invoices ─────────────────────────
  generateInvoice: async (studentId, opts) => {
    const { data } = await api.post('/fee/invoices/generate', { studentId }, asOpts(opts));
    return data;
  },
  getInvoicesByStudent: async (studentId, opts) => {
    const { data } = await api.get(`/fee/invoices/student/${studentId}`, asOpts(opts));
    return data;
  },
  // Session-wide invoice list/report. params: { sessionId, status, month, year, page, limit }
  getInvoices: async (params, opts) => {
    const { data } = await api.get('/fee/invoices', { ...asOpts(opts), params });
    return data;
  },

  // ───────────────────────── Payments (split / partial allocation) ─────────────────────────
  // allocations: [{ billType: 'INSTALLMENT' | 'FLEXI_CARD', billId, amount }]
  collectPayment: async ({ studentId, amount, paymentMode, remarks, allocations }, opts) => {
    const { data } = await api.post('/fee/payments', { studentId, amount, paymentMode, remarks, allocations }, asOpts(opts));
    return data;
  },
  getPaymentsByStudent: async (studentId, opts) => {
    const { data } = await api.get(`/fee/payments/student/${studentId}`, asOpts(opts));
    return data;
  },
  getPaymentById: async (paymentId, opts) => {
    const { data } = await api.get(`/fee/payments/${paymentId}`, asOpts(opts));
    return data;
  },
  // Admin-only. Editable fields: amount, paymentMode, transactionRef,
  // paymentDate, remarks. `note` is an optional reason shown in the
  // payment's edit history.
  updatePayment: async (paymentId, { amount, paymentMode, transactionRef, paymentDate, remarks, note }, opts) => {
    const { data } = await api.put(
      `/fee/payments/${paymentId}`,
      { amount, paymentMode, transactionRef, paymentDate, remarks, note },
      asOpts(opts)
    );
    return data;
  },
  getPaymentHistory: async (paymentId, opts) => {
    const { data } = await api.get(`/fee/payments/${paymentId}/history`, asOpts(opts));
    return data;
  },

  // ───────────────────────── Flexi Card (prepaid hours) ─────────────────────────
  purchaseFlexiCard: async ({ studentId, classId, amountPaidNow, paymentMode }, opts) => {
    const { data } = await api.post('/fee/flexi-card/purchase', { studentId, classId, amountPaidNow, paymentMode }, asOpts(opts));
    return data;
  },
  getFlexiCardBalance: async (studentId, opts) => {
    const { data } = await api.get(`/fee/flexi-card/balance/${studentId}`, asOpts(opts));
    return data;
  },
  getFlexiCardPurchases: async (studentId, opts) => {
    const { data } = await api.get(`/fee/flexi-card/purchases/${studentId}`, asOpts(opts));
    return data;
  },
  getFlexiCardPurchaseById: async (purchaseId, opts) => {
    const { data } = await api.get(`/fee/flexi-card/purchases/detail/${purchaseId}`, asOpts(opts));
    return data;
  },

  // ───────────────────────── Fee Status (per-program due/paid view) ─────────────────────────
  // Admin: unrestricted. Teacher: requires permissions.canViewFeeInfo (403 otherwise).
  getFeeStatus: async (studentId, opts) => {
    const { data } = await api.get(`/fee/status/${studentId}`, asOpts(opts));
    return data;
  },

  // ───────────────────────── Parent self-service (auth'd as parent) ─────────────────────────
  getMyInstallments: async (opts) => {
    const { data } = await api.get('/fee/my-installments', asOpts(opts));
    return data;
  },
  getMyFlexiCard: async (opts) => {
    const { data } = await api.get('/fee/my-flexi-card', asOpts(opts));
    return data;
  },
  getMyStatus: async (opts) => {
    const { data } = await api.get('/fee/my-status', asOpts(opts));
    return data;
  },
  getMyInvoices: async (opts) => {
    const { data } = await api.get('/fee/my-invoices', asOpts(opts));
    return data;
  },
  getMyWallet: async (opts) => {
    const { data } = await api.get('/fee/my-wallet', asOpts(opts));
    return data;
  },
  // Every receipt ever collected for this parent's children — used for the
  // "last payment" summary and per-class receipt downloads.
  getMyPayments: async (opts) => {
    const { data } = await api.get('/fee/my-payments', asOpts(opts));
    return data;
  },
};

export default feeService;