import Link from 'next/link'

import { getCommunities } from '@/services/projections'
import { mediaUrl } from '@/lib/server/data'

export const metadata = { title: 'ชุมชนนักปฏิบัติ' }

export default async function CommunitiesPage() {
  const { docs } = await getCommunities({ sort: 'name', limit: 100 })
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">ชุมชนนักปฏิบัติ (CoP)</h1>
      <p className="mt-2 max-w-2xl text-zinc-600">
        เข้าร่วมชุมชนเพื่อแลกเปลี่ยนความรู้ และส่งบทความให้ชุมชนรับรองเป็น PSU Verified Knowledge
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((c) => {
          const cover = mediaUrl(c.cover_image, 'card')
          return (
            <Link
              key={c.id}
              href={`/communities/${c.slug}`}
              className="group overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md"
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cover} alt="" className="aspect-[2/1] w-full object-cover" loading="lazy" />
              ) : (
                <div className="aspect-[2/1] bg-brand-100" />
              )}
              <div className="p-5">
                <h2 className="text-lg font-semibold group-hover:text-brand-700">{c.name}</h2>
                <p className="mt-1 line-clamp-3 text-sm text-zinc-600">{c.description}</p>
                <p className="mt-3 text-xs text-zinc-500">{c.memberCount} สมาชิก</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
