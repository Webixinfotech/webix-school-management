import { API_BASE_URL } from '../api/axios';

// Re-exported so existing imports of API_BASE_URL from photoUtils keep working,
// but the value now comes from the same source as every other API call
// (src/api/axios.js) instead of its own fallback that could drift out of sync.
export { API_BASE_URL };

const getApiOrigin = () => {
  const url = API_BASE_URL;
  if (url.startsWith('/')) {
    return window.location.origin;
  }
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return url.replace(/\/api\/?$/, '');
  }
};

export const API_ORIGIN = getApiOrigin();

export const PHOTO_CATEGORIES = [
  'Events',
  'Activities',
  'Academics',
  'Sports',
  'Celebration',
  'Field Trip',
  'Others',
];

export const ACCEPTED_PHOTO_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_BULK_PHOTOS = 20;

export const toMediaUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const normalized = String(filePath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  return `${API_ORIGIN}/${normalized}`;
};

export const downloadBlobFile = (response, fallbackName = 'download') => {
  const blob = response?.data instanceof Blob ? response.data : response;
  if (!(blob instanceof Blob)) {
    throw new Error('Invalid download response');
  }

  const disposition = response?.headers?.['content-disposition'] || response?.headers?.['Content-Disposition'] || '';
  const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i);
  const extractedName = decodeURIComponent(match?.[1] || match?.[2] || fallbackName);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = extractedName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return extractedName;
};

export const appendJsonArrayToFormData = (formData, key, value) => {
  formData.append(key, JSON.stringify(Array.isArray(value) ? value : []));
};

export const validatePhotoFile = (file) => {
  if (!file) {
    return { valid: false, error: 'Please select a photo.' };
  }

  if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
    return { valid: false, error: 'Only JPG, JPEG, PNG, and WEBP images are allowed.' };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { valid: false, error: 'Image size must be less than 10MB.' };
  }

  return { valid: true, error: '' };
};

export const validateBulkPhotos = (files) => {
  const list = Array.from(files || []);
  if (!list.length) {
    return { valid: false, error: 'Please select at least one photo.' };
  }

  if (list.length > MAX_BULK_PHOTOS) {
    return { valid: false, error: 'You can upload up to 20 photos at once.' };
  }

  for (const file of list) {
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      return { valid: false, error: `${file.name}: Only JPG, JPEG, PNG, and WEBP images are allowed.` };
    }
  }

  return { valid: true, error: '' };
};

export const compressImage = (file, quality = 80, maxWidth = 1920) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed')); return; }
            resolve({
              file: new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }),
              width: w, height: h, blob,
            });
          },
          'image/jpeg', quality / 100
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });

export const formatBytes = (value = 0) => {
  if (!value) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

export const formatDate = (value, options = {}) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
};

export const getPhotoTitle = (photo) => photo?.title || photo?.fileName || 'Untitled photo';

export const normalizePhoto = (photo = {}) => {
  const uploadTypes = Array.isArray(photo.uploadType)
    ? photo.uploadType
    : photo.uploadType
      ? [photo.uploadType]
      : [];

  return {
    ...photo,
    uploadType: uploadTypes,
    imageUrl: toMediaUrl(photo.imageUrl || photo.filePath || ''),
    uploadedAt: photo.uploadedAt || photo.createdAt || null,
  };
};

export const parseApiError = (error) => {
  if (typeof error === 'string') return error;
  return error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Something went wrong.';
};
