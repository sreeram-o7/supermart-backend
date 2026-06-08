import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, ArrowLeft, Star, Package, Tag } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { catalogApi } from '../../api/catalog.api'
import { formatPrice } from '../../utils/formatters'
import useCartStore from '../../store/cartStore'
import toast from 'react-hot-toast'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const addItem = useCartStore((s) => s.addItem)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogApi.getProductBySlug(slug),
    select: (res) => res.data.data,
  })

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-96">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    )
  }

  if (isError || !data) {
    return (
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">Product not found.</p>
          <button onClick={() => navigate('/products')} className="btn-primary mt-4">
            Browse Products
          </button>
        </div>
      </PageWrapper>
    )
  }

  const product = data
  const price = selectedVariant?.selling_price || product.selling_price
  const basePrice = selectedVariant?.base_price || product.base_price

  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant)
    toast.success(`${product.name} added to cart!`)
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">

          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[activeImage]?.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl">🛒</span>
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === i ? 'border-primary-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-5">

            {/* Category breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Tag size={14} />
              <span>{product.category?.name}</span>
            </div>

            {product.brand_name && (
              <p className="text-sm text-primary-500 font-medium">{product.brand_name}</p>
            )}

            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={star <= Math.round(product.avg_rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200 fill-gray-200'
                      }
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">
                  {parseFloat(product.avg_rating).toFixed(1)} ({product.review_count} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(price)}
              </span>
              {product.discount_percentage > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    {formatPrice(basePrice)}
                  </span>
                  <span className="badge badge-danger">
                    {product.discount_percentage}% OFF
                  </span>
                </>
              )}
            </div>

            {product.unit && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <Package size={14} />
                {product.unit}
              </p>
            )}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Select Size:</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.is_active || variant.stock_quantity === 0}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                        ${selectedVariant?.id === variant.id
                          ? 'border-primary-500 bg-primary-50 text-primary-600'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }
                        disabled:opacity-40 disabled:cursor-not-allowed
                      `}
                    >
                      {variant.variant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock status */}
            <div className={`inline-flex items-center gap-1.5 text-sm font-medium ${
              product.is_in_stock ? 'text-green-600' : 'text-red-500'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                product.is_in_stock ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
            </div>

            {/* Quantity + Add to cart */}
            {product.is_in_stock && (
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-l-lg"
                  >
                    −
                  </button>
                  <span className="w-12 text-center font-medium text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors rounded-r-lg"
                  >
                    +
                  </button>
                </div>

                <Button
                  onClick={handleAddToCart}
                  size="lg"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </Button>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t pt-5">
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge badge-gray">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}