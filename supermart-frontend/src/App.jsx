import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES, ROLES } from './constants'

import ProtectedRoute from './components/auth/ProtectedRoute'
import GuestRoute from './components/auth/GuestRoute'

import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import HomePage from './pages/customer/HomePage'
import ProductsPage from './pages/customer/ProductsPage'
import ProductDetailPage from './pages/customer/ProductDetailPage'
import SearchPage from './pages/customer/SearchPage'
import CartPage from './pages/customer/CartPage'
import CheckoutPage from './pages/customer/CheckoutPage'
import OrdersPage from './pages/customer/OrdersPage'
import OrderDetailPage from './pages/customer/OrderDetailPage'
import DashboardPage from './pages/admin/DashboardPage'
import AdminProductsPage from './pages/admin/ProductsPage'
import AdminOrdersPage from './pages/admin/OrdersPage'
import AdminUsersPage from './pages/admin/UsersPage'
import AdminCouponsPage from './pages/admin/CouponsPage'
import AdminInventoryPage from './pages/admin/InventoryPage'
import DeliveryDashboardPage from './pages/delivery/DeliveryDashboardPage'
import AssignmentsPage from './pages/delivery/AssignmentsPage'
import ManagerPage from './pages/delivery/ManagerPage'
import ProfilePage from './pages/customer/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPER_ADMIN]
const DELIVERY_ROLES = [ROLES.DELIVERY_PARTNER, ROLES.DELIVERY_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/orders/:orderNumber/track" element={<OrderDetailPage />} />

        {/* Guest only */}
        <Route path={ROUTES.LOGIN} element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path={ROUTES.REGISTER} element={<GuestRoute><RegisterPage /></GuestRoute>} />

        {/* Customer */}
        <Route path={ROUTES.CART} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}><CartPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.CHECKOUT} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}><CheckoutPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.ORDERS} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}><OrdersPage /></ProtectedRoute>
        } />
        <Route path="/orders/:orderNumber" element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}><OrderDetailPage /></ProtectedRoute>
        } />
        <Route path={ROUTES.PROFILE} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <ProfilePage />
          </ProtectedRoute>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminProductsPage /></ProtectedRoute>
        } />
        <Route path="/admin/orders" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminOrdersPage /></ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminUsersPage /></ProtectedRoute>
        } />
        <Route path="/admin/coupons" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminCouponsPage /></ProtectedRoute>
        } />
        <Route path="/admin/inventory" element={
          <ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminInventoryPage /></ProtectedRoute>
        } />

        {/* Delivery */}
        <Route path="/delivery" element={
          <ProtectedRoute allowedRoles={DELIVERY_ROLES}>
            <DeliveryDashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/delivery/assignments" element={
          <ProtectedRoute allowedRoles={DELIVERY_ROLES}>
            <AssignmentsPage />
          </ProtectedRoute>
        } />
        <Route path="/delivery/manager" element={
          <ProtectedRoute allowedRoles={[ROLES.DELIVERY_MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <ManagerPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}