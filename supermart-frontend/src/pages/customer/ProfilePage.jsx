import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { User, MapPin, Lock, Package } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { authApi, userApi } from '../../api/auth.api'
import { formatDate } from '../../utils/formatters'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../constants'
import toast from 'react-hot-toast'
import useAuthStore from '../../store/authStore'

const TABS = [
  { id: 'profile',   label: 'Profile',    icon: <User size={16} /> },
  { id: 'addresses', label: 'Addresses',  icon: <MapPin size={16} /> },
  { id: 'security',  label: 'Security',   icon: <Lock size={16} /> },
]

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
    select: (res) => res.data.data,
  })

  const [profileForm, setProfileForm] = useState({
    first_name: '', last_name: '', phone: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '', new_password: '', new_password_confirm: '',
  })

  const [addressForm, setAddressForm] = useState({
    label: 'Home', full_name: '', phone: '',
    address_line1: '', address_line2: '', city: '',
    state: '', pin_code: '', is_default: false,
  })

  const { data: addresses, isLoading: addressLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => userApi.getAddresses(),
    select: (res) => res.data.data,
  })

  const handleProfileSave = async () => {
    setSaving(true)
    try {
      const payload = {}
      if (profileForm.first_name) payload.first_name = profileForm.first_name
      if (profileForm.last_name) payload.last_name = profileForm.last_name
      if (profileForm.phone) payload.phone = profileForm.phone

      await userApi.updateProfile(payload)
      queryClient.invalidateQueries(['me'])
      toast.success('Profile updated successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      await userApi.changePassword(passwordForm)
      toast.success('Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '', new_password_confirm: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddAddress = async () => {
    setSaving(true)
    try {
      await userApi.addAddress(addressForm)
      queryClient.invalidateQueries(['addresses'])
      toast.success('Address added successfully.')
      setAddressForm({
        label: 'Home', full_name: '', phone: '',
        address_line1: '', address_line2: '', city: '',
        state: '', pin_code: '', is_default: false,
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add address.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return
    try {
      await userApi.deleteAddress(id)
      queryClient.invalidateQueries(['addresses'])
      toast.success('Address deleted.')
    } catch {
      toast.error('Failed to delete address.')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await userApi.setDefaultAddress(id)
      queryClient.invalidateQueries(['addresses'])
      toast.success('Default address updated.')
    } catch {
      toast.error('Failed to set default address.')
    }
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-bold text-xl">
              {user?.profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.profile?.first_name
                ? `${user.profile.first_name} ${user.profile.last_name}`
                : user?.email}
            </h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Member since {formatDate(user?.created_at)}
            </p>
          </div>
          <Link
            to={ROUTES.ORDERS}
            className="ml-auto flex items-center gap-2 btn-secondary text-sm"
          >
            <Package size={16} />
            My Orders
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card max-w-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileForm.first_name || user?.profile?.first_name || ''}
                  onChange={(e) => setProfileForm(f => ({ ...f, first_name: e.target.value }))}
                  className="input-field"
                  placeholder={user?.profile?.first_name || 'First name'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileForm.last_name || user?.profile?.last_name || ''}
                  onChange={(e) => setProfileForm(f => ({ ...f, last_name: e.target.value }))}
                  className="input-field"
                  placeholder={user?.profile?.last_name || 'Last name'}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone || user?.phone || ''}
                onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                className="input-field"
                placeholder="10-digit mobile number"
              />
            </div>
            <Button
              fullWidth
              loading={saving}
              onClick={handleProfileSave}
            >
              Save Changes
            </Button>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            {/* Existing addresses */}
            {addressLoading ? (
              <Spinner />
            ) : addresses?.length === 0 ? (
              <div className="card text-center py-8">
                <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">No saved addresses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses?.map((address) => (
                  <div key={address.id} className="card relative">
                    {address.is_default && (
                      <span className="absolute top-4 right-4 badge badge-success text-xs">
                        Default
                      </span>
                    )}
                    <p className="font-semibold text-gray-900">{address.label}</p>
                    <p className="text-sm text-gray-600 mt-1">{address.full_name}</p>
                    <p className="text-sm text-gray-500">{address.phone}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {address.city}, {address.state} - {address.pin_code}
                    </p>
                    <div className="flex gap-2 mt-3">
                      {!address.is_default && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="text-xs text-primary-500 hover:text-primary-400 font-medium"
                        >
                          Set as default
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-xs text-red-500 hover:text-red-400 font-medium ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add address form */}
            <div className="card max-w-lg space-y-4">
              <h3 className="font-semibold text-gray-900">Add New Address</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'label',         label: 'Label',          placeholder: 'Home / Office' },
                  { key: 'full_name',     label: 'Full Name',      placeholder: 'Recipient name' },
                  { key: 'phone',         label: 'Phone',          placeholder: '10-digit number' },
                  { key: 'address_line1', label: 'Address Line 1', placeholder: 'Street address', span: 2 },
                  { key: 'address_line2', label: 'Address Line 2', placeholder: 'Apartment, floor', span: 2 },
                  { key: 'city',          label: 'City',           placeholder: 'City' },
                  { key: 'state',         label: 'State',          placeholder: 'State' },
                  { key: 'pin_code',      label: 'PIN Code',       placeholder: '6-digit PIN' },
                ].map(({ key, label, placeholder, span }) => (
                  <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={addressForm[key]}
                      onChange={(e) => setAddressForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="input-field text-sm"
                    />
                  </div>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.is_default}
                  onChange={(e) => setAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="rounded"
                />
                Set as default address
              </label>
              <Button fullWidth loading={saving} onClick={handleAddAddress}>
                Add Address
              </Button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="card max-w-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Change Password</h3>
            {[
              { key: 'current_password',      label: 'Current Password' },
              { key: 'new_password',           label: 'New Password' },
              { key: 'new_password_confirm',   label: 'Confirm New Password' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {label}
                </label>
                <input
                  type="password"
                  value={passwordForm[key]}
                  onChange={(e) => setPasswordForm(f => ({ ...f, [key]: e.target.value }))}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
            ))}
            <Button fullWidth loading={saving} onClick={handlePasswordChange}>
              Change Password
            </Button>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}