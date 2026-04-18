'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import { formatRupiah, stockStatus } from '@/lib/utils'
import { useCart } from './providers'
import { toast } from 'sonner'

export function ProductCard({ product, index = 0 }) {
  const { add } = useCart()
  const s = stockStatus(product.stock)
  const outOfStock = product.stock <= 0

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock) return
    add(product, 1)
    toast.success(`${product.name} ditambahkan ke keranjang!`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-2xl transition-all duration-500">
          <div className="aspect-[4/5] relative bg-gradient-to-br from-caisy-cream to-caisy-gold/20 overflow-hidden">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-caisy-gold">No Image</div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-1 bg-white/90 backdrop-blur text-caisy-burgundy font-semibold rounded">
                {product.category}
              </span>
              {product.is_featured && (
                <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-1 gold-gradient text-white font-semibold rounded">Featured</span>
              )}
            </div>
            <div className="absolute top-3 right-3">
              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded font-semibold ${s.color}`}>{s.label}</span>
            </div>
            {outOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-bold text-lg">STOK HABIS</span></div>}
          </div>
          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-caisy-charcoal line-clamp-1 group-hover:text-caisy-burgundy transition">{product.name}</h3>
            {product.inspired_by && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">Inspired by: {product.inspired_by}</p>}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-xl text-caisy-burgundy">{formatRupiah(product.price)}</p>
                <p className="text-[10px] text-muted-foreground">{product.size_ml}ml • Stok: {product.stock}</p>
              </div>
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className={`p-2.5 rounded-full transition ${outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-caisy-burgundy text-white hover:brightness-110 hover:scale-105'}`}
                aria-label="Tambah ke keranjang"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
