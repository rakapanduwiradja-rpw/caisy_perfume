'use client'
import { useEffect, useState } from 'react'
import { formatRupiah, formatDate } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/customers').then(r=>r.json()).then(d => { setCustomers(d.customers || []); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-caisy-burgundy mb-6">Pelanggan</h1>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : (
        <div className="bg-white rounded-xl border border-caisy-gold/20 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-caisy-gold/10 text-xs uppercase text-left">
              <tr><th className="p-3">Nama</th><th>Email</th><th>HP</th><th>Daftar</th><th>Pesanan</th><th>Total Belanja</th></tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-t hover:bg-caisy-gold/5">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone || '-'}</td>
                  <td className="text-xs text-muted-foreground">{formatDate(c.created_at)}</td>
                  <td className="font-semibold">{c.order_count}</td>
                  <td className="font-semibold text-caisy-burgundy">{formatRupiah(c.total_spend)}</td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Belum ada pelanggan</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
