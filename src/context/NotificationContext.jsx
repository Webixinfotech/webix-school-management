import { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import usePushNotifications from '../hooks/usePushNotifications';
import useNotificationsHook from '../hooks/useNotifications';
import { getNotificationDestination } from '../utils/notificationNavigation';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const authToken = isAuthenticated ? localStorage.getItem('token') : null;

  // In-app notification state via API
  const inAppNotifications = useNotificationsHook({
    autoFetch: isAuthenticated,
    pollInterval: 60000,
  });
  const { loadNotifications, loadUnreadCount } = inAppNotifications;

  /**
   * When a foreground FCM message arrives,
   * trigger a refresh of in-app notifications
   */
  const handleForegroundMessage = useCallback((payload) => {
    console.log('📨 Foreground FCM notification:', payload);

    // Refresh in-app notifications when a push comes in
    loadUnreadCount();
    loadNotifications();

    // Show browser notification if permission granted
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    const title = payload?.notification?.title || 'Brain Builder';
    const body =
      payload?.notification?.body ||
      payload?.data?.message ||
      'You have a new message.';

    try {
      const browserNotification = new Notification(title, {
        body,
        icon: payload?.notification?.icon || '/logo.png',
        tag: payload?.data?.tag || 'brain-builder-notification',
        data: payload?.data,
      });
      browserNotification.onclick = () => {
        const destination = getNotificationDestination({
          type: payload?.data?.type,
          link: payload?.data?.link,
          data: payload?.data,
        }, user?.role);
        window.focus();
        if (destination) window.location.assign(destination);
        browserNotification.close();
      };
    } catch (err) {
      console.error('Foreground notification error:', err);
    }
  }, [loadNotifications, loadUnreadCount, user?.role]);

  // FCM push notification state
  const pushState = usePushNotifications({
    authToken,
    onMessage: handleForegroundMessage,
    autoInitialize: isAuthenticated,
  });

  const value = useMemo(
    () => ({
      // In-app API notifications
      ...inAppNotifications,
      // FCM push state
      push: pushState,
      // Auth info
      authToken,
      userRole: user?.role,
    }),
    [inAppNotifications, pushState, authToken, user]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Context and its hook intentionally live together as one public module.
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      error: null,
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      push: { initialized: false, permission: 'default' },
      authToken: null,
      userRole: null,
    };
  }
  return context;
};

export default NotificationContext;
