import { useMemo, useState, useEffect } from 'react';
import { ImagePlus, LoaderCircle, UploadCloud, X, CheckCircle2, AlertCircle, Sparkles, ArrowRight, Zap } from 'lucide-react';
import { PHOTO_CATEGORIES, validatePhotoFile } from '../../utils/photoUtils';
import TargetAudienceSelector from './TargetAudienceSelector';

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const AUTO_COMPRESS_QUALITY = 80;
const AUTO_COMPRESS_MAX_WIDTH = 1920;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-all duration-200 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] hover:border-slate-300';

const labelClass = 'block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5';

export default function PhotoUploadForm({
  audience,
  onSubmit,
  submitting,
  progress = 0,
  role = 'teacher',
  prefillParentId = null,
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    event: '',
    photoCode: '',
    tags: '',
    uploadType: [],
    targetClasses: [],
    targetParentIds: [],
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [autoCompressing, setAutoCompressing] = useState(false);
  const [finalFile, setFinalFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const helperMessage =
    role === 'teacher'
      ? 'Teacher uploads go for admin approval when website is selected.'
      : 'Admin uploads publish immediately.';

  const canTargetParents = form.uploadType.includes('parents');
  const tagList = useMemo(
    () => form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    [form.tags]
  );

  const toggleUploadType = (type) => {
    const next = form.uploadType.includes(type)
      ? form.uploadType.filter((i) => i !== type)
      : [...form.uploadType, type];
    setForm((c) => ({ ...c, uploadType: next.length ? next : [type] }));
  };

  useEffect(() => {
    if (prefillParentId) {
      setForm((p) => ({ ...p, targetParentIds: [prefillParentId] }));
    }
  }, [prefillParentId]);

  const compressImage = (file, quality, maxWidth) =>
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

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    // Only validate file type — size is handled by auto-compression below
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only JPEG, PNG, and WEBP images are allowed.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setFinalFile(selectedFile);
    setFileInfo(null);
    setPreview(URL.createObjectURL(selectedFile));

    const img = new Image();
    img.onload = () => {
      const originalInfo = {
        size: selectedFile.size,
        sizeStr: formatBytes(selectedFile.size),
        width: img.width,
        height: img.height,
        compressed: null,
      };
      setFileInfo(originalInfo);

      if (selectedFile.size > MAX_SIZE_BYTES) {
        setAutoCompressing(true);
        compressImage(selectedFile, AUTO_COMPRESS_QUALITY, AUTO_COMPRESS_MAX_WIDTH)
          .then((c) => {
            setFinalFile(c.file);
            setPreview(URL.createObjectURL(c.blob));
            setFileInfo({
              ...originalInfo,
              compressed: {
                size: c.file.size,
                sizeStr: formatBytes(c.file.size),
                width: c.width,
                height: c.height,
              },
            });
          })
          .catch(() => setError('Auto-compression failed. Please try a smaller image.'))
          .finally(() => setAutoCompressing(false));
      }
    };
    img.src = URL.createObjectURL(selectedFile);
  };

  const handleFileChange = (e) => handleFileSelect(e.target.files?.[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); handleFileSelect(e.dataTransfer.files?.[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const handleRemove = () => {
    setFile(null); setPreview(''); setFinalFile(null);
    setFileInfo(null); setError(''); setAutoCompressing(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    // Validate file type only — size was already handled by auto-compression
    const uploadFile = finalFile || file;
    if (!uploadFile) { setError('Please select a photo to upload.'); return; }
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(uploadFile.type)) {
      setError('Only JPEG, PNG, and WEBP images are allowed.');
      return;
    }
    if (!form.uploadType.length) { setError('Select at least one publish target.'); return; }
    setError('');
    await onSubmit({
      ...form,
      tags: tagList,
      targetClasses: canTargetParents ? form.targetClasses : [],
      targetParentIds: canTargetParents ? form.targetParentIds : [],
      file: finalFile || file,
    });
  };

  /* Savings percentage */
  const savedPct =
    fileInfo?.compressed
      ? Math.round((1 - fileInfo.compressed.size / fileInfo.size) * 100)
      : 0;

  return (
    <form onSubmit={submit} className="w-full">
      <div className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">

        {/* ══════════════ LEFT PANEL ══════════════ */}
        <div className="rounded-2xl bg-white p-6 space-y-5"
          style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06), inset 0 1px 0 #fff' }}>

          {/* Panel header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-500"
              style={{ boxShadow: '0 3px 10px rgba(14,165,233,0.35), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
              <ImagePlus size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Single Upload</p>
              <p className="text-sm font-semibold text-slate-800 leading-tight">Upload a photo</p>
            </div>
            <span className="ml-auto text-[11px] text-slate-400">{helperMessage.split(' ').slice(0, 5).join(' ')}…</span>
          </div>

          {/* ── Drop zone ── */}
          <label
            className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
              dragActive ? 'border-sky-400 bg-sky-50 scale-[1.01]'
              : preview ? 'border-slate-200'
              : 'border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-sky-50/40'
            }`}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
          >
            {preview ? (
              <div className="relative w-full group">
                <img src={preview} alt="Preview" className="h-60 w-full rounded-xl object-cover transition-all duration-300" />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <button type="button" onClick={(e) => { e.preventDefault(); handleRemove(); }}
                  className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-lg transition hover:bg-rose-50 hover:scale-105 active:scale-95"
                  style={{ border: '1px solid rgba(255,255,255,0.6)' }}>
                  <X size={11} /> Remove
                </button>

                {/* ── File info overlay on image ── */}
                {autoCompressing && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl px-4 py-2.5 flex items-center gap-2"
                    style={{ background: 'rgba(14,165,233,0.88)', backdropFilter: 'blur(8px)' }}>
                    <LoaderCircle size={14} className="animate-spin text-white shrink-0" />
                    <span className="text-xs font-semibold text-white">Auto-compressing image…</span>
                  </div>
                )}

                {fileInfo && !autoCompressing && (
                  <div className="absolute bottom-3 left-3 right-3 rounded-xl overflow-hidden"
                    style={{ background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {fileInfo.compressed ? (
                      /* ── Compressed info: before → after ── */
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Zap size={12} className="text-emerald-400" />
                          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Auto-compressed · {savedPct}% smaller</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Before */}
                          <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Before</p>
                            <p className="text-sm font-bold text-white">{fileInfo.sizeStr}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{fileInfo.width} × {fileInfo.height} px</p>
                          </div>
                          {/* Arrow */}
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                            style={{ background: 'rgba(52,211,153,0.2)', border: '1px solid rgba(52,211,153,0.4)' }}>
                            <ArrowRight size={12} className="text-emerald-400" />
                          </div>
                          {/* After */}
                          <div className="flex-1 rounded-lg px-3 py-2" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.25)' }}>
                            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1">After</p>
                            <p className="text-sm font-bold text-emerald-300">{fileInfo.compressed.sizeStr}</p>
                            <p className="text-[11px] text-emerald-500 mt-0.5">{fileInfo.compressed.width} × {fileInfo.compressed.height} px</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── Normal info (under 10MB) ── */
                      <div className="flex items-center gap-4 px-4 py-2.5">
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">File Size</p>
                          <p className="text-sm font-bold text-white mt-0.5">{fileInfo.sizeStr}</p>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Dimensions</p>
                          <p className="text-sm font-bold text-white mt-0.5">{fileInfo.width} × {fileInfo.height} px</p>
                        </div>
                        <div className="ml-auto">
                          <span className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                            ✓ Ready
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-6 py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white"
                  style={{ boxShadow: '0 4px 14px rgba(14,165,233,0.18), 0 1px 4px rgba(0,0,0,0.08), inset 0 1px 0 #fff' }}>
                  <UploadCloud size={28} className="text-sky-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800">
                    Drag & drop or <span className="text-sky-600 underline underline-offset-2">browse files</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">JPEG, PNG, WEBP · Auto-compressed if over 10 MB</p>
                </div>
              </div>
            )}
            <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
          </label>

          {/* Fields */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Title</label>
              <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} className={inputClass} placeholder="Annual day highlights" />
            </div>
            <div>
              <label className={labelClass}>Event</label>
              <input value={form.event} onChange={(e) => setForm((c) => ({ ...c, event: e.target.value }))} className={inputClass} placeholder="Sports Day 2026" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Website Code</label>
              <input value={form.photoCode} onChange={(e) => setForm((c) => ({ ...c, photoCode: e.target.value }))} className={inputClass} placeholder="school-event-2026" />
              <p className="mt-1.5 text-[11px] text-slate-400">Reference code for gallery lookup.</p>
            </div>
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
              rows={3} className={`${inputClass} resize-none`} placeholder="Add a short description for admins and parents." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} className={inputClass}>
                {PHOTO_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Tags</label>
              <input value={form.tags} onChange={(e) => setForm((c) => ({ ...c, tags: e.target.value }))} className={inputClass} placeholder="annual, sports, medals" />
            </div>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL ══════════════ */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">

          {/* Visibility card */}
          <div className="rounded-2xl bg-white p-5"
            style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06), inset 0 1px 0 #fff' }}>

            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500"
                style={{ boxShadow: '0 3px 8px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
                <Sparkles size={13} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Visibility</p>
                <p className="text-sm font-semibold text-slate-900 leading-tight">Where to publish</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { type: 'website', label: 'Website', desc: 'School website gallery' },
                { type: 'parents', label: 'Parents', desc: 'Parent portal access' },
              ].map(({ type, label, desc }) => {
                const active = form.uploadType.includes(type);
                return (
                  <button key={type} type="button" onClick={() => toggleUploadType(type)}
                    className="w-full text-left transition-all duration-200 rounded-xl"
                    style={active ? {
                      padding: '12px 16px',
                      border: '1.5px solid #7dd3fc',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      boxShadow: '0 2px 10px rgba(14,165,233,0.1), inset 0 1px 0 rgba(255,255,255,0.9)',
                    } : {
                      padding: '12px 16px',
                      border: '1px solid #e2e8f0',
                      background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </div>
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-200"
                        style={active ? {
                          background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
                          boxShadow: '0 2px 6px rgba(14,165,233,0.4)',
                        } : { border: '2px solid #cbd5e1', background: 'white' }}>
                        {active && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          {canTargetParents && (
            <div className="rounded-2xl bg-white p-5"
              style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.06), inset 0 1px 0 #fff' }}>
              <TargetAudienceSelector audience={audience} value={form} onChange={setForm} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3"
              style={{ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)', border: '1px solid #fecdd3' }}>
              <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-500" />
              <p className="text-xs font-medium text-rose-700">{error}</p>
            </div>
          )}

          {/* Progress */}
          {submitting && (
            <div className="rounded-xl px-4 py-4 space-y-3"
              style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)', border: '1px solid #bae6fd' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                  <LoaderCircle className="animate-spin" size={14} />
                  Uploading photo…
                </div>
                <span className="text-xs font-bold text-sky-600">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#38bdf8,#0ea5e9)', boxShadow: '0 0 8px rgba(14,165,233,0.5)' }} />
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting || autoCompressing}
            className="relative inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              boxShadow: '0 4px 14px rgba(15,23,42,0.35), 0 1px 3px rgba(15,23,42,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}>
            {autoCompressing ? (
              <><LoaderCircle size={15} className="animate-spin" /> Compressing image…</>
            ) : submitting ? (
              <><LoaderCircle size={15} className="animate-spin" /> Uploading…</>
            ) : (
              <><ImagePlus size={15} /> {role === 'teacher' ? 'Submit photo' : 'Upload and publish'}</>
            )}
          </button>

          <p className="text-center text-[11px] text-slate-400 leading-relaxed px-2">
            Images over 10 MB are automatically compressed before upload.
          </p>
        </div>
      </div>
    </form>
  );
}