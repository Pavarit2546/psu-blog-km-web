import { notFound, redirect } from 'next/navigation'

import { isAdmin } from '@/access/roles'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/server/data'
import { getPlatformStats } from '@/services/projections'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'แดชบอร์ดผู้ดูแล' }

export default async function AdminDashboard() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=/dashboard/admin')
  if (!isAdmin(user)) notFound() // fail closed without revealing the page exists
  const stats = await getPlatformStats()

  const tiles = [
    { label: 'ผู้ใช้ทั้งหมด', value: stats.users },
    { label: 'บทความทั้งหมด', value: stats.articles },
    { label: 'Community Blog (เผยแพร่)', value: stats.communityBlog },
    { label: 'PSU Verified', value: stats.verified, accent: true },
    { label: 'รอการรับรอง', value: stats.pendingVerification },
    { label: 'ชุมชน (CoP)', value: stats.communities },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดผู้ดูแลระบบ</h1>
        <div className="flex gap-2">
          <a href="/admin/collections/users" className={buttonVariants({ variant: 'outline' })}>
            จัดการผู้ใช้
          </a>
          <a href="/admin/collections/communities" className={buttonVariants({ variant: 'outline' })}>
            จัดการชุมชน
          </a>
          <a href="/admin/collections/audit-logs" className={buttonVariants({ variant: 'ghost' })}>
            Audit logs
          </a>
        </div>
      </div>
      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.label} className={t.accent ? 'border-verified-600/30 bg-verified-50/60' : undefined}>
            <CardContent className="p-4">
              <dt className="text-xs text-zinc-500">{t.label}</dt>
              <dd className={`mt-1 text-3xl font-bold tabular-nums ${t.accent ? 'text-verified-700' : ''}`}>{t.value}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>กิจกรรมล่าสุด (Audit log)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-zinc-500">
                <tr>
                  <th className="py-2 pr-4 font-medium">เวลา</th>
                  <th className="py-2 pr-4 font-medium">การกระทำ</th>
                  <th className="py-2 pr-4 font-medium">ประเภท</th>
                  <th className="py-2 font-medium">รหัสรายการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {stats.recentActivities.map((a) => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap py-2 pr-4 text-zinc-500">{formatDateTime(a.timestamp)}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{a.action}</td>
                    <td className="py-2 pr-4">{a.entity_type}</td>
                    <td className="py-2 font-mono text-xs text-zinc-500">{a.entity_id?.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
