import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Scan } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import ProductGrid from '../../components/product/ProductGrid'
import BarcodeScanner from '../../components/product/BarcodeScanner'
import { catalogApi } from '../../api/catalog.api'
import toast from 'react-hot-toast'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '')
  const [showScanner, setShowScanner] = useState(false)
  const query = searchParams.get('q') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => catalogApi.searchProducts(query),
    enabled: !!query,
    select: (res) => res.data,
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`)
    }
  }

  const handleBarcodeScan = async (barcode) => {
    setShowScanner(false)
    toast.loading('Looking up product...')
    try {
      const response = await catalogApi.getProductByBarcode(barcode)
      toast.dismiss()
      const product = response.data.data
      navigate(`/products/${product.slug}`)
    } catch {
      toast.dismiss()
      toast.error(`No product found for barcode: ${barcode}`)
    }
  }

  const products = data?.data || []

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search for products..."
                className="input-field pl-10"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary px-6">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Scan size={18} />
              Scan
            </button>
          </form>
        </div>

        {/* Results */}
        {query && (
          <>
            <div className="mb-4">
              {data && (
                <p className="text-gray-500 text-sm">
                  {data.message}
                </p>
              )}
            </div>
            <ProductGrid
              products={products}
              loading={isLoading}
              emptyMessage={`No products found for "${query}". Try a different search term.`}
            />
          </>
        )}

        {!query && (
          <div className="text-center py-20">
            <Search size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500">Enter a search term or scan a barcode to find products</p>
          </div>
        )}

        {/* Barcode Scanner */}
        {showScanner && (
          <BarcodeScanner
            onScan={handleBarcodeScan}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </PageWrapper>
  )
}