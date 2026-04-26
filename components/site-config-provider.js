'use client'
import { useEffect } from 'react'

export function SiteConfigProvider({ children }) {
  useEffect(() => {
    async function apply() {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const data = await res.json()
        const s = data.settings || {}

        window.__SITE_CONFIG__ = {
          brand_name:       s.brand_name     || 'Caisy',
          brand_tagline:    s.brand_tagline  || 'Perfume',
          description:      s.description    || 'Wangian Mewah, Harga Terjangkau.',
          whatsapp_cs:      s.whatsapp_cs    || '6281234567890',
          email_cs:         s.email_cs       || 'cs@caisyperfume.com',
          phone:            s.phone          || '+62 812-3456-7890',
          instagram:        s.instagram      || '',
          tiktok:           s.tiktok         || '',
          facebook:         s.facebook       || '',
          logo_primary:     s.logo_primary   || '/Primary.png',
          logo_secondary:   s.logo_secondary || '/Secondary.png',
          use_image_logo:   s.use_image_logo || false,
          maintenance_mode: s.maintenance_mode || false,
        }

        const root = document.documentElement
        const colors = {
          '--caisy-primary-color':   s.color_primary,
          '--caisy-secondary-color': s.color_secondary,
          '--caisy-accent-color':    s.color_accent,
          '--caisy-text-color':      s.color_text,
          '--caisy-card-color':      s.color_card,
          '--caisy-border-color':    s.color_border,
          '--caisy-success-color':   s.color_success,
          '--caisy-danger-color':    s.color_danger,
        }
        for (const [v, val] of Object.entries(colors)) {
          if (val) root.style.setProperty(v, val)
        }

        // Fix gradasi hero (inline style tidak bisa di-override CSS biasa)
        if (s.color_primary) {
          const hex = s.color_primary.replace('#','')
          const r = parseInt(hex.slice(0,2),16)
          const g = parseInt(hex.slice(2,4),16)
          const b = parseInt(hex.slice(4,6),16)
          const grad = `linear-gradient(to right,rgba(${r},${g},${b},0.95) 0%,rgba(${r},${g},${b},0.75) 50%,rgba(${r},${g},${b},0.2) 100%)`

          // Inject style tag
          let st = document.getElementById('caisy-dyn')
          if (!st) { st = document.createElement('style'); st.id = 'caisy-dyn'; document.head.appendChild(st) }
          st.textContent = `
            .caisy-hero-overlay { background: ${grad} !important; }
          `

          // Apply directly to hero overlay element if already rendered
          document.querySelectorAll('.caisy-hero-overlay').forEach(el => {
            el.style.background = grad
          })
        }

        // Fix favicon — remove emoji, use file
        if (s.favicon) {
          document.querySelectorAll("link[rel*='icon']").forEach(el => el.remove())
          const fav = document.createElement('link')
          fav.rel = 'icon'
          fav.href = s.favicon
          fav.type = 'image/png'
          document.head.appendChild(fav)
        }

        if (s.meta_title) document.title = s.meta_title

        // Maintenance mode
        if (s.maintenance_mode && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/login')) {
          document.body.style.overflow = 'hidden'
          const overlay = document.createElement('div')
          overlay.style.cssText = 'position:fixed;inset:0;background:#FAF7F2;z-index:9999;display:flex;align-items:center;justify-content:center;text-align:center;padding:20px;'
          overlay.innerHTML = `<div><h1 style="color:#7B1E2C;font-family:Georgia,serif;font-size:2rem;margin-bottom:12px;">🔧 Sedang Pemeliharaan</h1><p style="color:#888;">Kembali lagi sebentar ya!</p></div>`
          document.body.appendChild(overlay)
        }

      } catch(e) {
        console.warn('SiteConfig error:', e.message)
      }
    }
    apply()
  }, [])

  return children
}
