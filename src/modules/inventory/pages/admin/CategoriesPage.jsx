import React, { useState, useEffect } from 'react';
import { 
  getCategoriesAPI, 
  createCategoryAPI, 
  updateCategoryAPI, 
  deleteCategoryAPI 
} from '../../api/inventoryApi';
import api from '../../../../api/axios';
import Toast, { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

export default function CategoriesPage() {
  const { toast, showToast, hideToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', description: '', directIssueAllowed: false, freeForClasses: [] });
  const [submitting, setSubmitting] = useState(false);

  const [classes, setClasses] = useState([]);

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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await getCategoriesAPI();
      setCategories(res.data?.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setFormData({ 
        name: cat.name, 
        description: cat.description || '', 
        directIssueAllowed: cat.directIssueAllowed || false,
        freeForClasses: cat.freeForClasses || []
      });
    } else {
      setEditingCat(null);
      setFormData({ name: '', description: '', directIssueAllowed: false, freeForClasses: [] });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCat(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingCat) {
        await updateCategoryAPI(editingCat._id, formData);
        showToast('success', 'Category updated successfully');
      } else {
        await createCategoryAPI(formData);
        showToast('success', 'Category created successfully');
      }
      await fetchCategories();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmState({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Categories that still have items assigned to them cannot be deleted.',
      confirmColor: 'rose',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await deleteCategoryAPI(id);
          showToast('success', 'Category deleted successfully');
          await fetchCategories();
        } catch (err) {
          console.error(err);
          showToast('error', err.response?.data?.message || 'Failed to delete category');
        } finally {
          setConfirmState(null);
        }
      }
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
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
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage library and inventory categories</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Direct Issue</th>
                  <th className="p-4 hidden md:table-cell">Description</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-slate-400 font-medium">
                      No categories found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-4 pl-6 font-bold text-slate-800">{cat.name}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                          cat.directIssueAllowed 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cat.directIssueAllowed ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 text-sm hidden md:table-cell max-w-xs truncate">
                        {cat.description || '-'}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => openModal(cat)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id)}
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div 
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800">
                {editingCat ? 'Edit Category' : 'New Category'}
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
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                    placeholder="e.g. Science Books"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.directIssueAllowed}
                      onChange={(e) => setFormData({...formData, directIssueAllowed: e.target.checked})}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Allow Direct Issue</div>
                      <div className="text-xs text-slate-500">Staff can issue items without admin approval</div>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Free For Classes</label>
                  <div className="flex flex-wrap gap-2 mb-2 max-h-40 overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50">
                    {classes.map(cls => (
                      <label key={cls._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 cursor-pointer transition-colors ${formData.freeForClasses.includes(cls._id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.freeForClasses.includes(cls._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({ ...prev, freeForClasses: [...prev.freeForClasses, cls._id] }));
                            } else {
                              setFormData(prev => ({ ...prev, freeForClasses: prev.freeForClasses.filter(id => id !== cls._id) }));
                            }
                          }}
                        />
                        <span className={`text-sm font-bold ${formData.freeForClasses.includes(cls._id) ? 'text-indigo-700' : 'text-slate-600'}`}>{cls.name || cls.className}</span>
                      </label>
                    ))}
                    {classes.length === 0 && (
                      <span className="text-sm text-slate-500 p-2">No classes found.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Description (Optional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800 resize-none"
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
