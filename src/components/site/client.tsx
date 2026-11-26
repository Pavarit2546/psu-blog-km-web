'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck, Check, Flag, LogOut, Share2 } from 'lucide-react'
import React, { useState, useTransition } from 'react'

import { Button } from '@/components/ui/button'
import { Input, Label, Select, Textarea } from '@/components/ui/input'

// -----------------------------------------------------------------------------
// Small fetch helper for same-origin JSON calls (cookie auth; Payload checks Origin = CSRF guard)
// -----------------------------------------------------------------------------
export async function api<T = unknown>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(path, {
    method: init?.method ?? 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = (data as { errors?: { message?: string }[] })?.errors?.[0]?.message ?? 'เกิดข้อผิดพลาด'
    throw new Error(message)
  }
  return data as T
}

function useAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const run = (fn: () => Promise<unknown>, successMessage?: string) => {
    setError(null)
    setDone(null)
    startTransition(async () => {
      try {
        await fn()
        if (successMessage) setDone(successMessage)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      }
    })
  }
  return { pending, error, done, run }
}

function Feedback({ error, done }: { error: string | null; done: string | null }) {
  if (error)
    return (
      <p role="alert" className="text-sm text-red-600">
        {error}
      </p>
    )
  if (done)
    return (
      <p role="status" className="text-sm text-verified-700">
        {done}
      </p>
    )
  return null
}

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
export function LoginForm({ next }: { next: string }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    startTransition(async () => {
      try {
        await api('/api/users/login', { body: { email: form.get('email'), password: form.get('password') } })
        window.location.assign(next)
      } catch {
        // Generic message: do not reveal whether the account exists.
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกล็อกชั่วคราว')
      }
    })
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">อีเมล (บัญชีทดสอบ)</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} size="lg">
        {pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
      </Button>
    </form>
  )
}

export function LogoutButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await api('/api/users/logout').catch(() => undefined)
          router.push('/')
          router.refresh()
        })
      }
    >
      <LogOut aria-hidden /> <span className="sr-only sm:not-sr-only">ออกจากระบบ</span>
    </Button>
  )
}

// -----------------------------------------------------------------------------
// Article actions
// -----------------------------------------------------------------------------
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false)
  const onClick = async () => {
    const url = window.location.href.split('#')[0]
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined)
      return
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Button variant="ghost" size="sm" onClick={onClick} aria-label="แชร์บทความ">
      {copied ? <Check aria-hidden /> : <Share2 aria-hidden />} {copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}
    </Button>
  )
}

export function BookmarkButton({ articleId, bookmarkId }: { articleId: string; bookmarkId: string | null }) {
  const { pending, run } = useAction()
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-pressed={Boolean(bookmarkId)}
      onClick={() =>
        run(() =>
          bookmarkId
            ? api(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' })
            : api('/api/bookmarks', { body: { article: articleId } }),
        )
      }
    >
      {bookmarkId ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />} {bookmarkId ? 'บันทึกแล้ว' : 'บันทึก'}
    </Button>
  )
}

export function RequestVerificationForm({
  articleId,
  communities,
  defaultCommunity,
  resubmission,
}: {
  articleId: string
  communities: { id: string; name: string }[]
  defaultCommunity?: string | null
  resubmission?: boolean
}) {
  const { pending, error, done, run } = useAction()
  const [community, setCommunity] = useState(defaultCommunity ?? communities[0]?.id ?? '')
  const [note, setNote] = useState('')
  if (communities.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        ต้องเป็นสมาชิกของชุมชน (CoP) ก่อนขอรับรอง — <Link className="text-brand-600 underline" href="/communities">เข้าร่วมชุมชน</Link>
      </p>
    )
  }
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () => api('/api/verification/request', { body: { articleId, communityId: community, note } }),
          'ส่งคำขอรับรองแล้ว บทความยังคงเผยแพร่ตามปกติระหว่างการพิจารณา',
        )
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cop">ชุมชน (CoP) ผู้รับรอง</Label>
        <Select id="cop" value={community} onChange={(e) => setCommunity(e.target.value)}>
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="vnote">หมายเหตุถึงผู้ตรวจ (ไม่บังคับ)</Label>
        <Textarea id="vnote" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Feedback error={error} done={done} />
      <Button type="submit" disabled={pending}>
        {resubmission ? 'ส่งตรวจอีกครั้ง' : 'ขอรับรอง PSU Verified'}
      </Button>
    </form>
  )
}

export function CancelRequestButton({ requestId }: { requestId: string }) {
  const { pending, error, run } = useAction()
  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm('ยืนยันยกเลิกคำขอรับรอง?')) run(() => api('/api/verification/cancel', { body: { requestId } }))
        }}
      >
        ยกเลิกคำขอ
      </Button>
      <Feedback error={error} done={null} />
    </div>
  )
}

export function AssignForm({
  requestId,
  reviewers,
  approvers,
}: {
  requestId: string
  reviewers: { id: string; name: string }[]
  approvers: { id: string; name: string }[]
}) {
  const { pending, error, done, run } = useAction()
  const [reviewer, setReviewer] = useState(reviewers[0]?.id ?? '')
  const [approver, setApprover] = useState(approvers[0]?.id ?? '')
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault()
        run(
          () => api('/api/verification/assign', { body: { requestId, reviewerId: reviewer, approverId: approver } }),
          'มอบหมายแล้ว',
        )
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`rv-${requestId}`}>ผู้ตรวจทาน</Label>
        <Select id={`rv-${requestId}`} value={reviewer} onChange={(e) => setReviewer(e.target.value)}>
          {reviewers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`ap-${requestId}`}>ผู้อนุมัติ</Label>
        <Select id={`ap-${requestId}`} value={approver} onChange={(e) => setApprover(e.target.value)}>
          {approvers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" disabled={pending || !reviewer || !approver}>
        มอบหมาย
      </Button>
      <div className="sm:col-span-3">
        <Feedback error={error} done={done} />
      </div>
    </form>
  )
}

export function ReviewForm({ requestId }: { requestId: string }) {
  const { pending, error, done, run } = useAction()
  const [comment, setComment] = useState('')
  const submit = (decision: string) =>
    run(() => api('/api/verification/review', { body: { requestId, decision, comment } }), 'บันทึกผลการตรวจทานแล้ว')
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={`rc-${requestId}`}>ความเห็นผู้ตรวจทาน</Label>
      <Textarea
        id={`rc-${requestId}`}
        value={comment}
        maxLength={2000}
        onChange={(e) => setComment(e.target.value)}
        placeholder="จำเป็นเมื่อขอให้แก้ไขหรือเสนอไม่อนุมัติ"
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="success" disabled={pending} onClick={() => submit('RECOMMEND_APPROVAL')}>
          เสนออนุมัติ
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => submit('REQUEST_REVISION')}>
          ขอให้แก้ไข
        </Button>
        <Button variant="destructive" disabled={pending} onClick={() => submit('RECOMMEND_REJECTION')}>
          เสนอไม่อนุมัติ
        </Button>
      </div>
      <Feedback error={error} done={done} />
    </div>
  )
}

export function DecisionForm({ requestId }: { requestId: string }) {
  const { pending, error, done, run } = useAction()
  const [note, setNote] = useState('')
  const submit = (decision: 'APPROVE' | 'REJECT') =>
    run(() => api('/api/verification/decide', { body: { requestId, decision, note } }), 'บันทึกการตัดสินแล้ว')
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={`dn-${requestId}`}>หมายเหตุ / เหตุผล</Label>
      <Textarea
        id={`dn-${requestId}`}
        value={note}
        maxLength={2000}
        onChange={(e) => setNote(e.target.value)}
        placeholder="จำเป็นเมื่อไม่อนุมัติ"
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="success" disabled={pending} onClick={() => submit('APPROVE')}>
          อนุมัติ (PSU Verified)
        </Button>
        <Button variant="destructive" disabled={pending} onClick={() => submit('REJECT')}>
          ไม่อนุมัติ
        </Button>
      </div>
      <Feedback error={error} done={done} />
    </div>
  )
}

export function RevokeForm({ articleId }: { articleId: string }) {
  const { pending, error, done, run } = useAction()
  const [reason, setReason] = useState('')
  const [open, setOpen] = useState(false)
  if (!open)
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        เพิกถอนการรับรอง
      </Button>
    )
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(() => api('/api/verification/revoke', { body: { articleId, reason } }), 'เพิกถอนแล้ว')
      }}
    >
      <Label htmlFor="revoke-reason">เหตุผลในการเพิกถอน (บังคับ)</Label>
      <Textarea id="revoke-reason" value={reason} required maxLength={2000} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          ยืนยันเพิกถอน
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          ยกเลิก
        </Button>
      </div>
      <Feedback error={error} done={done} />
    </form>
  )
}

// -----------------------------------------------------------------------------
// Communities
// -----------------------------------------------------------------------------
export function MembershipButton({ communityId, isMember }: { communityId: string; isMember: boolean }) {
  const { pending, error, run } = useAction()
  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant={isMember ? 'outline' : 'default'}
        disabled={pending}
        onClick={() =>
          run(() => api('/api/community-membership', { body: { communityId, action: isMember ? 'leave' : 'join' } }))
        }
      >
        {isMember ? 'ออกจากชุมชน' : 'เข้าร่วมชุมชน'}
      </Button>
      <Feedback error={error} done={null} />
    </div>
  )
}

// -----------------------------------------------------------------------------
// Comments
// -----------------------------------------------------------------------------
export function CommentForm({ articleId, parentId, onDone }: { articleId: string; parentId?: string; onDone?: () => void }) {
  const { pending, error, run } = useAction()
  const [content, setContent] = useState('')
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        run(async () => {
          await api('/api/comments', { body: { article: articleId, content, parent_comment: parentId } })
          setContent('')
          onDone?.()
        })
      }}
    >
      <Label htmlFor={`c-${parentId ?? 'root'}`} className="sr-only">
        ความคิดเห็น
      </Label>
      <Textarea
        id={`c-${parentId ?? 'root'}`}
        value={content}
        required
        maxLength={2000}
        placeholder={parentId ? 'ตอบกลับ…' : 'แสดงความคิดเห็นอย่างสุภาพและสร้างสรรค์…'}
        onChange={(e) => setContent(e.target.value)}
      />
      <Feedback error={error} done={null} />
      <div>
        <Button type="submit" size="sm" disabled={pending || !content.trim()}>
          {parentId ? 'ตอบกลับ' : 'ส่งความคิดเห็น'}
        </Button>
      </div>
    </form>
  )
}

export function CommentActions({
  commentId,
  articleId,
  canReply,
  canModerate,
  status,
}: {
  commentId: string
  articleId: string
  canReply: boolean
  canModerate: boolean
  status: string
}) {
  const { pending, error, done, run } = useAction()
  const [replying, setReplying] = useState(false)
  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 text-xs">
        {canReply && (
          <Button variant="ghost" size="sm" onClick={() => setReplying((v) => !v)}>
            ตอบกลับ
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => run(() => api('/api/comment-report', { body: { commentId } }), 'รายงานแล้ว ขอบคุณค่ะ')}
        >
          <Flag aria-hidden /> รายงาน
        </Button>
        {canModerate && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              run(() =>
                api(`/api/comments/${commentId}`, {
                  method: 'PATCH',
                  body: { status: status === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN' },
                }),
              )
            }
          >
            {status === 'HIDDEN' ? 'แสดงอีกครั้ง' : 'ซ่อน'}
          </Button>
        )}
      </div>
      <Feedback error={error} done={done} />
      {replying && <CommentForm articleId={articleId} parentId={commentId} onDone={() => setReplying(false)} />}
    </div>
  )
}

// -----------------------------------------------------------------------------
// Notifications
// -----------------------------------------------------------------------------
export function MarkReadButton({ id }: { id: string }) {
  const { pending, run } = useAction()
  return (
    <Button
      variant="link"
      size="sm"
      disabled={pending}
      onClick={() => run(() => api(`/api/notifications/${id}`, { method: 'PATCH', body: { read_at: new Date().toISOString() } }))}
    >
      ทำเครื่องหมายว่าอ่านแล้ว
    </Button>
  )
}
