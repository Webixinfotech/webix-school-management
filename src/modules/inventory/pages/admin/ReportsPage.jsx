import React, { useState, useEffect } from 'react';
import { 
  getOverdueReportAPI, 
  getLowStockReportAPI, 
  getMonthlyExpenseReportAPI,
  getStockInHistoryAPI
} from '../../api/inventoryApi';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('overdue'); // overdue | lowstock | expense
  const [data, setData] = useState([]);
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters for Expense Report
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport();
  }, [activeTab, month, year]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (activeTab === 'overdue') {
        const res = await getOverdueReportAPI();
        setData(res?.data?.data || []);
      } else if (activeTab === 'lowstock') {
        const res = await getLowStockReportAPI();
        setData(res?.data?.data || []);
      } else if (activeTab === 'expense') {
        const [expenseRes, stockInRes] = await Promise.all([
          getMonthlyExpenseReportAPI({ month, year }),
          getStockInHistoryAPI({ limit: 1000 })
        ]);
        setExpenseSummary(expenseRes?.data?.data || {});
        const history = stockInRes?.data?.data || [];
        const filtered = history.filter(row => {
          if (!row.createdAt) return false;
          const d = new Date(row.createdAt);
          return (d.getMonth() + 1) === month && d.getFullYear() === year;
        });
        setData(filtered);
      }
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${activeTab} report data`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto printable-area">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Inventory Reports</h1>
          <p className="text-slate-500 mt-1 font-medium">Analyze library loans, stock levels, and expenses</p>
        </div>
        <button
          onClick={handlePrint}
          className="no-print bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Report
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 no-print">
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'overdue' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('overdue')}
        >
          Overdue Returns
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'lowstock' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('lowstock')}
        >
          Low Stock Alerts
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'expense' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('expense')}
        >
          Monthly Expense
        </button>
      </div>

      {activeTab === 'expense' && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-4 items-center no-print w-fit">
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700 text-sm">Month:</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border-2 border-slate-100 focus:border-indigo-500 font-medium text-slate-800"
            >
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="font-bold text-slate-700 text-sm">Year:</label>
            <input 
              type="number" 
              value={year} 
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="w-24 px-3 py-2 rounded-lg border-2 border-slate-100 focus:border-indigo-500 font-medium text-slate-800"
            />
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none">
          <div className="hidden print:block p-4 border-b border-slate-200 mb-4">
            <h2 className="text-2xl font-bold">
              {activeTab === 'overdue' && 'Overdue Returns Report'}
              {activeTab === 'lowstock' && 'Low Stock Alerts Report'}
              {activeTab === 'expense' && `Expense Report (${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })})`}
            </h2>
            <p className="text-slate-500 text-sm">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {activeTab === 'expense' && expenseSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Stock-In Expense</div>
                <div className="text-2xl font-black text-slate-800 mt-1">₹{expenseSummary.stockInExpense || 0}</div>
                <div className="text-xs text-slate-400 mt-1">{expenseSummary.stockInEntryCount || 0} Entries</div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Sales Revenue</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">₹{expenseSummary.salesRevenue || 0}</div>
                <div className="text-xs text-slate-400 mt-1">{expenseSummary.saleCount || 0} Sales</div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {activeTab === 'overdue' && (
                <>
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold print:bg-transparent">
                      <th className="p-4 pl-6">User</th>
                      <th className="p-4">Item</th>
                      <th className="p-4">Due Date</th>
                      <th className="p-4">Days Overdue</th>
                      <th className="p-4 text-right pr-6">Est. Fine</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.length === 0 ? (
                      <tr><td colSpan="5" className="p-12 text-center text-slate-400">No overdue items.</td></tr>
                    ) : (
                      data.map((row, i) => {
                        const due = new Date(row.dueDate);
                        const today = new Date();
                        const diffTime = Math.abs(today - due);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 font-bold text-slate-800">{row.parent?.name || row.parent?.firstName || 'Unknown'}</td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800">{row.item?.name}</p>
                            </td>
                            <td className="p-4 text-red-600 font-bold">{due.toLocaleDateString()}</td>
                            <td className="p-4 font-bold text-slate-700">{diffDays} days</td>
                            <td className="p-4 pr-6 text-right text-slate-500 text-sm italic">Manual</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'lowstock' && (
                <>
                  <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold print:bg-transparent">
                        <th className="p-4 pl-6">Item Name</th>
                        <th className="p-4">Current Stock</th>
                        <th className="p-4">Category</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!Array.isArray(data) || data.length === 0) ? (
                      <tr><td colSpan="3" className="p-12 text-center text-slate-400">No items are low on stock.</td></tr>
                    ) : (
                      data.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="p-4 pl-6 font-bold text-slate-800">{row.name}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                              {row.currentStock} Left
                            </span>
                          </td>
                          <td className="p-4 font-bold text-slate-600">{row.category?.name || 'N/A'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </>
              )}

              {activeTab === 'expense' && (
                <>
                  <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold print:bg-transparent">
                        <th className="p-4 pl-6">Date</th>
                        <th className="p-4">Item</th>
                        <th className="p-4 text-center">Qty Purchased</th>
                        <th className="p-4">Vendor</th>
                        <th className="p-4 text-right pr-6">Total Cost</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!Array.isArray(data) || data.length === 0) ? (
                      <tr><td colSpan="5" className="p-12 text-center text-slate-400">No expenses recorded for this period.</td></tr>
                    ) : (
                      <>
                        {data.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50/50">
                            <td className="p-4 pl-6 font-bold text-slate-700">{new Date(row.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 font-bold text-slate-800">{row.item?.name || 'Unknown'}</td>
                            <td className="p-4 text-center font-bold text-slate-700">{row.quantityAdded}</td>
                            <td className="p-4 text-slate-600 font-medium">{row.vendor?.name || row.vendorName || '-'}</td>
                            <td className="p-4 pr-6 text-right font-bold text-slate-900">₹{(row.totalCost || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan="4" className="p-4 pl-6 text-right uppercase tracking-wider text-slate-500">Total Monthly Expense</td>
                          <td className="p-4 pr-6 text-right text-xl text-slate-900">
                            ₹{data.reduce((sum, row) => sum + (row.totalCost || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
