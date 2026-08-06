import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Download, Trash2, RotateCcw, Clock,
  CheckCircle2, XCircle, Users, Globe, Calendar,
  Image as ImageIcon, Tag, Eye, Heart, HardDrive
} from 'lucide-react';
import { photoApi } from '../../api/photos';
import {
  getPhotoTitle, formatDate, formatBytes, PHOTO_CATEGORIES, parseApiError
} from '../../utils/photoUtils';
import PhotoStatusBadge from '../../components/photos/PhotoStatusBadge';
import TargetAudienceSelector from '../../components/photos/TargetAudienceSelector';
import Toast from '../../components/photos/Toast';
import ConfirmModal from '../../components/photos/ConfirmModal';
import LoadingState from '../../components/photos/LoadingState';

export default function AdminPhotoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const loadPhoto = useCallback(async () => {
    try {
      setLoading(true);
      const response = await photoApi.getPhoto(id);
      setPhoto(response.data);
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: parseApiError(err) });
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadAudience = useCallback(async () => {
    try {
      const data = await photoApi.getTargetAudience();
      setAudience(data);
    } catch (err) {
      console.error('Failed to load audience:', err);
    }
  }, []);

  useEffect(() => { loadPhoto(); }, [loadPhoto]);
  useEffect(() => { loadAudience(); }, [loadAudience]);

  const handleApprove = async () => {
    setConfirmModal({
      title: 'Approve Photo',
      message: `Approve "${getPhotoTitle(photo)}" for publishing?`,
      confirmLabel: 'Approve',
      confirmColor: 'emerald',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.approvePhoto(photo._id, photo.uploadType);
          setToast({ type: 'success', title: 'Approved', message: 'Photo published successfully.' });
          loadPhoto();
        } catch (err) {
          setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setToast({ type: 'error', title: 'Missing Reason', message: 'Please provide a rejection reason.' });
      return;
    }
    try {
      setActionLoading(true);
      await photoApi.rejectPhoto(photo._id, rejectReason);
      setToast({ type: 'success', title: 'Rejected', message: 'Photo has been rejected.' });
      loadPhoto();
      setShowRejectInput(false);
      setRejectReason('');
    } catch (err) {
      setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmModal({
      title: 'Delete Photo',
      message: `Move "${getPhotoTitle(photo)}" to trash?`,
      confirmLabel: 'Delete',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.softDeletePhoto(photo._id);
          setToast({ type: 'success', title: 'Deleted', message: 'Photo moved to trash.' });
          navigate('/admin/photos');
        } catch (err) {
          setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleRestore = async () => {
    setConfirmModal({
      title: 'Restore Photo',
      message: `Restore "${getPhotoTitle(photo)}" to active gallery?`,
      confirmLabel: 'Restore',
      confirmColor: 'sky',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.restorePhoto(photo._id);
          setToast({ type: 'success', title: 'Restored', message: 'Photo restored.' });
          loadPhoto();
        } catch (err) {
          setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handlePermanentDelete = () => {
    setConfirmModal({
      title: 'Permanently Delete',
      message: `This will permanently delete "${getPhotoTitle(photo)}". CANNOT be undone!`,
      confirmLabel: 'Delete Permanently',
      confirmColor: 'rose',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.hardDeletePhoto(photo._id);
          setToast({ type: 'success', title: 'Deleted', message: 'Photo permanently deleted.' });
          navigate('/admin/photos');
        } catch (err) {
          setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
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

  if (loading) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/photos')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft size={18} />
        </button>
        <LoadingState title="Loading photo details" />
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/admin/photos')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
          <ArrowLeft size={18} />
        </button>
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Photo not found</p>
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
            onClick={() => navigate('/admin/photos')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 line-clamp-1">{getPhotoTitle(photo)}</h1>
            <p className="text-sm text-slate-500">Photo detail & management</p>
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {!photo.isDeleted && photo.status === 'pending' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                  >
                    <CheckCircle2 size={16} /> Approve
                  </button>
                  <button
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </>
              )}

              {!photo.isDeleted && (
                <button
                  onClick={handleDownload}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Download size={16} /> Download
                </button>
              )}

              {!photo.isDeleted && (
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}

              {photo.isDeleted && (
                <>
                  <button
                    onClick={handleRestore}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-60"
                  >
                    <RotateCcw size={16} /> Restore
                  </button>
                  <button
                    onClick={handlePermanentDelete}
                    disabled={actionLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                  >
                    <HardDrive size={16} /> Permanent Delete
                  </button>
                </>
              )}
            </div>

            {/* Reject Input */}
            {showRejectInput && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-rose-700">Rejection Reason</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for rejection..."
                  className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim() || actionLoading}
                    className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {photo.description && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Description</h3>
              <p className="text-sm leading-7 text-slate-600">{photo.description}</p>
            </div>
          )}

          {/* Rejection Reason Display */}
          {photo.rejectionReason && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-500 mb-2">Rejection Reason</h3>
              <p className="text-sm text-rose-700">{photo.rejectionReason}</p>
            </div>
          )}

          {/* Delete Message Display */}
          {photo.deleteMessage && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-500 mb-2">Delete Note</h3>
              <p className="text-sm text-amber-700">{photo.deleteMessage}</p>
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
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Metadata</h3>
            <div className="space-y-3">
              {[
                { icon: Users, label: 'Uploaded By', value: photo.uploadedBy?.name || photo.uploadedBy || '-' },
                { icon: Calendar, label: 'Uploaded At', value: formatDate(photo.uploadedAt, { hour: '2-digit', minute: '2-digit' }) },
                { icon: ImageIcon, label: 'File Name', value: photo.fileName || '-' },
                { icon: ImageIcon, label: 'File Size', value: formatBytes(photo.fileSize) },
                { icon: Tag, label: 'MIME Type', value: photo.mimeType || '-' },
                { icon: Globe, label: 'Upload Type', value: photo.uploadType?.join(', ') || '-' },
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
                    <Globe size={14} />
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

          {/* Target Audience (if parents) */}
          {photo.uploadType?.includes('parents') && audience && (
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Target Audience</h3>
              <div className="space-y-2">
                {photo.targetClasses?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Classes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {photo.targetClasses.map((cls) => (
                        <span key={cls} className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{cls}</span>
                      ))}
                    </div>
                  </div>
                )}
                {photo.targetParentIds?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Specific Parents</p>
                    <p className="text-sm text-slate-600">{photo.targetParentIds.length} parent(s) selected</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Approval/Rejection Info */}
          {photo.approvedBy && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-600 mb-2">Approval Info</h3>
              <div className="space-y-1">
                <p className="text-sm text-emerald-800"><span className="font-semibold">By:</span> {photo.approvedBy}</p>
                {photo.approvedAt && <p className="text-sm text-emerald-800"><span className="font-semibold">At:</span> {formatDate(photo.approvedAt, { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </div>
          )}

          {photo.rejectedBy && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-600 mb-2">Rejection Info</h3>
              <div className="space-y-1">
                <p className="text-sm text-rose-800"><span className="font-semibold">By:</span> {photo.rejectedBy}</p>
                {photo.rejectedAt && <p className="text-sm text-rose-800"><span className="font-semibold">At:</span> {formatDate(photo.rejectedAt, { hour: '2-digit', minute: '2-digit' })}</p>}
              </div>
            </div>
          )}

          {/* Deleted Info */}
          {photo.isDeleted && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-2">Deletion Info</h3>
              <div className="space-y-1">
                <p className="text-sm text-slate-700"><span className="font-semibold">By:</span> {photo.deletedByName || photo.deletedBy || '-'}</p>
                {photo.deletedAt && <p className="text-sm text-slate-700"><span className="font-semibold">At:</span> {formatDate(photo.deletedAt, { hour: '2-digit', minute: '2-digit' })}</p>}
                {photo.deleteType && <p className="text-sm text-slate-700"><span className="font-semibold">Type:</span> {photo.deleteType}</p>}
              </div>
            </div>
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
