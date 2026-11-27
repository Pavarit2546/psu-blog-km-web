import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { IBM_Plex_Sans_Thai, Noto_Serif_Thai } from 'next/font/google'
import './(frontend)/globals.css'

const plex = IBM_Plex_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-thai',
  display: 'swap',
})
const serif = Noto_Serif_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '600'],
  variable: '--font-noto-serif-thai',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'PSU Knowledge', template: '%s — PSU Knowledge' },
  description: 'แพลตฟอร์มแบ่งปันและรับรององค์ความรู้ของบุคลากรมหาวิทยาลัยสงขลานครินทร์',
  robots: { index: false, follow: false }, // MVP: keep out of search engines until go-live review
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b3b6f' }

export const dynamic = 'force-dynamic'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The language preference cookie is scoped to /login and its child routes.
  const language = (await cookies()).get('km-language')?.value === 'en' ? 'en' : 'th'
  return (
    <html lang={language} className={`${plex.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        {children}
      </body>
    </html>
  )
}
