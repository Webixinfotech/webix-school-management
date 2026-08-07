import React, { useState, useEffect } from 'react';
import { getPublicItemsAPI, addToWishlistAPI, getMyWishlistAPI, removeFromWishlistAPI } from '../../api/inventoryApi';
import api from '../../../../api/axios';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toMediaUrl } from '../../../../utils/photoUtils';
import Toast, { useToast } from '../../components/Toast';
import ItemCatalogGrid from '../../components/ItemCatalogGrid';

export default function PublicCatalogPage() {
  const { toast, showToast, hideToast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [addingToWishlist, setAddingToWishlist] = useState(null);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    fetchItems();
    if (user) {
      fetchWishlist();
    }
  }, [page, search, user]);

  const fetchWishlist = async () => {
    try {
      const res = await getMyWishlistAPI();
      const items = res.data?.data || [];
      const ids = new Set(items.map(w => w.item?._id || w.item));
      setWishlistIds(ids);
    } catch (err) {
      console.error('Failed to load wishlist', err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getPublicItemsAPI({ page, limit: 12, search });
      setItems(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    return toMediaUrl(url);
  };

  const handleAddWishlist = async (item) => {
    if (!user) {
      showToast('error', 'Login as a parent to save items to your wishlist');
      return;
    }
    const itemId = item._id || item.id;
    if (!itemId) {
      showToast('error', 'Error: Item ID is missing');
      return;
    }
    try {
      setAddingToWishlist(itemId);
      await addToWishlistAPI({ itemId });
      setWishlistIds(prev => new Set([...prev, itemId]));
      showToast('success', 'Added to wishlist successfully!');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to add to wishlist');
    } finally {
      setAddingToWishlist(null);
    }
  };

  const handleRemoveWishlist = async (item) => {
    if (!user) {
      showToast('error', 'Login as a parent to save items to your wishlist');
      return;
    }
    const itemId = item._id || item.id;
    try {
      setAddingToWishlist(itemId);
      await removeFromWishlistAPI(itemId);
      setWishlistIds(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      showToast('success', 'Removed from wishlist');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to remove from wishlist');
    } finally {
      setAddingToWishlist(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <Toast toast={toast} onClose={hideToast} />
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            School <span className="text-indigo-600">Library & Store</span>
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Browse books, uniforms, and stationery available at our school. Login to your parent portal to add items to your wishlist.
          </p>
        </div>

        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search items by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 font-semibold text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-700">No items found</h3>
            <p className="text-slate-500 mt-2 font-medium">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <ItemCatalogGrid 
                items={items} 
                wishlistIds={wishlistIds} 
                addingToWishlist={addingToWishlist}
                onAddWishlist={handleAddWishlist}
                onRemoveWishlist={handleRemoveWishlist}
              />
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="font-bold text-slate-500">Page {page} of {totalPages}</span>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors disabled:opacity-50"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
