import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

vi.mock('./lib/qr.ts', async () => {
  const actual = await vi.importActual<typeof import('./lib/qr.ts')>('./lib/qr.ts')
  return {
    ...actual,
    canEncode: vi.fn(async () => true),
    renderSvg: vi.fn(
      async () =>
        '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"></svg>',
    ),
    renderPngBlob: vi.fn(async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })),
  }
})

describe('QR Codes app', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.dataset.theme = 'light'
  })

  it('shows useful defaults and disables downloads until content is valid', () => {
    render(<App />)
    expect(screen.getByLabelText('Output size')).toHaveValue('256')
    expect(screen.getByLabelText('Error correction')).toHaveValue('M')
    expect(screen.getByLabelText('Quiet zone')).toHaveValue('4')
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Download SVG' })).toBeDisabled()
  })

  it('enables downloads after a valid URL is entered', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'URL' }), 'example.com')
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /QR code encoding the URL/ })).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Download SVG' })).toBeEnabled()
  })

  it('explains malformed URLs next to the field', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'URL' }), 'javascript:alert(1)')
    expect(screen.getByRole('alert')).toHaveTextContent('Use an http or https URL.')
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeDisabled()
  })

  it('warns when contrast may be difficult to scan', async () => {
    const user = userEvent.setup()
    render(<App />)
    const foreground = screen.getByLabelText('Foreground')
    await user.clear(foreground)
    await user.type(foreground, '#888888')
    expect(
      screen.getByText(/Contrast is 4\.5:1|Contrast is 4\.\d:1|Codes scan more reliably/i),
    ).toBeInTheDocument()
  })

  it('switches to text content and generates a live preview', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('radio', { name: 'Text' }))
    await user.type(screen.getByRole('textbox', { name: 'Text' }), 'こんにちは')
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /QR code encoding the text こんにちは/ })).toBeInTheDocument()
    })
  })

  it('supports keyboard navigation through the primary controls', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.tab()
    expect(screen.getByText('Skip to main content')).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText('Theme')).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('radio', { name: 'URL' })).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveFocus()

    await user.keyboard('example.com')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download PNG' })).toBeEnabled()
    })
  })

  it('associates visible labels with every control', () => {
    render(<App />)
    expect(screen.getByLabelText('Theme')).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'URL' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'Text' })).toBeEnabled()
    expect(screen.getByRole('textbox', { name: 'URL' })).toBeEnabled()
    expect(screen.getByLabelText('Foreground')).toBeEnabled()
    expect(screen.getByLabelText('Background')).toBeEnabled()
    expect(screen.getByLabelText('Output size')).toBeEnabled()
    expect(screen.getByLabelText('Quiet zone')).toBeEnabled()
    expect(screen.getByLabelText('Error correction')).toBeEnabled()
    expect(within(document.body).getAllByText('URL').length).toBeGreaterThan(0)
  })

  it('announces a successful SVG download', async () => {
    const user = userEvent.setup()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<App />)
    await user.type(screen.getByRole('textbox', { name: 'URL' }), 'example.com')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download SVG' })).toBeEnabled()
    })
    await user.click(screen.getByRole('button', { name: 'Download SVG' }))
    expect(screen.getByText('SVG downloaded.')).toBeInTheDocument()
    click.mockRestore()
  })

  it('persists appearance settings but not the payload', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<App />)
    await user.selectOptions(screen.getByLabelText('Output size'), '512')
    await user.type(screen.getByRole('textbox', { name: 'URL' }), 'secret.example')
    unmount()

    render(<App />)
    expect(screen.getByLabelText('Output size')).toHaveValue('512')
    expect(screen.getByRole('textbox', { name: 'URL' })).toHaveValue('')
  })
})
