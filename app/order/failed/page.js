'use client'
import Link from 'next/link'
import { Header, Footer } from '@/components/layout-parts'
import { XCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function FailedPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <motion.div initial={{scale:0}} animate={{scale:1}} className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-14 h-14 text-red-600" />
        </motion.div>
        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-3">Pembayaran Gagal</h1>
        <p className="text-muted-foreground mb-6">Maaf, pembayaran Anda tidak berhasil. Tidak ada biaya yang dipotong. Silakan coba lagi.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/checkout" className="btn-primary">Coba Lagi</Link>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="btn-outline">Hubungi CS</a>
        </div>
      </div>
      <Footer />
    </div>
  )
}
