import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/enquiries', label: 'Enquiries' },
  { to: '/dashboard/programs', label: 'Programs' },
  { to: '/dashboard/teachers', label: 'Staff' },
  { to: '/dashboard/students', label: 'Students' },
  { to: '/dashboard/appointments', label: 'Appointments' },
  { to: '/dashboard/followups', label: 'Follow-ups' },
  { to: '/dashboard/settings', label: 'Settings' },
];

const teacherLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/enquiries', label: 'My Enquiries' },
  { to: '/dashboard/appointments', label: 'Appointments' },
];

const counselorLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/enquiries', label: 'Leads' },
  { to: '/dashboard/appointments', label: 'Appointments' },
  { to: '/dashboard/followups', label: 'Follow-ups' },
];

export default function DashboardLayout() {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || '');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('userRole')) {
      navigate('/login');
    } else {
      setRole(localStorage.getItem('userRole'));
    }
  }, [navigate]);

  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : role === 'counselor' ? counselorLinks : adminLinks;

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="dashboard-shell" style={{ gridTemplateColumns: '16rem 1fr' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`dashboard-sidebar w-64 bg-slate-800 text-white transform transition-transform lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <Link to="/dashboard" className="font-bold text-[#29A9E1]">Zorix School Admin</Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
            <span className="text-xl">×</span>
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/dashboard'}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-lg text-sm font-medium ${isActive ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="dashboard-main flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2">
            <span className="text-2xl">☰</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 capitalize">{role}</span>
            <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-[#E82928]">Logout</button>
          </div>
        </header>
        <main className="dashboard-content flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
