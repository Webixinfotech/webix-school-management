import React from 'react';

// ---- tiny inline icons (no new deps) --------------------------------------
const Icon = {
  Heart: (p) => (
    <svg viewBox="0 0 24 24" fill={p.filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  Book: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Bag: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  ),
  Box: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
    </svg>
  ),
};

// Small, quiet label for lendable / sellable — shown as a compact row under
// the title instead of stacked badges glued to the photo.
function TypeTag({ type }) {
  const isLibrary = type === 'lendable';
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
        isLibrary ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'
      }`}
    >
      {isLibrary ? <Icon.Book className="w-2.5 h-2.5" /> : <Icon.Bag className="w-2.5 h-2.5" />}
      {isLibrary ? 'Library' : 'Store'}
    </span>
  );
}

export default function ItemCatalogGrid({
  items = [],
  wishlistIds = new Set(),
  addingToWishlist = null,
  onAddWishlist,
  onRemoveWishlist,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
      {items.map((item) => {
        const id = item.id || item._id;
        const inWishlist = wishlistIds.has(id);
        const isBusy = addingToWishlist === id;
        const price = item.sellingPrice ?? item.price ?? 0;
        const inStock =
          typeof item.currentStock === 'number' ? item.currentStock > 0 : item.availableForSale !== false;
        const types = item.itemTypes || [];

        return (
          <div
            key={id}
            className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-md hover:border-slate-200 transition-all duration-200"
          >
            {/* Image */}
            <div className="relative aspect-square bg-slate-50">
              {item.photo || item.imageUrl ? (
                <img
                  src={item.photo || item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon.Box className="w-7 h-7 text-slate-300" />
                </div>
              )}

              {/* Wishlist toggle — compact circular icon button, top-right */}
              <button
                onClick={() =>
                  inWishlist ? onRemoveWishlist?.(item) : onAddWishlist?.(item)
                }
                disabled={isBusy}
                aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm transition-all active:scale-90 disabled:opacity-50 ${
                  inWishlist
                    ? 'bg-white text-red-500'
                    : 'bg-white/80 text-slate-400 hover:text-red-500'
                }`}
              >
                <Icon.Heart filled={inWishlist} className="w-3.5 h-3.5" />
              </button>

              {/* Out of stock overlay */}
              {!inStock && (
                <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800/85 text-white">
                    Out of stock
                  </span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-2.5 sm:p-3">
              {item.category && (
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-0.5">
                  {item.category}
                </p>
              )}
              <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2 min-h-[2.2em]">
                {item.name}
              </p>

              {types.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {types.map((t) => (
                    <TypeTag key={t} type={t} />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-extrabold text-slate-900">₹{price}</span>
                <span
                  className={`text-[10px] font-bold ${
                    inStock ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {inStock ? 'In stock' : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}