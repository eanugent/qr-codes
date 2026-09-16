import { downloadBlob, sanitizeFilename } from '../lib/filename.ts'
import { renderPngBlob, type QrConfig } from '../lib/qr.ts'

type ExportActionsProps = {
  payload: string | null
  svg: string | null
  config: QrConfig
  canExport: boolean
  disabledReason?: string
  onStatus: (message: string) => void
}

export function ExportActions({
  payload,
  svg,
  config,
  canExport,
  disabledReason,
  onStatus,
}: ExportActionsProps) {
  const canCopy =
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  const canShare = typeof navigator.share === 'function'
  const filenameSource = payload ?? 'code'
  const disabled = !canExport || !payload || !svg

  async function handlePng() {
    if (!payload) {
      return
    }
    try {
      const blob = await renderPngBlob(payload, config)
      downloadBlob(blob, sanitizeFilename(filenameSource, 'png'))
      onStatus('PNG downloaded.')
    } catch {
      onStatus('PNG download failed.')
    }
  }

  function handleSvg() {
    if (!svg) {
      return
    }
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    downloadBlob(blob, sanitizeFilename(filenameSource, 'svg'))
    onStatus('SVG downloaded.')
  }

  async function handleCopy() {
    if (!payload || !canCopy) {
      return
    }
    try {
      const blob = await renderPngBlob(payload, config)
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      onStatus('Image copied to the clipboard.')
    } catch {
      onStatus('Copy is not available in this browser.')
    }
  }

  async function handleShare() {
    if (!payload || !canShare) {
      return
    }
    try {
      const filename = sanitizeFilename(filenameSource, 'png')
      const blob = await renderPngBlob(payload, config)
      const file = new File([blob], filename, { type: 'image/png' })
      if (navigator.canShare && !navigator.canShare({ files: [file] })) {
        onStatus('Sharing files is not available in this browser.')
        return
      }
      await navigator.share({
        files: [file],
        title: 'QR code',
      })
      onStatus('Share sheet opened.')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      onStatus('Sharing is not available in this browser.')
    }
  }

  return (
    <div className="export-actions">
      <div className="button-row">
        <button type="button" className="primary" disabled={disabled} onClick={handlePng}>
          Download PNG
        </button>
        <button type="button" className="primary" disabled={disabled} onClick={handleSvg}>
          Download SVG
        </button>
      </div>
      <div className="button-row">
        {canCopy ? (
          <button type="button" disabled={disabled} onClick={handleCopy}>
            Copy image
          </button>
        ) : null}
        {canShare ? (
          <button type="button" disabled={disabled} onClick={handleShare}>
            Share
          </button>
        ) : null}
      </div>
      {disabled && disabledReason ? (
        <p className="hint">{disabledReason}</p>
      ) : (
        <p className="hint">
          SVG is the preferred format for print. PNG uses the selected pixel size.
        </p>
      )}
    </div>
  )
}
