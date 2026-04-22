'use client'
import { useEffect } from 'react'

// Komponen ini fetch settings dari API setiap halaman dibuka
// dan langsung terapkan ke CSS variables + window.__SITE_CONFIG__
// Tidak bergantung pada server-side rendering
export function SiteConfigProvider({ children }) {
  useEffect(() => {
    async function loadAndApplySettings() {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' })
        const data = await res.json()
        const s = data.settings || {}

        // Simpan ke window agar komponen lain bisa baca
        window.__SITE_CONFIG__ = {
          brand_name:     s.brand_name     || 'Caisy',
          brand_tagline:  s.brand_tagline  || 'Perfume',
          description:    s.description    || 'Wangian Mewah, Harga Terjangkau.',
          whatsapp_cs:    s.whatsapp_cs    || '6281234567890',
          email_cs:       s.email_cs       || 'cs@caisyperfume.com',
          phone:          s.phone          || '+62 812-3456-7890',
          instagram:      s.instagram      || '',
          tiktok:         s.tiktok         || '',
          facebook:       s.facebook       || '',
          logo_primary:   s.logo_primary   || '/Primary.png',
          logo_secondary: s.logo_secondary || '/Secondary.png',
          use_image_logo: s.use_image_logo || false,
        }

        // Terapkan CSS variables langsung ke root element
        const root = document.documentElement
        if (s.color_primary)   root.style.setProperty('--caisy-primary-color',   s.color_primary)
        if (s.color_secondary) root.style.setProperty('--caisy-secondary-color', s.color_secondary)
        if (s.color_accent)    root.style.setProperty('--caisy-accent-color',    s.color_accent)
        if (s.color_text)      root.style.setProperty('--caisy-text-color',      s.color_text)
        if (s.color_card)      root.style.setProperty('--caisy-card-color',      s.color_card)
        if (s.color_border)    root.style.setProperty('--caisy-border-color',    s.color_border)
        if (s.color_success)   root.style.setProperty('--caisy-success-color',   s.color_success)
        if (s.color_danger)    root.style.setProperty('--caisy-danger-color',    s.color_danger)

        // Update favicon secara dinamis
        if (s.favicon) {
          let link = document.querySelector("link[rel~='icon']")
          if (!link) {
            link = document.createElement('link')
            link.rel = 'icon'
            document.head.appendChild(link)
          }
          link.href = s.favicon
        }

        // Update title jika berbeda
        if (s.meta_title && document.title !== s.meta_title) {
          document.title = s.meta_title
        }

        // Update logo di header dan footer (DOM manipulation)
        applyLogo(s)

      } catch (e) {
        console.warn('Could not load site settings:', e.message)
      }
    }

    loadAndApplySettings()
  }, [])

  return children
}

function applyLogo(s) {
  if (!s.use_image_logo) return

  // Update semua elemen logo di halaman
  const logoContainers = document.querySelectorAll('[data-logo="header"]')
  logoContainers.forEach(el => {
    el.innerHTML = `<img src="${s.logo_primary}" alt="${s.brand_name}" style="height:40px;width:auto;object-fit:contain;" />`
  })

  const footerLogos = document.querySelectorAll('[data-logo="footer"]')
  footerLogos.forEach(el => {
    el.innerHTML = `<img src="${s.logo_secondary}" alt="${s.brand_name}" style="height:40px;width:auto;object-fit:contain;" />`
  })
}
