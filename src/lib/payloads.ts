export type PayloadKind = 'url' | 'text'

export function textPayload(value: string): string {
  return value
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function urlPayload(value: string): string {
  return normalizeUrl(value)
}

function escapeWifi(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/([,;:"])/g, '\\$1')
}

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export function wifiPayload(options: {
  ssid: string
  password?: string
  security?: WifiSecurity
  hidden?: boolean
}): string {
  const security = options.security ?? (options.password ? 'WPA' : 'nopass')
  const hidden = options.hidden ? 'true' : 'false'
  const ssid = escapeWifi(options.ssid)
  if (security === 'nopass') {
    return `WIFI:T:nopass;S:${ssid};H:${hidden};;`
  }
  return `WIFI:T:${security};S:${ssid};P:${escapeWifi(options.password ?? '')};H:${hidden};;`
}

export function emailPayload(options: {
  to: string
  subject?: string
  body?: string
}): string {
  const params = new URLSearchParams()
  if (options.subject) {
    params.set('subject', options.subject)
  }
  if (options.body) {
    params.set('body', options.body)
  }
  const query = params.toString()
  return query ? `mailto:${options.to}?${query}` : `mailto:${options.to}`
}

export function phonePayload(number: string): string {
  return `tel:${number.replace(/[\s().-]/g, '')}`
}

export function smsPayload(options: { number: string; body?: string }): string {
  const number = options.number.replace(/[\s().-]/g, '')
  if (!options.body) {
    return `sms:${number}`
  }
  return `sms:${number}?body=${encodeURIComponent(options.body)}`
}

function escapeVCard(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function contactPayload(options: {
  name: string
  org?: string
  phone?: string
  email?: string
  url?: string
}): string {
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(options.name)}`]
  if (options.org) {
    lines.push(`ORG:${escapeVCard(options.org)}`)
  }
  if (options.phone) {
    lines.push(`TEL:${escapeVCard(options.phone)}`)
  }
  if (options.email) {
    lines.push(`EMAIL:${escapeVCard(options.email)}`)
  }
  if (options.url) {
    lines.push(`URL:${escapeVCard(options.url)}`)
  }
  lines.push('END:VCARD')
  return lines.join('\n')
}

export function eventPayload(options: {
  summary: string
  start: string
  end?: string
  location?: string
  description?: string
}): string {
  const lines = [
    'BEGIN:VEVENT',
    `SUMMARY:${escapeVCard(options.summary)}`,
    `DTSTART:${options.start}`,
  ]
  if (options.end) {
    lines.push(`DTEND:${options.end}`)
  }
  if (options.location) {
    lines.push(`LOCATION:${escapeVCard(options.location)}`)
  }
  if (options.description) {
    lines.push(`DESCRIPTION:${escapeVCard(options.description)}`)
  }
  lines.push('END:VEVENT')
  return lines.join('\n')
}

export function geoPayload(latitude: number, longitude: number): string {
  return `geo:${latitude},${longitude}`
}
