import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('production site configuration', () => {
  it('uses the GitHub Pages project base path', () => {
    const config = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8')
    expect(config).toContain("base: '/qr-codes/'")
  })
})
