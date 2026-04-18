'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { useAuth } from '@/components/providers'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Package, Loader2 } from 'lucide-react'

const STATUS_BADGES = {
  pending: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Dibayar', color: 'bg-green-100 text-green-800' },
  processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Selesai', color: 'bg-green-600 text-white' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetch('/api/orders').then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false) })
  }, [user, authLoading])

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-6">Pesanan Saya</h1>
        {loading ? <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto"/></div> : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border">
            <Package className="w-16 h-16 mx-auto text-caisy-gold mb-4" />
            <p className="font-display text-2xl">Belum ada pesanan</p>
            <Link href="/catalog" className="btn-primary mt-4 inline-block">Belanja Sekarang</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const sb = STATUS_BADGES[o.status] || STATUS_BADGES.pending
              return (
                <div key={o.id} className="bg-white rounded-xl p-5 shadow-sm border border-caisy-gold/20">
                  <div className="flex flex-wrap gap-3 justify-between mb-3">
                    <div>
                      <p className="font-bold text-caisy-burgundy">{o.order_code}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(o.created_at)}</p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sb.color}`}>{sb.label}</span>
                  </div>
                  <div className="flex gap-2 overflow-auto pb-2">
                    {o.items?.slice(0,4).map(i => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i.id} src={i.product_image} alt={i.product_name} className="w-16 h-16 rounded-lg object-cover shrink-0" title={i.product_name} />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <p className="font-bold">{formatRupiah(o.total_amount)}</p>
                    <Link href={`/orders/${o.id}`} className="text-sm text-caisy-burgundy font-semibold hover:underline">Detail →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
