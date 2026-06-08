import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import OrderCard from '../../components/order/OrderCard'
import Spinner from '../../components/ui/Spinner'
import { ordersApi } from '../../api/orders.api'

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.getOrders(),
    select: (res) => res.data.data,
  })

  return (
    <PageWrapper>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : !data?.length ? (
          <div className="text-center py-20">
            <Package size={64} className="text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-500">Your order history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}