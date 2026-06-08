import { useState } from 'react'
import { Tag, X } from 'lucide-react'
import { formatPrice } from '../../utils/formatters'
import { cartApi } from '../../api/orders.api'
import toast from 'react-hot-toast'

export default function CartSummary({ cart, onProceed, showCheckoutButton = true }) {
  const [couponCode, setCouponCode] = useState('')
  const [couponData, setCouponData] = useState(null)
  const [couponLoading, setCouponLoading] = useState(false)

  const subtotal = parseFloat(cart?.subtotal || 0)
  const discount = couponData ? parseFloat(couponData.discount_amount) : 0
  const deliveryFee = subtotal >= 500 ? 0 : 40
  const total = subtotal - discount + deliveryFee

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const response = await cartApi.validateCoupon(couponCode, subtotal)
      setCouponData(response.data.data)
      toast.success('Coupon applied!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid coupon.')
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponData(null)
    setCouponCode('')
  }

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-gray-900">Order Summary</h3>

      {/* Coupon */}
      {!couponData ? (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              className="input-field pl-8 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
            />
          </div>
          <button
            onClick={applyCoupon}
            disabled={couponLoading || !couponCode}
            className="btn-secondary text-sm px-3 disabled:opacity-50"
          >
            {couponLoading ? '...' : 'Apply'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <div>
            <span className="text-sm font-medium text-green-700">{couponData.code}</span>
            <span className="text-xs text-green-600 ml-2">
              -{formatPrice(couponData.discount_amount)} off
            </span>
          </div>
          <button onClick={removeCoupon} className="text-green-600 hover:text-green-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({cart?.total_items || 0} items)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Delivery fee</span>
          <span>{deliveryFee === 0 ? (
            <span className="text-green-600">FREE</span>
          ) : formatPrice(deliveryFee)}</span>
        </div>
        {subtotal > 0 && subtotal < 500 && (
          <p className="text-xs text-gray-400">
            Add {formatPrice(500 - subtotal)} more for free delivery
          </p>
        )}
        <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {showCheckoutButton && (
        <button
          onClick={() => onProceed && onProceed({ couponData, total, discount })}
          disabled={!cart?.items?.length}
          className="btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          Proceed to Checkout
        </button>
      )}
    </div>
  )
}