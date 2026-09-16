export function describedBy(
  id: string,
  error?: string,
  hint?: string,
): string | undefined {
  const ids = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(
    Boolean,
  )
  return ids.length > 0 ? ids.join(' ') : undefined
}
