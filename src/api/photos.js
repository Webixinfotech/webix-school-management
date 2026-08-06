import api from './axios';
import {
  API_BASE_URL,
  appendJsonArrayToFormData,
  downloadBlobFile,
  normalizePhoto,
  parseApiError,
} from '../utils/photoUtils';

const request = async (config) => {
  try {
    const response = await api.request({
      baseURL: API_BASE_URL,
      ...config,
    });
    return response;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

const getResponsePayload = (response) => response?.data?.data ?? response?.data ?? null;

const getListData = (response) => {
  const payload = getResponsePayload(response);
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

const toListPayload = (response) => {
  const root = response?.data ?? {};
  const payload = getResponsePayload(response);

  return {
    ...root,
    ...(payload && !Array.isArray(payload) ? payload : {}),
    data: getListData(response).map(normalizePhoto),
    page: payload?.page ?? root?.page,
    pages: payload?.pages ?? root?.pages,
    total: payload?.total ?? root?.total,
    count: payload?.count ?? root?.count,
  };
};

const toSinglePayload = (response) => {
  const root = response?.data ?? {};
  const payload = getResponsePayload(response);

  return {
    ...root,
    data: payload ? normalizePhoto(payload) : null,
  };
};

const serializeQueryParams = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value));
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

const createUploadFormData = ({ files, isBulk = false, payload = {} }) => {
  const formData = new FormData();
  if (isBulk) {
    files.forEach((file) => formData.append('photos', file));
  } else if (files?.[0]) {
    formData.append('photo', files[0]);
  }

  ['title', 'description', 'category', 'event'].forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      formData.append(key, payload[key]);
    }
  });

  appendJsonArrayToFormData(formData, 'tags', payload.tags);
  appendJsonArrayToFormData(formData, 'uploadType', payload.uploadType);
  appendJsonArrayToFormData(formData, 'targetClasses', payload.targetClasses);
  appendJsonArrayToFormData(formData, 'targetParentIds', payload.targetParentIds);

  return formData;
};

export const photoApi = {
  async getStats() {
    const response = await request({ url: '/photos/stats', method: 'get' });
    return getResponsePayload(response) || {};
  },

  async getPending() {
    const response = await request({ url: '/photos/pending', method: 'get' });
    return toListPayload(response);
  },

  async getDeleted(params = {}) {
    const response = await request({ url: '/photos/deleted', method: 'get', params });
    return toListPayload(response);
  },

  async getMyPhotos(params = {}) {
    const response = await request({ url: '/photos/my', method: 'get', params });
    return toListPayload(response);
  },

  async getTargetAudience() {
    const response = await request({ url: '/photos/target-audience', method: 'get' });
    return getResponsePayload(response) || { classes: [], parents: [] };
  },

  async uploadSingle(payload, onUploadProgress) {
    const response = await request({
      url: '/photos/upload/single',
      method: 'post',
      data: createUploadFormData({ files: [payload.file], payload }),
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return toSinglePayload(response);
  },

  async uploadBulk(payload, onUploadProgress) {
    const response = await request({
      url: '/photos/upload/bulk',
      method: 'post',
      data: createUploadFormData({ files: payload.files || [], payload, isBulk: true }),
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return toListPayload(response);
  },

  async getPhotos(params = {}) {
    const response = await request({ url: '/photos', method: 'get', params });
    return toListPayload(response);
  },

  async getPublicWebsitePhotos(params = {}) {
    const response = await request({ url: '/photos/public/website', method: 'get', params });
    return toListPayload(response);
  },

  async getPhoto(id) {
    const response = await request({ url: `/photos/${id}`, method: 'get' });
    return toSinglePayload(response);
  },

  async approvePhoto(id, uploadType) {
    const response = await request({
      url: `/photos/${id}/approve`,
      method: 'post',
      data: { uploadType },
    });
    return toSinglePayload(response);
  },

  async rejectPhoto(id, rejectionReason) {
    const response = await request({
      url: `/photos/${id}/reject`,
      method: 'post',
      data: { rejectionReason },
    });
    return toSinglePayload(response);
  },

  async updatePhoto(id, payload) {
    const response = await request({
      url: `/photos/${id}`,
      method: 'put',
      data: {
        ...payload,
        ...(Array.isArray(payload?.uploadType) ? { uploadType: payload.uploadType } : {}),
        ...(Array.isArray(payload?.targetClasses) ? { targetClasses: JSON.stringify(payload.targetClasses) } : {}),
        ...(Array.isArray(payload?.targetParentIds) ? { targetParentIds: JSON.stringify(payload.targetParentIds) } : {}),
      },
    });
    return toSinglePayload(response);
  },

  async softDeletePhoto(id) {
    const response = await request({ url: `/photos/${id}/soft-delete`, method: 'post' });
    return toSinglePayload(response);
  },

  async hardDeletePhoto(id) {
    const response = await request({ url: `/photos/${id}/hard-delete`, method: 'delete' });
    return response.data;
  },

  async restorePhoto(id) {
    const response = await request({ url: `/photos/${id}/restore`, method: 'post' });
    return toSinglePayload(response);
  },

  async bulkDelete(payload) {
    const response = await request({ url: '/photos/bulk/delete', method: 'post', data: payload });
    return response.data;
  },

  async likePhoto(id) {
    const response = await request({ url: `/photos/${id}/like`, method: 'post' });
    return response.data;
  },

  async downloadPhoto(id, fallbackName = 'photo') {
    const response = await request({ url: `/photos/${id}/download`, method: 'get', responseType: 'blob' });
    return downloadBlobFile(response, fallbackName);
  },

  async bulkDownload(payload, fallbackName = 'photos.zip', includeReport = false) {
    const response = await request({
      url: '/photos/bulk/download',
      method: 'post',
      data: {
        ...payload,
        ...(Array.isArray(payload?.uploadType) ? { uploadType: payload.uploadType } : {}),
        includeReport, // Add parameter to include PDF report in ZIP
      },
      responseType: 'blob',
    });
    return downloadBlobFile(response, fallbackName);
  },

  async parentBulkDownload(payload, fallbackName = 'my-photos.zip') {
    const response = await request({
      url: '/photos/parent-bulk-download',
      method: 'post',
      data: {
        ...payload,
        ...(Array.isArray(payload?.uploadType) ? { uploadType: payload.uploadType } : {}),
      },
      responseType: 'blob',
    });
    return downloadBlobFile(response, fallbackName);
  },

  async toggleWebsitePhoto(id) {
    const response = await request({ url: `/photos/${id}/toggle-website`, method: 'post' });
    return response.data;
  },
};

export default photoApi;