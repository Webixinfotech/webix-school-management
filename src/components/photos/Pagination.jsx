export default function Pagination({ page = 1, pages = 1, onChange }) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">Page {page} of {pages}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Previous</button>
        <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Next</button>
      </div>
    </div>
  );
}
