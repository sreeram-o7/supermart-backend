import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const registerSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name:  z.string().min(1, 'Last name is required'),
  email:      z.string().email('Enter a valid email address'),
  phone:      z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Passwords do not match',
  path: ['password_confirm'],
})

export default function RegisterPage() {
  const { register: registerUser, isLoading, clearError } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) })

  useEffect(() => {
    clearError()
  }, [])

  const onSubmit = async (data) => {
    const payload = { ...data }
    if (!payload.phone) delete payload.phone
    const result = await registerUser(payload)
    if (result.success) {
      toast.success('Account created! Please check your email to verify.')
      navigate(ROUTES.LOGIN)
    } else {
      toast.error(result.error || 'Registration failed.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SM</span>
            </div>
            <span className="font-bold text-2xl text-primary-500">SuperMart</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Start shopping in minutes</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                name="first_name"
                placeholder="Shriram"
                register={register}
                error={errors.first_name?.message}
                required
              />
              <Input
                label="Last name"
                name="last_name"
                placeholder="Kumar"
                register={register}
                error={errors.last_name?.message}
                required
              />
            </div>

            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              register={register}
              error={errors.email?.message}
              required
            />

            <Input
              label="Mobile number"
              name="phone"
              type="tel"
              placeholder="9876543210"
              register={register}
              error={errors.phone?.message}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="Min 8 chars, uppercase, number, special char"
              register={register}
              error={errors.password?.message}
              required
            />

            <Input
              label="Confirm password"
              name="password_confirm"
              type="password"
              placeholder="Repeat your password"
              register={register}
              error={errors.password_confirm?.message}
              required
            />

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="lg"
              className="mt-2"
            >
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="text-primary-500 hover:text-primary-400 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}