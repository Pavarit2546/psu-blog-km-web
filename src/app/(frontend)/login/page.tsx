import { redirect } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

import { LoginForm } from '@/components/site/client'
import { getAuthProvider } from '@/lib/auth/provider'
import { getCurrentUser } from '@/lib/server/data'
import { safeNextPath } from '@/lib/utils'

export const metadata = { title: 'เข้าสู่ระบบ' }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  const target = safeNextPath(next, '/dashboard')
  if (await getCurrentUser()) redirect(target)
  const provider = getAuthProvider()
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">เข้าสู่ระบบ</h1>
      {provider.kind === 'mock' && (
        <div role="note" className="mt-4 flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <ShieldAlert className="size-5 shrink-0" aria-hidden />
          <div>
            <strong>Mock PSU Authentication (Development only)</strong>
            <p className="mt-1">
              ระบบนี้ยังไม่เชื่อมต่อ PSU SSO จริง ใช้เฉพาะบัญชีทดสอบ <code>*@demo.psu.local</code> ตาม README —
              ห้ามกรอกรหัสผ่าน PSU Passport จริง
            </p>
          </div>
        </div>
      )}
      <div className="mt-8">
        <LoginForm next={target} />
      </div>
    </div>
  )
}
