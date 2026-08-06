import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStockOutsAPI, approveStockOutAPI, rejectStockOutAPI } from '../../api/inventoryApi';
import Toast, { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

// Small helper to format date + time together
const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

// Status badge colors
const statusStyles = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-emerald-50 text-emerald-600',
  rejected: 'bg-red-50 text-red-600',
};

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${style}`}>
      {status || 'unknown'}
    </span>
  );
}

export default function ApprovalQueuePage() {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State for Reject Reason
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(pendingRequests.map(r => r._id));
    } else {
      setSelectedIds([]);
    }
  };
  
  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  useEffect(() => {
    fetchRequests();
    setSelectedIds([]); // Clear selection on tab change
  }, [activeTab]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = activeTab === 'all' ? {} : { status: activeTab };
      const res = await getStockOutsAPI(params);
      setRequests(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (navigate) {
      navigate(-1);
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  const handleApprove = (id) => {
    const isBulk = id === null;
    const targetIds = isBulk ? selectedIds : [id];
    setConfirmState({
      title: isBulk ? `Approve ${targetIds.length} Requests` : 'Approve Request',
      message: isBulk ? `Are you sure you want to approve these ${targetIds.length} requests?` : 'Are you sure you want to approve this stock-out request?',
      confirmColor: 'emerald',
      confirmLabel: 'Approve',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await Promise.all(targetIds.map(tid => approveStockOutAPI(tid, { note: 'Approved via Admin Dashboard' })));
          showToast('success', `${isBulk ? 'Requests' : 'Request'} approved.`);
          if (isBulk) setSelectedIds([]);
          await fetchRequests();
        } catch (err) {
          console.error(err);
          showToast('error', err.response?.data?.message || 'Failed to approve request(s)');
        } finally {
          setSubmitting(false);
          setConfirmState(null);
        }
      }
    });
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('error', 'Please provide a reason for rejection.');
      return;
    }
    const isBulk = rejectingId === null;
    const targetIds = isBulk ? selectedIds : [rejectingId];
    try {
      setSubmitting(true);
      await Promise.all(targetIds.map(tid => rejectStockOutAPI(tid, { note: rejectReason, rejectionReason: rejectReason })));
      showToast('success', `${isBulk ? 'Requests' : 'Request'} rejected.`);
      if (isBulk) setSelectedIds([]);
      setIsRejectModalOpen(false);
      setRejectingId(null);
      await fetchRequests();
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to reject request(s)');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      <Toast toast={toast} onClose={hideToast} />
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          confirmColor={confirmState.confirmColor}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          loading={submitting}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={handleBack}
            className="mt-1 shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-sm transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Approval Queue</h1>
            <p className="text-slate-500 mt-1 font-medium text-sm sm:text-base">Review and process staff inventory requests</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
            </svg>
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
              viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z" />
            </svg>
            <span className="hidden sm:inline">Grid</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto">
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'pending' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'approved' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'rejected' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'all' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('all')}
        >
          All Requests
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold flex items-center gap-3">
          <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center text-slate-400">
          <div className="flex flex-col items-center gap-3">
            <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold text-lg text-slate-500">All caught up!</p>
            <p className="text-sm font-medium">No pending stock requests found.</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* ---------------- TABLE VIEW ---------------- */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {selectedIds.length > 0 && (
            <div className="bg-indigo-50 border-b border-indigo-100 p-3 flex items-center justify-between">
              <span className="font-bold text-indigo-800 ml-2">{selectedIds.length} item(s) selected</span>
              <div className="flex gap-2">
                <button onClick={() => openRejectModal(null)} className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-bold text-sm transition-colors">Reject Selected</button>
                <button onClick={() => handleApprove(null)} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-bold text-sm shadow-sm transition-colors">Approve Selected</button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6 w-12">
                    {pendingRequests.length > 0 && (
                      <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === pendingRequests.length} onChange={handleSelectAll} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                    )}
                  </th>
                  <th className="p-4">Requested By</th>
                  <th className="p-4">Item Details</th>
                  <th className="p-4 text-center">Qty</th>
                  {/* <th className="p-4">Class</th> */}
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Requested On</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition-colors align-top">
                    <td className="p-4 pl-6">
                      {req.status === 'pending' && (
                        <input type="checkbox" checked={selectedIds.includes(req._id)} onChange={() => handleSelectOne(req._id)} className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                      )}
                    </td>
                    <td className="p-4 max-w-[160px]">
                      <p className="font-bold text-slate-800 truncate" title={req.requestedBy?.name || req.issuedToTeacher?.name}>
                        {req.requestedBy?.name || req.issuedToTeacher?.name || 'Unknown Staff'}
                      </p>
                      {req.issuedToTeacher?.email && (
                        <p className="text-xs text-slate-500 font-medium truncate">{req.issuedToTeacher.email}</p>
                      )}
                    </td>
                    <td className="p-4 max-w-[160px]">
                      <p className="font-bold text-slate-800 truncate" title={req.item?.name}>{req.item?.name}</p>
                      {req.item?.unit && <p className="text-xs text-slate-500 font-medium">Unit: {req.item.unit}</p>}
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                        {req.quantity}
                      </span>
                    </td>
                    {/* <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">
                      {req.classId || 'N/A'}
                    </td> */}
                    <td className="p-4 max-w-[220px]">
                      <p
                        className="text-xs text-slate-600 font-medium line-clamp-2 break-words"
                        title={req.purpose || req.note}
                      >
                        {req.purpose || req.note || 'No purpose stated'}
                      </p>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {req.isDirectIssue ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                          Direct Issue
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                          Requested
                        </span>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <p className="font-bold text-slate-700 text-sm">{formatDateTime(req.createdAt)}</p>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            disabled={submitting}
                            onClick={() => openRejectModal(req._id)}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Reject
                          </button>
                          <button
                            disabled={submitting}
                            onClick={() => handleApprove(req._id)}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Approve
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ---------------- GRID VIEW ---------------- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map((req) => (
            <div
              key={req._id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 truncate" title={req.item?.name}>{req.item?.name}</p>
                  {req.item?.unit && <p className="text-xs text-slate-500 font-medium">Unit: {req.item.unit}</p>}
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                  Qty: {req.quantity}
                </span>
                {req.isDirectIssue ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600">
                    Direct Issue
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                    Requested
                  </span>
                )}
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Requested By</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {req.requestedBy?.name || req.issuedToTeacher?.name || 'Unknown Staff'}
                  </p>
                  {req.issuedToTeacher?.email && (
                    <p className="text-xs text-slate-500 font-medium truncate">{req.issuedToTeacher.email}</p>
                  )}
                </div>

                {/* <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Class</p>
                  <p className="text-sm font-medium text-slate-600">{req.classId || 'N/A'}</p>
                </div> */}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Purpose</p>
                  <p className="text-sm text-slate-600 font-medium break-words line-clamp-3" title={req.purpose || req.note}>
                    {req.purpose || req.note || 'No purpose stated'}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Requested On</p>
                  <p className="text-sm font-bold text-slate-700">{formatDateTime(req.createdAt)}</p>
                </div>

                {req.status !== 'pending' && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Decision</p>
                    <p className="text-sm font-medium text-slate-600">
                      {req.decidedBy?.name || 'N/A'} • {formatDateTime(req.decidedAt)}
                    </p>
                    {req.decisionNote && (
                      <p className="text-xs text-slate-500 italic mt-0.5 break-words">"{req.decisionNote}"</p>
                    )}
                  </div>
                )}

                {(req.stockBefore !== null && req.stockBefore !== undefined) && (
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Before</p>
                      <p className="text-sm font-bold text-slate-700">{req.stockBefore}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock After</p>
                      <p className="text-sm font-bold text-slate-700">{req.stockAfter ?? 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {req.status === 'pending' && (
                <div className="mt-auto pt-3 flex gap-2">
                  <button
                    disabled={submitting}
                    onClick={() => openRejectModal(req._id)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={submitting}
                    onClick={() => handleApprove(req._id)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800">Reject Request</h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors shadow-sm border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleReject} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Reason for Rejection <span className="text-red-500">*</span></label>
                  <textarea
                    required
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-0 transition-colors font-medium text-slate-800 resize-none"
                    placeholder="e.g. Out of stock, not approved for department..."
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  Confirm Reject & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}