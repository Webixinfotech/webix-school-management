import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getDashboardAPI, getLowStockReportAPI, getMonthlyExpenseReportAPI } from '../../api/inventoryApi';
import { getMyTeacherProfileAPI } from '../../../../api/teachers';
import { useAuth } from '../../../../context/AuthContext';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { user } = useAuth();
  const role = user?.role || 'admin';
  const [teacherPermissions, setTeacherPermissions] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const basePath = location.pathname.startsWith('/teacher') ? '/teacher/inventory' : '/admin/inventory';

  useEffect(() => {
    fetchDashboard();
  }, [role, startDate, endDate]);

  useEffect(() => {
    if (role === 'teacher') {
      fetchTeacherPermissions();
    }
  }, [role]);

  const fetchTeacherPermissions = async () => {
    try {
      const res = await getMyTeacherProfileAPI();
      const profileData = res.data?.data || res.data || {};
      setTeacherPermissions(profileData.permissions || {});
    } catch (err) {
      console.error('Failed to fetch teacher profile for permissions', err);
      setTeacherPermissions({});
    }
  };

  const fetchDashboard = async () => {
    try {
      const [dashRes, lowStockRes, revenueRes] = await Promise.all([
        getDashboardAPI(),
        getLowStockReportAPI(),
        getMonthlyExpenseReportAPI(startDate && endDate ? { startDate, endDate } : undefined),
      ]);
      setStats({
        ...dashRes.data?.data,
        lowStockCount: lowStockRes.data?.count ?? 0,
        recentRevenue: revenueRes.data?.data?.salesRevenue ?? 0,
      });
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data. Ensure the backend server is running and reachable.');
    } finally {
      setLoading(false);
    }
  };

  const navCards = [
    {
      title: 'Library Desk',
      description: 'Issue books, process returns, and handle renewals',
      path: `${basePath}/library-desk`,
      color: 'from-teal-400 to-emerald-500',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
      requiredPerms: ['canManageLibraryIssue']
    },
    {
      title: 'Item Master',
      description: 'Manage all books, uniforms, and stationery in catalog',
      path: `${basePath}/items`,
      color: 'from-blue-500 to-indigo-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />,
      requiredPerms: ['canManageInventoryCatalog', 'canManageLibraryCatalog']
    },
    {
      title: 'Item Categories',
      description: 'Organize items into distinct library & store categories',
      path: `${basePath}/categories`,
      color: 'from-purple-500 to-fuchsia-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      requiredPerms: ['canManageInventoryCatalog', 'canManageLibraryCatalog']
    },
    {
      title: 'Stock In',
      description: 'Record new purchases and inbound stock deliveries',
      path: `${basePath}/stock-in`,
      color: 'from-pink-500 to-rose-600',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      requiredPerms: ['canManageInventoryStockIn']
    },
    {
      title: 'Approval Queue',
      description: 'Review and approve stock-out requests from staff',
      path: `${basePath}/approvals`,
      color: 'from-amber-400 to-orange-500',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />,
      requiredPerms: []
    },
    {
      title: 'Deposits Ledger',
      description: 'Manage refundable security deposits for students',
      path: `${basePath}/deposits`,
      color: 'from-cyan-400 to-blue-500',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
      requiredPerms: ['canManageLibraryIssue', 'canViewLibraryReports']
    },
    {
      title: 'Bulk Upload',
      description: 'Import multiple items quickly via Excel sheets',
      path: `${basePath}/bulk-upload`,
      color: 'from-gray-600 to-slate-800',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
      requiredPerms: ['canManageInventoryCatalog', 'canManageLibraryCatalog']
    },
    {
      title: 'Reports & Analytics',
      description: 'View overdue returns, low stock alerts, and expenses',
      path: `${basePath}/reports`,
      color: 'from-red-500 to-rose-700',
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      requiredPerms: ['canViewInventoryReports', 'canViewLibraryReports']
    }
  ].filter(card => {
    if (role !== 'teacher') return true; // admin sees everything
    if (card.requiredPerms.length === 0) return false;
    if (!teacherPermissions) return false; // wait for fetch
    return card.requiredPerms.some(p => teacherPermissions?.[p] === true);
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory & Library Hub</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium max-w-2xl">
            Centralized control center for managing school assets, library lending, catalog, and stock movements.
          </p>
        </div>
        <div className="flex gap-2">
          {/* <button 
            onClick={() => navigate(`${basePath}/library-desk`)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-md shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Open Desk
          </button> */}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2 border border-red-100">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {navCards.map((card, i) => (
          <Link 
            key={i} 
            to={card.path}
            className="group relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-2xl -mr-8 -mt-8 group-hover:opacity-20 transition-opacity`}></div>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center mb-3 shadow-sm transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {card.icon}
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{card.title}</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed flex-1">{card.description}</p>
            <div className="mt-4 flex items-center text-xs font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
              Access Module 
              <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Statistics Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            </span>
            Overview Analytics
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-0 text-sm font-medium text-slate-700" 
            />
            <span className="text-slate-400 font-medium text-sm">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-0 text-sm font-medium text-slate-700" 
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-48 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-slate-500 font-medium">Loading analytics...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Top KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total Value</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-slate-800">₹{stats.totalStockValue?.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Revenue (Month)</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-emerald-600">₹{stats.recentRevenue?.toLocaleString() || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Catalog Items</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-slate-800">{stats.totalActiveItems || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-amber-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Active Loans</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-amber-500">{stats.activeBorrows || 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Overdue</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-red-500">{stats.overdueBorrows || 0}</p>
                  {stats.overdueBorrows > 0 && <span className="flex w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>}
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-rose-50 rounded-full blur-2xl -mr-6 -mt-6"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                  </div>
                  <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Low Stock</p>
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-black text-rose-500">{stats.lowStockCount || 0}</p>
                </div>
              </div>
            </div>

            {/* Middle Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Category Breakdown */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  Category Breakdown
                </h3>
                
                {stats.categoryBreakdown?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {stats.categoryBreakdown.map((cat) => (
                      <div key={cat._id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-slate-800 text-lg">{cat.categoryName}</p>
                            <p className="text-xs font-medium text-slate-500">{cat.itemCount} unique items</p>
                          </div>
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-md">
                            {((cat.totalValue / stats.totalStockValue) * 100).toFixed(1)}% of value
                          </span>
                        </div>
                        <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-200">
                          <div>
                            <p className="text-xs uppercase font-bold text-slate-400 mb-0.5">Total Stock</p>
                            <p className="font-bold text-slate-700">{cat.totalStock} units</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs uppercase font-bold text-slate-400 mb-0.5">Total Value</p>
                            <p className="font-bold text-emerald-600 text-lg">₹{cat.totalValue?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No category data available.</p>
                  </div>
                )}
              </div>
              
              {/* Action Items / Requests */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Action Items
                </h3>
                
                <div className="space-y-4">
                  <Link to={`${basePath}/approvals`} className="flex items-center justify-between p-4 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-colors border border-orange-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-105 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Pending Approvals</p>
                        <p className="text-sm text-slate-500">Staff stock-out requests</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-orange-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                      {stats.pendingIssueRequests || 0}
                    </span>
                  </Link>

                  <Link to={`${basePath}/reports`} className="flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors border border-red-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-500 shadow-sm group-hover:scale-105 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Overdue Returns</p>
                        <p className="text-sm text-slate-500">Books past due date</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-red-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                      {stats.overdueBorrows || 0}
                    </span>
                  </Link>

                  <Link to={`${basePath}/reports`} className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-100 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm group-hover:scale-105 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Low Stock Alerts</p>
                        <p className="text-sm text-slate-500">Items needing restock</p>
                      </div>
                    </div>
                    <span className="text-xl font-black text-rose-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                      {stats.lowStockCount || 0}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
            
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No analytics data available at the moment.</p>
          </div>
        )}
      </div>

    </div>
  );
}
