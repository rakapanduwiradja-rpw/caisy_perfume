'use client'
import { useEffect, useState } from 'react'
import { formatDate } from '@/lib/utils'
import { Loader2, Star, Trash2, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => { setLoading(true); fetch('/api/admin/reviews').then(r=>r.json()).then(d => { setReviews(d.reviews || []); setLoading(false) }) }
  useEffect(load, [])

  const toggle = async (id, is_approved) => { await fetch(`/api/admin/reviews/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ is_approved }) }); toast.success('Status diupdate'); load() }
  const del = async (id) => { if (!confirm('Hapus review?')) return; await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' }); toast.success('Dihapus'); load() }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-caisy-primary mb-6">Review Produk</h1>
      {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto"/> : reviews.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border"><Star className="w-12 h-12 mx-auto text-caisy-primary mb-3"/><p className="font-display text-xl">Belum ada review</p></div>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-xl p-5 border shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{r.user_name}</p>
                    <div className="flex">{Array(5).fill(0).map((_, i) => <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-caisy-primary text-caisy-primary' : 'text-gray-300'}`}/>)}</div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.is_approved ? 'Approved' : 'Pending'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.product_name} • {formatDate(r.created_at)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>toggle(r.id, !r.is_approved)} className={`p-1.5 rounded ${r.is_approved ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`} title={r.is_approved ? 'Unpublish' : 'Approve'}>{r.is_approved ? <X className="w-4 h-4"/> : <Check className="w-4 h-4"/>}</button>
                  <button onClick={()=>del(r.id)} className="p-1.5 bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <p className="text-sm">{r.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
