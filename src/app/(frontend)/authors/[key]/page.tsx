import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Feather } from 'lucide-react'

import { ArticleRow } from '@/components/site/ArticleCard'
import { Initials } from '@/components/site/AuthorChip'
import { listArticles } from '@/lib/server/data'
import { getAuthor } from '@/services/projections'

export const metadata = { title: 'ผู้เขียน' }

/**
 * Public author profile. Two independent profiles per person:
 *  - real-name profile (public_key): display name, bio, optional department, communities
 *  - pen-name profile (pen_key): pen name and pen-name articles only — nothing that links to the real person
 */
export default async function AuthorPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(key)) notFound()
  const author = await getAuthor(key)
  if (!author) notFound()
  const { profile, isPen, avatar, communities, bio } = author
  const articles = await listArticles({ where: { 'author_public.profile_key': { equals: key } }, limit: 30 })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt="" className="size-20 rounded-full object-cover" />
        ) : (
          <Initials name={profile.name} className="size-20 text-3xl" />
        )}
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            {profile.name}
            {isPen && <Feather className="size-5 text-zinc-400" aria-label="นามปากกา" />}
          </h1>
          {isPen ? (
            <p className="text-sm text-zinc-500">เขียนภายใต้นามปากกา</p>
          ) : (
            <>
              {profile.department && (
                <p className="text-zinc-600">
                  {profile.position ? `${profile.position} · ` : ''}
                  {profile.department}
                </p>
              )}
              {bio && <p className="mt-2 max-w-xl font-serif text-zinc-700">{bio}</p>}
            </>
          )}
        </div>
      </header>
      {communities.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          {communities.map((c) => (
            <span key={c.id} className="rounded-full bg-brand-50 px-3 py-1 text-brand-700">
              {c.name}
            </span>
          ))}
        </div>
      )}
      <h2 className="mt-10 border-b border-zinc-200 pb-3 text-lg font-bold">บทความ ({articles.totalDocs})</h2>
      {articles.docs.length === 0 ? (
        <p className="py-10 text-center text-zinc-500">ยังไม่มีบทความที่คุณเข้าถึงได้</p>
      ) : (
        articles.docs.map((a) => <ArticleRow key={a.id} article={a} />)
      )}
      <p className="mt-10 text-xs text-zinc-400">
        <Link href="/articles" className="hover:underline">← บทความทั้งหมด</Link>
      </p>
    </div>
  )
}
