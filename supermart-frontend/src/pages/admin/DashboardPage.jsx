import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import {
  ShoppingBag, Users, Package, TrendingUp,
  AlertTriangle, Clock,
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import StatCard from '../../components/admin/StatCard'
import Spinner from '../../components/ui/Spinner'
import { adminApi } from '../../api/admin.api'
import { formatPrice } from '../../utils/formatters'

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['admin-summary'],
    queryFn: () => adminApi.getSummary(),
    select: (res) => res.data.data,
  })

  const { data: chartData } = useQuery({
    queryKey: ['sales-chart', 'daily'],
    queryFn: () => adminApi.getSalesChart('daily'),
    select: (res) => res.data.data,
  })

  const { data: topProducts } = useQuery({
    queryKey: ['top-products'],
    queryFn: () => adminApi.getTopProducts(),
    select: (res) => res.data.data,
  })

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Welcome to the SuperMart admin panel">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={formatPrice(summary?.revenue?.total || 0)}
          subtitle={`${formatPrice(summary?.revenue?.this_month || 0)} this month`}
          icon={<TrendingUp size={22} />}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={summary?.orders?.total || 0}
          subtitle={`${summary?.orders?.today || 0} orders today`}
          icon={<ShoppingBag size={22} />}
          color="blue"
        />
        <StatCard
          title="Total Customers"
          value={summary?.users?.total || 0}
          subtitle={`${summary?.users?.new_this_month || 0} new this month`}
          icon={<Users size={22} />}
          color="purple"
        />
        <StatCard
          title="Total Products"
          value={summary?.products?.total || 0}
          subtitle={`${summary?.products?.low_stock || 0} low stock`}
          icon={<Package size={22} />}
          color="orange"
        />
      </div>

      {/* Order status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StatCard
          title="Pending Orders"
          value={summary?.orders?.pending || 0}
          subtitle="Awaiting confirmation"
          icon={<Clock size={22} />}
          color="orange"
        />
        <StatCard
          title="Low Stock Products"
          value={summary?.products?.low_stock || 0}
          subtitle="Need restocking"
          icon={<AlertTriangle size={22} />}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Revenue chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue (Last 30 Days)</h3>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val) => formatPrice(val)} />
                <Bar dataKey="revenue" fill="#1e3a5f" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No sales data yet
            </div>
          )}
        </div>

        {/* Orders chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Orders (Last 30 Days)</h3>
          {chartData && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#1e3a5f"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              No orders data yet
            </div>
          )}
        </div>
      </div>

      {/* Top products */}
      {topProducts && topProducts.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Product</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Units Sold</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Revenue</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Orders</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{p.product__name}</p>
                      <p className="text-xs text-gray-400">{p.product__sku}</p>
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {p.total_quantity}
                    </td>
                    <td className="py-3 text-right font-medium text-green-600">
                      {formatPrice(p.total_revenue)}
                    </td>
                    <td className="py-3 text-right text-gray-600">
                      {p.order_count}
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