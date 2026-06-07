import { Link } from 'react-router-dom'
import { ShoppingBag, Truck, Tag, Scan } from 'lucide-react'
import PageWrapper from '../../components/layout/PageWrapper'
import { ROUTES } from '../../constants'

export default function HomePage() {
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
            <Link to={ROUTES.PRODUCTS} className="bg-white text-primary-500 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Shop Now
            </Link>
            <Link to="/scan" className="border border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-primary-400 transition-colors flex items-center justify-center gap-2">
              <Scan size={18} /> Scan Barcode
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <ShoppingBag size={28} />, title: '10,000+ Products', desc: 'Groceries, snacks, beverages, household essentials and more.' },
            { icon: <Truck size={28} />, title: 'Fast Delivery', desc: 'Same-day delivery available in select areas.' },
            { icon: <Tag size={28} />, title: 'Best Prices', desc: 'Exclusive discounts and coupon codes every day.' },
          ].map((f) => (
            <div key={f.title} className="card text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-50 text-primary-500 rounded-xl mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to start shopping?
          </h2>
          <p className="text-gray-500 mb-8">
            Create a free account and get ₹100 off your first order.
          </p>
          <Link to={ROUTES.REGISTER} className="btn-primary text-base px-8 py-3 inline-block">
            Get Started
          </Link>
        </div>
      </section>
    </PageWrapper>
  )
}