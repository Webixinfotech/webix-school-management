import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Toast from '../../components/photos/Toast';

// ─── Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Check:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Error:    () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Spinner:  () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>,
  Logout:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Camera:   () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Eye:      () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  Lock:     () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  School:   () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

// ─── Main Component ────────────────────────────────────────────────────────
const AdminSettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading]     = useState(false);
  const [toast, setToast]         = useState(null);


  const handleLogout = async () => {
    setLoading(true);
    try { await logout(); navigate('/login'); }
    catch { localStorage.clear(); navigate('/login'); }
    finally { setLoading(false); }
  };

  // Tab config — internal tabs rendered here; route tabs navigate away
  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤', internal: true },
    // { id: 'fee-hub', label: 'Fee Hub', icon: '💳', internal: false, route: '/admin/fee-hub' },
    { id: 'notifs', label: 'Notifications', icon: '🔔', internal: false, route: '/admin/notifications' },
    { id: 'calendar', label: 'Calendar', icon: '📅', internal: false, route: '/admin/calendar' },
    { id: 'academic-sessions', label: 'Academic Sessions', icon: '🎓', internal: false, route: '/admin/academic-sessions' },
  ];

  const activeTabCls = 'border-b-2 border-primary text-primary bg-primary/10 font-semibold';
  const inactiveTabCls = 'border-b-2 border-transparent text-slate-500 hover:text-primary hover:bg-primary/5';

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Logo chip */}
            <div className="flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
              Zorix School
            </div>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-slate-500 text-sm">Dashboard</span>
            <span className="text-slate-300 text-sm">/</span>
            <span className="text-slate-800 text-sm font-semibold">Settings</span>
          </div>

          <button onClick={handleLogout} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20
              rounded-lg text-xs font-bold transition-colors disabled:opacity-50">
            <Icons.Logout />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <div className="bg-white border-b border-slate-100 sticky top-14 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => tab.internal ? setActiveTab(tab.id) : navigate(tab.route)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm whitespace-nowrap transition-all duration-150
                ${tab.internal && activeTab === tab.id ? activeTabCls : inactiveTabCls}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-800">Profile Settings</h1>
              <p className="text-sm text-slate-400 mt-1">View your personal information.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              {/* Avatar row */}
              <div className="flex items-center gap-4 p-4 mb-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center text-white text-2xl font-bold shadow shadow-primary/30">
                  {(user?.name || 'Admin User AJ').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800">{user?.name || 'Admin User AJ'}</p>
                  <p className="text-slate-400 text-sm">{user?.email || 'admin@brainbuilder.com'}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-bold">Administrator</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">● Active</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: user?.name || 'Admin User AJ' },
                  { label: 'Email Address', value: user?.email || 'admin@brainbuilder.com' },
                  { label: 'Phone Number', value: user?.phone || '8888888888' },
                  { label: 'Role', value: user?.role === 'admin' ? 'Admin' : user?.role || 'Admin' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                    <p className="mt-2 break-words text-base font-bold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminSettingsPage;
