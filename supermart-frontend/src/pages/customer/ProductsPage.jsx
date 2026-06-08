import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import ProductGrid from '../../components/product/ProductGrid'
import { catalogApi } from '../../api/catalog.api'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  const category = searchParams.get('category') || ''
  const minPrice = searchParams.get('min_price') || ''
  const maxPrice = searchParams.get('max_price') || ''
  const ordering = searchParams.get('ordering') || '-created_at'

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', category, minPrice, maxPrice, ordering],
    queryFn: () => catalogApi.getProducts({
      category: category || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
      ordering,
    }),
    select: (res) => res.data,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.getCategories(),
    select: (res) => res.data.data,
  })

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    setSearchParams(params)
  }

  const clearFilters = () => setSearchParams({})

  const products = productsData?.data || []
  const hasFilters = category || minPrice || maxPrice

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {category
                ? categoriesData?.find(c => c.slug === category)?.name || 'Products'
                : 'All Products'
              }
            </h1>
            {productsData?.pagination && (
              <p className="text-gray-500 text-sm mt-1">
                {productsData.pagination.count} products
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
              >
                <X size={14} /> Clear filters
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          {showFilters && (
            <aside className="w-64 flex-shrink-0">
              <div className="card space-y-6">

                {/* Categories */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Category</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => updateFilter('category', '')}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        !category ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      All Categories
                    </button>
                    {categoriesData?.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => updateFilter('category', cat.slug)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                          category === cat.slug ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={minPrice}
                      onChange={(e) => updateFilter('min_price', e.target.value)}
                      className="input-field text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={maxPrice}
                      onChange={(e) => updateFilter('max_price', e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
                  <select
                    value={ordering}
                    onChange={(e) => updateFilter('ordering', e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="selling_price">Price: Low to High</option>
                    <option value="-selling_price">Price: High to Low</option>
                    <option value="-avg_rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </aside>
          )}

          {/* Products */}
          <div className="flex-1">
            <ProductGrid
              products={products}
              loading={productsLoading}
              emptyMessage="No products found. Try adjusting your filters."
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}