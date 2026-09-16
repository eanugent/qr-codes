import type { ReactNode } from 'react'

type FieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Field({ id, label, error, hint, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? (
        <p id={hintId} className="hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
