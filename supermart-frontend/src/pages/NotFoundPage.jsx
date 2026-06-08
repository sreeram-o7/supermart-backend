import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'

export default function NotFoundPage() {
  return (
    <PageWrapper hideFooter>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-8xl font-bold text-primary-100 mb-4">404</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Page not found
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/" className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5">
              <Home size={18} />
              Go Home
            </Link>
            <Link to="/search" className="btn-secondary flex items-center justify-center gap-2 px-6 py-2.5">
              <Search size={18} />
              Search Products
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}