import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import logo from '../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp';
import { getMyTeacherProfileAPI } from '../api/teachers';
import { getNotificationDestination } from '../utils/notificationNavigation';
import GlobalSearch from '../components/admin/GlobalSearch';

const SW_OPEN  = 264;
const SW_CLOSE = 72;

const MENU = [
  { path: '/teacher',              label: 'Dashboard', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  // My Classes: deliberately NOT permission-gated. It (and the class/roster
  // data it exposes) is shared by Attendance, Daily Activity, and Students,
  // so gating it here would silently break those pages too. Always visible.
  { path: '/teacher/classes',      label: 'My Classes',  d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  // Reuses the existing canManageStudents flag (already the real backend
  // guard on create/edit student routes) rather than inventing a new one.
  { path: '/teacher/students',     label: 'Students', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-4-5.659M13 7a4 4 0 11-8 0 4 4 0 018 0z', permKey: 'canManageStudents' },
  { path: '/teacher/attendance',   label: 'Student Attendance', d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', permKey: 'canMarkAttendance', loadingDefault: true },
  { path: '/teacher/my-attendance', label: 'My Attendance', d: 'M12 15v2m-6 0h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z' },
  // Scanner side of the ID-card proxy-attendance flow — only for admin-
  // designated scanners (staff without a phone can't self-scan, so this
  // permission-holder marks their attendance on their behalf instead).
  { path: '/teacher/scan-employee-attendance', label: 'Scan Employee ID Card', d: 'M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v11z M16 13a4 4 0 11-8 0 4 4 0 018 0z', permKey: 'canScanEmployeeQR' },
  { path: '/teacher/daily-activity', label: 'Daily Activity', d: 'M6 8h12M6 12h12M6 16h12M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z', permKey: 'canManageDailyActivity', loadingDefault: true },
  // Either the narrow read-only flag or full Fee Hub access unlocks this.
  { path: '/teacher/fee-status',   label: 'Fee Status', d: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm3 3h6v2H9V9zm0 4h6v2H9v-2z', permKeys: ['canViewFeeInfo', 'canManageFees'] },
  { path: '/teacher/birthdays',    label: 'Birthdays', d: 'M12 8v8m0 4a6 6 0 110-12 0 6 6 0 0112 0zm6-6a3 3 0 11-6 0 3 3 0 016 0z', permKey: 'canViewBirthdays', loadingDefault: true },
  { path: '/teacher/certificates', label: 'Certificates', d: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', permKey: 'canManageCertificates', loadingDefault: true },
  { path: '/teacher/my-documents', label: 'My Documents', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/teacher/photos',       label: 'Photos', d: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/teacher/notifications', label: 'Notifications', d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  // ── Admin-equivalent screens, only shown when the matching permission is on ──
  { path: '/teacher/fee-hub',      label: 'Fee Hub',  d: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm3 3h6v2H9V9zm0 4h6v2H9v-2z', permKey: 'canManageFees' },
  { path: '/teacher/manage-students',  label: 'Manage Students', d: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-4-5.659M13 7a4 4 0 11-8 0 4 4 0 018 0z', permKey: 'canManageStudents' },
  { path: '/teacher/manage-employees', label: 'Manage Employees', d: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-8a4 4 0 110 8 4 4 0 010-8z', permKey: 'canManageEmployees' },
  { path: '/teacher/manage-enquiries', label: 'Enquiries',  d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', permKey: 'canManageEnquiries' },
  { path: '/teacher/manage-birthdays', label: 'Manage Birthdays', d: 'M12 8v8m0 4a6 6 0 110-12 0 6 6 0 0112 0zm6-6a3 3 0 11-6 0 3 3 0 016 0z', permKey: 'canManageBirthdays' },
  { path: '/teacher/calendar', label: 'Event Scheduler', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', permKey: 'canManageCalendar' },
  { path: '/teacher/profile',      label: 'Profile', d: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  // ── Inventory & Library Module ──
  // { path: '/teacher/inventory/catalog', label: 'School Store', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { path: '/teacher/inventory/my-requests', label: 'My Requests', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { path: '/teacher/inventory/dashboard', label: 'Inventory Admin', d: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', permKeys: [
    'canViewLibraryReports', 'canViewInventoryReports',
    'canManageLibraryCatalog', 'canManageLibraryIssue',
    'canManageInventoryCatalog', 'canManageInventoryStockIn', 'canManageInventoryStockOut',
  ] },
];

const getNotificationIcon = (type) => {
  switch (type) {
    case 'photo':
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    case 'schedule':
      return 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';
    case 'message':
      return 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z';
    case 'attendance':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    default:
      return 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z';
  }
};

export default function TeacherLayout() {
  const [open, setOpen]           = useState(true);
  const [mob, setMob]             = useState(false);
  const [hov, setHov]             = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [permissions, setPermissions] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const bellRef                   = useRef(null);
  const {
    notifications: notificationsList = [],
    unreadCount: apiUnreadCount = 0,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification: dismissNotif,
    clearReadNotifications,
    push,
  } = useNotifications();

  const { user, logout, isAuthenticated } = useAuth();
  const loc      = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
    else if (user?.role !== 'teacher') navigate(`/${user?.role || 'login'}`);
  }, [isAuthenticated, user, navigate]);
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await getMyTeacherProfileAPI();
        const profileData = res.data?.data || res.data || {};
        setPermissions(profileData.permissions || {});
        setTeacherProfile(profileData);
      } catch (err) {
        console.error('Failed to fetch teacher profile', err);
        setPermissions({});
      }
    };
    
    fetchProfileData();
  }, [isAuthenticated]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated || user?.role !== 'teacher') return null;

  const unreadCount = apiUnreadCount || 0;
  const handleNotifClick = async (n) => {
    if (!n.isRead) {
      await markAsRead(n._id);
    }
    await dismissNotif(n._id);
    const destination = getNotificationDestination(n, user?.role);
    if (destination) {
      navigate(destination);
    }
    setNotifOpen(false);
  };

  const handleDismissClick = async (e, id) => {
    e.stopPropagation();
    await dismissNotif(id);
  };

  const isActive = (p) => p === '/teacher' ? loc.pathname === '/teacher' : loc.pathname.startsWith(p);
  const activeItem = MENU.find(m => isActive(m.path));

  const effectivePermissions = user?.permissions || permissions;

  // Global search sirf usi data ko dhundta hai jiski teacher ko permission hai.
  // Jab tak permissions load nahi ho jati, sab false rehta hai (search chhupa rehta
  // hai) taaki koi bhi unauthorized category flash na ho.
  const searchScopes = {
    students: effectivePermissions?.canManageStudents === true,
    employees: effectivePermissions?.canManageEmployees === true,
    enquiries: effectivePermissions?.canManageEnquiries === true,
  };
  const canSearchAnything = searchScopes.students || searchScopes.employees || searchScopes.enquiries;

  const visibleMenu = MENU.filter(item => {
    if (item.path === '/teacher/photos') {
      // Jab tak load na ho jaye, true manenge to prevent blink/jump, permission false aane par hide kar dega
      return effectivePermissions === null ? true : effectivePermissions.canUploadPhotos;
    }
    if (item.permKeys) {
      // Multiple keys = OR check (e.g. Fee Status: narrow read flag OR full Fee Hub access)
      if (effectivePermissions === null) return !!item.loadingDefault;
      return item.permKeys.some((k) => effectivePermissions[k] === true);
    }
    if (item.permKey) {
      // Admin-equivalent screens (Fee Hub, Manage Students, etc.) — hidden
      // until we know for sure the permission is on, since these lead to
      // /admin/* screens that assume real access. Items that opt in via
      // loadingDefault (permissions that default to true on the backend)
      // show immediately instead, to avoid a flash of a nav item that then
      // disappears for the common case.
      if (effectivePermissions === null) return !!item.loadingDefault;
      return effectivePermissions[item.permKey] === true;
    }
    return true;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .tl-shell { display: flex; height: 100vh; overflow: hidden; background: #F0FFF4; font-family: 'Nunito', sans-serif; }
        .tl-aside {
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 50;
          display: flex; flex-direction: column; overflow: hidden;
          background: linear-gradient(180deg, #0C2A47 0%, #081A2E 45%, #030B15 100%);
          box-shadow: 4px 0 32px rgba(0,0,0,0.45), inset -1px 0 0 rgba(226,185,77,0.07);
          transition: width .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1);
          transform: translateX(0);
        }
        .tl-main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; transition: margin-left .3s cubic-bezier(.4,0,.2,1); }
        .tl-orb { position: absolute; border-radius: 50%; pointer-events: none; }
        .tl-logo { height: 68px; flex-shrink: 0; display: flex; align-items: center; padding: 0 14px; gap: 10px; border-bottom: 1px solid rgba(226,185,77,.10); position: relative; z-index: 1; }
        .tl-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; position: relative; z-index: 1; }
        .tl-nav::-webkit-scrollbar { width: 3px; }
        .tl-nav::-webkit-scrollbar-thumb { background: rgba(226,185,77,.25); border-radius: 99px; }
        .tl-section { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: rgba(226,185,77,.42); padding: 14px 20px 5px; white-space: nowrap; }
                .tl-item {
            position: relative; display: flex; align-items: center; gap: 10px;
            margin: 1px 12px; padding: 9px 12px; border-radius: 10px;
            text-decoration: none; color: rgba(255,255,255,.65);
            font-size: 0.845rem; font-weight: 500; white-space: nowrap; overflow: hidden; cursor: pointer;
            border-left: 3px solid transparent;
            transition: all 0.18s ease;
        }
        .tl-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .tl-item.active { background: linear-gradient(90deg, rgba(226,185,77,0.16) 0%, rgba(226,185,77,0.05) 100%); color: #fff; font-weight: 700; border-left-color: #E2B94D; border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(226,185,77,0.12); }
        .tl-item.active:hover { background: linear-gradient(90deg, rgba(226,185,77,0.16) 0%, rgba(226,185,77,0.05) 100%); }
.tl-icon { display: flex; align-items: center; justify-content: center; border-radius: 9px; flex-shrink: 0; transition: background .18s; }
        .tl-badge { margin-left:auto; min-width:19px; height:19px; padding:0 5px; border-radius:99px; background:linear-gradient(135deg, #E2B94D, #B8860B); color:#0B2540; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(226,185,77,.5); flex-shrink:0; }
        .tl-tip { position:absolute; left:66px; background:rgba(3,11,21,.96); color:#fff; font-size:12px; font-weight:700; padding:5px 11px; border-radius:8px; white-space:nowrap; pointer-events:none; opacity:0; transform:translateX(-4px); transition:opacity .15s,transform .15s; border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(8px); z-index:200; }
        .tl-item:hover .tl-tip { opacity:1; transform:translateX(0); }
        .tl-user { margin:8px 8px 14px; padding:10px 12px; border-radius:14px; background:rgba(226,185,77,.06); border:1px solid rgba(226,185,77,.14); display:flex; align-items:center; gap:10px; position:relative; z-index:1; transition:background .2s; overflow:hidden; }
        .tl-user:hover { background:rgba(226,185,77,.10); }
        .tl-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg, #E2B94D, #B8860B); display:flex; align-items:center; justify-content:center; font-family:'Baloo 2',cursive; font-size:16px; font-weight:800; color:#0B2540; flex-shrink:0; box-shadow:0 3px 10px rgba(226,185,77,.4); }
        .tl-toggle { width:26px; height:26px; border-radius:7px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s,color .2s; flex-shrink:0; }
        .tl-toggle:hover { background:rgba(255,255,255,.16); color:#fff; }
        .tl-logout { width:30px; height:30px; border-radius:9px; background:rgba(239,68,68,.14); border:none; color:rgba(239,68,68,.75); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s,color .2s,transform .2s; flex-shrink:0; margin-left:auto; }
        .tl-logout:hover { background:rgba(239,68,68,.24); color:#EF4444; transform:scale(1.08); }
        .tl-topbar { height:64px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 22px; background:rgba(255,255,255,.88); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,.06); box-shadow:0 4px 20px rgba(0,0,0,.04); position:relative; z-index:30; }
        .tl-search { width:220px; padding:8px 14px 8px 38px; border-radius:11px; border:1.5px solid transparent; background:rgba(0,0,0,.05); font-family:'Nunito',sans-serif; font-size:13px; font-weight:600; color:#111; outline:none; transition:border-color .2s,box-shadow .2s,width .2s; }
        .tl-search:focus { border-color:rgba(12,42,71,.35); background:#fff; box-shadow:0 0 0 3px rgba(12,42,71,.1); width:260px; }
        .tl-search::placeholder { color:#94a3b8; }

        /* Bell */
        .tl-bell-wrap { position: relative; }
        .tl-bell { width:38px; height:38px; border-radius:11px; background:rgba(0,0,0,.04); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748B; transition:background .2s,color .2s; }
        .tl-bell:hover, .tl-bell.open { background:rgba(12,42,71,.12); color:#0C2A47; }
        .tl-bell-count { position:absolute; top:-4px; right:-4px; min-width:17px; height:17px; padding:0 4px; background:linear-gradient(135deg, #0C2A47, #030B15); color:#fff; border-radius:99px; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(226,185,77,.45); }

        /* Dropdown */
        .tl-notif-dropdown {
          position: absolute; top: calc(100% + 12px); right: 0;
          width: 360px; background: #fff; border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          z-index: 9999;
          animation: tNotifIn .2s cubic-bezier(.34,1.2,.64,1);
          overflow: hidden;
        }
        @keyframes tNotifIn { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }

        .tl-nd-header { display:flex; align-items:center; justify-content:space-between; padding:16px 18px 12px; border-bottom:1px solid #F1F5F9; }
        .tl-nd-list { max-height: 340px; overflow-y: auto; }
        .tl-nd-list::-webkit-scrollbar { width: 4px; }
        .tl-nd-list::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }

        .tl-ni { display:flex; align-items:flex-start; gap:12px; padding:13px 18px; border-bottom:1px solid #F8FAFC; cursor:pointer; transition:background .15s; position:relative; }
        .tl-ni:last-child { border-bottom:none; }
        .tl-ni:hover { background:#F8FAFC; }
        .tl-ni.unread { background:#F5FFFA; }
        .tl-ni.unread::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:linear-gradient(180deg, #E2B94D, #B8860B); border-radius:0 3px 3px 0; }

        .tl-ni-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        .tl-topav { width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg, #0C2A47, #030B15); display:flex; align-items:center; justify-content:center; font-family:'Baloo 2',cursive; font-size:15px; font-weight:800; color:#fff; box-shadow:0 3px 10px rgba(12,42,71,.35), 0 0 0 1px rgba(226,185,77,.18); cursor:pointer; transition:transform .2s; }
        .tl-topav:hover { transform:scale(1.06); }
        .tl-content { flex:1; overflow-y:auto; padding:24px; background:#F8FAFC; }
        .tl-content::-webkit-scrollbar { width:6px; }
        .tl-content::-webkit-scrollbar-thumb { background:rgba(0,0,0,.11); border-radius:99px; }
        .tl-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); z-index:40; }

        @keyframes tlIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        @media (max-width:1024px) {
          .tl-overlay { display:block; }
          .tl-aside.mob-off { transform:translateX(-100%); }
          .tl-aside.mob-on  { transform:translateX(0); }
          .tl-main { margin-left:0 !important; }
          .tl-mob-btn { display:flex !important; }
          .tl-desk-search, .tl-desk-name { display:none !important; }
          .tl-notif-dropdown { width: 310px; right: -60px; }
          .tl-content { padding: 12px; }
        }
        @media (min-width:1025px) {
          .tl-aside { transform:translateX(0) !important; }
          .tl-mob-btn { display:none !important; }
          .tl-desk-search { display:flex !important; }
          .tl-desk-name { display:block !important; }
        }
      `}</style>

      {mob && <div className="tl-overlay" onClick={() => setMob(false)} />}

      {/* ══ SIDEBAR ══ */}
      <aside className={`tl-aside ${mob ? 'mob-on' : 'mob-off'}`} style={{ width: open ? SW_OPEN : SW_CLOSE, minWidth: open ? SW_OPEN : SW_CLOSE }}>
        
        
        

        <div className="tl-logo" style={{ justifyContent: open ? 'space-between' : 'center' }}>
          {open ? (
            <>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'linear-gradient(135deg, #0C2A47, #030B15)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 14px rgba(226,185,77,.35), 0 0 0 1px rgba(226,185,77,.2)',flexShrink:0 }}>
                  <img src={logo} alt="" style={{ width:24,height:24,borderRadius:6 }} />
                </div>
                <div>
                  <p style={{ fontFamily:"'Baloo 2',cursive",fontSize:15,fontWeight:800,color:'#fff',margin:0,lineHeight:1.1 }}>Zorix School</p>
                  <p style={{ fontSize:10,color:'rgba(255,255,255,.42)',fontWeight:600,margin:0 }}>Staff Panel</p>
                </div>
              </div>
              <button className="tl-toggle" onClick={() => setOpen(false)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
            </>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8,width:'100%' }}>
              <div style={{ width:38,height:38,borderRadius:10,background:'linear-gradient(135deg, #0C2A47, #030B15)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 3px 14px rgba(226,185,77,.35), 0 0 0 1px rgba(226,185,77,.2)' }}>
                <img src={logo} alt="" style={{ width:24,height:24,borderRadius:6 }} />
              </div>
              <button className="tl-toggle" onClick={() => setOpen(true)}>
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>

        <nav className="tl-nav">
          {open && <p className="tl-section">Main Menu</p>}
          <ul style={{ listStyle:'none',margin:0,padding:0 }}>
            {visibleMenu.length === 0 ? (
              <li style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>
                No menu items available.
              </li>
            ) : visibleMenu.map((item, i) => {
              const active = isActive(item.path);
              // Add unread count badge to notifications
              const itemWithBadge = item.path === '/teacher/notifications' && unreadCount > 0
                ? { ...item, badge: unreadCount > 99 ? '99+' : unreadCount }
                : item;
              return (
                <li key={item.path} style={{ animationDelay:`${i*35}ms` }}>
                  <Link
                      to={item.path}
                      title={!open ? item.label : undefined}
                      aria-label={item.label}
                      onClick={() => setMob(false)}
                      className={`tl-item${active ? ' active' : ''}`}
                      style={{
                        justifyContent: !open ? 'center' : 'flex-start',
                        padding: !open ? '10px' : '9px 12px',
                        margin: !open ? '2px auto' : '1px 12px',
                        width: !open ? 52 : 'auto',
                      }}
                    >
                      <svg
                        style={{ width: 17, height: 17, flexShrink: 0, opacity: active ? 1 : 0.8 }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={active ? 2.5 : 2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d={item.d} />
                      </svg>
                    {open && <span style={{ flex:1, fontSize: '0.845rem' }}>{item.label}</span>}
                    {itemWithBadge.badge && open  && <span className="tl-badge">{itemWithBadge.badge}</span>}
                    {itemWithBadge.badge && !open && <span style={{ position:'absolute',top:5,right:5,width:15,height:15,background:'linear-gradient(135deg, #E2B94D, #B8860B)',borderRadius:'50%',fontSize:9,fontWeight:800,color:'#0B2540',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 6px rgba(226,185,77,.5)' }}>{itemWithBadge.badge}</span>}
                    {!open && <span className="tl-tip">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {open && <div style={{ margin:'10px 18px',height:1,background:'rgba(255,255,255,.06)' }} />}
        </nav>

        <div className="tl-user" style={{ justifyContent:!open?'center':undefined, padding:!open?'10px':'10px 12px' }}>
          <div className="tl-avatar">
            {teacherProfile?.photo ? (
              <img src={teacherProfile.photo} alt={user?.name || 'T'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
            ) : (
              user?.name?.charAt(0) || 'T'
            )}
          </div>
          {open && (
            <div style={{ flex:1,minWidth:0 }}>
              <p style={{ fontSize:13,fontWeight:800,color:'#fff',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.name||'Staff'}</p>
              <p style={{ fontSize:11,color:'rgba(255,255,255,.38)',margin:0,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{user?.subjects||'Staff'}</p>
            </div>
          )}
          {open && (
            <button className="tl-logout" onClick={() => { logout(); navigate('/login'); }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          )}
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div className="tl-main" style={{ marginLeft: open ? SW_OPEN : SW_CLOSE }}>
        <header className="tl-topbar">
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <button className="tl-mob-btn tl-toggle" aria-label="Open sidebar" style={{ background:'rgba(0,0,0,.05)',borderColor:'transparent',color:'#64748B' }} onClick={() => setMob(!mob)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <p style={{ fontFamily:"'Baloo 2',cursive",fontSize:17,fontWeight:800,color:'#0F172A',margin:0,lineHeight:1.2 }}>{activeItem?.label||'Dashboard'}</p>
              <p style={{ fontSize:11,color:'#94a3b8',fontWeight:600,margin:0 }}>Zorix School · Staff Panel</p>
            </div>
          </div>

          {canSearchAnything && (
            <div className="tl-desk-search" style={{ display:'none', flex:1, justifyContent:'center', padding:'0 16px' }}>
              <GlobalSearch variant="desktop" navBase="teacher" scopes={searchScopes} />
            </div>
          )}

          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            {/* ── Push notifications enable prompt ── */}
            {push?.isSupported && push.permissionStatus !== 'granted' && push.permissionStatus !== 'denied' && (
              <button
                type="button"
                title="Enable push notifications"
                onClick={async () => {
                  try {
                    await push.initializeNotifications();
                  } catch (err) {
                    console.error('Push notification enable failed:', err);
                  }
                }}
                disabled={push.isInitializing}
                className="tl-bell"
                style={{ opacity: push.isInitializing ? 0.6 : 1 }}
              >
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  <path d="M12 4v4M10 6h4" />
                </svg>
              </button>
            )}

            {/* ── Bell with dropdown ── */}
            <div className="tl-bell-wrap" ref={bellRef}>
              <button className={`tl-bell${notifOpen?' open':''}`} onClick={() => setNotifOpen(v => !v)}>
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && <span className="tl-bell-count">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="tl-notif-dropdown">
                  {/* Header */}
                  <div className="tl-nd-header">
                    <div>
                      <p style={{ fontFamily:"'Baloo 2',cursive",fontSize:15,fontWeight:800,color:'#0F172A',margin:0 }}>Notifications</p>
                      {unreadCount > 0 && <p style={{ fontSize:11,color:'#B8860B',fontWeight:700,margin:0 }}>{unreadCount} unread</p>}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead}
                        style={{ fontSize:12,fontWeight:700,color:'#0C2A47',background:'rgba(12,42,71,.08)',border:'none',padding:'5px 10px',borderRadius:8,cursor:'pointer',transition:'background .15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(12,42,71,.14)'}
                        onMouseLeave={e=>e.currentTarget.style.background='rgba(12,42,71,.08)'}
                      >
                        Mark all read
                      </button>
                    )}
                  </div> 

                  {/* List */}
                  <div className="tl-nd-list">
                    {notifLoading && notificationsList.length === 0 ? (
                      <div style={{ padding: '18px 16px', color: '#64748B', textAlign: 'center' }}>Loading notifications...</div>
                    ) : notificationsList.length === 0 ? (
                      <div style={{ padding: '18px 16px', color: '#64748B', textAlign: 'center' }}>No notifications</div>
                    ) : (
                      notificationsList.map((n) => {
                        const icon = getNotificationIcon(n.type);
                        return (
                           <div key={n._id} className={`tl-ni${n.isRead ? '' : ' unread'}`} onClick={() => handleNotifClick(n)}>
                             <button
                               onClick={(e) => handleDismissClick(e, n._id)}
                               style={{
                                 position: 'absolute',
                                 top: 6,
                                 right: 6,
                                 width: 18,
                                 height: 18,
                                 borderRadius: '50%',
                                 border: 'none',
                                 background: 'rgba(0,0,0,0.05)',
                                 color: '#94A3B8',
                                 cursor: 'pointer',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center',
                                 transition: 'background .15s, color .15s',
                                 padding: 0,
                               }}
                               onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#EF4444'; }}
                               onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = '#94A3B8'; }}
                               title="Dismiss"
                             >
                               <svg width="9" height="9" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                                 <path d="M6 18L18 6M6 6l12 12" />
                               </svg>
                             </button>
                             <div className="tl-ni-icon" style={{ background: 'rgba(226,185,77,0.14)' }}>
                              <svg width="16" height="16" fill="none" stroke="#B8860B" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <path d={icon} />
                              </svg>
                            </div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:2 }}>
                                <p style={{ fontSize:13,fontWeight:!n.isRead?800:600,color:'#0F172A',margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{n.title}</p>
                                {!n.isRead && <span style={{ width:7,height:7,background:'#B8860B',borderRadius:'50%',flexShrink:0 }} />}
                              </div>
                              <p style={{ fontSize:12,color:'#64748B',margin:0,lineHeight:1.45,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{n.body || n.message || 'No description'}</p>
                              <p style={{ fontSize:11,color:'#94A3B8',margin:'4px 0 0',fontWeight:600 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : n.time}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{ padding:'12px 18px',borderTop:'1px solid #F1F5F9',textAlign:'center',display:'flex',justifyContent:'center',gap:16,alignItems:'center' }}>
                    {notificationsList.some(n => n.isRead) && (
                      <button
                        onClick={clearReadNotifications}
                        style={{ fontSize:12,fontWeight:700,color:'#EF4444',background:'transparent',border:'none',cursor:'pointer',padding:'4px 8px',borderRadius:6,transition:'background .15s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        Clear read
                      </button>
                    )}
                    <button style={{ fontSize:13,fontWeight:700,color:'#0C2A47',background:'none',border:'none',cursor:'pointer' }} onClick={() => setNotifOpen(false)}>
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ width:1,height:26,background:'rgba(0,0,0,.08)' }} />

            <div
              onClick={() => navigate('/teacher/profile')}
              style={{ display:'flex',alignItems:'center',gap:9,cursor:'pointer' }}
            >
              <div className="tl-desk-name" style={{ display:'none',textAlign:'right' }}>
                <p style={{ fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:800,color:'#0F172A',margin:0 }}>{user?.name||'Staff'}</p>
                <p style={{ fontSize:11,color:'#94a3b8',margin:0,fontWeight:600 }}>{user?.subjects||'Staff'}</p>
              </div>
              <div className="tl-topav">
                {teacherProfile?.photo ? (
                  <img src={teacherProfile.photo} alt={user?.name || 'S'} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 11 }} />
                ) : (
                  user?.name?.charAt(0) || 'S'
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="tl-content"><Outlet /></main>
      </div>
    </>
  );
}