import api from '../api/axios';

const asOpts = (opts) => (opts && typeof opts === 'object' ? opts : {});

const advertisementService = {
  getMyAds: async (opts) => {
    const { data } = await api.get('/advertisements/my-ads', asOpts(opts));
    return data;
  },
  getAdvertisements: async (params, opts) => {
    const { data } = await api.get('/advertisements', { params, ...asOpts(opts) });
    return data;
  },
  getAdvertisementById: async (id, opts) => {
    const { data } = await api.get(`/advertisements/${id}`, asOpts(opts));
    return data;
  },
  createAdvertisement: async (formData, opts) => {
    const { data } = await api.post('/advertisements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...asOpts(opts),
    });
    return data;
  },
  updateAdvertisement: async (id, payload, isFormData = false, opts) => {
    const { data } = await api.put(`/advertisements/${id}`, payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' },
      ...asOpts(opts),
    });
    return data;
  },
  toggleAdStatus: async (id, status, opts) => {
    const { data } = await api.patch(`/advertisements/${id}/status`, { status }, asOpts(opts));
    return data;
  },
  deleteAdvertisement: async (id, opts) => {
    const { data } = await api.delete(`/advertisements/${id}`, asOpts(opts));
    return data;
  },
};

export default advertisementService;
