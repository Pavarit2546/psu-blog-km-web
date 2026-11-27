import { redirect } from 'next/navigation'
import { getAuthProvider } from '@/lib/auth/provider'
import { getCurrentUser } from '@/lib/server/data'
import { safeNextPath } from '@/lib/utils'
import { SignInCard } from './LoginScreen'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const target = safeNextPath((await searchParams).next)
  if (await getCurrentUser()) redirect(target)
  return <SignInCard next={target} demo={getAuthProvider().isDevelopmentOnly} />
}
