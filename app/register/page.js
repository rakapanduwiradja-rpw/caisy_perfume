'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { useAuth } from '@/components/providers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', phone:'' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Password tidak sama'); return }
    if (form.password.length < 6) { toast.error('Password minimal 6 karakter'); return }
    setLoading(true)
    try {
      const user = await register({ name: form.name, email: form.email, password: form.password, phone: form.phone })
      toast.success('Selamat datang di Caisy Perfume, ' + user.name + '!')
      router.push('/')
    } catch(e) { toast.error(e.message) }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-caisy-burgundy">Daftar</h1>
          <p className="text-muted-foreground">Gabung komunitas parfum Caisy</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-md border border-caisy-gold/20 space-y-4">
          <div>
            <label className="text-sm font-semibold">Nama Lengkap</label>
            <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <div>
            <label className="text-sm font-semibold">No. HP</label>
            <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="08..." className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <div>
            <label className="text-sm font-semibold">Password (min 6)</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <div>
            <label className="text-sm font-semibold">Konfirmasi Password</label>
            <input type="password" value={form.confirm} onChange={e=>setForm({...form, confirm: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin"/>} Daftar
          </button>
          <p className="text-sm text-center text-muted-foreground">Sudah punya akun? <Link href="/login" className="text-caisy-burgundy font-semibold hover:underline">Masuk</Link></p>
        </form>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
