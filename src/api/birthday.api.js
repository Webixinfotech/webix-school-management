import api from './axios';

// ─── Birthday API Service ──────────────────────────────────────────────────
// Endpoints: /api/birthdays/*
// Roles: admin, teacher (read-only for teacher — only sees students)
// ──────────────────────────────────────────────────────────────────────────

export const birthdayAPI = {

  // ─── ADMIN ────────────────────────────────────────────────────────────

  /**
   * Fetch upcoming birthdays (admin only).
   *
   * Query params (all optional):
   *   flat      {boolean} — if true, returns a flat array instead of grouped object
   *   category  {string}  — comma-separated filter: 'student', 'staff', 'parent'
   *                         e.g. 'student,staff'
   *
   * Response without flat:
   *   { success, message, data: { student: [], staff: [], parent: [] } }
   *
   * Response with flat=true:
   *   { success, message, data: [] }  — all categories merged, sorted by daysRemaining
   *
   * Examples:
   *   birthdayAPI.getAdminUpcoming()
   *   birthdayAPI.getAdminUpcoming({ flat: true })
   *   birthdayAPI.getAdminUpcoming({ category: 'student,staff' })
   */
  getAdminUpcoming: async (params = {}) => {
    const response = await api.get('/birthdays/admin/upcoming', { params });
    return response.data;
  },

  /**
   * Trigger birthday notifications for today's birthdays (admin only).
   * POST /api/birthdays/admin/send-notifications
   *
   * Response: { success, message, data: { sent, skipped, failed } }
   */
  sendAdminNotifications: async () => {
    const response = await api.post('/birthdays/admin/send-notifications', {});
    return response.data;
  },

  // ─── TEACHER ──────────────────────────────────────────────────────────

  /**
   * Fetch upcoming student birthdays (teacher only).
   * Returns a flat array of student birthdays only.
   * GET /api/birthdays/teacher/upcoming
   *
   * Response: { success, message, data: [] }
   */
  getTeacherUpcoming: async () => {
    const response = await api.get('/birthdays/teacher/upcoming');
    return response.data;
  },

  // ─── SHARED (admin + teacher) ──────────────────────────────────────────

  /**
   * Fetch birthday card data for a specific person.
   * GET /api/birthdays/card/:type/:id
   *
   * @param {string} type  - 'student' | 'staff'
   * @param {string} id    - person's _id
   *
   * Response: {
   *   success, message,
   *   data: {
   *     id, name, role, dob, birthdayDate, daysRemaining,
   *     photo, hasPhoto, class, section, department,
   *     cardTemplate,      // 'photo_card' | 'name_card'
   *     fallbackInitials   // e.g. 'DS' for "Demo Student"
   *   }
   * }
   */
  getBirthdayCard: async (type, id) => {
    const response = await api.get(`/birthdays/card/${type}/${id}`);
    return response.data;
  },

  /**
   * Fetch WhatsApp share data for a specific person.
   * GET /api/birthdays/whatsapp-share/:type/:id
   *
   * @param {string} type  - 'student' | 'staff'
   * @param {string} id    - person's _id
   *
   * Response: {
   *   success, message,
   *   data: {
   *     ...same as card data,
   *     shareText,    // pre-built emoji greeting string
   *     shareChannel  // 'whatsapp'
   *   }
   * }
   */
  getWhatsAppShare: async (type, id) => {
    const response = await api.get(`/birthdays/whatsapp-share/${type}/${id}`);
    return response.data;
  },
};

// ─── Convenience helpers ───────────────────────────────────────────────────

/**
 * Open WhatsApp with a pre-filled birthday message.
 * Pass the shareText from getWhatsAppShare() response.
 *
 * @param {string} shareText - The message string from API
 * @param {string} [phone]   - Optional phone number (without +), opens chat if provided
 */
export const openWhatsAppShare = (shareText, phone = '') => {
  const encoded = encodeURIComponent(shareText);
  if (phone) {
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('91')) {
      formattedPhone = '91' + formattedPhone;
    }
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  } else {
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
  }
};