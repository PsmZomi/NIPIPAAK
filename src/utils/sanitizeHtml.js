import DOMPurify from 'dompurify'

let linkHookInstalled = false
if (typeof window !== 'undefined' && !linkHookInstalled) {
  linkHookInstalled = true
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer')
    }
  })
}

/** Rich article HTML from Quill — strip scripts/handlers; keep typical formatting. */
export function sanitizeArticleHtml(dirty) {
  return DOMPurify.sanitize(dirty || '', {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  })
}

export function stripHtmlToPlain(html) {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function isQuillContentEmpty(html) {
  const plain = stripHtmlToPlain(html).replace(/&nbsp;/g, ' ').trim()
  return plain.length === 0
}

/** Legacy `body` string[] for search / previews — derived from sanitized HTML. */
export function htmlToBodyParagraphs(html) {
  if (typeof document === 'undefined') return []
  const div = document.createElement('div')
  div.innerHTML = html
  return Array.from(div.querySelectorAll('p'))
    .map((p) => p.textContent.trim())
    .filter(Boolean)
}
