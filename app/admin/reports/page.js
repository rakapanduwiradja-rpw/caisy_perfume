'use client'
import { useEffect, useState } from 'react'
import { formatRupiah } from '@/lib/utils'
import { Loader2, Download } from 'lucide-react'

export default function AdminReportsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    fetch('/api/admin/reports?' + params.toString()).then(r=>r.json()).then(d => { setData(d); setLoading(false) })
  }
  useEffect(load, [])

  const exportCSV = () => {
    if (!data) return
    const rows = [['Produk','Terjual','Revenue']]
    data.topProducts.forEach(p => rows.push([p.name, p.quantity, p.revenue]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; a.click()
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-caisy-burgundy mb-6">Laporan Penjualan</h1>
      <div className="bg-white rounded-xl p-4 border border-caisy-gold/20 shadow-sm mb-4 flex flex-wrap items-end gap-3">
        <div><label className="text-xs">Dari</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="block px-3 py-2 border rounded text-sm"/></div>
        <div><label className="text-xs">Sampai</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} className="block px-3 py-2 border rounded text-sm"/></div>
        <button onClick={load} className="btn-primary">Terapkan</button>
        {data && <button onClick={exportCSV} className="btn-outline flex items-center gap-2 text-sm"><Download className="w-4 h-4"/> Export CSV</button>}
      </div>

      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : data && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-5 border border-caisy-gold/20 shadow-sm">
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="font-display font-bold text-2xl text-caisy-burgundy">{formatRupiah(data.totalRevenue)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-caisy-gold/20 shadow-sm">
              <p className="text-xs text-muted-foreground">Total Pesanan Terbayar</p>
              <p className="font-display font-bold text-2xl text-caisy-burgundy">{data.orderCount}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-caisy-gold/20 shadow-sm">
            <h3 className="font-display font-bold text-lg mb-3">Top 10 Produk Terlaris</h3>
            <table className="w-full text-sm">
              <thead className="bg-caisy-gold/10 text-xs uppercase text-left"><tr><th className="p-3">#</th><th>Produk</th><th>Terjual</th><th>Revenue</th></tr></thead>
              <tbody>
                {data.topProducts?.map((p, i) => (
                  <tr key={p.product_id} className="border-t"><td className="p-3 font-bold">{i+1}</td><td>{p.name}</td><td className="font-semibold">{p.quantity}</td><td className="font-semibold text-caisy-burgundy">{formatRupiah(p.revenue)}</td></tr>
                ))}
                {data.topProducts?.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Belum ada penjualan</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
