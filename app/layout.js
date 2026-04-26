import './globals.css'
import Script from 'next/script'
import { Toaster } from '@/components/ui/sonner'
import { Providers } from '@/components/providers'
import { SiteConfigProvider } from '@/components/site-config-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/Brandmark.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/Brandmark.png" />
        <link rel="apple-touch-icon" href="/Brandmark.png" />
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
          body { background-color: #FAF7F2; }
        `}</style>
      </head>
      <body>
        <Providers>
          <SiteConfigProvider>
            {children}
          </SiteConfigProvider>
          <Toaster position="top-right" richColors />
        </Providers>
        <Script
          src={process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js'}
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
