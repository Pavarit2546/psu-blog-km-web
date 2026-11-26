import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  async rewrites() {
    const origin = new URL(process.env.API_ORIGIN || 'http://127.0.0.1:3101').origin
    return ['/api/:path*', '/admin/:path*', '/km-admin-static/:path*'].map((source) => ({
      source,
      destination: origin + source,
    }))
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Uploaded files: never let the browser sniff them into an executable type.
      {
        source: '/api/media/file/:path*',
        headers: [{ key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox" }],
      },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default nextConfig
