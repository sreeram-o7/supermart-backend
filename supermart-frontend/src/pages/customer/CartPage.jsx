import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, ArrowLeft } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import CartItem from '../../components/cart/CartItem'
import CartSummary from '../../components/cart/CartSummary'
import Spinner from '../../components/ui/Spinner'
import { cartApi } from '../../api/orders.api'
import { ROUTES } from '../../constants'
import { Link } from 'react-router-dom'

export default function CartPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
    select: (res) => res.data.data,
  })

  const handleProceed = ({ couponData, total, discount }) => {
    navigate(ROUTES.CHECKOUT, {
      state: { couponData, total, discount },
    })
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-96">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    )
  }

  const cart = data
  const isEmpty = !cart?.items?.length

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Shopping Cart
          </h1>
          {!isEmpty && (
            <span className="badge badge-info">{cart.total_items} items</span>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-20">
            <ShoppingCart size={64} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 mb-6">
              Add some products to get started
            </p>
            <Link to={ROUTES.PRODUCTS} className="btn-primary px-8 py-3">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2">
              <div className="card">
                {cart.items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <CartSummary cart={cart} onProceed={handleProceed} />
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}