import React, { useState, useEffect } from 'react';
import { 
  getLendingTransactionsAPI, 
  borrowItemAPI, 
  returnItemAPI,
  renewItemAPI,
  purchaseItemAPI,
  getItemsAPI
} from '../../api/inventoryApi';
import api from '../../../../api/axios'; // For searching parents
import { getStudentsAPI } from '../../../../api/students';
import Toast, { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
export default function LibraryDeskPage() {
  const { toast, showToast, hideToast } = useToast();
  const [confirmState, setConfirmState] = useState(null);
  
  const [activeTab, setActiveTab] = useState('lend'); // lend | loans | sales
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // View & Filter State
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Lend/Sell Form State
  const [items, setItems] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [searchStudentText, setSearchStudentText] = useState('');
  const [foundStudents, setFoundStudents] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [parentStudents, setParentStudents] = useState([]);
  const [studentSearchInParent, setStudentSearchInParent] = useState([]);
  const [searchItemText, setSearchItemText] = useState('');
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    itemId: '',
    action: 'borrow', // borrow | purchase
    quantity: 1,
    dueDate: '', // only for borrow
    depositCollected: '',
    depositPaymentMode: 'cash',
    depositTransactionRef: '',
    studentId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Return Modal State
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [returnCondition, setReturnCondition] = useState('good'); // good | damaged | lost

  // Renew Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingId, setRenewingId] = useState(null);
  const [newDueDate, setNewDueDate] = useState('');

  useEffect(() => {
    if (activeTab === 'lend') {
      fetchItems();
    } else {
      fetchTransactions();
    }
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await getLendingTransactionsAPI({ 
        status: activeTab === 'loans' ? 'active' : undefined
      });
      const filtered = res.data?.data?.filter(tx =>
        activeTab === 'loans' ? tx.transactionType === 'borrow' : tx.transactionType === 'purchase'
      ) || [];
      setTransactions(filtered);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await getItemsAPI({ limit: 1000 });
      setItems(res.data?.data || []);
    } catch (err) {
      console.error("Items fetch failed", err);
    }
  };

  // Debounced search for parent + student together in the same input
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchUser.length >= 3) {
        try {
          const studentRes = await getStudentsAPI({ search: searchUser, limit: 10 });
          const list = Array.isArray(studentRes?.data?.data) ? studentRes.data.data : (Array.isArray(studentRes?.data) ? studentRes.data : []);
          setStudentSearchInParent(list);
          setFoundUsers([]); // No longer fetching parents directly
        } catch (err) {
          console.error('Student search failed', err);
          setFoundUsers([]);
          setStudentSearchInParent([]);
        }
      } else {
        setFoundUsers([]);
        setStudentSearchInParent([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchUser]);

  // Debounced search for student
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchStudentText.length >= 3) {
        try {
          const res = await getStudentsAPI({ search: searchStudentText, limit: 5 });
          const list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
          setFoundStudents(list);
        } catch (err) {
          console.error('Student search failed', err);
          setFoundStudents([]);
        }
      } else {
        setFoundStudents([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchStudentText]);

  useEffect(() => {
    if (!selectedUser) { setParentStudents([]); return; }
    const term = selectedUser.email || selectedUser.phone;
    if (!term) return;
    getStudentsAPI({ search: term, limit: 20 })
      .then(res => {
        const list = Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res?.data) ? res.data : []);
        const matched = list.filter(
          s => {
            const sid = typeof s.parentUserId === 'object' ? s.parentUserId?._id : s.parentUserId;
            return sid === selectedUser._id;
          }
        );
        setParentStudents(matched);
      })
      .catch(err => console.error('Student lookup failed', err));
  }, [selectedUser]);

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      showToast('error', "Please select a parent first.");
      return;
    }
    try {
      setSubmitting(true);
      
      const payload = {
        itemId: formData.itemId,
        parentId: selectedUser._id,
        quantity: formData.quantity,
      };
      
      if (formData.action === 'borrow') {
        if (!formData.dueDate) {
          showToast('error', "Please select a due date.");
          setSubmitting(false);
          return;
        }
        payload.dueDate = new Date(formData.dueDate).toISOString();
        payload.depositCollected = formData.depositCollected ? Number(formData.depositCollected) : 0;
        payload.depositPaymentMode = formData.depositPaymentMode;
        if (formData.depositTransactionRef) payload.depositTransactionRef = formData.depositTransactionRef;
        if (formData.studentId) payload.studentId = formData.studentId;

        await borrowItemAPI(payload);
        showToast('success', 'Item successfully issued for borrowing!');
      } else {
        await purchaseItemAPI(payload);
        showToast('success', 'Item successfully sold!');
      }
      
      // Reset form
      setFormData({ ...formData, itemId: '', quantity: 1, dueDate: '', depositCollected: '', depositPaymentMode: 'cash', depositTransactionRef: '', studentId: '' });
      setSelectedUser(null);
      setSelectedStudent(null);
      setSearchUser('');
      setSearchStudentText('');
      setSearchItemText('');
    } catch (err) {
      console.error(err);
      showToast('error', err.response?.data?.message || 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnModal = (id) => {
    setReturningId(id);
    setReturnCondition('good');
    setIsReturnModalOpen(true);
  };

  const handleReturn = (e) => {
    e.preventDefault();
    if (!returningId) return;
    
    const tx = transactions.find(t => t._id === returningId);
    
    setConfirmState({
      title: 'Confirm Return',
      message: `Are you sure you want to return "${tx?.item?.name || 'this item'}" with condition: ${returnCondition}?`,
      confirmColor: 'amber',
      confirmLabel: 'Confirm Return',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await returnItemAPI(returningId, { returnCondition });
          if (returnCondition === 'lost') {
            showToast('success', 'Item marked as lost — linked security deposit has been auto-forfeited.');
          } else {
            showToast('success', 'Item returned successfully');
          }
          setIsReturnModalOpen(false);
          setReturningId(null);
          setConfirmState(null);
          await fetchTransactions();
        } catch (err) {
          showToast('error', err.response?.data?.message || 'Failed to return item');
          setConfirmState(null);
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const openRenewModal = (id, currentDueDate) => {
    setRenewingId(id);
    const date = new Date(currentDueDate || new Date());
    date.setDate(date.getDate() + 14);
    setNewDueDate(date.toISOString().split('T')[0]);
    setIsRenewModalOpen(true);
  };

  const handleRenew = (e) => {
    e.preventDefault();
    if (!renewingId || !newDueDate) return;
    
    const tx = transactions.find(t => t._id === renewingId);
    
    setConfirmState({
      title: 'Confirm Renew',
      message: `Are you sure you want to renew "${tx?.item?.name || 'this item'}" until ${new Date(newDueDate).toLocaleDateString()}?`,
      confirmColor: 'emerald',
      confirmLabel: 'Confirm Renew',
      onConfirm: async () => {
        try {
          setSubmitting(true);
          await renewItemAPI(renewingId, { newDueDate: new Date(newDueDate).toISOString() });
          showToast('success', 'Item renewed successfully');
          setIsRenewModalOpen(false);
          setRenewingId(null);
          setConfirmState(null);
          await fetchTransactions();
        } catch (err) {
          showToast('error', err.response?.data?.message || 'Failed to renew item');
          setConfirmState(null);
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const selectedItemObj = items.find(i => i._id === formData.itemId);

  // Auto-fill deposit amount when item changes
  useEffect(() => {
    if (selectedItemObj && formData.action === 'borrow') {
      setFormData(prev => ({ ...prev, depositCollected: selectedItemObj.securityDepositAmount || '' }));
    }
  }, [selectedItemObj, formData.action]);

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
          loading={submitting}
        />
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Library & Sales Desk</h1>
        <p className="text-slate-500 mt-1 font-medium">Issue, sell, return, and renew items on behalf of parents — visible to staff with Library permissions</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'lend' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('lend')}
        >
          Issue / Sell
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'loans' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('loans')}
        >
          Active Loans
        </button>
        <button
          className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${
            activeTab === 'sales' 
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          onClick={() => setActiveTab('sales')}
        >
          Sales History
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

      {/* ISSUE / SELL TAB */}
      {activeTab === 'lend' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              New Transaction - <span className={formData.action === 'borrow' ? 'text-purple-600' : 'text-emerald-600'}>
                {formData.action === 'borrow' ? 'Borrow (Library Loan)' : 'Purchase (Sale)'}
              </span>
            </h2>
            <form onSubmit={handleTransactionSubmit} className="space-y-6">
              
              {/* User Selection Section */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Search Parent</label>
                {!selectedUser ? (
                  <div className="relative">
                     <input
                       type="text"
                       placeholder="Type parent name, student name or admission no..."
                       value={searchUser}
                       onChange={(e) => setSearchUser(e.target.value)}
                       className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                     />
                     {!selectedUser && (foundUsers.length > 0 || studentSearchInParent.length > 0) && (
                       <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                         {foundUsers.map(u => (
                           <div 
                             key={`parent-${u._id}`}
                             className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                             onClick={() => { setSelectedUser(u); setFoundUsers([]); setStudentSearchInParent([]); setSearchUser(''); }}
                           >
                             <div>
                               <p className="font-bold text-slate-800">{u.name || `${u.firstName} ${u.lastName}`}</p>
                               <p className="text-xs text-slate-500">{u.email || u.phone}</p>
                             </div>
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Parent</span>
                           </div>
                         ))}
                         {studentSearchInParent.map(s => (
                           <div 
                             key={`student-${s._id}`}
                             className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-indigo-50 flex justify-between items-center"
                             onClick={() => { 
                               setSelectedStudent(s);
                               setFormData(prev => ({ ...prev, studentId: s._id }));
                               const pId = typeof s.parentUserId === 'object' ? s.parentUserId?._id : s.parentUserId;
                               const pName = typeof s.parentUserId === 'object' && s.parentUserId?.name ? s.parentUserId.name : (s.parentDetails?.primaryName || 'Linked Parent');
                               const pPhone = typeof s.parentUserId === 'object' && s.parentUserId?.phone ? s.parentUserId.phone : (s.parentDetails?.primaryPhone || '');
                               setSelectedUser({ _id: pId, name: pName, phone: pPhone });
                               setFoundUsers([]);
                               setStudentSearchInParent([]);
                               setSearchUser('');
                             }}
                           >
                             <div>
                               <p className="font-bold text-indigo-800">{s.fullName || `${s.firstName} ${s.lastName}`}</p>
                               <p className="text-xs text-indigo-500">{s.admissionNo} • {s.className}</p>
                             </div>
                             <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-1 rounded">Student</span>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div>
                      <p className="font-bold text-indigo-900">{selectedUser.name || `${selectedUser.firstName} ${selectedUser.lastName}`}</p>
                      <p className="text-sm text-indigo-700">{selectedUser.email || selectedUser.phone}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setSelectedUser(null)}
                      className="text-indigo-500 hover:text-indigo-700 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Action</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setFormData({...formData, action: 'borrow', quantity: 1, itemId: ''}); setSearchItemText(''); }}
                    className={`px-4 py-3 rounded-xl font-bold border-2 transition-all ${
                      formData.action === 'borrow'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Issue / Lend
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormData({...formData, action: 'purchase', itemId: ''}); setSearchItemText(''); }}
                    className={`px-4 py-3 rounded-xl font-bold border-2 transition-all ${
                      formData.action === 'purchase'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    Sell
                  </button>
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Item</label>
                {formData.itemId ? (
                  <div className="flex justify-between items-center p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div>
                      <p className="font-bold text-indigo-900">{selectedItemObj?.name}</p>
                      <p className="text-xs text-indigo-700 font-medium">₹{selectedItemObj?.sellingPrice} • Stock: {selectedItemObj?.currentStock || 0} • {typeof selectedItemObj?.category === 'object' ? selectedItemObj?.category?.name : selectedItemObj?.category || 'Uncategorized'}</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setFormData({...formData, itemId: ''}); setSearchItemText(''); }}
                      className="text-indigo-500 hover:text-indigo-700 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Search items by name, category, or price..."
                      value={searchItemText}
                      onChange={(e) => setSearchItemText(e.target.value)}
                      onFocus={() => setIsItemDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsItemDropdownOpen(false), 200)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                    />
                    {isItemDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                        {items
                          .filter(i => formData.action === 'borrow' ? i.itemTypes?.includes('lendable') : i.itemTypes?.includes('sellable'))
                          .filter(i => {
                            if (!searchItemText) return true;
                            const term = searchItemText.toLowerCase();
                            const categoryName = typeof i.category === 'object' ? i.category?.name : i.category;
                            return (
                              (i.name && i.name.toLowerCase().includes(term)) ||
                              (categoryName && categoryName.toLowerCase().includes(term)) ||
                              (i.sellingPrice !== undefined && i.sellingPrice.toString().includes(term))
                            );
                          })
                          .map(i => (
                            <div 
                              key={i._id}
                              className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                              onMouseDown={() => { setFormData({...formData, itemId: i._id}); setIsItemDropdownOpen(false); setSearchItemText(''); }}
                            >
                              <div>
                                <p className="font-bold text-slate-800">{i.name}</p>
                                <p className="text-xs text-slate-500 font-medium">₹{i.sellingPrice} • {typeof i.category === 'object' ? i.category?.name : i.category || 'Uncategorized'}</p>
                              </div>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${i.currentStock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                Stock: {i.currentStock || 0}
                              </span>
                            </div>
                        ))}
                        {items.filter(i => formData.action === 'borrow' ? i.itemTypes?.includes('lendable') : i.itemTypes?.includes('sellable')).filter(i => {
                            if (!searchItemText) return true;
                            const term = searchItemText.toLowerCase();
                            const categoryName = typeof i.category === 'object' ? i.category?.name : i.category;
                            return (
                              (i.name && i.name.toLowerCase().includes(term)) ||
                              (categoryName && categoryName.toLowerCase().includes(term)) ||
                              (i.sellingPrice !== undefined && i.sellingPrice.toString().includes(term))
                            );
                          }).length === 0 && (
                          <div className="p-4 text-center text-slate-500 text-sm font-medium">
                            No matching items found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {formData.action === 'borrow' && selectedItemObj?.securityDepositAmount > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 text-amber-800 text-sm font-medium rounded-xl border border-amber-200 flex items-start gap-2">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    A deposit record of ₹{selectedItemObj.securityDepositAmount} will be created for this item.
                  </div>
                )}
              </div>

              {formData.action === 'borrow' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Due Date</label>
                      <input
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Deposit Amount (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.depositCollected}
                        onChange={(e) => setFormData({...formData, depositCollected: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1.5">Payment Mode</label>
                      <select
                        value={formData.depositPaymentMode}
                        onChange={(e) => setFormData({...formData, depositPaymentMode: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                      >
                        <option value="cash">Cash</option>
                        <option value="upi">UPI</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {formData.depositPaymentMode !== 'cash' && (
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Transaction Ref</label>
                        <input
                          type="text"
                          value={formData.depositTransactionRef}
                          onChange={(e) => setFormData({...formData, depositTransactionRef: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                          placeholder="e.g. UTR Number"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Student (Optional)</label>
                    {!selectedStudent ? (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search student by name or ID..."
                          value={searchStudentText}
                          onFocus={() => {
                            if (selectedUser && !searchStudentText) {
                              setFoundStudents(parentStudents);
                            }
                          }}
                          onChange={(e) => setSearchStudentText(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                        />
                        {foundStudents.length > 0 && (
                          <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                            {foundStudents.map(s => (
                              <div 
                                key={s._id}
                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                                onClick={() => { 
                                  setSelectedStudent(s);
                                  setFormData(prev => ({ ...prev, studentId: s._id }));
                                  if (s.parentUserId && !selectedUser) {
                                    const pId = typeof s.parentUserId === 'string' ? s.parentUserId : s.parentUserId._id;
                                    const pName = typeof s.parentUserId === 'object' && s.parentUserId.name 
                                      ? s.parentUserId.name 
                                      : (s.parentDetails?.primaryName || 'Linked Parent');
                                    const pPhone = typeof s.parentUserId === 'object' && s.parentUserId.phone 
                                      ? s.parentUserId.phone 
                                      : (s.parentDetails?.primaryPhone || '');
                                    
                                    setSelectedUser({
                                      _id: pId,
                                      name: pName,
                                      phone: pPhone
                                    });
                                  }
                                  setFoundStudents([]); 
                                  setSearchStudentText(''); 
                                }}
                              >
                                <div>
                                  <p className="font-bold text-slate-800">{s.fullName || `${s.firstName} ${s.lastName}`}</p>
                                  <p className="text-xs text-slate-500">{s.admissionNo} • {s.className}</p>
                                </div>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">Select</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <div>
                          <p className="font-bold text-indigo-900">{selectedStudent.fullName || `${selectedStudent.firstName} ${selectedStudent.lastName}`}</p>
                          <p className="text-xs text-indigo-700">{selectedStudent.admissionNo} • {selectedStudent.className}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => { setSelectedStudent(null); setFormData(prev => ({ ...prev, studentId: '' })); }}
                          className="text-indigo-500 hover:text-indigo-700 p-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formData.action === 'purchase' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !selectedUser || !formData.itemId}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {submitting ? 'Processing...' : formData.action === 'borrow' ? 'Issue Item' : 'Complete Sale'}
              </button>
            </form>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-lg h-fit">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Library Rules
            </h3>
            <ul className="space-y-4 text-slate-300 font-medium text-sm">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                <span>Parents can borrow library items on behalf of students.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                <span>Select a due date. Standard borrowing period is 14 days.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                <span>Overdue items are flagged in the Active Loans list and trigger reminder/overdue notifications — fines are not currently auto-charged to fees and must be handled manually if applicable.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                <span>All direct sales (Uniforms/Stationery) bypass library rules and instantly deduct stock.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* LOANS & SALES TABS */}
      {activeTab !== 'lend' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <div className="flex-1 w-full relative">
                <input 
                  type="text" 
                  placeholder="Filter by item, parent, student name or admission no..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors text-sm font-medium"
                />
                <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 sm:w-48 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 text-sm font-bold text-slate-700"
                >
                  <option value="all">All Status</option>
                  {activeTab === 'loans' ? (
                    <>
                      <option value="active">Active</option>
                      <option value="returned">Returned</option>
                      <option value="overdue">Overdue</option>
                    </>
                  ) : (
                    <>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    <span className="hidden sm:inline">Table</span>
                  </button>
                </div>
             </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : (
            (() => {
              const filteredTx = transactions.filter(tx => {
                const term = searchQuery.toLowerCase();
                const matchItem = tx.item?.name?.toLowerCase().includes(term);
                const matchParent = tx.parent?.name?.toLowerCase().includes(term) || tx.parent?.firstName?.toLowerCase().includes(term);
                const matchStudent = tx.student?.fullName?.toLowerCase().includes(term) || tx.student?.firstName?.toLowerCase().includes(term) || tx.student?.admissionNo?.toLowerCase().includes(term);
                
                let matchStatus = true;
                if (filterStatus !== 'all') {
                  if (filterStatus === 'overdue') {
                    matchStatus = tx.status === 'active' && new Date(tx.dueDate) < new Date();
                  } else {
                    matchStatus = tx.status === filterStatus;
                  }
                }
                
                return (matchItem || matchParent || matchStudent) && matchStatus;
              });

              if (filteredTx.length === 0) {
                return (
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">No records found</h3>
                    <p className="text-slate-500 mt-2 font-medium">Try adjusting your filters or search terms.</p>
                  </div>
                );
              }

              return viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTx.map(tx => (
                    <div key={tx._id} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-lg transition-all duration-300">
                      <div className="flex justify-between items-start mb-5 border-b border-slate-100 pb-5">
                        <div className="pr-2">
                          <h3 className="font-extrabold text-slate-800 line-clamp-2 text-lg leading-tight" title={tx.item?.name}>{tx.item?.name}</h3>
                          <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-wider">Date: {new Date(tx.issueDate || tx.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="shrink-0">
                          {tx.status === 'active' && new Date(tx.dueDate) < new Date() ? (
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-100 text-red-700 uppercase tracking-widest">Overdue</span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${tx.status === 'active' ? 'bg-amber-100 text-amber-700' : tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'returned' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{tx.status}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6 flex-1 text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Parent</span>
                          <span className="font-bold text-slate-800 text-left sm:text-right">{tx.parent?.name || tx.parent?.firstName || 'N/A'}</span>
                        </div>
                        {tx.student && (
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Student</span>
                            <span className="font-bold text-slate-800 text-left sm:text-right">{tx.student.fullName || tx.student.firstName} ({tx.student.admissionNo})</span>
                          </div>
                        )}
                        {activeTab === 'loans' && (
                          <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Due Date</span>
                            <span className={`font-black ${new Date(tx.dueDate) < new Date() && tx.status === 'active' ? 'text-red-600' : 'text-slate-700'}`}>
                              {new Date(tx.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {tx.depositCollected > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Deposit Collected</span>
                            <span className="font-black text-emerald-600">₹{tx.depositCollected}</span>
                          </div>
                        )}
                        {activeTab === 'sales' && (
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                            <span className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">Amount Paid</span>
                            <span className="font-black text-indigo-600 text-lg">
                              {tx.isFree ? 'Free' : `₹${tx.priceCharged || 0}`}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {activeTab === 'loans' && tx.status === 'active' && (
                        <div className="mt-auto grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                          <button
                            onClick={() => openRenewModal(tx._id, tx.dueDate)}
                            className="py-3 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => openReturnModal(tx._id)}
                            className="py-3 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-sm"
                          >
                            Return
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500 font-bold">
                          <th className="p-4 pl-6">Transaction Date</th>
                          <th className="p-4">User Details</th>
                          <th className="p-4">Item & Financials</th>
                          {activeTab === 'loans' && <th className="p-4">Status & Due</th>}
                          {activeTab === 'loans' && <th className="p-4 text-right pr-6">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTx.map((tx) => (
                          <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-700 whitespace-nowrap">
                              {new Date(tx.issueDate || tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800" title={tx.parent?.name || tx.parent?.firstName || 'Unknown Parent'}>
                                {tx.parent?.name || tx.parent?.firstName || 'Unknown Parent'} <span className="text-[10px] uppercase text-slate-400 ml-1">(Parent)</span>
                              </p>
                              {tx.student && (
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                  {tx.student.fullName || tx.student.firstName} ({tx.student.admissionNo})
                                </p>
                              )}
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-800 max-w-[250px] truncate" title={tx.item?.name}>{tx.item?.name}</p>
                              <div className="flex gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Qty: {tx.quantity}</span>
                                {tx.depositCollected > 0 && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Dep: ₹{tx.depositCollected}</span>}
                                {activeTab === 'sales' && (
                                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                    {tx.isFree ? 'Free' : `Paid: ₹${tx.priceCharged || 0}`}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {activeTab === 'loans' && (
                              <td className="p-4">
                                <div className="flex flex-col gap-1 items-start">
                                  {tx.status === 'active' && new Date(tx.dueDate) < new Date() ? (
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-black bg-red-100 text-red-700 uppercase">Overdue</span>
                                  ) : (
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${tx.status === 'active' ? 'bg-amber-100 text-amber-700' : tx.status === 'returned' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{tx.status}</span>
                                  )}
                                  <span className={`text-xs font-bold ${new Date(tx.dueDate) < new Date() && tx.status === 'active' ? 'text-red-500' : 'text-slate-500'}`}>
                                    Due: {new Date(tx.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                              </td>
                            )}
                            
                            {activeTab === 'loans' && (
                              <td className="p-4 pr-6 text-right">
                                {tx.status === 'active' && (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => openRenewModal(tx._id, tx.dueDate)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100"
                                    >
                                      Renew
                                    </button>
                                    <button
                                      onClick={() => openReturnModal(tx._id)}
                                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors"
                                    >
                                      Return
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800">Return Item</h3>
              <button 
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors shadow-sm border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleReturn} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Return Condition <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-medium text-slate-800"
                  >
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Renew Modal */}
      {isRenewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-extrabold text-slate-800">Renew Item</h3>
              <button 
                onClick={() => setIsRenewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-xl transition-colors shadow-sm border border-slate-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleRenew} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">New Due Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 transition-colors font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsRenewModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-70"
                >
                  Confirm Renew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
