/** Hosts allowed for embedded external content. Anything else is rendered as a plain link. */
export const EMBED_ALLOWED_HOSTS = [
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'vimeo.com',
  'docs.google.com',
  'drive.google.com',
]

export const isAllowedEmbedHost = (host: string) =>
  EMBED_ALLOWED_HOSTS.includes(host) || host === 'psu.ac.th' || host.endsWith('.psu.ac.th')
