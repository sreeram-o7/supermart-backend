import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { UserCheck } from 'lucide-react'
import DeliveryLayout from '../../components/delivery/DeliveryLayout'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { deliveryApi } from '../../api/delivery.api'
import { adminApi } from '../../api/admin.api'
import toast from 'react-hot-toast'

export default function ManagerPage() {
  const queryClient = useQueryClient()
  const [selectedOrder, setSelectedOrder] = useState('')
  const [selectedPartner, setSelectedPartner] = useState('')
  const [assigning, setAssigning] = useState(false)

  const { data: partners } = useQuery({
    queryKey: ['delivery-partners'],
    queryFn: () => deliveryApi.getPartners(),
    select: (res) => res.data.data,
  })

  const { data: orders } = useQuery({
    queryKey: ['admin-orders', 'confirmed'],
    queryFn: () => adminApi.getOrders({ status: 'confirmed' }),
    select: (res) => res.data.data,
  })

  const handleAssign = async () => {
    if (!selectedOrder || !selectedPartner) {
      toast.error('Select both an order and a delivery partner.')
      return
    }
    setAssigning(true)
    try {
      await deliveryApi.assignDelivery(selectedOrder, selectedPartner)
      queryClient.invalidateQueries(['admin-orders'])
      queryClient.invalidateQueries(['delivery-partners'])
      toast.success('Delivery assigned successfully!')
      setSelectedOrder('')
      setSelectedPartner('')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign delivery.')
    } finally {
      setAssigning(false)
    }
  }

  return (
    <DeliveryLayout title="Assign Delivery">
      <div className="max-w-2xl space-y-6">

        {/* Assign form */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck size={18} className="text-primary-500" />
            Assign Order to Partner
          </h3>

          {/* Order select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Order (Confirmed orders only)
            </label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Choose an order...</option>
              {orders?.filter(o => !o.has_assignment)?.map(order => (
                <option key={order.id} value={order.id}>
                  {order.order_number} — ₹{order.total_amount}
                </option>
              ))}
            </select>
            {orders?.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No confirmed orders available for assignment.
              </p>
            )}
          </div>

          {/* Partner select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Delivery Partner
            </label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="input-field text-sm"
            >
              <option value="">Choose a partner...</option>
              {partners?.map(partner => (
                <option
                  key={partner.id}
                  value={partner.id}
                  disabled={!partner.is_accepting}
                >
                  {partner.user?.profile?.first_name || partner.user?.email}
                  {' — '}
                  {partner.current_load}/{partner.max_load} deliveries
                  {!partner.is_accepting ? ' (unavailable)' : ''}
                </option>
              ))}
            </select>
          </div>

          <Button
            fullWidth
            loading={assigning}
            disabled={!selectedOrder || !selectedPartner}
            onClick={handleAssign}
          >
            Assign Delivery
          </Button>
        </div>

        {/* Partners list */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">
            Delivery Partners ({partners?.length || 0})
          </h3>
          {!partners ? (
            <Spinner />
          ) : partners.length === 0 ? (
            <p className="text-sm text-gray-500">No delivery partners registered.</p>
          ) : (
            <div className="space-y-3">
              {partners.map(partner => (
                <div
                  key={partner.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {partner.user?.profile?.first_name
                        ? `${partner.user.profile.first_name} ${partner.user.profile.last_name}`
                        : partner.user?.email}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">
                      {partner.vehicle_type || 'No vehicle set'}
                      {partner.vehicle_number && ` · ${partner.vehicle_number}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {partner.current_load}/{partner.max_load}
                    </p>
                    <span className={`badge text-xs ${
                      partner.is_accepting ? 'badge-success' : 'badge-danger'
                    }`}>
                      {partner.is_accepting ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DeliveryLayout>
  )
}