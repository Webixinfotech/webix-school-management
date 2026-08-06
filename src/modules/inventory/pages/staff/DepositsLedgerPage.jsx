import React, { useState, useEffect } from 'react';
import { 
  getDepositsAPI, 
  refundDepositAPI, 
  forfeitDepositAPI, 
  getDepositsSummaryAPI 
} from '../../api/inventoryApi';
import Toast, { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function DepositsLedgerPage() {
  const { toast, showToast, hideToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [parentFilter, setParentFilter] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('refund'); // refund | forfeit
  const [selectedDepositId, setSelectedDepositId] = useState(null);
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState(0); // For deductionAmount
  const [refundMode, setRefundMode] = useState('cash');
  const [refundTxnRef, setRefundTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (parentFilter !== searchTerm) {
        setParentFilter(searchTerm);
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, parentFilter]);

  useEffect(() => {
    fetchDeposits();
  }, [page, statusFilter, parentFilter]);

  const fetchSummary = async () => {
    try {
      const [res, refundedRes, forfeitedRes] = await Promise.all([
        getDepositsSummaryAPI(),
        getDepositsAPI({ status: 'refunded', limit: 1000 }),
        getDepositsAPI({ status: 'forfeited', limit: 1000 }),
      ]);
      const summaryData = res.data?.data || {};
      const totalRefunded = (refundedRes.data?.data || []).reduce((s, d) => s + (d.refund?.amount || 0), 0);
      const totalForfeited = (forfeitedRes.data?.data || []).reduce((s, d) => s + (d.amount || 0), 0);
      setSummary({ ...summaryData, totalRefundedAmount: totalRefunded, totalForfeitedAmount: totalForfeited });
    } catch (err) {
      console.error('Failed to load deposits summary', err);
    }
  };

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (parentFilter) params.parentId = parentFilter;
      
      const res = await getDepositsAPI(params);
      setDeposits(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load deposits data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (id, type) => {
    setSelectedDepositId(id);
    setActionType(type);
    setNotes('');
    setAmount(0);
    setRefundMode('cash');
    setRefundTxnRef('');
    setIsModalOpen(true);
  };

  const handleAction = (e) => {
    e.preventDefault();
    setConfirmState({
      title: actionType === 'refund' ? 'Process Refund' : 'Forfeit Deposit',
      message: actionType === 'refund' 
        ? 'This will record the deposit as refunded and update the transaction status. Proceed?' 
        : 'This will record the deposit as forfeited and update the transaction status. Proceed?',
      confirmColor: actionType === 'refund' ? 'blue' : 'rose',
      confirmLabel: 'Proceed',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          if (actionType === 'refund') {
            await refundDepositAPI(selectedDepositId, {
              mode: refundMode,
              transactionRef: refundTxnRef || undefined,
              deductionAmount: amount,
              deductionReason: amount > 0 ? notes : undefined,
              note: amount === 0 ? notes : undefined,
            });
            showToast('success', 'Refund processed successfully');
          } else {
            await forfeitDepositAPI(selectedDepositId, { reason: notes });
            showToast('success', 'Deposit forfeited successfully');
          }
          setIsModalOpen(false);
          await fetchDeposits();
          await fetchSummary();
        } catch (err) {
          console.error(err);
          showToast('error', err.response?.data?.message || `Failed to ${actionType} deposit`);
        } finally {
          setSubmitting(false);
          setConfirmState(null);
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'held':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>;
      case 'refunded':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700">REFUNDED</span>;
      case 'forfeited':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">FORFEITED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Toast toast={toast} onClose={hideToast} />
      {confirmState && (
        <ConfirmModal 
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          confirmColor={confirmState.confirmColor}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          loading={false}
        />
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Deposits Ledger</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage library deposits, refunds, and forfeitures</p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Active Deposits</p>
              <p className="text-3xl font-black text-slate-900 mt-1">₹{summary.totalHeld || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Refunded</p>
              <p className="text-3xl font-black text-slate-900 mt-1">₹{summary.totalRefundedAmount || 0}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Total Forfeited</p>
              <p className="text-3xl font-black text-slate-900 mt-1">₹{summary.totalForfeitedAmount || 0}</p>
            </div>
          </div>
        </div>
      )}

      {summary && summary.byParent && summary.byParent.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
          <h3 className="font-bold text-slate-800 mb-4">Deposits by Parent</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {summary.byParent.map((p, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-medium text-slate-700 truncate mr-2">{p.parentName || p.parent?.name || p.parent?.firstName || 'Unknown'}</span>
                <span className="font-bold text-emerald-600">₹{p.totalHeld || p.amount || 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-0 font-medium text-slate-700 bg-slate-50"
          >
            <option value="">All Statuses</option>
            <option value="held">Held (Active)</option>
            <option value="refunded">Refunded</option>
            <option value="forfeited">Forfeited</option>
          </select>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search Parent ID / Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-0 font-medium text-slate-700 bg-slate-50 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4 pl-6">Receipt No</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Item</th>
                    <th className="p-4">Student</th>
                    <th className="p-4">Parent</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment Mode</th>
                    <th className="p-4">Collected By</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="p-12 text-center text-slate-400 font-medium">
                        No deposits found.
                      </td>
                    </tr>
                  ) : (
                    deposits.map((dep) => (
                      <React.Fragment key={dep._id}>
                        <tr className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-4 pl-6 font-bold text-slate-700">
                            {dep.receiptNo || '—'}
                          </td>
                          <td className="p-4 font-bold text-slate-700 whitespace-nowrap">
                            {new Date(dep.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 font-medium text-slate-800 max-w-[150px] truncate" title={dep.item?.name}>
                            {dep.item?.name || '—'}
                          </td>
                          <td className="p-4 font-medium text-slate-800">
                            {dep.student ? `${dep.student.firstName || ''} ${dep.student.lastName || ''}`.trim() : '—'}
                          </td>
                          <td className="p-4 font-bold text-slate-800 max-w-[150px] truncate" title={dep.parent?.name || dep.parent?.firstName || 'Unknown'}>
                            {dep.parent?.name || dep.parent?.firstName || 'Unknown'}
                          </td>
                          <td className="p-4 font-bold text-slate-800">
                            ₹{dep.amount}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 uppercase tracking-wider">
                              {dep.paymentMode || '—'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-slate-600">
                            {dep.collectedBy?.name || '—'}
                          </td>
                          <td className="p-4">
                            {getStatusBadge(dep.status)}
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {dep.status === 'held' && (
                              <div className="flex justify-end gap-2 transition-opacity">
                                <button
                                  onClick={() => openModal(dep._id, 'refund')}
                                  disabled={dep.lendingTransaction?.status !== 'returned'}
                                  title={dep.lendingTransaction?.status !== 'returned' ? "Item not yet returned" : "Process Refund"}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                    dep.lendingTransaction?.status !== 'returned'
                                      ? 'text-slate-400 bg-slate-100 cursor-not-allowed'
                                      : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                  }`}
                                >
                                  Refund
                                </button>
                                <button
                                  onClick={() => openModal(dep._id, 'forfeit')}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                >
                                  Forfeit
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {dep.status !== 'held' && (
                          <tr className="bg-slate-50/30">
                            <td colSpan="10" className="p-4 pl-6 border-t border-dashed border-slate-200">
                              <div className="text-sm text-slate-600 flex flex-wrap gap-x-8 gap-y-2">
                                {dep.status === 'refunded' && dep.refund && (
                                  <>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Refund Details</span>
                                      <span className="font-medium mt-1">Refunded: <span className="font-bold text-slate-800">₹{dep.refund.amount}</span></span>
                                      {dep.refund.deductionAmount > 0 && (
                                        <>
                                          <span className="text-red-500 font-medium">Deducted: ₹{dep.refund.deductionAmount}</span>
                                          {dep.refund.deductionReason && <span>Reason: {dep.refund.deductionReason}</span>}
                                        </>
                                      )}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Transaction Info</span>
                                      <span className="mt-1">Mode: <span className="uppercase font-medium">{dep.refund.mode || '—'}</span></span>
                                      {dep.refund.transactionRef && <span>Ref: {dep.refund.transactionRef}</span>}
                                      {dep.refund.processedBy && <span>Processed By: {dep.refund.processedBy.name || '—'}</span>}
                                    </div>
                                    {dep.refund.note && (
                                      <div className="flex flex-col max-w-sm">
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Notes</span>
                                        <span className="mt-1 italic">{dep.refund.note}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                                {dep.status === 'forfeited' && (
                                  <div className="flex flex-col">
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Forfeit Reason</span>
                                    <span className="font-medium mt-1 text-red-600">{dep.forfeitReason || '—'}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className={`text-xl font-extrabold ${actionType === 'refund' ? 'text-blue-700' : 'text-red-700'}`}>
                {actionType === 'refund' ? 'Process Refund' : 'Forfeit Deposit'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors shadow-sm border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAction} className="p-6">
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-500 mb-4">
                  {actionType === 'refund' 
                    ? 'Are you sure you want to refund this deposit to the user?' 
                    : 'Are you sure you want to forfeit this deposit? This is usually done to cover lost items or severe damage.'}
                </p>

                {actionType === 'refund' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Payment Mode</label>
                        <select
                          value={refundMode}
                          onChange={(e) => setRefundMode(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 transition-colors font-medium text-slate-800"
                        >
                          <option value="cash">Cash</option>
                          <option value="upi">UPI</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="cheque">Cheque</option>
                          <option value="card">Card</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Transaction Ref</label>
                        <input
                          type="text"
                          value={refundTxnRef}
                          onChange={(e) => setRefundTxnRef(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 transition-colors font-medium text-slate-800"
                          placeholder="Optional ref"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Deduction Amount (leave 0 for full refund)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 transition-colors font-medium text-slate-800"
                        placeholder="Leave 0 for full refund"
                      />
                      <p className="text-xs text-slate-400 mt-1">Leave as 0 to refund the full original amount.</p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    {actionType === 'refund' && amount > 0 ? 'Deduction Reason' : 'Notes / Reason'}
                  </label>
                  <textarea
                    required={actionType === 'forfeit' || (actionType === 'refund' && amount > 0)}
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:ring-0 transition-colors font-medium text-slate-800 resize-none ${actionType === 'refund' ? 'focus:border-blue-500' : 'focus:border-red-500'}`}
                    placeholder={actionType === 'forfeit' ? 'Reason for forfeiture (Required)' : actionType === 'refund' && amount > 0 ? 'Reason for deduction (Required)' : 'Optional notes...'}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70 ${
                    actionType === 'refund' 
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  {submitting ? 'Processing...' : actionType === 'refund' ? 'Confirm Refund' : 'Confirm Forfeit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
