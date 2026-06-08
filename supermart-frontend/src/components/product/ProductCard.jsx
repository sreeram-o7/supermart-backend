import { Link } from 'react-router-dom'
import { ShoppingCart, Star } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem)

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.is_in_stock) return
    addItem(product, 1)
    toast.success(`${product.name} added to cart`)
  }

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.primary_image ? (
          <img
            src={product.primary_image.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
        )}

        {/* Discount badge */}
        {product.discount_percentage > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {product.discount_percentage}% OFF
          </div>
        )}

        {/* Out of stock overlay */}
        {!product.is_in_stock && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
            <span className="text-gray-500 font-medium text-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        {product.brand_name && (
          <span className="text-xs text-gray-400 mb-1">{product.brand_name}</span>
        )}

        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 flex-1">
          {product.name}
        </h3>

        {product.unit && (
          <span className="text-xs text-gray-400 mb-2">{product.unit}</span>
        )}

        {/* Rating */}
        {product.review_count > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-600">
              {parseFloat(product.avg_rating).toFixed(1)} ({product.review_count})
            </span>
          </div>
        )}

        {/* Price + Cart */}
        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="font-bold text-gray-900 text-sm">
              {formatPrice(product.selling_price)}
            </span>
            {product.discount_percentage > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1">
                {formatPrice(product.base_price)}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!product.is_in_stock}
            className="w-8 h-8 bg-primary-500 hover:bg-primary-400 text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={14} />
          </button>
        </div>
      </div>
    </Link>
  )
}