import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { getNotificationDestination } from '../../utils/notificationNavigation';
import {
  Bell,
  BellRing,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar,
  FileText,
  MessageCircle,
  Gift,
  Loader2,
  X,
  Clock,
  User,
  Sparkles,
  ChevronRight,
  Package,
} from 'lucide-react';

/**
 * Notification type → icon
 */
const TYPE_ICONS = {
  general: Info,
  attendance: CheckCircle2,
  fee: AlertCircle,
  holiday: Calendar,
  exam: FileText,
  schedule: Calendar,
  announcement: BellRing,
  message: MessageCircle,
  birthday: Gift,
  homework: FileText,
  inventory: Package,
};

/**
 * Priority → theme colors (purple palette for parents)
 */
const PRIORITY_THEME = {
  low: {
    accent: '#94a3b8',
    soft: '#f8fafc',
    badgeBg: '#f1f5f9',
    badgeText: '#475569',
    label: 'Low',
  },
  medium: {
    accent: '#8b5cf6',
    soft: '#f5f3ff',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    label: 'Medium',
  },
  high: {
    accent: '#d946ef',
    soft: '#fdf4ff',
    badgeBg: '#fae8ff',
    badgeText: '#a21caf',
    label: 'High',
  },
  urgent: {
    accent: '#e11d48',
    soft: '#fff1f2',
    badgeBg: '#ffe4e6',
    badgeText: '#be123c',
    label: 'Urgent',
  },
};

/**
 * Turn a raw data key like "dueDate" / "fee_amount" into "Due Date" / "Fee Amount"
 */
const humanizeKey = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Turn a raw value into something readable — dates get formatted,
 * everything else is title-cased if it looks like a short code word.
 */
const humanizeValue = (key, value) => {
  if (value === null || value === undefined || value === '') return '—';

  const lowerKey = key.toLowerCase();
  if (/date|at$|time/.test(lowerKey)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (typeof value === 'string' && /^[a-z0-9_-]+$/i.test(value) && value.length < 24) {
    return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  if (typeof value === 'object') return null; // skip nested objects, keep it simple for parents

  return String(value);
};

// Keys we never want to surface — internal plumbing, not content
const HIDDEN_KEYS = new Set(['_id', 'id', '__v', 'notificationId', 'userId']);

/**
 * Format relative time (e.g., "2 hours ago")
 */
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};

export default function ParentNotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifications, unreadCount, loading, pagination, loadNotifications, markAsRead, markAllAsRead } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    const destination = getNotificationDestination(notif, user?.role);
    if (destination) {
      navigate(destination);
    } else {
      setSelectedNotif((prev) => (prev?._id === notif._id ? null : notif));
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLoadMore = () => {
    loadNotifications(pagination.page + 1, filter === 'unread');
  };

  const displayedNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  const getIcon = (type) => TYPE_ICONS[type] || Bell;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-fuchsia-50 to-slate-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Nunito', sans-serif; box-sizing: border-box; }

        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .notif-card { animation: fadeSlideIn 0.35s ease both; }

        @keyframes gentleRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(12deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(6deg); }
          40% { transform: rotate(0deg); }
        }
        .bell-ring { animation: gentleRing 2.2s ease-in-out infinite; }

        @keyframes pulseDot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.5); }
          70% { box-shadow: 0 0 0 6px rgba(147, 51, 234, 0); }
        }
        .pulse-dot { animation: pulseDot 1.8s ease-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .notif-card, .bell-ring, .pulse-dot { animation: none !important; }
        }
      `}</style>

      {/* ===== Hero header (purple, no blue) ===== */}
      <div className="bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-700 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-16 sm:pb-20 relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/20">
                {unreadCount > 0 ? (
                  <BellRing className="w-6 h-6 sm:w-7 sm:h-7 text-white bell-ring" />
                ) : (
                  <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                  Notifications
                </h1>
                <p className="text-purple-100 text-sm sm:text-base mt-0.5 flex items-center gap-1.5">
                  {unreadCount > 0 ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-300 flex-shrink-0" />
                      You have {unreadCount} unread {unreadCount === 1 ? 'update' : 'updates'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      You're all caught up!
                    </>
                  )}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-purple-700 rounded-xl hover:bg-purple-50 active:scale-[0.98] transition font-bold shadow-lg disabled:opacity-70 w-full sm:w-auto"
              >
                {markingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== Body ===== */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-12 relative pb-16">
        {/* Filter pills */}
        <div className="bg-white rounded-2xl shadow-md border border-purple-100 p-2 flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => {
              setFilter('all');
              loadNotifications(1, false);
            }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter('unread');
              loadNotifications(1, true);
            }}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition flex items-center justify-center gap-2 ${
              filter === 'unread'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span
                className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  filter === 'unread' ? 'bg-white/25 text-white' : 'bg-purple-100 text-purple-700'
                }`}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && displayedNotifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-500" />
            <p className="text-sm font-medium">Fetching your notifications…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && displayedNotifications.length === 0 && (
          <div className="text-center py-16 sm:py-20 bg-white rounded-2xl border border-dashed border-purple-200">
            <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-purple-300" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-700 mb-1">
              {filter === 'unread' ? 'Nothing left to read' : 'No notifications yet'}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              {filter === 'unread'
                ? 'Great job staying on top of things — new updates will show up here.'
                : "When the school sends an update, it'll land right here."}
            </p>
          </div>
        )}

        {/* Notification list */}
        {displayedNotifications.length > 0 && (
          <div className="space-y-3">
            {displayedNotifications.map((notif, idx) => {
              const IconComponent = getIcon(notif.type);
              const priority = notif.priority || 'low';
              const theme = PRIORITY_THEME[priority] || PRIORITY_THEME.low;
              const isSelected = selectedNotif?._id === notif._id;

              // Build a human-friendly list of extra details (skip internal keys / nested objects)
              const extraDetails = notif.data
                ? Object.entries(notif.data)
                    .filter(([k]) => !HIDDEN_KEYS.has(k))
                    .map(([k, v]) => ({ label: humanizeKey(k), value: humanizeValue(k, v) }))
                    .filter((item) => item.value !== null)
                : [];

              return (
                <div key={notif._id}>
                  <div
                    onClick={() => handleNotificationClick(notif)}
                    className="notif-card cursor-pointer rounded-2xl bg-white border border-purple-100 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 overflow-hidden"
                    style={{
                      animationDelay: `${Math.min(idx, 8) * 40}ms`,
                      boxShadow: isSelected ? `0 0 0 2px ${theme.accent}` : undefined,
                      background: notif.isRead ? '#fff' : theme.soft,
                    }}
                  >
                    <div className="p-4 sm:p-5 flex gap-3 sm:gap-4">
                      {/* Icon */}
                      <div
                        className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
                        style={{ background: theme.badgeBg, color: theme.accent }}
                      >
                        <IconComponent size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <p
                            className={`text-sm sm:text-base leading-snug ${
                              notif.isRead ? 'font-semibold text-slate-700' : 'font-bold text-slate-900'
                            }`}
                          >
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-purple-600 pulse-dot" />
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block" />
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 line-clamp-2 mb-2.5 leading-relaxed">
                          {notif.body}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Clock size={12} />
                            {formatTimeAgo(notif.createdAt)}
                          </span>
                          {notif.sender?.name && (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <User size={12} />
                              {notif.sender.name}
                            </span>
                          )}
                          <span
                            className="px-2 py-0.5 rounded-full font-semibold capitalize"
                            style={{ background: theme.badgeBg, color: theme.badgeText }}
                          >
                            {notif.type}
                          </span>
                          {priority !== 'low' && (
                            <span
                              className="px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: theme.badgeBg, color: theme.badgeText }}
                            >
                              {theme.label} priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail view */}
                  {isSelected && !notif.link && (
                    <div className="notif-card bg-white border border-purple-100 rounded-2xl p-5 sm:p-6 mt-2 mb-4 shadow-sm relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNotif(null);
                        }}
                        aria-label="Close details"
                        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                      >
                        <X size={16} />
                      </button>

                      <div
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-3"
                        style={{ background: theme.badgeBg, color: theme.badgeText }}
                      >
                        <IconComponent size={12} />
                        <span className="capitalize">{notif.type}</span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 mb-2 pr-8">
                        {notif.title}
                      </h3>
                      <p className="text-slate-600 mb-4 leading-relaxed text-sm sm:text-base">
                        {notif.body}
                      </p>

                      {extraDetails.length > 0 && (
                        <div className="bg-purple-50 rounded-xl p-4 mb-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                            Details
                          </p>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
                            {extraDetails.map((item) => (
                              <div key={item.label} className="flex items-center justify-between sm:justify-start sm:gap-2 text-sm">
                                <dt className="text-slate-500">{item.label}</dt>
                                <dd className="font-semibold text-slate-800">{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(notif.createdAt).toLocaleString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {displayedNotifications.length > 0 && pagination.page < pagination.pages && !loading && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-100 text-purple-600 rounded-xl hover:bg-purple-50 hover:border-purple-200 active:scale-[0.98] transition font-bold text-sm shadow-sm"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}