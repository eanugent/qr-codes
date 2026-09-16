import { describe, expect, it } from 'vitest'
import {
  contactPayload,
  emailPayload,
  eventPayload,
  geoPayload,
  phonePayload,
  smsPayload,
  textPayload,
  urlPayload,
  wifiPayload,
} from './payloads.ts'

describe('urlPayload', () => {
  it('adds https when the protocol is omitted', () => {
    expect(urlPayload('example.com/path')).toBe('https://example.com/path')
  })

  it('preserves an explicit protocol', () => {
    expect(urlPayload('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('treats host:port as a host, not a protocol', () => {
    expect(urlPayload('localhost:3000')).toBe('https://localhost:3000')
  })

  it('trims surrounding whitespace', () => {
    expect(urlPayload('  https://example.com  ')).toBe('https://example.com')
  })

  it('returns an empty string for blank input', () => {
    expect(urlPayload('   ')).toBe('')
  })
})

describe('textPayload', () => {
  it('preserves unicode and punctuation', () => {
    expect(textPayload('こんにちは — café')).toBe('こんにちは — café')
  })
})

describe('wifiPayload', () => {
  it('escapes special characters in SSID and password', () => {
    expect(
      wifiPayload({
        ssid: 'Cafe;WiFi, "Shop"',
        password: 'p@ss;word:1\\x',
      }),
    ).toBe('WIFI:T:WPA;S:Cafe\\;WiFi\\, \\"Shop\\";P:p@ss\\;word\\:1\\\\x;H:false;;')
  })

  it('omits a password for open networks', () => {
    expect(wifiPayload({ ssid: 'Guest', security: 'nopass' })).toBe(
      'WIFI:T:nopass;S:Guest;H:false;;',
    )
  })

  it('marks hidden networks', () => {
    expect(
      wifiPayload({ ssid: 'Hidden', password: 'secret', hidden: true }),
    ).toBe('WIFI:T:WPA;S:Hidden;P:secret;H:true;;')
  })
})

describe('email, phone, and sms payloads', () => {
  it('builds a mailto URL with encoded subject and body', () => {
    expect(
      emailPayload({
        to: 'hi@example.com',
        subject: 'Hello & welcome',
        body: 'Line one',
      }),
    ).toBe('mailto:hi@example.com?subject=Hello+%26+welcome&body=Line+one')
  })

  it('strips formatting from phone numbers', () => {
    expect(phonePayload('+1 (415) 555-0100')).toBe('tel:+14155550100')
  })

  it('encodes SMS bodies', () => {
    expect(smsPayload({ number: '415-555-0100', body: 'Hello there' })).toBe(
      'sms:4155550100?body=Hello%20there',
    )
  })
})

describe('contact, event, and geo payloads', () => {
  it('escapes vCard special characters', () => {
    expect(
      contactPayload({
        name: 'Ann; Smith, Jr.',
        org: 'Acme\\Labs',
        phone: '+1 555 0100',
        email: 'ann@example.com',
        url: 'https://example.com',
      }),
    ).toBe(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:Ann\\; Smith\\, Jr.',
        'ORG:Acme\\\\Labs',
        'TEL:+1 555 0100',
        'EMAIL:ann@example.com',
        'URL:https://example.com',
        'END:VCARD',
      ].join('\n'),
    )
  })

  it('builds a VEVENT payload', () => {
    expect(
      eventPayload({
        summary: 'Launch, day one',
        start: '20260916T090000',
        end: '20260916T100000',
        location: 'HQ; Building 2',
        description: 'Meet in the lobby.',
      }),
    ).toContain('SUMMARY:Launch\\, day one')
  })

  it('formats geographic coordinates', () => {
    expect(geoPayload(37.7749, -122.4194)).toBe('geo:37.7749,-122.4194')
  })
})
