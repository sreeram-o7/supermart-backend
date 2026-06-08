import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DeliveryLayout from '../../components/delivery/DeliveryLayout'
import AssignmentCard from '../../components/delivery/AssignmentCard'
import Spinner from '../../components/ui/Spinner'
import { deliveryApi } from '../../api/delivery.api'
import useAuthStore from '../../store/authStore'

const STATUS_FILTERS = [
  { value: '',                label: 'All' },
  { value: 'assigned',        label: 'Assigned' },
  { value: 'picked_up',       label: 'Picked Up' },
  { value: 'out_for_delivery',label: 'Out for Delivery' },
  { value: 'delivered',       label: 'Delivered' },
  { value: 'failed',          label: 'Failed' },
]

export default function AssignmentsPage() {
  const user = useAuthStore((s) => s.user)
  const isManager = ['delivery_manager', 'admin', 'super_admin'].includes(user?.role)
  const [statusFilter, setStatusFilter] = useState('')

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['my-assignments', statusFilter],
    queryFn: () => isManager
      ? deliveryApi.getManagerAssignments(statusFilter)
      : deliveryApi.getMyAssignments(),
    select: (res) => res.data.data,
  })

  const filtered = statusFilter && !isManager
    ? assignments?.filter(a => a.status === statusFilter)
    : assignments

  return (
    <DeliveryLayout title={isManager ? 'All Assignments' : 'My Deliveries'}>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !filtered?.length ? (
        <div className="card text-center py-16">
          <p className="text-gray-500">No assignments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
            />
          ))}
        </div>
      )}
    </DeliveryLayout>
  )
}