'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { ProductCard } from '@/components/product-card'
import { ShoppingCart, Share2, Copy, Minus, Plus, Droplet, Flower2, TreePine, Loader2, Star, Heart } from 'lucide-react'
import { formatRupiah, stockStatus, formatDate } from '@/lib/utils'
import { useCart, useAuth } from '@/components/providers'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function ProductDetailPage() {
  const { slug } = useParams()
  const router = useRouter()
  const { add } = useCart()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeNote, setActiveNote] = useState('top')
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ count: 0, average: 0 })
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [isWished, setIsWished] = useState(false)

  useEffect(() => {
    fetch(`/api/products/slug/${slug}`).then(r => r.json()).then(d => {
      if (d.product) { setProduct(d.product); setRelated(d.related || []) }
      setLoading(false)
    })
    fetch(`/api/products/${slug}/reviews`).then(r=>r.json()).then(d => { setReviews(d.reviews || []); setReviewStats({ count: d.count, average: d.average }) })
    if (user) fetch('/api/wishlist').then(r=>r.json()).then(d => setIsWished((d.product_ids || []).some(id => product && id === product.id)))
  }, [slug])

  useEffect(() => {
    if (user && product) fetch('/api/wishlist').then(r=>r.json()).then(d => setIsWished((d.product_ids || []).includes(product.id)))
  }, [user, product])

  const toggleWishlist = async () => {
    if (!user) { toast.error('Login dulu untuk wishlist'); return }
    const r = await fetch('/api/wishlist/toggle', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ product_id: product.id }) })
    const d = await r.json()
    setIsWished(d.added)
    toast.success(d.added ? 'Ditambah ke wishlist ♡' : 'Dihapus dari wishlist')
  }

  const submitReview = async (e) => {
    e.preventDefault()
    if (!user) { toast.error('Login dulu untuk memberi review'); return }
    setSubmittingReview(true)
    try {
      const r = await fetch(`/api/products/${slug}/reviews`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(reviewForm) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Review terkirim! Terima kasih')
      setReviewForm({ rating: 5, content: '' })
      // refresh reviews
      const r2 = await fetch(`/api/products/${slug}/reviews`)
      const d2 = await r2.json()
      setReviews(d2.reviews || [])
      setReviewStats({ count: d2.count, average: d2.average })
    } catch(e) { toast.error(e.message) }
    setSubmittingReview(false)
  }

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
            {reviewStats.count > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(reviewStats.average) ? 'fill-caisy-primary text-caisy-primary' : 'text-gray-300'}`}/>)}</div>
                <span className="text-sm font-semibold">{reviewStats.average}</span>
                <span className="text-xs text-muted-foreground">({reviewStats.count} review)</span>
              </div>
            )}
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
              <button onClick={toggleWishlist} className="p-3 border-2 border-caisy-primary rounded-md hover:bg-caisy-primary/10" aria-label="Wishlist">
                <Heart className={`w-5 h-5 ${isWished ? 'fill-caisy-primary text-caisy-primary' : 'text-caisy-primary'}`}/>
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Bagikan:</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(`Cek parfum ini di Caisy Perfume: ${product.name} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`} target="_blank" rel="noreferrer" className="p-2 hover:bg-caisy-gold/10 rounded-full"><Share2 className="w-4 h-4"/></a>
              <button onClick={()=>{navigator.clipboard.writeText(window.location.href); toast.success('Link disalin!')}} className="p-2 hover:bg-caisy-gold/10 rounded-full"><Copy className="w-4 h-4"/></button>
            </div>
          </motion.div>
        </div>

        {/* REVIEWS */}
        <section className="mt-16 max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-caisy-primary mb-2">Ulasan Pelanggan</h2>
          {reviewStats.count > 0 ? (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} className={`w-5 h-5 ${i < Math.round(reviewStats.average) ? 'fill-caisy-primary text-caisy-primary' : 'text-gray-300'}`}/>)}</div>
              <p className="font-display text-2xl font-bold">{reviewStats.average}</p>
              <p className="text-sm text-muted-foreground">berdasarkan {reviewStats.count} ulasan</p>
            </div>
          ) : <p className="text-sm text-muted-foreground mb-4">Belum ada ulasan. Jadilah yang pertama!</p>}

          {user && (
            <form onSubmit={submitReview} className="bg-white p-5 rounded-xl border border-caisy-primary/20 mb-6">
              <p className="text-sm font-semibold mb-2">Bagikan pengalamanmu, {user.name}</p>
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n} onClick={()=>setReviewForm({...reviewForm, rating: n})}>
                    <Star className={`w-7 h-7 ${n <= reviewForm.rating ? 'fill-caisy-primary text-caisy-primary' : 'text-gray-300'}`}/>
                  </button>
                ))}
              </div>
              <textarea value={reviewForm.content} onChange={e=>setReviewForm({...reviewForm, content: e.target.value})} rows={3} placeholder="Ceritakan pengalaman aromanya, daya tahan, dan kesanmu..." className="w-full px-3 py-2 border rounded text-sm"/>
              <button type="submit" disabled={submittingReview} className="btn-primary mt-2 flex items-center gap-2">{submittingReview && <Loader2 className="w-4 h-4 animate-spin"/>} Kirim Ulasan</button>
            </form>
          )}
          {!user && <div className="bg-caisy-primary/10 p-4 rounded-lg text-sm mb-6">Ingin memberi ulasan? <Link href="/login" className="font-semibold text-caisy-primary hover:underline">Login dulu</Link></div>}

          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white p-4 rounded-xl border">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold">{r.user_name}</p>
                  <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-caisy-primary text-caisy-primary' : 'text-gray-300'}`}/>)}</div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{formatDate(r.created_at)}</p>
                <p className="text-sm">{r.content}</p>
              </div>
            ))}
          </div>
        </section>

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
