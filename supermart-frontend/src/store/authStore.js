import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/auth.api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      accessToken:  null,
      refreshToken: null,
      isLoading:    false,
      error:        null,

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        set({ accessToken, refreshToken })
      },

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login({ email, password })
          const { access, refresh, user } = response.data.data
          localStorage.setItem('access_token', access)
          localStorage.setItem('refresh_token', refresh)
          set({
            accessToken: access,
            refreshToken: refresh,
            user,
            isLoading: false,
            error: null,
          })
          return { success: true, user }
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed.'
          set({ isLoading: false, error: message })
          return { success: false, error: message }
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(data)
          set({ isLoading: false, error: null })
          return { success: true, data: response.data }
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed.'
          const errors = error.response?.data?.errors || {}
          set({ isLoading: false, error: message })
          return { success: false, error: message, errors }
        }
      },

      logout: async () => {
        const { refreshToken } = get()
        try {
          if (refreshToken) {
            await authApi.logout(refreshToken)
          }
        } catch {
          // Proceed with local logout even if API call fails
        } finally {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            error: null,
          })
        }
      },

      clearError: () => set({ error: null }),

      isAuthenticated: () => !!get().accessToken && !!get().user,

      isAdmin: () => {
        const role = get().user?.role
        return role === 'admin' || role === 'super_admin'
      },

      isDeliveryPartner: () => get().user?.role === 'delivery_partner',

      isDeliveryManager: () => {
        const role = get().user?.role
        return role === 'delivery_manager' || role === 'admin' || role === 'super_admin'
      },
    }),
    {
      name: 'supermart-auth',
      partialize: (state) => ({
        user:         state.user,
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)

export default useAuthStore