import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck } from 'lucide-react'

import { RichText } from '@/components/site/RichText'
import { find } from '@/services/api'
import { getVerified } from '@/services/projections'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'ฉบับที่ได้รับการรับรอง' }

/** Shows the immutable snapshot that the approver actually approved. */
export default async function VerifiedVersionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Access check through the normal rules first.
  const { docs } = await find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    select: { title: true, slug: true, current_verified_version: true, verification_status: true, content_hash: true },
  })
  const article = docs[0]
  if (!article?.current_verified_version) notFound()

  const request = await getVerified(article.id)
  if (!request) notFound()
  const { community } = request
  const differs = request.snapshot?.content_hash !== article.content_hash

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-xl border border-verified-600/30 bg-verified-50/70 p-4 text-sm">
        <p className="flex items-center gap-2 font-semibold text-verified-700">
          <BadgeCheck className="size-5" aria-hidden /> ฉบับที่ได้รับการรับรอง (snapshot ที่ไม่เปลี่ยนแปลง)
        </p>
        <p className="mt-1 text-zinc-700">
          รับรองโดย {community?.name ?? 'CoP'} เมื่อ {formatDate(request.completed_at)} · Version ID:{' '}
          <code className="text-xs">{request.article_version ?? '-'}</code>
        </p>
        {differs && (
          <p className="mt-2 text-amber-800">
            ฉบับปัจจุบันของบทความแตกต่างจากฉบับนี้ —{' '}
            <Link href={`/articles/${article.slug}`} className="underline">
              ดูฉบับปัจจุบัน
            </Link>
          </p>
        )}
      </div>
      <h1 className="mt-8 text-3xl font-bold tracking-tight">{request.snapshot?.title}</h1>
      {request.snapshot?.subtitle && <p className="mt-2 font-serif text-xl text-zinc-500">{request.snapshot.subtitle}</p>}
      <div className="mt-8">
        <RichText data={request.snapshot?.content} />
      </div>
    </article>
  )
}
