import React, { useState, useEffect } from 'react';
import { getMyDepositsAPI } from '../../api/inventoryApi';

export default function ParentDepositsPage() {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | table
  const [receiptData, setReceiptData] = useState(null);

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await getMyDepositsAPI();
      setDeposits(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'held':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">ACTIVE</span>;
      case 'refunded':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">REFUNDED</span>;
      case 'forfeited':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">FORFEITED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const totalActive = deposits.filter(d => d.status === 'held').reduce((sum, d) => sum + d.amount, 0);
  const totalRefunded = deposits.filter(d => d.status === 'refunded').reduce((sum, d) => sum + (d.refund?.amount || 0), 0);
  const totalForfeited = deposits.filter(d => d.status === 'forfeited').reduce((sum, d) => sum + d.amount, 0);

  return (
    <>
      {/* Main Content (Hidden during print) */}
      <div className={`p-6 md:p-8 max-w-6xl mx-auto ${receiptData ? 'print:hidden' : ''}`}>
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Security Deposits</h1>
            <p className="text-slate-500 mt-1 font-medium">Track your refundable library and item deposits</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Table
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-200">
            <p className="text-emerald-100 font-medium mb-1 uppercase tracking-wider text-xs">Total Active Deposits</p>
            <h2 className="text-3xl font-black">₹{totalActive}</h2>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-blue-200">
            <p className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-xs">Total Refunded</p>
            <h2 className="text-3xl font-black">₹{totalRefunded}</h2>
          </div>
          <div className="bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl p-6 text-white shadow-lg shadow-rose-200">
            <p className="text-rose-100 font-medium mb-1 uppercase tracking-wider text-xs">Total Forfeited</p>
            <h2 className="text-3xl font-black">₹{totalForfeited}</h2>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : deposits.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700">No deposits found</h3>
            <p className="text-slate-500 mt-2 font-medium">You have no active or past security deposits.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deposits.map((dep) => (
              <div key={dep._id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                <div className="flex justify-between items-start mb-4">
                  <div className="pr-2">
                    <h3 className="font-extrabold text-lg text-slate-800 line-clamp-2 leading-tight" title={dep.item?.name}>{dep.item?.name || 'Unknown Item'}</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{new Date(dep.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(dep.status)}</div>
                </div>
                
                <div className="bg-slate-50/80 rounded-2xl p-4 mb-4 flex items-center justify-between border border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                  <span className="text-2xl font-black text-slate-900">₹{dep.amount}</span>
                </div>
                
                <div className="space-y-2 mb-6 text-sm text-slate-600 flex-1">
                  {dep.student && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Student</span>
                      <span className="font-bold text-slate-700">{dep.student.fullName || dep.student.firstName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Receipt No</span>
                    <span className="font-bold text-slate-700">{dep.receiptNo || '—'}</span>
                  </div>
                  
                  {dep.status === 'refunded' && dep.refund && (
                    <div className="pt-3 mt-3 border-t border-dashed border-slate-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-blue-500 font-bold">Refunded</span>
                        <span className="font-black text-blue-600">₹{dep.refund.amount}</span>
                      </div>
                      {dep.refund.deductionAmount > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-400 font-medium">Deduction</span>
                          <span className="font-bold text-red-500">₹{dep.refund.deductionAmount}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {dep.status === 'forfeited' && (
                    <div className="pt-3 mt-3 border-t border-dashed border-slate-200">
                      <p className="text-red-500 font-bold text-xs uppercase tracking-wider mb-1">Forfeit Reason</p>
                      <p className="text-red-700 font-medium text-sm leading-tight">{dep.forfeitReason}</p>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setReceiptData(dep)} 
                  className="mt-auto w-full py-3.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 border border-indigo-100"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  View Receipt
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4 pl-6">Date</th>
                    <th className="p-4">Item & Student</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Notes</th>
                    <th className="p-4 pr-6 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.map((dep) => (
                    <tr key={dep._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-700 whitespace-nowrap">
                        {new Date(dep.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-800 max-w-[200px] truncate" title={dep.item?.name}>
                          {dep.item?.name || 'Unknown Item'}
                        </p>
                        {dep.student && (
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {dep.student.fullName || dep.student.firstName}
                          </p>
                        )}
                      </td>
                      <td className="p-4 font-black text-slate-800 text-lg">
                        ₹{dep.amount}
                      </td>
                      <td className="p-4">
                        {getStatusBadge(dep.status)}
                      </td>
                      <td className="p-4 text-sm text-slate-500 max-w-[250px]">
                        {dep.status === 'held' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-slate-600">No.: {dep.receiptNo || '—'}</span>
                          </div>
                        )}
                        {dep.status === 'refunded' && dep.refund && (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-bold text-blue-600">Refunded: ₹{dep.refund.amount}</span>
                            {dep.refund.deductionAmount > 0 && (
                              <span className="text-red-500 text-xs font-medium">Deducted: ₹{dep.refund.deductionAmount}</span>
                            )}
                          </div>
                        )}
                        {dep.status === 'forfeited' && (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-red-500 text-xs font-medium truncate" title={dep.forfeitReason}>
                              {dep.forfeitReason}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => setReceiptData(dep)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100 inline-flex items-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:static print:bg-transparent print:p-0">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:w-full print:max-w-none print:max-h-none print:animate-none print:overflow-visible">
            
            {/* Modal Header (Hidden on print) */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/80 print:hidden shrink-0">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Deposit Receipt
              </h3>
              <div className="flex gap-2">
                <button onClick={handlePrintReceipt} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Print
                </button>
                <button onClick={() => setReceiptData(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            
            {/* Printable Content */}
            <div className="p-5 sm:p-8 print:p-4 bg-white overflow-y-auto print:overflow-visible">
              <div className="text-center mb-6 sm:mb-8 border-b-2 border-slate-100 pb-5 sm:pb-6">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">Brain Builder School</h2>
                <p className="text-slate-500 font-bold tracking-widest text-xs sm:text-sm mt-1 uppercase">Security Deposit Receipt</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="text-left">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receipt No.</p>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">{receiptData.receiptNo || 'N/A'}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</p>
                  <p className="font-bold text-slate-800 text-sm sm:text-base">{new Date(receiptData.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 mb-3 sm:mb-4">
                  <span className="text-sm font-bold text-slate-500">Deposit Amount</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">₹{receiptData.amount}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 text-sm border-t border-slate-200 pt-3">
                  <span className="font-bold text-slate-500">Payment Mode</span>
                  <span className="font-bold text-slate-800 uppercase">{receiptData.paymentMode || 'Cash'}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6 sm:mb-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 border-b border-slate-100 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Depositor (Parent)</span>
                  <span className="font-bold text-slate-800 sm:text-right text-sm">{receiptData.parent?.name || 'N/A'}</span>
                </div>
                {receiptData.student && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 border-b border-slate-100 pb-3">
                    <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Student</span>
                    <span className="font-bold text-slate-800 sm:text-right text-sm">{receiptData.student.fullName || receiptData.student.firstName} ({receiptData.student.admissionNo || ''})</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 border-b border-slate-100 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Linked Item</span>
                  <span className="font-bold text-slate-800 sm:text-right text-sm">{receiptData.item?.name || 'N/A'}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 border-b border-slate-100 pb-3">
                  <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">Current Status</span>
                  <span className="font-bold text-slate-800 sm:text-right text-sm uppercase">{receiptData.status}</span>
                </div>
              </div>

              {receiptData.status === 'refunded' && receiptData.refund && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 print:border-slate-200">
                  <h4 className="font-black text-blue-800 mb-3 uppercase tracking-wider text-xs">Refund Details</h4>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 mb-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-600">Amount Refunded</span>
                    <span className="font-bold text-blue-700">₹{receiptData.refund.amount}</span>
                  </div>
                  {receiptData.refund.deductionAmount > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4 text-sm">
                      <span className="font-bold text-red-500 text-xs sm:text-sm">Deduction ({receiptData.refund.deductionReason})</span>
                      <span className="font-bold text-red-600">₹{receiptData.refund.deductionAmount}</span>
                    </div>
                  )}
                </div>
              )}

              {receiptData.status === 'forfeited' && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 print:border-slate-200">
                  <h4 className="font-black text-red-800 mb-2 uppercase tracking-wider text-xs">Forfeiture Details</h4>
                  <p className="text-xs sm:text-sm font-bold text-red-600">{receiptData.forfeitReason}</p>
                </div>
              )}

              <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8 sm:mt-12 print:mt-16">
                <p>This is a system generated receipt.</p>
                <p className="mt-1">Collected By: {receiptData.collectedBy?.name || 'Admin'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

