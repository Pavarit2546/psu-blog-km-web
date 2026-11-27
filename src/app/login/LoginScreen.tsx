'use client'

import { ArrowLeft, ArrowRight, BookOpen, Globe2, Moon, Sun } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { LoginForm } from '@/components/site/client'
import { SkipToContent } from '@/components/site/SkipToContent'
import { messages } from './messages'
import { AuroraBackground } from './AuroraBackground'
import styles from './login.module.css'

type Language = keyof typeof messages
type Theme = 'light' | 'dark'
const Copy = createContext(messages.th)

function remember(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/login; Max-Age=31536000; SameSite=Lax`
}

export function LoginScreen({ initialLanguage, initialTheme, children }: {
  initialLanguage: Language
  initialTheme: Theme
  children: ReactNode
}) {
  const [language, setLanguage] = useState(initialLanguage)
  const [theme, setTheme] = useState(initialTheme)
  const text = messages[language]
  const nextLanguage = language === 'th' ? 'en' : 'th'
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const themeLabel = text[nextTheme]
  const pathname = usePathname()
  const title = pathname === '/login/passport' ? text.unavailable : text.signIn

  useEffect(() => {
    document.documentElement.lang = language
    document.title = `${title} — PSU Knowledge`
    return () => { document.documentElement.lang = 'th' }
  }, [language, title])

  return (
    <Copy.Provider value={text}>
      <div lang={language} data-theme={theme} className={styles.page}>
        <SkipToContent>{text.skip}</SkipToContent>
        <div aria-hidden="true" className={styles.art}>
          <AuroraBackground dark={theme === 'dark'} />
        </div>
        <header className={styles.masthead}>
          <div className={styles.brand}>
            <BookOpen size={22} aria-hidden />
            <div>
              <span lang="en" className={styles.wordmark}>PSU Knowledge</span>
              <span className={styles.university}>{text.university}</span>
            </div>
          </div>
          <div className={styles.controls}>
            <button
              type="button"
              lang={nextLanguage}
              aria-label={nextLanguage === 'en' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย'}
              onClick={() => {
                remember('km-language', nextLanguage)
                setLanguage(nextLanguage)
              }}
            >
              <Globe2 size={17} aria-hidden />{nextLanguage === 'en' ? 'EN' : 'ไทย'}
            </button>
            <button
              type="button"
              title={themeLabel}
              aria-label={themeLabel}
              onClick={() => {
                remember('km-theme', nextTheme)
                setTheme(nextTheme)
              }}
            >
              {nextTheme === 'light' ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}
            </button>
          </div>
        </header>
        <main id="main" aria-labelledby="login-heading" className={styles.card}>{children}</main>
      </div>
    </Copy.Provider>
  )
}

function loginHref(path: string, next: string) {
  return next === '/' ? path : { pathname: path, query: { next } }
}

export function SignInCard({ next, demo }: { next: string; demo: boolean }) {
  const text = useContext(Copy)
  return (
    <>
      <h1 id="login-heading">{text.signIn}</h1>
      <p className={styles.subtitle}>{text.subtitle}</p>
      <Link href={loginHref('/login/passport', next)} className={styles.passport}>
        <span className={styles.logo}><Image src="/psu-logo.png" alt="" width={32} height={32} unoptimized /></span>
        <span className={styles.passportLabel}>
          <span lang="en">PSU Passport</span>
          <strong>{text.passport}</strong>
        </span>
        <span className={styles.arrow}><ArrowRight size={16} aria-hidden /></span>
      </Link>
      <hr className={styles.divider} />
      <LoginForm next={next} emailLabel={demo ? text.demoEmail : text.email} text={text} />
    </>
  )
}

export function PassportCard({ next }: { next: string }) {
  const text = useContext(Copy)
  return (
    <>
      <Image className={styles.statusLogo} src="/psu-logo.png" alt="" width={48} height={48} unoptimized />
      <h1 id="login-heading">{text.unavailable}</h1>
      <Link className={styles.back} href={loginHref('/login', next)}><ArrowLeft size={17} aria-hidden />{text.back}</Link>
    </>
  )
}
