import type { ErrorCorrectionLevel, OutputSize, QuietZone } from './qr.ts'
import type { ContentKind } from './validation.ts'

export const SETTINGS_KEY = 'qr-codes.settings.v1'

export type ThemePreference = 'system' | 'light' | 'dark'

export type StoredSettings = {
  kind: ContentKind
  errorCorrectionLevel: ErrorCorrectionLevel
  width: OutputSize
  margin: QuietZone
  foreground: string
  background: string
  theme: ThemePreference
}

export const DEFAULT_SETTINGS: StoredSettings = {
  kind: 'url',
  errorCorrectionLevel: 'M',
  width: 256,
  margin: 4,
  foreground: '#000000',
  background: '#ffffff',
  theme: 'system',
}

export function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) {
      return DEFAULT_SETTINGS
    }
    const parsed = JSON.parse(raw) as Partial<StoredSettings>
    return {
      kind: parsed.kind === 'text' ? 'text' : 'url',
      errorCorrectionLevel: isErrorCorrection(parsed.errorCorrectionLevel)
        ? parsed.errorCorrectionLevel
        : DEFAULT_SETTINGS.errorCorrectionLevel,
      width: isOutputSize(parsed.width) ? parsed.width : DEFAULT_SETTINGS.width,
      margin: isQuietZone(parsed.margin) ? parsed.margin : DEFAULT_SETTINGS.margin,
      foreground: isHex(parsed.foreground)
        ? parsed.foreground
        : DEFAULT_SETTINGS.foreground,
      background: isHex(parsed.background)
        ? parsed.background
        : DEFAULT_SETTINGS.background,
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_SETTINGS.theme,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: StoredSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function resolveTheme(
  theme: ThemePreference,
  media = window.matchMedia('(prefers-color-scheme: dark)'),
): 'light' | 'dark' {
  if (theme === 'system') {
    return media.matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: ThemePreference): void {
  document.documentElement.dataset.theme = resolveTheme(theme)
}

function isErrorCorrection(
  value: unknown,
): value is ErrorCorrectionLevel {
  return value === 'L' || value === 'M' || value === 'Q' || value === 'H'
}

function isOutputSize(value: unknown): value is OutputSize {
  return value === 256 || value === 512 || value === 1024
}

function isQuietZone(value: unknown): value is QuietZone {
  return value === 4 || value === 8 || value === 16
}

function isTheme(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isHex(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}
