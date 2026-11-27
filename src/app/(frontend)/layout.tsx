import Link from 'next/link'
import { LayoutDashboard, PenSquare, Search, ShieldCheck } from 'lucide-react'
import React from 'react'

import { LogoutButton } from '@/components/site/client'
import { SkipToContent } from '@/components/site/SkipToContent'
import { Initials } from '@/components/site/AuthorChip'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/server/data'
import { count } from '@/services/api'
import { isAdmin } from '@/access/roles'

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
    <header className="sticky top-0 z-30 border-b border-zinc-200 border-t-4 border-t-brand-800 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link href="/" aria-label="PSU Knowledge หน้าหลัก" className="font-serif text-lg font-semibold leading-none text-brand-800 sm:text-2xl">
          PSU<span className="hidden sm:inline"> Knowledge</span>
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

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipToContent>ข้ามไปยังเนื้อหา</SkipToContent>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <footer className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-zinc-600">
          <p className="font-serif font-semibold text-brand-800">PSU Knowledge</p>
          <p>กองบริหารทรัพยากรบุคคล · มหาวิทยาลัยสงขลานครินทร์</p>
        </div>
      </footer>
    </>
  )
}
