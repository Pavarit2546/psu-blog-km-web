import Link from 'next/link'

import { AuthorChip } from '@/components/site/AuthorChip'
import { VerificationBadge } from '@/components/site/VerificationBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { searchArticles } from '@/services/projections'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'ค้นหา' }

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams
  const query = q.slice(0, 200)
  const result = query.trim()
    ? await searchArticles(query, 30)
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">ค้นหาความรู้</h1>
      <form action="/search" className="mt-5 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          คำค้นหา
        </label>
        <Input id="q" name="q" defaultValue={query} placeholder="ชื่อเรื่อง แท็ก ผู้เขียน ชุมชน…" className="h-11" />
        <Button type="submit" size="lg">
          ค้นหา
        </Button>
      </form>
      <p className="mt-2 text-xs text-zinc-500">
        การค้นหาแบบคำสำคัญ (keyword) บน PostgreSQL — ยังไม่ใช่การค้นหาเชิงความหมายด้วย AI
      </p>
      {result && (
        <section className="mt-8" aria-live="polite">
          <p className="text-sm text-zinc-600">
            พบ {result.hits.length} รายการสำหรับ “{query}”
          </p>
          <ul className="mt-4 divide-y divide-zinc-100">
            {result.hits.map((hit) => (
              <li key={hit.id} className="py-5">
                <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                  <AuthorChip author={hit.author_public} />
                  {hit.community && (
                    <Link href={`/communities/${hit.community.slug}`} className="hover:underline">
                      · {hit.community.name}
                    </Link>
                  )}
                  <time className="text-xs text-zinc-500">· {formatDate(hit.published_at)}</time>
                  <VerificationBadge status={hit.verification_status} showCommunity />
                </div>
                <Link href={`/articles/${hit.slug}`} className="mt-1 block text-lg font-bold hover:text-brand-700">
                  {hit.title}
                </Link>
                {hit.excerpt && <p className="mt-1 line-clamp-2 font-serif text-zinc-600">{hit.excerpt}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
