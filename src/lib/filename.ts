const MAX_LENGTH = 48

export function sanitizeFilename(source: string, extension: 'png' | 'svg'): string {
  const withoutProtocol = source.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  const slug = withoutProtocol
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, '')

  return `qr-${slug || 'code'}.${extension}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
