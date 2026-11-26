import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Thai, Noto_Serif_Thai } from 'next/font/google'
import Link from 'next/link'
import { BookOpenText, LayoutDashboard, PenSquare, Search, ShieldCheck } from 'lucide-react'
import React from 'react'

import { LogoutButton } from '@/components/site/client'
import { Initials } from '@/components/site/AuthorChip'
import { buttonVariants } from '@/components/ui/button'
import { getAuthProvider } from '@/lib/auth/provider'
import { getCurrentUser } from '@/lib/server/data'
import { count } from '@/services/api'
import { isAdmin } from '@/access/roles'
import './globals.css'

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

async function Header() {
  const user = await getCurrentUser()
  let unread = 0
  if (user) {
    unread = (
      await count({
        collection: 'notifications',
        where: { and: [{ recipient: { equals: user.id } }, { read_at: { exists: false } }] },
      })
    ).totalDocs
  }
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-brand-700">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-white">
            <BookOpenText className="size-4.5" aria-hidden />
          </span>
          <span className="hidden text-lg sm:inline">PSU Knowledge</span>
        </Link>
        <form action="/search" role="search" className="relative ml-1 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
          <label htmlFor="site-search" className="sr-only">
            ค้นหาบทความ
          </label>
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="ค้นหาความรู้…"
            className="h-9 w-full rounded-full bg-zinc-100 pl-9 pr-3 text-sm placeholder:text-zinc-500 focus-visible:bg-white"
          />
        </form>
        <nav className="ml-auto flex items-center gap-1 text-sm" aria-label="เมนูหลัก">
          <Link href="/articles" className="hidden rounded-full px-3 py-2 text-zinc-700 hover:bg-zinc-100 md:inline">
            บทความ
          </Link>
          <Link href="/articles?verified=1" className="hidden items-center gap-1 rounded-full px-3 py-2 text-zinc-700 hover:bg-zinc-100 md:inline-flex">
            <ShieldCheck className="size-4 text-verified-600" aria-hidden /> Verified
          </Link>
          <Link href="/communities" className="hidden rounded-full px-3 py-2 text-zinc-700 hover:bg-zinc-100 md:inline">
            ชุมชน
          </Link>
          {user ? (
            <>
              <a href="/write" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                <PenSquare aria-hidden /> <span className="hidden sm:inline">เขียน</span>
              </a>
              <Link href="/dashboard" className={buttonVariants({ variant: 'ghost', size: 'sm' }) + ' relative'} aria-label="แดชบอร์ด">
                <LayoutDashboard aria-hidden />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
              {isAdmin(user) && (
                <Link href="/dashboard/admin" className="hidden rounded-full px-3 py-2 text-zinc-700 hover:bg-zinc-100 lg:inline">
                  ผู้ดูแล
                </Link>
              )}
              <span className="hidden lg:inline" title={user.display_name || user.name}>
                <Initials name={user.display_name || user.name} />
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              เข้าสู่ระบบ
            </Link>
          )}
        </nav>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-4 py-1.5 text-sm md:hidden" aria-label="เมนูมือถือ">
        <Link href="/articles" className="rounded-full px-3 py-1 text-zinc-700 hover:bg-zinc-100">บทความ</Link>
        <Link href="/articles?verified=1" className="rounded-full px-3 py-1 text-zinc-700 hover:bg-zinc-100">PSU Verified</Link>
        <Link href="/communities" className="rounded-full px-3 py-1 text-zinc-700 hover:bg-zinc-100">ชุมชน</Link>
        {user && <Link href="/dashboard/verification" className="whitespace-nowrap rounded-full px-3 py-1 text-zinc-700 hover:bg-zinc-100">งานรับรอง</Link>}
      </nav>
    </header>
  )
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const provider = getAuthProvider()
  return (
    <html lang="th" className={`${plex.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
          ข้ามไปยังเนื้อหา
        </a>
        {provider.isDevelopmentOnly && (
          <div className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
            โหมดพัฒนา: <strong>Mock PSU Authentication</strong> — ไม่ใช่ PSU SSO จริง ใช้บัญชีทดสอบเท่านั้น
          </div>
        )}
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <footer className="border-t border-zinc-200 bg-zinc-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-zinc-500 sm:flex-row sm:justify-between">
            <p>PSU Knowledge · มหาวิทยาลัยสงขลานครินทร์ (MVP — ข้อมูลตัวอย่าง)</p>
            <p>
              Community Blog เผยแพร่ได้ทันที · <span className="text-verified-700">PSU Verified</span> ผ่านการรับรองโดย CoP
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
