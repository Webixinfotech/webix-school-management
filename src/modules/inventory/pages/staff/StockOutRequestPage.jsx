import React, { useState, useEffect } from 'react';
import { getItemsAPI, requestStockOutAPI } from '../../api/inventoryApi';
import { useNavigate } from 'react-router-dom';
import Toast, { useToast } from '../../components/Toast';
import ItemSearchSelect from '../../components/ItemSearchSelect';
import api from '../../../../api/axios';

export default function StockOutRequestPage() {
  const { toast, showToast, hideToast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);

  const [formData, setFormData] = useState({
    itemId: '',
    quantity: 1,
    purpose: '',
    classId: ''
  });

  useEffect(() => {
    fetchItems();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to load classes', err);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await getItemsAPI({ limit: 100 }); 
      // Filter out library items on frontend if backend doesn't, but usually it's better to pass a filter
      const filtered = (res.data?.data || []).filter(i => i.itemTypes?.includes('consumable'));
      setItems(filtered);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load available items.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.itemId) {
      setFormError("Please select an item.");
      return;
    }
    if (formData.quantity < 1) {
      setFormError("Quantity must be at least 1.");
      return;
    }
    try {
      setSubmitting(true);
      await requestStockOutAPI(formData);
      showToast('success', 'Request submitted successfully. Pending admin approval.');
      navigate('/teacher/inventory/my-requests');
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedItem = items.find(i => i._id === formData.itemId);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <Toast toast={toast} onClose={hideToast} />
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Request Items</h1>
          <p className="text-slate-500 mt-1 font-medium">Request stationery or inventory for class use</p>
        </div>
        <button
          onClick={() => navigate('/teacher/inventory/my-requests')}
          className="text-slate-500 hover:text-slate-700 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          View My Requests
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

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Item <span className="text-red-500">*</span></label>
              <ItemSearchSelect
                items={items}
                value={formData.itemId}
                onChange={(id) => setFormData({...formData, itemId: id})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Class (Optional)</label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({...formData, classId: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
              >
                <option value="">-- General Purpose / No specific class --</option>
                {classes.map(cls => (
                  <option key={cls._id} value={cls._id}>{cls.name || cls.className}</option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4">
                <div className="w-16 h-16 bg-white rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{selectedItem.name}</h4>
                  <p className={`text-xs font-bold mt-1 ${selectedItem.currentStock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    Available Stock: {selectedItem.currentStock || 0}
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min="1"
                max={selectedItem ? selectedItem.currentStock : undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
              />
              {selectedItem && formData.quantity > selectedItem.currentStock && (
                <p className="text-xs text-red-500 mt-1 font-medium">Requested quantity exceeds available stock.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Purpose / Notes <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800 resize-none"
                placeholder="Why do you need these items?"
              />
            </div>

            <div className="pt-2">
              {formError && (
                <p className="text-sm font-bold text-red-500 mb-3">{formError}</p>
              )}
              <button
                type="submit"
                disabled={submitting || (selectedItem && formData.quantity > selectedItem.currentStock)}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
