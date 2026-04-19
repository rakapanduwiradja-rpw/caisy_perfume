'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { Plus, Edit2, Trash2, Loader2, X, Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

function BannerForm({ banner, onClose, onSaved }) {
  const [form, setForm] = useState(banner || { image_url: '', title: '', subtitle: '', link_url: '', voucher_code: '', is_active: true, order: 0 })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('File max 5MB'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const r = await fetch('/api/admin/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ data: reader.result, contentType: file.type, filename: file.name }) })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setForm(f => ({ ...f, image_url: d.url }))
        toast.success('Gambar terupload!')
      } catch(e) { toast.error(e.message) }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const url = banner ? `/api/admin/banners/${banner.id}` : '/api/admin/banners'
      const method = banner ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Banner tersimpan!')
      onSaved(); onClose()
    } catch(e) { toast.error(e.message) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl font-bold text-caisy-primary">{banner ? 'Edit Banner' : 'Tambah Banner'}</h2>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Gambar Banner * (rekomendasi 1920x600px, max 5MB)</label>
            <div className="mt-1 flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-caisy-primary text-white rounded text-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Upload File
                <input type="file" accept="image/*" className="hidden" onChange={e=>uploadFile(e.target.files[0])}/>
              </label>
              <span className="text-xs text-muted-foreground">atau paste URL di bawah</span>
            </div>
            <input value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} placeholder="https://... atau /api/files/..." className="mt-2 w-full px-3 py-2 border rounded text-sm"/>
            {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 w-full h-40 object-cover rounded border"/>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Judul</label><input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="Flash Sale!" className="mt-1 w-full px-3 py-2 border rounded"/></div>
            <div><label className="text-xs font-semibold">Subjudul</label><input value={form.subtitle} onChange={e=>setForm({...form, subtitle: e.target.value})} placeholder="Diskon hingga 50%" className="mt-1 w-full px-3 py-2 border rounded"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Link URL (saat diklik)</label><input value={form.link_url} onChange={e=>setForm({...form, link_url: e.target.value})} placeholder="/catalog" className="mt-1 w-full px-3 py-2 border rounded"/></div>
            <div><label className="text-xs font-semibold">Kode Voucher (opsional)</label><input value={form.voucher_code} onChange={e=>setForm({...form, voucher_code: e.target.value.toUpperCase()})} placeholder="DISKON50" className="mt-1 w-full px-3 py-2 border rounded uppercase font-mono"/></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Urutan (0=pertama)</label><input type="number" value={form.order} onChange={e=>setForm({...form, order: parseInt(e.target.value) || 0})} className="mt-1 w-full px-3 py-2 border rounded"/></div>
            <label className="flex items-end gap-2 text-sm pb-2"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active: e.target.checked})}/> Aktif</label>
          </div>
          <button type="submit" disabled={saving || !form.image_url} className="btn-primary w-full flex items-center justify-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan Banner</button>
        </form>
      </div>
    </div>
  )
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => { setLoading(true); fetch('/api/admin/banners').then(r=>r.json()).then(d => { setBanners(d.banners || []); setLoading(false) }) }
  useEffect(load, [])

  const del = async (id) => {
    if (!confirm('Hapus banner ini?')) return
    await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
    toast.success('Banner dihapus'); load()
  }
  const toggleActive = async (b) => {
    await fetch(`/api/admin/banners/${b.id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_active: !b.is_active }) })
    load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-caisy-primary">Banner Promosi</h1>
        <button onClick={()=>{setEditing(null); setShowForm(true)}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah Banner</button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Maksimal 3 banner aktif akan ditampilkan sebagai slider di homepage.</p>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : banners.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border">
          <ImageIcon className="w-12 h-12 mx-auto text-caisy-primary mb-3"/>
          <p className="font-display text-xl">Belum ada banner</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-xl overflow-hidden border shadow-sm flex flex-col md:flex-row">
              <div className="md:w-80 h-48 shrink-0 bg-gray-100">{b.image_url && <img src={b.image_url} alt={b.title} className="w-full h-full object-cover"/>}</div>
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-display font-bold text-lg">{b.title || '(Tanpa judul)'}</p>
                    <p className="text-sm text-muted-foreground">{b.subtitle}</p>
                    {b.voucher_code && <p className="text-xs mt-1">Voucher: <code className="bg-caisy-gold/10 px-1 rounded">{b.voucher_code}</code></p>}
                    {b.link_url && <p className="text-xs mt-1 text-muted-foreground">Link: {b.link_url}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{b.is_active ? 'Aktif' : 'Nonaktif'}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">Urutan: {b.order}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={()=>{setEditing(b); setShowForm(true)}} className="text-xs px-3 py-1.5 bg-caisy-gold/20 rounded flex items-center gap-1 hover:bg-caisy-gold/40"><Edit2 className="w-3 h-3"/> Edit</button>
                  <button onClick={()=>toggleActive(b)} className="text-xs px-3 py-1.5 border rounded">{b.is_active ? 'Matikan' : 'Aktifkan'}</button>
                  <button onClick={()=>del(b.id)} className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded flex items-center gap-1 hover:bg-red-100"><Trash2 className="w-3 h-3"/> Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && <BannerForm banner={editing} onClose={()=>setShowForm(false)} onSaved={load}/>}
    </div>
  )
}
