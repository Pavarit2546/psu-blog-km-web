import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, FileText, History, Lock, Paperclip, PencilLine, Users } from 'lucide-react'

import { isAdmin, relId } from '@/access/roles'
import { AuthorChip } from '@/components/site/AuthorChip'
import {
  BookmarkButton,
  CancelRequestButton,
  CommentActions,
  CommentForm,
  RequestVerificationForm,
  RevokeForm,
  ShareButton,
} from '@/components/site/client'
import { RichText } from '@/components/site/RichText'
import { VerificationBadge, verificationLabel } from '@/components/site/VerificationBadge'
import { buttonVariants } from '@/components/ui/button'
import { lexicalToPlainText, readingMinutes } from '@/lib/content'
import { communityRolesFor, getCurrentUser, incrementViewCount, mediaUrl } from '@/lib/server/data'
import { find } from '@/services/api'
import { getVerified } from '@/services/projections'
import { cn, formatDate, formatDateTime } from '@/lib/utils'
import type { Comment, Community, Media, Tag } from '@/payload-types'

type Props = { params: Promise<{ slug: string }> }

async function loadArticle(slug: string) {
  const user = await getCurrentUser()
  const { docs } = await find({
    collection: 'articles',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    populate: {
      media: { url: true, alt: true, sizes: true, filename: true, filesize: true, mimeType: true, caption: true },
      communities: { name: true, slug: true },
      tags: { name: true, slug: true },
      'verification-requests': { status: true, community: true, submitted_at: true },
    },
  })
  return { article: docs[0], user }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { article } = await loadArticle(slug)
  return article ? { title: article.title, description: article.excerpt ?? undefined } : { title: 'ไม่พบบทความ' }
}

const STATUS_HELP: Record<string, string> = {
  NOT_SUBMITTED: 'บทความนี้เป็น Community Blog ยังไม่ได้ส่งขอรับรอง',
  PENDING: 'ส่งคำขอแล้ว รอเลขานุการ CoP มอบหมายผู้ตรวจ',
  UNDER_REVIEW: 'อยู่ระหว่างการตรวจทานโดย CoP — บทความยังเผยแพร่ตามปกติ',
  REVISION_REQUIRED: 'ผู้ตรวจทานขอให้แก้ไข แก้ไขแล้วส่งตรวจอีกครั้งได้',
  REJECTED: 'ไม่ผ่านการรับรอง บทความยังเผยแพร่เป็น Community Blog',
  REVOKED: 'การรับรองถูกเพิกถอน',
  REVERIFICATION_REQUIRED: 'เนื้อหาเปลี่ยนแปลงอย่างมีนัยสำคัญหลังการรับรอง ต้องรับรองฉบับปัจจุบันใหม่',
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const { article, user } = await loadArticle(slug)
  if (!article) notFound()

  const articleId = String(article.id)
  if (article.publication_status === 'PUBLISHED') await incrementViewCount(articleId)

  const isAuthor = Boolean(user && relId(article.author) === user.id)
  const roles = await communityRolesFor()
  const community = typeof article.community === 'object' ? (article.community as Community | null) : null
  const canModerate = Boolean(user && (isAdmin(user) || (community && roles.secretaryOf.includes(String(community.id)))))

  // Verification details --------------------------------------------------------
  const verifiedRequest = article.current_verified_version ? await getVerified(articleId) : null
  const verifiedCommunity = verifiedRequest?.community
  const canRevoke = Boolean(
    user &&
      !isAuthor &&
      ['VERIFIED', 'REVERIFICATION_REQUIRED'].includes(article.verification_status ?? '') &&
      (isAdmin(user) || (verifiedCommunity && roles.approverOf.includes(String(verifiedCommunity.id)))),
  )
  const activeRequest = typeof article.active_verification_request === 'object' ? article.active_verification_request : null
  const canRequest =
    isAuthor &&
    article.publication_status === 'PUBLISHED' &&
    ['NOT_SUBMITTED', 'REVISION_REQUIRED', 'REJECTED', 'REVOKED', 'REVERIFICATION_REQUIRED'].includes(article.verification_status ?? '')

  const history = user
    ? await find({
        collection: 'verification-history',
        where: { article: { equals: articleId } },
        sort: '-createdAt',
        limit: 20,
        depth: 0,
        select: { new_status: true, previous_status: true, action_note: true, createdAt: true },
      })
    : null

  // Comments ------------------------------------------------------------------------
  const comments = await find({
    collection: 'comments',
    where: { article: { equals: articleId } },
    sort: 'createdAt',
    limit: 300,
    depth: 0,
    select: { content: true, parent_comment: true, status: true, author_public: true, createdAt: true },
  })
  const roots = comments.docs.filter((c) => !c.parent_comment)
  const replies = (id: string) => comments.docs.filter((c) => relId(c.parent_comment) === id)

  const bookmark = user
    ? (
        await find({
          collection: 'bookmarks',
          where: { and: [{ user: { equals: user.id } }, { article: { equals: articleId } }] },
          limit: 1,
          depth: 0,
        })
      ).docs[0]
    : null

  const cover = mediaUrl(article.featured_image, 'hero')
  const attachments = (article.attachments ?? []).filter((m): m is Media => typeof m === 'object' && m !== null)
  const tags = (article.tags ?? []).filter((t): t is Tag => typeof t === 'object')
  const minutes = readingMinutes(lexicalToPlainText(article.content))
  const isVerified = article.verification_status === 'VERIFIED'

  const renderComment = (c: Pick<Comment, 'id' | 'content' | 'status' | 'author_public' | 'createdAt'>, nested = false) => (
    <li key={c.id} className={cn('py-4', nested && 'ml-6 border-l-2 border-zinc-100 pl-4')}>
      <div className="flex items-center gap-2 text-sm">
        <AuthorChip author={c.author_public} />
        <span className="text-xs text-zinc-500">{formatDateTime(c.createdAt)}</span>
        {c.status !== 'VISIBLE' && (
          <span className="rounded bg-amber-50 px-1.5 text-xs text-amber-800">{c.status === 'HIDDEN' ? 'ซ่อนอยู่' : 'ถูกรายงาน'}</span>
        )}
      </div>
      {/* Plain text only — React escapes it, so no HTML injection is possible. */}
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-zinc-800">{c.content}</p>
      {user && (
        <CommentActions
          commentId={String(c.id)}
          articleId={articleId}
          canReply={!nested && article.allow_comments !== false}
          canModerate={canModerate}
          status={c.status ?? 'VISIBLE'}
        />
      )}
      {!nested && replies(String(c.id)).length > 0 && (
        <ul>{replies(String(c.id)).map((r) => renderComment(r, true))}</ul>
      )}
    </li>
  )

  return (
    <article className="pb-20">
      <header className="mx-auto max-w-3xl px-4 pt-10">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-600 px-3 py-1 text-sm font-semibold text-white">
              <BadgeCheck className="size-4" aria-hidden /> PSU Verified Knowledge
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">
              <Users className="size-4" aria-hidden /> Community Blog
            </span>
          )}
          {!isVerified && <VerificationBadge status={article.verification_status === 'NOT_SUBMITTED' ? null : article.verification_status} />}
          {article.visibility === 'INTERNAL' && (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <Lock className="size-3" aria-hidden /> เฉพาะบุคลากร มอ.
            </span>
          )}
          {article.publication_status !== 'PUBLISHED' && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">{article.publication_status}</span>
          )}
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-[2.6rem]">{article.title}</h1>
        {article.subtitle && <p className="mt-3 font-serif text-xl text-zinc-500">{article.subtitle}</p>}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-zinc-100 py-3">
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <AuthorChip author={article.author_public} size="md" />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            {community && (
              <Link href={`/communities/${community.slug}`} className="font-medium text-brand-700 hover:underline">
                {community.name}
              </Link>
            )}
            <time dateTime={article.published_at ?? undefined}>{formatDate(article.published_at)}</time>
            <span>อ่าน {minutes} นาที</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <ShareButton title={article.title} />
          {user && <BookmarkButton articleId={articleId} bookmarkId={bookmark ? String(bookmark.id) : null} />}
          {isAuthor && (
            <a href={`/admin/collections/articles/${articleId}`} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              <PencilLine aria-hidden /> แก้ไข
            </a>
          )}
        </div>
      </header>

      {cover && (
        <figure className="mx-auto mt-6 max-w-4xl px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt={(article.featured_image as Media)?.alt ?? ''}
            className="aspect-[16/9] w-full rounded-xl object-cover"
          />
        </figure>
      )}

      <div className="mx-auto mt-8 max-w-3xl px-4">
        <RichText data={article.content} />

        {attachments.length > 0 && (
          <section className="mt-10" aria-labelledby="attach-heading">
            <h2 id="attach-heading" className="flex items-center gap-2 font-semibold">
              <Paperclip className="size-4" aria-hidden /> ไฟล์แนบ
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {attachments.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.url ?? '#'}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
                    rel="noopener noreferrer"
                  >
                    <FileText className="size-5 text-brand-600" aria-hidden />
                    <span className="flex-1 truncate">{m.filename}</span>
                    <span className="text-xs text-zinc-500">{m.filesize ? `${Math.round(m.filesize / 1024)} KB` : ''}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {tags.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/articles?tag=${encodeURIComponent(t.slug)}`}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        {/* ----------------------- Verification ----------------------- */}
        <section
          id="verification"
          className={cn(
            'mt-12 rounded-xl border p-5',
            isVerified ? 'border-verified-600/30 bg-verified-50/60' : 'border-zinc-200 bg-zinc-50/60',
          )}
          aria-labelledby="verification-heading"
        >
          <h2 id="verification-heading" className="flex items-center gap-2 font-semibold">
            <BadgeCheck className={cn('size-5', isVerified ? 'text-verified-600' : 'text-zinc-400')} aria-hidden />
            การรับรองความรู้: {verificationLabel(article.verification_status)}
          </h2>
          {isVerified && verifiedRequest ? (
            <p className="mt-2 text-sm text-zinc-700">
              ได้รับการรับรองโดย <strong>{verifiedCommunity?.name ?? 'CoP'}</strong> เมื่อ {formatDate(article.verified_at)} ·{' '}
              <Link href={`/articles/${article.slug}/verified`} className="text-brand-600 underline">
                ดูฉบับที่ได้รับการรับรอง
              </Link>
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-600">{STATUS_HELP[article.verification_status ?? 'NOT_SUBMITTED']}</p>
          )}
          {!isVerified && verifiedRequest && (
            <p className="mt-1 text-sm">
              <Link href={`/articles/${article.slug}/verified`} className="text-brand-600 underline">
                ดูฉบับที่เคยได้รับการรับรอง ({formatDate(verifiedRequest.completed_at)})
              </Link>
            </p>
          )}

          {isAuthor && activeRequest && ['PENDING', 'UNDER_REVIEW', 'AWAITING_DECISION'].includes(activeRequest.status) && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span>คำขอปัจจุบัน: {activeRequest.status}</span>
              <CancelRequestButton requestId={String(activeRequest.id)} />
            </div>
          )}
          {canRequest && (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <RequestVerificationForm
                articleId={articleId}
                communities={roles.communities.filter((c) => roles.memberOf.includes(c.id))}
                defaultCommunity={community ? String(community.id) : null}
                resubmission={article.verification_status === 'REVISION_REQUIRED'}
              />
            </div>
          )}
          {canRevoke && (
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <RevokeForm articleId={articleId} />
            </div>
          )}
          {history && history.docs.length > 0 && (
            <details className="mt-4 text-sm">
              <summary className="flex cursor-pointer items-center gap-1 text-zinc-600">
                <History className="size-4" aria-hidden /> ประวัติการรับรอง ({history.docs.length})
              </summary>
              <ol className="mt-3 flex flex-col gap-2 border-l-2 border-zinc-200 pl-4">
                {history.docs.map((h) => (
                  <li key={h.id}>
                    <span className="font-medium">{verificationLabel(h.new_status) || h.new_status}</span>{' '}
                    <span className="text-xs text-zinc-500">{formatDateTime(h.createdAt)}</span>
                    {h.action_note && <p className="text-zinc-600">{h.action_note}</p>}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>

        {/* ----------------------- Comments ----------------------- */}
        <section className="mt-12" aria-labelledby="comments-heading">
          <h2 id="comments-heading" className="text-xl font-bold">
            ความคิดเห็น ({comments.docs.filter((c) => c.status !== 'HIDDEN').length})
          </h2>
          {article.allow_comments === false ? (
            <p className="mt-3 text-sm text-zinc-500">ผู้เขียนปิดการแสดงความคิดเห็น</p>
          ) : user ? (
            <div className="mt-4">
              <CommentForm articleId={articleId} />
            </div>
          ) : (
            <p className="mt-3 text-sm">
              <Link href={`/login?next=/articles/${article.slug}`} className="text-brand-600 underline">
                เข้าสู่ระบบ
              </Link>{' '}
              เพื่อแสดงความคิดเห็น
            </p>
          )}
          <ul className="mt-4 divide-y divide-zinc-100">{roots.map((c) => renderComment(c))}</ul>
        </section>
      </div>
    </article>
  )
}
