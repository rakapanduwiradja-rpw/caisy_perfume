import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'

export const metadata = {
  title: 'Caisy Perfume — Lets Scent Your Story',
  description: 'Koleksi dupe perfume berkualitas dari brand ternama.',
  keywords: 'parfum, perfume, dupe perfume, wangi murah, caisy perfume, parfum wanita, parfum pria',
  openGraph: {
    title: 'Caisy Perfume',
    description: 'Lets Scent Your Story',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/Brandmark.png" type="image/png" />
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
