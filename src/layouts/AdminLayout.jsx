import { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getNotificationDestination } from "../utils/notificationNavigation";
import logo from "../assets/optimized/logo/brain-builder-logo-brain-builder-logo.webp";
import GlobalSearch from "../components/admin/GlobalSearch";

const menuItems = [
  {
    path: "/admin",
    label: "Dashboard",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    section: "main",
  },
  {
    path: "/admin/user-enquiry",
    label: "Enquiry",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    section: "main",
  },
  {
    path: "/admin/referrals",
    label: "Referrals",
    icon: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
    section: "main",
  },
  { path: '/admin/birthdays', label: 'Birthdays', icon: 'M6 10h12v10H6V10zm2-4c0-1.1.9-2 2-2 .4 0 .8.1 1.1.3.3-.2.7-.3 1.1-.3 1.1 0 2 .9 2 2 0 .7-.4 1.4-1 1.7V10H9V7.7C8.4 7.4 8 6.7 8 6zm3-2v6m3-3v3M4 20h16v2H4v-2z' , section: 'main' },
  { path: '/admin/calendar', label: 'Events (Student)', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', section: 'main' },
  { path: '/admin/id-cards', label: 'ID Cards', icon: 'M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm4 3a2 2 0 100 4 2 2 0 000-4zm4 0h4m-4 3h6', section: 'manage' },
  { path: '/admin/documents', label: 'Documents', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', section: 'manage' },
  {
    path: "/admin/students",
    label: "Students",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    section: "main",
  },
  {
    path: "/admin/attendance",
    label: "Student Attendance",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    section: "main",
  },
   {
    path: "/admin/daily-activity",
    label: "Daily Activity",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    section: "main",
  },
  {
    path: "/admin/gallery",
    label: "Photo Management",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    section: "main",
  },  
  {
    path: "/admin/fee-hub",
    label: "Fee Hub",
    icon: "M6 6h12v12H6z",
    section: "main",
  },
  {
    path: "/admin/teachers",
    label: "Employees",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    section: "main",
  },
  {
    path: "/admin/employee-attendance",
    label: "Employee Attendance",
    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    section: "main",
  },
  {
    path: "/admin/classes",
    label: "Classes",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    section: "manage",
  },
  // {
  //   path: "/admin/academic-sessions",
  //   label: "Academic Sessions",
  //   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  //   section: "manage",
  // },
  {
    path: "/admin/advertisements",
    label: "Advertisements",
    icon: "M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z",
    section: "manage",
  },
  {
    path: "/admin/settings",
    label: "Settings",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    section: "manage",
  },
  // Inventory & Library Module
  { path: '/admin/inventory/dashboard', label: 'Inventory & Library', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', section: 'manage' },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const {
    push,
    notifications,
    unreadCount,
    loading: loadingNotif,
    error: notifError,
    markAsRead,
    clearReadNotifications,
  } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
    else if (user?.role !== "admin") navigate(`/${user?.role || "login"}`);
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (!isAuthenticated || user?.role !== "admin") return null;

  const isActive = (path) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  const mainItems = menuItems.filter((m) => m.section === "main");
  const manageItems = menuItems.filter((m) => m.section === "manage");

  const getRelativeTime = (dateStr) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const getIcon = (type) => {
    switch (type) {
      case "attendance":
        return "🧾";
      case "fee":
        return "💳";
      case "message":
        return "📋";
      case "birthday":
        return "🎂";
      case "inventory":
        return "📦";
      case "announcement":
        return "📢";
      default:
        return "🔔";
    }
  };

  const transformedNotifications = notifications.map((notif) => ({
    id: notif._id,
    title: notif.title,
    message: notif.body,
    time: getRelativeTime(notif.createdAt),
    type: notif.type || "general",
    icon: getIcon(notif.type),
    unread: !notif.isRead,
    raw: notif,
  }));

  const handleNotifClick = async (notif) => {
    if (notif.unread) await markAsRead(notif.id);
    setNotifOpen(false);
    const destination = getNotificationDestination(notif.raw, user?.role);
    if (destination) navigate(destination);
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.path);
    return (
      <li>
        <Link
          to={item.path}
          onClick={() => setMobileMenuOpen(false)}
          title={!sidebarOpen ? item.label : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: sidebarOpen ? "10px" : "0",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            padding: sidebarOpen ? "9px 12px" : "10px",
            borderRadius: "10px",
            textDecoration: "none",
            fontSize: "0.845rem",
            fontWeight: active ? 700 : 500,
            color: active ? "#ffffff" : "rgba(255,255,255,0.62)",
            background: active
              ? "linear-gradient(90deg, rgba(226,185,77,0.16) 0%, rgba(226,185,77,0.05) 100%)"
              : "transparent",
            borderLeft: active
              ? "3px solid #E2B94D"
              : "3px solid transparent",
            boxShadow: active ? "inset 0 0 0 1px rgba(226,185,77,0.12)" : "none",
            transition: "all 0.18s ease",
            marginBottom: 1,
          }}
          onMouseEnter={(e) => {
            if (!active) {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "#fff";
            }
          }}
          onMouseLeave={(e) => {
            if (!active) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(255,255,255,0.62)";
            }
          }}
        >
          <svg
            style={{
              width: 17,
              height: 17,
              flexShrink: 0,
              opacity: active ? 1 : 0.8,
              color: active ? "#E2B94D" : "currentColor",
            }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={active ? 2.5 : 2}
              d={item.icon}
            />
          </svg>
          {sidebarOpen && (
            <>
              <span style={{ flex: 1 }}>{item.label}</span>
              {active && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#E2B94D",
                    flexShrink: 0,
                    boxShadow: "0 0 6px rgba(226,185,77,0.8)",
                  }}
                />
              )}
            </>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      <style>{`

        @keyframes notifPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(226,185,77,0.6); }
          50%      { box-shadow: 0 0 0 4px rgba(226,185,77,0); }
        }
        .notif-dot { animation: notifPulse 2s ease-in-out infinite; }

        .sb-scroll::-webkit-scrollbar       { width: 3px; }
        .sb-scroll::-webkit-scrollbar-track { background: transparent; }
        .sb-scroll::-webkit-scrollbar-thumb { background: rgba(226,185,77,0.25); border-radius: 99px; }

        .search-box:focus {
          background: #fff !important;
          box-shadow: 0 0 0 2px rgba(11,37,64,0.18);
        }

        .topbar-shadow {
          box-shadow: 0 1px 0 rgba(0,0,0,0.06), 0 4px 16px rgba(15,23,42,0.07);
        }
      `}</style>

      <div
        className="dashboard-shell"
        style={{ gridTemplateColumns: sidebarOpen ? "268px 1fr" : "70px 1fr" }}
      >
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ══════════ SIDEBAR ══════════ */}
        <aside
          className={[
            "dashboard-sidebar flex flex-col z-50 transition-all duration-300",
            sidebarOpen ? "w-[268px]" : "w-[70px]",
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
          style={{
            background:
              "linear-gradient(180deg, #0C2A47 0%, #081A2E 45%, #030B15 100%)",
            boxShadow:
              "4px 0 32px rgba(0,0,0,0.45), inset -1px 0 0 rgba(226,185,77,0.07)",
          }}
        >
          {/* ── Logo Header ── */}
          <div
            style={{
              minHeight: 76,
              display: "flex",
              alignItems: "center",
              padding: sidebarOpen ? "10px 14px" : "10px 8px",
              borderBottom: "1px solid rgba(226,185,77,0.10)",
              background: "rgba(0,0,0,0.22)",
            }}
          >
            {sidebarOpen ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                }}
              >
                {/* Logo pill — white bg so colorful logo is clearly visible */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    padding: 3,
                    boxShadow:
                      "0 2px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(226,185,77,0.25)",
                  }}
                >
                  <img
                    src={logo}
                    alt="Zorix School"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>

                {/* Brand text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: "0.9rem",
                      lineHeight: 1.2,
                      fontFamily: "'Nunito', 'Poppins', sans-serif",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Zorix School
                  </p>
                  <p
                    style={{
                      color: "#E2B94D",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                    }}
                  >
                    International
                  </p>
                  <span
                    style={{
                      display: "inline-block",
                      marginTop: 3,
                      padding: "1px 7px",
                      borderRadius: 99,
                      background: "rgba(226,185,77,0.16)",
                      border: "1px solid rgba(226,185,77,0.32)",
                      color: "#E2B94D",
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Admin Panel
                  </span>
                </div>


              </div>
            ) : (
              /* Collapsed logo */
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 3,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.4), 0 0 0 1px rgba(226,185,77,0.25)",
                  }}
                >
                  <img
                    src={logo}
                    alt="BB"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation ── */}
          <nav
            className="sb-scroll flex-1 overflow-y-auto"
            style={{ padding: "10px 8px" }}
          >
            {/* Section: Main Menu */}
            {sidebarOpen && (
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(226,185,77,0.45)",
                  padding: "4px 12px",
                  marginBottom: 4,
                }}
              >
                Main Menu
              </p>
            )}
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {mainItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </ul>

            {/* Section: Management */}
            {/* {sidebarOpen && (
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                  padding: "4px 12px",
                  marginBottom: 4,
                  marginTop: 16,
                }}
              >
                Management
              </p>
            )} */}
            {!sidebarOpen && <div style={{ height: 12 }} />}
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {manageItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </ul>
          </nav>

          {/* ── User Footer ── */}
          <div
            style={{
              padding: "8px",
              borderTop: "1px solid rgba(226,185,77,0.10)",
            }}
          >
            {sidebarOpen ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(226,185,77,0.06)",
                  border: "1px solid rgba(226,185,77,0.14)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #E2B94D, #B8860B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 900,
                    fontSize: "0.875rem",
                    color: "#0B2540",
                    boxShadow: "0 2px 8px rgba(226,185,77,0.4)",
                  }}
                >
                  {user?.name?.charAt(0) || "A"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      color: "#fff",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user?.name || "Admin"}
                  </p>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: "0.7rem",
                    }}
                  >
                    Administrator
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  style={{
                    padding: 6,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.4)",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(226,185,77,0.14)";
                    e.currentTarget.style.color = "#E2B94D";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.4)";
                  }}
                >
                  <svg
                    style={{ width: 15, height: 15 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #E2B94D, #B8860B)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontSize: "0.875rem",
                    color: "#0B2540",
                  }}
                >
                  {user?.name?.charAt(0) || "A"}
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  style={{
                    padding: 5,
                    borderRadius: 7,
                    border: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.35)",
                    cursor: "pointer",
                  }}
                >
                  <svg
                    style={{ width: 14, height: 14 }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <div className="dashboard-main flex flex-col overflow-hidden">
          {/* Topbar */}
          <header
            className="topbar-shadow sticky top-0 z-30 flex items-center justify-between bg-white/92 backdrop-blur-xl px-4 sm:px-6"
            style={{ height: 68, borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            {/* Left */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden lg:flex p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      sidebarOpen
                        ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                        : "M13 5l7 7-7 7M5 5l7 7-7 7"
                    }
                  />
                </svg>
              </button>

              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-1.5">
                <span className="text-xs text-gray-400 font-medium">Admin</span>
                <svg
                  className="w-3 h-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <span className="text-sm font-semibold text-gray-700 capitalize">
                  {location.pathname.split("/").filter(Boolean).pop() ||
                    "Dashboard"}
                </span>
              </div>
            </div>

            {/* Center Search (Google-Assistant style, responsive, hidden on small screens) */}
            <div className="hidden md:flex flex-1 justify-center px-4 lg:px-10">
              <GlobalSearch variant="desktop" />
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* Push notifications enable prompt */}
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
                  className="p-2.5 hover:bg-gray-100 rounded-2xl transition-colors"
                  style={{ opacity: push.isInitializing ? 0.6 : 1 }}
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v4M10 6h4" />
                  </svg>
                </button>
              )}

              {/* Notification */}
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2.5 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadCount > 0 && (
                  <span className="notif-dot absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full border-2 border-white" />
                )}
              </button>

              <div className="w-px h-7 bg-gray-200" />

              {/* User */}
              <div
                onClick={() => navigate('/admin/settings')}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400">Administrator</p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm"
                  style={{
                    background: "linear-gradient(135deg, #0C2A47, #030B15)",
                    boxShadow: "0 2px 10px rgba(11,37,64,0.35), 0 0 0 1px rgba(226,185,77,0.18)",
                  }}
                >
                  {user?.name?.charAt(0) || "A"}
                </div>
              </div>
            </div>
          </header>

          {/* Notification Modal */}
          {notifOpen && (
            <>
              <div
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 999,
                  background: "rgba(0,0,0,0.3)",
                  backdropFilter: "blur(2px)",
                }}
                onClick={() => setNotifOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: 80,
                  right: 20,
                  width: 400,
                  maxHeight: 500,
                  background: "#fff",
                  borderRadius: 16,
                  boxShadow: "0 12px 48px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "20px",
                    borderBottom: "1px solid #E5E7EB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "linear-gradient(135deg, #0C2A47, #030B15)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span style={{ fontSize: 20 }}>🔔</span>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        Notifications
                      </h3>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: 12,
                          color: "rgba(226,185,77,0.85)",
                        }}
                      >
                        {unreadCount} unread
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifOpen(false)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      border: "none",
                      background: "rgba(226,185,77,0.18)",
                      color: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg
                      width={16}
                      height={16}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Notifications List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 0,
                  }}
                >
                  {loadingNotif ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#6B7280",
                      }}
                    >
                      Loading notifications...
                    </div>
                  ) : notifError ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#B8860B",
                      }}
                    >
                      {notifError}
                    </div>
                  ) : transformedNotifications.length === 0 ? (
                    <div
                      style={{
                        padding: "20px",
                        textAlign: "center",
                        color: "#6B7280",
                      }}
                    >
                      No notifications
                    </div>
                  ) : (
                    transformedNotifications.map((notif, index) => (
                      <div
                        key={notif.id}
                        style={{
                          padding: "16px 20px",
                          borderBottom:
                            index < transformedNotifications.length - 1
                              ? "1px solid #F3F4F6"
                              : "none",
                          background: notif.unread ? "#FBF7ED" : "#fff",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onClick={() => handleNotifClick(notif)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = notif.unread
                            ? "#F5EDD6"
                            : "#F9FAFB";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = notif.unread
                            ? "#FBF7ED"
                            : "#fff";
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 10,
                              background: notif.unread
                                ? "linear-gradient(135deg, #0C2A47, #030B15)"
                                : "#F3F4F6",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 18,
                              flexShrink: 0,
                            }}
                          >
                            {notif.icon}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 4,
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#111827",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {notif.title}
                              </h4>
                              {notif.unread && (
                                <span
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: "#E2B94D",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                            </div>
                            <p
                              style={{
                                margin: "0 0 6px",
                                fontSize: 13,
                                color: "#6B7280",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {notif.message}
                            </p>
                            <span
                              style={{
                                fontSize: 11,
                                color: "#9CA3AF",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <svg
                                width={12}
                                height={12}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: 14,
                    borderTop: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    display: "flex",
                    gap: 10,
                  }}
                >
                  {transformedNotifications.some(n => n.isRead) && (
                    <button
                      onClick={clearReadNotifications}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 10,
                        border: "1.5px solid #E5E7EB",
                        background: "#fff",
                        color: "#6B7280",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Clear Read
                    </button>
                  )}
                  <Link
                    to="/admin/notifications"
                    onClick={() => setNotifOpen(false)}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #E2B94D, #B8860B)",
                      color: "#0B2540",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "inline-block",
                      textAlign: "center",
                    }}
                  >
                    View All
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Mobile search */}
          {searchOpen && (
            <div className="border-b bg-white px-4 py-3 md:hidden">
              <GlobalSearch variant="mobile" autoFocus onNavigate={() => setSearchOpen(false)} />
            </div>
          )}

          {/* Page content */}
          <main className="dashboard-content flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;