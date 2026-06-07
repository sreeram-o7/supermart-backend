import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import { ROUTES, ROLES } from '../../constants'

export default function GuestRoute({ children }) {
  const { user, accessToken } = useAuthStore()

  if (accessToken && user) {
    if (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) {
      return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />
    }
    if (user.role === ROLES.DELIVERY_PARTNER || user.role === ROLES.DELIVERY_MANAGER) {
      return <Navigate to={ROUTES.DELIVERY_PORTAL} replace />
    }
    return <Navigate to={ROUTES.HOME} replace />
  }

  return children
}