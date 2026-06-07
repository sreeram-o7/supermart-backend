import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../../store/authStore'
import Spinner from '../ui/Spinner'
import { ROUTES } from '../../constants'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, accessToken } = useAuthStore()
  const location = useLocation()

  if (!accessToken || !user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return children
}