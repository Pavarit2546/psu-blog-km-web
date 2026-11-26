# PSU Blog KM Web

หน้าเว็บ KM ของมหาวิทยาลัยสงขลานครินทร์ สร้างด้วย Next.js App Router และ React ให้บริการหน้าอ่าน ค้นหา ชุมชน โปรไฟล์ และแดชบอร์ดงานรับรอง เว็บเรียกข้อมูลผ่าน HTTP ไปยัง repo `psu-blog-km-api` ซึ่งดูแลข้อมูล การตรวจสิทธิ์ และ Payload Admin

## เริ่มใช้งานด้วย Docker

เริ่ม API และ seed ข้อมูลตัวอย่างตาม README ของ `psu-blog-km-api` ก่อน เพื่อสร้างเครือข่าย `psu-blog-km-gateway` จากนั้นรันใน repo นี้

```sh
docker compose up -d --build
```

เปิด http://localhost:3100 จากเบราว์เซอร์ การเขียนบทความที่ `/write` พาไปยัง Payload editor บน origin เดียวกัน ดู API health ผ่าน http://localhost:3100/api/health

## พัฒนาบน host

ใช้ Node 24.22.3 และ pnpm 10.34.9 คัดลอก `.env.example` เป็น `.env` สำหรับเครื่องใหม่ ตั้ง `API_ORIGIN` เป็น origin ที่เซิร์ฟเวอร์เว็บติดต่อ API ได้ ค่าเริ่มต้นคือ `http://127.0.0.1:3101` หากรัน web ใน Docker อยู่ ให้หยุด container web ก่อนเปิด dev บนพอร์ตเดียวกัน

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

## โครงสร้างและการส่งคำขอ

- `src/app/(frontend)` ประกอบด้วยหน้าเว็บและ Server Components
- `src/components/site` และ `src/components/ui` ประกอบด้วยส่วนแสดงผลและฟอร์ม
- `src/services` เป็น HTTP client และสัญญาของข้อมูลที่ใช้แสดงผล
- `next.config.ts` ส่งคำขอจากเบราว์เซอร์ที่ `/api`, `/admin`, `/km-admin-static` ไปยัง API รวมถึงไฟล์ของ editor จึงใช้ session เดียวกันระหว่างหน้าเว็บและหลังบ้าน

เมื่อ deploy ให้กำหนด `API_ORIGIN` ทั้งตอน build และ runtime ค่าใน Compose คือ `http://api:3000` ส่วนค่า public origin ฝั่ง API ต้องตรงกับ URL ที่ผู้ใช้เปิด

## การทดสอบ

```sh
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm exec playwright install chromium
corepack pnpm test:e2e
```

ชุด Playwright ใช้บริการทั้งสองและบัญชี synthetic ของ seed ตั้ง `SEED_DEMO_PASSWORD` ในไฟล์ .env ของเว็บให้ตรงกับ API เฉพาะตอนรันทดสอบ ตั้ง `PSU_KP_BASE_URL` หาก gateway อยู่ที่ URL อื่น ชุดนี้สร้างบทความ ความคิดเห็น และคำขอรับรอง จึงควรเลือก stack สำหรับการทดสอบ
