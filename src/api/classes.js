import api from './axios';

// Get all classes with pagination, search, and filtering
export const getClassesAPI = async (params = {}) => {
  const response = await api.get('/classes', { params });
  return response.data;
};

// Get single class by ID
export const getClassByIdAPI = async (id) => {
  const response = await api.get(`/classes/${id}`);
  return response.data;
};

// Create a new class
export const createClassAPI = async (classData) => {
  const response = await api.post('/classes', classData);
  return response.data;
};

// Update an existing class
export const updateClassAPI = async (id, classData) => {
  const response = await api.put(`/classes/${id}`, classData);
  return response.data;
};

// Soft delete a class (admin only)
export const deleteClassAPI = async (id) => {
  const response = await api.delete(`/classes/${id}`);
  return response.data;
};

// Get classes by type (FIXED_TIME, FLEX_TIME, HOURS_BASED)
export const getClassesByTypeAPI = async (classType) => {
  const response = await api.get(`/classes/type/${classType}`);
  return response.data;
};

// Get classes by day (MON, TUE, WED, THU, FRI, SAT, SUN)
export const getClassesByDayAPI = async (day) => {
  const response = await api.get(`/classes/day/${day}`);
  return response.data;
};

// Get students enrolled in a specific class (with pagination)
export const getClassStudentsAPI = async (classId, params = {}) => {
  const response = await api.get(`/classes/${classId}/students`, { params });
  return response.data;
};

// Get teachers assigned to a specific class
export const getClassTeachersAPI = async (classId) => {
  const response = await api.get(`/classes/${classId}/teachers`);
  return response.data;
};

// Get my classes (teacher only - returns classes assigned to the teacher)
export const getMyClassesAPI = async () => {
  const response = await api.get('/classes/my-classes');
  return response.data;
};

// Assign or unassign teacher to a class (teacherId can be null to unassign)
export const assignTeacherAPI = async (classId, teacherId) => {
  const response = await api.put(`/classes/${classId}/assign-teacher`, { teacherId });
  return response.data;
};

// Get class by classId string (e.g., "CLS001")
export const getClassByClassIdAPI = async (classId) => {
  const response = await api.get(`/classes/${classId}`);
  return response.data;
};

// Get classes filtered by status
export const getClassesByStatusAPI = async (status) => {
  const response = await api.get('/classes', { params: { status } });
  return response.data;
};
