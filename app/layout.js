import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { SiteConfigProvider } from '@/components/site-config-provider'

export const metadata = {
  title: 'Caisy Perfume — Lets Scent Your Story',
  description: 'Koleksi parfum dupe berkualitas tinggi terinspirasi dari brand internasional. Wangi mewah tanpa menguras kantong.',
  keywords: 'parfum, perfume, dupe perfume, wangi murah, caisy perfume, parfum wanita, parfum pria',
  openGraph: {
    title: 'Caisy Perfume',
    description: 'Wangian Mewah, Harga Terjangkau',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* Favicon default — akan di-override oleh SiteConfigProvider */}
        <link rel="icon" href="/Brandmark.png" type="image/png" />
        <link rel="apple-touch-icon" href="/Brandmark.png" />

        {/* CSS Variables default — akan di-override oleh SiteConfigProvider */}
        <style>{`
          :root {
            --caisy-primary-color:   #7B1E2C;
            --caisy-secondary-color: #C9A96E;
            --caisy-accent-color:    #FAF7F2;
            --caisy-text-color:      #1A1A2E;
            --caisy-card-color:      #FFFFFF;
            --caisy-border-color:    #E5E7EB;
            --caisy-success-color:   #16A34A;
            --caisy-danger-color:    #DC2626;
          }
        `}</style>
      </head>
      <body>
        <Providers>
          {/* SiteConfigProvider fetch settings dari API dan terapkan perubahan */}
          <SiteConfigProvider>
            {children}
          </SiteConfigProvider>
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
