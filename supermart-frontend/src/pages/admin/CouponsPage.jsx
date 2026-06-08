import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { adminApi } from '../../api/admin.api'
import { formatPrice, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function CouponsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage',
    discount_value: '', min_order_value: '0',
    max_uses_per_user: '1', valid_from: '', valid_until: '',
  })

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.getCoupons(),
    select: (res) => res.data.data,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      await adminApi.createCoupon(form)
      queryClient.invalidateQueries(['admin-coupons'])
      toast.success('Coupon created successfully.')
      setShowForm(false)
      setForm({
        code: '', description: '', discount_type: 'percentage',
        discount_value: '', min_order_value: '0',
        max_uses_per_user: '1', valid_from: '', valid_until: '',
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create coupon.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this coupon?')) return
    try {
      await adminApi.deleteCoupon(id)
      queryClient.invalidateQueries(['admin-coupons'])
      toast.success('Coupon deactivated.')
    } catch {
      toast.error('Failed to deactivate coupon.')
    }
  }

  return (
    <AdminLayout title="Coupons" subtitle="Manage discount coupons">

      <div className="flex justify-end mb-6">
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus size={16} /> Create Coupon
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Code</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Discount</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Min Order</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Uses</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Valid Until</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons?.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-bold text-primary-600">{coupon.code}</p>
                      <p className="text-xs text-gray-400">{coupon.description}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : formatPrice(coupon.discount_value)
                      }
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatPrice(coupon.min_order_value)}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {coupon.total_uses}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500 text-xs">
                      {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${coupon.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg">Create Coupon</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { key: 'code', label: 'Coupon Code' },
                { key: 'description', label: 'Description' },
                { key: 'discount_value', label: 'Discount Value', type: 'number' },
                { key: 'min_order_value', label: 'Min Order Value', type: 'number' },
                { key: 'max_uses_per_user', label: 'Max Uses Per User', type: 'number' },
                { key: 'valid_from', label: 'Valid From', type: 'datetime-local' },
                { key: 'valid_until', label: 'Valid Until', type: 'datetime-local' },
              ].map(({ key, label, type = 'text' }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm(f => ({ ...f, discount_type: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="flat_amount">Flat Amount</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Create</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}