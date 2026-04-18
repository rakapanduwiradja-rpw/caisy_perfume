'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Loader2, Search, Edit2, X } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['pending','paid','processing','shipped','delivered','cancelled']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [tracking, setTracking] = useState('')

  const load = () => { setLoading(true); fetch('/api/admin/orders').then(r=>r.json()).then(d => { setOrders(d.orders || []); setLoading(false) }) }
  useEffect(load, [])

  const filtered = orders.filter(o =>
    (!search || o.order_code.toLowerCase().includes(search.toLowerCase()) || (o.guest_name||'').toLowerCase().includes(search.toLowerCase()) || (o.guest_email||'').toLowerCase().includes(search.toLowerCase()))
    && (!statusFilter || o.status === statusFilter)
  )

  const updateStatus = async () => {
    await fetch(`/api/admin/orders/${editing.id}/status`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status: newStatus, tracking_number: tracking || undefined }) })
    toast.success('Status diupdate')
    setEditing(null); setTracking(''); load()
  }

  const exportCSV = () => {
    const rows = [['Kode','Pelanggan','Email','Total','Status','Tanggal']]
    orders.forEach(o => rows.push([o.order_code, o.guest_name||'', o.guest_email||'', o.total_amount, o.status, formatDate(o.created_at)]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-caisy-burgundy">Pesanan</h1>
        <button onClick={exportCSV} className="btn-outline text-sm">Export CSV</button>
      </div>
      <div className="bg-white rounded-xl p-4 border border-caisy-gold/20 shadow-sm mb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari kode / nama / email..." className="pl-9 pr-3 py-2 w-full border border-border rounded-md text-sm"/>
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground"/>
        </div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-md text-sm bg-white">
          <option value="">Semua Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : (
        <div className="bg-white rounded-xl border border-caisy-gold/20 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-caisy-gold/10 text-xs uppercase text-left">
              <tr><th className="p-3">Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Tanggal</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-t hover:bg-caisy-gold/5">
                  <td className="p-3 font-mono text-xs">{o.order_code}</td>
                  <td><p className="font-medium">{o.guest_name}</p><p className="text-xs text-muted-foreground">{o.guest_email}</p></td>
                  <td className="font-semibold">{formatRupiah(o.total_amount)}</td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full bg-caisy-gold/20 text-caisy-burgundy">{o.status}</span></td>
                  <td className="text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                  <td className="flex gap-1 p-3">
                    <Link href={`/orders/${o.id}`} target="_blank" className="text-xs px-2 py-1 bg-caisy-gold/20 rounded hover:bg-caisy-gold/40">Lihat</Link>
                    <button onClick={()=>{setEditing(o); setNewStatus(o.status); setTracking(o.tracking_number||'')}} className="p-1 hover:bg-caisy-gold/20 rounded"><Edit2 className="w-4 h-4"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setEditing(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-caisy-burgundy">Update Status Pesanan</h3>
              <button onClick={()=>setEditing(null)}><X/></button>
            </div>
            <p className="text-sm mb-3">{editing.order_code}</p>
            <label className="text-sm font-semibold">Status Baru</label>
            <select value={newStatus} onChange={e=>setNewStatus(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded bg-white">
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {newStatus === 'shipped' && (
              <>
                <label className="text-sm font-semibold mt-3 block">Nomor Resi</label>
                <input value={tracking} onChange={e=>setTracking(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded"/>
              </>
            )}
            <button onClick={updateStatus} className="btn-primary w-full mt-4">Simpan</button>
          </div>
        </div>
      )}
    </div>
  )
}
