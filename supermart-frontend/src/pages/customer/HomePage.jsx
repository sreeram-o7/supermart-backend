import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Truck, Tag, Scan, ArrowRight } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import ProductGrid from '../../components/product/ProductGrid'
import { catalogApi } from '../../api/catalog.api'
import { ROUTES } from '../../constants'

export default function HomePage() {
  const { data: featuredData, isLoading: featuredLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => catalogApi.getFeaturedProducts(),
    select: (res) => res.data.data,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    select: (res) => res.data.data,
  })

  return (
    <PageWrapper>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-primary-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Fresh groceries, delivered fast
          </h1>
          <p className="text-primary-100 text-lg mb-8 max-w-xl mx-auto">
            Shop from thousands of products and get them delivered to your door.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to={ROUTES.PRODUCTS}
              className="bg-white text-primary-500 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              to="/search"
              className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-400 transition-colors flex items-center justify-center gap-2"
            >
              <Scan size={18} /> Scan Barcode
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categoriesData && categoriesData.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {categoriesData.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center">
                  <ShoppingBag size={18} className="text-primary-500" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
          <Link
            to={ROUTES.PRODUCTS}
            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            View all <ArrowRight size={16} />
          </Link>
        </div>
        <ProductGrid
          products={featuredData || []}
          loading={featuredLoading}
          emptyMessage="No featured products yet."
        />
      </section>

      {/* Features */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <ShoppingBag size={24} />, title: '10,000+ Products', desc: 'Groceries, snacks, beverages, and more.' },
              { icon: <Truck size={24} />, title: 'Fast Delivery', desc: 'Same-day delivery in select areas.' },
              { icon: <Tag size={24} />, title: 'Best Prices', desc: 'Exclusive discounts every day.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100">
                <div className="w-10 h-10 bg-primary-50 text-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-gray-500 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}