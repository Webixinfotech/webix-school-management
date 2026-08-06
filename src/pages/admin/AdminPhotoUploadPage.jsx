import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Image, UploadCloud } from 'lucide-react';
import { photoApi } from '../../api/photos';
import { parseApiError } from '../../utils/photoUtils';
import PhotoUploadForm from '../../components/photos/PhotoUploadForm';
import BulkPhotoUploadForm from '../../components/photos/BulkPhotoUploadForm';
import Toast from '../../components/photos/Toast';

export default function AdminPhotoUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMode = location.state?.mode || 'single';
  const returnTo = location.state?.returnTo || '/admin/photo-approvals';
  const [mode, setMode] = useState(initialMode);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [audience, setAudience] = useState(null);

  const loadAudience = useCallback(async () => {
    try {
      const data = await photoApi.getTargetAudience();
      setAudience(data);
    } catch (err) {
      console.error('Failed to load audience:', err);
    }
  }, []);

  useEffect(() => { loadAudience(); }, [loadAudience]);

  const handleSingleUpload = async (payload) => {
    try {
      setSubmitting(true);
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 15, 90));
      }, 200);

      await photoApi.uploadSingle(payload, () => {});
      clearInterval(interval);
      setProgress(100);
      setToast({ type: 'success', title: 'Upload Complete', message: 'Photo published successfully.' });
      setTimeout(() => navigate(returnTo), 1500);
    } catch (err) {
      setToast({ type: 'error', title: 'Upload Failed', message: parseApiError(err) });
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  const handleBulkUpload = async (payload) => {
    try {
      setSubmitting(true);
      setProgress(0);
      const interval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 10, 90));
      }, 300);

      await photoApi.uploadBulk(payload, () => {});
      clearInterval(interval);
      setProgress(100);
      setToast({ type: 'success', title: 'Upload Complete', message: `${payload.files.length} photos published successfully.` });
      setTimeout(() => navigate(returnTo), 1500);
    } catch (err) {
      setToast({ type: 'error', title: 'Upload Failed', message: parseApiError(err) });
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/photo-approvals')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Upload Photos</h1>
          <p className="text-sm text-slate-500">Add new photos to the school gallery.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-3 rounded-3xl border border-slate-200 bg-white p-2">
        <button
          onClick={() => setMode('single')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            mode === 'single'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Image size={16} /> Single Upload
        </button>
        <button
          onClick={() => setMode('bulk')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
            mode === 'bulk'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <UploadCloud size={16} /> Bulk Upload
        </button>
      </div>

      {/* Upload Form */}
      {mode === 'single' ? (
        <PhotoUploadForm
          audience={audience}
          onSubmit={handleSingleUpload}
          submitting={submitting}
          progress={progress}
          role="admin"
        />
      ) : (
        <BulkPhotoUploadForm
          audience={audience}
          onSubmit={handleBulkUpload}
          submitting={submitting}
          progress={progress}
          role="admin"
        />
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
