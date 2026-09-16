import { normalizeUrl, urlPayload } from './payloads.ts'

const HEX_PATTERN = /^#([0-9a-f]{6})$/i
const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'vbscript:', 'file:'])
const LONG_PAYLOAD_CHARS = 1200
export const MIN_RECOMMENDED_CONTRAST = 4.5
export const MIN_ALLOWED_CONTRAST = 2

export type FieldError = {
  field: string
  message: string
}

export type Warning = {
  field?: string
  message: string
}

export function isHexColor(value: string): boolean {
  return HEX_PATTERN.test(value.trim())
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  const match = HEX_PATTERN.exec(hex.trim())
  if (!match) {
    return null
  }
  const n = Number.parseInt(match[1] ?? '', 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function linearChannel(value: number): number {
  const srgb = value / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex)
  if (!rgb) {
    return null
  }
  return (
    0.2126 * linearChannel(rgb.r) +
    0.7152 * linearChannel(rgb.g) +
    0.0722 * linearChannel(rgb.b)
  )
}

export function contrastRatio(foreground: string, background: string): number | null {
  const a = relativeLuminance(foreground)
  const b = relativeLuminance(background)
  if (a == null || b == null) {
    return null
  }
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}

const DISALLOWED_SCHEMES =
  /^(javascript|data|vbscript|file|mailto|ftp|blob|about|tel|sms):/i

export function urlContentError(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) {
    return 'Enter a URL.'
  }

  if (DISALLOWED_SCHEMES.test(trimmed)) {
    return 'Use an http or https URL.'
  }

  let parsed: URL
  try {
    parsed = new URL(normalizeUrl(trimmed))
  } catch {
    return 'Enter a valid URL.'
  }

  if (
    BLOCKED_PROTOCOLS.has(parsed.protocol) ||
    (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
  ) {
    return 'Use an http or https URL.'
  }

  if (!parsed.hostname) {
    return 'Enter a valid URL.'
  }

  return null
}

export function textContentError(input: string): string | null {
  if (!input.trim()) {
    return 'Enter the text to encode.'
  }
  return null
}

export function colorError(value: string, label: string): string | null {
  if (!isHexColor(value)) {
    return `${label} must be a six-digit hex color such as #000000.`
  }
  return null
}

export type AppearanceInput = {
  foreground: string
  background: string
  margin: number
}

export function validateAppearance(input: AppearanceInput): {
  errors: FieldError[]
  warnings: Warning[]
} {
  const errors: FieldError[] = []
  const warnings: Warning[] = []

  const foregroundError = colorError(input.foreground, 'Foreground')
  if (foregroundError) {
    errors.push({ field: 'foreground', message: foregroundError })
  }
  const backgroundError = colorError(input.background, 'Background')
  if (backgroundError) {
    errors.push({ field: 'background', message: backgroundError })
  }

  if (input.margin < 4) {
    errors.push({
      field: 'margin',
      message: 'Keep a quiet zone of at least four modules.',
    })
  }

  if (!foregroundError && !backgroundError) {
    const contrast = contrastRatio(input.foreground, input.background)
    if (contrast != null) {
      if (contrast < MIN_ALLOWED_CONTRAST) {
        errors.push({
          field: 'color',
          message:
            'Foreground and background are too similar to scan reliably. Choose colors with stronger contrast.',
        })
      } else if (contrast < MIN_RECOMMENDED_CONTRAST) {
        warnings.push({
          field: 'color',
          message: `Contrast is ${contrast.toFixed(1)}:1. Codes scan more reliably at 4.5:1 or higher.`,
        })
      }

      const foregroundLum = relativeLuminance(input.foreground)
      const backgroundLum = relativeLuminance(input.background)
      if (
        foregroundLum != null &&
        backgroundLum != null &&
        foregroundLum > backgroundLum
      ) {
        warnings.push({
          field: 'color',
          message:
            'Light modules on a dark background can fail on some scanners. Dark on light is more reliable.',
        })
      }
    }
  }

  return { errors, warnings }
}

export type ContentKind = 'url' | 'text'

export type ValidationInput = {
  kind: ContentKind
  content: string
  appearance: AppearanceInput
}

export type ValidationResult = {
  payload: string | null
  errors: FieldError[]
  warnings: Warning[]
  canExport: boolean
}

export function validateInput(input: ValidationInput): ValidationResult {
  const errors: FieldError[] = []
  const warnings: Warning[] = []

  const contentError =
    input.kind === 'url'
      ? urlContentError(input.content)
      : textContentError(input.content)

  if (contentError) {
    errors.push({ field: 'content', message: contentError })
  } else if (input.content.length > LONG_PAYLOAD_CHARS) {
    warnings.push({
      field: 'content',
      message:
        'This payload is long, so the code will be dense and harder to scan from a distance.',
    })
  }

  const appearance = validateAppearance(input.appearance)
  errors.push(...appearance.errors)
  warnings.push(...appearance.warnings)

  const payload = contentError
    ? null
    : input.kind === 'url'
      ? urlPayload(input.content)
      : input.content

  return {
    payload,
    errors,
    warnings,
    canExport: errors.length === 0 && payload != null && payload.length > 0,
  }
}

export function fieldError(
  errors: FieldError[],
  field: string,
): string | undefined {
  return errors.find((error) => error.field === field)?.message
}
