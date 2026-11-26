import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BadgeCheck, FileText, Users } from 'lucide-react'

import { getCommunities } from '@/services/projections'
import { ArticleCard, ArticleRow } from '@/components/site/ArticleCard'
import { Initials } from '@/components/site/AuthorChip'
import { MembershipButton } from '@/components/site/client'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser, listArticles, mediaUrl } from '@/lib/server/data'
import type { User } from '@/payload-types'

export default async function CommunityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [user, communities] = await Promise.all([getCurrentUser(), getCommunities({ slug, limit: 1 })])
  const community = communities.docs[0]
  if (!community) notFound()

  const id = String(community.id)
  const [articles, verified] = await Promise.all([
    listArticles({ where: { community: { equals: id } }, limit: 20 }),
    listArticles({ where: { and: [{ community: { equals: id } }, { verification_status: { equals: 'VERIFIED' } }] }, limit: 4 }),
  ])
  const cover = mediaUrl(community.cover_image, 'hero')
  const people = (list: unknown) =>
    (Array.isArray(list) ? list : []).filter((u): u is User => typeof u === 'object' && u !== null)

  return (
    <div>
      <div className="relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-48 w-full object-cover sm:h-64" />
        ) : (
          <div className="h-48 bg-brand-100 sm:h-64" />
        )}
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
              <p className="mt-2 max-w-2xl text-zinc-600">{community.description}</p>
            </div>
            {user ? (
              <MembershipButton communityId={id} isMember={community.isMember} />
            ) : (
              <Link href={`/login?next=/communities/${slug}`} className={buttonVariants()}>
                เข้าสู่ระบบเพื่อเข้าร่วม
              </Link>
            )}
          </div>
          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-zinc-100 pt-4 text-center sm:max-w-md">
            <div>
              <dt className="flex items-center justify-center gap-1 text-xs text-zinc-500"><Users className="size-3.5" aria-hidden /> สมาชิก</dt>
              <dd className="text-2xl font-bold">{community.memberCount}</dd>
            </div>
            <div>
              <dt className="flex items-center justify-center gap-1 text-xs text-zinc-500"><FileText className="size-3.5" aria-hidden /> บทความ</dt>
              <dd className="text-2xl font-bold">{articles.totalDocs}</dd>
            </div>
            <div>
              <dt className="flex items-center justify-center gap-1 text-xs text-zinc-500"><BadgeCheck className="size-3.5" aria-hidden /> Verified</dt>
              <dd className="text-2xl font-bold text-verified-700">{verified.totalDocs}</dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-10 py-10 lg:grid-cols-[1fr_300px]">
          <div>
            {verified.docs.length > 0 && (
              <section className="mb-10" aria-labelledby="cv-heading">
                <h2 id="cv-heading" className="mb-4 flex items-center gap-2 text-lg font-bold text-verified-700">
                  <BadgeCheck className="size-5" aria-hidden /> ความรู้ที่ชุมชนรับรองแล้ว
                </h2>
                <div className="grid gap-6 sm:grid-cols-2">
                  {verified.docs.map((a) => (
                    <ArticleCard key={a.id} article={a} />
                  ))}
                </div>
              </section>
            )}
            <h2 className="border-b border-zinc-200 pb-3 text-lg font-bold">บทความในชุมชน</h2>
            {articles.docs.length === 0 ? (
              <p className="py-10 text-center text-zinc-500">ยังไม่มีบทความ</p>
            ) : (
              articles.docs.map((a) => <ArticleRow key={a.id} article={a} />)
            )}
          </div>
          <aside>
            <h2 className="font-bold">ทีมดูแลชุมชน</h2>
            {user ? (
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                {[
                  ...people(community.secretary).map((u) => ({ u, role: 'เลขานุการ' })),
                  ...people(community.reviewers).map((u) => ({ u, role: 'ผู้ตรวจทาน' })),
                  ...people(community.approvers).map((u) => ({ u, role: 'ผู้อนุมัติ' })),
                ].map(({ u, role }) => (
                  <li key={`${role}-${u.id}`} className="flex items-center gap-2">
                    <Initials name={u.display_name || u.name} />
                    <span>
                      {u.display_name || u.name}
                      <span className="block text-xs text-zinc-500">{role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">เข้าสู่ระบบเพื่อดูรายชื่อทีมดูแลและสมาชิก</p>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
