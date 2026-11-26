import Link from 'next/link'
import { Feather } from 'lucide-react'

import type { Article } from '@/payload-types'
import { cn } from '@/lib/utils'

type AuthorPublic = Article['author_public']

export function Initials({ name, className }: { name: string; className?: string }) {
  const letter = name.trim().slice(0, 1) || '?'
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700',
        className,
      )}
    >
      {letter}
    </span>
  )
}

/** Renders only the public projection of the author (pen names never reveal the real identity). */
export function AuthorChip({ author, size = 'sm' }: { author?: AuthorPublic | null; size?: 'sm' | 'md' }) {
  const name = author?.name || 'ผู้เขียน'
  const content = (
    <span className="inline-flex items-center gap-2">
      <Initials name={name} className={size === 'md' ? 'size-10 text-base' : undefined} />
      <span className="flex flex-col leading-tight">
        <span className={cn('font-medium text-zinc-900', size === 'md' && 'text-base')}>
          {name}
          {author?.is_pen_name && <Feather className="ml-1 inline size-3.5 text-zinc-400" aria-label="นามปากกา" />}
        </span>
        {size === 'md' && author?.department && <span className="text-xs text-zinc-500">{author.department}</span>}
      </span>
    </span>
  )
  return author?.profile_key ? (
    <Link href={`/authors/${author.profile_key}`} className="hover:opacity-80">
      {content}
    </Link>
  ) : (
    content
  )
}
