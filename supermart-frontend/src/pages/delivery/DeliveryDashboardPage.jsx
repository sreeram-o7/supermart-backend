import { useQuery } from '@tanstack/react-query'
import { Package, CheckCircle, Clock, Truck } from 'lucide-react'
import DeliveryLayout from '../../components/delivery/DeliveryLayout'
import Spinner from '../../components/ui/Spinner'
import { deliveryApi } from '../../api/delivery.api'
import useAuthStore from '../../store/authStore'

export default function DeliveryDashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isManager = ['delivery_manager', 'admin', 'super_admin'].includes(user?.role)

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-assignments'],
    queryFn: () => isManager
      ? deliveryApi.getManagerAssignments()
      : deliveryApi.getMyAssignments(),
    select: (res) => res.data.data,
    enabled: !!user,
  })

  const stats = {
    total:     assignments?.length || 0,
    active:    assignments?.filter(a => ['assigned', 'picked_up', 'out_for_delivery'].includes(a.status)).length || 0,
    delivered: assignments?.filter(a => a.status === 'delivered').length || 0,
    pending:   assignments?.filter(a => a.status === 'assigned').length || 0,
  }

  return (
    <DeliveryLayout title="Dashboard">
      <div className="space-y-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
          <p className="text-gray-400 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold mt-1">
            {user?.full_name || user?.email}
          </h2>
          <p className="text-gray-400 text-sm mt-1 capitalize">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total',     value: stats.total,     icon: <Package size={20} />,      color: 'bg-blue-50 text-blue-600' },
              { label: 'Active',    value: stats.active,    icon: <Truck size={20} />,         color: 'bg-orange-50 text-orange-600' },
              { label: 'Pending',   value: stats.pending,   icon: <Clock size={20} />,         color: 'bg-yellow-50 text-yellow-600' },
              { label: 'Delivered', value: stats.delivered, icon: <CheckCircle size={20} />,   color: 'bg-green-50 text-green-600' },
            ].map((stat) => (
              <div key={stat.label} className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active deliveries preview */}
        {!isLoading && stats.active > 0 && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Active Deliveries ({stats.active})
            </h3>
            <div className="space-y-2">
              {assignments
                ?.filter(a => ['assigned', 'picked_up', 'out_for_delivery'].includes(a.status))
                .slice(0, 3)
                .map(a => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 font-mono">{a.order_number}</p>
                      <p className="text-xs text-gray-400">{a.customer_name}</p>
                    </div>
                    <span className="badge badge-warning capitalize">
                      {a.status.replace('_', ' ')}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {!isLoading && stats.total === 0 && (
          <div className="card text-center py-12">
            <Package size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No deliveries assigned yet.</p>
          </div>
        )}
      </div>
    </DeliveryLayout>
  )
}