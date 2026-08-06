import api from '../api/axios';

/**
 * User-facing in-app notification APIs.
 * The shared axios client supplies the API base URL and JWT header.
 */
export const getMyNotifications = async (params = {}) => {
  const response = await api.get('/notifications/my-notifications', {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
      unreadOnly: params.unreadOnly || false,
    },
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/mark-all-read');
  return response.data;
};

export const markMultipleNotificationsAsRead = async (notificationIds) => {
  const response = await api.put('/notifications/mark-read', { notificationIds });
  return response.data;
};

export const dismissNotification = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/dismiss`);
  return response.data;
};

export const dismissMultipleNotifications = async (notificationIds) => {
  const response = await api.put('/notifications/dismiss-multiple', { notificationIds });
  return response.data;
};

export const getNotificationDetail = async (notificationId) => {
  const response = await api.get(`/notifications/${notificationId}`);
  return response.data;
};

