import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { photoApi } from '../../api/photos';
import { getPhotoTitle, parseApiError } from '../../utils/photoUtils';
import PhotoGrid from '../../components/photos/PhotoGrid';
import PhotoPreviewModal from '../../components/photos/PhotoPreviewModal';
import PhotoStatusBadge from '../../components/photos/PhotoStatusBadge';
import EmptyState from '../../components/photos/EmptyState';
import LoadingState from '../../components/photos/LoadingState';
import Toast from '../../components/photos/Toast';
import ConfirmModal from '../../components/photos/ConfirmModal';

export default function AdminPhotoPendingPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReasons, setRejectReasons] = useState({});

  const loadPending = useCallback(async () => {
    try {
      setLoading(true);
      const response = await photoApi.getPending();
      setPhotos(response.data || []);
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: parseApiError(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPending(); }, [loadPending]);

  const handleApprove = async (photo) => {
    setConfirmModal({
      title: 'Approve Photo',
      message: `Approve "${getPhotoTitle(photo)}" for publishing?`,
      confirmLabel: 'Approve',
      confirmColor: 'emerald',
      onConfirm: async () => {
        try {
          setActionLoading(true);
          await photoApi.approvePhoto(photo._id, photo.uploadType);
          setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
          setToast({ type: 'success', title: 'Approved', message: 'Photo published successfully.' });
        } catch (err) {
          setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      },
    });
  };

  const handleReject = async (photo) => {
    const reason = rejectReasons[photo._id]?.trim();
    if (!reason) {
      setToast({ type: 'error', title: 'Missing Reason', message: 'Please provide a rejection reason.' });
      return;
    }
    try {
      setActionLoading(true);
      await photoApi.rejectPhoto(photo._id, reason);
      setPhotos((prev) => prev.filter((p) => p._id !== photo._id));
      setRejectReasons((prev) => {
        const next = { ...prev };
        delete next[photo._id];
        return next;
      });
      setToast({ type: 'success', title: 'Rejected', message: 'Photo has been rejected.' });
    } catch (err) {
      setToast({ type: 'error', title: 'Failed', message: parseApiError(err) });
    } finally {
      setActionLoading(false);
    }
  };

  const getActionItems = (photo) => {
    const items = [];
    items.push({
      label: 'Approve',
      onClick: () => handleApprove(photo),
      variant: 'emerald',
      disabled: actionLoading,
    });
    items.push({
      label: 'Reject',
      onClick: () => {
        const reason = prompt('Enter rejection reason:');
        if (reason?.trim()) {
          setRejectReasons((prev) => ({ ...prev, [photo._id]: reason }));
          handleReject(photo);
        }
      },
      variant: 'rose',
      disabled: actionLoading,
    });
    return items;
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
            <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
            <p className="text-sm text-slate-500">Review and approve teacher-uploaded photos.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
          <Clock size={14} />
          {photos.length} pending
        </div>
      </div>

      {/* Stats Banner */}
      {photos.length > 0 && (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-200 text-amber-700">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Review Queue</p>
            <p className="text-xs text-amber-600">Each photo needs your approval before appearing in the gallery.</p>
          </div>
        </div>
      )}

      {/* Photo List */}
      {loading ? (
        <LoadingState title="Loading pending photos" />
      ) : photos.length === 0 ? (
        <EmptyState
          title="All caught up!"
          description="No pending photos awaiting approval."
          action={
            <button
              onClick={() => navigate('/admin/photos')}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back to Photos
            </button>
          }
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
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{getPhotoTitle(photo)}</h3>
                      <p className="mt-1 text-sm text-slate-500">{photo.category} &middot; {photo.uploadType?.join(', ')}</p>
                    </div>
                    <PhotoStatusBadge status={photo.status} />
                  </div>

                  {photo.description && (
                    <p className="line-clamp-2 text-sm text-slate-600">{photo.description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>By: {photo.uploadedBy?.name || photo.uploadedBy || '-'}</span>
                    <span>&middot;</span>
                    <span>{new Date(photo.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Rejection reason input */}
                  {rejectReasons[photo._id] && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-rose-700">Rejection Reason:</p>
                      <textarea
                        value={rejectReasons[photo._id]}
                        onChange={(e) => setRejectReasons((prev) => ({ ...prev, [photo._id]: e.target.value }))}
                        rows={2}
                        className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400"
                        placeholder="Enter reason..."
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => setPreviewPhoto(photo)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleApprove(photo)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason?.trim()) {
                          setRejectReasons((prev) => ({ ...prev, [photo._id]: reason }));
                          handleReject(photo);
                        }
                      }}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewPhoto && (
        <PhotoPreviewModal
          photo={previewPhoto}
          onClose={() => setPreviewPhoto(null)}
          actionLoading={actionLoading}
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
