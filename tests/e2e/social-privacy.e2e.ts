import { createArticleViaApi, expect, pageAs, test, uniq } from './fixtures'

test.describe('Comments, bookmarks, pen names, permissions', () => {
  test('comment, reply, bookmark and share on an article', async ({ browser, baseURLString }) => {
    const title = uniq('บทความคอมเมนต์')
    const author = await pageAs(browser, baseURLString, 'personnel')
    const { slug } = await createArticleViaApi(author.context.request, baseURLString, { title })

    const reader = await pageAs(browser, baseURLString, 'reviewer')
    await reader.page.goto(`/articles/${slug}`)
    const comment = `ความเห็นทดสอบ <b>ไม่ใช่ HTML</b> ${Date.now()}`
    await reader.page.getByPlaceholder('แสดงความคิดเห็นอย่างสุภาพและสร้างสรรค์…').fill(comment)
    await reader.page.getByRole('button', { name: 'ส่งความคิดเห็น' }).click()
    const item = reader.page.locator('li', { hasText: comment }).first()
    await expect(item).toBeVisible()
    // Rendered as text, not markup
    await expect(item.locator('b')).toHaveCount(0)

    await item.getByRole('button', { name: 'ตอบกลับ' }).click()
    await item.getByPlaceholder('ตอบกลับ…').fill('ตอบกลับทดสอบ')
    await item.getByRole('button', { name: 'ตอบกลับ' }).last().click()
    await expect(reader.page.getByText('ตอบกลับทดสอบ')).toBeVisible()

    await reader.page.getByRole('button', { name: 'บันทึก' }).click()
    await expect(reader.page.getByRole('button', { name: 'บันทึกแล้ว' })).toBeVisible()
    await reader.page.goto('/dashboard')
    await expect(reader.page.getByRole('link', { name: title })).toBeVisible()

    // The author gets a notification
    await author.page.goto('/dashboard')
    await expect(author.page.getByText('มีความคิดเห็นใหม่ในบทความของคุณ').first()).toBeVisible()
    await author.context.close()
    await reader.context.close()
  })

  test('anonymous readers are asked to log in before commenting', async ({ page }) => {
    await page.goto('/articles?verified=1')
    await page.locator('main article h3').first().click()
    await expect(page.getByText('เพื่อแสดงความคิดเห็น')).toBeVisible()
    await expect(page.getByRole('button', { name: 'ส่งความคิดเห็น' })).toHaveCount(0)
  })

  test('pen-name article never reveals the real author', async ({ browser, baseURLString }) => {
    const title = uniq('บทความนามปากกา')
    const writer = await pageAs(browser, baseURLString, 'writer')
    const { slug } = await createArticleViaApi(writer.context.request, baseURLString, { title, authorDisplay: 'PEN_NAME' })
    await writer.context.close()

    const anon = await browser.newContext({ baseURL: baseURLString })
    const page = await anon.newPage()
    await page.goto(`/articles/${slug}`)
    await expect(page.getByText('นักเล่าเรื่องปักษ์ใต้').first()).toBeVisible()
    const html = await page.content()
    expect(html).not.toContain('สมหญิง ตัวอย่าง') // synthetic real name of the writer account
    expect(html).not.toContain('คณะตัวอย่างศาสตร์')

    await page.getByRole('link', { name: /นักเล่าเรื่องปักษ์ใต้/ }).first().click()
    await expect(page).toHaveURL(/\/authors\//)
    await expect(page.getByText('เขียนภายใต้นามปากกา', { exact: true })).toBeVisible()
    expect(await page.content()).not.toContain('สมหญิง ตัวอย่าง')
    await anon.close()
  })

  test('personnel cannot open the admin statistics page', async ({ browser, baseURLString }) => {
    const { context, page } = await pageAs(browser, baseURLString, 'personnel')
    await page.goto('/dashboard/admin')
    await expect(page.getByRole('heading', { name: 'ไม่พบหน้าที่ต้องการ' })).toBeVisible()
    await context.close()
  })

  test('HR admin sees platform statistics', async ({ browser, baseURLString }) => {
    const { context, page } = await pageAs(browser, baseURLString, 'hradmin')
    await page.goto('/dashboard/admin')
    await expect(page.getByRole('heading', { name: 'แดชบอร์ดผู้ดูแลระบบ' })).toBeVisible()
    await expect(page.locator('dl dt', { hasText: 'PSU Verified' })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()
    await context.close()
  })

  test('user can join and leave a community', async ({ browser, baseURLString }) => {
    const { context, page } = await pageAs(browser, baseURLString, 'writer')
    await page.goto('/communities/learning-development')
    const join = page.getByRole('button', { name: 'เข้าร่วมชุมชน' })
    const leave = page.getByRole('button', { name: 'ออกจากชุมชน' })
    if (await leave.isVisible()) {
      await leave.click()
      await expect(join).toBeVisible()
    }
    await join.click()
    await expect(leave).toBeVisible()
    await leave.click()
    await expect(join).toBeVisible()
    await context.close()
  })
})
