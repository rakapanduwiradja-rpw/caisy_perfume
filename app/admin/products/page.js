'use client'
import { useEffect, useState } from 'react'
import { formatRupiah, stockStatus } from '@/lib/utils'
import { Plus, Edit2, Trash2, Loader2, Search, X, Upload } from 'lucide-react'
import { toast } from 'sonner'

function ProductForm({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || {
    name:'', slug:'', category:'wanita', description:'', inspired_by:'',
    top_note:'', middle_note:'', base_note:'',
    price:0, size_ml:30, weight_gram:150, stock:0, image_url:'',
    is_active:true, is_featured:false,
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (file) => {
    if (!file) return
    if (file.size > 5*1024*1024) { toast.error('Max 5MB'); return }
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const r = await fetch('/api/admin/upload', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ data: reader.result, contentType: file.type, filename: file.name }) })
        const d = await r.json(); if (!r.ok) throw new Error(d.error)
        setForm(f => ({ ...f, image_url: d.url })); toast.success('Upload berhasil!')
      } catch(e) { toast.error(e.message) }
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products'
      const method = product ? 'PUT' : 'POST'
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Produk tersimpan!')
      onSaved(); onClose()
    } catch(e) { toast.error(e.message) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl font-bold text-caisy-burgundy">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Nama</label><input value={form.name} onChange={e=>setForm({...form, name: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')})} required className="w-full mt-1 px-3 py-2 border rounded"/></div>
            <div><label className="text-xs font-semibold">Slug</label><input value={form.slug} onChange={e=>setForm({...form, slug: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded"/></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold">Kategori</label>
              <select value={form.category} onChange={e=>setForm({...form, category: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded bg-white">
                <option value="wanita">Wanita</option><option value="pria">Pria</option><option value="unisex">Unisex</option>
              </select>
            </div>
            <div><label className="text-xs font-semibold">Harga</label><input type="number" value={form.price} onChange={e=>setForm({...form, price: parseInt(e.target.value) || 0})} required className="w-full mt-1 px-3 py-2 border rounded"/></div>
            <div><label className="text-xs font-semibold">Stok</label><input type="number" value={form.stock} onChange={e=>setForm({...form, stock: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded"/></div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Size (ml)</label><input type="number" value={form.size_ml} onChange={e=>setForm({...form, size_ml: parseInt(e.target.value) || 30})} className="w-full mt-1 px-3 py-2 border rounded"/></div>
            <div><label className="text-xs font-semibold">Berat (gram)</label><input type="number" value={form.weight_gram} onChange={e=>setForm({...form, weight_gram: parseInt(e.target.value) || 150})} className="w-full mt-1 px-3 py-2 border rounded"/></div>
          </div>
          <div><label className="text-xs font-semibold">Inspired By</label><input value={form.inspired_by} onChange={e=>setForm({...form, inspired_by: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded"/></div>
          <div>
            <label className="text-xs font-semibold">Foto Produk (max 5MB)</label>
            <div className="mt-1 flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-caisy-primary text-white rounded text-sm hover:brightness-110">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4"/>} Upload File
                <input type="file" accept="image/*" className="hidden" onChange={e=>uploadFile(e.target.files[0])}/>
              </label>
              <span className="text-xs text-muted-foreground">atau paste URL di bawah</span>
            </div>
            <input value={form.image_url} onChange={e=>setForm({...form, image_url: e.target.value})} placeholder="https://... atau /api/files/..." className="mt-2 w-full px-3 py-2 border rounded"/>
            {form.image_url && <img src={form.image_url} alt="preview" className="mt-2 w-24 h-28 object-cover rounded" />}
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div><label className="text-xs font-semibold">Top Note</label><textarea value={form.top_note} onChange={e=>setForm({...form, top_note: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2 border rounded text-sm"/></div>
            <div><label className="text-xs font-semibold">Middle Note</label><textarea value={form.middle_note} onChange={e=>setForm({...form, middle_note: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2 border rounded text-sm"/></div>
            <div><label className="text-xs font-semibold">Base Note</label><textarea value={form.base_note} onChange={e=>setForm({...form, base_note: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2 border rounded text-sm"/></div>
          </div>
          <div><label className="text-xs font-semibold">Deskripsi</label><textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={3} className="w-full mt-1 px-3 py-2 border rounded text-sm"/></div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active: e.target.checked})}/> Aktif</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={e=>setForm({...form, is_featured: e.target.checked})}/> Featured</label>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const load = () => { setLoading(true); fetch('/api/admin/products').then(r=>r.json()).then(d => { setProducts(d.products || []); setLoading(false) }) }
  useEffect(load, [])

  const del = async (id) => {
    if (!confirm('Hapus produk ini?')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    toast.success('Produk dihapus'); load()
  }

  const toggleActive = async (p) => {
    await fetch(`/api/admin/products/${p.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ is_active: !p.is_active }) })
    load()
  }

  const filtered = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-caisy-burgundy">Manajemen Produk</h1>
        <button onClick={()=>{setEditing(null); setShowForm(true)}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah Produk</button>
      </div>
      <div className="bg-white rounded-xl p-4 border border-caisy-gold/20 shadow-sm mb-4">
        <div className="relative">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari produk..." className="pl-9 pr-3 py-2 w-full md:w-64 border border-border rounded-md text-sm"/>
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground"/>
        </div>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : (
        <div className="bg-white rounded-xl border border-caisy-gold/20 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-caisy-gold/10 text-xs uppercase text-left">
              <tr><th className="p-3">Foto</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const s = stockStatus(p.stock)
                return (
                  <tr key={p.id} className="border-t hover:bg-caisy-gold/5">
                    <td className="p-3"><img src={p.image_url} alt={p.name} className="w-12 h-14 object-cover rounded"/></td>
                    <td className="font-medium">{p.name}<br/><span className="text-xs text-muted-foreground">{p.inspired_by}</span></td>
                    <td><span className="text-xs px-2 py-0.5 rounded-full bg-caisy-burgundy text-white">{p.category}</span></td>
                    <td className="font-semibold">{formatRupiah(p.price)}</td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{p.stock} • {s.label}</span></td>
                    <td><button onClick={()=>toggleActive(p)} className={`text-xs px-2 py-0.5 rounded ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{p.is_active ? 'Aktif' : 'Nonaktif'}</button></td>
                    <td className="flex gap-1 p-3">
                      <button onClick={()=>{setEditing(p); setShowForm(true)}} className="p-1.5 hover:bg-caisy-gold/20 rounded"><Edit2 className="w-4 h-4"/></button>
                      <button onClick={()=>del(p.id)} className="p-1.5 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {showForm && <ProductForm product={editing} onClose={()=>setShowForm(false)} onSaved={load}/>}
    </div>
  )
}
