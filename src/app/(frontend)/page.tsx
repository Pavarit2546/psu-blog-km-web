import Link from 'next/link'
import { ArrowRight, BadgeCheck, PenSquare, TrendingUp, Users } from 'lucide-react'

import { ArticleCard, ArticleRow } from '@/components/site/ArticleCard'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser, listArticles, mediaUrl } from '@/lib/server/data'
import { find } from '@/services/api'
import { getCommunities } from '@/services/projections'

export default async function HomePage() {
  const user = await getCurrentUser()

  const [featured, latest, popular, verified, communities, tags] = await Promise.all([
    listArticles({ where: { featured: { equals: true } }, limit: 3 }),
    listArticles({ limit: 8 }),
    listArticles({ sort: '-view_count', limit: 5 }),
    listArticles({ where: { verification_status: { equals: 'VERIFIED' } }, limit: 3 }),
    getCommunities({ limit: 6 }),
    find({ collection: 'tags', limit: 12, sort: 'name', select: { name: true, slug: true } }),
  ])

  const hero = featured.docs[0] ?? latest.docs[0]
  const sideFeatured = (featured.docs.length > 1 ? featured.docs.slice(1) : latest.docs.slice(1, 3)).slice(0, 2)

  return (
    <div>
      <section className="border-b border-zinc-200 bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <p className="text-sm font-medium text-brand-600">มหาวิทยาลัยสงขลานครินทร์ · กองบริหารทรัพยากรบุคคล</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl">
            แบ่งปันความรู้จากหน้างาน <span className="text-brand-700">ให้เติบโตเป็นความรู้องค์กร</span>
          </h1>
          <p className="mt-4 max-w-2xl font-serif text-lg text-zinc-600">
            เขียนและเผยแพร่ได้ทันทีในรูปแบบ Community Blog และเลือกส่งให้ชุมชนนักปฏิบัติ (CoP) รับรองเป็น{' '}
            <span className="font-semibold text-verified-700">PSU Verified Knowledge</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={user ? '/write' : '/login?next=/write'} className={buttonVariants({ size: 'lg' })}>
              <PenSquare aria-hidden /> เริ่มเขียน
            </a>
            <Link href="/articles?verified=1" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
              <BadgeCheck aria-hidden className="text-verified-600" /> ความรู้ที่ได้รับการรับรอง
            </Link>
          </div>
        </div>
      </section>

      {hero && (
        <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-500">
            บทความแนะนำ
          </h2>
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <ArticleCard article={hero} large />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
              {sideFeatured.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 lg:grid-cols-[1fr_320px]">
        <section aria-labelledby="latest-heading">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <h2 id="latest-heading" className="text-xl font-bold tracking-tight">
              ล่าสุด
            </h2>
            <Link href="/articles" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
              ดูทั้งหมด <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          {latest.docs.length === 0 ? (
            <p className="py-10 text-center text-zinc-500">ยังไม่มีบทความ — เป็นคนแรกที่แบ่งปันความรู้!</p>
          ) : (
            latest.docs.map((a) => <ArticleRow key={a.id} article={a} />)
          )}
        </section>

        <aside className="flex flex-col gap-10">
          {verified.docs.length > 0 && (
            <section aria-labelledby="verified-heading" className="rounded-xl border border-verified-600/20 bg-verified-50/60 p-5">
              <h2 id="verified-heading" className="flex items-center gap-2 font-bold text-verified-700">
                <BadgeCheck className="size-5" aria-hidden /> PSU Verified Knowledge
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {verified.docs.map((a) => (
                  <li key={a.id}>
                    <Link href={`/articles/${a.slug}`} className="font-medium leading-snug hover:text-brand-700">
                      {a.title}
                    </Link>
                    <p className="text-xs text-zinc-500">{a.author_public?.name}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="popular-heading">
            <h2 id="popular-heading" className="flex items-center gap-2 font-bold">
              <TrendingUp className="size-5 text-brand-600" aria-hidden /> ยอดนิยม
            </h2>
            <ol className="mt-3 flex flex-col gap-4">
              {popular.docs.map((a, i) => (
                <li key={a.id} className="flex gap-3">
                  <span className="text-2xl font-bold leading-none text-zinc-300">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <Link href={`/articles/${a.slug}`} className="font-medium leading-snug hover:text-brand-700">
                      {a.title}
                    </Link>
                    <p className="text-xs text-zinc-500">{a.author_public?.name}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="tags-heading">
            <h2 id="tags-heading" className="font-bold">
              แท็กที่น่าสนใจ
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.docs.map((t) => (
                <Link
                  key={t.id}
                  href={`/articles?tag=${encodeURIComponent(t.slug)}`}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 hover:bg-zinc-200"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="border-t border-zinc-200 bg-zinc-50" aria-labelledby="communities-heading">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-center justify-between">
            <h2 id="communities-heading" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <Users className="size-5 text-brand-600" aria-hidden /> ชุมชนนักปฏิบัติ (CoP)
            </h2>
            <Link href="/communities" className="text-sm text-brand-600 hover:underline">
              ทั้งหมด
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {communities.docs.map((c) => {
              const cover = mediaUrl(c.cover_image, 'card')
              return (
                <Link
                  key={c.id}
                  href={`/communities/${c.slug}`}
                  className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
                >
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="aspect-[3/1] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="aspect-[3/1] bg-brand-100" />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:text-brand-700">{c.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{c.description}</p>
                    <p className="mt-2 text-xs text-zinc-500">{c.memberCount} สมาชิก</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
