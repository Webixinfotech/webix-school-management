import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Image, UploadCloud, Sparkles } from 'lucide-react';
import { photoApi } from '../../api/photos';
import { parseApiError } from '../../utils/photoUtils';
import PhotoUploadForm from '../../components/photos/PhotoUploadForm';
import BulkPhotoUploadForm from '../../components/photos/BulkPhotoUploadForm';
import Toast from '../../components/photos/Toast';

export default function TeacherPhotosUploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('single');
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);

  // audience.data has { classes, classSections, parents }
  const [audience, setAudience] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(true);

  // prefillStudent comes from camera-button navigation: { name, className }
  const prefillStudent = location.state?.prefillStudent || null;

  // ── Find the parent whose child matches the prefill student ─────────────────
  // API shape: audience.parents[].children[].{ name, className }
  const prefillParentId = useMemo(() => {
    if (!prefillStudent || !audience?.parents) return null;
    const found = audience.parents.find((p) =>
      p.children?.some(
        (c) =>
          c.name?.trim().toLowerCase() === prefillStudent.name?.trim().toLowerCase() &&
          c.className?.trim().toLowerCase() === prefillStudent.className?.trim().toLowerCase()
      )
    );
    return found?._id || null;
  }, [prefillStudent, audience]);

  // ── Load target-audience API ─────────────────────────────────────────────────
  // photoApi.getTargetAudience() returns the parsed response body
  // The shape is { success, data: { classes, classSections, parents } }
  // We store data directly so downstream components get classes/parents/classSections
  const loadAudience = useCallback(async () => {
    try {
      setAudienceLoading(true);
      const res = await photoApi.getTargetAudience();
      // Handle both wrapped { success, data } and already-unwrapped shapes
      const data = res?.data ?? res;
      setAudience(data);
    } catch (err) {
      console.error('Failed to load audience:', err);
    } finally {
      setAudienceLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudience();
  }, [loadAudience]);

  // ── Upload handlers ──────────────────────────────────────────────────────────
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

      const isParentsOnly =
        payload.uploadType?.includes('parents') && !payload.uploadType?.includes('website');
      setToast({
        type: 'success',
        title: 'Upload Complete',
        message: isParentsOnly
          ? 'Photo shared with parents instantly!'
          : 'Photo submitted for admin approval.',
      });
      setTimeout(() => navigate('/teacher/photos'), 1500);
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

      const isParentsOnly =
        payload.uploadType?.includes('parents') && !payload.uploadType?.includes('website');
      setToast({
        type: 'success',
        title: 'Upload Complete',
        message: isParentsOnly
          ? `${payload.files.length} photos shared with parents instantly!`
          : `${payload.files.length} photos submitted for admin approval.`,
      });
      setTimeout(() => navigate('/teacher/photos'), 1500);
    } catch (err) {
      setToast({ type: 'error', title: 'Upload Failed', message: parseApiError(err) });
    } finally {
      setSubmitting(false);
      setProgress(0);
    }
  };

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/40 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/teacher/photos')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 truncate">Upload Photos</h1>
              {prefillStudent && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200">
                  <Sparkles size={11} />
                  {prefillStudent.name}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm text-slate-500 truncate">
              {prefillStudent
                ? `Uploading photo for ${prefillStudent.name} · ${prefillStudent.className}`
                : 'Share school moments with parents and the community'}
            </p>
          </div>
        </div>

        {/* ── Prefill notice ── */}
        {prefillStudent && (
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">
              {prefillStudent.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Auto-filled for {prefillStudent.name}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Student details and parent have been pre-selected. You can change them below.
              </p>
            </div>
          </div>
        )}

        {/* ── Mode Toggle ── */}
        <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            onClick={() => setMode('single')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              mode === 'single'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Image size={15} />
            Single Upload
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
              mode === 'bulk'
                ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <UploadCloud size={15} />
            Bulk Upload
          </button>
        </div>

        {/* ── Forms ── */}
        {mode === 'single' ? (
          <PhotoUploadForm
            audience={audience}
            audienceLoading={audienceLoading}
            onSubmit={handleSingleUpload}
            submitting={submitting}
            progress={progress}
            role="teacher"
            prefillStudent={prefillStudent}
            prefillParentId={prefillParentId}
          />
        ) : (
          <BulkPhotoUploadForm
            audience={audience}
            audienceLoading={audienceLoading}
            onSubmit={handleBulkUpload}
            submitting={submitting}
            progress={progress}
            role="teacher"
          />
        )}

        <Toast toast={toast} onClose={() => setToast(null)} />
      </div>
    </div>
  );
}