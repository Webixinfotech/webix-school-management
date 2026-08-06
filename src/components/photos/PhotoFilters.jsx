import { Search } from 'lucide-react';

export default function PhotoFilters({
  filters,
  onChange,
  searchPlaceholder = 'Search photos',
  categories = [],
  statuses = [],
  roles = [],
  uploadTypes = [],
  extraActions,
  sticky = false,
  showSearch = true,
  showDateRange = true,
}) {
  return (
    <div className={`${sticky ? 'xl:sticky xl:top-6' : ''} rounded-3xl border border-slate-200 bg-white p-4 shadow-sm`}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        {showSearch ? (
          <label className="relative md:col-span-2 xl:col-span-2">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={filters.search || ''}
              onChange={(event) => onChange('search', event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </label>
        ) : null}

        {statuses.length ? (
          <select value={filters.status || ''} onChange={(event) => onChange('status', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100">
            {statuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : null}

        {categories.length ? (
          <select value={filters.category || ''} onChange={(event) => onChange('category', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100">
            {categories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : null}

        {uploadTypes.length ? (
          <select value={filters.uploadType || ''} onChange={(event) => onChange('uploadType', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100">
            {uploadTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : null}

        {roles.length ? (
          <select value={filters.uploaderRole || ''} onChange={(event) => onChange('uploaderRole', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100">
            {roles.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : null}

        {showDateRange ? <input type="date" value={filters.dateFrom || ''} onChange={(event) => onChange('dateFrom', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" /> : null}
        {showDateRange ? <input type="date" value={filters.dateTo || ''} onChange={(event) => onChange('dateTo', event.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100" /> : null}
      </div>
      {extraActions ? <div className="mt-4 flex flex-wrap items-center gap-3">{extraActions}</div> : null}
    </div>
  );
}
