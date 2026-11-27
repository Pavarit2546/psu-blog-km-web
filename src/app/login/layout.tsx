import { cookies } from 'next/headers'
import { LoginScreen } from './LoginScreen'

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  const prefs = await cookies()
  return (
    <LoginScreen
      initialLanguage={prefs.get('km-language')?.value === 'en' ? 'en' : 'th'}
      initialTheme={prefs.get('km-theme')?.value === 'light' ? 'light' : 'dark'}
    >
      {children}
    </LoginScreen>
  )
}
