import { headers as requestHeaders } from 'next/headers'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { json } from 'node:stream/consumers'

import type { Config } from '@/payload-types'

type Collections = Config['collections']
type Collection = keyof Collections
type Select<C extends Collection> = Config['collectionsSelect'][C]
type WhereValue = string | number | boolean | null | Where | readonly WhereValue[]
export type Where = { [key: string]: WhereValue | undefined }

export interface FindResult<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  nextPage: number | null
  prevPage: number | null
  pagingCounter: number
}

type FindArgs<C extends Collection> = {
  collection: C
  where?: Where
  limit?: number
  page?: number
  depth?: number
  select?: Select<C>
  populate?: Partial<Config['collectionsSelect']>
  sort?: string
}

export class ApiError extends Error {
  constructor(readonly status: number, path: string) {
    super(`API request to ${path} failed (HTTP ${status})`)
  }
}

/** Server-side JSON requests use the current visitor's session and browser CSRF context. */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const origin = new URL(process.env.API_ORIGIN || 'http://127.0.0.1:3101').origin
  const url = new URL(path, origin)
  if (
    !['http:', 'https:'].includes(url.protocol) || !path.startsWith('/api/') ||
    url.origin !== origin || !url.pathname.startsWith('/api/')
  ) {
    throw new Error('Expected a same-origin /api/ path')
  }

  const incoming = await requestHeaders()
  const headers = new Headers(init.headers)
  headers.set('accept', 'application/json')
  headers.set('cache-control', 'no-store')
  const cookie = incoming.get('cookie')?.split(';').map((pair) => pair.trim())
    .find((pair) => pair.startsWith('psu-km-token='))
  headers.delete('cookie')
  if (cookie) headers.set('cookie', cookie)
  for (const key of ['origin', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest']) {
    const value = incoming.get(key)
    if (value !== null) headers.set(key, value)
    else headers.delete(key)
  }
  // Node fetch replaces Sec-Fetch-Mode: navigate with cors. Native HTTP preserves
  // that distinction for Payload, which checks it for cross-site top-level reads.
  const request = new Request(url, { ...init, headers })
  const body = request.body ? Buffer.from(await request.arrayBuffer()) : undefined
  const send = url.protocol === 'https:' ? httpsRequest : httpRequest
  const response = await new Promise<IncomingMessage>((resolve, reject) => {
    const outgoing = send(url, {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      signal: request.signal,
    }, resolve)
    outgoing.once('error', reject)
    outgoing.end(body)
  })
  const status = response.statusCode ?? 500
  if (status < 200 || status >= 300) {
    response.resume()
    throw new ApiError(status, url.pathname)
  }
  if (status === 204 || request.method === 'HEAD') {
    response.resume()
    return undefined as T
  }
  return (await json(response)) as T
}

// Payload parses where as JSON. Its select and populate parsers expect nested qs keys.
function addFields(params: URLSearchParams, parent: string, fields: object) {
  for (const [key, value] of Object.entries(fields)) {
    const path = `${parent}[${key}]`
    if (typeof value === 'boolean') params.set(path, String(value))
    else if (value) addFields(params, path, value)
  }
}

function collectionPath<C extends Collection>(args: FindArgs<C>, suffix = '') {
  const params = new URLSearchParams()
  if (args.where) params.set('where', JSON.stringify(args.where))
  for (const key of ['limit', 'page', 'depth', 'sort'] as const) {
    const value = args[key]
    if (value !== undefined) params.set(key, String(value))
  }
  if (args.select) addFields(params, 'select', args.select)
  if (args.populate) addFields(params, 'populate', args.populate)
  return `/api/${args.collection}${suffix}${params.size ? `?${params}` : ''}`
}

export function find<C extends Collection>(args: FindArgs<C>) {
  return apiRequest<FindResult<Collections[C]>>(collectionPath(args))
}

export function count<C extends Collection>(args: Pick<FindArgs<C>, 'collection' | 'where'>) {
  return apiRequest<{ totalDocs: number }>(collectionPath(args, '/count'))
}
