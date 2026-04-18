'use client'
import { useState, useEffect } from 'react'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { TrendingUp, Heart, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { getFirebaseDb } from '@/lib/firebase'
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc, increment, serverTimestamp } from 'firebase/firestore'

const POPULAR_SUGGESTIONS = ['Chanel Coco Mademoiselle', 'Dior J\'adore', 'YSL Libre', 'Tom Ford Lost Cherry', 'Creed Aventus', 'Maison Margiela Replica', 'Byredo Gypsy Water', 'Kilian Love Don\'t Be Shy']

export default function WaitingListPage() {
  const [form, setForm] = useState({ requester_name:'', requester_email:'', perfume_name:'', brand:'', gender_preference:'wanita', description:'' })
  const [submitting, setSubmitting] = useState(false)
  const [topList, setTopList] = useState([])
  const [useFirebase, setUseFirebase] = useState(true)

  // Real-time from Firebase
  useEffect(() => {
    const db = getFirebaseDb()
    if (!db) return
    try {
      const q = query(collection(db, 'waiting_list'), orderBy('request_count', 'desc'), limit(10))
      const unsub = onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ name: d.data().perfume_name, brand: d.data().brand, count: d.data().request_count, gender: d.data().gender }))
        setTopList(data)
      }, (err) => {
        console.warn('Firebase error, falling back:', err)
        setUseFirebase(false)
      })
      return () => unsub()
    } catch(e) { setUseFirebase(false) }
  }, [])

  // Fallback: poll MongoDB
  useEffect(() => {
    if (useFirebase) return
    const fetchTop = () => fetch('/api/waiting-list/top').then(r=>r.json()).then(d => setTopList((d.items||[]).map(i => ({ name: i.perfume_name, brand: i.brand, count: i.request_count, gender: i.gender_preference }))))
    fetchTop()
    const t = setInterval(fetchTop, 5000)
    return () => clearInterval(t)
  }, [useFirebase])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.requester_name || !form.requester_email || !form.perfume_name) { toast.error('Lengkapi nama, email, dan nama parfum'); return }
    setSubmitting(true)
    try {
      await fetch('/api/waiting-list', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) })
      // Also push to Firebase
      try {
        const db = getFirebaseDb()
        if (db) {
          const key = form.perfume_name.toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'')
          await setDoc(doc(db, 'waiting_list', key), {
            perfume_name: form.perfume_name, brand: form.brand, gender: form.gender_preference,
            request_count: increment(1), updated_at: serverTimestamp()
          }, { merge: true })
        }
      } catch(e) { console.warn('Firebase write error:', e) }
      toast.success('Berhasil! Request kamu telah masuk ke waiting list')
      setForm({ requester_name:'', requester_email:'', perfume_name:'', brand:'', gender_preference:'wanita', description:'' })
    } catch (e) {
      toast.error('Gagal submit: ' + e.message)
    }
    setSubmitting(false)
  }

  const total = topList.reduce((s, t) => s + t.count, 0)

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <p className="uppercase tracking-widest text-caisy-gold text-xs mb-2">Request Dupe</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-caisy-burgundy">Parfum Impianmu, Kami Wujudkan</h1>
          <p className="text-muted-foreground mt-2">Kamu bukan satu-satunya! Request dupe favoritmu dan lihat parfum apa yang paling diminati komunitas.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-white rounded-2xl p-6 shadow-md border border-caisy-gold/20">
            <h2 className="font-display text-2xl font-bold text-caisy-burgundy mb-4">Form Request</h2>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Nama Kamu *</label>
                  <input value={form.requester_name} onChange={e=>setForm({...form, requester_name: e.target.value})} required className="mt-1 w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Email *</label>
                  <input type="email" value={form.requester_email} onChange={e=>setForm({...form, requester_email: e.target.value})} required className="mt-1 w-full px-3 py-2 border border-border rounded-md" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Nama Parfum Asli *</label>
                <input list="perfume-suggest" value={form.perfume_name} onChange={e=>setForm({...form, perfume_name: e.target.value})} required placeholder="Misal: Chanel Coco Mademoiselle" className="mt-1 w-full px-3 py-2 border border-border rounded-md" />
                <datalist id="perfume-suggest">{POPULAR_SUGGESTIONS.map(s => <option key={s} value={s} />)}</datalist>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Brand</label>
                  <input value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} placeholder="Chanel, Dior, YSL, dll" className="mt-1 w-full px-3 py-2 border border-border rounded-md" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Untuk Siapa</label>
                  <select value={form.gender_preference} onChange={e=>setForm({...form, gender_preference: e.target.value})} className="mt-1 w-full px-3 py-2 border border-border rounded-md bg-white">
                    <option value="wanita">Wanita</option>
                    <option value="pria">Pria</option>
                    <option value="unisex">Unisex</option>
                    <option value="semua">Semua</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Deskripsi Aroma</label>
                <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} placeholder="Ceritakan karakter aromanya" className="mt-1 w-full px-3 py-2 border border-border rounded-md" />
              </div>
              <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Heart className="w-4 h-4"/>} Kirim Request
              </button>
            </form>
          </motion.div>

          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-white rounded-2xl p-6 shadow-md border border-caisy-gold/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-caisy-burgundy flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Top Request</h2>
                <p className="text-xs text-muted-foreground">{useFirebase ? 'Realtime via Firebase' : 'Update setiap 5 detik'}</p>
              </div>
              <div className="text-xs uppercase tracking-widest text-caisy-gold">Live •</div>
            </div>
            {topList.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">Belum ada request. Jadilah yang pertama!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topList.map((t, i) => (
                  <motion.div key={t.name} layout initial={{opacity:0}} animate={{opacity:1}} className="">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <p className="font-semibold text-sm">#{i+1} {t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.brand} • {t.gender}</p>
                      </div>
                      <p className="font-display font-bold text-caisy-burgundy">{t.count} <span className="text-xs text-muted-foreground font-normal">request</span></p>
                    </div>
                    <div className="h-2 rounded-full bg-caisy-gold/20 overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width: `${total ? (t.count/total)*100 : 0}%`}} transition={{duration: 0.6}} className="h-full gold-gradient" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
