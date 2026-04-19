'use client'
import { useEffect, useState } from 'react'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Plus, Edit2, Trash2, Loader2, X, Tag, Copy } from 'lucide-react'
import { toast } from 'sonner'

function VoucherForm({ voucher, onClose, onSaved }) {
  const [form, setForm] = useState(voucher || {
    code: '', type: 'percentage', value: 0,
    min_purchase: 0, max_discount: 0, usage_limit: 0,
    valid_from: '', valid_until: '',
    is_active: true, description: '',
  })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const url = voucher ? `/api/admin/vouchers/${voucher.id}` : '/api/admin/vouchers'
      const method = voucher ? 'PUT' : 'POST'
      const payload = { ...form }
      if (payload.valid_from === '') delete payload.valid_from
      if (payload.valid_until === '') delete payload.valid_until
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Voucher tersimpan!')
      onSaved(); onClose()
    } catch(e) { toast.error(e.message) }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-display text-2xl font-bold text-caisy-burgundy">{voucher ? 'Edit Voucher' : 'Tambah Voucher'}</h2>
          <button onClick={onClose}><X/></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Kode Voucher *</label>
            <input value={form.code} onChange={e=>setForm({...form, code: e.target.value.toUpperCase()})} required placeholder="DISKON50" className="w-full mt-1 px-3 py-2 border rounded uppercase font-mono"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Tipe</label>
              <select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded bg-white">
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Potongan Tetap (Rp)</option>
              </select>
            </div>
            <div><label className="text-xs font-semibold">Nilai {form.type === 'percentage' ? '(%)' : '(Rp)'}</label>
              <input type="number" value={form.value} onChange={e=>setForm({...form, value: parseInt(e.target.value) || 0})} required className="w-full mt-1 px-3 py-2 border rounded"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Min. Belanja (Rp)</label>
              <input type="number" value={form.min_purchase} onChange={e=>setForm({...form, min_purchase: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded"/>
            </div>
            <div><label className="text-xs font-semibold">Max. Diskon (Rp){form.type === 'percentage' && ' - untuk persen'}</label>
              <input type="number" value={form.max_discount} onChange={e=>setForm({...form, max_discount: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded" placeholder="0 = tidak ada batas"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Batas Pemakaian (total)</label>
            <input type="number" value={form.usage_limit} onChange={e=>setForm({...form, usage_limit: parseInt(e.target.value) || 0})} className="w-full mt-1 px-3 py-2 border rounded" placeholder="0 = unlimited"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold">Berlaku Dari</label>
              <input type="datetime-local" value={form.valid_from ? String(form.valid_from).slice(0,16) : ''} onChange={e=>setForm({...form, valid_from: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded"/>
            </div>
            <div><label className="text-xs font-semibold">Berlaku Sampai</label>
              <input type="datetime-local" value={form.valid_until ? String(form.valid_until).slice(0,16) : ''} onChange={e=>setForm({...form, valid_until: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded"/>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold">Deskripsi</label>
            <textarea value={form.description} onChange={e=>setForm({...form, description: e.target.value})} rows={2} placeholder="Misal: Promo Ramadan 2024" className="w-full mt-1 px-3 py-2 border rounded text-sm"/>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form, is_active: e.target.checked})}/> Aktif
          </label>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin"/>} Simpan
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminVouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const load = () => { setLoading(true); fetch('/api/admin/vouchers').then(r=>r.json()).then(d => { setVouchers(d.vouchers || []); setLoading(false) }) }
  useEffect(load, [])

  const del = async (id) => {
    if (!confirm('Hapus voucher ini?')) return
    await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' })
    toast.success('Voucher dihapus'); load()
  }

  const toggleActive = async (v) => {
    await fetch(`/api/admin/vouchers/${v.id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_active: !v.is_active }) })
    load()
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    toast.success(`Kode "${code}" disalin!`)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-caisy-burgundy">Voucher Diskon</h1>
        <button onClick={()=>{setEditing(null); setShowForm(true)}} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4"/> Tambah Voucher</button>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : vouchers.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-caisy-gold/20">
          <Tag className="w-12 h-12 mx-auto text-caisy-gold mb-3"/>
          <p className="font-display text-xl">Belum ada voucher</p>
          <p className="text-sm text-muted-foreground">Buat voucher pertama Anda untuk menarik pelanggan</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map(v => {
            const isExpired = v.valid_until && new Date(v.valid_until) < new Date()
            const isExhausted = v.usage_limit && v.used_count >= v.usage_limit
            return (
              <div key={v.id} className={`bg-white rounded-xl p-5 border-2 border-dashed shadow-sm relative overflow-hidden ${v.is_active && !isExpired && !isExhausted ? 'border-caisy-burgundy' : 'border-gray-300 opacity-70'}`}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-caisy-gold/10 -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground">Kode</p>
                    <button onClick={()=>copyCode(v.code)} className="font-mono font-bold text-lg text-caisy-burgundy flex items-center gap-1 hover:underline">
                      {v.code} <Copy className="w-3 h-3"/>
                    </button>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${v.is_active && !isExpired && !isExhausted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {isExpired ? 'Kadaluwarsa' : isExhausted ? 'Habis' : v.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <p className="font-display font-bold text-2xl text-caisy-burgundy">
                  {v.type === 'percentage' ? `${v.value}%` : formatRupiah(v.value)}
                  <span className="text-xs font-normal text-muted-foreground"> diskon</span>
                </p>
                {v.description && <p className="text-sm text-muted-foreground mt-1">{v.description}</p>}
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 text-xs space-y-0.5">
                  {v.min_purchase > 0 && <p>Min. {formatRupiah(v.min_purchase)}</p>}
                  {v.max_discount > 0 && v.type === 'percentage' && <p>Max diskon: {formatRupiah(v.max_discount)}</p>}
                  {v.usage_limit > 0 && <p>Terpakai: <b>{v.used_count}</b>/{v.usage_limit}</p>}
                  {v.valid_until && <p>Berlaku hingga: {formatDate(v.valid_until)}</p>}
                </div>
                <div className="flex gap-1 mt-3 pt-3 border-t border-border">
                  <button onClick={()=>{setEditing(v); setShowForm(true)}} className="flex-1 text-xs px-2 py-1.5 bg-caisy-gold/20 rounded hover:bg-caisy-gold/40 flex items-center justify-center gap-1"><Edit2 className="w-3 h-3"/> Edit</button>
                  <button onClick={()=>toggleActive(v)} className="flex-1 text-xs px-2 py-1.5 border rounded hover:bg-gray-50">{v.is_active ? 'Matikan' : 'Aktifkan'}</button>
                  <button onClick={()=>del(v.id)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-3 h-3"/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {showForm && <VoucherForm voucher={editing} onClose={()=>setShowForm(false)} onSaved={load}/>}
    </div>
  )
}
