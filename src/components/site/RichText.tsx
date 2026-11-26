import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import React from 'react'

import { isAllowedEmbedHost } from '@/blocks/Embed'

/** Allow only http(s), mailto and same-site relative links (blocks javascript:/data: URLs → XSS). */
export function safeHref(raw: unknown): string {
  if (typeof raw !== 'string') return '#'
  const value = raw.trim()
  if (value.startsWith('/') && !value.startsWith('//')) return value
  if (value.startsWith('#')) return value
  try {
    const url = new URL(value)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.toString() : '#'
  } catch {
    return '#'
  }
}

/** Convert a share URL to an embeddable player URL for known providers. */
export function toEmbedSrc(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !isAllowedEmbedHost(url.hostname)) return null
  const host = url.hostname.replace(/^www\./, '')
  if (host === 'youtube.com' && url.searchParams.get('v')) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.searchParams.get('v')!)}`
  }
  if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}`
  if (host === 'vimeo.com' && /^\/\d+/.test(url.pathname)) {
    return `https://player.vimeo.com/video/${url.pathname.split('/')[1]}`
  }
  return url.toString()
}

type LinkNode = {
  fields: { url?: string; newTab?: boolean; linkType?: string; doc?: { relationTo?: string; value?: unknown } }
  children: unknown[]
}

const converters: JSXConvertersFunction = ({ defaultConverters }) => {
  const renderLink = ({ node, nodesToJSX }: { node: LinkNode; nodesToJSX: (a: { nodes: unknown[] }) => React.ReactNode[] }) => {
    let href = safeHref(node.fields.url)
    if (node.fields.linkType === 'internal') {
      const value = node.fields.doc?.value as { slug?: string } | undefined
      href = node.fields.doc?.relationTo === 'articles' && value?.slug ? `/articles/${value.slug}` : '#'
    }
    const external = /^https?:/.test(href)
    return (
      <a
        href={href}
        target={node.fields.newTab ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer nofollow' : undefined}
      >
        {nodesToJSX({ nodes: node.children })}
      </a>
    )
  }
  return {
    ...defaultConverters,
    link: renderLink as never,
    autolink: renderLink as never,
    blocks: {
      embed: ({ node }: { node: { fields: { url?: string; caption?: string } } }) => {
        const src = node.fields.url ? toEmbedSrc(node.fields.url) : null
        if (!src) return null
        return (
          <figure className="not-prose my-8">
            <div className="aspect-video overflow-hidden rounded-xl bg-zinc-100">
              <iframe
                src={src}
                title={node.fields.caption || 'เนื้อหาที่ฝังจากภายนอก'}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                allow="encrypted-media; picture-in-picture; fullscreen"
              />
            </div>
            {node.fields.caption && <figcaption className="mt-2 text-center text-sm text-zinc-500">{node.fields.caption}</figcaption>}
          </figure>
        )
      },
    },
  }
}

export function RichText({ data }: { data: unknown }) {
  if (!data || typeof data !== 'object') return null
  return <LexicalRichText data={data as never} converters={converters} className="article-body" />
}
