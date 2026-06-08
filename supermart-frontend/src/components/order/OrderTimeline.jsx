import { CheckCircle, Circle, XCircle } from 'lucide-react'
import { formatDateTime } from '../../utils/formatters'

const STEPS = [
  { status: 'pending',          label: 'Order Placed' },
  { status: 'confirmed',        label: 'Confirmed' },
  { status: 'packed',           label: 'Packed' },
  { status: 'dispatched',       label: 'Dispatched' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered',        label: 'Delivered' },
]

const STATUS_ORDER = ['pending','confirmed','packed','dispatched','out_for_delivery','delivered']

export default function OrderTimeline({ order }) {
  if (order.status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
        <XCircle size={24} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-700">Order Cancelled</p>
          {order.cancellation_reason && (
            <p className="text-sm text-red-600 mt-0.5">{order.cancellation_reason}</p>
          )}
        </div>
      </div>
    )
  }

  const currentIndex = STATUS_ORDER.indexOf(order.status)

  return (
    <div className="space-y-0">
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === STEPS.length - 1

        const historyEntry = order.status_history?.find(
          h => h.new_status === step.status
        )

        return (
          <div key={step.status} className="flex gap-4">
            {/* Icon + line */}
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                isCompleted
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-300'
              }`}>
                {isCompleted ? (
                  <CheckCircle size={16} />
                ) : (
                  <Circle size={16} />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-8 mt-0.5 ${
                  isCompleted && index < currentIndex
                    ? 'bg-primary-500'
                    : 'bg-gray-100'
                }`} />
              )}
            </div>

            {/* Content */}
            <div className="pb-6 flex-1">
              <p className={`text-sm font-medium ${
                isCurrent ? 'text-primary-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.label}
                {isCurrent && (
                  <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </p>
              {historyEntry && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateTime(historyEntry.created_at)}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}