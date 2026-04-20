'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { Sparkles, Loader2, Search } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { motion } from 'framer-motion'

const SUGGESTIONS = [
  'pria maskulin',
  'wanita floral manis',
  'unisex woody',
  'segar untuk kerja',
  'parfum mewah terjangkau',
  'romantis untuk kencan malam',
  'aroma vanilla hangat',
  'sporty dan energik',
]

function SmartSearchContent() {
  const sp = useSearchParams()
  const [query, setQuery] = useState(sp.get('q') || '')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const run = async (q) => {
    if (!q) return
    setLoading(true); setResults(null)
    try {
      const r = await fetch('/api/smart-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) })
      const d = await r.json()
      setResults(d.products || [])
    } catch (e) { setResults([]) }
    setLoading(false)
  }

  useEffect(() => { if (sp.get('q')) run(sp.get('q')) }, [])

  const handleSubmit = (e) => { e.preventDefault(); run(query) }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-caisy-gold/20 text-caisy-burgundy text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" /> Powered by Google Gemini AI
          </motion.div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-caisy-burgundy mb-3">AI Smart Search</h1>
          <p className="text-muted-foreground mb-8">Deskripsikan parfum impianmu dengan bahasa sehari-hari</p>

          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white rounded-2xl shadow-xl border border-caisy-gold/30 p-3 flex gap-2">
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Contoh: 'parfum floral segar untuk ke kantor'" className="flex-1 text-lg outline-none px-4 py-3" />
              <button type="submit" disabled={loading || !query} className="btn-primary flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Cari
              </button>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setQuery(s); run(s) }} className="text-xs px-3 py-1.5 rounded-full border border-caisy-gold/50 hover:bg-caisy-gold/10 text-caisy-charcoal">{s}</button>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-12">
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block">
                <div className="w-20 h-20 rounded-full burgundy-gradient flex items-center justify-center animate-pulse">
                  <Sparkles className="w-10 h-10 text-caisy-gold animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-caisy-burgundy font-display text-xl">AI sedang menganalisis...</p>
              <p className="text-sm text-muted-foreground">Mencarikan parfum yang paling cocok untukmu</p>
            </div>
          )}

          {!loading && results !== null && results.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-display text-2xl text-caisy-burgundy mb-2">Tidak ada hasil yang cocok</p>
              <p className="text-sm text-muted-foreground">Coba deskripsikan lebih detail, misal: "parfum pria woody untuk musim hujan"</p>
            </div>
          )}

          {!loading && results && results.length > 0 && (
            <>
              <p className="text-center text-sm text-muted-foreground mb-6">AI merekomendasikan <span className="font-semibold text-caisy-burgundy">{results.length} parfum</span> berdasarkan permintaan Anda</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.map((p, i) => (
                  <div key={p.id} className="relative">
                    <ProductCard product={p} index={i} />
                    {p.ai_reason && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className="mt-2 p-3 rounded-lg bg-caisy-gold/15 border border-caisy-gold/40">
                        <div className="flex items-start gap-2">
                          <Sparkles className="w-4 h-4 text-caisy-gold shrink-0 mt-0.5" />
                          <p className="text-xs text-caisy-charcoal italic">{p.ai_reason}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

function SmartSearchSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="h-6 w-48 bg-gray-200 rounded-full mx-auto mb-4 animate-pulse" />
          <div className="h-14 w-72 bg-gray-200 rounded mx-auto mb-3 animate-pulse" />
          <div className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default function SmartSearchPage() {
  return (
    <Suspense fallback={<SmartSearchSkeleton />}>
      <SmartSearchContent />
    </Suspense>
  )
}
