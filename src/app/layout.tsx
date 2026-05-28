import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tracking 361',
  description: 'Suivi des heures — Agence 361',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
