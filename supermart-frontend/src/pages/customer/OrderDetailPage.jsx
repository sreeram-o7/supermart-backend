import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import OrderTimeline from '../../components/order/OrderTimeline'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { ordersApi } from '../../api/orders.api'
import { formatPrice, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'

export default function OrderDetailPage() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['order', orderNumber],
    queryFn: () => ordersApi.getOrderDetail(orderNumber),
    select: (res) => res.data.data,
  })

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return
    try {
      await ordersApi.cancelOrder(orderNumber, 'Cancelled by customer')
      queryClient.invalidateQueries(['order', orderNumber])
      queryClient.invalidateQueries(['orders'])
      toast.success('Order cancelled successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot cancel this order.')
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center min-h-96 items-center">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    )
  }

  if (!data) {
    return (
      <PageWrapper>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">Order not found.</p>
        </div>
      </PageWrapper>
    )
  }

  const order = data
  const canCancel = ['pending', 'confirmed'].includes(order.status)

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              Order #{order.order_number}
            </h1>
            <p className="text-sm text-gray-400">{formatDateTime(order.created_at)}</p>
          </div>
          {canCancel && (
            <Button variant="danger" size="sm" onClick={handleCancel}>
              Cancel Order
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Timeline */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
            <OrderTimeline order={order} />
          </div>

          {/* Items */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">
              Items ({order.items?.length})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(item.line_total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="card space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Price Details</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {parseFloat(order.discount_amount) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            {parseFloat(order.tax_amount) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(order.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery</span>
              <span>{parseFloat(order.delivery_fee) === 0 ? 'FREE' : formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Delivery address */}
          {order.delivery_address && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
              <p className="text-sm font-medium text-gray-800">
                {order.delivery_address.full_name}
              </p>
              <p className="text-sm text-gray-500">
                {order.delivery_address.address_line1},
                {order.delivery_address.address_line2 && ` ${order.delivery_address.address_line2},`}
                {' '}{order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pin_code}
              </p>
              <p className="text-sm text-gray-500">{order.delivery_address.phone}</p>
            </div>
          )}

          {/* Payment */}
          {order.payment && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900 uppercase">
                  {order.payment_method}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Status</span>
                <span className={`font-medium ${
                  order.payment.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.payment.status.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  )
}