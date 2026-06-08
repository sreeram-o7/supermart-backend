import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import { adminApi } from '../../api/admin.api'
import { catalogApi } from '../../api/catalog.api'
import { formatPrice } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({
    name: '', slug: '', category: '', brand_name: '',
    short_description: '', sku: '', barcode: '',
    base_price: '', selling_price: '', unit: '', is_active: true, is_featured: false,
  })
  const [saving, setSaving] = useState(false)

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminApi.getProducts(),
    select: (res) => res.data.data,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    select: (res) => res.data.data,
  })

  const openAdd = () => {
    setEditProduct(null)
    setForm({
      name: '', slug: '', category: '', brand_name: '',
      short_description: '', sku: '', barcode: '',
      base_price: '', selling_price: '', unit: '',
      is_active: true, is_featured: false,
    })
    setShowForm(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      slug: product.slug,
      category: product.category_name,
      brand_name: product.brand_name,
      short_description: product.short_description,
      sku: product.sku,
      barcode: product.barcode || '',
      base_price: product.base_price,
      selling_price: product.selling_price,
      unit: product.unit,
      is_active: product.is_active,
      is_featured: product.is_featured,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }
      if (editProduct) {
        await adminApi.updateProduct(editProduct.id, payload)
        toast.success('Product updated successfully.')
      } else {
        await adminApi.createProduct(payload)
        toast.success('Product created successfully.')
      }
      queryClient.invalidateQueries(['admin-products'])
      setShowForm(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete ${product.name}?`)) return
    try {
      await adminApi.deleteProduct(product.id)
      queryClient.invalidateQueries(['admin-products'])
      toast.success('Product deleted.')
    } catch {
      toast.error('Failed to delete product.')
    }
  }

  const filtered = products?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <AdminLayout title="Products" subtitle="Manage your product catalog">

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
          />
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">SKU</th>
                  <th className="text-right px-4 py-3 text-gray-500 font-medium">Price</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Featured</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.category_name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-gray-900">{formatPrice(product.selling_price)}</p>
                      {product.discount_percentage > 0 && (
                        <p className="text-xs text-red-500">{product.discount_percentage}% off</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${product.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${product.is_featured ? 'badge-info' : 'badge-gray'}`}>
                        {product.is_featured ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="font-bold text-lg text-gray-900">
                {editProduct ? 'Edit Product' : 'Add Product'}
              </h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Name', span: 2 },
                { key: 'brand_name', label: 'Brand' },
                { key: 'sku', label: 'SKU' },
                { key: 'barcode', label: 'Barcode' },
                { key: 'unit', label: 'Unit' },
                { key: 'base_price', label: 'Base Price', type: 'number' },
                { key: 'selling_price', label: 'Selling Price', type: 'number' },
                { key: 'short_description', label: 'Short Description', span: 2 },
              ].map(({ key, label, span, type = 'text' }) => (
                <div key={key} className={span === 2 ? 'col-span-2' : ''}>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">Select category</option>
                  {categories?.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-6 col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                    className="rounded"
                  />
                  Featured
                </label>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>
                {editProduct ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}