'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { ProductCard } from '@/components/product-card'
import { Search, X, Filter, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

function CatalogContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    category: sp.get('category') || '',
    search: sp.get('search') || '',
    sort: 'newest',
    min_price: '', max_price: '',
    in_stock: false,
  })
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [showFilters, setShowFilters] = useState(false)

  const load = async (pageNum = 1) => {
    setLoading(true)
    const params = new URLSearchParams({ page: pageNum, limit: 12 })
    if (filters.category) params.set('category', filters.category)
    if (filters.search) params.set('search', filters.search)
    if (filters.sort !== 'newest') params.set('sort', filters.sort)
    if (filters.min_price) params.set('min_price', filters.min_price)
    if (filters.max_price) params.set('max_price', filters.max_price)
    if (filters.in_stock) params.set('in_stock', 'true')
    const r = await fetch('/api/products?' + params.toString())
    const d = await r.json()
    setProducts(d.products || [])
    setPagination({ page: d.page, pages: d.pages, total: d.total })
    setLoading(false)
  }

  useEffect(() => { load(1) }, [filters.category, filters.sort, filters.in_stock])

  const handleSearch = (e) => { e.preventDefault(); load(1) }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <p className="uppercase tracking-widest text-caisy-gold text-xs mb-2">Katalog Lengkap</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-caisy-burgundy">Semua Koleksi Caisy</h1>
          <p className="text-muted-foreground mt-2">Temukan parfum dupe favoritmu — {pagination.total} produk tersedia</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className={`lg:w-64 lg:block ${showFilters ? 'block' : 'hidden'} bg-white p-5 rounded-xl shadow-sm border border-caisy-gold/20 h-fit`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-lg text-caisy-burgundy">Filter</h3>
              <button className="lg:hidden" onClick={() => setShowFilters(false)}><X /></button>
            </div>

            <form onSubmit={handleSearch} className="mb-4">
              <label className="text-xs font-semibold">Cari</label>
              <div className="relative mt-1">
                <input value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} placeholder="Nama parfum..." className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm" />
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
            </form>

            <div className="mb-4">
              <label className="text-xs font-semibold">Kategori</label>
              <div className="mt-2 space-y-1">
                {[{ v: '', l: 'Semua' }, { v: 'wanita', l: 'Wanita' }, { v: 'pria', l: 'Pria' }, { v: 'unisex', l: 'Unisex' }].map(c => (
                  <label key={c.v} className="flex items-center gap-2 text-sm cursor-pointer hover:text-caisy-burgundy">
                    <input type="radio" name="cat" checked={filters.category === c.v} onChange={() => setFilters({ ...filters, category: c.v })} /> {c.l}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold">Rentang Harga</label>
              <div className="flex gap-2 mt-1">
                <input type="number" placeholder="Min" value={filters.min_price} onChange={e => setFilters({ ...filters, min_price: e.target.value })} className="w-full px-2 py-1.5 border border-border rounded-md text-sm" />
                <input type="number" placeholder="Max" value={filters.max_price} onChange={e => setFilters({ ...filters, max_price: e.target.value })} className="w-full px-2 py-1.5 border border-border rounded-md text-sm" />
              </div>
              <button onClick={() => load(1)} className="mt-2 text-xs btn-outline !py-1.5 w-full">Terapkan</button>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={filters.in_stock} onChange={e => setFilters({ ...filters, in_stock: e.target.checked })} /> Hanya yang tersedia
            </label>
          </aside>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-4 gap-2">
              <button className="lg:hidden btn-outline !py-2 !px-3 flex items-center gap-2" onClick={() => setShowFilters(true)}><Filter className="w-4 h-4" /> Filter</button>
              <select value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })} className="ml-auto px-3 py-2 border border-border rounded-md text-sm bg-white">
                <option value="newest">Terbaru</option>
                <option value="price_asc">Harga Terendah</option>
                <option value="price_desc">Harga Tertinggi</option>
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-caisy-burgundy" /></div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl">😔 Tidak ada produk ditemukan</p>
                <p className="text-sm text-muted-foreground mt-2">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </motion.div>
            )}

            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center gap-1">
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => load(n)} className={`w-9 h-9 rounded-md font-medium text-sm ${pagination.page === n ? 'bg-caisy-burgundy text-white' : 'bg-white border border-border hover:bg-caisy-gold/10'}`}>{n}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

// Loading fallback saat Suspense menunggu
function CatalogSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto mb-2 animate-pulse" />
          <div className="h-10 w-64 bg-gray-200 rounded mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  )
}
