'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header, Footer, WhatsAppButton } from '@/components/layout-parts'
import { useAuth } from '@/components/providers'
import { toast } from 'sonner'
import { Loader2, User, Mail, Phone, Lock } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, updateProfile } = useAuth()
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    setForm({ name: user.name, email: user.email, phone: user.phone || '', password: '' })
  }, [user, authLoading])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { name: form.name, email: form.email, phone: form.phone }
      if (form.password) payload.password = form.password
      await updateProfile(payload)
      toast.success('Profil berhasil diupdate!')
      setForm(f => ({ ...f, password: '' }))
    } catch(e) { toast.error(e.message) }
    setSaving(false)
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <h1 className="font-display text-4xl font-bold text-caisy-burgundy mb-6">Profil Saya</h1>
        <form onSubmit={submit} className="bg-white rounded-2xl p-6 shadow-sm border border-caisy-gold/20 space-y-4">
          <div><label className="text-sm font-semibold flex items-center gap-2"><User className="w-4 h-4"/> Nama</label><input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
          <div><label className="text-sm font-semibold flex items-center gap-2"><Mail className="w-4 h-4"/> Email</label><input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
          <div><label className="text-sm font-semibold flex items-center gap-2"><Phone className="w-4 h-4"/> No. HP</label><input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
          <div><label className="text-sm font-semibold flex items-center gap-2"><Lock className="w-4 h-4"/> Password Baru (kosongkan jika tidak diubah)</label><input type="password" value={form.password} onChange={e=>setForm({...form, password: e.target.value})} className="mt-1 w-full px-3 py-2.5 border border-border rounded-md" /></div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan Perubahan
          </button>
        </form>
      </div>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
