import { describe, expect, it } from 'vitest'
import { sanitizeFilename } from './filename.ts'

describe('sanitizeFilename', () => {
  it('builds a descriptive, safe name from a URL', () => {
    expect(sanitizeFilename('https://Example.com/My Path?q=1', 'png')).toBe(
      'qr-example-com-my-path-q-1.png',
    )
  })

  it('strips path characters and limits length', () => {
    const name = sanitizeFilename(`../etc/passwd/${'a'.repeat(80)}`, 'svg')
    expect(name.startsWith('qr-')).toBe(true)
    expect(name.endsWith('.svg')).toBe(true)
    expect(name).not.toContain('/')
    expect(name).not.toContain('..')
    expect(name.length).toBeLessThanOrEqual(55)
  })

  it('falls back when the source has no safe characters', () => {
    expect(sanitizeFilename('***', 'png')).toBe('qr-code.png')
  })
})
