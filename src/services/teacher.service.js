// src/services/teacher.service.js
import api from '../api/axios';

/**
 * Teacher Service using shared axios client.
 * Authorization header is auto-attached by axios interceptor.
 */
const teacherService = {
  getMyClasses: async () => {
    const res = await api.get('/classes/my-classes');
    return res.data;
  },

  getClassStudents: async (classId) => {
    const res = await api.get(`/classes/${classId}/students`);
    return res.data;
  },

  submitDailyActivity: async (activityData) => {
    // POST /api/daily-activity — upserts (creates or updates) the record for the day
    // Backend uses findOneAndUpdate with upsert:true so repeated saves update the same record
    const res = await api.post('/daily-activity', activityData);
    return res.data;
  },

  getStudentActivity: async (studentId, date) => {
    const params = date ? { date } : {};
    const res = await api.get(`/daily-activity/student/${studentId}`, { params });
    return res.data;
  },

  /**
   * Get paginated activity history for a student.
   * For showing past records over a date range.
   */
  getStudentHistory: async (studentId, { startDate, endDate, page = 1, limit = 30 } = {}) => {
    const params = { page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const res = await api.get(`/daily-activity/student/${studentId}/history`, { params });
    return res.data;
  },
};

export default teacherService;