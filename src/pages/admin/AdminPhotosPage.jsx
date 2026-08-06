import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image, UploadCloud, CheckCircle2, XCircle, Trash2,
  Download, Filter, Plus, RotateCcw,
  AlertTriangle, CheckSquare, Square, FileArchive
} from 'lucide-react';
import { photoApi } from '../../api/photos';
import {
  getPhotoTitle, PHOTO_CATEGORIES, parseApiError
} from '../../utils/photoUtils';
import PhotoCard from '../../components/photos/PhotoCard';
import PhotoGrid from '../../components/photos/PhotoGrid';
import PhotoFilters from '../../components/photos/PhotoFilters';
import PhotoStatusBadge from '../../components/photos/PhotoStatusBadge';
import StatsCards from '../../components/photos/StatsCards';
import EmptyState from '../../components/photos/EmptyState';
import LoadingState from '../../components/photos/LoadingState';
import Toast from '../../components/photos/Toast';
import ConfirmModal from '../../components/photos/ConfirmModal';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...PHOTO_CATEGORIES.map((c) => ({ value: c, label: c })),
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'teacher', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

const UPLOAD_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'website', label: 'Website' },
  { value: 'parents', label: 'Parents' },
];

export default function AdminPhotosPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '', status: '', category: '', uploadType: '',
    uploaderRole: '', dateFrom: '', dateTo: '', page: 1, limit: 12,
  });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await photoApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      Object.keys(filters).forEach((key) => {
        if (filters[key] && filters[key] !== '') {
          params[key] = filters[key];
        }
      });
      const response = await photoApi.getPhotos(params);
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

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePreview = (photo) => navigate(`/admin/photos/${photo._id}`);

  const handleDownload = async (photo) => {
    try {
      setActionLoading(true);
      await photoApi.downloadPhoto(photo._id, getPhotoTitle(photo));
      setToast({ type: 'success', title: 'Download Started', message: 'Your download has begun.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Download Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (photo) => {
    setConfirmModal({
      title: 'Approve Photo',
      message: `Are you sure you want to approve "${getPhotoTitle(photo)}"?`,
      confirmLabel: 'Approve',
      confirmColor: 'emerald',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.approvePhoto(photo._id, photo.uploadType);
          setToast({ type: 'success', title: 'Approved', message: 'Photo published successfully.' });
          loadPhotos();
          loadStats();
        } catch (err) {
          setToast({ type: 'error', title: 'Approval Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleReject = async (photo, reason) => {
    try {
      setActionLoading(true);
      await photoApi.rejectPhoto(photo._id, reason);
      setToast({ type: 'success', title: 'Rejected', message: 'Photo has been rejected.' });
      loadPhotos();
      loadStats();
    } catch (err) {
      setToast({ type: 'error', title: 'Rejection Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async (photo) => {
    setConfirmModal({
      title: 'Delete Photo',
      message: `Are you sure you want to delete "${getPhotoTitle(photo)}"? It will move to the trash.`,
      confirmLabel: 'Delete',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.softDeletePhoto(photo._id);
          setToast({ type: 'success', title: 'Deleted', message: 'Photo moved to trash.' });
          loadPhotos();
          loadStats();
        } catch (err) {
          setToast({ type: 'error', title: 'Delete Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const toggleSelectPhoto = (id) => {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllPhotos = () => {
    if (selectedPhotos.length === photos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(photos.map((p) => p._id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedPhotos.length) return;
    setConfirmModal({
      title: 'Bulk Delete Photos',
      message: `Delete ${selectedPhotos.length} photo(s)? This will soft-delete them.`,
      confirmLabel: 'Delete All',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.bulkDelete({ photoIds: selectedPhotos, deleteType: 'soft' });
          setToast({ type: 'success', title: 'Bulk Delete', message: `${selectedPhotos.length} photo(s) deleted.` });
          setSelectedPhotos([]);
          loadPhotos();
          loadStats();
        } catch (err) {
          setToast({ type: 'error', title: 'Bulk Delete Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleBulkDownload = async () => {
    if (!selectedPhotos.length) return;
    try {
      setActionLoading(true);
      await photoApi.bulkDownload({ photoIds: selectedPhotos }, 'selected-photos.zip');
      setToast({ type: 'success', title: 'Download Started', message: `${selectedPhotos.length} photo(s) being downloaded as ZIP.` });
    } catch (err) {
      setToast({ type: 'error', title: 'Download Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const statsItems = stats
    ? [
        {
          label: 'Total Photos',
          value: stats.total || 0,
          helper: 'All photos in the system',
          icon: Image,
          className: 'border-slate-200 bg-white',
          iconClassName: 'bg-sky-100 text-sky-700',
        },
        {
          label: 'Pending Approval',
          value: stats.pending || 0,
          helper: 'Awaiting your review',
          icon: AlertTriangle,
          className: 'border-amber-200 bg-amber-50',
          iconClassName: 'bg-amber-200 text-amber-700',
        },
        {
          label: 'Approved',
          value: stats.approved || 0,
          helper: 'Published photos',
          icon: CheckCircle2,
          className: 'border-emerald-200 bg-emerald-50',
          iconClassName: 'bg-emerald-200 text-emerald-700',
        },
        {
          label: 'Rejected',
          value: stats.rejected || 0,
          helper: 'Sent back for revision',
          icon: XCircle,
          className: 'border-rose-200 bg-rose-50',
          iconClassName: 'bg-rose-200 text-rose-700',
        },
      ]
    : [];

  const getActionItems = (photo) => {
    const items = [];
    if (photo.status === 'pending') {
      items.push({
        label: 'Approve',
        onClick: () => handleApprove(photo),
        variant: 'emerald',
        disabled: actionLoading,
      });
      items.push({
        label: 'Reject',
        onClick: () => handleReject(photo, 'Does not meet quality standards.'),
        variant: 'rose',
        disabled: actionLoading,
      });
    }
    if (!photo.isDeleted) {
      items.push({
        label: 'Delete',
        onClick: () => handleSoftDelete(photo),
        variant: 'slate',
        disabled: actionLoading,
      });
    } else if (photo.isDeleted) {
      items.push({
        label: 'Restore',
        onClick: async () => {
          try {
            setActionLoading(true);
            await photoApi.restorePhoto(photo._id);
            setToast({ type: 'success', title: 'Restored', message: 'Photo restored successfully.' });
            loadPhotos();
            loadStats();
          } catch (err) {
            setToast({ type: 'error', title: 'Restore Failed', message: parseApiError(err) });
          } finally {
            setActionLoading(false);
          }
        },
        variant: 'sky',
        disabled: actionLoading,
      });
    }
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Photo Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage, approve, and organize all school photos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/admin/photos/upload')}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            <Plus size={16} /> Single Upload
          </button>
          <button
            onClick={() => navigate('/admin/photos/bulk-upload')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <UploadCloud size={16} /> Bulk Upload
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${showFilters ? 'border-sky-300 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          >
            <Filter size={16} /> Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <LoadingState title="Loading statistics" />
      ) : (
        <StatsCards items={statsItems} />
      )}

      {/* Quick nav links */}
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => navigate('/admin/photos/pending')}
          className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md hover:border-amber-300"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200 text-amber-700">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Pending Approvals</p>
            <p className="text-xs text-amber-600">{stats?.pending || 0} photos awaiting review</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/photos/deleted')}
          className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Trash2 size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Deleted Photos</p>
            <p className="text-xs text-slate-500">View trash and restore items</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/photos/pending')}
          className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md hover:border-emerald-300"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-200 text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Review Queue</p>
            <p className="text-xs text-emerald-600">Approve or reject uploads</p>
          </div>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <PhotoFilters
          filters={filters}
          onChange={handleFilterChange}
          categories={CATEGORY_OPTIONS}
          statuses={STATUS_OPTIONS}
          roles={ROLE_OPTIONS}
          uploadTypes={UPLOAD_TYPE_OPTIONS}
          sticky
        />
      )}

      {/* Bulk actions bar */}
      {selectedPhotos.length > 0 && (
        <div className="flex items-center justify-between rounded-3xl border border-sky-200 bg-sky-50 p-4">
          <div className="flex items-center gap-3">
            <button onClick={selectAllPhotos} className="text-slate-600">
              {selectedPhotos.length === photos.length ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>
            <span className="text-sm font-semibold text-sky-800">{selectedPhotos.length} photo(s) selected</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleBulkDownload}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
            >
              <FileArchive size={14} /> Download ZIP
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              <Trash2 size={14} /> Delete
            </button>
            <button
              onClick={() => setSelectedPhotos([])}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {loading ? (
        <LoadingState />
      ) : photos.length === 0 ? (
        <EmptyState
          title="No photos found"
          description="Try adjusting your filters or upload new photos."
          action={
            <button
              onClick={() => navigate('/admin/photos/upload')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} /> Upload Photo
            </button>
          }
        />
      ) : (
        <>
          <PhotoGrid
            photos={photos}
            selectable
            selectedPhotos={selectedPhotos}
            onSelect={toggleSelectPhoto}
            onPreview={handlePreview}
            onDownload={handleDownload}
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

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
