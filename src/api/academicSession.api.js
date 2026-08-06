import api from './axios';

// Academic Session module — admin creates/activates sessions; everything
// else (admission, enrollment, invoices, attendance) auto-tags against
// whichever session is currently "Active".

export const listAcademicSessionsAPI = async () => {
  const { data } = await api.get('/academic-sessions');
  return data;
};

export const getAcademicSessionByIdAPI = async (id) => {
  const { data } = await api.get(`/academic-sessions/${id}`);
  return data;
};

// Admin only. Always created with status "Upcoming".
export const createAcademicSessionAPI = async ({ name, startDate, endDate }) => {
  const { data } = await api.post('/academic-sessions', { name, startDate, endDate });
  return data;
};

// Admin only. Flips whatever session was Active to Completed, sets this one Active.
export const activateAcademicSessionAPI = async (id) => {
  const { data } = await api.put(`/academic-sessions/${id}/activate`);
  return data;
};

// Admin only. Only name/startDate/endDate — status changes via activate above.
export const updateAcademicSessionAPI = async (id, { name, startDate, endDate }) => {
  const { data } = await api.put(`/academic-sessions/${id}`, { name, startDate, endDate });
  return data;
};

// Admin only. Blocked if the session is Active or has linked records — the
// backend's error message explains which, show it to the user as-is.
export const deleteAcademicSessionAPI = async (id) => {
  const { data } = await api.delete(`/academic-sessions/${id}`);
  return data;
};
