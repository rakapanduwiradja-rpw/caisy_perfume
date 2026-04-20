'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { CheckCircle2, Package, ArrowRight, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatRupiah } from '@/lib/utils'

function OrderSuccessContent() {
  const sp = useSearchParams()
  const orderId = sp.get('order_id')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(r => r.json())
        .then(d => { setOrder(d.order); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [orderId])

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-14 h-14 text-green-600" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center">
          <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-3">Pembayaran Berhasil!</h1>
          <p className="text-muted-foreground mb-6">Terima kasih telah berbelanja di Caisy Perfume.</p>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-caisy-burgundy" />
            </div>
          )}

          {!loading && order && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20 text-left">
              <div className="flex justify-between mb-4 pb-4 border-b border-border">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Kode Pesanan</p>
                  <p className="font-bold">{order.order_code}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Total</p>
                  <p className="font-bold text-caisy-burgundy">{formatRupiah(order.total_amount)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {order.items?.map(i => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.product_name} x{i.quantity}</span>
                    <span>{formatRupiah(i.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border text-sm space-y-1">
                <p><span className="text-muted-foreground">Kurir:</span> {order.shipping_carrier} {order.shipping_service}</p>
                <p><span className="text-muted-foreground">Alamat:</span> {order.address_detail}, {order.district_name}, {order.city_name}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6 justify-center">
            <Link href="/orders" className="btn-outline flex items-center gap-2">
              <Package className="w-4 h-4" /> Lacak Pesanan
            </Link>
            <Link href="/catalog" className="btn-primary flex items-center gap-2">
              Lanjut Belanja <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

function OrderSuccessSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-6 animate-pulse" />
        <div className="h-10 w-72 bg-gray-200 rounded mx-auto mb-3 animate-pulse" />
        <div className="h-5 w-56 bg-gray-100 rounded mx-auto mb-6 animate-pulse" />
        <div className="bg-gray-100 rounded-2xl h-48 animate-pulse" />
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessSkeleton />}>
      <OrderSuccessContent />
    </Suspense>
  )
}
