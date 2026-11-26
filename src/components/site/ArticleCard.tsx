import Link from 'next/link'
import { Lock } from 'lucide-react'

import type { CardArticle } from '@/lib/server/data'
import { mediaUrl } from '@/lib/server/data'
import { cn, formatDate } from '@/lib/utils'
import type { Community, Tag } from '@/payload-types'
import { AuthorChip } from './AuthorChip'
import { VerificationBadge } from './VerificationBadge'

const communityOf = (a: CardArticle) => (a.community && typeof a.community === 'object' ? (a.community as Community) : null)
const tagsOf = (a: CardArticle) => (a.tags ?? []).filter((t): t is Tag => typeof t === 'object')

/** Medium-style horizontal feed item. */
export function ArticleRow({ article }: { article: CardArticle }) {
  const community = communityOf(article)
  const cover = mediaUrl(article.featured_image, 'thumbnail')
  return (
    <article className="flex gap-5 border-b border-zinc-100 py-6 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600">
          <AuthorChip author={article.author_public} />
          {community && (
            <>
              <span aria-hidden>·</span>
              <Link href={`/communities/${community.slug}`} className="hover:underline">
                {community.name}
              </Link>
            </>
          )}
        </div>
        <Link href={`/articles/${article.slug}`} className="group block">
          <h3 className="text-lg font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-brand-700 sm:text-xl">
            {article.title}
          </h3>
          {article.excerpt && <p className="mt-1.5 line-clamp-2 font-serif text-zinc-600">{article.excerpt}</p>}
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <time dateTime={article.published_at ?? undefined}>{formatDate(article.published_at)}</time>
          {article.visibility === 'INTERNAL' && (
            <span className="inline-flex items-center gap-1" title="เฉพาะบุคลากร มอ.">
              <Lock className="size-3" aria-hidden /> ภายใน
            </span>
          )}
          <VerificationBadge status={article.verification_status === 'VERIFIED' ? 'VERIFIED' : null} />
          {tagsOf(article)
            .slice(0, 3)
            .map((t) => (
              <Link
                key={t.id}
                href={`/articles?tag=${encodeURIComponent(t.slug)}`}
                className="rounded-full bg-zinc-100 px-2 py-0.5 hover:bg-zinc-200"
              >
                {t.name}
              </Link>
            ))}
        </div>
      </div>
      {cover && (
        <Link href={`/articles/${article.slug}`} className="shrink-0" tabIndex={-1} aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" loading="lazy" className="h-20 w-28 rounded-md object-cover sm:h-28 sm:w-40" />
        </Link>
      )}
    </article>
  )
}

/** Vertical card used in grids (featured / verified sections). */
export function ArticleCard({
  article,
  className,
  large = false,
}: {
  article: CardArticle
  className?: string
  large?: boolean
}) {
  const community = communityOf(article)
  const cover = mediaUrl(article.featured_image, large ? 'hero' : 'card')
  const ratio = large ? 'aspect-[16/9]' : 'aspect-[16/10]'
  return (
    <article className={cn('group flex flex-col', className)}>
      <Link href={`/articles/${article.slug}`} className="block overflow-hidden rounded-xl bg-zinc-100" tabIndex={-1} aria-hidden>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            loading="lazy"
            className={cn('w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]', ratio)}
          />
        ) : (
          <div className={cn('w-full bg-gradient-to-br from-brand-100 to-brand-200', ratio)} />
        )}
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        {community && <span className="font-medium text-brand-700">{community.name}</span>}
        <VerificationBadge status={article.verification_status === 'VERIFIED' ? 'VERIFIED' : null} />
      </div>
      <Link href={`/articles/${article.slug}`}>
        <h3
          className={cn(
            'mt-1.5 font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-brand-700',
            large ? 'text-2xl sm:text-3xl' : 'text-lg',
          )}
        >
          {article.title}
        </h3>
      </Link>
      {article.excerpt && (
        <p className={cn('mt-1.5 font-serif text-zinc-600', large ? 'line-clamp-3' : 'line-clamp-2 text-sm')}>
          {article.excerpt}
        </p>
      )}
      <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
        <AuthorChip author={article.author_public} />
        <span aria-hidden>·</span>
        <time className="text-xs" dateTime={article.published_at ?? undefined}>
          {formatDate(article.published_at)}
        </time>
      </div>
    </article>
  )
}
