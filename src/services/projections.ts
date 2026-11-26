import type { Article, AuditLog, Community, VerificationRequest } from '@/payload-types'
import { ApiError, apiRequest } from './api'

type NamedCommunity = Pick<Community, 'id' | 'name'>
type PublicProfile = {
  name: string
  profile_key: string
  avatar: string | null
  department: string | null
  position: string | null
  is_pen_name: boolean
}
type AuthorPage = {
  profile: PublicProfile
  isPen: boolean
  bio: string | null
  avatar: string | null
  communities: NamedCommunity[]
}
type VerifiedVersion = Pick<VerificationRequest, 'snapshot' | 'completed_at' | 'article_version'> & {
  community: Pick<Community, 'id' | 'name' | 'slug'> | null
}

async function getOptional<T>(path: string) {
  try {
    return await apiRequest<T | null>(path)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function getCommunities(opts: { slug?: string; limit?: number; sort?: string } = {}) {
  const params = new URLSearchParams()
  if (opts.slug !== undefined) params.set('slug', opts.slug)
  if (opts.limit !== undefined) params.set('limit', String(opts.limit))
  if (opts.sort !== undefined) params.set('sort', opts.sort)
  return apiRequest<{ docs: (Community & { memberCount: number; isMember: boolean })[] }>(
    `/api/km/communities${params.size ? `?${params}` : ''}`,
  )
}

export function getAuthor(key: string) {
  return getOptional<AuthorPage>(`/api/km/authors/${encodeURIComponent(key)}`)
}

export function getVerified(id: string) {
  return getOptional<VerifiedVersion>(`/api/km/articles/${encodeURIComponent(id)}/verified`)
}

export function getAssignmentOptions(requestId: string) {
  type Option = { id: string; name: string }
  return apiRequest<{ reviewers: Option[]; approvers: Option[] }>(
    `/api/km/requests/${encodeURIComponent(requestId)}/options`,
  )
}

type SearchHit = Pick<
  Article,
  'id' | 'title' | 'slug' | 'excerpt' | 'published_at' | 'verification_status' | 'publication_type' | 'author_public'
> & { community: Pick<Community, 'name' | 'slug'> | null }

export function searchArticles(query: string, limit = 20) {
  const params = new URLSearchParams({ q: query, limit: String(limit) })
  return apiRequest<{ query: string; hits: SearchHit[]; engine: 'postgres-keyword' }>(`/api/search?${params}`)
}

export function getPlatformStats() {
  return apiRequest<{
    users: number
    articles: number
    published: number
    drafts: number
    communityBlog: number
    verified: number
    pendingVerification: number
    communities: number
    recentActivities: Pick<AuditLog, 'id' | 'action' | 'entity_type' | 'entity_id' | 'timestamp'>[]
  }>('/api/platform-stats')
}

export function getDashboardMine() {
  type OwnArticle = Pick<Article, 'id' | 'title' | 'slug' | 'publication_status' | 'verification_status' | 'updatedAt' | 'view_count'>
  type OwnRequest = Pick<VerificationRequest, 'id' | 'title' | 'status' | 'submitted_at' | 'decision_note' | 'community' | 'article'>
  return apiRequest<{ articles: { docs: OwnArticle[]; totalDocs: number }; requests: { docs: OwnRequest[] } }>(
    '/api/km/dashboard-mine',
  )
}
