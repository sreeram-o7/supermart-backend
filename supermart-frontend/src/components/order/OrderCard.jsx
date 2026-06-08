import { Link } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { formatPrice, formatDate } from '../../utils/formatters'

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

export default function OrderCard({ order }) {
  return (
    <Link
      to={`/orders/${order.order_number}`}
      className="card hover:border-primary-200 hover:shadow-sm transition-all block"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
            <Package size={18} className="text-primary-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {order.order_number}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${STATUS_COLORS[order.status] || 'badge-gray'}`}>
            {order.status.replace('_', ' ')}
          </span>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
        <span className="text-sm text-gray-500">
          {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
        </span>
        <span className="font-bold text-gray-900">
          {formatPrice(order.total_amount)}
        </span>
      </div>
    </Link>
  )
}