import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/LanguageContext'
import { getLang } from '@/lib/getLang'

export const metadata: Metadata = {
  title: 'Agence 361',
  description: 'Suivi des heures — Agence 361',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <html lang={lang}>
      <body>
        <LanguageProvider initial={lang}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
