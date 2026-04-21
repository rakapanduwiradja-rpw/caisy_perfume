'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { useAuth } from '@/components/providers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [form, setForm] = useState({ email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success('Selamat datang, ' + user.name + '!')
      router.push(user.role === 'admin' ? '/admin' : '/')
    } catch(e) { toast.error(e.message) }
    setLoading(false)
  }
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold text-caisy-burgundy">Masuk</h1>
          <p className="text-muted-foreground">Selamat datang kembali</p>
        </div>
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-md border border-caisy-gold/20 space-y-4">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin"/>} Masuk
          </button>
          <p className="text-sm text-center text-muted-foreground">Belum punya akun? <Link href="/register" className="text-caisy-burgundy font-semibold hover:underline">Daftar</Link></p>
        </form>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
