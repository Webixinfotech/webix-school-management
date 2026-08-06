import { useState, useEffect, useRef } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import logo from "../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp";
import { getNotificationDestination } from "../utils/notificationNavigation";

const SW_OPEN = 264;
const SW_CLOSE = 72;

const MENU = [
  {
    path: "/parent",
    label: "Dashboard",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.15)",
    d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    path: "/parent/child",
    label: "My Child",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.15)",
    d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
  { path: '/parent/id-card', label: 'ID Card', d: 'M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm6 5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 1c-2.2 0-4 1.3-4 3h8c0-1.7-1.8-3-4-3zm5-3h5v1h-5zm0 3h5v1h-5zm0 3h4v1h-4z' },
  { path: '/parent/documents', label: 'My Documents', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  {
    path: "/parent/daily-activity",
    label: "Daily Activity",
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.15)",
    d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  },
  { path: '/parent/calendar', label: 'School Calendar', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  {
    path: "/parent/attendance",
    label: "Attendance",
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.15)",
    d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    path: "/parent/fee/invoices",
    label: "My Fees",
    color: "#F472B6",
    bg: "rgba(244,114,182,0.15)",
    d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    path: "/parent/photos",
    label: "Child Photos",
    color: "#34D399",
    bg: "rgba(52,211,153,0.15)",
    d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    path: "/parent/referrals",
    label: "Refer A Friend",
    color: "#FBBF24",
    bg: "rgba(251,191,36,0.15)",
    d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    path: "/parent/notifications",
    label: "Notifications",
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.15)",
    d: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  },
  {
    path: "/parent/profile",
    label: "Profile",
    color: "#6EE7B7",
    bg: "rgba(110,231,183,0.15)",
    d: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  // ── Inventory & Library ──
  // { path: '/parent/inventory/catalog', label: 'School Store', d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { path: '/parent/inventory/my-items', label: 'Library & Purchases', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/parent/inventory/deposits', label: 'My Deposits', d: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
];

// ── Parent notifications helpers ─────────────────────────────────────────────
const getNotifIcon = (type) => {
  switch (type) {
    case "attendance": return "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z";
    case "homework": return "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z";
    case "photo": return "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z";
    case "message": return "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z";
    case "event": return "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v12a2 2 0 002 2z";
    case "fee": return "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z";
    default: return "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9";
  }
};

const getNotifColor = (type) => {
  switch (type) {
    case "attendance": return "#34D399";
    case "homework": return "#F472B6";
    case "photo": return "#38BDF8";
    case "message": return "#A78BFA";
    case "event": return "#FBBF24";
    case "fee": return "#FB923C";
    default: return "#A78BFA";
  }
};

const getNotifBg = (type) => {
  switch (type) {
    case "attendance": return "rgba(52,211,153,0.12)";
    case "homework": return "rgba(244,114,182,0.12)";
    case "photo": return "rgba(56,189,248,0.12)";
    case "message": return "rgba(167,139,250,0.12)";
    case "event": return "rgba(251,191,36,0.12)";
    case "fee": return "rgba(251,146,60,0.12)";
    default: return "rgba(167,139,250,0.12)";
  }
};

export default function ParentLayout() {
  const [open, setOpen] = useState(true);
  const [mob, setMob] = useState(false);
  const [hov, setHov] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const bellRef = useRef(null);

  const { user, logout, isAuthenticated } = useAuth();
  const {
    notifications: notificationsList,
    unreadCount: apiUnreadCount,
    loading: notifLoading,
    markAsRead,
    markAllAsRead,
    dismissNotification: dismissNotif,
    clearReadNotifications,
    push,
  } = useNotifications();
  const loc = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    else if (user?.role !== "parent") navigate(`/${user?.role || "login"}`);
  }, [isAuthenticated, user, navigate]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isAuthenticated || user?.role !== "parent") return null;

  const unreadCount = apiUnreadCount || 0;

  const handleNotifClick = async (n) => {
    const isUnread = !n.isRead;
    if (isUnread) {
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

  const isActive = (p) =>
    p === "/parent" ? loc.pathname === "/parent" : loc.pathname.startsWith(p);
  const activeItem = MENU.find((m) => isActive(m.path));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .pl-shell { display: flex; height: 100vh; overflow: hidden; background: #F0F4FF; font-family: 'Nunito', sans-serif; }
        .pl-aside {
          position: fixed; top: 0; left: 0; height: 100vh; z-index: 50;
          display: flex; flex-direction: column; overflow: hidden;
          background: linear-gradient(180deg, #0F4C5C 0%, #0a3540 40%, #051d24 100%);
          box-shadow: 4px 0 32px rgba(0,0,0,0.38);
          transition: width .3s cubic-bezier(.4,0,.2,1), transform .3s cubic-bezier(.4,0,.2,1);
        }
        .pl-main { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; transition: margin-left .3s cubic-bezier(.4,0,.2,1); }
        .pl-orb { position: absolute; border-radius: 50%; pointer-events: none; }
        .pl-logo { height: 68px; flex-shrink: 0; display: flex; align-items: center; padding: 0 14px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,.07); position: relative; z-index: 1; }
        .pl-nav { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 8px 0; position: relative; z-index: 1; }
        .pl-nav::-webkit-scrollbar { width: 3px; }
        .pl-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
        .pl-section { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.24); padding: 14px 20px 5px; white-space: nowrap; }
                .pl-item {
            position: relative; display: flex; align-items: center; gap: 10px;
            margin: 1px 12px; padding: 9px 12px; border-radius: 10px;
            text-decoration: none; color: rgba(255,255,255,.65);
            font-size: 0.845rem; font-weight: 500; white-space: nowrap; overflow: hidden; cursor: pointer;
            border-left: 3px solid transparent;
            transition: all 0.18s ease;
        }
        .pl-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .pl-item.active { background: rgba(255,255,255,0.14); color: #fff; font-weight: 700; border-left-color: #D4AF37; }
.pl-icon { display: flex; align-items: center; justify-content: center; border-radius: 9px; flex-shrink: 0; transition: background .18s; }
        .pl-badge { margin-left:auto; min-width:19px; height:19px; padding:0 5px; border-radius:99px; background:#D4AF37; color:#fff; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(212,175,55,.5); flex-shrink:0; }
        .pl-tip { position:absolute; left:66px; background:rgba(15,10,30,.96); color:#fff; font-size:12px; font-weight:700; padding:5px 11px; border-radius:8px; white-space:nowrap; pointer-events:none; opacity:0; transform:translateX(-4px); transition:opacity .15s,transform .15s; border:1px solid rgba(255,255,255,.1); backdrop-filter:blur(8px); z-index:200; }
        .pl-item:hover .pl-tip { opacity:1; transform:translateX(0); }
        .pl-user { margin:8px 8px 14px; padding:10px 12px; border-radius:14px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); display:flex; align-items:center; gap:10px; position:relative; z-index:1; transition:background .2s; overflow:hidden; }
        .pl-user:hover { background:rgba(255,255,255,.09); }
        .pl-avatar { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg, #0F4C5C, #051d24); display:flex; align-items:center; justify-content:center; font-family:'Baloo 2',cursive; font-size:16px; font-weight:800; color:#fff; flex-shrink:0; box-shadow:0 3px 10px rgba(212,175,55,.4); }
        .pl-toggle { width:26px; height:26px; border-radius:7px; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1); color:rgba(255,255,255,.55); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s,color .2s; flex-shrink:0; }
        .pl-toggle:hover { background:rgba(255,255,255,.16); color:#fff; }
        .pl-logout { width:30px; height:30px; border-radius:9px; background:rgba(239,68,68,.14); border:none; color:rgba(239,68,68,.75); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .2s,color .2s,transform .2s; flex-shrink:0; margin-left:auto; }
        .pl-logout:hover { background:rgba(239,68,68,.24); color:#EF4444; transform:scale(1.08); }
        .pl-topbar { height:64px; flex-shrink:0; display:flex; align-items:center; justify-content:space-between; padding:0 22px; background:rgba(255,255,255,.88); backdrop-filter:blur(20px); border-bottom:1px solid rgba(0,0,0,.06); box-shadow:0 4px 20px rgba(0,0,0,.04); position:relative; z-index:30; }
        .pl-search { width:220px; padding:8px 14px 8px 38px; border-radius:11px; border:1.5px solid transparent; background:rgba(0,0,0,.05); font-family:'Nunito',sans-serif; font-size:13px; font-weight:600; color:#111; outline:none; transition:border-color .2s,box-shadow .2s,width .2s; }
        .pl-search:focus { border-color:rgba(15,76,92,.35); background:#fff; box-shadow:0 0 0 3px rgba(15,76,92,.1); width:260px; }
        .pl-search::placeholder { color:#94a3b8; }

        /* ── Bell button ── */
        .pl-bell-wrap { position: relative; }
        .pl-bell { width:38px; height:38px; border-radius:11px; background:rgba(0,0,0,.04); border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#64748B; transition:background .2s,color .2s; }
        .pl-bell:hover, .pl-bell.open { background:rgba(15,76,92,.1); color:#0F4C5C; }
        .pl-bell-dot { position:absolute; top:7px; right:7px; width:8px; height:8px; background:#D4AF37; border-radius:50%; border:2px solid white; animation:bpulse 2s ease-in-out infinite; }
        @keyframes bpulse { 0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.4)} 50%{box-shadow:0 0 0 4px rgba(139,92,246,0)} }

        /* ── Notification dropdown ── */
        .pl-notif-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: 0;
          width: 360px;
          background: #fff;
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.16), 0 4px 16px rgba(0,0,0,0.08);
          border: 1px solid rgba(0,0,0,0.06);
          z-index: 9999;
          animation: notifIn .2s cubic-bezier(.34,1.2,.64,1);
          overflow: hidden;
        }
        @keyframes notifIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Dropdown header */
        .pl-nd-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px 12px;
          border-bottom: 1px solid #F1F5F9;
        }

        /* Notif item */
        .pl-ni {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 13px 18px;
          border-bottom: 1px solid #F8FAFC;
          cursor: pointer;
          transition: background .15s;
          position: relative;
        }
        .pl-ni:last-child { border-bottom: none; }
        .pl-ni:hover { background: #F8FAFF; }
        .pl-ni.unread { background: #FAFAFF; }
        .pl-ni.unread::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background: linear-gradient(180deg,#8B5CF6,#EC4899); border-radius:0 3px 3px 0; }

        /* Notif icon box */
        .pl-ni-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

        /* Notif scroll */
        .pl-nd-list { max-height: 340px; overflow-y: auto; }
        .pl-nd-list::-webkit-scrollbar { width: 4px; }
        .pl-nd-list::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 99px; }

        /* Count badge on bell */
        .pl-bell-count {
          position: absolute; top: -4px; right: -4px;
          min-width: 17px; height: 17px; padding: 0 4px;
          background: linear-gradient(135deg, #0F4C5C, #051d24);
          color: #fff; border-radius: 99px;
          font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(212,175,55,.4);
        }

        .pl-topav { width:36px; height:36px; border-radius:11px; background:linear-gradient(135deg, #0F4C5C, #051d24); display:flex; align-items:center; justify-content:center; font-family:'Baloo 2',cursive; font-size:15px; font-weight:800; color:#fff; box-shadow:0 3px 10px rgba(139,92,246,.3); cursor:pointer; transition:transform .2s; }
        .pl-topav:hover { transform:scale(1.06); }
        .pl-content { flex:1; overflow-y:auto; padding:24px; background:#F3F4FF; }
        .pl-content::-webkit-scrollbar { width:6px; }
        .pl-content::-webkit-scrollbar-thumb { background:rgba(0,0,0,.11); border-radius:99px; }
        .pl-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); z-index:40; }
        @keyframes plIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        @media (max-width:1024px) {
          .pl-overlay { display:block; }
          .pl-aside.mob-off { transform:translateX(-100%); }
          .pl-aside.mob-on  { transform:translateX(0); }
          .pl-main { margin-left:0 !important; }
          .pl-mob-btn { display:flex !important; }
          .pl-desk-search, .pl-desk-name { display:none !important; }
          .pl-notif-dropdown { width: 310px; right: -60px; }
          .pl-content { padding: 12px; }
        }
        @media (min-width:1025px) {
          .pl-aside { transform:translateX(0) !important; }
          .pl-mob-btn { display:none !important; }
          .pl-desk-search { display:block !important; }
          .pl-desk-name { display:block !important; }
        }
      `}</style>

      {mob && <div className="pl-overlay" onClick={() => setMob(false)} />}

      {/* ══ SIDEBAR ══ */}
      <aside
        className={`pl-aside ${mob ? "mob-on" : "mob-off"}`}
        style={{ width: open ? SW_OPEN : SW_CLOSE }}
      >
        <div
          className="pl-orb"
          style={{
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle,rgba(15,76,92,.35) 0%,transparent 70%)",
          }}
        />
        <div
          className="pl-orb"
          style={{
            bottom: 80,
            left: -80,
            width: 240,
            height: 240,
            background:
              "radial-gradient(circle,rgba(236,72,153,.2) 0%,transparent 70%)",
          }}
        />
        <div
          className="pl-orb"
          style={{
            top: "45%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 300,
            height: 300,
            background:
              "radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 70%)",
          }}
        />

        <div
          className="pl-logo"
          style={{ justifyContent: open ? "space-between" : "center" }}
        >
          {open ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #0F4C5C, #051d24)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 3px 14px rgba(212,175,55,.4)",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={logo}
                    alt=""
                    style={{ width: 24, height: 24, borderRadius: 6 }}
                  />
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'Baloo 2',cursive",
                      fontSize: 15,
                      fontWeight: 800,
                      color: "#fff",
                      margin: 0,
                      lineHeight: 1.1,
                    }}
                  >
                    Zorix School
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,.42)",
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    Parent Portal
                  </p>
                </div>
              </div>
              <button className="pl-toggle" onClick={() => setOpen(false)}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #0F4C5C, #051d24)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 3px 14px rgba(212,175,55,.4)",
                }}
              >
                <img
                  src={logo}
                  alt=""
                  style={{ width: 24, height: 24, borderRadius: 6 }}
                />
              </div>
              <button className="pl-toggle" onClick={() => setOpen(true)}>
                <svg
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <nav className="pl-nav">
          {open && <p className="pl-section">Main Menu</p>}
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {MENU.map((item, i) => {
              const active = isActive(item.path);
              // Add unread count badge to notifications
              const itemWithBadge = item.path === '/parent/notifications' && unreadCount > 0
                ? { ...item, badge: unreadCount > 99 ? '99+' : unreadCount }
                : item;
              return (
                <li key={item.path} style={{ animationDelay: `${i * 35}ms` }}>
                  <Link
                      to={item.path}
                      title={!open ? item.label : undefined}
                      aria-label={item.label}
                      onClick={() => setMob(false)}
                      className={`pl-item${active ? ' active' : ''}`}
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
                    {open && (
                      <span
                        style={{
                          flex: 1,
                          fontSize: 13.5,
                          fontWeight: active ? 800 : 600,
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                    {itemWithBadge.badge && open && (
                      <span className="pl-badge">{itemWithBadge.badge}</span>
                    )}
                    {itemWithBadge.badge && !open && (
                      <span
                        style={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          width: 15,
                          height: 15,
                          background: "#EC4899",
                          borderRadius: "50%",
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: "0 2px 6px rgba(212,175,55,.5)",
                        }}
                      >
                        {itemWithBadge.badge}
                      </span>
                    )}
                    {!open && <span className="pl-tip">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
          {open && (
            <div
              style={{
                margin: "10px 18px",
                height: 1,
                background: "rgba(255,255,255,.06)",
              }}
            />
          )}
        </nav>

        <div
          className="pl-user"
          style={{
            justifyContent: !open ? "center" : undefined,
            padding: !open ? "10px" : "10px 12px",
          }}
        >
          <div className="pl-avatar">{user?.name?.charAt(0) || "P"}</div>
          {open && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#fff",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user?.name || "Parent"}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,.38)",
                  margin: 0,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Parent of {user?.children?.[0]?.name || "Child"}
              </p>
            </div>
          )}
          {open && (
            <button
              className="pl-logout"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* ══ MAIN ══ */}
      <div
        className="pl-main"
        style={{ marginLeft: open ? SW_OPEN : SW_CLOSE }}
      >
        <header className="pl-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="pl-mob-btn pl-toggle"
              style={{
                display: "none",
                background: "rgba(0,0,0,.05)",
                borderColor: "transparent",
                color: "#64748B",
              }}
              onClick={() => setMob(!mob)}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p
                style={{
                  fontFamily: "'Baloo 2',cursive",
                  fontSize: 17,
                  fontWeight: 800,
                  color: "#0F172A",
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {activeItem?.label || "Dashboard"}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Zorix School · Parent Portal
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="pl-desk-search"
              style={{ display: "none", position: "relative" }}
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                style={{
                  position: "absolute",
                  left: 11,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="pl-search"
              />
            </div>

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
                className="pl-bell"
                style={{ opacity: push.isInitializing ? 0.6 : 1 }}
              >
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  <path d="M12 4v4M10 6h4" />
                </svg>
              </button>
            )}

            {/* ── Bell with dropdown ── */}
            <div className="pl-bell-wrap" ref={bellRef}>
              <button
                className={`pl-bell${notifOpen ? " open" : ""}`}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <svg
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="pl-bell-count">{unreadCount}</span>
                )}
              </button>

              {/* Dropdown */}
              {notifOpen && (
                <div className="pl-notif-dropdown">
                  {/* Header */}
                  <div className="pl-nd-header">
                    <div>
                      <p
                        style={{
                          fontFamily: "'Baloo 2',cursive",
                          fontSize: 15,
                          fontWeight: 800,
                          color: "#0F172A",
                          margin: 0,
                        }}
                      >
                        Notifications
                      </p>
                      {unreadCount > 0 && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#8B5CF6",
                            fontWeight: 700,
                            margin: 0,
                          }}
                        >
                          {unreadCount} unread
                        </p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#8B5CF6",
                          background: "rgba(139,92,246,.08)",
                          border: "none",
                          padding: "5px 10px",
                          borderRadius: 8,
                          cursor: "pointer",
                          transition: "background .15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(139,92,246,.14)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(139,92,246,.08)")
                        }
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="pl-nd-list">
                    {notifLoading && notificationsList.length === 0 ? (
                      <div
                        style={{
                          padding: "18px 16px",
                          color: "#64748B",
                          textAlign: "center",
                        }}
                      >
                        Loading notifications...
                      </div>
                    ) : notificationsList.length === 0 ? (
                      <div
                        style={{
                          padding: "18px 16px",
                          color: "#64748B",
                          textAlign: "center",
                        }}
                      >
                        No notifications
                      </div>
                    ) : (
                      notificationsList.map((n) => {
                        const icon = getNotifIcon(n.type);
                        const cColor = getNotifColor(n.type);
                        const cBg = getNotifBg(n.type);

                        return (
                          <div
                            key={n._id}
                            className={`pl-ni${n.isRead ? "" : " unread"}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <button
                              onClick={(e) => handleDismissClick(e, n._id)}
                              style={{
                                position: "absolute",
                                top: 6,
                                right: 6,
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: "none",
                                background: "rgba(0,0,0,0.05)",
                                color: "#94A3B8",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background .15s, color .15s",
                                padding: 0,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(239,68,68,0.12)";
                                e.currentTarget.style.color = "#EF4444";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(0,0,0,0.05)";
                                e.currentTarget.style.color = "#94A3B8";
                              }}
                              title="Dismiss"
                            >
                              <svg
                                width="9"
                                height="9"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={3.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            <div
                              className="pl-ni-icon"
                              style={{ background: cBg }}
                            >
                              <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke={cColor}
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                              >
                                <path d={icon} />
                              </svg>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                  marginBottom: 2,
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: 13,
                                    fontWeight: !n.isRead ? 800 : 600,
                                    color: "#0F172A",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {n.title}
                                </p>
                                {!n.isRead && (
                                  <span
                                    style={{
                                      width: 7,
                                      height: 7,
                                      background: "#8B5CF6",
                                      borderRadius: "50%",
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </div>
                              <p
                                style={{
                                  fontSize: 12,
                                  color: "#64748B",
                                  margin: 0,
                                  lineHeight: 1.45,
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {n.body || n.message || "No description"}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "#94A3B8",
                                  margin: "4px 0 0",
                                  fontWeight: 600,
                                }}
                              >
                                {n.createdAt
                                  ? new Date(n.createdAt).toLocaleString()
                                  : n.time}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      padding: "12px 18px",
                      borderTop: "1px solid #F1F5F9",
                      textAlign: "center",
                      display: "flex",
                      justifyContent: "center",
                      gap: 16,
                      alignItems: "center",
                    }}
                  >
                    {notificationsList.some((n) => n.isRead) && (
                      <button
                        onClick={clearReadNotifications}
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#EF4444",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "4px 8px",
                          borderRadius: 6,
                          transition: "background .15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,68,68,0.08)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        Clear read
                      </button>
                    )}
                    <button
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#8B5CF6",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => setNotifOpen(false)}
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div
              style={{ width: 1, height: 26, background: "rgba(0,0,0,.08)" }}
            />

            <div
              onClick={() => navigate('/parent/profile')}
              style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer" }}
            >
              <div
                className="pl-desk-name"
                style={{ display: "none", textAlign: "right" }}
              >
                <p
                  style={{
                    fontFamily: "'Nunito',sans-serif",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: 0,
                  }}
                >
                  {user?.name || "Parent"}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  Parent
                </p>
              </div>
              <div className="pl-topav">{user?.name?.charAt(0) || "P"}</div>
            </div>
          </div>
        </header>

        <main className="pl-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
