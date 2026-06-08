import { NavLink, useNavigate } from 'react-router-dom'
import { Package, List, Users, LogOut } from 'lucide-react'
import useAuthStore from '../../store/authStore'

export default function DeliveryLayout({ children, title }) {
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()

  const isManager = user?.role === 'delivery_manager' ||
                    user?.role === 'admin' ||
                    user?.role === 'super_admin'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SM</span>
            </div>
            <div>
              <p className="text-white font-bold">SuperMart</p>
              <p className="text-gray-400 text-xs">
                {isManager ? 'Delivery Manager' : 'Delivery Partner'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/delivery"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Package size={18} />
            Dashboard
          </NavLink>

          <NavLink
            to="/delivery/assignments"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <List size={18} />
            {isManager ? 'All Assignments' : 'My Deliveries'}
          </NavLink>

          {isManager && (
            <NavLink
              to="/delivery/manager"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Users size={18} />
              Assign Delivery
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="px-4 py-2 mb-2">
            <p className="text-white text-sm font-medium truncate">
              {user?.full_name || user?.email}
            </p>
            <p className="text-gray-400 text-xs">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        {title && (
          <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
        )}
        {children}
      </main>
    </div>
  )
}