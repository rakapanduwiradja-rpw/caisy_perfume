'use client'
import { useEffect, useState } from 'react'
import { formatRupiah, stockStatus, formatDate } from '@/lib/utils'
import { Loader2, X, Plus, Minus, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminStockPage() {
  const [stock, setStock] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showLogs, setShowLogs] = useState(false)
  const [adjusting, setAdjusting] = useState(null)
  const [adjForm, setAdjForm] = useState({ quantity_change: 0, reason: 'Restock Barang Masuk', notes: '' })

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/stock').then(r=>r.json()),
      fetch('/api/admin/stock/logs').then(r=>r.json()),
    ]).then(([s, l]) => { setStock(s.stock || []); setLogs(l.logs || []); setLoading(false) })
  }
  useEffect(load, [])

  const adjust = async () => {
    try {
      const r = await fetch('/api/admin/stock/adjust', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ product_id: adjusting.id, quantity_change: parseInt(adjForm.quantity_change), reason: adjForm.reason, notes: adjForm.notes }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(`Stok berhasil → ${d.new_stock}`)
      setAdjusting(null); setAdjForm({ quantity_change: 0, reason: 'Restock Barang Masuk', notes: '' }); load()
    } catch(e) { toast.error(e.message) }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-caisy-burgundy">Manajemen Stok</h1>
        <button onClick={()=>setShowLogs(!showLogs)} className="btn-outline flex items-center gap-2 text-sm"><FileText className="w-4 h-4"/> {showLogs ? 'Lihat Stok' : 'Riwayat Perubahan'}</button>
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : showLogs ? (
        <div className="bg-white rounded-xl border border-caisy-gold/20 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-caisy-gold/10 text-xs uppercase text-left">
              <tr><th className="p-3">Tanggal</th><th>Produk</th><th>Jenis</th><th>Perubahan</th><th>Sebelum</th><th>Sesudah</th><th>Alasan</th></tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-t">
                  <td className="p-3 text-xs text-muted-foreground">{formatDate(l.created_at)}</td>
                  <td className="font-medium">{l.product_name}</td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full ${l.type === 'purchase' ? 'bg-blue-100 text-blue-700' : l.type === 'manual_increase' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{l.type}</span></td>
                  <td className={`font-bold ${l.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>{l.quantity_change > 0 ? '+' : ''}{l.quantity_change}</td>
                  <td>{l.stock_before}</td>
                  <td>{l.stock_after}</td>
                  <td className="text-xs">{l.reason}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Belum ada riwayat</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-caisy-gold/20 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-caisy-gold/10 text-xs uppercase text-left">
              <tr><th className="p-3">Produk</th><th>Kategori</th><th>Stok</th><th>Terjual</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {stock.map(p => {
                const s = stockStatus(p.stock)
                return (
                  <tr key={p.id} className="border-t hover:bg-caisy-gold/5">
                    <td className="p-3 flex items-center gap-3">
                      <img src={p.image_url} alt="" className="w-10 h-12 object-cover rounded"/>
                      <span className="font-medium">{p.name}</span>
                    </td>
                    <td className="text-xs uppercase">{p.category}</td>
                    <td className="font-bold text-lg">{p.stock}</td>
                    <td>{p.total_sold || 0}</td>
                    <td><span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span></td>
                    <td><button onClick={()=>setAdjusting(p)} className="btn-outline !py-1 !px-3 text-xs">Sesuaikan</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {adjusting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>setAdjusting(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="font-display text-xl font-bold text-caisy-burgundy">Sesuaikan Stok</h3>
              <button onClick={()=>setAdjusting(null)}><X/></button>
            </div>
            <p className="font-semibold">{adjusting.name}</p>
            <p className="text-sm text-muted-foreground mb-4">Stok saat ini: <span className="font-bold">{adjusting.stock}</span></p>
            <label className="text-sm font-semibold">Jumlah (positif untuk menambah, negatif untuk mengurangi)</label>
            <div className="flex items-center mt-1 gap-2">
              <button onClick={()=>setAdjForm({...adjForm, quantity_change: adjForm.quantity_change - 1})} className="p-2 border rounded"><Minus className="w-4 h-4"/></button>
              <input type="number" value={adjForm.quantity_change} onChange={e=>setAdjForm({...adjForm, quantity_change: e.target.value})} className="flex-1 px-3 py-2 border rounded text-center font-bold"/>
              <button onClick={()=>setAdjForm({...adjForm, quantity_change: adjForm.quantity_change + 1})} className="p-2 border rounded"><Plus className="w-4 h-4"/></button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stok setelah: <span className="font-bold text-caisy-burgundy">{adjusting.stock + parseInt(adjForm.quantity_change || 0)}</span></p>
            <label className="text-sm font-semibold mt-3 block">Alasan</label>
            <select value={adjForm.reason} onChange={e=>setAdjForm({...adjForm, reason: e.target.value})} className="w-full mt-1 px-3 py-2 border rounded bg-white">
              <option>Restock Barang Masuk</option><option>Koreksi Stok</option><option>Barang Rusak/Hilang</option><option>Retur</option><option>Lainnya</option>
            </select>
            <label className="text-sm font-semibold mt-3 block">Catatan (opsional)</label>
            <textarea value={adjForm.notes} onChange={e=>setAdjForm({...adjForm, notes: e.target.value})} rows={2} className="w-full mt-1 px-3 py-2 border rounded text-sm"/>
            <button onClick={adjust} className="btn-primary w-full mt-4">Simpan</button>
          </div>
        </div>
      )}
    </div>
  )
}
