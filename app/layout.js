import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

export const metadata = {
  title: 'Caisy Perfume — Wangian Mewah, Harga Terjangkau',
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
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%F0%9F%8C%B9%3C/text%3E%3C/svg%3E" />
      </head>
      <body>
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
