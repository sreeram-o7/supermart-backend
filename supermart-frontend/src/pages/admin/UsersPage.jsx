import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AdminLayout from '../../components/admin/AdminLayout'
import Spinner from '../../components/ui/Spinner'
import { adminApi } from '../../api/admin.api'
import { formatDate } from '../../utils/formatters'
import { getInitials } from '../../utils/formatters'
import toast from 'react-hot-toast'

const ROLES = ['customer', 'delivery_partner', 'delivery_manager', 'admin', 'super_admin']

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [updating, setUpdating] = useState(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers(),
    select: (res) => res.data.data,
  })

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId)
    try {
      await adminApi.updateUser(userId, { role: newRole })
      queryClient.invalidateQueries(['admin-users'])
      toast.success('User role updated.')
    } catch {
      toast.error('Failed to update user.')
    } finally {
      setUpdating(null)
    }
  }

  const handleToggleActive = async (user) => {
    setUpdating(user.id)
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active })
      queryClient.invalidateQueries(['admin-users'])
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'}.`)
    } catch {
      toast.error('Failed to update user.')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <AdminLayout title="Users" subtitle="Manage customer and staff accounts">
      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">User</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Role</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-xs">
                            {getInitials(user.profile?.first_name
                              ? `${user.profile.first_name} ${user.profile.last_name}`
                              : user.email)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.profile?.first_name
                              ? `${user.profile.first_name} ${user.profile.last_name}`
                              : '—'}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={user.role}
                        disabled={updating === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-300"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={updating === user.id}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                          user.is_active
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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