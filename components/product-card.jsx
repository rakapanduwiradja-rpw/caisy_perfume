'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingCart, Heart } from 'lucide-react'
import { formatRupiah, stockStatus } from '@/lib/utils'
import { useCart, useAuth } from './providers'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

let wishlistCache = null
const listeners = new Set()
const notifyListeners = () => listeners.forEach(l => l(wishlistCache))

async function loadWishlist() {
  try {
    const r = await fetch('/api/wishlist')
    const d = await r.json()
    wishlistCache = d.product_ids || []
    notifyListeners()
  } catch(e) { wishlistCache = [] }
}

export function ProductCard({ product, index = 0 }) {
  const { add } = useCart()
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState(wishlistCache || [])
  const s = stockStatus(product.stock)
  const outOfStock = product.stock <= 0
  const isWished = wishlist.includes(product.id)

  useEffect(() => {
    const cb = (ids) => setWishlist(ids || [])
    listeners.add(cb)
    if (user && wishlistCache === null) loadWishlist()
    else if (!user) setWishlist([])
    return () => listeners.delete(cb)
  }, [user])

  const handleAdd = (e) => {
    e.preventDefault(); e.stopPropagation()
    if (outOfStock) return
    add(product, 1)
    toast.success(`${product.name} ditambahkan ke keranjang!`)
  }

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation()
    if (!user) { toast.error('Login dulu untuk wishlist'); return }
    try {
      const r = await fetch('/api/wishlist/toggle', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ product_id: product.id }) })
      const d = await r.json()
      wishlistCache = d.product_ids
      notifyListeners()
      toast.success(d.added ? 'Ditambah ke wishlist ♡' : 'Dihapus dari wishlist')
    } catch(e) { toast.error('Gagal') }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }} className="group">
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md hover:shadow-2xl transition-all duration-500">
          <div className="aspect-[4/5] relative bg-gradient-to-br from-caisy-cream to-caisy-gold/20 overflow-hidden">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-caisy-primary">No Image</div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-1 bg-white/90 backdrop-blur text-caisy-primary font-semibold rounded">{product.category}</span>
              {product.is_featured && <span className="inline-block text-[10px] uppercase tracking-widest px-2 py-1 gold-gradient text-white font-semibold rounded">Featured</span>}
            </div>
            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
              <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded font-semibold ${s.color}`}>{s.label}</span>
              <button onClick={handleWishlist} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur hover:scale-110 transition flex items-center justify-center" aria-label="Wishlist">
                <Heart className={`w-4 h-4 ${isWished ? 'fill-caisy-primary text-caisy-primary' : 'text-caisy-primary'}`}/>
              </button>
            </div>
            {outOfStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white font-bold text-lg">STOK HABIS</span></div>}
          </div>
          <div className="p-4">
            <h3 className="font-display text-lg font-semibold text-caisy-charcoal line-clamp-1 group-hover:text-caisy-primary transition">{product.name}</h3>
            {product.inspired_by && <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">Inspired by: {product.inspired_by}</p>}
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-xl text-caisy-primary">{formatRupiah(product.price)}</p>
                <p className="text-[10px] text-muted-foreground">{product.size_ml}ml • Stok: {product.stock}</p>
              </div>
              <button onClick={handleAdd} disabled={outOfStock} className={`p-2.5 rounded-full transition ${outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-caisy-primary text-white hover:brightness-110 hover:scale-105'}`} aria-label="Tambah ke keranjang">
                <ShoppingCart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
