import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Users,
  Tag, Warehouse, LogOut, ChevronRight,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/admin',           label: 'Dashboard',  icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/products',  label: 'Products',   icon: <Package size={18} /> },
  { to: '/admin/orders',    label: 'Orders',     icon: <ShoppingBag size={18} /> },
  { to: '/admin/users',     label: 'Users',      icon: <Users size={18} /> },
  { to: '/admin/coupons',   label: 'Coupons',    icon: <Tag size={18} /> },
  { to: '/admin/inventory', label: 'Inventory',  icon: <Warehouse size={18} /> },
]

export default function AdminSidebar() {
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-primary-500 min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-400">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary-500 font-bold text-sm">SM</span>
          </div>
          <div>
            <p className="text-white font-bold">SuperMart</p>
            <p className="text-primary-200 text-xs">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-primary-600'
                  : 'text-primary-100 hover:bg-primary-400 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-primary-400">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-primary-100 hover:bg-primary-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}