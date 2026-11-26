import type { User } from '@/payload-types'

export const GLOBAL_ROLES = ['PSU_PERSONNEL', 'HR_ADMIN', 'SUPER_ADMIN'] as const
export type GlobalRole = (typeof GLOBAL_ROLES)[number]

type MaybeUser = Pick<User, 'id' | 'global_roles' | 'status'> | null | undefined

/** Normalise a relationship value (id or populated doc) to its id. */
export const relId = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return String((value as { id: unknown }).id)
  }
  return null
}

const isActive = (user: MaybeUser): user is NonNullable<MaybeUser> =>
  Boolean(user && user.status !== 'SUSPENDED')

export const hasRole = (user: MaybeUser, ...roles: GlobalRole[]): boolean =>
  isActive(user) && Array.isArray(user.global_roles) && user.global_roles.some((r) => roles.includes(r as GlobalRole))

export const isSuperAdmin = (user: MaybeUser) => hasRole(user, 'SUPER_ADMIN')
export const isAdmin = (user: MaybeUser) => hasRole(user, 'HR_ADMIN', 'SUPER_ADMIN')
