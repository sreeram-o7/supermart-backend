import { Trash2, Plus, Minus } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import { cartApi } from '../../api/orders.api'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function CartItem({ item }) {
  const queryClient = useQueryClient()

  const updateQuantity = async (newQty) => {
    try {
      await cartApi.updateItem(item.id, newQty)
      queryClient.invalidateQueries(['cart'])
    } catch {
      toast.error('Failed to update cart.')
    }
  }

  const removeItem = async () => {
    try {
      await cartApi.removeItem(item.id)
      queryClient.invalidateQueries(['cart'])
      toast.success('Item removed from cart.')
    } catch {
      toast.error('Failed to remove item.')
    }
  }

  return (
    <div className="flex gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* Image */}
      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
        {item.product.primary_image ? (
          <img
            src={item.product.primary_image.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-2xl">🛒</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {item.product.name}
        </h4>
        {item.variant && (
          <p className="text-xs text-gray-400 mt-0.5">{item.variant.variant_name}</p>
        )}
        <p className="text-xs text-gray-400 mt-0.5">{item.product.unit}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity controls */}
          <div className="flex items-center border border-gray-200 rounded-lg">
            <button
              onClick={() => updateQuantity(item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-l-lg transition-colors"
            >
              <Minus size={12} />
            </button>
            <span className="w-8 text-center text-sm font-medium text-gray-900">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.quantity + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-r-lg transition-colors"
            >
              <Plus size={12} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900">
              {formatPrice(item.line_total)}
            </span>
            <button
              onClick={removeItem}
              className="text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}