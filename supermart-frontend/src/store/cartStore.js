import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      discountAmount: 0,

      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items
        const existingIndex = items.findIndex(
          (item) => item.product.id === product.id &&
                    item.variant?.id === variant?.id
        )
        if (existingIndex >= 0) {
          const updated = [...items]
          updated[existingIndex].quantity += quantity
          set({ items: updated })
        } else {
          set({
            items: [...items, {
              id: `${product.id}-${variant?.id || 'base'}`,
              product,
              variant,
              quantity,
              unit_price: variant?.selling_price || product.selling_price,
            }],
          })
        }
      },

      removeItem: (itemId) =>
        set({ items: get().items.filter((i) => i.id !== itemId) }),

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        })
      },

      clearCart: () => set({ items: [], couponCode: null, discountAmount: 0 }),

      applyCoupon: (code, discount) =>
        set({ couponCode: code, discountAmount: discount }),

      removeCoupon: () =>
        set({ couponCode: null, discountAmount: 0 }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity, 0
        ),

      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const discount = get().discountAmount
        return Math.max(0, subtotal - discount)
      },
    }),
    {
      name: 'supermart-cart',
    }
  )
)

export default useCartStore