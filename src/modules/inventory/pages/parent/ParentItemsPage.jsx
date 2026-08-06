import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPublicItemsAPI, getMyLendingHistoryAPI, getMyWishlistAPI, removeFromWishlistAPI, addToWishlistAPI } from '../../api/inventoryApi';
import Toast, { useToast } from '../../components/Toast';
import ItemCatalogGrid from '../../components/ItemCatalogGrid';

// ---- small icon set (inline SVG, no new deps) -----------------------------
const Icon = {
  Browse: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  History: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 3v5h5" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  Heart: (p) => (
    <svg viewBox="0 0 24 24" fill={p.filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  Trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
    </svg>
  ),
  Calendar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Box: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
    </svg>
  ),
};

// ---- status pill ------------------------------------------------------
function StatusPill({ status }) {
  const map = {
    active: { label: 'Borrowed', cls: 'bg-amber-100 text-amber-700 ring-amber-200' },
    returned: { label: 'Returned', cls: 'bg-slate-100 text-slate-600 ring-slate-200' },
    completed: { label: 'Purchased', cls: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-600 ring-red-200' },
  };
  const s = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 ring-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ring-1 ring-inset ${s.cls}`}>
      {s.label}
    </span>
  );
}

function TypePill({ type }) {
  const isBorrow = type === 'borrow';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
      isBorrow ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
    }`}>
      {isBorrow ? <Icon.Book className="w-3 h-3" /> : <Icon.Bag className="w-3 h-3" />}
      {type}
    </span>
  );
}

export default function ParentItemsPage() {
  const { toast, showToast, hideToast } = useToast();
  const [searchParams] = useSearchParams();
  // Supports deep-linking here as /parent/inventory/my-items?tab=wishlist
  // (used by the wishlist-restock notification so it opens straight on the
  // relevant tab instead of the default Browse tab).
  const initialTab = ['browse', 'items', 'wishlist'].includes(searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'browse';
  const [activeTab, setActiveTab] = useState(initialTab); // browse | items | wishlist
  const [history, setHistory] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [addingToWishlist, setAddingToWishlist] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    fetchData();
    fetchWishlistIds();
  }, [activeTab]);

  const fetchWishlistIds = async () => {
    try {
      const res = await getMyWishlistAPI();
      const items = res.data?.data || [];
      setWishlistIds(new Set(items.map(w => w.item?._id || w.item)));
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'browse') {
        const res = await getPublicItemsAPI({ limit: 100 });
        setItems(res.data?.data || []);
      } else if (activeTab === 'items') {
        const res = await getMyLendingHistoryAPI();
        setHistory(res.data?.transactions || []);
      } else if (activeTab === 'wishlist') {
        const res = await getMyWishlistAPI();
        setWishlist(res.data?.data || []);
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddWishlist = async (itemOrId) => {
    const id = typeof itemOrId === 'object' && itemOrId !== null ? (itemOrId._id || itemOrId.id) : itemOrId;
    if (!id) return;
    try {
      setAddingToWishlist(id);
      await addToWishlistAPI({ itemId: id });
      setWishlistIds(prev => new Set([...prev, id]));
      showToast('success', 'Added to wishlist successfully!');
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to add to wishlist');
    } finally {
      setAddingToWishlist(null);
    }
  };

  const handleRemoveWishlist = async (itemOrId) => {
    const id = typeof itemOrId === 'object' && itemOrId !== null ? (itemOrId._id || itemOrId.id) : itemOrId;
    if (!id) return;
    try {
      setRemovingId(id);
      await removeFromWishlistAPI(id);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (activeTab === 'wishlist') {
        fetchData();
      }
      showToast('success', 'Removed from wishlist successfully!');
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to remove from wishlist');
    } finally {
      setRemovingId(null);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return url;
  };

  const tabs = [
    { key: 'browse', label: 'Browse Items', short: 'Browse', icon: Icon.Browse, count: items.length },
    { key: 'items', label: 'My History', short: 'History', icon: Icon.History, count: history.length },
    { key: 'wishlist', label: 'My Wishlist', short: 'Wishlist', icon: Icon.Heart, count: wishlist.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">
        <Toast toast={toast} onClose={hideToast} />

        {/* Header */}
        <div className="mb-6 md:mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 px-5 py-7 sm:px-8 sm:py-9 shadow-lg shadow-indigo-200/60">
          <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-2 bottom-0 w-24 h-24 rounded-full bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="hidden xs:flex sm:flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 shrink-0">
              <Icon.Book className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div> 
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Library &amp; Purchases</h1>
              <p className="text-indigo-100 mt-1 font-medium text-sm sm:text-base">Track borrowed books, uniform purchases, and your wishlist</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {tabs.map(({ key, label, short, icon: TabIcon, count }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`shrink-0 flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 font-semibold flex items-center gap-3 ring-1 ring-red-100">
            <Icon.Alert className="w-6 h-6 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState tab={activeTab} />
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            {activeTab === 'browse' ? (
              items.length === 0 ? (
                <EmptyState
                  icon={Icon.Browse}
                  title="No items available right now"
                  subtitle="Check back later — new books and uniforms are added regularly."
                />
              ) : (
                <div className="p-4 sm:p-6">
                  <ItemCatalogGrid
                    items={items}
                    wishlistIds={wishlistIds}
                    addingToWishlist={addingToWishlist}
                    onAddWishlist={handleAddWishlist}
                    onRemoveWishlist={handleRemoveWishlist}
                  />
                </div>
              )
            ) : activeTab === 'items' ? (
              history.length === 0 ? (
                <EmptyState
                  icon={Icon.History}
                  title="No history yet"
                  subtitle="Items you borrow or purchase will show up here."
                />
              ) : (
                <>
                  {/* Mobile: card list */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {history.map((tx) => (
                      <div key={tx._id} className="p-4 flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 truncate">{tx.item?.name || 'Unknown Item'}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Qty: {tx.quantity}</p>
                          </div>
                          <TypePill type={tx.transactionType} />
                        </div>
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                            <Icon.Calendar className="w-3.5 h-3.5" />
                            {new Date(tx.issueDate || tx.createdAt).toLocaleDateString()}
                          </div>
                          {tx.transactionType === 'purchase' ? (
                            <span className="font-bold text-emerald-600 text-sm">Completed</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <StatusPill status={tx.status} />
                              {tx.status === 'active' && tx.dueDate && (
                                <span className={`text-xs font-bold ${tx.isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                                  Due {new Date(tx.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-4 pl-6">Date</th>
                          <th className="p-4">Item</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status / Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.map((tx) => (
                          <tr key={tx._id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-700 whitespace-nowrap">
                              {new Date(tx.issueDate || tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 max-w-[220px]">
                              <p className="font-bold text-slate-800 truncate" title={tx.item?.name}>{tx.item?.name || 'Unknown Item'}</p>
                              <p className="text-xs text-slate-500 font-medium">Qty: {tx.quantity}</p>
                            </td>
                            <td className="p-4">
                              <TypePill type={tx.transactionType} />
                            </td>
                            <td className="p-4">
                              {tx.transactionType === 'purchase' ? (
                                <span className="font-bold text-emerald-600">Completed</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <StatusPill status={tx.status} />
                                  {tx.status === 'active' && tx.dueDate && (
                                    <span className={`text-xs font-bold ${tx.isOverdue ? 'text-red-500' : 'text-slate-500'}`}>
                                      Due: {new Date(tx.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            ) : (
              wishlist.length === 0 ? (
                <EmptyState
                  icon={Icon.Heart}
                  title="Your wishlist is empty"
                  subtitle="Tap the heart on any item in Browse to save it here."
                />
              ) : (
                <>
                  {/* Mobile: card list */}
                  <div className="md:hidden divide-y divide-slate-100">
                    {wishlist.map((wItem) => {
                      const inStock = wItem.item?.currentStock > 0;
                      return (
                        <div key={wItem._id} className="p-4 flex items-center gap-3">
                          <div className="w-14 h-14 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-100">
                            {getImageUrl(wItem.item?.imageUrl) ? (
                              <img src={getImageUrl(wItem.item?.imageUrl)} alt={wItem.item?.name} className="w-full h-full object-cover" />
                            ) : (
                              <Icon.Box className="w-6 h-6 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 truncate">{wItem.item?.name || 'Unknown Item'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-bold text-slate-700 text-sm">₹{wItem.item?.sellingPrice || 0}</span>
                              <span className={`text-[11px] font-bold ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                                {inStock ? '• In Stock' : '• Out of Stock'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveWishlist(wItem.item?._id)}
                            disabled={removingId === wItem.item?._id}
                            className="p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition disabled:opacity-50 shrink-0"
                            aria-label="Remove from wishlist"
                          >
                            <Icon.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-4 pl-6">Item</th>
                          <th className="p-4">Price</th>
                          <th className="p-4 text-center">Availability</th>
                          <th className="p-4 text-right pr-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {wishlist.map((wItem) => {
                          const inStock = wItem.item?.currentStock > 0;
                          return (
                            <tr key={wItem._id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-4 pl-6">
                                <div className="flex items-center gap-3 max-w-[280px]">
                                  <div className="w-10 h-10 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden ring-1 ring-slate-100">
                                    {getImageUrl(wItem.item?.imageUrl) ? (
                                      <img src={getImageUrl(wItem.item?.imageUrl)} alt={wItem.item?.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <Icon.Box className="w-5 h-5 text-slate-300" />
                                    )}
                                  </div>
                                  <span className="font-bold text-slate-800 truncate" title={wItem.item?.name}>
                                    {wItem.item?.name || 'Unknown Item'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 font-bold text-slate-700">₹{wItem.item?.sellingPrice || 0}</td>
                              <td className="p-4 text-center">
                                {inStock ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200">In Stock</span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600 ring-1 ring-red-200">Out of Stock</span>
                                )}
                              </td>
                              <td className="p-4 pr-6 text-right">
                                <button
                                  onClick={() => handleRemoveWishlist(wItem.item?._id)}
                                  disabled={removingId === wItem.item?._id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  <Icon.Trash className="w-3.5 h-3.5" />
                                  Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: IconCmp, title, subtitle }) {
  return (
    <div className="p-12 sm:p-16 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center ring-1 ring-slate-100">
        <IconCmp className="w-6 h-6 text-slate-300" />
      </div>
      <p className="text-slate-600 font-bold">{title}</p>
      <p className="text-slate-400 text-sm font-medium max-w-xs">{subtitle}</p>
    </div>
  );
}

function LoadingState({ tab }) {
  if (tab === 'browse') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
            <div className="aspect-square bg-slate-100" />
            <div className="p-3 space-y-2">
              <div className="h-3.5 bg-slate-100 rounded w-4/5" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-100 rounded w-2/5" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
          </div>
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}