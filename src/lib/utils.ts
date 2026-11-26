import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const thaiDate = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeZone: 'Asia/Bangkok' })
const thaiDateTime = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' })

export const formatDate = (value?: string | null) => (value ? thaiDate.format(new Date(value)) : '')
export const formatDateTime = (value?: string | null) => (value ? thaiDateTime.format(new Date(value)) : '')

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNextPath(value: unknown, fallback = '/'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return fallback
  // Browsers remove tabs and newlines and treat backslashes as URL separators.
  if (/[\\\t\r\n]/.test(value)) return fallback
  return value
}
