'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Sparkles, Heart, TrendingUp, ShieldCheck, Truck, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { ProductCard } from '@/components/product-card'

const HERO_IMAGE = 'https://images.pexels.com/photos/36389341/pexels-photo-36389341.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1080'

// =====================================================================
// PANDUAN KUSTOMISASI GRADASI WARNA
// =====================================================================
// Format warna: rgba(R, G, B, OPACITY)
// R G B = nilai merah, hijau, biru (0-255)
// OPACITY = transparansi (0.0 = transparan, 1.0 = penuh)
//
// Contoh warna populer:
// Burgundy (sekarang) : rgba(123, 30, 44,  ...)
// Navy Blue           : rgba(15,  23, 42,  ...)
// Forest Green        : rgba(20,  83, 45,  ...)
// Deep Purple         : rgba(59,  7,  100, ...)
// Charcoal Black      : rgba(15,  15, 15,  ...)
// Rose Gold           : rgba(183, 110, 121, ...)
//
// Ubah nilai HERO_GRADIENT di bawah untuk mengganti warna gradasi hero
// =====================================================================

// ← UBAH NILAI INI untuk mengganti gradasi warna di hero section
const HERO_GRADIENT = 'linear-gradient(to right, rgba(123,30,44,0.95) 0%, rgba(123,30,44,0.75) 50%, rgba(123,30,44,0.2) 100%)'
//                                                ^^^^^^^^^^^^^^^^                ^^^^^^^^^^^^^^^^                ^^^^^^^^^^^^^^^^
//                                                Kiri (pekat)                    Tengah (sedang)                  Kanan (transparan)

// ← UBAH INI untuk gambar hero background
const HERO_IMAGE_URL = HERO_IMAGE

// ← UBAH INI jika ingin ganti logo yang muncul di kotak kanan hero
// Bisa pakai '/Primary.png', '/Secondary.png', atau URL gambar lain
const HERO_LOGO_SRC = '/Primary.png'

function BannerSlider({ banners }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIdx(i => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])
  if (!banners.length) return null
  const b = banners[idx]
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="relative rounded-2xl overflow-hidden h-64 md:h-80 shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
            <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(61,54,38,0.6) 0%, rgba(61,54,38,0.2) 100%)' }} />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
              {b.title && <h2 className="font-display text-2xl md:text-4xl font-bold mb-2">{b.title}</h2>}
              {b.subtitle && <p className="text-sm md:text-lg mb-4 max-w-xl">{b.subtitle}</p>}
              {b.voucher_code && <p className="font-mono text-sm mb-3">Kode: <span className="bg-white/20 backdrop-blur px-2 py-1 rounded">{b.voucher_code}</span></p>}
              {b.link_url && <Link href={b.link_url} className="inline-block w-fit bg-white text-caisy-primary px-6 py-2 rounded-md font-semibold hover:scale-105 transition">Lihat Sekarang →</Link>}
            </div>
          </motion.div>
        </AnimatePresence>
        {banners.length > 1 && (
          <>
            <button onClick={() => setIdx((idx - 1 + banners.length) % banners.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setIdx((idx + 1) % banners.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white"><ChevronRight className="w-5 h-5" /></button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/50'}`} />)}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function App() {
  const [featured, setFeatured] = useState([])
  const [banners, setBanners] = useState([])
  const [aiQuery, setAiQuery] = useState('')

  useEffect(() => {
    fetch('/api/products/featured').then(r => r.json()).then(d => setFeatured(d.products || []))
    fetch('/api/banners').then(r => r.json()).then(d => setBanners(d.banners || []))
  }, [])

  return (
    <div className="min-h-screen">
      <Header />

      {/* ============================================================
          HERO SECTION
          - Ganti HERO_GRADIENT di atas untuk ubah warna gradasi
          - Ganti HERO_IMAGE_URL di atas untuk ubah foto background
          - Ganti HERO_LOGO_SRC di atas untuk ubah logo di kotak kanan
          ============================================================ */}
      <section className="relative overflow-hidden min-h-[600px]">
        <div className="absolute inset-0">
          <img src={HERO_IMAGE_URL} alt="hero" className="w-full h-full object-cover" />
          {/* ← GRADASI WARNA HERO — ubah nilai HERO_GRADIENT di atas */}
          <div className="absolute inset-0 caisy-hero-overlay" style={{ background: HERO_GRADIENT }} />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-36 grid md:grid-cols-2">
          <div className="text-white">
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="uppercase tracking-[0.3em] text-caisy-gold text-xs mb-6">
              — Caisy Perfume —
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Lets <span className="text-caisy-gold italic">Scent</span>,<br />Your Story
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-white/80 mb-8 max-w-lg">
              Koleksi dupe perfume eksklusif terinspirasi dari brand ternama dengan aroma yang khas. Wangi tahan lama dengan formula premium.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-4">
              <Link href="/catalog" className="btn-gold">Jelajahi Katalog</Link>
              <Link href="/smart-search" className="px-6 py-3 rounded-md border-2 border-caisy-gold text-caisy-gold hover:bg-caisy-gold hover:text-caisy-burgundy transition font-medium">✨ AI Smart Search</Link>
            </motion.div>
          </div>

          {/* ============================================================
              KOTAK KANAN HERO — Huruf "C" diganti dengan logo
              Ganti HERO_LOGO_SRC di atas untuk ubah gambar logo
              ============================================================ */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="hidden md:flex justify-end items-center"
          >
            <div className="w-80 h-96 rounded-2xl bg-gradient-to-br from-caisy-gold/30 to-white/10 backdrop-blur border border-caisy-gold/30 flex items-center justify-center p-8">
              {/* Logo gambar menggantikan huruf "C" */}
              <img
                src={HERO_LOGO_SRC}
                alt="Caisy Perfume"
                className="w-full h-full object-contain drop-shadow-2xl"
                onError={e => {
                  // Fallback ke huruf C jika logo tidak ditemukan
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              {/* Fallback teks jika logo tidak ada */}
              <span
                className="font-display text-7xl text-caisy-gold"
                style={{ display: 'none' }}
              >
                C
              </span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* BANNER PROMO (slider) */}
      <BannerSlider banners={banners} />

      {/* TRUST BADGES */}
      <section className="bg-white border-b border-caisy-gold/20">
        <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: ShieldCheck, title: '100% Premium', desc: 'Formula premium' },
            { icon: Truck, title: 'Gratis Ongkir', desc: 'Min. Rp 150.000' },
            { icon: Heart, title: '10.000+ Customer', desc: 'Dipercaya pelanggan' },
            { icon: Star, title: 'Rating 4.9', desc: 'Kepuasan terjamin' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-caisy-gold/20 flex items-center justify-center text-caisy-burgundy">
                <b.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-sm">{b.title}</p>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="uppercase tracking-widest text-caisy-gold text-xs mb-2">Koleksi Kami</p>
          <h2 className="font-display text-4xl font-bold text-caisy-burgundy">Temukan Aroma Anda</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { cat: 'wanita', title: 'Wanita', desc: 'Floral. Feminin. Romantis.', emoji: '🌹' },
            { cat: 'pria', title: 'Pria', desc: 'Bold. Maskulin. Elegan.', emoji: '🥃' },
            { cat: 'unisex', title: 'Unisex', desc: 'Modern. Timeless. Universal.', emoji: '✨' },
          ].map((c) => (
            <motion.div key={c.cat} whileHover={{ y: -8 }} transition={{ duration: 0.3 }}>
              <Link href={`/catalog?category=${c.cat}`} className="block h-64 rounded-xl overflow-hidden relative burgundy-gradient shadow-lg group">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center">
                  <div className="text-6xl mb-3 group-hover:scale-125 transition">{c.emoji}</div>
                  <h3 className="font-display text-3xl font-bold text-caisy-gold">{c.title}</h3>
                  <p className="text-sm text-white/80 mt-2">{c.desc}</p>
                  <span className="mt-4 text-xs uppercase tracking-widest border-b border-caisy-gold/50">Jelajahi →</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="uppercase tracking-widest text-caisy-gold text-xs mb-2">Terpilih</p>
            <h2 className="font-display text-4xl font-bold text-caisy-burgundy">Produk Unggulan</h2>
          </div>
          <Link href="/catalog" className="text-sm underline text-caisy-burgundy hover:text-caisy-gold">Lihat Semua →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* AI SEARCH CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl overflow-hidden relative burgundy-gradient p-10 md:p-16 text-white">
          <div className="absolute top-0 right-0 w-96 h-96 bg-caisy-gold/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="relative max-w-2xl">
            <Sparkles className="w-10 h-10 text-caisy-gold mb-4" />
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Biarkan AI Memilihkan Parfum Untukmu</h2>
            <p className="text-white/80 mb-6">Deskripsikan aroma impianmu dengan bahasa sehari-hari. AI akan merekomendasikan parfum yang paling cocok dari koleksi kami.</p>
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = `/smart-search?q=${encodeURIComponent(aiQuery)}` }} className="flex gap-2 bg-white rounded-full p-2 shadow-xl">
              <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} placeholder="Contoh: 'parfum wanita floral manis untuk pesta malam'" className="flex-1 bg-transparent outline-none text-caisy-charcoal px-4" />
              <button type="submit" className="btn-primary flex items-center gap-2 !rounded-full"><Search className="w-4 h-4" /> Cari</button>
            </form>
          </div>
        </div>
      </section>

      {/* WAITING LIST CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="rounded-2xl gold-gradient p-10 text-center text-caisy-burgundy">
          <TrendingUp className="w-10 h-10 mx-auto mb-3" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-3">Request Parfum Impianmu</h2>
          <p className="mb-6 max-w-xl mx-auto">Belum menemukan dupe dari parfum favoritmu? Request di sini! Parfum dengan banyak permintaan akan kami buat duluan.</p>
          <Link href="/waiting-list" className="inline-block bg-caisy-burgundy text-white px-8 py-3 rounded-md font-semibold hover:brightness-110 transition">Lihat Waiting List</Link>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="uppercase tracking-widest text-caisy-gold text-xs mb-2">Testimoni</p>
          <h2 className="font-display text-4xl font-bold text-caisy-burgundy">Apa Kata Pelanggan</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { name: 'Ayu P.', text: 'Wanginya mirip banget sama yang original! Awet seharian, cinta pakai Rose Elégante.', rating: 5 },
            { name: 'Budi R.', text: 'Noir Sauvage jadi daily favorite. Harga masuk akal, kualitas premium.', rating: 5 },
            { name: 'Citra S.', text: 'Delivery cepat, packaging cantik. Akan beli lagi!', rating: 5 },
            { name: 'Dimas H.', text: 'Lumière Neutre cocok banget buat kerja. Professional dan tidak menyengat.', rating: 5 },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="bg-white p-6 rounded-xl shadow-md border border-caisy-gold/20">
              <div className="flex gap-1 mb-3">
                {Array(t.rating).fill(0).map((_, j) => <Star key={j} className="w-4 h-4 fill-caisy-gold text-caisy-gold" />)}
              </div>
              <p className="text-sm italic text-caisy-charcoal mb-4">"{t.text}"</p>
              <p className="font-semibold text-caisy-burgundy">— {t.name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  )
}

export default App
