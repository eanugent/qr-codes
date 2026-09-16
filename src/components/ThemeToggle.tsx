import type { ThemePreference } from '../lib/settings.ts'

type ThemeToggleProps = {
  value: ThemePreference
  onChange: (value: ThemePreference) => void
}

export function ThemeToggle({ value, onChange }: ThemeToggleProps) {
  return (
    <div className="theme-toggle">
      <label htmlFor="theme">Theme</label>
      <select
        id="theme"
        value={value}
        onChange={(event) => onChange(event.target.value as ThemePreference)}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  )
}
