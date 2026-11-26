import { expect, test } from './fixtures'

const PAGES = ['/', '/articles', '/communities', '/search?q=KM', '/login']

test.describe('Responsive layout', () => {
  for (const path of PAGES) {
    test(`no horizontal overflow on ${path}`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow).toBeLessThanOrEqual(1)
    })
  }

  test('article page is readable on small screens', async ({ page }) => {
    await page.goto('/articles?verified=1')
    await page.locator('main article h3').first().click()
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    const fontSize = await page.locator('.article-body p').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    expect(fontSize).toBeGreaterThanOrEqual(16)
  })

  test('mobile navigation is shown on small screens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only')
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: 'เมนูมือถือ' })
    await expect(nav).toBeVisible()
    await nav.getByRole('link', { name: 'ชุมชน' }).click()
    await expect(page).toHaveURL(/\/communities$/)
  })
})
