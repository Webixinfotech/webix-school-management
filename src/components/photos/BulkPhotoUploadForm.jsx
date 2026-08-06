import { useMemo, useState, useEffect } from 'react';
import { FolderArchive, LoaderCircle, UploadCloud, X, ArrowRight } from 'lucide-react';
import { PHOTO_CATEGORIES, formatBytes, validateBulkPhotos, compressImage, MAX_PHOTO_SIZE_BYTES } from '../../utils/photoUtils';
import TargetAudienceSelector from './TargetAudienceSelector';

const AUTO_COMPRESS_QUALITY = 80;
const AUTO_COMPRESS_MAX_WIDTH = 1920;

const defaultState = {
  title: '',
  description: '',
  category: 'Events',
  event: '',
  tags: '',
  uploadType: ['parents'],
  targetClasses: [],
  targetParentIds: [],
};

export default function BulkPhotoUploadForm({ audience, onSubmit, submitting, progress = 0, role = 'teacher' }) {
  const [form, setForm] = useState(defaultState);
  const [files, setFiles] = useState([]);
  const [fileInfos, setFileInfos] = useState([]);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);

  const tagList = useMemo(() => form.tags.split(',').map((item) => item.trim()).filter(Boolean), [form.tags]);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const toggleUploadType = (type) => {
    const next = form.uploadType.includes(type)
      ? form.uploadType.filter((item) => item !== type)
      : [...form.uploadType, type];
    setForm((current) => ({ ...current, uploadType: next.length ? next : [type] }));
  };

  const handleFilesChange = async (selectedFiles) => {
    const list = Array.from(selectedFiles || []);
    const validation = validateBulkPhotos(list);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError('');
    setCompressing(true);
    setFiles([]);
    setFileInfos([]);

    const compressed = [];
    const infos = [];

    for (const file of list) {
      const originalInfo = {
        size: file.size,
        sizeStr: formatBytes(file.size),
        compressed: null,
      };

      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        try {
          const result = await compressImage(file, AUTO_COMPRESS_QUALITY, AUTO_COMPRESS_MAX_WIDTH);
          compressed.push(result.file);
          infos.push({
            ...originalInfo,
            compressed: {
              size: result.file.size,
              sizeStr: formatBytes(result.file.size),
              width: result.width,
              height: result.height,
            },
          });
        } catch {
          setError(`Auto-compression failed for ${file.name}. Please try a smaller image.`);
          setCompressing(false);
          return;
        }
      } else {
        compressed.push(file);
        infos.push(originalInfo);
      }
    }

    setFiles(compressed);
    setFileInfos(infos);
    setCompressing(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validation = validateBulkPhotos(files);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }
    setError('');
    await onSubmit({ ...form, tags: tagList, files });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Bulk upload</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Upload up to 20 photos together</h3>
            <p className="mt-2 text-sm text-slate-500">The same metadata is applied to all selected photos. {role === 'teacher' ? 'Website uploads will wait for admin approval.' : 'Admin uploads publish immediately.'}</p>
          </div>

          <label className="block rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-sky-300 hover:bg-sky-50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
              <UploadCloud size={28} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">Select multiple photos</p>
            <p className="mt-1 text-sm text-slate-500">JPEG, PNG, WEBP. Max 20 files, 10MB each.</p>
            <input type="file" multiple accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={(event) => handleFilesChange(event.target.files)} />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Title prefix
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" placeholder="Annual Day 2026" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Event
              <input value={form.event} onChange={(event) => setForm((current) => ({ ...current, event: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" placeholder="Annual Day" />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Category
              <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100">
                {PHOTO_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tags
              <input value={form.tags} onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" placeholder="event, annual, performance" />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Description
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" placeholder="A short description added to each photo." />
          </label>

          {compressing && (
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid #bae6fd' }}>
              <LoaderCircle size={14} className="animate-spin text-sky-500 shrink-0" />
              <span className="text-xs font-semibold text-sky-700">Auto-compressing images…</span>
            </div>
          )}

          {files.length && !compressing ? (
            <div>
              <p className="text-sm font-semibold text-slate-900 mb-3">Selected photos ({files.length})</p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {previews.map((item, idx) => {
                  const info = fileInfos[idx];
                  const savedPct = info?.compressed
                    ? Math.round((1 - info.compressed.size / info.size) * 100)
                    : 0;
                  return (
                    <div key={`${item.file.name}-${item.file.size}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      <div className="relative">
                        <img src={item.url} alt={item.file.name} className="h-36 w-full object-cover" />
                        {info?.compressed && (
                          <div className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: 'rgba(34,197,94,0.9)', color: '#fff' }}>
                            -{savedPct}%
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 px-3 py-2">
                        <p className="truncate text-sm font-medium text-slate-900">{item.file.name}</p>
                        {info?.compressed ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 line-through">{info.sizeStr}</span>
                            <ArrowRight size={10} className="text-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-600">{info.compressed.sizeStr}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">{info?.sizeStr || formatBytes(item.file.size)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => { setFiles([]); setFileInfos([]); }} className="mt-3 inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
                <X size={12} /> Clear all
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="rounded-3xl bg-[radial-gradient(circle_at_top,_#e0f2fe,_#ffffff_60%)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visibility</p>
            <div className="mt-4 grid gap-3">
              {['website', 'parents'].map((type) => {
                const active = form.uploadType.includes(type);
                return (
                  <button key={type} type="button" onClick={() => toggleUploadType(type)} className={`rounded-2xl border px-4 py-4 text-left transition ${active ? 'border-sky-300 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold capitalize text-slate-900">{type}</p>
                        <p className="mt-1 text-sm text-slate-500">{type === 'website' ? 'School website gallery' : 'Parent portal access'}</p>
                      </div>
                      <div className={`h-5 w-5 rounded-full border ${active ? 'border-sky-500 bg-sky-500' : 'border-slate-300 bg-white'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {form.uploadType.includes('parents') ? <TargetAudienceSelector audience={audience} value={form} onChange={setForm} /> : null}

          {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

          {submitting ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700">
                <LoaderCircle className="animate-spin" size={16} /> Uploading {files.length} photos
              </div>
              <div className="mt-3 h-2 rounded-full bg-sky-100">
                <div className="h-2 rounded-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}

          <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
            <FolderArchive size={16} />
            {role === 'teacher' ? 'Submit bulk upload' : 'Upload and publish'}
          </button>
        </div>
      </div>
    </form>
  );
}
