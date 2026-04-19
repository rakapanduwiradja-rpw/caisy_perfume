'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { ProductCard } from '@/components/product-card'
import { useAuth } from '@/components/providers'
import { Heart, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetch('/api/wishlist').then(r=>r.json()).then(d => { setProducts(d.products || []); setLoading(false) })
  }, [user, authLoading])

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-caisy-primary mb-6 flex items-center gap-3"><Heart className="w-8 h-8 fill-caisy-primary"/> Wishlist Saya</h1>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border"><Heart className="w-16 h-16 mx-auto text-caisy-primary mb-4"/><p className="font-display text-2xl">Wishlist kosong</p><p className="text-muted-foreground mb-4">Tambahkan parfum favoritmu dengan klik ♡ di katalog</p><Link href="/catalog" className="btn-primary inline-block">Lihat Katalog</Link></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">{products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
        )}
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
