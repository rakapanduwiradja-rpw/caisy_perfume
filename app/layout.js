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
        {/*
          FAVICON — Pilih salah satu opsi:

          OPSI 1 (Aktif): Emoji bunga sebagai favicon sementara
          Ganti emoji %F0%9F%8C%B9 dengan emoji lain jika mau:
          🌸 = %F0%9F%8C%B8 | 💐 = %F0%9F%92%90 | ✨ = %E2%9C%A8
        */}
        /*<link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext y='26' font-size='26'%3E%F0%9F%8C%B9%3C/text%3E%3C/svg%3E"
        />*/
        {  
        <link rel="icon" href="/Brandmark.png" type="image/png" />
          }
        {/*
          OPSI 2: Pakai file favicon sendiri
          1. Upload file favicon.ico atau favicon.png ke folder /public di GitHub
          2. Hapus komentar di bawah ini dan hapus OPSI 1 di atas

          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" href="/Brandmark.png" type="image/png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        */}
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
