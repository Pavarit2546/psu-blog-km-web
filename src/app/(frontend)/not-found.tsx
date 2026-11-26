import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">ไม่พบหน้าที่ต้องการ</h1>
      <p className="mt-3 text-zinc-600">หน้านี้อาจไม่มีอยู่ หรือคุณไม่มีสิทธิ์เข้าถึง (บางบทความเปิดให้เฉพาะบุคลากร มอ.)</p>
      <Link href="/" className="mt-6 inline-block text-brand-600 underline">
        กลับหน้าแรก
      </Link>
    </div>
  )
}
