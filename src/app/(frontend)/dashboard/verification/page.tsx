import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClipboardCheck, Gavel, History, Inbox } from 'lucide-react'

import { isSuperAdmin, relId } from '@/access/roles'
import { AssignForm, DecisionForm, ReviewForm } from '@/components/site/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { communityRolesFor, getCurrentUser } from '@/lib/server/data'
import { find } from '@/services/api'
import { getAssignmentOptions } from '@/services/projections'
import { formatDateTime } from '@/lib/utils'
import type { VerificationRequest } from '@/payload-types'

export const metadata = { title: 'งานรับรองความรู้' }

const DECISION_LABEL: Record<string, string> = {
  REQUEST_REVISION: 'ขอให้แก้ไข',
  RECOMMEND_APPROVAL: 'เสนออนุมัติ',
  RECOMMEND_REJECTION: 'เสนอไม่อนุมัติ',
  APPROVE: 'อนุมัติ',
  REJECT: 'ไม่อนุมัติ',
  REVOKE: 'เพิกถอน',
}

export default async function VerificationDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/verification')
  const roles = await communityRolesFor()
  const superAdmin = isSuperAdmin(user)

  const requestSelect = {
    title: true,
    status: true,
    article: true,
    community: true,
    submitted_at: true,
    reviewer_recommendation: true,
    assigned_reviewer: true,
    assigned_approver: true,
    article_version: true,
  } as const
  const populate = { articles: { slug: true, title: true }, communities: { name: true } } as const

  const [toAssign, toReview, toDecide, myReviews] = await Promise.all([
    roles.secretaryOf.length || superAdmin
      ? find({
          collection: 'verification-requests',
          where: {
            and: [
              { status: { in: ['PENDING', 'UNDER_REVIEW'] } },
              ...(superAdmin ? [] : [{ community: { in: roles.secretaryOf } }]),
            ],
          },
          sort: 'submitted_at',
          limit: 50,
          depth: 1,
          select: requestSelect,
          populate,
        })
      : Promise.resolve({ docs: [] as VerificationRequest[] }),
    find({
      collection: 'verification-requests',
      where: { and: [{ assigned_reviewer: { equals: user.id } }, { status: { equals: 'UNDER_REVIEW' } }] },
      sort: 'submitted_at',
      limit: 50,
      depth: 1,
      select: requestSelect,
      populate,
    }),
    find({
      collection: 'verification-requests',
      where: { and: [{ assigned_approver: { equals: user.id } }, { status: { equals: 'AWAITING_DECISION' } }] },
      sort: 'submitted_at',
      limit: 50,
      depth: 1,
      select: requestSelect,
      populate,
    }),
    find({
      collection: 'verification-reviews',
      where: { reviewer: { equals: user.id } },
      sort: '-reviewed_at',
      limit: 30,
      depth: 1,
      populate: { 'verification-requests': { title: true, status: true } },
    }),
  ])

  const assignRows = await Promise.all(
    toAssign.docs.map(async (r) => ({ r, options: await getAssignmentOptions(String(r.id)) })),
  )

  // Reviewer comments for requests awaiting the approver's decision.
  const decideReviews = toDecide.docs.length
    ? await find({
        collection: 'verification-reviews',
        where: { verification_request: { in: toDecide.docs.map((r) => r.id) } },
        sort: '-reviewed_at',
        limit: 100,
        depth: 0,
      })
    : { docs: [] }

  const articleLink = (r: Pick<VerificationRequest, 'article'>) => {
    const a = typeof r.article === 'object' ? r.article : null
    return a ? (
      <Link href={`/articles/${a.slug}`} className="font-semibold hover:text-brand-700" target="_blank">
        {a.title}
      </Link>
    ) : null
  }
  const meta = (r: Pick<VerificationRequest, 'community' | 'submitted_at' | 'status'>) => (
    <p className="text-xs text-zinc-500">
      {typeof r.community === 'object' ? r.community?.name : ''} · ส่งเมื่อ {formatDateTime(r.submitted_at)} · {r.status}
    </p>
  )
  const nothingToDo = !roles.secretaryOf.length && !roles.reviewerOf.length && !roles.approverOf.length && !superAdmin

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">งานรับรองความรู้ (Verification)</h1>
      <p className="mt-1 text-zinc-600">
        การรับรองแยกจากการเผยแพร่ — บทความยังเผยแพร่ตามปกติระหว่างการพิจารณา ระบบป้องกันไม่ให้ผู้เขียนตรวจหรืออนุมัติบทความของตนเอง
      </p>
      {nothingToDo && (
        <p className="mt-6 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-600">
          คุณยังไม่มีบทบาทเลขานุการ/ผู้ตรวจทาน/ผู้อนุมัติในชุมชนใด — ติดตามคำขอของคุณได้ที่{' '}
          <Link href="/dashboard" className="text-brand-600 underline">
            แดชบอร์ดของฉัน
          </Link>
        </p>
      )}

      {(roles.secretaryOf.length > 0 || superAdmin) && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="size-5 text-brand-600" aria-hidden /> คำขอที่รอมอบหมาย (เลขานุการ CoP)
            </CardTitle>
            <CardDescription>เลือกผู้ตรวจทานและผู้อนุมัติจากทีมของชุมชน</CardDescription>
          </CardHeader>
          <CardContent>
            {assignRows.length === 0 ? (
              <p className="text-sm text-zinc-400">ไม่มีคำขอค้าง</p>
            ) : (
              <ul className="flex flex-col gap-6">
                {assignRows.map(({ r, options }) => (
                  <li key={r.id} className="rounded-lg border border-zinc-200 p-4">
                    {articleLink(r)}
                    {meta(r)}
                    <div className="mt-3">
                      <AssignForm requestId={String(r.id)} reviewers={options.reviewers} approvers={options.approvers} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="size-5 text-brand-600" aria-hidden /> งานตรวจทานที่ได้รับมอบหมาย (COP_REVIEWER)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {toReview.docs.length === 0 ? (
            <p className="text-sm text-zinc-400">ไม่มีงานตรวจทาน</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {toReview.docs.map((r) => (
                <li key={r.id} className="rounded-lg border border-zinc-200 p-4">
                  {articleLink(r)}
                  {meta(r)}
                  <p className="mt-1 text-xs text-zinc-500">ตรวจฉบับ version: {r.article_version ?? '-'}</p>
                  <div className="mt-3">
                    <ReviewForm requestId={String(r.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="size-5 text-verified-600" aria-hidden /> รอการอนุมัติ (COP_APPROVER)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {toDecide.docs.length === 0 ? (
            <p className="text-sm text-zinc-400">ไม่มีรายการรออนุมัติ</p>
          ) : (
            <ul className="flex flex-col gap-6">
              {toDecide.docs.map((r) => (
                <li key={r.id} className="rounded-lg border border-zinc-200 p-4">
                  {articleLink(r)}
                  {meta(r)}
                  <div className="mt-2 rounded bg-zinc-50 p-3 text-sm">
                    <p>
                      ความเห็นผู้ตรวจทาน: <strong>{DECISION_LABEL[r.reviewer_recommendation ?? ''] ?? '-'}</strong>
                    </p>
                    {decideReviews.docs
                      .filter((v) => relId(v.verification_request) === String(r.id) && v.review_comment)
                      .map((v) => (
                        <p key={v.id} className="text-zinc-600">
                          “{v.review_comment}”
                        </p>
                      ))}
                  </div>
                  <div className="mt-3">
                    <DecisionForm requestId={String(r.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-zinc-500" aria-hidden /> ประวัติการพิจารณาของฉัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myReviews.docs.length === 0 ? (
            <p className="text-sm text-zinc-400">ยังไม่มีประวัติ</p>
          ) : (
            <ul className="divide-y divide-zinc-100 text-sm">
              {myReviews.docs.map((v) => {
                const req = typeof v.verification_request === 'object' ? v.verification_request : null
                return (
                  <li key={v.id} className="py-2">
                    <span className="font-medium">{req?.title}</span> — {DECISION_LABEL[v.decision] ?? v.decision}
                    <span className="ml-2 text-xs text-zinc-400">{formatDateTime(v.reviewed_at)}</span>
                    {v.review_comment && <p className="text-zinc-600">{v.review_comment}</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
