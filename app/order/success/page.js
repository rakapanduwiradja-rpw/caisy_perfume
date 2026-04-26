'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { CheckCircle2, Package, ArrowRight, Loader2, MapPin, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'

function formatRupiah(num) {
  return 'Rp ' + Number(num).toLocaleString('id-ID')
}

function OrderSuccessContent() {
  const sp = useSearchParams()
  const orderId = sp.get('order_id')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then(r => r.json())
        .then(d => { setOrder(d.order); setLoading(false) })
        .catch(() => setLoading(false))
    } else { setLoading(false) }
  }, [orderId])

  const copyPickupCode = () => {
    if (order?.pickup_code) {
      navigator.clipboard.writeText(order.pickup_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-caisy-cream">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-600" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-4xl font-bold text-caisy-burgundy text-center mb-2">Pembayaran Berhasil!</h1>
          <p className="text-muted-foreground text-center mb-8">Konfirmasi telah dikirim ke email Anda.</p>

          {loading && <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-caisy-burgundy" /></div>}

          {!loading && order && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase text-muted-foreground tracking-widest">Kode Pesanan</p>
                    <p className="font-bold text-xl text-caisy-burgundy tracking-wider">{order.order_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase text-muted-foreground tracking-widest">Total</p>
                    <p className="font-bold text-xl text-caisy-burgundy">{formatRupiah(order.total_amount)}</p>
                  </div>
                </div>
              </div>

              {order.is_pickup && order.pickup_code && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}
                  className="bg-amber-50 rounded-2xl p-6 border-2 border-caisy-gold">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-caisy-burgundy" />
                    <h3 className="font-display font-bold text-lg text-caisy-burgundy">Pickup di Toko</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Tunjukkan kode ini saat mengambil pesanan. Pesanan siap diambil sekarang!</p>
                  <div className="bg-white rounded-xl p-4 text-center border border-caisy-gold/30">
                    <p className="text-xs text-gray-400 mb-1">Kode Pickup</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-4xl font-bold text-caisy-burgundy tracking-widest">{order.pickup_code}</span>
                      <button onClick={copyPickupCode} className="p-2 hover:bg-caisy-gold/20 rounded-lg transition">
                        {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-caisy-burgundy" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-3">Kode pickup juga dikirim ke: {order.guest_email}</p>
                </motion.div>
              )}

              {!order.is_pickup && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-caisy-burgundy" />
                    <h3 className="font-bold text-caisy-burgundy">Info Pengiriman</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Kurir:</span> <strong>{order.shipping_carrier} {order.shipping_service}</strong></p>
                    <p><span className="text-muted-foreground">Estimasi:</span> {order.shipping_etd}</p>
                    <p><span className="text-muted-foreground">Alamat:</span> {order.address_detail}, {order.district_name}, {order.city_name}</p>
                    {order.tracking_number && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 mb-1">No. Resi</p>
                        <p className="font-mono font-bold text-blue-800">{order.tracking_number}</p>
                        {order.biteship_tracking_url && (
                          <a href={order.biteship_tracking_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline mt-1 block">Lacak paket →</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20">
                <h3 className="font-bold text-caisy-burgundy mb-4">Detail Pesanan</h3>
                <div className="space-y-2 text-sm">
                  {order.items?.map(i => (
                    <div key={i.id} className="flex justify-between">
                      <span>{i.product_name} <span className="text-muted-foreground">x{i.quantity}</span></span>
                      <span>{formatRupiah(i.subtotal)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 space-y-1">
                    {!order.is_pickup && <div className="flex justify-between text-muted-foreground"><span>Ongkos Kirim</span><span>{formatRupiah(order.shipping_cost || 0)}</span></div>}
                    {order.voucher_discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon</span><span>-{formatRupiah(order.voucher_discount)}</span></div>}
                    <div className="flex justify-between font-bold text-caisy-burgundy pt-1 border-t"><span>Total</span><span>{formatRupiah(order.total_amount)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Link href="/orders" className="btn-outline flex items-center justify-center gap-2 px-6 py-3 rounded-lg"><Package className="w-4 h-4" /> Riwayat Pesanan</Link>
            <Link href="/catalog" className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-lg">Lanjut Belanja <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </motion.div>
      </div>
      <Footer /><WhatsAppButton />
    </div>
  )
}

export default function SuccessPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-caisy-burgundy" /></div>}><OrderSuccessContent /></Suspense>
}
