'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { LayoutDashboard, Package, ShoppingBag, Users, Box, Heart, BarChart3, Settings, LogOut, Shield, Tag, Image as ImageIcon, Star } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produk', icon: Package },
  { href: '/admin/orders', label: 'Pesanan', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Pelanggan', icon: Users },
  { href: '/admin/stock', label: 'Stok', icon: Box },
  { href: '/admin/banners', label: 'Banner', icon: ImageIcon },
  { href: '/admin/vouchers', label: 'Voucher', icon: Tag },
  { href: '/admin/reviews', label: 'Review', icon: Star },
  { href: '/admin/waiting-list', label: 'Waiting List', icon: Heart },
  { href: '/admin/reports', label: 'Laporan', icon: BarChart3 },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
]

export default function AdminLayout({ children }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    if (!user || user.role !== 'admin') { router.push('/login'); return }
  }, [user, loading])

  if (loading || !user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><p>Memuat...</p></div>
  }

  return (
    <div className="min-h-screen bg-caisy-cream flex">
      <aside className="w-64 bg-caisy-burgundy text-white sticky top-0 h-screen overflow-y-auto flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-caisy-gold flex items-center justify-center text-caisy-burgundy font-display font-bold">C</div>
            <div>
              <p className="font-display font-bold text-lg">Caisy</p>
              <p className="text-[10px] tracking-widest uppercase text-caisy-gold flex items-center gap-1"><Shield className="w-3 h-3"/> Admin</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(n => {
            const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href))
            return (
              <Link key={n.href} href={n.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-caisy-gold text-caisy-burgundy font-semibold' : 'hover:bg-white/10'}`}>
                <n.icon className="w-4 h-4"/> {n.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="text-xs text-white/70 mb-2 px-3">{user.name}</div>
          <button onClick={()=>{logout(); router.push('/')}} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 text-sm"><LogOut className="w-4 h-4"/> Keluar</button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-x-auto">{children}</main>
    </div>
  )
}
