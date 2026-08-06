import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  markMultipleNotificationsAsRead,
  dismissNotification as dismissNotificationRequest,
  dismissMultipleNotifications,
} from '../services/notification.service';

/**
 * Hook for managing in-app notifications with API integration
 * Handles fetching, polling, and marking as read
 */
const useNotifications = (options = {}) => {
  const { autoFetch = true, pollInterval = 60000 } = options;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissingIds, setDismissingIds] = useState([]);
  const [clearingRead, setClearingRead] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 20 });
  const intervalRef = useRef(null);

  /**
   * Load notifications with pagination
   */
  const loadNotifications = useCallback(async (page = 1, unreadOnly = false) => {
    try {
      setLoading(true);
      setError(null);
      const payload = await getMyNotifications({ page, limit: 20, unreadOnly });
      const items = Array.isArray(payload.data) ? payload.data : [];
      if (page === 1) {
        setNotifications(items);
      } else {
        setNotifications(prev => {
          const knownIds = new Set(prev.map(item => item._id));
          return [...prev, ...items.filter(item => !knownIds.has(item._id))];
        });
      }
      if (payload.pagination) setPagination(payload.pagination);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load unread count
   */
  const loadUnreadCount = useCallback(async () => {
    try {
      const payload = await getUnreadCount();
      setUnreadCount(Number(payload?.data?.unreadCount) || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  /**
   * Mark single notification as read with optimistic update
   */
  const handleMarkAsRead = useCallback(async (id) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error('Error marking as read:', err);
      // Reload on failure
      await loadNotifications();
      await loadUnreadCount();
    }
  }, [loadNotifications, loadUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const handleMarkAllAsRead = useCallback(async () => {
    const prevNotifications = notifications;
    const prevCount = unreadCount;

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
      // Revert on failure
      setNotifications(prevNotifications);
      setUnreadCount(prevCount);
    }
  }, [notifications, unreadCount]);

  /**
   * Mark multiple notifications as read
   */
  const handleMarkMultipleAsRead = useCallback(async (ids) => {
    setNotifications(prev =>
      prev.map(n =>
        ids.includes(n._id) ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - ids.length));

    try {
      await markMultipleNotificationsAsRead(ids);
    } catch (err) {
      console.error('Error marking multiple as read:', err);
      // Reload on failure
      await loadNotifications();
      await loadUnreadCount();
    }
  }, [loadNotifications, loadUnreadCount]);

  /** Dismiss one notification for only the current user. */
  const handleDismiss = useCallback(async (id) => {
    const notification = notifications.find(item => item._id === id);
    if (!notification || dismissingIds.includes(id)) return false;

    setDismissingIds(prev => [...prev, id]);
    setNotifications(prev => prev.filter(item => item._id !== id));
    setPagination(prev => ({ ...prev, total: Math.max(0, (prev.total || 0) - 1) }));
    if (!notification.isRead) setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await dismissNotificationRequest(id);
      return true;
    } catch (err) {
      console.error('Error dismissing notification:', err);
      setError(err?.response?.data?.message || 'Failed to dismiss notification');
      await Promise.all([loadNotifications(), loadUnreadCount()]);
      return false;
    } finally {
      setDismissingIds(prev => prev.filter(itemId => itemId !== id));
    }
  }, [notifications, dismissingIds, loadNotifications, loadUnreadCount]);

  /** Clear only notifications that the user has already read. */
  const handleClearRead = useCallback(async () => {
    const readIds = notifications.filter(item => item.isRead).map(item => item._id);
    if (readIds.length === 0 || clearingRead) return false;

    setClearingRead(true);
    setNotifications(prev => prev.filter(item => !readIds.includes(item._id)));
    setPagination(prev => ({ ...prev, total: Math.max(0, (prev.total || 0) - readIds.length) }));

    try {
      await dismissMultipleNotifications(readIds);
      return true;
    } catch (err) {
      console.error('Error clearing read notifications:', err);
      setError(err?.response?.data?.message || 'Failed to clear read notifications');
      await Promise.all([loadNotifications(), loadUnreadCount()]);
      return false;
    } finally {
      setClearingRead(false);
    }
  }, [notifications, clearingRead, loadNotifications, loadUnreadCount]);

  /**
   * Auto-fetch on mount and set up polling.
   *
   * FIX: previously `focus` and `visibilitychange` were two separate
   * listeners both calling refresh() directly. Switching away to another
   * app/window and back fires BOTH events within milliseconds of each
   * other, so every tab-switch was silently doubling the network calls
   * (2x /my-notifications + 2x /unread-count). A shared throttle guard
   * below collapses any refresh requests that land within MIN_REFRESH_GAP
   * of the last one into a single call.
   */
  useEffect(() => {
    if (!autoFetch) return;

    loadNotifications();
    loadUnreadCount();

    const MIN_REFRESH_GAP = 10000; // don't refetch more than once per 10s no matter what triggered it
    let lastRefreshAt = Date.now();

    const refresh = () => {
      const now = Date.now();
      if (now - lastRefreshAt < MIN_REFRESH_GAP) return;
      lastRefreshAt = now;
      loadNotifications(1, false);
      loadUnreadCount();
    };

    // There's no WebSocket/realtime channel — FCM push (when permission is
    // granted) triggers an immediate refresh via NotificationContext, and
    // this poll is the fallback that keeps the UI correct otherwise.
    // Skip the tick entirely while the tab is in the background — no point
    // burning API calls for a screen nobody is looking at. visibilitychange
    // below already forces a fresh fetch the moment the tab comes back.
    intervalRef.current = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      refresh();
    }, pollInterval);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    // Only one listener needed: visibilitychange already fires when the OS
    // brings this window/tab back into focus, making the separate 'focus'
    // listener redundant (and the source of the double-call bug above).
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [autoFetch, loadNotifications, loadUnreadCount, pollInterval]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    loadNotifications,
    loadUnreadCount,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    markMultipleAsRead: handleMarkMultipleAsRead,
    dismissNotification: handleDismiss,
    clearReadNotifications: handleClearRead,
    dismissingIds,
    clearingRead,
    setNotifications,
  };
};

export default useNotifications;
export { useNotifications };