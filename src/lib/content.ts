type LexicalNode = {
  type?: string
  text?: string
  children?: LexicalNode[]
  fields?: Record<string, unknown>
}

const BLOCK_TYPES = new Set(['paragraph', 'heading', 'quote', 'listitem', 'list', 'tablecell', 'block'])

/** Extract plain text from a Lexical serialized editor state. */
export function lexicalToPlainText(state: unknown): string {
  const root = (state as { root?: LexicalNode } | null)?.root
  if (!root) return ''
  const parts: string[] = []
  const walk = (node: LexicalNode) => {
    if (typeof node.text === 'string') parts.push(node.text)
    if (node.type === 'block' && node.fields) {
      const { url, caption } = node.fields as { url?: string; caption?: string }
      if (url) parts.push(` ${url} `)
      if (caption) parts.push(` ${caption} `)
    }
    if (node.type === 'linebreak') parts.push('\n')
    node.children?.forEach(walk)
    if (node.type && BLOCK_TYPES.has(node.type)) parts.push('\n')
  }
  walk(root)
  return parts.join('').replace(/\n{3,}/g, '\n\n').trim()
}

export function readingMinutes(text: string): number {
  // Thai has no word spaces; approximate by characters (≈ 900 chars/min) and words for Latin text.
  const words = text.split(/\s+/).filter(Boolean).length
  const chars = text.replace(/\s+/g, '').length
  return Math.max(1, Math.round(Math.max(words / 220, chars / 900)))
}
