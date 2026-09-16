import { useEffect, useMemo, useState } from 'react'
import { AppearanceForm } from './components/AppearanceForm.tsx'
import { ContentForm } from './components/ContentForm.tsx'
import { ExportActions } from './components/ExportActions.tsx'
import { QrPreview } from './components/QrPreview.tsx'
import { ThemeToggle } from './components/ThemeToggle.tsx'
import {
  canEncode,
  ENCODE_ERROR_MESSAGE,
  renderSvg,
  resolveQrConfig,
  type QrConfig,
} from './lib/qr.ts'
import {
  applyTheme,
  loadSettings,
  saveSettings,
  type StoredSettings,
} from './lib/settings.ts'
import { fieldError, validateInput } from './lib/validation.ts'

export default function App() {
  const initial = useMemo(() => loadSettings(), [])
  const [kind, setKind] = useState(initial.kind)
  const [urlValue, setUrlValue] = useState('')
  const [textValue, setTextValue] = useState('')
  const [foreground, setForeground] = useState(initial.foreground)
  const [background, setBackground] = useState(initial.background)
  const [width, setWidth] = useState(initial.width)
  const [margin, setMargin] = useState(initial.margin)
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState(
    initial.errorCorrectionLevel,
  )
  const [theme, setTheme] = useState(initial.theme)
  const [svg, setSvg] = useState<string | null>(null)
  const [encodeError, setEncodeError] = useState<string | undefined>()
  const [status, setStatus] = useState('')

  const content = kind === 'url' ? urlValue : textValue
  const validation = validateInput({
    kind,
    content,
    appearance: { foreground, background, margin },
  })
  const config: QrConfig = resolveQrConfig({
    errorCorrectionLevel,
    margin,
    width,
    color: { dark: foreground, light: background },
  })
  const typedContentError = fieldError(validation.errors, 'content')
  const previewSvg = validation.canExport && !encodeError ? svg : null
  const contentError =
    (validation.canExport ? encodeError : undefined) ??
    (content.trim() ? typedContentError : undefined)
  const canExport = Boolean(previewSvg)
  const emptyMessage =
    kind === 'url'
      ? 'Enter a URL to generate a QR code.'
      : 'Enter text to generate a QR code.'
  const disabledReason = !validation.payload
    ? emptyMessage
    : contentError ??
      fieldError(validation.errors, 'foreground') ??
      fieldError(validation.errors, 'background') ??
      fieldError(validation.errors, 'color') ??
      fieldError(validation.errors, 'margin') ??
      'Fix the highlighted fields to enable downloads.'
  const previewAlt = validation.payload
    ? `QR code encoding ${kind === 'url' ? 'the URL' : 'the text'} ${summarize(validation.payload)}`
    : ''
  const contentWarning = validation.warnings.find(
    (warning) => warning.field === 'content',
  )?.message
  const colorWarnings = validation.warnings
    .filter((warning) => warning.field === 'color')
    .map((warning) => warning.message)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const settings: StoredSettings = {
      kind,
      errorCorrectionLevel,
      width,
      margin,
      foreground,
      background,
      theme,
    }
    saveSettings(settings)
  }, [kind, errorCorrectionLevel, width, margin, foreground, background, theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      if (theme === 'system') {
        applyTheme(theme)
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  useEffect(() => {
    if (!validation.canExport || !validation.payload) {
      return
    }

    const payload = validation.payload
    const renderConfig: QrConfig = {
      errorCorrectionLevel: config.errorCorrectionLevel,
      margin: config.margin,
      width: config.width,
      color: {
        dark: config.color.dark,
        light: config.color.light,
      },
    }
    let cancelled = false

    async function generate() {
      const encodable = await canEncode(payload, renderConfig.errorCorrectionLevel)
      if (cancelled) {
        return
      }
      if (!encodable) {
        setSvg(null)
        setEncodeError(ENCODE_ERROR_MESSAGE)
        return
      }

      try {
        const next = await renderSvg(payload, renderConfig)
        if (!cancelled) {
          setEncodeError(undefined)
          setSvg(next)
        }
      } catch {
        if (!cancelled) {
          setSvg(null)
          setEncodeError(ENCODE_ERROR_MESSAGE)
        }
      }
    }

    void generate()
    return () => {
      cancelled = true
    }
  }, [
    validation.canExport,
    validation.payload,
    config.errorCorrectionLevel,
    config.margin,
    config.width,
    config.color.dark,
    config.color.light,
  ])

  return (
    <div className="page">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-header">
        <div>
          <p className="eyebrow">Privacy-first</p>
          <h1>QR Codes</h1>
          <p className="lede">
            Generated in your browser. Nothing is uploaded, stored, or shortened.
          </p>
        </div>
        <ThemeToggle value={theme} onChange={setTheme} />
      </header>

      <main id="main" className="layout" tabIndex={-1}>
        <section className="panel" aria-labelledby="content-heading">
          <h2 id="content-heading" className="visually-hidden">
            Content and appearance
          </h2>
          <ContentForm
            kind={kind}
            urlValue={urlValue}
            textValue={textValue}
            error={contentError}
            warning={contentWarning}
            onKindChange={setKind}
            onUrlChange={setUrlValue}
            onTextChange={setTextValue}
          />
          <AppearanceForm
            foreground={foreground}
            background={background}
            width={width}
            margin={margin}
            errorCorrectionLevel={errorCorrectionLevel}
            foregroundError={fieldError(validation.errors, 'foreground')}
            backgroundError={fieldError(validation.errors, 'background')}
            colorError={fieldError(validation.errors, 'color')}
            colorWarnings={colorWarnings}
            onForegroundChange={setForeground}
            onBackgroundChange={setBackground}
            onWidthChange={setWidth}
            onMarginChange={setMargin}
            onErrorCorrectionChange={setErrorCorrectionLevel}
          />
        </section>

        <section className="panel preview-panel" aria-labelledby="preview-heading">
          <h2 id="preview-heading">Preview</h2>
          <QrPreview
            svg={previewSvg}
            alt={previewAlt}
            emptyMessage={emptyMessage}
            exportSize={width}
          />
          <p className="caption">
            Export size {width} × {width} px · quiet zone {margin} modules ·
            error correction {errorCorrectionLevel}
          </p>
          <ExportActions
            payload={validation.payload}
            svg={previewSvg}
            config={config}
            canExport={canExport}
            disabledReason={canExport ? undefined : disabledReason}
            onStatus={setStatus}
          />
          <p className="notice">
            Anyone who can scan this code can read the embedded content. A
            generated code cannot be edited later.
          </p>
        </section>
      </main>

      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {status}
      </div>

      <footer className="site-footer">
        <details>
          <summary>Privacy and scanning</summary>
          <p>
            Payloads, images, and settings never leave this device except what
            you download or share yourself. Appearance choices are saved in this
            browser so the form stays familiar; the URL or text you type is not
            stored. Treat every QR code as public text.
          </p>
        </details>
      </footer>
    </div>
  )
}

function summarize(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (compact.length <= 80) {
    return compact
  }
  return `${compact.slice(0, 77)}...`
}
