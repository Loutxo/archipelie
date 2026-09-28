import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Archipélie - Trouve ta maille',
  description: 'Un parcours en quatre étapes pour cartographier ta géographie réelle, nommer tes manques, situer tes compétences, et trouver tes compagnons.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
