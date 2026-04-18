'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { useCart, useAuth } from '@/components/providers'
import { formatRupiah } from '@/lib/utils'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, MapPin, User, Truck, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, totalWeight, count, clear } = useCart()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    province_id: '', city_id: '', district_id: '',
    address_detail: '', postal_code: '', notes: '',
  })
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  const [rates, setRates] = useState([])
  const [selectedRate, setSelectedRate] = useState(null)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [paying, setPaying] = useState(false)
  const [orderId, setOrderId] = useState(null)

  useEffect(() => {
    if (count === 0) { router.push('/cart'); return }
    fetch('/api/location/provinces').then(r=>r.json()).then(d => setProvinces(d.provinces))
    if (user) setForm(f => ({ ...f, guest_name: user.name, guest_email: user.email, guest_phone: user.phone || '' }))
  }, [user, count])

  const onProvince = async (pid) => {
    setForm(f => ({ ...f, province_id: pid, city_id: '', district_id: '' }))
    setCities([]); setDistricts([]); setRates([]); setSelectedRate(null)
    if (pid) {
      const r = await fetch(`/api/location/cities?province_id=${pid}`)
      const d = await r.json(); setCities(d.cities)
    }
  }
  const onCity = async (cid) => {
    setForm(f => ({ ...f, city_id: cid, district_id: '' }))
    setDistricts([]); setRates([]); setSelectedRate(null)
    if (cid) {
      const r = await fetch(`/api/location/districts?city_id=${cid}`)
      const d = await r.json(); setDistricts(d.districts)
    }
  }
  const checkRates = async () => {
    if (!form.district_id) { toast.error('Pilih kecamatan dulu'); return }
    setCalculatingShipping(true); setRates([])
    const r = await fetch('/api/shipping/rates', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ district_id: form.district_id, weight: totalWeight, subtotal }) })
    const d = await r.json()
    setRates(d.rates || [])
    setCalculatingShipping(false)
  }

  const stepValid = (s) => {
    if (s === 1) return form.guest_name && form.guest_email && form.guest_phone
    if (s === 2) return form.province_id && form.city_id && form.district_id && form.address_detail
    if (s === 3) return !!selectedRate
    return true
  }

  const createOrder = async () => {
    if (!selectedRate) return
    setPaying(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          ...form,
          shipping_carrier: selectedRate.courier, shipping_service: selectedRate.service,
          shipping_etd: selectedRate.etd, shipping_cost: selectedRate.price,
        })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setOrderId(d.order.id)
      // Create Midtrans transaction
      const r2 = await fetch('/api/payment/create-transaction', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ order_id: d.order.id }) })
      const d2 = await r2.json()
      if (!r2.ok) throw new Error(d2.error)
      if (typeof window !== 'undefined' && window.snap) {
        window.snap.pay(d2.snap_token, {
          onSuccess: () => { clear(); router.push(`/order/success?order_id=${d.order.id}`) },
          onPending: () => { clear(); router.push(`/order/pending?order_id=${d.order.id}`) },
          onError: () => router.push(`/order/failed?order_id=${d.order.id}`),
          onClose: () => { toast.error('Pembayaran dibatalkan. Silakan coba lagi.'); setPaying(false) }
        })
      } else {
        toast.error('Snap belum siap. Refresh halaman.')
        setPaying(false)
      }
    } catch(e) {
      toast.error('Gagal: ' + e.message); setPaying(false)
    }
  }

  const totalAmount = subtotal + (selectedRate?.price || 0)

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-6">Checkout</h1>

        {/* Steps indicator */}
        <div className="flex justify-center mb-8">
          {[
            { n: 1, l: 'Info', icon: User },
            { n: 2, l: 'Alamat', icon: MapPin },
            { n: 3, l: 'Kurir', icon: Truck },
            { n: 4, l: 'Bayar', icon: CreditCard },
          ].map((s, i, arr) => (
            <div key={s.n} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.n ? 'bg-caisy-burgundy text-white' : 'bg-white border border-border text-muted-foreground'}`}>
                {step > s.n ? <CheckCircle2 className="w-5 h-5"/> : <s.icon className="w-4 h-4"/>}
              </div>
              {i < arr.length-1 && <div className={`w-12 md:w-20 h-0.5 ${step > s.n ? 'bg-caisy-burgundy' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20">
            {step === 1 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="font-display text-2xl font-bold text-caisy-burgundy mb-4">Informasi Pembeli</h2>
                <div className="space-y-3">
                  <div><label className="text-sm font-semibold">Nama Lengkap *</label><input value={form.guest_name} onChange={e=>setForm({...form, guest_name: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
                  <div><label className="text-sm font-semibold">Email *</label><input type="email" value={form.guest_email} onChange={e=>setForm({...form, guest_email: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
                  <div><label className="text-sm font-semibold">No. HP (WhatsApp) *</label><input value={form.guest_phone} onChange={e=>setForm({...form, guest_phone: e.target.value})} required placeholder="08..." className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
                  <div><label className="text-sm font-semibold">Catatan (opsional)</label><textarea value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} rows={2} className="mt-1 w-full px-3 py-2 border border-border rounded-md" /></div>
                </div>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="font-display text-2xl font-bold text-caisy-burgundy mb-4">Alamat Pengiriman</h2>
                <div className="space-y-3">
                  <div><label className="text-sm font-semibold">Provinsi *</label>
                    <select value={form.province_id} onChange={e=>onProvince(e.target.value)} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md bg-white">
                      <option value="">Pilih provinsi</option>
                      {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-sm font-semibold">Kota *</label>
                    <select value={form.city_id} onChange={e=>onCity(e.target.value)} required disabled={!cities.length} className="mt-1 w-full px-3 py-2.5 border border-border rounded-md bg-white disabled:opacity-50">
                      <option value="">Pilih kota</option>
                      {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-sm font-semibold">Kecamatan *</label>
                    <select value={form.district_id} onChange={e=>setForm({...form, district_id: e.target.value})} required disabled={!districts.length} className="mt-1 w-full px-3 py-2.5 border border-border rounded-md bg-white disabled:opacity-50">
                      <option value="">Pilih kecamatan</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div><label className="text-sm font-semibold">Kode Pos</label><input value={form.postal_code} onChange={e=>setForm({...form, postal_code: e.target.value})} className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
                  <div><label className="text-sm font-semibold">Alamat Lengkap *</label><textarea value={form.address_detail} onChange={e=>setForm({...form, address_detail: e.target.value})} rows={3} required placeholder="Nama jalan, nomor rumah, RT/RW, patokan" className="mt-1 w-full px-3 py-2 border border-border rounded-md" /></div>
                </div>
              </motion.div>
            )}
            {step === 3 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="font-display text-2xl font-bold text-caisy-burgundy mb-4">Pilih Kurir</h2>
                {rates.length === 0 ? (
                  <button onClick={checkRates} disabled={calculatingShipping} className="btn-primary flex items-center gap-2">
                    {calculatingShipping && <Loader2 className="w-4 h-4 animate-spin"/>}
                    Cek Ongkir
                  </button>
                ) : (
                  <div className="space-y-2">
                    {rates.map((r, i) => (
                      <label key={i} className={`block p-4 rounded-xl border-2 cursor-pointer transition ${selectedRate === r ? 'border-caisy-burgundy bg-caisy-burgundy/5' : 'border-border hover:border-caisy-gold'}`}>
                        <input type="radio" name="rate" checked={selectedRate === r} onChange={()=>setSelectedRate(r)} className="sr-only" />
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{r.courier} • {r.service}</p>
                            <p className="text-xs text-muted-foreground">Estimasi: {r.etd}</p>
                          </div>
                          <p className="font-display font-bold text-caisy-burgundy">{formatRupiah(r.price)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
            {step === 4 && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                <h2 className="font-display text-2xl font-bold text-caisy-burgundy mb-4">Konfirmasi & Bayar</h2>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-semibold mb-1">Pembeli</p>
                    <p>{form.guest_name} • {form.guest_email} • {form.guest_phone}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Alamat</p>
                    <p className="text-muted-foreground">{form.address_detail}, {districts.find(d=>d.id===form.district_id)?.name}, {cities.find(c=>c.id===form.city_id)?.name}, {provinces.find(p=>p.id===form.province_id)?.name} {form.postal_code}</p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Kurir</p>
                    <p>{selectedRate.courier} - {selectedRate.service} ({selectedRate.etd}) • {formatRupiah(selectedRate.price)}</p>
                  </div>
                  {form.notes && <div><p className="font-semibold">Catatan</p><p className="text-muted-foreground">{form.notes}</p></div>}
                </div>
                <button onClick={createOrder} disabled={paying} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
                  {paying ? <Loader2 className="w-4 h-4 animate-spin"/> : <CreditCard className="w-4 h-4"/>} Bayar Sekarang ({formatRupiah(totalAmount)})
                </button>
              </motion.div>
            )}
            <div className="flex justify-between mt-6 pt-4 border-t border-border">
              <button onClick={()=>setStep(Math.max(1, step-1))} disabled={step === 1} className="btn-outline disabled:opacity-50">Kembali</button>
              {step < 4 && <button onClick={()=>{ if(stepValid(step)) setStep(step+1); else toast.error('Lengkapi data dulu') }} className="btn-primary">Lanjut</button>}
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20 sticky top-24">
              <h3 className="font-display text-lg font-bold mb-3 text-caisy-burgundy">Ringkasan Pesanan</h3>
              <div className="space-y-2 mb-4 max-h-64 overflow-auto">
                {items.map(i => (
                  <div key={i.product_id} className="flex gap-2 items-center text-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={i.image_url} alt={i.name} className="w-12 h-12 rounded object-cover" />
                    <div className="flex-1">
                      <p className="font-medium line-clamp-1">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.quantity} x {formatRupiah(i.price)}</p>
                    </div>
                    <p className="font-semibold">{formatRupiah(i.price * i.quantity)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between"><span>Ongkir</span><span>{selectedRate ? formatRupiah(selectedRate.price) : '-'}</span></div>
                <div className="flex justify-between font-bold pt-2 border-t border-border mt-2"><span>Total</span><span className="font-display text-xl text-caisy-burgundy">{formatRupiah(totalAmount)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
