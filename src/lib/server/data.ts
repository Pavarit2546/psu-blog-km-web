import { cookies } from 'next/headers'
import { cache } from 'react'

import type { Article, Community, Media, Tag, User } from '@/payload-types'
import { ApiError, apiRequest, find, type Where } from '@/services/api'

export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!(await cookies()).get('psu-km-token')?.value) return null
  try {
    const { user } = await apiRequest<{ user: User | null }>('/api/users/me?depth=0')
    return user?.status === 'SUSPENDED' ? null : user
  } catch (error) {
    if (error instanceof ApiError && [401, 403, 404].includes(error.status)) return null
    throw error
  }
})

/** Fields a card/list view needs — never the private `author` relation. */
const CARD_SELECT = {
  title: true,
  subtitle: true,
  slug: true,
  excerpt: true,
  featured_image: true,
  community: true,
  tags: true,
  author_public: true,
  published_at: true,
  verification_status: true,
  publication_type: true,
  publication_status: true,
  visibility: true,
  view_count: true,
  updatedAt: true,
} as const

const CARD_POPULATE = {
  media: { url: true, alt: true, sizes: true, width: true, height: true },
  communities: { name: true, slug: true },
  tags: { name: true, slug: true },
} as const

export type CardArticle = Pick<
  Article,
  | 'id'
  | 'title'
  | 'subtitle'
  | 'slug'
  | 'excerpt'
  | 'author_public'
  | 'published_at'
  | 'verification_status'
  | 'publication_type'
  | 'publication_status'
  | 'visibility'
  | 'view_count'
  | 'updatedAt'
> & {
  featured_image?: Media | string | null
  community?: Community | string | null
  tags?: (Tag | string)[] | null
}

export function listArticles(opts: { where?: Where; sort?: string; limit?: number; page?: number } = {}) {
  return find({
    collection: 'articles',
    where: { and: [{ publication_status: { equals: 'PUBLISHED' } }, ...(opts.where ? [opts.where] : [])] },
    sort: opts.sort ?? '-published_at',
    limit: opts.limit ?? 12,
    page: opts.page ?? 1,
    depth: 1,
    select: CARD_SELECT,
    populate: CARD_POPULATE,
  })
}

export async function incrementViewCount(id: string) {
  try {
    await apiRequest<{ ok: true }>(`/api/km/articles/${encodeURIComponent(id)}/view`, { method: 'POST' })
  } catch (error) {
    // A cross-site link can authorize the article read without authorizing a
    // session-bound POST. The counter can also race an article being unpublished.
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }
}

type CommunityRoles = {
  memberOf: string[]
  secretaryOf: string[]
  reviewerOf: string[]
  approverOf: string[]
  communities: Pick<Community, 'id' | 'name'>[]
}

export const communityRolesFor = cache(() => apiRequest<CommunityRoles>('/api/km/roles'))

export const mediaUrl = (media: unknown, size?: 'thumbnail' | 'card' | 'hero'): string | null => {
  if (!media || typeof media !== 'object') return null
  const m = media as Media
  const sized = size ? m.sizes?.[size]?.url : null
  return sized || m.url || null
}
