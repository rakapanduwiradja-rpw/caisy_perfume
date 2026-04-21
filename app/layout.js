import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { getDb } from '@/lib/mongo'

// Ambil settings dari database
async function getSiteSettings() {
  try {
    const db = await getDb()
    const doc = await db.collection('settings').findOne({ key: 'store_settings' })
    return doc?.data || {}
  } catch {
    return {}
  }
}

export default async function RootLayout({ children }) {
  const settings = await getSiteSettings()

  const title = settings.meta_title || 'Caisy Perfume — Wangian Mewah, Harga Terjangkau'
  const description = settings.meta_description || 'Koleksi parfum dupe berkualitas tinggi terinspirasi dari brand internasional.'
  const keywords = settings.meta_keywords || 'parfum, perfume, dupe perfume, caisy perfume'
  const favicon = settings.favicon || '/Brandmark.png'

  // CSS variables dari settings
  const colorVars = `
    :root {
      --color-primary: ${settings.color_primary || '#7B1E2C'};
      --color-secondary: ${settings.color_secondary || '#C9A96E'};
      --color-accent: ${settings.color_accent || '#FAF7F2'};
      --color-text: ${settings.color_text || '#1A1A2E'};
      --color-card: ${settings.color_card || '#FFFFFF'};
      --color-border: ${settings.color_border || '#E5E7EB'};
      --color-success: ${settings.color_success || '#16A34A'};
      --color-warning: ${settings.color_warning || '#D97706'};
      --color-danger: ${settings.color_danger || '#DC2626'};
      --color-background: ${settings.color_accent || '#FAF7F2'};
    }
  `

  return (
    <html lang="id">
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta property="og:title" content={settings.brand_name ? `${settings.brand_name} ${settings.brand_tagline}` : 'Caisy Perfume'} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link rel="icon" href={favicon} type="image/png" />
        <link rel="apple-touch-icon" href={favicon} />
        <style dangerouslySetInnerHTML={{ __html: colorVars }} />
      </head>
      <body>
        {/* Pass settings ke client via data attribute */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SITE_SETTINGS__ = ${JSON.stringify({
              brand_name: settings.brand_name || 'Caisy',
              brand_tagline: settings.brand_tagline || 'Perfume',
              brand_description: settings.brand_description || 'Wangian Mewah, Harga Terjangkau',
              whatsapp: settings.whatsapp || '6281234567890',
              email_cs: settings.email_cs || 'cs@caisyperfume.com',
              phone: settings.phone || '+62 812-3456-7890',
              instagram: settings.instagram || '#',
              tiktok: settings.tiktok || '#',
              facebook: settings.facebook || '#',
              logo_primary: settings.logo_primary || '/Primary.png',
              logo_secondary: settings.logo_secondary || '/Secondary.png',
              use_image_logo: settings.use_image_logo || false,
              maintenance_mode: settings.maintenance_mode || false,
            })}`
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
