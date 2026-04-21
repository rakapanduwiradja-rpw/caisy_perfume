'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingBag, User, Search, Menu, X, LogOut, Package, Shield, Heart } from 'lucide-react'
import { useCart, useAuth } from './providers'
import { motion, AnimatePresence } from 'framer-motion'

// Baca settings dari window (diisi oleh layout.js server-side)
function getSettings() {
  if (typeof window !== 'undefined' && window.__SITE_SETTINGS__) {
    return window.__SITE_SETTINGS__
  }
  return {
    brand_name: 'Caisy',
    brand_tagline: 'Perfume',
    brand_description: 'Wangian Mewah, Harga Terjangkau.',
    whatsapp: '6281234567890',
    email_cs: 'cs@caisyperfume.com',
    phone: '+62 812-3456-7890',
    instagram: '#',
    tiktok: '#',
    facebook: '#',
    logo_primary: '/Primary.png',
    logo_secondary: '/Secondary.png',
    use_image_logo: false,
  }
}

export function Header() {
  const { count } = useCart()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const s = getSettings()

  return (
    <header className="sticky top-0 z-40 bg-caisy-cream/90 backdrop-blur-md border-b border-caisy-primary/30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          {s.use_image_logo ? (
            <img src={s.logo_primary} alt={s.brand_name} className="h-10 w-auto object-contain" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center text-white text-xl font-display font-bold shadow-md">
                {s.brand_name?.[0] || 'C'}
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-caisy-primary leading-none">{s.brand_name}</h1>
                <p className="text-[10px] tracking-widest uppercase text-caisy-accent">{s.brand_tagline}</p>
              </div>
            </>
          )}
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-caisy-primary transition">Home</Link>
          <Link href="/catalog" className="hover:text-caisy-primary transition">Katalog</Link>
          <Link href="/smart-search" className="hover:text-caisy-primary transition flex items-center gap-1">
            <Search className="w-4 h-4" /> AI Search
          </Link>
          <Link href="/waiting-list" className="hover:text-caisy-primary transition">Waiting List</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user && (
            <Link href="/wishlist" className="p-2 hover:bg-caisy-primary/10 rounded-full hidden sm:block" aria-label="Wishlist">
              <Heart className="w-5 h-5 text-caisy-primary" />
            </Link>
          )}
          <Link href="/cart" className="relative p-2 hover:bg-caisy-primary/10 rounded-full">
            <ShoppingBag className="w-5 h-5 text-caisy-primary" />
            {count > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-caisy-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold"
              >
                {count}
              </motion.span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="p-2 hover:bg-caisy-primary/10 rounded-full">
                <User className="w-5 h-5 text-caisy-primary" />
              </button>
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-12 bg-white border border-caisy-primary/30 rounded-lg shadow-xl py-2 min-w-[200px]"
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Link href="/profile" className="block px-4 py-2 hover:bg-caisy-primary/10 text-sm flex items-center gap-2">
                    <User className="w-4 h-4" /> Profil
                  </Link>
                  <Link href="/orders" className="block px-4 py-2 hover:bg-caisy-primary/10 text-sm flex items-center gap-2">
                    <Package className="w-4 h-4" /> Pesanan Saya
                  </Link>
                  <Link href="/wishlist" className="block px-4 py-2 hover:bg-caisy-primary/10 text-sm flex items-center gap-2">
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="block px-4 py-2 hover:bg-caisy-primary/10 text-sm flex items-center gap-2 text-caisy-primary font-semibold">
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setUserMenuOpen(false) }}
                    className="w-full text-left px-4 py-2 hover:bg-caisy-primary/10 text-sm flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="hidden md:inline-block text-sm px-4 py-2 bg-caisy-primary text-white rounded-md hover:brightness-110 transition">
              Masuk
            </Link>
          )}

          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden bg-white border-t border-caisy-primary/30"
          >
            <nav className="flex flex-col p-4 gap-3">
              <Link href="/" onClick={() => setMobileOpen(false)} className="py-2">Home</Link>
              <Link href="/catalog" onClick={() => setMobileOpen(false)} className="py-2">Katalog</Link>
              <Link href="/smart-search" onClick={() => setMobileOpen(false)} className="py-2">AI Smart Search</Link>
              <Link href="/waiting-list" onClick={() => setMobileOpen(false)} className="py-2">Waiting List</Link>
              {user && <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="py-2">Wishlist</Link>}
              {!user && (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2 btn-primary text-center">Masuk</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

export function Footer() {
  const s = getSettings()

  return (
    <footer className="mt-20 burgundy-gradient text-white">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {s.use_image_logo ? (
              <img src={s.logo_secondary} alt={s.brand_name} className="h-10 w-auto object-contain" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-display font-bold">
                  {s.brand_name?.[0] || 'C'}
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">{s.brand_name}</h3>
                  <p className="text-[10px] tracking-widest uppercase text-caisy-gold">{s.brand_tagline}</p>
                </div>
              </>
            )}
          </div>
          <p className="text-sm text-white/80">{s.brand_description}</p>
        </div>

        <div>
          <h4 className="font-display font-semibold text-caisy-gold mb-3">Navigasi</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/" className="hover:text-white transition">Home</Link></li>
            <li><Link href="/catalog" className="hover:text-white transition">Katalog</Link></li>
            <li><Link href="/smart-search" className="hover:text-white transition">AI Smart Search</Link></li>
            <li><Link href="/waiting-list" className="hover:text-white transition">Waiting List</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-caisy-gold mb-3">Bantuan</h4>
          <ul className="space-y-2 text-sm text-white/80">
            <li><Link href="/login" className="hover:text-white transition">Akun Saya</Link></li>
            <li><Link href="/orders" className="hover:text-white transition">Cek Pesanan</Link></li>
            <li>
              <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="hover:text-white transition">
                WhatsApp CS
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display font-semibold text-caisy-gold mb-3">Hubungi Kami</h4>
          <a href={`mailto:${s.email_cs}`} className="text-sm text-white/80 hover:text-white block">{s.email_cs}</a>
          <a href={`https://wa.me/${s.whatsapp}`} className="text-sm text-white/80 hover:text-white block mt-1">{s.phone}</a>
          <div className="flex gap-3 mt-3">
            {s.instagram && s.instagram !== '#' && (
              <a className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center transition text-xs font-bold" href={s.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">IG</a>
            )}
            {s.tiktok && s.tiktok !== '#' && (
              <a className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center transition text-xs font-bold" href={s.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">TT</a>
            )}
            {s.facebook && s.facebook !== '#' && (
              <a className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center transition text-xs font-bold" href={s.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">FB</a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs py-4 text-white/60">
        © {new Date().getFullYear()} {s.brand_name} {s.brand_tagline}. All rights reserved.
      </div>
    </footer>
  )
}

export function WhatsAppButton() {
  const s = getSettings()
  return (
    <a
      href={`https://wa.me/${s.whatsapp}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-xl z-30 hover:scale-110 transition"
      aria-label="Chat WhatsApp CS"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
        <path d="M19.11 17.21c-.29-.15-1.7-.84-1.96-.94-.26-.1-.45-.14-.64.14-.19.29-.73.94-.9 1.13-.16.19-.33.21-.62.07-.29-.14-1.22-.45-2.32-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.33.43-.5.14-.16.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.64-1.53-.87-2.1-.23-.55-.47-.48-.64-.49-.16-.01-.36-.01-.55-.01s-.5.07-.76.36c-.26.29-1 1-1 2.44 0 1.44 1.02 2.82 1.16 3.02.14.19 2 3.05 4.85 4.28.68.29 1.21.46 1.62.59.68.22 1.29.19 1.77.11.54-.08 1.7-.69 1.93-1.36.24-.67.24-1.25.17-1.36-.07-.12-.26-.19-.55-.33z"/>
        <path d="M26.58 5.41A14.94 14.94 0 0 0 15.99 1C7.73 1 1 7.73 1 16c0 2.64.69 5.22 2 7.5L1 31l7.75-2c2.2 1.2 4.68 1.83 7.2 1.83h.01c8.26 0 14.99-6.73 15-14.99.01-4.01-1.56-7.78-4.38-10.43zM16 28.24h-.01c-2.22 0-4.4-.6-6.3-1.72l-.45-.27-4.6 1.18 1.22-4.48-.29-.46A12.26 12.26 0 0 1 3.77 16C3.77 9.27 9.26 3.77 16 3.77c3.26 0 6.32 1.27 8.62 3.58A12.11 12.11 0 0 1 28.23 16c-.01 6.74-5.5 12.24-12.23 12.24z"/>
      </svg>
    </a>
  )
}
