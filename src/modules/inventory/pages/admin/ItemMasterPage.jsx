import React, { useState, useEffect, useRef } from 'react';
import { 
  getItemsAPI, 
  deleteItemAPI, 
  createItemAPI, 
  updateItemAPI,
  getCategoriesAPI 
} from '../../api/inventoryApi';
import api from '../../../../api/axios'; // For base URL if needed for images
import { toMediaUrl } from '../../../../utils/photoUtils';
import Toast, { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function ItemMasterPage() {
  const { toast, showToast, hideToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [classes, setClasses] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [itemTypeError, setItemTypeError] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    itemTypes: [],
    unit: 'piece',
    minStockLevel: 0,
    storageLocation: '',
    sellingPrice: 0,
    securityDepositAmount: 0,
    availableForSale: false,
    isPublic: false,
    isActive: true,
    vendorName: '',
    vendorContact: '',
    classPricingFreeForClasses: [],
    directIssueOverride: 'default',
  });
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, search, filterCat]);

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesAPI();
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error("Categories fetch failed", err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getItemsAPI({ page, limit: 10, search, category: filterCat });
      setItems(res.data?.data || []);
      setTotalPages(res.data?.pages || 1);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name || '',
        category: item.category?._id || item.category || '',
        itemTypes: item.itemTypes || [],
        unit: item.unit || 'piece',
        minStockLevel: item.minStockLevel || 0,
        storageLocation: item.storageLocation || '',
        sellingPrice: item.sellingPrice || 0,
        securityDepositAmount: item.securityDepositAmount || 0,
        availableForSale: item.availableForSale || false,
        isPublic: item.isPublic || false,
        isActive: item.isActive !== false,
        vendorName: item.vendor?.name || item.vendorName || '',
        vendorContact: item.vendor?.contact || item.vendorContact || '',
        classPricingFreeForClasses: item.classPricingFreeForClasses || [],
        directIssueOverride: item.directIssueOverride || 'default',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        itemTypes: [],
        unit: 'piece',
        minStockLevel: 0,
        storageLocation: '',
        sellingPrice: 0,
        securityDepositAmount: 0,
        availableForSale: false,
        isPublic: false,
        isActive: true,
        vendorName: '',
        vendorContact: '',
        classPricingFreeForClasses: [],
        directIssueOverride: 'default',
      });
    }
    setImageFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setItemTypeError(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleItemTypeChange = (type) => {
    setItemTypeError(false);
    setFormData(prev => {
      const types = prev.itemTypes.includes(type) 
        ? prev.itemTypes.filter(t => t !== type)
        : [...prev.itemTypes, type];
      return { ...prev, itemTypes: types };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.itemTypes.length === 0) {
      setItemTypeError(true);
      showToast('error', 'Please select at least one item type (Consumable, Lendable, or Sellable).');
      return;
    }
    
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'itemTypes' || key === 'classPricingFreeForClasses') {
          if (Array.isArray(formData[key]) && formData[key].length > 0) {
            formData[key].forEach(val => fd.append(key, val));
          }
        } else if (key === 'directIssueOverride') {
          if (formData[key] === 'true' || formData[key] === 'false' || formData[key] === true || formData[key] === false) {
            fd.append(key, formData[key]);
          }
        } else {
          fd.append(key, formData[key]);
        }
      });
      
      if (imageFile) {
        fd.append('photo', imageFile);
      }

      if (editingItem) {
        await updateItemAPI(editingItem._id, fd);
        showToast('success', 'Item updated successfully');
      } else {
        await createItemAPI(fd);
        showToast('success', 'Item created successfully');
      }
      await fetchItems();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmState({
      title: 'Delete Item',
      message: 'This will permanently remove this item from the catalog. Existing stock-in/lending history for it will be kept, but it will no longer be available to issue, lend, or sell.',
      confirmColor: 'rose',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteItemAPI(id);
          showToast('success', 'Item deleted successfully');
          await fetchItems();
        } catch (err) {
          console.error(err);
          showToast('error', err.response?.data?.message || 'Failed to delete item');
        } finally {
          setConfirmState(null);
        }
      }
    });
  };

  // Helper for image URL
  const getImageUrl = (url) => {
    if (!url) return null;
    return toMediaUrl(url);
  };

  const isLendable = formData.itemTypes.includes('lendable');
  const isSellable = formData.itemTypes.includes('sellable');

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <Toast toast={toast} onClose={hideToast} />
      {confirmState && (
        <ConfirmModal 
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          confirmColor={confirmState.confirmColor}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
          loading={false}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Item Master</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage catalog, pricing, and item stock</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800 bg-slate-50 focus:bg-white"
          />
        </div>
        <div className="md:w-64">
          <select
            value={filterCat}
            onChange={(e) => { setFilterCat(e.target.value); setPage(1); }}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800 bg-slate-50 focus:bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 font-semibold flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="p-4 pl-6">Item</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Types</th>
                    <th className="p-4 text-right">Price (₹)</th>
                    <th className="p-4 text-center">Stock</th>
                    <th className="p-4 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-12 text-center text-slate-400 font-medium">
                        No items found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-6 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {item.photo ? (
                              <img src={getImageUrl(item.photo)} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-800">{item.name}</p>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.isPublic ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                {item.isPublic ? 'Public' : 'Internal'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{item.unit}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                            {item.category?.name || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {item.itemTypes?.map(type => (
                              <span key={type} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 uppercase">
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <p className="font-bold text-slate-800">₹{item.sellingPrice}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.currentStock > item.minStockLevel ? 'bg-emerald-100 text-emerald-700' : 
                            item.currentStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.currentStock || 0}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2 transition-opacity">
                            <button
                              onClick={() => openModal(item)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-lg font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingItem ? 'Edit Item' : 'New Item'}
              </h3>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors shadow-sm border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Image Upload Area */}
                <div className="md:col-span-2 flex items-center gap-6 p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                     {imageFile ? (
                        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                     ) : editingItem?.photo ? (
                        <img src={getImageUrl(editingItem.photo)} alt="Current" className="w-full h-full object-cover" />
                     ) : (
                        <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                     )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700">Item Image (photo)</h4>
                    <p className="text-sm text-slate-500 mb-3">Upload a square image (JPEG/PNG)</p>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden" 
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm"
                    >
                      Choose File
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                    placeholder="e.g. Physics Text Book"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  >
                    <option value="" disabled>Select category...</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Item Types (Select all that apply) <span className="text-red-500">*</span></label>
                  <div className={`flex gap-4 p-4 border-2 rounded-xl bg-slate-50 ${itemTypeError ? 'border-red-400' : 'border-slate-200'}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.itemTypes.includes('consumable')} 
                        onChange={() => handleItemTypeChange('consumable')}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300"
                      />
                      <span className="font-bold text-slate-700">Consumable</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.itemTypes.includes('lendable')} 
                        onChange={() => handleItemTypeChange('lendable')}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300"
                      />
                      <span className="font-bold text-slate-700">Lendable (Library)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.itemTypes.includes('sellable')} 
                        onChange={() => handleItemTypeChange('sellable')}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300"
                      />
                      <span className="font-bold text-slate-700">Sellable</span>
                    </label>
                  </div>
                  {itemTypeError && (
                    <p className="mt-2 text-sm font-bold text-red-500">
                      Please select at least one item type (Consumable, Lendable, or Sellable).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Unit (e.g. piece, kg, box)</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  />
                  <p className="text-xs text-slate-500 mt-1">Used for direct sales or replacement value</p>
                </div>

                {isLendable && (
                  <div>
                    <label className="block text-sm font-bold text-purple-700 mb-1.5">Security Deposit Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.securityDepositAmount}
                      onChange={(e) => setFormData({...formData, securityDepositAmount: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-0 transition-colors font-medium text-slate-800 bg-purple-50"
                    />
                  </div>
                )}

                {isSellable && (
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer p-3 border-2 border-slate-200 rounded-xl w-full hover:border-indigo-300">
                      <input
                        type="checkbox"
                        checked={formData.availableForSale}
                        onChange={(e) => setFormData({...formData, availableForSale: e.target.checked})}
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300"
                      />
                      <span className="font-bold text-slate-700">Available For Sale</span>
                    </label>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 bg-white shadow-sm">
                    <input type="checkbox" checked={formData.isPublic}
                      onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300" />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Show on Public Catalog</div>
                      <div className="text-xs text-slate-500">Website + Parent/Staff ke "Browse" tab par dikhega</div>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Direct Issue Override</label>
                  <select
                    value={formData.directIssueOverride}
                    onChange={(e) => setFormData({...formData, directIssueOverride: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  >
                    <option value="default">Default (Inherit from Category)</option>
                    <option value="true">Yes (Always allow direct issue)</option>
                    <option value="false">No (Always require approval)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Free For Classes Override</label>
                  <p className="text-xs text-slate-500 mb-2">Overrides category-level free classes for this specific item.</p>
                  <div className="flex flex-wrap gap-2 mb-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                    {classes.map(cls => (
                      <label key={cls._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${formData.classPricingFreeForClasses.includes(cls._id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.classPricingFreeForClasses.includes(cls._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, classPricingFreeForClasses: [...prev.classPricingFreeForClasses, cls._id] }));
                            } else {
                              setFormData(prev => ({ ...prev, classPricingFreeForClasses: prev.classPricingFreeForClasses.filter(id => id !== cls._id) }));
                            }
                          }}
                        />
                        <span className={`text-sm font-bold ${formData.classPricingFreeForClasses.includes(cls._id) ? 'text-indigo-700' : 'text-slate-600'}`}>{cls.name || cls.className}</span>
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <span className="text-sm text-slate-500 p-2">No classes found.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Min Stock Level</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Storage Location</label>
                  <input
                    type="text"
                    value={formData.storageLocation}
                    onChange={(e) => setFormData({...formData, storageLocation: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-bold text-slate-700 mb-3 border-b pb-2">Vendor Details (Optional)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Vendor Name</label>
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({...formData, vendorName: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-500 font-medium text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Vendor Contact</label>
                      <input
                        type="text"
                        value={formData.vendorContact}
                        onChange={(e) => setFormData({...formData, vendorContact: e.target.value})}
                        className="w-full px-4 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-500 font-medium text-sm"
                      />
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-8 flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
