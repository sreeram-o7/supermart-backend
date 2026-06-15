import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle, MapPin, CreditCard, ShoppingBag } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { userApi } from '../../api/auth.api'
import { cartApi, ordersApi } from '../../api/orders.api'
import { formatPrice } from '../../utils/formatters'
import { ROUTES } from '../../constants'
import toast from 'react-hot-toast'

const STEPS = ['Address', 'Payment', 'Review', 'Confirm']

export default function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { couponData, discount = 0 } = location.state || {}

  const [step, setStep] = useState(0)
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(false)
  const [placedOrder, setPlacedOrder] = useState(null)

  const { data: addresses, isLoading: addressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses(),
    select: (res) => res.data.data,
  })

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.getCart(),
    select: (res) => res.data.data,
  })

  const subtotal = parseFloat(cart?.subtotal || 0)
  const discountAmount = couponData
    ? parseFloat(couponData.discount_amount)
    : discount
  const deliveryFee = subtotal >= 500 ? 0 : 40
  const total = subtotal - discountAmount + deliveryFee

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error('Please select a delivery address.')
      return
    }
    setLoading(true)
    try {
      const orderData = {
        address_id: selectedAddress.id,
        payment_method: paymentMethod,
        ...(couponData && { coupon_code: couponData.code }),
      }

      const response = await ordersApi.placeOrder(orderData)
      const order = response.data.data

      const paymentResponse = await ordersApi.initiatePayment(order.id)
      const paymentData = paymentResponse.data.data

      // COD — go straight to confirmation
      if (paymentMethod === 'cod') {
        setPlacedOrder(order)
        setStep(3)
        setLoading(false)
        return
      }

      // Online payment — open Razorpay popup
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'SuperMart',
        description: `Order #${paymentData.order_number}`,
        order_id: paymentData.razorpay_order_id,
        prefill: {
          name: paymentData.user_name,
          email: paymentData.user_email,
        },
        theme: {
          color: '#1e3a5f',
        },
        handler: async (razorpayResponse) => {
          try {
            await ordersApi.confirmPayment({
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: razorpayResponse.razorpay_order_id,
              razorpay_signature: razorpayResponse.razorpay_signature,
            })
            setPlacedOrder(order)
            setStep(3)
          } catch {
            toast.error(
              'Payment verification failed. Please contact support.'
            )
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled.')
            setLoading(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
      setLoading(false)

    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to place order.'
      )
      setLoading(false)
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < step
                    ? 'bg-primary-500 text-white'
                    : i === step
                    ? 'bg-primary-100 text-primary-600 border-2 border-primary-500'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className="hidden sm:block text-sm font-medium">{label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 ${i < step ? 'bg-primary-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — Address */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MapPin size={20} className="text-primary-500" />
              Select Delivery Address
            </h2>

            {addressLoading ? (
              <Spinner />
            ) : addresses?.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-gray-500 mb-4">
                  No saved addresses. Please add one.
                </p>
                <button
                  onClick={() => navigate(ROUTES.PROFILE)}
                  className="btn-primary"
                >
                  Add Address
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses?.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => setSelectedAddress(address)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      selectedAddress?.id === address.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {address.label}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {address.full_name} · {address.phone}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`},
                          {' '}{address.city}, {address.state} - {address.pin_code}
                        </p>
                      </div>
                      {address.is_default && (
                        <span className="badge badge-info text-xs">Default</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              disabled={!selectedAddress}
              onClick={() => setStep(1)}
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step 1 — Payment */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={20} className="text-primary-500" />
              Payment Method
            </h2>

            <div className="space-y-3">
              {[
                {
                  value: 'cod',
                  label: 'Cash on Delivery',
                  desc: 'Pay when your order arrives',
                  badge: null,
                },
                {
                  value: 'upi',
                  label: 'UPI',
                  desc: 'Pay using any UPI app — Google Pay, PhonePe, Paytm',
                  badge: 'Recommended',
                },
                {
                  value: 'card',
                  label: 'Credit / Debit Card',
                  desc: 'Visa, Mastercard, RuPay',
                  badge: null,
                },
                {
                  value: 'netbanking',
                  label: 'Net Banking',
                  desc: 'All major banks supported',
                  badge: null,
                },
              ].map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                    paymentMethod === method.value
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{method.desc}</p>
                    </div>
                    {method.badge && (
                      <span className="badge badge-success text-xs">
                        {method.badge}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {paymentMethod !== 'cod' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                You will be redirected to Razorpay's secure payment page to complete your payment.
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep(0)}>
                Back
              </Button>
              <Button fullWidth onClick={() => setStep(2)}>
                Review Order
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Review */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag size={20} className="text-primary-500" />
              Review Order
            </h2>

            {/* Address summary */}
            <div className="card">
              <h3 className="font-medium text-gray-900 mb-2">Delivering to</h3>
              <p className="text-sm text-gray-600">{selectedAddress?.full_name}</p>
              <p className="text-sm text-gray-500">
                {selectedAddress?.address_line1}, {selectedAddress?.city} -{' '}
                {selectedAddress?.pin_code}
              </p>
            </div>

            {/* Cart items */}
            {cart?.items?.length > 0 && (
              <div className="card">
                <h3 className="font-medium text-gray-900 mb-3">
                  Items ({cart.total_items})
                </h3>
                <div className="space-y-2">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(item.line_total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price summary */}
            <div className="card space-y-2">
              <h3 className="font-medium text-gray-900 mb-3">Price Details</h3>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({couponData?.code})</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery</span>
                <span>
                  {deliveryFee === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    formatPrice(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-gray-400 capitalize">
                Payment: {paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                fullWidth
                size="lg"
                loading={loading}
                onClick={handlePlaceOrder}
              >
                {paymentMethod === 'cod' ? 'Place Order' : 'Pay Now'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && placedOrder && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {paymentMethod === 'cod' ? 'Order Placed!' : 'Payment Successful!'}
            </h2>
            <p className="text-gray-500 mb-1">
              Your order has been placed successfully.
            </p>
            <p className="font-semibold text-primary-600 mb-6">
              Order #{placedOrder.order_number}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={() => navigate(`/orders/${placedOrder.order_number}`)}
              >
                Track Order
              </Button>
              <Button onClick={() => navigate(ROUTES.PRODUCTS)}>
                Continue Shopping
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}