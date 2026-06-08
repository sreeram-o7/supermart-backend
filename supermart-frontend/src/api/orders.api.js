import apiClient from './client'

export const cartApi = {
  getCart: () =>
    apiClient.get('/cart/'),

  addItem: (productId, quantity = 1, variantId = null) =>
    apiClient.post('/cart/items/', {
      product_id: productId,
      quantity,
      ...(variantId && { variant_id: variantId }),
    }),

  updateItem: (itemId, quantity) =>
    apiClient.patch(`/cart/items/${itemId}/`, { quantity }),

  removeItem: (itemId) =>
    apiClient.delete(`/cart/items/${itemId}/`),

  clearCart: () =>
    apiClient.delete('/cart/'),

  mergeCart: (sessionKey) =>
    apiClient.post('/cart/merge/', { session_key: sessionKey }),

  validateCoupon: (code, subtotal) =>
    apiClient.post('/discounts/validate-coupon/', { code, subtotal }),
}

export const ordersApi = {
  placeOrder: (data) =>
    apiClient.post('/orders/', data),

  getOrders: () =>
    apiClient.get('/orders/list/'),

  getOrderDetail: (orderNumber) =>
    apiClient.get(`/orders/${orderNumber}/`),

  trackOrder: (orderNumber) =>
    apiClient.get(`/orders/${orderNumber}/track/`),

  cancelOrder: (orderNumber, reason = '') =>
    apiClient.post(`/orders/${orderNumber}/cancel/`, { reason }),

  initiatePayment: (orderId) =>
    apiClient.post('/payments/initiate/', { order_id: orderId }),
}