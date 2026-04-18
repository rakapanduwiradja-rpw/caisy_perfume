'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

const STATUS_BADGES = {
  pending: { label: 'Menunggu Pembayaran', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Dibayar', color: 'bg-green-100 text-green-800' },
  processing: { label: 'Diproses', color: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'Dikirim', color: 'bg-purple-100 text-purple-800' },
  delivered: { label: 'Selesai', color: 'bg-green-600 text-white' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800' },
}

export default function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(r=>r.json()).then(d => { setOrder(d.order); setLoading(false) })
  }, [id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin"/></div>
  if (!order) return <div className="min-h-screen flex items-center justify-center"><p>Pesanan tidak ditemukan</p></div>

  const sb = STATUS_BADGES[order.status] || STATUS_BADGES.pending

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/orders" className="text-sm text-caisy-burgundy hover:underline">← Kembali ke Daftar Pesanan</Link>
        <div className="mt-4 bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20">
          <div className="flex flex-wrap gap-3 justify-between items-start mb-6">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Kode Pesanan</p>
              <p className="font-display text-2xl font-bold text-caisy-burgundy">{order.order_code}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sb.color}`}>{sb.label}</span>
          </div>

          <h3 className="font-semibold mb-2">Item</h3>
          <div className="space-y-2 mb-4">
            {order.items?.map(i => (
              <div key={i.id} className="flex gap-3 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.product_image} alt={i.product_name} className="w-16 h-16 rounded object-cover" />
                <div className="flex-1">
                  <p className="font-medium">{i.product_name}</p>
                  <p className="text-xs text-muted-foreground">{i.quantity} x {formatRupiah(i.price)}</p>
                </div>
                <p className="font-semibold">{formatRupiah(i.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(order.subtotal)}</span></div>
            <div className="flex justify-between"><span>Ongkir ({order.shipping_carrier} {order.shipping_service})</span><span>{formatRupiah(order.shipping_cost)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border mt-2"><span>Total</span><span className="font-display text-xl text-caisy-burgundy">{formatRupiah(order.total_amount)}</span></div>
          </div>

          <div className="mt-6 pt-4 border-t border-border grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Penerima</p>
              <p>{order.guest_name}</p>
              <p className="text-muted-foreground">{order.guest_email} • {order.guest_phone}</p>
            </div>
            <div>
              <p className="font-semibold mb-1">Alamat Pengiriman</p>
              <p className="text-muted-foreground">{order.address_detail}, {order.district_name}, {order.city_name}, {order.province_name} {order.postal_code}</p>
            </div>
          </div>
          {order.tracking_number && (
            <div className="mt-4 p-3 bg-caisy-gold/10 rounded-lg">
              <p className="text-xs text-muted-foreground">Nomor Resi</p>
              <p className="font-mono font-bold">{order.tracking_number}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
