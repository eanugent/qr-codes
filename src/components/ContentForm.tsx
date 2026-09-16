import { describedBy } from '../lib/a11y.ts'
import { Field } from './Field.tsx'
import type { ContentKind } from '../lib/validation.ts'

type ContentFormProps = {
  kind: ContentKind
  urlValue: string
  textValue: string
  error?: string
  warning?: string
  onKindChange: (kind: ContentKind) => void
  onUrlChange: (value: string) => void
  onTextChange: (value: string) => void
}

export function ContentForm({
  kind,
  urlValue,
  textValue,
  error,
  warning,
  onKindChange,
  onUrlChange,
  onTextChange,
}: ContentFormProps) {
  const contentId = 'content'
  const hint =
    kind === 'url'
      ? 'http or https links work. If you omit the protocol, https is added.'
      : 'The exact text will be embedded in the code. Anyone who scans it can read it.'

  return (
    <fieldset className="group">
      <legend>Content</legend>
      <div className="segmented" role="radiogroup" aria-label="Content type">
        <label className={kind === 'url' ? 'selected' : undefined}>
          <input
            type="radio"
            name="kind"
            value="url"
            checked={kind === 'url'}
            onChange={() => onKindChange('url')}
          />
          URL
        </label>
        <label className={kind === 'text' ? 'selected' : undefined}>
          <input
            type="radio"
            name="kind"
            value="text"
            checked={kind === 'text'}
            onChange={() => onKindChange('text')}
          />
          Text
        </label>
      </div>

      {kind === 'url' ? (
        <Field id={contentId} label="URL" error={error} hint={hint}>
          <input
            id={contentId}
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            value={urlValue}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="https://example.com"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy(contentId, error, hint)}
          />
        </Field>
      ) : (
        <Field id={contentId} label="Text" error={error} hint={hint}>
          <textarea
            id={contentId}
            rows={5}
            value={textValue}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Hello, world"
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy(contentId, error, hint)}
          />
        </Field>
      )}

      {warning ? (
        <p className="warning" role="status">
          {warning}
        </p>
      ) : null}
    </fieldset>
  )
}
