/** @vitest-environment node */

import { PNG } from 'pngjs'
import jsQR from 'jsqr'
import { describe, expect, it } from 'vitest'
import { wifiPayload } from './payloads.ts'
import {
  DEFAULT_QR_CONFIG,
  MIN_QUIET_ZONE,
  renderPngBytes,
  renderSvg,
  resolveQrConfig,
} from './qr.ts'

function decodePng(bytes: Uint8Array): string | null {
  const png = PNG.sync.read(Buffer.from(bytes))
  const decoded = jsQR(
    new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength),
    png.width,
    png.height,
  )
  return decoded?.data ?? null
}

describe('QR defaults and configuration', () => {
  it('defaults to error-correction level M, a four-module quiet zone, and 256px', () => {
    expect(DEFAULT_QR_CONFIG).toMatchObject({
      errorCorrectionLevel: 'M',
      margin: MIN_QUIET_ZONE,
      width: 256,
      color: { dark: '#000000', light: '#ffffff' },
    })
  })

  it('never reduces the quiet zone below four modules', () => {
    expect(resolveQrConfig({ margin: 0 }).margin).toBe(4)
    expect(resolveQrConfig({ margin: 8 }).margin).toBe(8)
  })
})

describe('SVG and PNG export', () => {
  it('renders SVG at the requested size without rasterizing', async () => {
    const svg = await renderSvg('https://example.com', {
      ...DEFAULT_QR_CONFIG,
      width: 512,
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('viewBox')
    expect(svg).toMatch(/width="512"/)
    expect(svg).toMatch(/height="512"/)
    expect(svg).not.toContain('<image')
  })

  it('renders PNG at the requested pixel dimensions', async () => {
    const bytes = await renderPngBytes('hello', {
      ...DEFAULT_QR_CONFIG,
      width: 256,
    })
    const png = PNG.sync.read(Buffer.from(bytes))
    expect(png.width).toBe(256)
    expect(png.height).toBe(256)
  })
})

describe('round-trip decoding', () => {
  it.each([
    ['https://example.com/path?q=1', DEFAULT_QR_CONFIG],
    ['plain text', DEFAULT_QR_CONFIG],
    ['こんにちは 🎉', { ...DEFAULT_QR_CONFIG, errorCorrectionLevel: 'H' as const }],
    [
      wifiPayload({ ssid: 'Cafe;WiFi', password: 'p@ss;word:1' }),
      { ...DEFAULT_QR_CONFIG, errorCorrectionLevel: 'Q' as const },
    ],
  ])('decodes generated PNG for %s', async (payload, config) => {
    const bytes = await renderPngBytes(payload, config)
    expect(decodePng(bytes)).toBe(payload)
  })

  it('still decodes after raising error correction', async () => {
    const payload = 'error-correction-change'
    const low = await renderPngBytes(payload, {
      ...DEFAULT_QR_CONFIG,
      errorCorrectionLevel: 'L',
    })
    const high = await renderPngBytes(payload, {
      ...DEFAULT_QR_CONFIG,
      errorCorrectionLevel: 'H',
    })
    expect(decodePng(low)).toBe(payload)
    expect(decodePng(high)).toBe(payload)
    expect(low.byteLength).not.toBe(high.byteLength)
  })
})
