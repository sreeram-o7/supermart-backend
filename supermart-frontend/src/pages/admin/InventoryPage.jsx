import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Plus } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { adminApi } from '../../api/admin.api'
import toast from 'react-hot-toast'

export default function InventoryPage() {
  const queryClient = useQueryClient()
  const [restockingId, setRestockingId] = useState(null)
  const [restockQty, setRestockQty] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: lowStock, isLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => adminApi.getLowStock(),
    select: (res) => res.data.data,
  })

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminApi.getProducts(),
    select: (res) => res.data.data,
  })

  const handleRestock = async (productId) => {
    if (!restockQty || restockQty <= 0) {
      toast.error('Enter a valid quantity.')
      return
    }
    setSaving(true)
    try {
      await adminApi.restockProduct(productId, parseInt(restockQty))
      queryClient.invalidateQueries(['low-stock'])
      queryClient.invalidateQueries(['admin-products'])
      toast.success(`Added ${restockQty} units to stock.`)
      setRestockingId(null)
      setRestockQty('')
    } catch {
      toast.error('Failed to restock.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Inventory" subtitle="Monitor and manage stock levels">

      {/* Low stock alert */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-orange-800">
              {lowStock.length} product{lowStock.length > 1 ? 's' : ''} running low on stock
            </p>
            <p className="text-sm text-orange-600 mt-0.5">
              These products need restocking soon.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">In Stock</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Reserved</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Available</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Restock</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) => {
                  const isLow = lowStock?.some(l => l.product === product.id)
                  return (
                    <tr key={product.id} className={`border-b border-gray-50 hover:bg-gray-50 ${isLow ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{product.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {product.is_in_stock ? '✓' : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">—</td>
                      <td className="px-4 py-3 text-right font-medium">
                        <span className={product.is_in_stock ? 'text-green-600' : 'text-red-500'}>
                          {product.is_in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {restockingId === product.id ? (
                          <div className="flex items-center gap-2 justify-center">
                            <input
                              type="number"
                              value={restockQty}
                              onChange={(e) => setRestockQty(e.target.value)}
                              placeholder="Qty"
                              className="input-field text-xs w-20 py-1"
                              min="1"
                            />
                            <Button
                              size="sm"
                              loading={saving}
                              onClick={() => handleRestock(product.id)}
                            >
                              Add
                            </Button>
                            <button
                              onClick={() => setRestockingId(null)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setRestockingId(product.id); setRestockQty('') }}
                            className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}