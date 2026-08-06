import { CheckSquare, Download, Eye, Heart, ImageDown, ImagePlus } from 'lucide-react';
import { formatDate, getPhotoTitle } from '../../utils/photoUtils';
import PhotoStatusBadge from './PhotoStatusBadge';
import PhotoActions from './PhotoActions';

export default function PhotoCard({
  photo,
  selected,
  selectable,
  onSelect,
  onPreview,
  onDownload,
  onLike,
  actionItems = [],
  showCounts = true,
}) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        <img src={photo.imageUrl} alt={getPhotoTitle(photo)} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent p-4">
          <div className="flex flex-wrap items-center gap-2">
            <PhotoStatusBadge status={photo.status} deleted={photo.isDeleted} />
            {photo.uploadType?.map((type) => <span key={type} className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">{type}</span>)}
          </div>
        </div>
        {selectable ? (
          <button type="button" onClick={() => onSelect?.(photo._id)} className={`absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-2xl border text-sm font-semibold backdrop-blur ${selected ? 'border-sky-300 bg-sky-500 text-white' : 'border-white/70 bg-white/85 text-slate-700'}`}>
            <CheckSquare size={18} />
          </button>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{getPhotoTitle(photo)}</h3>
            <p className="mt-1 text-sm text-slate-500">{photo.category || 'Uncategorized'} • {formatDate(photo.uploadedAt)}</p>
          </div>
          <button type="button" onClick={() => onPreview?.(photo)} className="rounded-2xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-slate-100">
            <Eye size={16} />
          </button>
        </div>

        {photo.description ? <p className="line-clamp-2 text-sm leading-6 text-slate-600">{photo.description}</p> : null}
        {photo.rejectionReason ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{photo.rejectionReason}</p> : null}
        {photo.deleteMessage ? <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{photo.deleteMessage}</p> : null}

        {showCounts ? (
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1"><Eye size={14} /> {photo.viewsCount || 0}</span>
            <span className="inline-flex items-center gap-1"><Heart size={14} /> {photo.likesCount || 0}</span>
            <span className="inline-flex items-center gap-1"><Download size={14} /> {photo.downloadsCount || 0}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {onPreview ? <button type="button" onClick={() => onPreview(photo)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImagePlus size={14} /> Preview</button> : null}
          {onDownload ? <button type="button" onClick={() => onDownload(photo)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ImageDown size={14} /> Download</button> : null}
          {onLike ? <button type="button" onClick={() => onLike(photo)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"><Heart size={14} /> {photo.isLiked ? 'Unlike' : 'Like'}</button> : null}
        </div>

        {actionItems.length ? <PhotoActions actions={actionItems} /> : null}
      </div>
    </article>
  );
}
