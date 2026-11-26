import { config as loadEnv } from 'dotenv'
import { expect, test as base, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test'

loadEnv({ quiet: true } as never)

export const PASSWORD = process.env.SEED_DEMO_PASSWORD ?? ''
export type DemoKey = 'personnel' | 'writer' | 'secretary' | 'reviewer' | 'approver' | 'hradmin' | 'superadmin'
export const email = (key: DemoKey) => `${key}@demo.psu.local`

export const uniq = (prefix: string) => `${prefix} E2E-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

/** Log a browser context in through the REST API (fast); the cookie is stored in the context. */
export async function apiLogin(request: APIRequestContext, baseURL: string, key: DemoKey) {
  const res = await request.post('/api/users/login', {
    data: { email: email(key), password: PASSWORD },
    headers: { Origin: baseURL },
  })
  expect(res.ok(), `login as ${key}`).toBeTruthy()
}

/** New isolated browser context + page, logged in as `key`. */
export async function pageAs(browser: Browser, baseURL: string, key: DemoKey): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ baseURL, locale: 'th-TH', timezoneId: 'Asia/Bangkok' })
  await apiLogin(context.request, baseURL, key)
  const page = await context.newPage()
  return { context, page }
}

/** Lexical JSON with a single paragraph. */
export const lexical = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        textStyle: '',
        children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
      },
    ],
  },
})

/** Create a published article through the REST API as the logged-in context user. Returns its slug and id. */
export async function createArticleViaApi(
  request: APIRequestContext,
  baseURL: string,
  data: { title: string; body?: string; visibility?: 'PUBLIC' | 'INTERNAL'; communitySlug?: string; authorDisplay?: 'REAL_NAME' | 'PEN_NAME' },
) {
  let community: string | undefined
  if (data.communitySlug) {
    const c = await request.get(`/api/communities?where[slug][equals]=${data.communitySlug}&depth=0`)
    community = (await c.json()).docs[0]?.id
  }
  const res = await request.post('/api/articles', {
    headers: { Origin: baseURL },
    data: {
      title: data.title,
      content: lexical(data.body ?? 'เนื้อหาทดสอบอัตโนมัติ (E2E)'),
      publication_status: 'PUBLISHED',
      visibility: data.visibility ?? 'PUBLIC',
      community,
      author_display: data.authorDisplay,
    },
  })
  expect(res.status(), await res.text()).toBe(201)
  const { doc } = await res.json()
  return { id: doc.id as string, slug: doc.slug as string }
}

export const test = base.extend<{ baseURLString: string }>({
  baseURLString: async ({ baseURL }, provide) => provide(baseURL ?? 'http://localhost:3100'),
})
export { expect }
