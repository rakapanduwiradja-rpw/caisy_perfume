import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { getDb } from '@/lib/mongo'

async function getSiteSettings() {
  try {
    const db = await getDb()
    // Sesuai route.js: key 'store'
    const doc = await db.collection('settings').findOne({ key: 'store' })
    return doc || {}
  } catch {
    return {}
  }
}

export default async function RootLayout({ children }) {
  const s = await getSiteSettings()

  const favicon    = s.favicon    || '/Brandmark.png'
  const title      = s.meta_title || 'Caisy Perfume — Wangian Mewah, Harga Terjangkau'
  const desc       = s.meta_description || 'Koleksi parfum dupe berkualitas tinggi terinspirasi dari brand internasional.'
  const keywords   = s.meta_keywords || 'parfum, perfume, dupe perfume, caisy perfume'
  const brandName  = s.brand_name  || 'Caisy'
  const brandTag   = s.brand_tagline || 'Perfume'

  // Inject CSS variables dari settings ke seluruh halaman
  const cssVars = `
    :root {
      --caisy-primary:   ${s.color_primary   || '#7B1E2C'};
      --caisy-secondary: ${s.color_secondary || '#C9A96E'};
      --caisy-accent:    ${s.color_accent    || '#FAF7F2'};
      --caisy-text:      ${s.color_text      || '#1A1A2E'};
      --caisy-card:      ${s.color_card      || '#FFFFFF'};
      --caisy-border:    ${s.color_border    || '#E5E7EB'};
      --caisy-success:   ${s.color_success   || '#16A34A'};
      --caisy-danger:    ${s.color_danger    || '#DC2626'};
    }
  `

  // Data untuk komponen client (header, footer, WA button)
  const siteConfig = {
    brand_name:       brandName,
    brand_tagline:    brandTag,
    description:      s.description   || 'Wangian Mewah, Harga Terjangkau.',
    whatsapp_cs:      s.whatsapp_cs   || '6281234567890',
    email_cs:         s.email_cs      || 'cs@caisyperfume.com',
    phone:            s.phone         || '+62 812-3456-7890',
    instagram:        s.instagram     || '',
    tiktok:           s.tiktok        || '',
    facebook:         s.facebook      || '',
    logo_primary:     s.logo_primary  || '/Primary.png',
    logo_secondary:   s.logo_secondary || '/Secondary.png',
    use_image_logo:   s.use_image_logo || false,
    maintenance_mode: s.maintenance_mode || false,
  }

  return (
    <html lang="id">
      <head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={`${brandName} ${brandTag}`} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="website" />
        <link rel="icon" href={favicon} type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href={favicon} />
        {/* CSS Variables dari Admin Settings */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      </head>
      <body>
        {/* Inject site config ke window agar bisa dibaca komponen client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SITE_CONFIG__ = ${JSON.stringify(siteConfig)};`
          }}
        />
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
        </Providers>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
