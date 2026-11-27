import { email, expect, PASSWORD, test } from './fixtures'

test.describe('Authentication UI', () => {
  test('protected page redirects to login and returns after sign-in; logout ends the session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)dashboard$/)
    await page.getByLabel('อีเมล (บัญชีทดสอบ)').fill(email('personnel'))
    await page.getByLabel('รหัสผ่าน').fill(PASSWORD)
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('สวัสดี')

    await page.getByRole('button', { name: 'ออกจากระบบ' }).click()
    await expect(page).toHaveURL(/\/login$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('language and theme persist through the Passport round trip and reload', async ({ page }) => {
    await page.goto('/login?next=%2Fdashboard')
    await page.getByLabel('อีเมล (บัญชีทดสอบ)').fill('personnel@demo.psu.local')
    await page.getByRole('button', { name: 'Switch to English' }).click()
    await expect(page.getByLabel('Email (test account)')).toHaveValue('personnel@demo.psu.local')
    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await page.getByRole('link', { name: /Continue with PSU Passport/ }).click()
    await expect(page.getByRole('heading', { name: 'PSU Passport is not available yet' })).toBeVisible()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expect(page.getByRole('button', { name: 'Switch to dark theme' })).toBeVisible()
    await page.getByRole('link', { name: 'Back to sign in' }).click()
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await page.getByRole('button', { name: 'เปลี่ยนเป็นภาษาไทย' }).click()
    await expect(page.getByRole('heading', { name: 'เข้าสู่ระบบ' })).toBeVisible()
  })

  // Uses an unknown account so repeated runs never trip the lockout on demo users;
  // the message is the same either way (no account enumeration).
  test('wrong credentials show a generic error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('อีเมล (บัญชีทดสอบ)').fill('nobody@demo.psu.local')
    await page.getByLabel('รหัสผ่าน').fill('definitely-wrong')
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page.locator('form [role="alert"]')).toContainText('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  })

  test('open redirects via ?next= are ignored', async ({ page }) => {
    await page.goto('/login?next=//evil.example/x')
    await page.getByLabel('อีเมล (บัญชีทดสอบ)').fill(email('writer'))
    await page.getByLabel('รหัสผ่าน').fill(PASSWORD)
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'คลังความรู้ ม.อ.' })).toBeVisible()
    await page.goto('/login')
    await expect(page).toHaveURL(/\/$/)
  })
})
