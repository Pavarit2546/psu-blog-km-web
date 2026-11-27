<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## โครงสร้างโปรเจกต์ PSU Blog KM

- เว็บไซต์อยู่ใน repo `D:\psu-blog-km-web` และ backend อยู่ใน repo ข้างกันที่ `D:\psu-blog-km-api` ทั้งสองโปรเจกต์ build และ deploy แยกกัน
- ฝั่งเว็บวางหน้าอ่านบทความ ค้นหา ชุมชน ผู้เขียน และแดชบอร์ดไว้ใน `src/app/(frontend)` ส่วน UI อยู่ใน `src/components` หน้าฝั่งเซิร์ฟเวอร์อ่านข้อมูลผ่าน `src/lib/server/data.ts` และ `src/services` ชุดทดสอบเว็บอยู่ใน `tests/e2e` (Playwright)
- ฝั่ง API ใช้ Payload CMS โดยมี `src/payload.config.ts` เป็นจุดตั้งค่า โมเดลและสิทธิ์อยู่ใน `src/collections` และ `src/access` ส่วน endpoint เฉพาะระบบอยู่ใน `src/endpoints` และกระบวนการรับรองบทความอยู่ใน `src/lib/verification` ฐานข้อมูลใช้ PostgreSQL และ Compose ใช้ MinIO เก็บไฟล์
- เว็บเปิดที่พอร์ต `3100` และเรียก API ผ่าน `API_ORIGIN` (บน host ใช้ `http://127.0.0.1:3101` และใน Docker ใช้ `http://api:3000`) เว็บส่งต่อ `/api/*`, `/admin/*` และ `/km-admin-static/*` ไปยัง backend ผู้ใช้ที่เข้าสู่ระบบแล้วเปิด `/write` เพื่อไปยัง Lexical editor ของ Payload Admin
- เมื่อเปลี่ยนโครงสร้างข้อมูล ให้ตรวจ migration และ generated types ฝั่ง API พร้อมตรวจ `src/payload-types.ts` และโค้ดใน `src/services` ฝั่งเว็บให้ตรงกัน
