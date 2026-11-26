import { BadgeCheck, Clock, PencilLine, ShieldAlert, ShieldOff, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'

const MAP: Record<string, { label: string; variant: 'verified' | 'warning' | 'danger' | 'secondary'; icon: typeof Clock }> = {
  VERIFIED: { label: 'PSU Verified', variant: 'verified', icon: BadgeCheck },
  PENDING: { label: 'รอการรับรอง', variant: 'warning', icon: Clock },
  UNDER_REVIEW: { label: 'อยู่ระหว่างตรวจทาน', variant: 'warning', icon: Clock },
  REVISION_REQUIRED: { label: 'ต้องแก้ไขก่อนรับรอง', variant: 'warning', icon: PencilLine },
  REJECTED: { label: 'ไม่ผ่านการรับรอง', variant: 'secondary', icon: ShieldOff },
  REVOKED: { label: 'ถูกเพิกถอนการรับรอง', variant: 'danger', icon: ShieldOff },
  REVERIFICATION_REQUIRED: { label: 'ต้องรับรองใหม่', variant: 'warning', icon: ShieldAlert },
}

/** Distinguishes "PSU Verified" knowledge from ordinary Community Blog posts. */
export function VerificationBadge({ status, showCommunity = false }: { status?: string | null; showCommunity?: boolean }) {
  const entry = status ? MAP[status] : undefined
  if (!entry) {
    return showCommunity ? (
      <Badge variant="secondary">
        <Users aria-hidden /> Community Blog
      </Badge>
    ) : null
  }
  const Icon = entry.icon
  return (
    <Badge variant={entry.variant}>
      <Icon aria-hidden /> {entry.label}
    </Badge>
  )
}

export const verificationLabel = (status?: string | null) =>
  status ? (MAP[status]?.label ?? 'ยังไม่ได้ขอรับรอง') : ''
