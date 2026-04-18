'use client'
import Link from 'next/link'
import { useCart } from '@/components/providers'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function CartPage() {
  const { items, update, remove, subtotal, count } = useCart()

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-6">Keranjang Belanja</h1>

        {count === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-caisy-gold/20">
            <ShoppingBag className="w-16 h-16 mx-auto text-caisy-gold mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Keranjang Kosong</h2>
            <p className="text-muted-foreground mb-6">Yuk mulai belanja parfum favoritmu!</p>
            <Link href="/catalog" className="btn-primary inline-block">Lihat Katalog</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence>
                {items.map(item => (
                  <motion.div key={item.product_id} layout initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0, x:-50}} className="bg-white rounded-xl p-4 flex gap-4 shadow-sm border border-caisy-gold/20">
                    <Link href={`/product/${item.slug}`} className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.name} className="w-24 h-28 object-cover rounded-lg" />
                    </Link>
                    <div className="flex-1">
                      <Link href={`/product/${item.slug}`} className="font-display font-semibold text-lg hover:text-caisy-burgundy">{item.name}</Link>
                      <p className="text-caisy-burgundy font-bold mt-1">{formatRupiah(item.price)}</p>
                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center border border-border rounded-md">
                          <button onClick={()=>update(item.product_id, item.quantity-1)} className="p-1.5 hover:bg-caisy-gold/10"><Minus className="w-3 h-3"/></button>
                          <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={()=>update(item.product_id, item.quantity+1)} className="p-1.5 hover:bg-caisy-gold/10"><Plus className="w-3 h-3"/></button>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-caisy-burgundy">{formatRupiah(item.price * item.quantity)}</p>
                          <button onClick={()=>remove(item.product_id)} className="text-xs text-red-500 hover:underline flex items-center gap-1 mt-1"><Trash2 className="w-3 h-3"/> Hapus</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-caisy-gold/20 sticky top-24">
                <h3 className="font-display text-xl font-bold mb-4 text-caisy-burgundy">Ringkasan</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal ({count} item)</span><span className="font-semibold">{formatRupiah(subtotal)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Ongkos Kirim</span><span>Dihitung saat checkout</span></div>
                </div>
                <div className="border-t border-border my-3"></div>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="font-semibold">Total Sementara</span>
                  <span className="font-display font-bold text-2xl text-caisy-burgundy">{formatRupiah(subtotal)}</span>
                </div>
                <Link href="/checkout" className="btn-primary w-full flex items-center justify-center gap-2">Lanjut ke Checkout <ArrowRight className="w-4 h-4"/></Link>
                <Link href="/catalog" className="btn-outline w-full mt-2 text-center block">Lanjutkan Belanja</Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
