import axios from 'axios';
import api from './axios';

// ═══════════════════════════════════════════════════════
// PUBLIC enquiry API — no auth token needed
// ═══════════════════════════════════════════════════════
const enquiryApi = axios.create({
  // Use explicit VITE_API_URL when provided
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Step 1: Create enquiry (mobile + services)
export const createEnquiryStep1 = async (data) => {
  const response = await enquiryApi.post('/enquiries/step-1', data);
  return response.data;
};

// Step 2: Update child or job info
export const updateEnquiryStep2 = async (enquiryId, data) => {
  const response = await enquiryApi.put(`/enquiries/step-2/${enquiryId}`, data);
  return response.data;
};

// Step 3: Update parent details
export const updateEnquiryStep3 = async (enquiryId, data) => {
  const response = await enquiryApi.put(`/enquiries/step-3/${enquiryId}`, data);
  return response.data;
};

// Step 4: Update visit details + finalize
export const updateEnquiryStep4 = async (enquiryId, data) => {
  const response = await enquiryApi.put(`/enquiries/step-4/${enquiryId}`, data);
  return response.data;
};

// ═══════════════════════════════════════════════════════
// ADMIN enquiry API — requires auth token
// ═══════════════════════════════════════════════════════

// Get enquiry stats
export const getEnquiryStats = async () => {
  const response = await api.get('/enquiries/stats');
  return response.data;
};

// Get all enquiries (paginated)
export const getEnquiries = async (params = {}) => {
  const response = await api.get('/enquiries', { params });
  return response.data;
};

// Get single enquiry by ID
export const getEnquiryById = async (enquiryId) => {
  const response = await api.get(`/enquiries/${enquiryId}`);
  return response.data;
};

// Update enquiry (admin)
export const updateEnquiry = async (enquiryId, data) => {
  const response = await api.put(`/enquiries/${enquiryId}`, data);
  return response.data;
};

// Update enquiry status
export const updateEnquiryStatus = async (enquiryId, status) => {
  const response = await api.put(`/enquiries/${enquiryId}/status`, { status });
  return response.data;
};

// Convert enquiry to student (admit)
export const convertEnquiryToStudent = async (enquiryId, data) => {
  const response = await api.post(`/enquiries/${enquiryId}/convert`, data);
  return response.data;
};

// Delete enquiry
export const deleteEnquiry = async (enquiryId) => {
  const response = await api.delete(`/enquiries/${enquiryId}`);
  return response.data;
};
