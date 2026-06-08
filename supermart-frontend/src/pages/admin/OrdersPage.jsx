import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import Spinner from '../../components/ui/Spinner'
import { adminApi } from '../../api/admin.api'
import { formatPrice, formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_CHOICES = [
  'pending', 'confirmed', 'packed',
  'dispatched', 'out_for_delivery', 'delivered',
  'cancelled', 'returned',
]

const STATUS_COLORS = {
  pending:          'badge-warning',
  confirmed:        'badge-info',
  packed:           'badge-info',
  dispatched:       'badge-info',
  out_for_delivery: 'badge-info',
  delivered:        'badge-success',
  cancelled:        'badge-danger',
  returned:         'badge-gray',
}

export default function OrdersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingOrder, setUpdatingOrder] = useState(null)

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => adminApi.getOrders(statusFilter ? { status: statusFilter } : {}),
    select: (res) => res.data.data,
  })

  const handleStatusUpdate = async (orderNumber, newStatus) => {
    setUpdatingOrder(orderNumber)
    try {
      await adminApi.updateOrderStatus(orderNumber, newStatus)
      queryClient.invalidateQueries(['admin-orders'])
      toast.success(`Order status updated to ${newStatus}.`)
    } catch {
      toast.error('Failed to update order status.')
    } finally {
      setUpdatingOrder(null)
    }
  }

  return (
    <AdminLayout title="Orders" subtitle="Manage all customer orders">

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field text-sm max-w-xs"
        >
          <option value="">All Statuses</option>
          {STATUS_CHOICES.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {orders?.length || 0} orders
        </span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Order</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Date</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 font-mono">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{order.item_count} items</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={order.status}
                        disabled={updatingOrder === order.order_number}
                        onChange={(e) => handleStatusUpdate(order.order_number, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-300"
                      >
                        {STATUS_CHOICES.map(s => (
                          <option key={s} value={s}>{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}