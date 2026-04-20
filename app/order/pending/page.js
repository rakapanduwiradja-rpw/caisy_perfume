'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout-parts'
import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function OrderPendingContent() {
  const sp = useSearchParams()
  const orderId = sp.get('order_id')

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6"
        >
          <Clock className="w-14 h-14 text-yellow-600" />
        </motion.div>

        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-3">Menunggu Pembayaran</h1>
        <p className="text-muted-foreground mb-6">
          Selesaikan pembayaran melalui instruksi yang telah dikirim.
          Setelah pembayaran masuk, pesanan akan diproses otomatis.
        </p>

        {orderId && (
          <div className="mb-4 inline-block bg-caisy-gold/10 border border-caisy-gold/30 rounded-lg px-4 py-2">
            <p className="text-xs text-muted-foreground">Kode Pesanan</p>
            <p className="font-bold text-caisy-burgundy">{orderId}</p>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 border border-caisy-gold/20 text-left">
          <h3 className="font-semibold mb-2">Instruksi Pembayaran:</h3>
          <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-5">
            <li>Cek email untuk detail cara pembayaran</li>
            <li>Bayar dalam waktu 24 jam sebelum pesanan kadaluwarsa</li>
            <li>Status akan otomatis berubah setelah pembayaran terkonfirmasi</li>
          </ul>
        </div>

        <div className="flex gap-3 mt-6 justify-center">
          <Link href="/orders" className="btn-outline">Lihat Pesanan</Link>
          <Link href="/" className="btn-primary">Ke Home</Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function OrderPendingSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="w-24 h-24 rounded-full bg-gray-100 mx-auto mb-6 animate-pulse" />
        <div className="h-10 w-72 bg-gray-200 rounded mx-auto mb-3 animate-pulse" />
        <div className="h-5 w-56 bg-gray-100 rounded mx-auto mb-6 animate-pulse" />
        <div className="bg-gray-100 rounded-xl h-36 animate-pulse" />
      </div>
    </div>
  )
}

export default function PendingPage() {
  return (
    <Suspense fallback={<OrderPendingSkeleton />}>
      <OrderPendingContent />
    </Suspense>
  )
}
