import React, { useState, useEffect } from 'react';
import { getMyStockOutRequestsAPI, getMyStockOutItemsAPI, getItemsAPI } from '../../api/inventoryApi';
import { Link } from 'react-router-dom';

export default function TeacherMyRequestsPage() {
  const [activeTab, setActiveTab] = useState('browse'); // browse | requests | items
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [requests, setRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'browse') {
        const res = await getItemsAPI({ limit: 200 });
        const allItems = res.data?.data || [];
        setCatalogItems(allItems.filter(i => i.isPublic === false));
      } else if (activeTab === 'requests') {
        const res = await getMyStockOutRequestsAPI();
        setRequests(res.data?.data || []);
      } else if (activeTab === 'items') {
        const res = await getMyStockOutItemsAPI();
        setItems(res.data?.data || []);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700">PENDING</span>;
      case 'approved':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700">APPROVED</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return url;
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Inventory</h1>
          <p className="text-slate-500 mt-1 font-medium">Track your requests and currently held items</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {activeTab !== 'browse' && (
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
          )}

          <Link
            to="/teacher/inventory/request-item"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Request
          </Link>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'browse' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('browse')}
        >
          Browse Items
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'requests' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('requests')}
        >
          My Requests
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'items' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('items')}
        >
          My Items
        </button>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {activeTab === 'browse' ? (
            catalogItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                No items available right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {catalogItems.map((item) => {
                  return (
                    <div key={item._id} className="border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col">
                      <div className="h-40 bg-slate-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                        {item.photo ? (
                          <img src={getImageUrl(item.photo)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        )}
                      </div>
                      <p className="font-bold text-slate-800 mb-1">{item.name}</p>
                      <p className="text-xs text-slate-500 mb-2">{item.category?.name || ''} {item.itemTypes?.join(', ')}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="font-extrabold text-slate-900">₹{item.sellingPrice || 0}</p>
                          <p className={`text-xs font-bold ${item.currentStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {item.currentStock > 0 ? `In Stock (${item.currentStock})` : 'Out of Stock'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'requests' || activeTab === 'items' ? (
            <div className="bg-slate-50">
              {activeTab === 'requests' && (
                <div className="p-4 bg-amber-50 text-amber-700 text-sm font-medium border-b border-amber-100 flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Note: Detailed history for Approved/Rejected requests may be temporarily unavailable.
                </div>
              )}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                        <th className="p-4 pl-6">Date</th>
                        <th className="p-4">Item Details</th>
                        <th className="p-4 text-center">Qty</th>
                        <th className="p-4">Status / Type</th>
                        <th className="p-4">Purpose & Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(activeTab === 'requests' ? requests : items).length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-slate-400 font-medium">
                            {activeTab === 'requests' ? 'You have not made any requests yet.' : 'You don\'t have any items issued to you.'}
                          </td>
                        </tr>
                      ) : (
                        (activeTab === 'requests' ? requests : items).map((item) => (
                          <tr key={item._id} className="hover:bg-slate-50/50 transition-colors align-top">
                            <td className="p-4 pl-6 whitespace-nowrap">
                              <p className="font-bold text-slate-700">{new Date(item.createdAt).toLocaleDateString()}</p>
                              <p className="text-xs text-slate-500 font-medium mt-1">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </td>
                            <td className="p-4 max-w-[200px]">
                              <p className="font-bold text-slate-800 truncate" title={item.item?.name}>{item.item?.name || 'Unknown Item'}</p>
                              {item.item?.unit && <p className="text-xs text-slate-500 font-medium">{item.item.unit}</p>}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                                {item.quantity}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col gap-2 items-start">
                                {getStatusBadge(item.status)}
                                {item.isDirectIssue && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">DIRECT ISSUE</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 max-w-[250px]">
                              <p className="text-sm font-medium text-slate-600 line-clamp-2 break-words" title={item.purpose || item.note}>
                                {item.purpose || item.note || '-'}
                              </p>
                              {item.decisionNote && (
                                <p className="text-xs text-slate-500 italic mt-2">
                                  <span className="font-bold">Reply:</span> {item.decisionNote}
                                </p>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                  {(activeTab === 'requests' ? requests : items).length === 0 ? (
                    <div className="col-span-full p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm">
                      {activeTab === 'requests' ? 'You have not made any requests yet.' : 'You don\'t have any items issued to you.'}
                    </div>
                  ) : (
                    (activeTab === 'requests' ? requests : items).map((item) => (
                      <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate" title={item.item?.name}>{item.item?.name}</p>
                            {item.item?.unit && <p className="text-xs text-slate-500 font-medium">{item.item.unit}</p>}
                          </div>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                            Qty: {item.quantity}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(item.status)}
                          {item.isDirectIssue && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">DIRECT ISSUE</span>
                          )}
                        </div>

                        <div className="border-t border-slate-100 pt-3 space-y-3 mt-auto">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Purpose</p>
                            <p className="text-sm font-medium text-slate-700 line-clamp-2 break-words" title={item.purpose || item.note}>
                              {item.purpose || item.note || '-'}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Date</p>
                            <p className="text-sm font-bold text-slate-700">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          {item.decisionNote && (
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Approver Note</p>
                              <p className="text-xs font-medium text-slate-600 italic">"{item.decisionNote}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
