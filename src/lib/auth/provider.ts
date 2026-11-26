export type AuthProviderKind = 'mock' | 'oidc'

export type AuthProviderInfo = {
  kind: AuthProviderKind
  label: string
  loginPath: string
  isDevelopmentOnly: boolean
}

export function getAuthProvider(): AuthProviderInfo {
  const kind = (process.env.AUTH_PROVIDER || 'mock') as AuthProviderKind
  if (kind === 'oidc') {
    throw new Error('AUTH_PROVIDER=oidc is not implemented yet (PSU SSO integration pending)')
  }
  return {
    kind: 'mock',
    label: 'Mock PSU Authentication (development only)',
    loginPath: '/login',
    isDevelopmentOnly: true,
  }
}
