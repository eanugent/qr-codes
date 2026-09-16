type QrPreviewProps = {
  svg: string | null
  alt: string
  emptyMessage: string
  exportSize: number
}

export function QrPreview({ svg, alt, emptyMessage, exportSize }: QrPreviewProps) {
  const src = svg
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    : null

  return (
    <div className="preview-frame">
      {src ? (
        <img src={src} alt={alt} width={exportSize} height={exportSize} />
      ) : (
        <div className="preview-empty" role="status">
          {emptyMessage}
        </div>
      )}
    </div>
  )
}
