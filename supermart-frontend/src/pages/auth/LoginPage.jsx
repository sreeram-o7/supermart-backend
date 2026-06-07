import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../../hooks/useAuth'
import { ROUTES } from '../../constants'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) })

  useEffect(() => {
    clearError()
  }, [])

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password)
    if (!result.success) {
      toast.error(result.error || 'Login failed.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SM</span>
            </div>
            <span className="font-bold text-2xl text-primary-500">SuperMart</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              register={register}
              error={errors.email?.message}
              required
            />

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                register={register}
                error={errors.password?.message}
                required
              />
              <div className="text-right mt-1">
                <Link
                  to={ROUTES.FORGOT_PASSWORD}
                  className="text-sm text-primary-500 hover:text-primary-400"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isLoading}
              size="lg"
            >
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to={ROUTES.REGISTER} className="text-primary-500 hover:text-primary-400 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}