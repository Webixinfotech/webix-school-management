import api from './axios';

// ─── Calendar API Service ──────────────────────────────────────────────────
// Base: /api/calendar
//
// Roles:
//   admin   — full access (upload, CRUD, assign, batch delete)
//   teacher — full access (same as admin for calendar)
//   parent  — read-only via /my-events (only sees events assigned to them
//              or visibleToAll events within their allowedCalTypes)
// ──────────────────────────────────────────────────────────────────────────

export const calendarAPI = {

  // ─── UPLOAD ───────────────────────────────────────────────────────────

  /**
   * Upload a calendar Excel file.
   * POST /api/calendar/upload  (multipart/form-data)
   *
   * @param {File}   file           - The .xlsx file to upload
   * @param {string} session        - Session label, e.g. "April 2026"
   * @param {string} [calType]      - "AUTO" | "SCHOOL_CAL" | "KIDS_CLUB_CAL"  (default: "AUTO")
   * @param {boolean} [replaceSession] - If true, deletes existing events for the
   *                                    session before inserting new ones
   *
   * Response:
   *   {
   *     success, message,
   *     data: { inserted, skipped, errors, uploadBatchId, session }
   *   }
   */
  uploadCalendar: async (file, session, calType = 'AUTO', replaceSession = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('calType', calType);
    formData.append('session', session);
    formData.append('replaceSession', String(replaceSession));

    const response = await api.post('/calendar/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // ─── READ — ADMIN / TEACHER ───────────────────────────────────────────

  /**
   * Get calendar events (admin / teacher).
   * GET /api/calendar/events
   *
   * All query params are optional:
   * @param {object} filters
   * @param {string}  [filters.calType]      - "SCHOOL_CAL" | "KIDS_CLUB_CAL"
   * @param {boolean} [filters.isHoliday]    - true → only holiday rows
   * @param {string}  [filters.from]         - ISO date "YYYY-MM-DD"
   * @param {string}  [filters.to]           - ISO date "YYYY-MM-DD"
   * @param {string}  [filters.search]       - Free-text search on eventName
   * @param {string}  [filters.session]      - Exact session label, e.g. "April 2026"
   * @param {number}  [filters.page]         - Page number (default 1)
   * @param {number}  [filters.limit]        - Page size  (default 50)
   *
   * Response:
   *   { success, events: [], total, page, limit, pages }
   */
  getEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.calType)              params.set('calType',   filters.calType);
    if (filters.isHoliday != null)    params.set('isHoliday', filters.isHoliday);
    if (filters.from)                 params.set('from',      filters.from);
    if (filters.to)                   params.set('to',        filters.to);
    if (filters.search)               params.set('search',    filters.search);
    if (filters.session)              params.set('session',   filters.session);
    if (filters.page)                 params.set('page',      filters.page);
    if (filters.limit)                params.set('limit',     filters.limit);

    const response = await api.get(`/calendar/events?${params}`);
    return response.data;
  },

  // ─── READ — PARENT ────────────────────────────────────────────────────

  /**
   * Get calendar events for the currently authenticated parent.
   * Returns only events where visibleToAll=true OR visibleTo includes their userId,
   * filtered by their allowedCalTypes.
   * GET /api/calendar/my-events
   *
   * @param {object} filters
   * @param {string}  [filters.calType]  - filter by calendar type
   * @param {string}  [filters.from]     - ISO date "YYYY-MM-DD"
   * @param {string}  [filters.to]       - ISO date "YYYY-MM-DD"
   * @param {number}  [filters.page]
   * @param {number}  [filters.limit]
   *
   * Response:
   *   { success, message, events: [], total, page, limit, pages, allowedCalTypes }
   */
  getMyEvents: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.calType) params.set('calType', filters.calType);
    if (filters.from)    params.set('from',    filters.from);
    if (filters.to)      params.set('to',      filters.to);
    if (filters.page)    params.set('page',    filters.page);
    if (filters.limit)   params.set('limit',   filters.limit);

    const response = await api.get(`/calendar/my-events?${params}`);
    return response.data;
  },

  // ─── SESSIONS & BATCHES ───────────────────────────────────────────────

  /**
   * List all distinct session labels.
   * GET /api/calendar/sessions
   *
   * Response: { success, data: ["April 2026", ...] }
   */
  getSessions: async () => {
    const response = await api.get('/calendar/sessions');
    return response.data;
  },

  /**
   * List all upload batches with stats.
   * GET /api/calendar/batches
   *
   * Response:
   *   {
   *     success, count,
   *     data: [
   *       { _id (uploadBatchId), session, count, firstDate, lastDate,
   *         uploadedAt, schoolCalCount, kidsClubCount }
   *     ]
   *   }
   */
  getBatches: async () => {
    const response = await api.get('/calendar/batches');
    return response.data;
  },

  // ─── SINGLE EVENT CRUD ────────────────────────────────────────────────

  /**
   * Update a single calendar event.
   * PUT /api/calendar/events/:id
   *
   * @param {string} id          - Event _id
   * @param {object} updateData  - Fields to update (any subset of event fields)
   *   Commonly updated fields:
   *     day, date, time, className, eventName, calType,
   *     isHoliday, isHighlighted, rowColor, session
   *
   * Response: { success, message, data: { ...updatedEvent } }
   */
  updateEvent: async (id, updateData) => {
    const response = await api.put(`/calendar/events/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a single calendar event.
   * DELETE /api/calendar/events/:id
   *
   * Response: { success, message }
   */
  deleteEvent: async (id) => {
    const response = await api.delete(`/calendar/events/${id}`);
    return response.data;
  },

  // ─── VISIBILITY / ASSIGNMENT ──────────────────────────────────────────

  /**
   * Assign (or replace) the parent audience for a single event.
   * PUT /api/calendar/events/:id/assign-parents
   *
   * Passing parentUserIds replaces the existing visibleTo list and sets
   * visibleToAll=false.  Pass an empty array to clear all assigned parents.
   *
   * @param {string}   id             - Event _id
   * @param {string[]} parentUserIds  - Array of parent user _id strings
   *
   * Response: { success, message, data: { ...updatedEvent } }
   */
  assignParents: async (id, parentUserIds = []) => {
    const response = await api.put(`/calendar/events/${id}/assign-parents`, {
      parentUserIds,
    });
    return response.data;
  },

  /**
   * Bulk-assign all events of a given calType to one or more parents.
   * POST /api/calendar/bulk-assign
   *
   * This sets visibleToAll=false and sets visibleTo to parentUserIds for
   * every active event matching the calType.
   *
   * @param {string}   calType        - "SCHOOL_CAL" | "KIDS_CLUB_CAL"
   * @param {string[]} parentUserIds  - Array of parent user _id strings
   *
   * Response:
   *   { success, message, data: { updated, calType } }
   */
  bulkAssign: async (calType, parentUserIds = []) => {
    const response = await api.post('/calendar/bulk-assign', {
      calType,
      parentUserIds,
    });
    return response.data;
  },

  // ─── BATCH DELETE ─────────────────────────────────────────────────────

  /**
   * Delete all events belonging to an upload batch.
   * DELETE /api/calendar/batch/:uploadBatchId
   *
   * @param {string} uploadBatchId  - The batch UUID from upload response
   *
   * Response:
   *   { success, message, data: { deleted, uploadBatchId } }
   */
  deleteBatch: async (uploadBatchId) => {
    const response = await api.delete(`/calendar/batch/${uploadBatchId}`);
    return response.data;
  },
};