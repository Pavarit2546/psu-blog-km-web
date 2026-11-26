import { apiLogin, expect, test, uniq } from './fixtures'

/** Writing happens in the Payload Admin with the Lexical editor. */
test.describe('Article editor (Payload Admin + Lexical)', () => {
  test('personnel writes a draft, then publishes it without approval', async ({ page, context, baseURLString }) => {
    await apiLogin(context.request, baseURLString, 'personnel')
    const title = uniq('บทความจาก Editor')

    await page.goto('/write')
    await expect(page).toHaveURL(/\/admin\/collections\/articles\/create/)
    await page.locator('#field-title').fill(title)
    const editor = page.locator('[data-lexical-editor="true"]')
    await editor.click()
    await page.keyboard.type('ย่อหน้าแรกที่พิมพ์ผ่าน Lexical editor ในการทดสอบอัตโนมัติ')

    // Save as draft (default publication status)
    await page.locator('#action-save').click()
    await expect(page).toHaveURL(/\/admin\/collections\/articles\/[0-9a-f-]{36}/)

    // Draft is visible to the author on their dashboard only
    await page.goto('/dashboard')
    const draftSection = page.getByRole('region', { name: 'ฉบับร่าง' })
    await expect(draftSection.getByText(title)).toBeVisible()

    // Publish: change status in the admin and save
    await draftSection.getByText(title).locator('xpath=..').getByRole('link', { name: 'แก้ไข' }).click()
    await page.locator('#field-publication_status .rs__control').click()
    await page.locator('.rs__option', { hasText: 'เผยแพร่ (Published)' }).click()
    await page.locator('#field-visibility .rs__control').click()
    await page.locator('.rs__option', { hasText: 'สาธารณะ' }).click()
    await page.locator('#action-save').click()
    await expect(page.locator('#field-publication_status')).toContainText('เผยแพร่ (Published)')
    await page.waitForLoadState('networkidle')

    // Visible to anonymous readers immediately
    const anon = await page.context().browser()!.newContext({ baseURL: baseURLString })
    const anonPage = await anon.newPage()
    await anonPage.goto('/search?q=' + encodeURIComponent(title))
    await anonPage.getByRole('link', { name: title }).click()
    await expect(anonPage.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(anonPage.locator('.article-body')).toContainText('ย่อหน้าแรกที่พิมพ์ผ่าน Lexical')
    await expect(anonPage.getByText('Community Blog').first()).toBeVisible()
    await anon.close()
  })

  test('verification status is read-only for authors in the admin', async ({ page, context, baseURLString }) => {
    await apiLogin(context.request, baseURLString, 'personnel')
    await page.goto('/admin/collections/articles/create')
    await expect(page.getByText('การรับรองความรู้ (แยกจากการเผยแพร่)')).toBeVisible()
    await expect(page.locator('#field-verification_status')).toHaveCount(1)
    await expect(page.locator('#field-verification_status input')).toBeDisabled()
  })
})
