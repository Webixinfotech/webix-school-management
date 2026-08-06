import api from './axios';

// ─── Documents API Service ─────────────────────────────────────────────────
//
// Backs 3 document types: achievement | leaving | experience
// Role summary:
//   Admin/Sub-admin → all 3 docTypes, full CRUD + assign
//   Teacher         → achievement certificates only
//   Parent          → read-only, sees documents assigned to them
//
// All endpoints live under /documents/*
// ─────────────────────────────────────────────────────────────────────────────

export const documentsAPI = {
  /**
   * Upload/replace the current user's reusable signature.
   * POST /api/documents/signature
   * Body: { image: "data:image/png;base64,...." }
   * Response: { success, message, data: { signatureUrl } }
   */
  uploadSignature: async (base64Image) => {
    const response = await api.post('/documents/signature', { image: base64Image });
    return response.data;
  },

  /**
   * Get the current user's saved signature (if any).
   * GET /api/documents/signature
   * Response: { success, data: { signatureUrl } }
   */
  getMySignature: async () => {
    const response = await api.get('/documents/signature');
    return response.data;
  },

  /**
   * Prefill form data from a Student or Teacher record.
   * GET /api/documents/prefill?docType=achievement|leaving|experience&studentId=&teacherId=
   * Response: { success, data: {...mapped fields...} }
   */
  getPrefillData: async ({ docType, studentId, teacherId }) => {
    const params = { docType };
    if (studentId) params.studentId = studentId;
    if (teacherId) params.teacherId = teacherId;
    const response = await api.get('/documents/prefill', { params });
    return response.data;
  },

  /**
   * Save (and optionally assign) a new document.
   * POST /api/documents
   * Body: { docType, templateName, sourceType, sourceId, fieldValues, assignedTo?, signatureUrl? }
   * Response: { success, message, data: DocumentIssue }
   */
  createDocument: async (payload) => {
    const response = await api.post('/documents', payload);
    return response.data;
  },

  /**
   * Edit an existing document (fields, template, or reassign).
   * PUT /api/documents/:id
   * Response: { success, message, data: DocumentIssue }
   */
  updateDocument: async (id, payload) => {
    const response = await api.put(`/documents/${id}`, payload);
    return response.data;
  },

  /**
   * Documents assigned to the current logged-in user ("My Documents" panel).
   * GET /api/documents/my-documents
   * Response: { success, count, data: DocumentIssue[] }
   */
  getMyDocuments: async () => {
    const response = await api.get('/documents/my-documents');
    return response.data;
  },

  /**
   * Documents the current admin/teacher has issued (history/management view).
   * GET /api/documents/issued-by-me?docType=
   * Response: { success, count, data: DocumentIssue[] }
   */
  getIssuedByMe: async (docType) => {
    const params = docType ? { docType } : {};
    const response = await api.get('/documents/issued-by-me', { params });
    return response.data;
  },

  /**
   * Full detail of a single document — used for preview + download rendering.
   * GET /api/documents/:id
   * Response: { success, data: DocumentIssue }
   */
  getDocumentById: async (id) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
};

export default documentsAPI;
