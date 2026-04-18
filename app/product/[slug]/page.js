'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { ProductCard } from '@/components/product-card'
import { ShoppingCart, Share2, Copy, Minus, Plus, Droplet, Flower2, TreePine, Loader2 } from 'lucide-react'
import { formatRupiah, stockStatus } from '@/lib/utils'
import { useCart } from '@/components/providers'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeNote, setActiveNote] = useState('top')

  useEffect(() => {
    fetch(`/api/products/slug/${slug}`).then(r => r.json()).then(d => {
      if (d.product) { setProduct(d.product); setRelated(d.related || []) }
      setLoading(false)
    })
  }, [slug])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (!product) return <div className="min-h-screen flex items-center justify-center"><p>Produk tidak ditemukan</p></div>

  const s = stockStatus(product.stock)
  const out = product.stock <= 0

  const handleAdd = () => {
    if (out) return
    add(product, qty)
    toast.success(`${product.name} (${qty}x) ditambahkan ke keranjang!`)
  }
  const handleBuyNow = () => {
    if (out) return
    add(product, qty)
    router.push('/cart')
  }

  const notes = [
    { key: 'top', label: 'Top Note', icon: Droplet, content: product.top_note, desc: 'Aroma pertama yang tercium saat parfum disemprotkan.' },
    { key: 'middle', label: 'Middle Note', icon: Flower2, content: product.middle_note, desc: 'Jantung parfum, muncul setelah top note memudar.' },
    { key: 'base', label: 'Base Note', icon: TreePine, content: product.base_note, desc: 'Aroma akhir yang bertahan paling lama di kulit.' },
  ]

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-caisy-burgundy">Home</Link> / <Link href="/catalog" className="hover:text-caisy-burgundy">Katalog</Link> / <span className="text-caisy-charcoal">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10">
          <motion.div initial={{opacity:0, x:-30}} animate={{opacity:1, x:0}} className="relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-caisy-cream to-caisy-gold/20 shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </motion.div>

          <motion.div initial={{opacity:0, x:30}} animate={{opacity:1, x:0}}>
            <div className="flex gap-2 mb-3">
              <span className="inline-block text-[10px] uppercase tracking-widest px-3 py-1 bg-caisy-burgundy text-white font-semibold rounded-full">{product.category}</span>
              <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-semibold ${s.color}`}>{s.label}</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-caisy-burgundy mb-2">{product.name}</h1>
            {product.inspired_by && <p className="italic text-muted-foreground mb-4">✨ Inspired by: <span className="font-semibold text-caisy-charcoal">{product.inspired_by}</span></p>}
            <p className="font-display text-4xl font-bold text-caisy-burgundy mb-2">{formatRupiah(product.price)}</p>
            <p className="text-sm text-muted-foreground mb-6">{product.size_ml}ml • Stok tersedia: <span className="font-semibold text-caisy-charcoal">{product.stock}</span></p>

            <p className="text-caisy-charcoal/80 mb-6 leading-relaxed">{product.description}</p>

            {/* Notes tabs */}
            <div className="bg-white rounded-xl p-4 border border-caisy-gold/20 mb-6">
              <div className="flex gap-2 border-b border-border pb-2 mb-3">
                {notes.map(n => (
                  <button key={n.key} onClick={()=>setActiveNote(n.key)} className={`flex-1 px-3 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${activeNote===n.key ? 'bg-caisy-burgundy text-white' : 'hover:bg-caisy-gold/10'}`}>
                    <n.icon className="w-4 h-4"/>{n.label}
                  </button>
                ))}
              </div>
              {notes.filter(n=>n.key===activeNote).map(n => (
                <div key={n.key}>
                  <p className="font-semibold text-caisy-burgundy">{n.content || '-'}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-medium">Jumlah:</span>
              <div className="flex items-center border border-border rounded-md">
                <button onClick={()=>setQty(Math.max(1, qty-1))} className="p-2 hover:bg-caisy-gold/10"><Minus className="w-4 h-4"/></button>
                <span className="w-12 text-center font-semibold">{qty}</span>
                <button onClick={()=>setQty(Math.min(product.stock, qty+1))} className="p-2 hover:bg-caisy-gold/10"><Plus className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button onClick={handleAdd} disabled={out} className={`flex-1 btn-outline flex items-center justify-center gap-2 ${out && 'opacity-50 cursor-not-allowed'}`}><ShoppingCart className="w-4 h-4"/> {out ? 'Stok Habis' : 'Tambah ke Keranjang'}</button>
              <button onClick={handleBuyNow} disabled={out} className={`flex-1 btn-primary ${out && 'opacity-50 cursor-not-allowed'}`}>Beli Sekarang</button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Bagikan:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Cek parfum ini di Caisy Perfume: ${product.name} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-caisy-gold/10 rounded-full"><Share2 className="w-4 h-4"/></a>
              <button onClick={()=>{navigator.clipboard.writeText(window.location.href); toast.success('Link disalin!')}} className="p-2 hover:bg-caisy-gold/10 rounded-full"><Copy className="w-4 h-4"/></button>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl font-bold text-caisy-burgundy mb-6">Kamu Mungkin Suka</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
