import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, User, LogOut, LayoutDashboard, Package } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useCartStore from '../../store/cartStore'
import { ROUTES, ROLES } from '../../constants'
import { getInitials } from '../../utils/formatters'

export default function Navbar() {
  const { user, accessToken } = useAuthStore()
  const logout = useAuthStore((s) => s.logout)
  const itemCount = useCartStore((s) => s.getItemCount())
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <span className="font-bold text-xl text-primary-500">SuperMart</span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <input
              type="text"
              placeholder="Search products..."
              className="w-full input-field text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/search?q=${e.target.value}`)
                }
              }}
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* Cart */}
            <Link
              to={ROUTES.CART}
              className="relative p-2 text-gray-600 hover:text-primary-500 transition-colors"
            >
              <ShoppingCart size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {accessToken && user ? (
              <div className="flex items-center gap-2">

                {/* Admin link */}
                {(user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) && (
                  <Link
                    to={ROUTES.ADMIN_DASHBOARD}
                    className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    Admin
                  </Link>
                )}

                {/* Delivery link */}
                {(user.role === ROLES.DELIVERY_PARTNER || user.role === ROLES.DELIVERY_MANAGER) && (
                  <Link
                    to={ROUTES.DELIVERY_PORTAL}
                    className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    <Package size={16} />
                    Deliveries
                  </Link>
                )}

                {/* Avatar */}
                <Link
                  to={ROUTES.PROFILE}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-primary-500 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-xs">
                      {getInitials(user.full_name || user.email)}
                    </span>
                  </div>
                  <span className="hidden md:block font-medium">
                    {user.full_name || user.email}
                  </span>
                </Link>

                {/* Orders link */}
                <Link
                  to={ROUTES.ORDERS}
                  className="hidden md:flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500 transition-colors"
                >
                  <Package size={16} />
                  Orders
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to={ROUTES.LOGIN} className="btn-secondary text-sm py-1.5">
                  Login
                </Link>
                <Link to={ROUTES.REGISTER} className="btn-primary text-sm py-1.5">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}