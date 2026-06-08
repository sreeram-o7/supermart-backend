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
import DashboardPage from './pages/admin/DashboardPage'
import DeliveryDashboardPage from './pages/delivery/DeliveryDashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.HOME} element={<HomePage />} />
        <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Guest-only routes */}
        <Route path={ROUTES.LOGIN} element={
          <GuestRoute><LoginPage /></GuestRoute>
        } />
        <Route path={ROUTES.REGISTER} element={
          <GuestRoute><RegisterPage /></GuestRoute>
        } />

        {/* Customer routes */}
        <Route path={ROUTES.PROFILE} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <div className="p-8 text-center text-gray-500">Profile page — Sprint 4</div>
          </ProtectedRoute>
        } />
        <Route path={ROUTES.CART} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <div className="p-8 text-center text-gray-500">Cart page — Sprint 3</div>
          </ProtectedRoute>
        } />
        <Route path={ROUTES.ORDERS} element={
          <ProtectedRoute allowedRoles={[ROLES.CUSTOMER]}>
            <div className="p-8 text-center text-gray-500">Orders page — Sprint 3</div>
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path={`${ROUTES.ADMIN_DASHBOARD}/*`} element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* Delivery routes */}
        <Route path={`${ROUTES.DELIVERY_PORTAL}/*`} element={
          <ProtectedRoute allowedRoles={[ROLES.DELIVERY_PARTNER, ROLES.DELIVERY_MANAGER]}>
            <DeliveryDashboardPage />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
      </Routes>
    </BrowserRouter>
  )
}