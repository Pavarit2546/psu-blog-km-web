import { email, expect, PASSWORD, test } from './fixtures'

test.describe('Authentication UI', () => {
  test('protected page redirects to login and returns after sign-in; logout ends the session', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?next=(%2F|\/)dashboard$/)
    await expect(page.getByText('Mock PSU Authentication (Development only)')).toBeVisible()

    await page.getByLabel('อีเมล (บัญชีทดสอบ)').fill(email('personnel'))
    await page.getByLabel('รหัสผ่าน').fill(PASSWORD)
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('สวัสดี')

    await page.getByRole('button', { name: 'ออกจากระบบ' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
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
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
