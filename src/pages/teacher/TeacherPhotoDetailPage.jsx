import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Trash2, Edit3, Clock,
  CheckCircle2, XCircle, Calendar, Image as ImageIcon,
  Tag, Eye, Heart
} from 'lucide-react';
import { photoApi } from '../../api/photos';
import {
  getPhotoTitle, formatDate, formatBytes, PHOTO_CATEGORIES, parseApiError
} from '../../utils/photoUtils';
import PhotoStatusBadge from '../../components/photos/PhotoStatusBadge';
import Toast from '../../components/photos/Toast';
import ConfirmModal from '../../components/photos/ConfirmModal';
import LoadingState from '../../components/photos/LoadingState';

export default function TeacherPhotoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [detailUnavailableMessage, setDetailUnavailableMessage] = useState('');

  const locationPhoto = location.state?.photo?._id === id ? location.state.photo : null;

  const loadPhotoFromMyPhotos = useCallback(async () => {
    const firstPage = await photoApi.getMyPhotos({ page: 1, limit: 100 });
    const firstMatch = (firstPage.data || []).find((item) => item._id === id);
    if (firstMatch) return firstMatch;

    const totalPages = Math.min(firstPage.pages || 1, 10);
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await photoApi.getMyPhotos({ page, limit: 100 });
      const match = (response.data || []).find((item) => item._id === id);
      if (match) return match;
    }

    return null;
  }, [id]);

  const loadPhoto = useCallback(async () => {
    try {
      setLoading(true);
      setDetailUnavailableMessage('');

      if (locationPhoto && (locationPhoto.status !== 'approved' || locationPhoto.isDeleted)) {
        setPhoto(locationPhoto);
        return;
      }

      const myPhoto = await loadPhotoFromMyPhotos();
      if (myPhoto && (myPhoto.status !== 'approved' || myPhoto.isDeleted)) {
        setPhoto(myPhoto);
        return;
      }

      const response = await photoApi.getPhoto(id);
      setPhoto(response.data);
    } catch (err) {
      const message = parseApiError(err);
      if (message.toLowerCase().includes('photo not found')) {
        setDetailUnavailableMessage('This photo is not available for detail view until it is approved.');
        setPhoto(null);
      } else {
        setToast({ type: 'error', title: 'Error', message });
      }
    } finally {
      setLoading(false);
    }
  }, [id, loadPhotoFromMyPhotos, locationPhoto]);

  useEffect(() => { loadPhoto(); }, [loadPhoto]);

  const handleDelete = () => {
    setConfirmModal({
      title: 'Delete Photo',
      message: `Delete "${getPhotoTitle(photo)}"? Admin can still restore it.`,
      confirmLabel: 'Delete',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.softDeletePhoto(photo._id);
          setToast({ type: 'success', title: 'Deleted', message: 'Photo deleted.' });
          navigate('/teacher/photos');
        } catch (err) {
          const message = parseApiError(err);
          setToast({
            type: 'error',
            title: 'Failed',
            message: message.toLowerCase().includes('method') ? 'Delete failed because the app is using an incorrect delete API route or method.' : message,
          });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleDownload = async () => {
    try {
      setActionLoading(true);
      await photoApi.downloadPhoto(photo._id, getPhotoTitle(photo));
      setToast({ type: 'success', title: 'Download Started', message: 'Your download has begun.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = () => {
    setEditForm({
      title: photo.title || '',
      description: photo.description || '',
      category: photo.category || 'Events',
      event: photo.event || '',
      tags: Array.isArray(photo.tags) ? photo.tags.join(', ') : '',
    });
    setIsEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) {
      setToast({ type: 'error', title: 'Validation', message: 'Title is required.' });
      return;
    }
    try {
      setActionLoading(true);
      await photoApi.updatePhoto(photo._id, {
        ...editForm,
        tags: editForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setToast({ type: 'success', title: 'Updated', message: 'Photo updated successfully.' });
      setIsEditing(false);
      await loadPhoto();
    } catch (err) {
      setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/teacher/photos')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft size={18} />
        </button>
        <LoadingState title="Loading photo details" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/teacher/photos')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft size={18} />
        </button>
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">{detailUnavailableMessage || 'Photo not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/photos')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 line-clamp-1">{isEditing ? 'Edit Photo' : getPhotoTitle(photo)}</h1>
            <p className="text-sm text-slate-500">{isEditing ? 'Update photo details' : 'Photo detail'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PhotoStatusBadge status={photo.status} deleted={photo.isDeleted} />
          {photo.uploadType?.map((type) => (
            <span key={type} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 capitalize">{type}</span>
          ))}
          {photo.category && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{photo.category}</span>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {photo.status === 'pending' && (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200 text-amber-700">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Awaiting Admin Approval</p>
            <p className="text-xs text-amber-600">This photo is under review. You can edit or delete it while waiting.</p>
          </div>
        </div>
      )}

      {photo.status === 'rejected' && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <div className="flex items-center gap-2 mb-2">
            <XCircle size={18} className="text-rose-600" />
            <h3 className="text-sm font-semibold text-rose-700">Rejected</h3>
          </div>
          {photo.rejectionReason && (
            <p className="text-sm text-rose-700">{photo.rejectionReason}</p>
          )}
        </div>
      )}

      {photo.status === 'approved' && (
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-200 text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">Published Successfully</p>
            <p className="text-xs text-emerald-600">This photo is live and visible to its target audience.</p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        {/* Left: Image */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-950 flex items-center justify-center min-h-[400px]">
            <img
              src={photo.imageUrl}
              alt={getPhotoTitle(photo)}
              className="max-h-[70vh] w-full object-contain"
            />
          </div>
        </div>

        {/* Right: Details Panel */}
        <div className="space-y-5">
          {/* Action Buttons */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <Download size={16} /> Download
              </button>

              {photo.status === 'pending' && !photo.isDeleted && (
                <button
                  onClick={isEditing ? saveEdit : startEdit}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                >
                  <Edit3 size={16} /> {isEditing ? 'Save' : 'Edit'}
                </button>
              )}

              {!photo.isDeleted && (
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing ? (
            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-sky-600">Edit Details</h3>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Title
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Category
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    >
                      {PHOTO_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Event
                    <input
                      value={editForm.event}
                      onChange={(e) => setEditForm({ ...editForm, event: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-slate-700">
                  Tags (comma-separated)
                  <input
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    placeholder="sports, annual, medals"
                  />
                </label>
              </div>
            </div>
          ) : (
            <>
              {/* Description */}
              {photo.description && (
                <div className="rounded-3xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Description</h3>
                  <p className="text-sm leading-7 text-slate-600">{photo.description}</p>
                </div>
              )}

              {/* Stats */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Engagement</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <Eye size={18} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-xl font-bold text-slate-900">{photo.viewsCount || 0}</p>
                    <p className="text-xs text-slate-500">Views</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <Heart size={18} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-xl font-bold text-slate-900">{photo.likesCount || 0}</p>
                    <p className="text-xs text-slate-500">Likes</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <Download size={18} className="mx-auto text-slate-400 mb-1" />
                    <p className="text-xl font-bold text-slate-900">{photo.downloadsCount || 0}</p>
                    <p className="text-xs text-slate-500">Downloads</p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Details</h3>
                <div className="space-y-3">
                  {[
                    { icon: Calendar, label: 'Uploaded At', value: formatDate(photo.uploadedAt, { hour: '2-digit', minute: '2-digit' }) },
                    { icon: ImageIcon, label: 'File Name', value: photo.fileName || '-' },
                    { icon: ImageIcon, label: 'File Size', value: formatBytes(photo.fileSize) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <Icon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500">{label}</p>
                        <p className="text-sm font-medium text-slate-900 break-all">{value}</p>
                      </div>
                    </div>
                  ))}

                  {photo.event && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <ImageIcon size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Event</p>
                        <p className="text-sm font-medium text-slate-900">{photo.event}</p>
                      </div>
                    </div>
                  )}

                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                        <Tag size={14} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Tags</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {photo.tags.map((tag) => (
                            <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
