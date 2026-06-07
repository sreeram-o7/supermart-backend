export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

export const ROLES = {
  CUSTOMER:         'customer',
  DELIVERY_PARTNER: 'delivery_partner',
  DELIVERY_MANAGER: 'delivery_manager',
  ADMIN:            'admin',
  SUPER_ADMIN:      'super_admin',
}

export const ROUTES = {
  HOME:             '/',
  LOGIN:            '/login',
  REGISTER:         '/register',
  FORGOT_PASSWORD:  '/forgot-password',
  RESET_PASSWORD:   '/reset-password',
  VERIFY_EMAIL:     '/verify-email',
  PROFILE:          '/profile',
  ORDERS:           '/orders',
  CART:             '/cart',
  CHECKOUT:         '/checkout',
  PRODUCTS:         '/products',
  ADMIN_DASHBOARD:  '/admin',
  DELIVERY_PORTAL:  '/delivery',
}

export const ORDER_STATUS = {
  PENDING:          'pending',
  CONFIRMED:        'confirmed',
  PACKED:           'packed',
  DISPATCHED:       'dispatched',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED:        'delivered',
  CANCELLED:        'cancelled',
  RETURNED:         'returned',
}

export const ORDER_STATUS_LABELS = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  packed:           'Packed',
  dispatched:       'Dispatched',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
  cancelled:        'Cancelled',
  returned:         'Returned',
}

export const PAYMENT_METHODS = {
  COD:        'cod',
  UPI:        'upi',
  CARD:       'card',
  NETBANKING: 'netbanking',
  WALLET:     'wallet',
}