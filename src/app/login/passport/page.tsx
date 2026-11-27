import { safeNextPath } from '@/lib/utils'
import { PassportCard } from '../LoginScreen'

export default async function PassportPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  return <PassportCard next={safeNextPath((await searchParams).next)} />
}
