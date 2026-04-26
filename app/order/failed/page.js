'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { XCircle, RefreshCw, ShoppingBag, MessageCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

function OrderFailedContent() {
  const sp = useSearchParams()
  const orderId = sp.get('order_id')

  return (
    <div className="min-h-screen bg-caisy-cream">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-lg text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-14 h-14 text-red-500" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-3">Pembayaran Gagal</h1>
          <p className="text-muted-foreground mb-2">Pembayaran tidak berhasil diproses atau telah kadaluwarsa.</p>
          <p className="text-sm text-muted-foreground mb-8">Jangan khawatir — tidak ada biaya yang dikenakan. Anda bisa mencoba lagi.</p>

          {orderId && (
            <div className="bg-white rounded-xl p-4 border border-red-100 mb-8 text-sm">
              <p className="text-muted-foreground">Kode Pesanan</p>
              <p className="font-mono font-bold text-caisy-burgundy">{orderId}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-caisy-gold/20 mb-8 text-left">
            <h3 className="font-semibold mb-3 text-caisy-burgundy">Kemungkinan Penyebab:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
              <li>Saldo tidak mencukupi</li>
              <li>Waktu pembayaran habis (expired)</li>
              <li>Gangguan pada bank atau aplikasi pembayaran</li>
              <li>Koneksi internet terputus saat transaksi</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link href="/catalog" className="btn-primary flex items-center justify-center gap-2 px-6 py-3 rounded-lg">
              <ShoppingBag className="w-4 h-4" /> Belanja Ulang
            </Link>
            <a href={`https://wa.me/6281234567890?text=Halo, pembayaran saya gagal. Kode pesanan: ${orderId || '-'}`}
              target="_blank" rel="noreferrer"
              className="btn-outline flex items-center justify-center gap-2 px-6 py-3 rounded-lg">
              <MessageCircle className="w-4 h-4" /> Hubungi CS WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
      <Footer /><WhatsAppButton />
    </div>
  )
}

export default function FailedPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-caisy-burgundy" /></div>}><OrderFailedContent /></Suspense>
}
