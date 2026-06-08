import apiClient from './client'

export const catalogApi = {
  getCategories: () =>
    apiClient.get('/categories/'),

  getCategoryBySlug: (slug) =>
    apiClient.get(`/categories/${slug}/`),

  getProducts: (params = {}) =>
    apiClient.get('/products/', { params }),

  getProductBySlug: (slug) =>
    apiClient.get(`/products/${slug}/`),

  getFeaturedProducts: () =>
    apiClient.get('/products/featured/'),

  searchProducts: (query) =>
    apiClient.get('/products/search/', { params: { q: query } }),

  getProductByBarcode: (barcode) =>
    apiClient.get(`/products/barcode/${barcode}/`),
}