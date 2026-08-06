import React, { useState, useEffect } from 'react';
import { getStockInHistoryAPI, recordStockInAPI, getItemsAPI } from '../../api/inventoryApi';
import Toast, { useToast } from '../../components/Toast';
import ItemSearchSelect from '../../components/ItemSearchSelect';

export default function StockInPage() {
  const { toast, showToast, hideToast } = useToast();
  const [history, setHistory] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemId: '',
    quantityAdded: 1,
    packets: 1,
    itemsPerPacket: 1,
    totalCost: 0,
    vendorName: '',
    billNumber: '',
    billDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchHistory();
  }, [page]);

  useEffect(() => {
    if (isModalOpen && items.length === 0) {
      fetchItems();
    }
  }, [isModalOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await getStockInHistoryAPI({ page, limit: 10 });
      setHistory(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load stock-in history');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await getItemsAPI({ limit: 1000 }); // Get all items for dropdown, or use an autocomplete
      setItems(res.data?.data || []);
    } catch (err) {
      console.error("Items fetch failed", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.quantityAdded < 1) {
      showToast('error', "Quantity must be at least 1");
      return;
    }
    try {
      setSubmitting(true);
      
      const payload = {
        itemId: formData.itemId,
        quantityAdded: formData.quantityAdded,
        packetCount: formData.packets,
        piecesPerPacket: formData.itemsPerPacket,
        totalCost: formData.totalCost,
        vendorName: formData.vendorName,
        billNumber: formData.billNumber,
        notes: formData.notes
      };
      
      if (formData.billDate) {
        payload.billDate = formData.billDate;
      }

      await recordStockInAPI(payload);
      setIsModalOpen(false);
      setFormData({
        itemId: '',
        quantityAdded: 1,
        packets: 1,
        itemsPerPacket: 1,
        totalCost: 0,
        vendorName: '',
        billNumber: '',
        billDate: '',
        notes: ''
      });
      setPage(1);
      await fetchHistory();
      showToast('success', 'Stock added successfully.');
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to record stock-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemSelect = (id) => {
    setFormData({ ...formData, itemId: id });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <Toast toast={toast} onClose={hideToast} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Stock Entry</h1>
          <p className="text-slate-500 mt-1 font-medium">Record new stock arriving at the inventory</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Record Stock-In
          </button>
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
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4 pl-6">Date & Recorded By</th>
                      <th className="p-4">Item & Quantity</th>
                      <th className="p-4">Vendor & Invoice</th>
                      <th className="p-4">Stock Status & Cost</th>
                      <th className="p-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-slate-400 font-medium">
                          No stock-in records found.
                        </td>
                      </tr>
                    ) : (
                      history.map((record) => (
                        <tr key={record._id} className="hover:bg-slate-50/50 transition-colors align-top">
                          <td className="p-4 pl-6 whitespace-nowrap">
                            <p className="font-bold text-slate-700">{new Date(record.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-500 font-medium mt-1">{new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p className="text-xs text-indigo-600 font-medium mt-2">{record.recordedBy?.name || 'Admin'}</p>
                          </td>
                          <td className="p-4 max-w-[220px]">
                            <p className="font-bold text-slate-800 truncate" title={record.item?.name}>{record.item?.name || 'Unknown Item'}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
                                +{record.quantityAdded} {record.item?.unit || ''}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                              ({record.packetCount || 1} {record.packetCount > 1 ? 'pkts' : 'pkt'} × {record.piecesPerPacket || 1} pcs)
                            </p>
                          </td>
                          <td className="p-4 max-w-[200px]">
                            <p className="font-bold text-slate-700 text-sm truncate" title={record.vendor?.name || record.vendorName || '-'}>
                              {record.vendor?.name || record.vendorName || '-'}
                            </p>
                            {(record.vendor?.contact || record.vendorContact) && (
                              <p className="text-xs text-slate-500 mt-1">{record.vendor?.contact || record.vendorContact}</p>
                            )}
                            <p className="text-xs font-medium text-slate-600 mt-2">
                              Bill: <span className="font-bold">{record.billNumber || '-'}</span>
                            </p>
                            {record.billDate && (
                              <p className="text-xs text-slate-500">Date: {new Date(record.billDate).toLocaleDateString()}</p>
                            )}
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <p className="font-bold text-slate-800">₹{(record.totalCost || 0).toLocaleString()}</p>
                            {(record.stockBefore !== undefined && record.stockAfter !== undefined && record.stockBefore !== null) && (
                              <div className="mt-2 text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                <span>Stock:</span>
                                <span className="line-through text-slate-400">{record.stockBefore}</span>
                                <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                <span className="font-bold text-emerald-600">{record.stockAfter}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 max-w-[250px]">
                            <p className="text-xs text-slate-600 font-medium break-words line-clamp-3" title={record.notes}>
                              {record.notes || '-'}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {history.length === 0 ? (
                <div className="col-span-full p-12 text-center text-slate-400 font-medium bg-white rounded-2xl shadow-sm border border-slate-100">
                  No stock-in records found.
                </div>
              ) : (
                history.map((record) => (
                  <div key={record._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 truncate" title={record.item?.name}>{record.item?.name}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {record.packetCount || 1} {record.packetCount > 1 ? 'pkts' : 'pkt'} × {record.piecesPerPacket || 1} pcs
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                        +{record.quantityAdded} {record.item?.unit || ''}
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vendor</p>
                          <p className="font-bold text-slate-800 text-sm truncate" title={record.vendor?.name || record.vendorName}>
                            {record.vendor?.name || record.vendorName || '-'}
                          </p>
                          {(record.vendor?.contact || record.vendorContact) && (
                            <p className="text-xs text-slate-500">{record.vendor?.contact || record.vendorContact}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Cost</p>
                          <p className="font-black text-slate-800 text-sm">₹{(record.totalCost || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Bill Details</p>
                          <p className="font-bold text-slate-700 text-sm">
                            {record.billNumber || '-'}
                          </p>
                          {record.billDate && (
                            <p className="text-xs text-slate-500">{new Date(record.billDate).toLocaleDateString()}</p>
                          )}
                        </div>
                        {(record.stockBefore !== undefined && record.stockAfter !== undefined && record.stockBefore !== null) && (
                          <div className="text-right">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Stock Update</p>
                            <div className="flex items-center justify-end gap-1.5 text-sm mt-0.5">
                              <span className="line-through text-slate-400 font-medium">{record.stockBefore}</span>
                              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                              <span className="font-bold text-emerald-600">{record.stockAfter}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date & Recorded By</p>
                        <div className="flex justify-between items-end">
                          <p className="font-bold text-slate-700 text-sm">{new Date(record.createdAt).toLocaleDateString()} {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="text-xs text-indigo-600 font-bold">{record.recordedBy?.name || 'Admin'}</p>
                        </div>
                      </div>
                      
                      {record.notes && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Notes</p>
                          <p className="text-xs text-slate-600 font-medium break-words line-clamp-2" title={record.notes}>
                            {record.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800">Record Stock-In</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors shadow-sm border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Item</label>
                  <ItemSearchSelect
                    items={items}
                    value={formData.itemId}
                    onChange={handleItemSelect}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Packets / Boxes</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.packets}
                      onChange={(e) => {
                        const packets = parseInt(e.target.value) || 1;
                        setFormData({...formData, packets, quantityAdded: packets * formData.itemsPerPacket});
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Items per Packet</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.itemsPerPacket}
                      onChange={(e) => {
                        const itemsPerPacket = parseInt(e.target.value) || 1;
                        setFormData({...formData, itemsPerPacket, quantityAdded: formData.packets * itemsPerPacket});
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Total Quantity Added</p>
                    <p className="text-xs font-medium text-emerald-600">({formData.packets} packets × {formData.itemsPerPacket} items)</p>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-700">{formData.quantityAdded}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Total Cost (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalCost}
                      onChange={(e) => setFormData({...formData, totalCost: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Vendor Name</label>
                    <input
                      type="text"
                      value={formData.vendorName}
                      onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                      placeholder="Vendor Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Bill Number / Invoice #</label>
                    <input
                      type="text"
                      value={formData.billNumber}
                      onChange={(e) => setFormData({...formData, billNumber: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                      placeholder="INV-XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Bill Date</label>
                  <input
                    type="date"
                    value={formData.billDate}
                    onChange={(e) => setFormData({...formData, billDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800 resize-none"
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
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  {submitting ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
