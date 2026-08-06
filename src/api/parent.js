import api from './axios';

// Parent profile
export const getParentProfileAPI = () => api.get('/parents/my-profile');

export const updateParentProfileAPI = (data) => api.put('/parents/my-profile', data);

// Children
export const getMyChildrenAPI = () => api.get('/students/my-children');

// Attendance
export const getStudentAttendanceAPI = (studentId, params) => 
  api.get(`/attendance/student/${studentId}`, { params });

export const getAttendanceAPI = (params) => api.get('/attendance/', { params });

export const getAttendanceDiffAPI = (studentId, params) => 
  api.get(`/parents/student/${studentId}/attendance-diff`, { params });

// Notifications
export const registerDeviceAPI = (data) => api.post('/notifications/register-device', data);

export const removeDeviceAPI = (data) => api.post('/notifications/remove-device', data);

export const getMyDevicesAPI = () => api.get('/notifications/my-devices');

export const testSendNotificationAPI = (data) => api.post('/notifications/test-send', data);