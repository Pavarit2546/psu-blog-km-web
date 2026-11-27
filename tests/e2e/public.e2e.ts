import { expect, test } from './fixtures'

test.describe('Public site (anonymous)', () => {
  test('visitors entering the site see the login form first', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible()
    await expect(page.getByRole('link', { name: /PSU Passport/ })).toHaveAttribute('href', '/login/passport')
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  })

  test('verified article shows the PSU Verified badge and verification details', async ({ page }) => {
    await page.goto('/articles?verified=1')
    await page.locator('main article h3').first().click()
    await expect(page.getByText('PSU Verified Knowledge').first()).toBeVisible()
    await expect(page.locator('#verification')).toContainText('ได้รับการรับรองโดย')
    await page.getByRole('link', { name: 'ดูฉบับที่ได้รับการรับรอง' }).click()
    await expect(page.getByText('ฉบับที่ได้รับการรับรอง (snapshot ที่ไม่เปลี่ยนแปลง)')).toBeVisible()
  })

  test('community blog article is labelled differently from verified knowledge', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent('ชวนเขียน'))
    await page.getByRole('link', { name: /ชวนเขียน/ }).first().click()
    await expect(page).toHaveURL(/\/articles\//)
    await expect(page.getByText('Community Blog').first()).toBeVisible()
    await expect(page.getByText('PSU Verified Knowledge')).toHaveCount(0)
  })

  test('search finds public articles but not INTERNAL ones', async ({ page }) => {
    await page.goto('/search?q=' + encodeURIComponent('สวัสดิการ'))
    await expect(page.locator('main li').first()).toBeVisible()
    await page.goto('/search?q=PDPA')
    await expect(page.getByText(/พบ\s*0\s*รายการ/)).toBeVisible()
  })

  test('communities list and detail', async ({ page }) => {
    await page.goto('/communities')
    await page.getByRole('link', { name: /CoP การบริหารทรัพยากรบุคคล/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('CoP การบริหารทรัพยากรบุคคล')
    await expect(page.getByRole('link', { name: 'เข้าสู่ระบบเพื่อเข้าร่วม' })).toBeVisible()
  })
})
