import api from './axios';

// Get all students with filters and pagination
export const getStudentsAPI = (params = {}) =>
  api.get('/students', { params });

// Get single student by _id or admissionNo
export const getStudentAPI = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

// Create student with parent account
// Accepts both JSON (no file) and FormData (with file upload)
export const createStudentAPI = (data, isFormData = false) =>
  api.post('/students', data, {
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  });

// Update student details
// Accepts both JSON (no file) and FormData (with file upload)
export const updateStudentAPI = (id, data, isFormData = false) =>
  api.put(`/students/${id}`, data, {
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  });

// Update student photo (multipart/form-data)
// Don't set Content-Type manually - browser adds the boundary automatically
export const updateStudentPhotoAPI = (id, file) => {
  const formData = new FormData();
  formData.append('photo', file);
  return api.put(`/students/${id}/photo`, formData, {
    headers: {} // Browser will set multipart/form-data with boundary
  });
};

// Delete student
export const deleteStudentAPI = (id) =>
  api.delete(`/students/${id}`);

// Get my children (parent only)
export const getMyChildrenAPI = async () => {
  const response = await api.get('/students/my-children');
  return response.data;
};
