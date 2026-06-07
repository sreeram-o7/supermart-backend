import apiClient from './client'

export const authApi = {
  register: (data) =>
    apiClient.post('/auth/register/', data),

  login: (data) =>
    apiClient.post('/auth/login/', data),

  logout: (refreshToken) =>
    apiClient.post('/auth/logout/', { refresh: refreshToken }),

  refreshToken: (refresh) =>
    apiClient.post('/auth/token/refresh/', { refresh }),

  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password/', { email }),

  resetPassword: (data) =>
    apiClient.post('/auth/reset-password/', data),

  verifyEmail: (token) =>
    apiClient.post('/auth/verify-email/', { token }),

  getMe: () =>
    apiClient.get('/auth/me/'),
}

export const userApi = {
  updateProfile: (data) =>
    apiClient.patch('/users/profile/', data),

  changePassword: (data) =>
    apiClient.post('/users/change-password/', data),

  getAddresses: () =>
    apiClient.get('/users/addresses/'),

  addAddress: (data) =>
    apiClient.post('/users/addresses/', data),

  updateAddress: (id, data) =>
    apiClient.patch(`/users/addresses/${id}/`, data),

  deleteAddress: (id) =>
    apiClient.delete(`/users/addresses/${id}/`),

  setDefaultAddress: (id) =>
    apiClient.post(`/users/addresses/${id}/set-default/`),
}