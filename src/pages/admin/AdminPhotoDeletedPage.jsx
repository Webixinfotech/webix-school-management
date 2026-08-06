import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Search, XCircle, Filter, HardDrive } from 'lucide-react';
import { photoApi } from '../../api/photos';
import { getPhotoTitle, formatDate, parseApiError, PHOTO_CATEGORIES } from '../../utils/photoUtils';
import PhotoStatusBadge from '../../components/photos/PhotoStatusBadge';
import EmptyState from '../../components/photos/EmptyState';
import LoadingState from '../../components/photos/LoadingState';
import Toast from '../../components/photos/Toast';
import ConfirmModal from '../../components/photos/ConfirmModal';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...PHOTO_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const DELETED_BY_ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Staff' },
];

export default function AdminPhotoDeletedPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', category: '', deletedByRole: '',
  });

  const loadDeleted = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key] !== '') params[key] = filters[key];
      });
      const response = await photoApi.getDeleted(params);
      setPhotos(response.data || []);
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: parseApiError(err) });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadDeleted(); }, [loadDeleted]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRestore = async (photo) => {
    setConfirmModal({
      title: 'Restore Photo',
      message: `Restore "${getPhotoTitle(photo)}" to the active gallery?`,
      confirmLabel: 'Restore',
      confirmColor: 'sky',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.restorePhoto(photo._id);
          setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
          setToast({ type: 'success', title: 'Restored', message: 'Photo restored successfully.' });
        } catch (err) {
          setToast({ type: 'error', title: 'Restore Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleHardDelete = async (photo) => {
    setConfirmModal({
      title: 'Permanently Delete',
      message: `This will permanently delete "${getPhotoTitle(photo)}". This action CANNOT be undone.`,
      confirmLabel: 'Delete Permanently',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.hardDeletePhoto(photo._id);
          setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
          setToast({ type: 'success', title: 'Deleted', message: 'Photo permanently deleted.' });
        } catch (err) {
          setToast({ type: 'error', title: 'Delete Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/photos')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deleted Photos</h1>
            <p className="text-sm text-slate-500">View trash and restore deleted items.</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${showFilters ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          <Filter size={16} /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={filters.deletedByRole || ''}
              onChange={(e) => handleFilterChange('deletedByRole', e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            >
              {DELETED_BY_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Deleted Photos List */}
      {loading ? (
        <LoadingState title="Loading deleted photos" />
      ) : photos.length === 0 ? (
        <EmptyState
          title="No deleted photos"
          description="Trash is empty. Deleted photos will appear here."
        />
      ) : (
        <div className="space-y-4">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 md:flex-row">
                {/* Thumbnail */}
                <div className="h-40 w-full shrink-0 overflow-hidden rounded-2xl md:w-56">
                  <img
                    src={photo.imageUrl}
                    alt={getPhotoTitle(photo)}
                    className="h-full w-full object-cover opacity-60"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{getPhotoTitle(photo)}</h3>
                      <p className="mt-1 text-sm text-slate-500">{photo.category}</p>
                    </div>
                    <PhotoStatusBadge status={photo.status} deleted />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deleted By</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {photo.deletedByName || photo.deletedBy || '-'}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deleted At</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(photo.deletedAt)}</p>
                    </div>
                  </div>

                  {photo.deleteMessage && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      <span className="font-semibold">Delete note:</span> {photo.deleteMessage}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleRestore(photo)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                    >
                      <RotateCcw size={14} /> Restore
                    </button>
                    <button
                      onClick={() => handleHardDelete(photo)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <HardDrive size={14} /> Permanent Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
