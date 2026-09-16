import {
  ERROR_CORRECTION_HELP,
  ERROR_CORRECTION_LEVELS,
  OUTPUT_SIZES,
  QUIET_ZONE_OPTIONS,
  type ErrorCorrectionLevel,
  type OutputSize,
  type QuietZone,
} from '../lib/qr.ts'
import { describedBy } from '../lib/a11y.ts'
import { Field } from './Field.tsx'

type AppearanceFormProps = {
  foreground: string
  background: string
  width: OutputSize
  margin: QuietZone
  errorCorrectionLevel: ErrorCorrectionLevel
  foregroundError?: string
  backgroundError?: string
  colorError?: string
  colorWarnings: string[]
  onForegroundChange: (value: string) => void
  onBackgroundChange: (value: string) => void
  onWidthChange: (value: OutputSize) => void
  onMarginChange: (value: QuietZone) => void
  onErrorCorrectionChange: (value: ErrorCorrectionLevel) => void
}

export function AppearanceForm({
  foreground,
  background,
  width,
  margin,
  errorCorrectionLevel,
  foregroundError,
  backgroundError,
  colorError,
  colorWarnings,
  onForegroundChange,
  onBackgroundChange,
  onWidthChange,
  onMarginChange,
  onErrorCorrectionChange,
}: AppearanceFormProps) {
  const sizeHint = 'PNG downloads use this pixel size. SVG scales without blur for print.'
  const marginHint =
    'Quiet-zone modules of empty space around the code. Four is the minimum scanners expect.'
  const ecHint = ERROR_CORRECTION_HELP[errorCorrectionLevel]

  return (
    <fieldset className="group">
      <legend>Appearance</legend>

      <div className="color-row">
        <ColorField
          id="foreground"
          label="Foreground"
          value={foreground}
          error={foregroundError}
          onChange={onForegroundChange}
        />
        <ColorField
          id="background"
          label="Background"
          value={background}
          error={backgroundError}
          onChange={onBackgroundChange}
        />
      </div>

      {colorError ? (
        <p className="error" role="alert">
          {colorError}
        </p>
      ) : null}

      {colorWarnings.map((warning) => (
        <p key={warning} className="warning" role="status">
          {warning}
        </p>
      ))}

      <Field id="size" label="Output size" hint={sizeHint}>
        <select
          id="size"
          value={width}
          aria-describedby={describedBy('size', undefined, sizeHint)}
          onChange={(event) =>
            onWidthChange(Number(event.target.value) as OutputSize)
          }
        >
          {OUTPUT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} × {size} px
            </option>
          ))}
        </select>
      </Field>

      <Field id="margin" label="Quiet zone" hint={marginHint}>
        <select
          id="margin"
          value={margin}
          aria-describedby={describedBy('margin', undefined, marginHint)}
          onChange={(event) =>
            onMarginChange(Number(event.target.value) as QuietZone)
          }
        >
          {QUIET_ZONE_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value} modules{value === 4 ? ' (minimum)' : ''}
            </option>
          ))}
        </select>
      </Field>

      <Field id="ec" label="Error correction" hint={ecHint}>
        <select
          id="ec"
          value={errorCorrectionLevel}
          aria-describedby={describedBy('ec', undefined, ecHint)}
          onChange={(event) =>
            onErrorCorrectionChange(event.target.value as ErrorCorrectionLevel)
          }
        >
          {ERROR_CORRECTION_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
              {level === 'M' ? ' — default' : ''}
            </option>
          ))}
        </select>
      </Field>
    </fieldset>
  )
}

function ColorField({
  id,
  label,
  value,
  error,
  onChange,
}: {
  id: string
  label: string
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const pickerId = `${id}-picker`
  const hexValid = /^#([0-9a-f]{6})$/i.test(value)
  const pickerValue = hexValid ? value : '#000000'

  return (
    <Field id={id} label={label} error={error}>
      <div className="color-field">
        <input
          id={pickerId}
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} color picker`}
        />
        <input
          id={id}
          type="text"
          spellCheck={false}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(id, error)}
        />
      </div>
    </Field>
  )
}
