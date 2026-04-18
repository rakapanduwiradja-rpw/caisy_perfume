'use client'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ store_name: '', description: '', whatsapp_cs: '', email_cs: '', maintenance_mode: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r=>r.json()).then(d => { if(d.settings) setForm(d.settings); setLoading(false) })
  }, [])

  const save = async (e) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/admin/settings', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(form) })
    toast.success('Pengaturan disimpan'); setSaving(false)
  }

  if (loading) return <Loader2 className="w-8 h-8 animate-spin mx-auto"/>

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-caisy-burgundy mb-6">Pengaturan</h1>
      <form onSubmit={save} className="bg-white rounded-xl p-6 border border-caisy-gold/20 shadow-sm max-w-2xl space-y-4">
        <div><label className="text-sm font-semibold">Nama Toko</label><input value={form.store_name} onChange={e=>setForm({...form, store_name: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded"/></div>
        <div><label className="text-sm font-semibold">Deskripsi</label><textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={2} className="mt-1 w-full px-3 py-2 border rounded"/></div>
        <div><label className="text-sm font-semibold">WhatsApp CS</label><input value={form.whatsapp_cs} onChange={e=>setForm({...form, whatsapp_cs: e.target.value})} placeholder="6281234567890" className="mt-1 w-full px-3 py-2 border rounded"/></div>
        <div><label className="text-sm font-semibold">Email CS</label><input type="email" value={form.email_cs} onChange={e=>setForm({...form, email_cs: e.target.value})} className="mt-1 w-full px-3 py-2 border rounded"/></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.maintenance_mode} onChange={e=>setForm({...form, maintenance_mode: e.target.checked})}/> Mode Maintenance</label>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan</button>
      </form>
    </div>
  )
}
