import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/LanguageContext'
import { getLang } from '@/lib/getLang'

export const metadata: Metadata = {
  title: 'Agence 361',
  description: 'Suivi des heures — Agence 361',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tracking 361',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang}>
      <head>
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        <LanguageProvider initial={lang}>
          {children}
        </LanguageProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `}} />
      </body>
    </html>
  )
}
