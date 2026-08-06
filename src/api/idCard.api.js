import api from './axios';

// ─── ID Cards API Service ─────────────────────────────────────────────────────
//
// Role summary:
//   Admin   → templates CRUD, student/staff card data, download, bulk, QR, export-logs
//   Teacher → student/staff card data, download, QR
//   Parent  → my-child card data + download
//
// All endpoints live under /id-cards/*
// ──────────────────────────────────────────────────────────────────────────────

export const idCardAPI = {

  /**
   * Get a preview of an ID card with template layout applied.
   * POST /api/id-cards/templates/preview
   * Roles: admin, teacher
   *
   * @param {object} payload - preview request
   *   entityType {string} - 'student' | 'staff'
   *   entityId   {string} - student/staff ID
   *   templateId {string} - optional; uses default template if omitted
   *
   * Response: { success, data: { template, layout, cardData } }
   *   template: Template configuration
   *   layout:   Layout positions for each field (x, y, width, height)
   *   cardData: Student/Staff card data with QR code
   */
  previewCard: async (payload) => {
    const response = await api.post('/id-cards/templates/preview', payload);
    return response.data;
  },

  // ─── TEMPLATES ─────────────────────────────────────────────────────────────

  /**
   * List all templates (admin only).
   * GET /api/id-cards/templates
   *
   * @param {object} params - optional filters
   *   type {string} - 'student' | 'staff'
   *
   * Response: { success, count, data: Template[] }
   */
  getTemplates: async (params = {}) => {
    const response = await api.get('/id-cards/templates', { params });
    return response.data;
  },

  /**
   * Create a new template (admin only).
   * POST /api/id-cards/templates
   *
   * @param {object} payload - full template definition (see API doc for shape)
   *   Required: name, type ('student'|'staff')
   *   Optional: isDefault, orientation, branding{}, header{}, body{},
   *             backSide{}, footer{}, qrConfig{}, session, validityDate
   *
   * Response: { success, message, data: Template }
   */
  createTemplate: async (payload) => {
    const response = await api.post('/id-cards/templates', payload);
    return response.data;
  },

  /**
   * Update a template by ID (admin only).
   * PUT /api/id-cards/templates/:id
   *
   * @param {string} id      - template _id
   * @param {object} fields  - partial update (only send what changed)
   *   e.g. { name, branding: { primaryColor }, footer: { customText } }
   *
   * Response: { success, message, data: Template }
   */
  updateTemplate: async (id, fields) => {
    const response = await api.put(`/id-cards/templates/${id}`, fields);
    return response.data;
  },

  /**
   * Deactivate (soft-delete) a template (admin only).
   * DELETE /api/id-cards/templates/:id
   *
   * Response: { success, message }
   */
  deleteTemplate: async (id) => {
    const response = await api.delete(`/id-cards/templates/${id}`);
    return response.data;
  },

  // ─── STUDENT ID CARD DATA ──────────────────────────────────────────────────

  /**
   * Fetch ID card data for a student.
   * GET /api/id-cards/student/:studentId
   * Roles: admin, teacher
   *
   * Response: { success, message, data: StudentCardData }
   *   data includes: id, name, admissionNo, rollNo, class, section,
   *                  dob, bloodGroup, photo, hasPhoto, parentName,
   *                  contactNumber, address, session, validity,
   *                  qrCode (base64), qrData, template, templateId
   */
  getStudentCard: async (studentId) => {
    const response = await api.get(`/id-cards/student/${studentId}`);
    return response.data;
  },

  /**
   * Download PDF of a student ID card.
   * GET /api/id-cards/student/:studentId/download
   * Roles: admin, teacher
   *
   * @param {string} studentId
   * @param {string} [templateId] - optional; uses default template if omitted
   *
   * Returns binary PDF — triggers browser download.
   */
  downloadStudentCard: async (studentId, templateId) => {
    const params = templateId ? { templateId } : {};
    const response = await api.get(`/id-cards/student/${studentId}/download`, {
      params,
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Get QR code for a student.
   * GET /api/id-cards/student/:studentId/qr
   * Roles: admin, teacher
   *
   * Response: { success, data: { id, admissionNo, qrData, qrCode (base64) } }
   */
  getStudentQR: async (studentId) => {
    const response = await api.get(`/id-cards/student/${studentId}/qr`);
    return response.data;
  },

  /**
   * Bulk fetch / generate student ID cards.
   * POST /api/id-cards/student/bulk
   * Roles: admin
   *
   * @param {object} payload  - at least one of:
   *   className   {string}   - generate for entire class
   *   studentIds  {string[]} - generate for specific students
   *   templateId  {string}   - optional; uses default if omitted
   *
   * Response: binary PDF blob
   */
  bulkStudentCards: async (payload) => {
    const response = await api.post('/id-cards/student/bulk', payload, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Generate an A4 sheet PDF of student ID cards (10 per page).
   * POST /api/id-cards/student/a4-sheet
   * Roles: admin
   *
   * @param {object} payload - { className, section, templateId }
   *
   * Response: binary PDF blob
   */
  generateStudentA4Sheet: async (payload) => {
    const response = await api.post('/id-cards/student/a4-sheet', payload, {
      responseType: 'blob',
    });
    return response;
  },


  // ─── STAFF ID CARD DATA ────────────────────────────────────────────────────

  /**
   * Fetch ID card data for a staff member.
   * GET /api/id-cards/staff/:staffId
   * Roles: admin, teacher
   *
   * Response: { success, message, data: StaffCardData }
   *   data includes: id, name, employeeId, designation, department,
   *                  dob, joiningDate, bloodGroup, contactNumber,
   *                  photo, hasPhoto, session, validity,
   *                  qrCode (base64), qrData, template, templateId
   */
  getStaffCard: async (staffId) => {
    const response = await api.get(`/id-cards/staff/${staffId}`);
    return response.data;
  },

  /**
   * Download PDF of a staff ID card.
   * GET /api/id-cards/staff/:staffId/download
   * Roles: admin, teacher
   *
   * Returns binary PDF blob.
   */
  downloadStaffCard: async (staffId, templateId) => {
    const params = templateId ? { templateId } : {};
    const response = await api.get(`/id-cards/staff/${staffId}/download`, {
      params,
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Get QR code for a staff member.
   * GET /api/id-cards/staff/:staffId/qr
   * Roles: admin
   *
   * Response: { success, data: { id, employeeId, qrData, qrCode (base64) } }
   */
  getStaffQR: async (staffId) => {
    const response = await api.get(`/id-cards/staff/${staffId}/qr`);
    return response.data;
  },

  /**
   * Bulk fetch / generate staff ID cards.
   * POST /api/id-cards/staff/bulk
   * Roles: admin
   *
   * @param {object} payload - optional filters: { department, templateId }
   *   Pass {} to generate for all staff
   *
   * Response: binary PDF blob
   */
  bulkStaffCards: async (payload = {}) => {
    const response = await api.post('/id-cards/staff/bulk', payload, {
      responseType: 'blob',
    });
    return response;
  },

  /**
   * Generate an A4 sheet PDF of staff ID cards (9 per page).
   * POST /api/id-cards/staff/a4-sheet
   * Roles: admin
   *
   * @param {object} payload - { teacherIds, templateId }
   *
   * Response: binary PDF blob
   */
  generateStaffA4Sheet: async (payload) => {
    const response = await api.post('/id-cards/staff/a4-sheet', payload, {
      responseType: 'blob',
    });
    return response;
  },

  // ─── PARENT — MY CHILD ─────────────────────────────────────────────────────

  /**
   * Fetch ID card data for parent's own child.
   * GET /api/id-cards/my-child/:studentId
   * Roles: parent
   *
   * Response: { success, message, data: StudentCardData }
   */
  getMyChildCard: async (studentId) => {
    const response = await api.get(`/id-cards/my-child/${studentId}`);
    return response.data;
  },

  /**
   * Download PDF of parent's own child's ID card.
   * GET /api/id-cards/my-child/:studentId/download
   * Roles: parent
   *
   * Returns binary PDF blob.
   */
  downloadMyChildCard: async (studentId) => {
    const response = await api.get(`/id-cards/my-child/${studentId}/download`, {
      responseType: 'blob',
    });
    return response;
  },

  // ─── EXPORT LOGS ───────────────────────────────────────────────────────────

  /**
   * Fetch export history logs (admin only).
   * GET /api/id-cards/export-logs
   *
   * @param {object} params - optional filters:
   *   cardType  {string} - 'student' | 'staff'
   *   page      {number} - default 1
   *   limit     {number} - default 20
   *
   * Response: {
   *   success, logs[], total, page, limit, pages
   * }
   * Each log: { exportType, cardType, count, format, templateId{},
   *             filters{}, status, generatedBy{}, createdAt }
   */
  getExportLogs: async (params = {}) => {
    const response = await api.get('/id-cards/export-logs', { params });
    return response.data;
  },
};

// ─── UTILITY ──────────────────────────────────────────────────────────────────

/**
 * Trigger browser download from a blob response.
 * Use after any download* call above.
 *
 * @param {AxiosResponse} blobResponse - axios response with responseType:'blob'
 * @param {string} filename            - e.g. 'student-id-BB260003.pdf'
 */
export const triggerPdfDownload = (blobResponse, filename = 'id-card.pdf') => {
  const url = window.URL.createObjectURL(new Blob([blobResponse.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};