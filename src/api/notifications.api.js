import api from './axios';

// User-facing notification reads/mark-as-read/dismiss live in
// src/services/notification.service.js (used by the useNotifications hook
// for the Teacher/Parent/Admin bell icon) — this file is admin-management
// only, so there's a single implementation of each endpoint.

/**
 * Admin: Get all notifications (admin listing)
 */
export const fetchAllNotifications = (params) =>
  api.get('/notifications', { params }).then(res => res.data);

/**
 * Admin: Create a new notification
 */
export const createNotification = (data) =>
  api.post('/notifications', data).then(res => res.data);

/**
 * Admin: Delete a notification
 */
export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`).then(res => res.data);

/**
 * Admin: Delete multiple selected notifications
 */
export const bulkDeleteNotifications = (notificationIds) =>
  api.delete('/notifications/bulk', { data: { notificationIds } }).then(res => res.data);

/**
 * Admin: Clear (delete) all notifications, optionally filtered by { type, targetType }
 */
export const clearAllNotifications = (params) =>
  api.delete('/notifications/clear-all', { params }).then(res => res.data);
