import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Bell, Bookmark, FileText, MessageSquare, PenSquare, ShieldCheck, UserCog } from 'lucide-react'

import { isAdmin } from '@/access/roles'
import { MarkReadButton } from '@/components/site/client'
import { VerificationBadge } from '@/components/site/VerificationBadge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/server/data'
import { find } from '@/services/api'
import { getDashboardMine } from '@/services/projections'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import type { Article } from '@/payload-types'

export const metadata = { title: 'แดชบอร์ดของฉัน' }

const PUB_LABEL: Record<string, string> = { DRAFT: 'ฉบับร่าง', PUBLISHED: 'เผยแพร่แล้ว', ARCHIVED: 'เก็บถาวร' }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard')
  const { articles: mine, requests } = await getDashboardMine()
  const myIds = mine.docs.map((a) => a.id)
  const [comments, notifications, bookmarks] = await Promise.all([
    myIds.length
      ? find({
          collection: 'comments',
          where: { article: { in: myIds } },
          sort: '-createdAt',
          limit: 10,
          depth: 1,
          select: { content: true, article: true, createdAt: true, author_public: true },
          populate: { articles: { title: true, slug: true } },
        })
      : Promise.resolve({ docs: [] as never[] }),
    find({
      collection: 'notifications',
      sort: '-createdAt',
      limit: 20,
      depth: 1,
      populate: { articles: { slug: true } },
    }),
    find({
      collection: 'bookmarks',
      where: { user: { equals: user.id } },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
      populate: { articles: { title: true, slug: true } },
    }),
  ])

  const groups: Record<string, typeof mine.docs> = { DRAFT: [], PUBLISHED: [], ARCHIVED: [] }
  for (const a of mine.docs) groups[a.publication_status ?? 'DRAFT']?.push(a)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">สวัสดี {user.display_name || user.name}</h1>
          <p className="text-zinc-600">จัดการบทความ คำขอรับรอง และการแจ้งเตือนของคุณ</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/write" className={buttonVariants()}>
            <PenSquare aria-hidden /> เขียนบทความ
          </a>
          <Link href="/dashboard/verification" className={buttonVariants({ variant: 'outline' })}>
            <ShieldCheck aria-hidden /> งานรับรองความรู้
          </Link>
          <a href="/admin/account" className={buttonVariants({ variant: 'ghost' })}>
            <UserCog aria-hidden /> โปรไฟล์ / นามปากกา
          </a>
          {isAdmin(user) && (
            <Link href="/dashboard/admin" className={buttonVariants({ variant: 'ghost' })}>
              สถิติระบบ
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-brand-600" aria-hidden /> บทความของฉัน ({mine.totalDocs})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((status) => (
              <section key={status} aria-label={PUB_LABEL[status]}>
                <h3 className="mb-2 text-sm font-semibold text-zinc-500">
                  {PUB_LABEL[status]} ({groups[status].length})
                </h3>
                {groups[status].length === 0 ? (
                  <p className="text-sm text-zinc-400">—</p>
                ) : (
                  <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-100">
                    {groups[status].map((a: Pick<Article, 'id' | 'title' | 'slug' | 'verification_status' | 'updatedAt' | 'view_count'>) => (
                      <li key={a.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 text-sm">
                        <Link href={`/articles/${a.slug}`} className="min-w-0 flex-1 truncate font-medium hover:text-brand-700">
                          {a.title}
                        </Link>
                        <VerificationBadge status={a.verification_status === 'NOT_SUBMITTED' ? null : a.verification_status} />
                        <span className="text-xs text-zinc-400">{a.view_count ?? 0} views</span>
                        <a href={`/admin/collections/articles/${a.id}`} className="text-xs text-brand-600 hover:underline">
                          แก้ไข
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="size-5 text-brand-600" aria-hidden /> การแจ้งเตือน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.docs.length === 0 ? (
              <p className="text-sm text-zinc-400">ไม่มีการแจ้งเตือน</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notifications.docs.map((n) => {
                  const art = typeof n.related_article === 'object' ? n.related_article : null
                  return (
                    <li key={n.id} className={cn('rounded-lg p-3 text-sm', n.read_at ? 'bg-white' : 'bg-brand-50')}>
                      <p className="font-medium">{art?.slug ? <Link href={`/articles/${art.slug}`} className="hover:underline">{n.title}</Link> : n.title}</p>
                      {n.message && <p className="text-zinc-600">{n.message}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-400">{formatDateTime(n.createdAt)}</span>
                        {!n.read_at && <MarkReadButton id={String(n.id)} />}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-verified-600" aria-hidden /> คำขอรับรองของฉัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {requests.docs.length === 0 ? (
              <p className="text-sm text-zinc-400">ยังไม่มีคำขอ — เปิดบทความที่เผยแพร่แล้วเพื่อขอรับรอง</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {requests.docs.map((r) => {
                  const art = typeof r.article === 'object' ? r.article : null
                  const com = typeof r.community === 'object' ? r.community : null
                  return (
                    <li key={r.id} className="py-3 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={art?.slug ? `/articles/${art.slug}#verification` : '#'} className="font-medium hover:text-brand-700">
                          {r.title}
                        </Link>
                        <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{r.status}</span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {com?.name} · ส่งเมื่อ {formatDate(r.submitted_at)}
                      </p>
                      {r.decision_note && r.status !== 'PENDING' && <p className="mt-1 text-zinc-600">หมายเหตุ: {r.decision_note}</p>}
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-brand-600" aria-hidden /> ความคิดเห็นล่าสุดในบทความของฉัน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.docs.length === 0 ? (
                <p className="text-sm text-zinc-400">ยังไม่มีความคิดเห็น</p>
              ) : (
                <ul className="flex flex-col gap-3 text-sm">
                  {comments.docs.map((c) => {
                    const art = typeof c.article === 'object' ? c.article : null
                    return (
                      <li key={c.id}>
                        <p className="line-clamp-2 text-zinc-800">“{c.content}”</p>
                        <p className="text-xs text-zinc-500">
                          {c.author_public?.name} ·{' '}
                          <Link href={`/articles/${art?.slug ?? ''}`} className="hover:underline">
                            {art?.title}
                          </Link>
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="size-5 text-brand-600" aria-hidden /> บันทึกไว้อ่าน
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bookmarks.docs.length === 0 ? (
                <p className="text-sm text-zinc-400">ยังไม่มีบทความที่บันทึก</p>
              ) : (
                <ul className="flex flex-col gap-2 text-sm">
                  {bookmarks.docs.map((b) => {
                    const art = typeof b.article === 'object' ? b.article : null
                    return art ? (
                      <li key={b.id}>
                        <Link href={`/articles/${art.slug}`} className="hover:text-brand-700">
                          {art.title}
                        </Link>
                      </li>
                    ) : null
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
