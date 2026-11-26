import Link from 'next/link'
import { find, type Where } from '@/services/api'

import { ArticleRow } from '@/components/site/ArticleCard'
import { listArticles } from '@/lib/server/data'
import { cn } from '@/lib/utils'

export const metadata = { title: 'บทความ' }

type Props = { searchParams: Promise<{ tag?: string; community?: string; verified?: string; page?: string }> }

export default async function ArticlesPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const filters: Where[] = []
  let heading = 'บทความทั้งหมด'

  if (sp.tag) {
    const tag = (await find({ collection: 'tags', where: { slug: { equals: sp.tag } }, limit: 1 })).docs[0]
    if (tag) {
      filters.push({ tags: { contains: tag.id } })
      heading = `แท็ก: ${tag.name}`
    }
  }
  if (sp.community) {
    const c = (await find({ collection: 'communities', where: { slug: { equals: sp.community } }, limit: 1 })).docs[0]
    if (c) {
      filters.push({ community: { equals: c.id } })
      heading = c.name
    }
  }
  if (sp.verified === '1') {
    filters.push({ verification_status: { equals: 'VERIFIED' } })
    heading = sp.tag || sp.community ? `${heading} · PSU Verified` : 'PSU Verified Knowledge'
  }

  const result = await listArticles({ where: filters.length ? { and: filters } : undefined, page, limit: 10 })
  const qs = (p: number) => {
    const params = new URLSearchParams()
    if (sp.tag) params.set('tag', sp.tag)
    if (sp.community) params.set('community', sp.community)
    if (sp.verified) params.set('verified', sp.verified)
    params.set('page', String(p))
    return `/articles?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>
      <div className="mt-4 flex gap-2 text-sm" role="tablist" aria-label="ประเภทบทความ">
        <Link
          href="/articles"
          className={cn('rounded-full px-3 py-1', sp.verified !== '1' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 hover:bg-zinc-200')}
        >
          ทั้งหมด
        </Link>
        <Link
          href="/articles?verified=1"
          className={cn('rounded-full px-3 py-1', sp.verified === '1' ? 'bg-verified-700 text-white' : 'bg-zinc-100 hover:bg-zinc-200')}
        >
          PSU Verified
        </Link>
      </div>
      <div className="mt-4">
        {result.docs.length === 0 ? (
          <p className="py-16 text-center text-zinc-500">ไม่พบบทความ</p>
        ) : (
          result.docs.map((a) => <ArticleRow key={a.id} article={a} />)
        )}
      </div>
      {result.totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-between text-sm" aria-label="แบ่งหน้า">
          {result.hasPrevPage ? <Link href={qs(page - 1)} className="text-brand-600 hover:underline">← ก่อนหน้า</Link> : <span />}
          <span className="text-zinc-500">
            หน้า {page} / {result.totalPages}
          </span>
          {result.hasNextPage ? <Link href={qs(page + 1)} className="text-brand-600 hover:underline">ถัดไป →</Link> : <span />}
        </nav>
      )}
    </div>
  )
}
