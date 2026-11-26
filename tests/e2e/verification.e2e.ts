import { createArticleViaApi, expect, pageAs, test, uniq } from './fixtures'

/**
 * Full PSU Verified journey through the UI, four different people:
 * author requests → secretary assigns → reviewer recommends → approver approves.
 */
test('verification workflow end-to-end through the UI', async ({ browser, baseURLString }) => {
  const title = uniq('ขอรับรองผ่าน UI')

  // 1) Author publishes (Community Blog) and requests verification on the article page
  const author = await pageAs(browser, baseURLString, 'personnel')
  const { slug } = await createArticleViaApi(author.context.request, baseURLString, { title, communitySlug: 'hr-management' })
  await author.page.goto(`/articles/${slug}`)
  await expect(author.page.getByText('Community Blog').first()).toBeVisible()
  const box = author.page.locator('#verification')
  await box.getByLabel('ชุมชน (CoP) ผู้รับรอง').selectOption({ label: 'CoP การบริหารทรัพยากรบุคคล' })
  await box.getByRole('button', { name: 'ขอรับรอง PSU Verified' }).click()
  await expect(box.getByRole('status')).toContainText('ส่งคำขอรับรองแล้ว')
  await expect(box).toContainText('คำขอปัจจุบัน: PENDING')
  // Still published while under review
  await expect(author.page.getByRole('heading', { level: 1 })).toHaveText(title)

  // 2) Secretary assigns reviewer + approver
  const secretary = await pageAs(browser, baseURLString, 'secretary')
  await secretary.page.goto('/dashboard/verification')
  const assignItem = secretary.page.locator('li', { hasText: title }).filter({ has: secretary.page.getByRole('button', { name: 'มอบหมาย' }) })
  await assignItem.getByLabel('ผู้ตรวจทาน').selectOption({ label: 'อรุณี ผู้ตรวจทดสอบ' })
  await assignItem.getByLabel('ผู้อนุมัติ').selectOption({ label: 'ประเสริฐ ผู้อนุมัติทดสอบ' })
  await assignItem.getByRole('button', { name: 'มอบหมาย' }).click()
  await expect(assignItem.getByRole('status')).toHaveText('มอบหมายแล้ว')

  // Personnel (not approver) gets nothing to decide
  await author.page.goto('/dashboard/verification')
  await expect(author.page.locator('li', { hasText: title })).toHaveCount(0)

  // 3) Reviewer recommends approval
  const reviewer = await pageAs(browser, baseURLString, 'reviewer')
  await reviewer.page.goto('/dashboard/verification')
  const reviewItem = reviewer.page.locator('li', { hasText: title }).filter({ has: reviewer.page.getByRole('button', { name: 'เสนออนุมัติ' }) })
  await reviewItem.getByLabel('ความเห็นผู้ตรวจทาน').fill('เนื้อหาครบถ้วน (E2E)')
  await reviewItem.getByRole('button', { name: 'เสนออนุมัติ' }).click()
  await expect(reviewItem.getByRole('status')).toHaveText('บันทึกผลการตรวจทานแล้ว')

  // 4) Approver sees the recommendation and approves
  const approver = await pageAs(browser, baseURLString, 'approver')
  await approver.page.goto('/dashboard/verification')
  const decideItem = approver.page.locator('li', { hasText: title }).filter({ has: approver.page.getByRole('button', { name: 'อนุมัติ (PSU Verified)' }) })
  await expect(decideItem).toContainText('เสนออนุมัติ')
  await expect(decideItem).toContainText('เนื้อหาครบถ้วน (E2E)')
  await decideItem.getByRole('button', { name: 'อนุมัติ (PSU Verified)' }).click()
  await expect(decideItem.getByRole('status')).toHaveText('บันทึกการตัดสินแล้ว')

  // 5) Anyone now sees the PSU Verified badge and the history
  await author.page.goto(`/articles/${slug}`)
  await expect(author.page.getByText('PSU Verified Knowledge').first()).toBeVisible()
  await author.page.getByText(/ประวัติการรับรอง/).click()
  await expect(author.page.locator('#verification ol li')).toHaveCount(4)

  // The author was notified
  await author.page.goto('/dashboard')
  await expect(author.page.getByText('บทความของคุณได้รับการรับรอง PSU Verified').first()).toBeVisible()

  for (const p of [author, secretary, reviewer, approver]) await p.context.close()
})

test('reviewer can request a revision and the author sees it', async ({ browser, baseURLString }) => {
  const title = uniq('ขอแก้ไขผ่าน UI')
  const author = await pageAs(browser, baseURLString, 'personnel')
  const { slug } = await createArticleViaApi(author.context.request, baseURLString, { title, communitySlug: 'hr-management' })
  await author.page.goto(`/articles/${slug}`)
  await author.page.locator('#verification').getByRole('button', { name: 'ขอรับรอง PSU Verified' }).click()
  await expect(author.page.locator('#verification').getByRole('status')).toBeVisible()

  const secretary = await pageAs(browser, baseURLString, 'secretary')
  await secretary.page.goto('/dashboard/verification')
  const item = secretary.page.locator('li', { hasText: title }).filter({ has: secretary.page.getByRole('button', { name: 'มอบหมาย' }) })
  await item.getByRole('button', { name: 'มอบหมาย' }).click()
  await expect(item.getByRole('status')).toHaveText('มอบหมายแล้ว')

  const reviewer = await pageAs(browser, baseURLString, 'reviewer')
  await reviewer.page.goto('/dashboard/verification')
  const rItem = reviewer.page.locator('li', { hasText: title }).filter({ has: reviewer.page.getByRole('button', { name: 'ขอให้แก้ไข' }) })
  // Reason is mandatory
  await rItem.getByRole('button', { name: 'ขอให้แก้ไข' }).click()
  await expect(rItem.getByRole('alert')).toContainText('กรุณาระบุเหตุผล')
  await rItem.getByLabel('ความเห็นผู้ตรวจทาน').fill('กรุณาเพิ่มแหล่งอ้างอิง (E2E)')
  await rItem.getByRole('button', { name: 'ขอให้แก้ไข' }).click()
  await expect(rItem.getByRole('status')).toHaveText('บันทึกผลการตรวจทานแล้ว')

  await author.page.goto(`/articles/${slug}`)
  await expect(author.page.locator('#verification')).toContainText('ต้องแก้ไขก่อนรับรอง')
  await expect(author.page.locator('#verification').getByRole('button', { name: 'ส่งตรวจอีกครั้ง' })).toBeVisible()

  for (const p of [author, secretary, reviewer]) await p.context.close()
})
