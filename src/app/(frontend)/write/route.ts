import { getCurrentUser } from '@/lib/server/data'

/**
 * Writing uses Payload's Lexical editor in the admin panel (access control limits
 * personnel to their own articles). This route is the friendly entry point.
 */
export async function GET() {
  const user = await getCurrentUser()
  const location = user ? '/admin/collections/articles/create' : '/login?next=/write'
  return new Response(null, { status: 307, headers: { Location: location, 'Cache-Control': 'private, no-store' } })
}
