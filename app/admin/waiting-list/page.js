'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_OPTIONS = ['open', 'in_progress', 'fulfilled', 'closed']

export default function AdminWaitingListPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); fetch('/api/admin/waiting-list').then(r=>r.json()).then(d => { setItems(d.items || []); setLoading(false) }) }
  useEffect(load, [])

  const updateStatus = async (id, status) => {
    await fetch(`/api/admin/waiting-list/${id}`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ status }) })
    toast.success('Status diupdate')
    load()
  }

  const exportCSV = () => {
    const rows = [['Parfum','Brand','Gender','Request Count','Status','Created']]
    items.forEach(i => rows.push([i.perfume_name, i.brand, i.gender_preference, i.request_count, i.status, formatDate(i.created_at)]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'waiting-list.csv'; a.click()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl font-bold text-caisy-burgundy">Waiting List</h1>
        <button onClick={exportCSV} className="btn-outline text-sm">Export CSV</button>
      </div>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : (
        <div className="bg-white rounded-xl border border-caisy-gold/20 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-caisy-gold/10 text-xs uppercase text-left">
              <tr><th className="p-3">Parfum</th><th>Brand</th><th>Gender</th><th>Requests</th><th>Status</th><th>Dibuat</th></tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t hover:bg-caisy-gold/5">
                  <td className="p-3 font-medium">{i.perfume_name}</td>
                  <td>{i.brand || '-'}</td>
                  <td className="uppercase text-xs">{i.gender_preference}</td>
                  <td className="font-bold text-caisy-burgundy">{i.request_count}</td>
                  <td>
                    <select value={i.status} onChange={e=>updateStatus(i.id, e.target.value)} className="text-xs px-2 py-1 border rounded bg-white">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="text-xs text-muted-foreground">{formatDate(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
