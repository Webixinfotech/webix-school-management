import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Plus, UploadCloud, Search, Filter, Trash2, Edit3,
  Clock, CheckCircle2, XCircle, Image as ImageIcon
} from 'lucide-react';
import { photoApi } from '../../api/photos';
import {
  getPhotoTitle, formatDate, PHOTO_CATEGORIES, parseApiError
} from '../../utils/photoUtils';
import PhotoGrid from '../../components/photos/PhotoGrid';
import PhotoStatusBadge from '../../components/photos/PhotoStatusBadge';
import EmptyState from '../../components/photos/EmptyState';
import LoadingState from '../../components/photos/LoadingState';
import Toast from '../../components/photos/Toast';
import ConfirmModal from '../../components/photos/ConfirmModal';

const STATUS_TABS = [
  { value: '', label: 'All', icon: ImageIcon },
  { value: 'pending', label: 'Pending', icon: Clock },
  { value: 'approved', label: 'Approved', icon: CheckCircle2 },
  { value: 'rejected', label: 'Rejected', icon: XCircle },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...PHOTO_CATEGORIES.map((c) => ({ value: c, label: c })),
];

export default function TeacherPhotosListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', page: 1, limit: 12 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [editPhoto, setEditPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key] !== '') params[key] = filters[key];
      });
      const response = await photoApi.getMyPhotos(params);
      setPhotos(response.data || []);
      setPagination({
        page: response.page || 1,
        total: response.total || 0,
        pages: response.pages || 1,
      });
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: parseApiError(err) });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (location.state?.refresh) {
      loadPhotos();
      window.history.replaceState({}, document.title);
    } else {
      loadPhotos();
    }
  }, [loadPhotos, location.state]);

  const handleStatusChange = (status) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDelete = async (photo) => {
    setConfirmModal({
      title: 'Delete Photo',
      message: `Delete "${getPhotoTitle(photo)}"? Admin can still restore it.`,
      confirmLabel: 'Delete',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.softDeletePhoto(photo._id);
          setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
          setToast({ type: 'success', title: 'Deleted', message: 'Photo deleted successfully.' });
        } catch (err) {
          setToast({ type: 'error', title: 'Delete Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleEdit = (photo) => {
    setEditPhoto(photo);
  };

  const handleSaveEdit = async (payload) => {
    try {
      setActionLoading(true);
      await photoApi.updatePhoto(editPhoto._id, payload);
      setToast({ type: 'success', title: 'Updated', message: 'Photo updated successfully.' });
      setEditPhoto(null);
      loadPhotos();
    } catch (err) {
      setToast({ type: 'error', title: 'Update Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const getActionItems = (photo) => {
    const items = [];
    if (photo.status === 'pending') {
      items.push({
        label: 'Edit',
        onClick: () => handleEdit(photo),
        variant: 'sky',
        icon: Edit3,
        disabled: actionLoading,
      });
    }
    if (photo.status !== 'deleted' && !photo.isDeleted) {
      items.push({
        label: 'Delete',
        onClick: () => handleDelete(photo),
        variant: 'rose',
        icon: Trash2,
        disabled: actionLoading,
      });
    }
    return items;
  };

  const activeTab = filters.status || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Photos</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your uploaded photos and track approval status.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/teacher/photos/upload')}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <Plus size={16} /> Upload Photos
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${showFilters ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleStatusChange(tab.value)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Info Banner for Pending */}
      {filters.status === 'pending' && photos.length > 0 && (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200 text-amber-700">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Awaiting Admin Approval</p>
            <p className="text-xs text-amber-600">These photos are being reviewed. You&apos;ll see updates once they&apos;re approved.</p>
          </div>
        </div>
      )}

      {/* Rejected info */}
      {filters.status === 'rejected' && photos.length > 0 && (
        <div className="flex items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-200 text-rose-700">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-800">Rejected Photos</p>
            <p className="text-xs text-rose-600">Review the rejection reasons and consider re-uploading with improvements.</p>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {loading ? (
        <LoadingState title="Loading your photos" />
      ) : photos.length === 0 ? (
        <EmptyState
          title={filters.status ? `No ${filters.status} photos` : 'No photos yet'}
          description={filters.status ? 'Try a different status filter.' : 'Start by uploading your first photo.'}
          action={
            !filters.status && (
              <button
                onClick={() => navigate('/teacher/photos/upload')}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <UploadCloud size={16} /> Upload Photos
              </button>
            )
          }
        />
      ) : (
        <>
          <PhotoGrid
            photos={photos}
            onPreview={(photo) => navigate(`/teacher/photos/${photo._id}`, { state: { photo } })}
            getActionItems={getActionItems}
          />

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, filters.page - 1))}
                disabled={filters.page === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-slate-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                onClick={() => handleFilterChange('page', Math.min(pagination.pages, filters.page + 1))}
                disabled={filters.page === pagination.pages}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {editPhoto && (
        <TeacherPhotoEditModal
          photo={editPhoto}
          onClose={() => setEditPhoto(null)}
          onSave={handleSaveEdit}
          loading={actionLoading}
        />
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmColor={confirmModal.confirmColor}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

// Edit Modal Component
function TeacherPhotoEditModal({ photo, onClose, onSave, loading }) {
  const [form, setForm] = useState({
    title: photo.title || '',
    description: photo.description || '',
    category: photo.category || 'Events',
    event: photo.event || '',
    tags: Array.isArray(photo.tags) ? photo.tags.join(', ') : '',
    uploadType: photo.uploadType || ['website'],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Edit Photo Details</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <XCircle size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              >
                {PHOTO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Event
              <input
                value={form.event}
                onChange={(e) => setForm({ ...form, event: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tags (comma-separated)
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="sports, annual, medals"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
