import apiClient from './client'

export const adminApi = {
  // Analytics
  getSummary: () =>
    apiClient.get('/admin/analytics/summary/'),

  getSalesChart: (period = 'daily') =>
    apiClient.get('/admin/analytics/sales-chart/', { params: { period } }),

  getTopProducts: () =>
    apiClient.get('/admin/analytics/top-products/'),

  // Products
  getProducts: (params = {}) =>
    apiClient.get('/admin/products/', { params }),

  createProduct: (data) =>
    apiClient.post('/admin/products/', data),

  updateProduct: (id, data) =>
    apiClient.patch(`/admin/products/${id}/`, data),

  deleteProduct: (id) =>
    apiClient.delete(`/admin/products/${id}/`),

  // Orders
  getOrders: (params = {}) =>
    apiClient.get('/admin/orders/', { params }),

  getOrderDetail: (orderNumber) =>
    apiClient.get(`/admin/orders/${orderNumber}/`),

  updateOrderStatus: (orderNumber, status, notes = '') =>
    apiClient.patch(`/admin/orders/${orderNumber}/status/`, { status, notes }),

  // Users
  getUsers: (params = {}) =>
    apiClient.get('/admin/users/', { params }),

  updateUser: (id, data) =>
    apiClient.patch(`/admin/users/${id}/`, data),

  // Coupons
  getCoupons: () =>
    apiClient.get('/admin/coupons/'),

  createCoupon: (data) =>
    apiClient.post('/admin/coupons/', data),

  updateCoupon: (id, data) =>
    apiClient.patch(`/admin/coupons/${id}/`, data),

  deleteCoupon: (id) =>
    apiClient.delete(`/admin/coupons/${id}/`),

  // Inventory
  getInventory: (productId) =>
    apiClient.get(`/admin/inventory/${productId}/`),

  restockProduct: (productId, quantity, notes = '') =>
    apiClient.post(`/admin/inventory/${productId}/restock/`, { quantity, notes }),

  getLowStock: () =>
    apiClient.get('/admin/inventory/low-stock/'),
}