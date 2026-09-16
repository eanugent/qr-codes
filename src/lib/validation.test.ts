import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  MIN_ALLOWED_CONTRAST,
  MIN_RECOMMENDED_CONTRAST,
  textContentError,
  urlContentError,
  validateAppearance,
  validateInput,
} from './validation.ts'

describe('urlContentError', () => {
  it('rejects empty input', () => {
    expect(urlContentError('')).toBe('Enter a URL.')
    expect(urlContentError('   ')).toBe('Enter a URL.')
  })

  it('rejects malformed URLs', () => {
    expect(urlContentError('http://')).toBe('Enter a valid URL.')
    expect(urlContentError('https://exa mple.com')).toBe('Enter a valid URL.')
  })

  it('rejects dangerous or unsupported schemes', () => {
    expect(urlContentError('javascript:alert(1)')).toBe('Use an http or https URL.')
    expect(urlContentError('data:text/plain,hi')).toBe('Use an http or https URL.')
    expect(urlContentError('mailto:hi@example.com')).toBe(
      'Use an http or https URL.',
    )
  })

  it('accepts http, https, localhost, and protocol-less hosts', () => {
    expect(urlContentError('https://example.com/path?q=1')).toBeNull()
    expect(urlContentError('http://127.0.0.1:8080')).toBeNull()
    expect(urlContentError('localhost:3000')).toBeNull()
    expect(urlContentError('example.com')).toBeNull()
  })
})

describe('textContentError', () => {
  it('rejects empty text and accepts unicode', () => {
    expect(textContentError('')).toBe('Enter the text to encode.')
    expect(textContentError('  こんにちは  ')).toBeNull()
  })
})

describe('contrast and appearance', () => {
  it('computes the WCAG contrast ratio for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })

  it('warns when contrast is below 4.5:1', () => {
    const result = validateAppearance({
      foreground: '#777777',
      background: '#ffffff',
      margin: 4,
    })
    const contrast = contrastRatio('#777777', '#ffffff')
    expect(contrast).toBeGreaterThan(MIN_ALLOWED_CONTRAST)
    expect(contrast).toBeLessThan(MIN_RECOMMENDED_CONTRAST)
    expect(result.errors).toHaveLength(0)
    expect(result.warnings.some((warning) => warning.message.includes('Contrast'))).toBe(
      true,
    )
  })

  it('blocks near-identical colors', () => {
    const result = validateAppearance({
      foreground: '#fafafa',
      background: '#ffffff',
      margin: 4,
    })
    expect(result.errors.some((error) => error.field === 'color')).toBe(true)
  })

  it('warns when modules are lighter than the background', () => {
    const result = validateAppearance({
      foreground: '#ffffff',
      background: '#000000',
      margin: 4,
    })
    expect(result.errors).toHaveLength(0)
    expect(
      result.warnings.some((warning) => warning.message.includes('Light modules')),
    ).toBe(true)
  })

  it('rejects a quiet zone below four modules', () => {
    const result = validateAppearance({
      foreground: '#000000',
      background: '#ffffff',
      margin: 2,
    })
    expect(result.errors.some((error) => error.field === 'margin')).toBe(true)
  })

  it('rejects invalid hex colors', () => {
    const result = validateAppearance({
      foreground: 'black',
      background: '#fff',
      margin: 4,
    })
    expect(result.errors.map((error) => error.field).sort()).toEqual([
      'background',
      'foreground',
    ])
  })
})

describe('validateInput', () => {
  it('disables export for empty payloads', () => {
    const result = validateInput({
      kind: 'url',
      content: '',
      appearance: { foreground: '#000000', background: '#ffffff', margin: 4 },
    })
    expect(result.canExport).toBe(false)
    expect(result.payload).toBeNull()
  })

  it('normalizes URLs and allows export', () => {
    const result = validateInput({
      kind: 'url',
      content: 'example.com',
      appearance: { foreground: '#000000', background: '#ffffff', margin: 4 },
    })
    expect(result.canExport).toBe(true)
    expect(result.payload).toBe('https://example.com')
  })

  it('warns on long payloads', () => {
    const result = validateInput({
      kind: 'text',
      content: 'a'.repeat(1201),
      appearance: { foreground: '#000000', background: '#ffffff', margin: 4 },
    })
    expect(result.canExport).toBe(true)
    expect(result.warnings.some((warning) => warning.field === 'content')).toBe(
      true,
    )
  })
})
