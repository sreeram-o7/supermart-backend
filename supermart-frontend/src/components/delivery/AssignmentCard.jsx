import { useState } from 'react'
import { MapPin, Phone, Package, Clock } from 'lucide-react'
import { deliveryApi } from '../../api/delivery.api'
import { useQueryClient } from '@tanstack/react-query'
import { formatDateTime } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
  assigned:         'badge-warning',
  picked_up:        'badge-info',
  out_for_delivery: 'badge-info',
  delivered:        'badge-success',
  failed:           'badge-danger',
  returned:         'badge-gray',
}

const NEXT_STATUS = {
  assigned:         'picked_up',
  picked_up:        'out_for_delivery',
  out_for_delivery: 'delivered',
}

const NEXT_STATUS_LABEL = {
  assigned:         'Mark Picked Up',
  picked_up:        'Mark Out for Delivery',
  out_for_delivery: 'Confirm Delivery',
}

export default function AssignmentCard({ assignment, showOtp = false }) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [otp, setOtp] = useState('')

  const nextStatus = NEXT_STATUS[assignment.status]
  const nextLabel = NEXT_STATUS_LABEL[assignment.status]

  const handleStatusUpdate = async () => {
    if (assignment.status === 'out_for_delivery') {
      setShowOtpInput(true)
      return
    }
    setLoading(true)
    try {
      await deliveryApi.updateStatus(assignment.id, nextStatus)
      queryClient.invalidateQueries(['my-assignments'])
      toast.success(`Status updated to ${nextStatus.replace('_', ' ')}.`)
    } catch {
      toast.error('Failed to update status.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmWithOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter a 6-digit OTP.')
      return
    }
    setLoading(true)
    try {
      await deliveryApi.confirmDelivery(assignment.id, otp)
      queryClient.invalidateQueries(['my-assignments'])
      toast.success('Delivery confirmed successfully!')
      setShowOtpInput(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-primary-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 font-mono">
              {assignment.order_number}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Clock size={10} />
              {formatDateTime(assignment.assigned_at)}
            </p>
          </div>
        </div>
        <span className={`badge ${STATUS_COLORS[assignment.status] || 'badge-gray'}`}>
          {assignment.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Customer info */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <div className="flex items-start gap-2">
          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {assignment.customer_name}
            </p>
            <p className="text-xs text-gray-500">{assignment.delivery_address}</p>
          </div>
        </div>
      </div>

      {/* Attempt count */}
      {assignment.attempt_count > 1 && (
        <p className="text-xs text-orange-600 font-medium">
          Attempt #{assignment.attempt_count}
        </p>
      )}

      {/* Failure reason */}
      {assignment.failure_reason && (
        <p className="text-xs text-red-600">
          Failed: {assignment.failure_reason}
        </p>
      )}

      {/* OTP input for delivery confirmation */}
      {showOtpInput && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            Enter customer OTP to confirm delivery:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit OTP"
              className="input-field text-center text-lg font-mono tracking-widest"
              maxLength={6}
            />
            <button
              onClick={handleConfirmWithOtp}
              disabled={loading || otp.length !== 6}
              className="btn-primary px-4 disabled:opacity-50"
            >
              {loading ? '...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowOtpInput(false)}
              className="btn-secondary px-3"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Action button */}
      {nextStatus && !showOtpInput && (
        <button
          onClick={handleStatusUpdate}
          disabled={loading}
          className="btn-primary w-full py-2.5 disabled:opacity-50"
        >
          {loading ? 'Updating...' : nextLabel}
        </button>
      )}

      {assignment.status === 'delivered' && (
        <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm py-2">
          ✓ Delivered successfully
        </div>
      )}
    </div>
  )
}