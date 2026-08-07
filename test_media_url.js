const { API_ORIGIN } = require('./src/utils/photoUtils.js'); // Cannot do this directly because it uses import, let's just copy the logic

const getApiOrigin = () => {
  const url = "http://localhost:5000/api";
  if (url.startsWith('/')) {
    return "http://localhost:5173";
  }
  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return url.replace(/\/api\/?$/, '');
  }
};

const API_ORIGIN = getApiOrigin();

const toMediaUrl = (filePath) => {
  if (!filePath) return '';
  if (/^https?:\/\//i.test(filePath)) return filePath;

  const normalized = String(filePath)
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  return `${API_ORIGIN}/${normalized}`;
};

console.log(toMediaUrl("/uploads/photos/6a744d4b7d79b8f4ddbb97b5/photos-1786078643166-fhhyoy.jpg"));
