import apiClient from './client'

export const deliveryApi = {
  // Delivery partner
  getProfile: () =>
    apiClient.get('/delivery/profile/'),

  updateProfile: (data) =>
    apiClient.patch('/delivery/profile/', data),

  getMyAssignments: () =>
    apiClient.get('/delivery/assignments/'),

  updateStatus: (assignmentId, status, notes = '', failureReason = '') =>
    apiClient.patch(`/delivery/assignments/${assignmentId}/status/`, {
      status,
      notes,
      ...(failureReason && { failure_reason: failureReason }),
    }),

  confirmDelivery: (assignmentId, otp) =>
    apiClient.post(`/delivery/assignments/${assignmentId}/confirm/`, { otp }),

  // Manager
  getManagerAssignments: (status = '') =>
    apiClient.get('/delivery/manager/assignments/', {
      params: status ? { status } : {},
    }),

  assignDelivery: (orderId, partnerId) =>
    apiClient.post('/delivery/manager/assign/', {
      order_id: orderId,
      partner_id: partnerId,
    }),

  getPartners: () =>
    apiClient.get('/delivery/manager/partners/'),
}