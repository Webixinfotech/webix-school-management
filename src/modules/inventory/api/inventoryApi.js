import api from '../../../api/axios';

// ============================================
// Categories
// ============================================
export const getCategoriesAPI = () => api.get('inventory/categories');
export const getCategoryByIdAPI = (id) => api.get(`inventory/categories/${id}`);
export const createCategoryAPI = (data) => api.post('inventory/categories', data);
export const updateCategoryAPI = (id, data) => api.put(`inventory/categories/${id}`, data);
export const deleteCategoryAPI = (id) => api.delete(`inventory/categories/${id}`);

// ============================================
// Items (Catalog)
// ============================================
export const getItemsAPI = (params) => api.get('inventory/items', { params });
export const getItemByIdAPI = (id) => api.get(`inventory/items/${id}`);
export const createItemAPI = (data) => api.post('inventory/items', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateItemAPI = (id, data) => api.put(`inventory/items/${id}`, data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteItemAPI = (id) => api.delete(`inventory/items/${id}`);

// Public Catalog
export const getPublicItemsAPI = (params) => api.get('inventory/items/public', { params });

// Bulk Upload
export const downloadBulkTemplateAPI = () => api.get('inventory/items/bulk/template', { responseType: 'blob' });
export const previewBulkUploadAPI = (data) => api.post('inventory/items/bulk/preview', data, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const commitBulkUploadAPI = (data) => api.post('inventory/items/bulk/commit', data);

// ============================================
// Stock In
// ============================================
export const getStockInHistoryAPI = (params) => api.get('inventory/stock-in', { params });
export const recordStockInAPI = (data) => api.post('inventory/stock-in', data);

// ============================================
// Stock Out (Teacher Issues)
// ============================================
export const requestStockOutAPI = (data) => api.post('inventory/stock-out', data);
export const getMyStockOutItemsAPI = () => api.get('inventory/stock-out/my-items');
export const getMyStockOutRequestsAPI = () => api.get('inventory/stock-out/my-requests');
export const getStockOutsAPI = (params) => api.get('inventory/stock-out', { params });
export const getPendingStockOutsAPI = () => api.get('inventory/stock-out', { params: { status: 'pending' } });
export const approveStockOutAPI = (id, data) => api.patch(`inventory/stock-out/${id}/approve`, data);
export const rejectStockOutAPI = (id, data) => api.patch(`inventory/stock-out/${id}/reject`, data);

// ============================================
// Library Desk (Borrow/Buy)
// ============================================
export const getLendingTransactionsAPI = (params) => api.get('inventory/lending', { params });
export const borrowItemAPI = (data) => api.post('inventory/lending/borrow', data);
export const purchaseItemAPI = (data) => api.post('inventory/lending/purchase', data);
export const returnItemAPI = (id, data) => api.patch(`inventory/lending/${id}/return`, data);
export const renewItemAPI = (id, data) => api.patch(`inventory/lending/${id}/renew`, data);

export const getMyLendingHistoryAPI = () => api.get('inventory/lending/my-history');

// ============================================
// Wishlist
// ============================================
export const getMyWishlistAPI = () => api.get('inventory/wishlist/my-list');
export const addToWishlistAPI = (data) => api.post('inventory/wishlist', data);
export const removeFromWishlistAPI = (itemId) => api.delete(`inventory/wishlist/${itemId}`);

// ============================================
// Security Deposits
// ============================================
export const getDepositsAPI = (params) => api.get('inventory/deposits', { params });
export const getDepositsSummaryAPI = () => api.get('inventory/deposits/summary');
export const getMyDepositsAPI = () => api.get('inventory/deposits/my');
export const refundDepositAPI = (id, data) => api.patch(`inventory/deposits/${id}/refund`, data);
export const forfeitDepositAPI = (id, data) => api.patch(`inventory/deposits/${id}/forfeit`, data);

// ============================================
// Reports & Dashboard
// ============================================
export const getDashboardAPI = () => api.get('inventory/reports/dashboard');
export const getOverdueReportAPI = () => api.get('inventory/reports/overdue');
export const getLowStockReportAPI = () => api.get('inventory/reports/low-stock');
export const getMonthlyExpenseReportAPI = (params) => api.get('inventory/reports/monthly-expense', { params });
