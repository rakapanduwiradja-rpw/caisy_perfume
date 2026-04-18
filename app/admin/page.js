'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatRupiah, formatDate } from '@/lib/utils'
import { DollarSign, ShoppingBag, Package, Users, AlertTriangle, Loader2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts'

const COLORS = ['#7B1E2C', '#C9A96E', '#1A1A2E']

export default function AdminDashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r=>r.json()).then(setData)
  }, [])

  if (!data) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin"/></div>

  const pieData = Object.entries(data.categoryDistribution || {}).map(([k, v]) => ({ name: k, value: v }))

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-caisy-burgundy mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Revenue Hari Ini', value: formatRupiah(data.revenueToday), icon: DollarSign, color: 'bg-green-100 text-green-700' },
          { label: 'Revenue Bulan Ini', value: formatRupiah(data.revenueMonth), icon: DollarSign, color: 'bg-blue-100 text-blue-700' },
          { label: 'Pesanan Hari Ini', value: data.ordersToday, icon: ShoppingBag, color: 'bg-purple-100 text-purple-700' },
          { label: 'Pesanan Bulan Ini', value: data.ordersMonth, icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-700' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-5 border border-caisy-gold/20 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${s.color} flex items-center justify-center mb-2`}><s.icon className="w-5 h-5"/></div>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="font-display font-bold text-xl">{s.value}</p>
          </div>
        ))}
      </div>

      {data.criticalStock?.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-red-700 flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5"/> Stok Kritis ({data.criticalStock.length} produk)</h3>
          <div className="flex flex-wrap gap-2">
            {data.criticalStock.map(p => (
              <Link key={p.id} href="/admin/stock" className="px-3 py-1 bg-white rounded-full text-xs border border-red-300 hover:bg-red-100">{p.name} <span className="text-red-700 font-bold">({p.stock})</span></Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-xl p-5 border border-caisy-gold/20 shadow-sm lg:col-span-2">
          <h3 className="font-display font-bold text-lg mb-3">Penjualan 7 Hari Terakhir</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.salesChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
              <XAxis dataKey="date" tickFormatter={(d)=>d.slice(5)} />
              <YAxis tickFormatter={(v)=>`${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v)=>formatRupiah(v)} />
              <Line type="monotone" dataKey="total" stroke="#7B1E2C" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl p-5 border border-caisy-gold/20 shadow-sm">
          <h3 className="font-display font-bold text-lg mb-3">Distribusi Kategori</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 border border-caisy-gold/20 shadow-sm">
        <h3 className="font-display font-bold text-lg mb-3">5 Pesanan Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground border-b"><tr>
              <th className="py-2">Kode</th><th>Pelanggan</th><th>Total</th><th>Status</th><th>Tanggal</th>
            </tr></thead>
            <tbody>
              {data.latestOrders?.map(o => (
                <tr key={o.id} className="border-b hover:bg-caisy-gold/5">
                  <td className="py-2 font-mono text-xs">{o.order_code}</td>
                  <td>{o.guest_name || 'Guest'}</td>
                  <td className="font-semibold">{formatRupiah(o.total_amount)}</td>
                  <td><span className="text-xs px-2 py-0.5 rounded-full bg-caisy-gold/20 text-caisy-burgundy">{o.status}</span></td>
                  <td className="text-xs text-muted-foreground">{formatDate(o.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
