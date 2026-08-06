export default function StatsCards({ items = [] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className={`rounded-3xl border p-5 shadow-sm ${item.className || 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
                {item.helper ? <p className="mt-2 text-sm text-slate-500">{item.helper}</p> : null}
              </div>
              {Icon ? (
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconClassName || 'bg-slate-100 text-slate-700'}`}>
                  <Icon size={22} />
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
