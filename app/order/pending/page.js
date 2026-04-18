'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Header, Footer } from '@/components/layout-parts'
import { Clock } from 'lucide-react'
import { motion } from 'framer-motion'

export default function PendingPage() {
  const sp = useSearchParams()
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <motion.div initial={{scale:0}} animate={{scale:1}} className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-14 h-14 text-yellow-600" />
        </motion.div>
        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-3">Menunggu Pembayaran</h1>
        <p className="text-muted-foreground mb-6">Selesaikan pembayaran melalui instruksi yang telah dikirim. Setelah pembayaran masuk, pesanan akan diproses otomatis.</p>
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
