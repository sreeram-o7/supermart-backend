import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import { ROUTES, ROLES } from '../constants'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()

  const loginAndRedirect = async (email, password) => {
    const result = await store.login(email, password)
    if (result.success) {
      const role = result.user?.role
      if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
        navigate(ROUTES.ADMIN_DASHBOARD)
      } else if (role === ROLES.DELIVERY_PARTNER || role === ROLES.DELIVERY_MANAGER) {
        navigate(ROUTES.DELIVERY_PORTAL)
      } else {
        navigate(ROUTES.HOME)
      }
    }
    return result
  }

  const logoutAndRedirect = async () => {
    await store.logout()
    navigate(ROUTES.LOGIN)
  }

  return {
    user:               store.user,
    isLoading:          store.isLoading,
    error:              store.error,
    isAuthenticated:    store.isAuthenticated(),
    isAdmin:            store.isAdmin(),
    isDeliveryPartner:  store.isDeliveryPartner(),
    isDeliveryManager:  store.isDeliveryManager(),
    login:              loginAndRedirect,
    logout:             logoutAndRedirect,
    register:           store.register,
    clearError:         store.clearError,
  }
}