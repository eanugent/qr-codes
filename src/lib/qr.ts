import QRCode from 'qrcode'

export const ERROR_CORRECTION_LEVELS = ['L', 'M', 'Q', 'H'] as const
export type ErrorCorrectionLevel = (typeof ERROR_CORRECTION_LEVELS)[number]

export const OUTPUT_SIZES = [256, 512, 1024] as const
export type OutputSize = (typeof OUTPUT_SIZES)[number]

export const QUIET_ZONE_OPTIONS = [4, 8, 16] as const
export type QuietZone = (typeof QUIET_ZONE_OPTIONS)[number]

export const MIN_QUIET_ZONE = 4

export type QrConfig = {
  errorCorrectionLevel: ErrorCorrectionLevel
  margin: number
  width: number
  color: {
    dark: string
    light: string
  }
}

export const DEFAULT_QR_CONFIG: QrConfig = {
  errorCorrectionLevel: 'M',
  margin: MIN_QUIET_ZONE,
  width: 256,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
}

export const ERROR_CORRECTION_HELP: Record<ErrorCorrectionLevel, string> = {
  L: 'Recovers about 7% of damaged modules. Produces the smallest code; use only for short, undamaged codes.',
  M: 'Recovers about 15% of damaged modules. A reliable default for screens and print.',
  Q: 'Recovers about 25% of damaged modules. Larger, and more durable if a print may scuff.',
  H: 'Recovers about 30% of damaged modules. Largest; use when the code may be damaged or partly covered.',
}

export function resolveQrConfig(config: Partial<QrConfig> = {}): QrConfig {
  return {
    errorCorrectionLevel:
      config.errorCorrectionLevel ?? DEFAULT_QR_CONFIG.errorCorrectionLevel,
    margin: Math.max(config.margin ?? DEFAULT_QR_CONFIG.margin, MIN_QUIET_ZONE),
    width: config.width ?? DEFAULT_QR_CONFIG.width,
    color: {
      dark: config.color?.dark ?? DEFAULT_QR_CONFIG.color.dark,
      light: config.color?.light ?? DEFAULT_QR_CONFIG.color.light,
    },
  }
}

function qrcodeOptions(config: QrConfig) {
  const resolved = resolveQrConfig(config)
  return {
    errorCorrectionLevel: resolved.errorCorrectionLevel,
    margin: resolved.margin,
    width: resolved.width,
    color: {
      dark: resolved.color.dark,
      light: resolved.color.light,
    },
  }
}

export async function renderSvg(
  payload: string,
  config: Partial<QrConfig> = {},
): Promise<string> {
  return QRCode.toString(payload, {
    ...qrcodeOptions(resolveQrConfig(config)),
    type: 'svg',
  })
}

export async function renderPngDataUrl(
  payload: string,
  config: Partial<QrConfig> = {},
): Promise<string> {
  return QRCode.toDataURL(payload, {
    ...qrcodeOptions(resolveQrConfig(config)),
    type: 'image/png',
  })
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(',')
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function renderPngBytes(
  payload: string,
  config: Partial<QrConfig> = {},
): Promise<Uint8Array> {
  return dataUrlToBytes(await renderPngDataUrl(payload, config))
}

export async function renderPngBlob(
  payload: string,
  config: Partial<QrConfig> = {},
): Promise<Blob> {
  const bytes = await renderPngBytes(payload, config)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type: 'image/png' })
}

export const ENCODE_ERROR_MESSAGE =
  'This content is too long or cannot be encoded. Shorten it or choose a lower error-correction level.'

export async function canEncode(
  payload: string,
  errorCorrectionLevel: ErrorCorrectionLevel,
): Promise<boolean> {
  try {
    await QRCode.create(payload, { errorCorrectionLevel })
    return true
  } catch {
    return false
  }
}
