# QR Codes

A privacy-first web application for creating static QR codes. Everything is generated in the browser: user-entered content is never uploaded, stored on a server, or routed through a redirect service.

## Product goals

- Make reliable QR codes quickly on desktop or mobile.
- Keep all content local to the user's browser.
- Produce files suitable for screens and print.
- Prevent customization choices that make codes difficult to scan.
- Keep the application simple enough to host as a static site.

## Scope

The first release will support:

- URL and plain-text QR codes
- A live preview that updates as the user types
- Foreground and background colors
- Output-size selection
- Error-correction selection
- PNG and SVG downloads
- Copy and native share actions where the browser supports them
- A responsive, accessible interface with light and dark themes

Later static-code additions may include dedicated forms for:

- Wi-Fi credentials
- Email messages
- Phone calls and SMS messages
- Contact cards
- Calendar events
- Geographic locations

Each dedicated form will produce a standards-compatible text payload and pass it to the same QR rendering engine.

## Non-goals

This project will not provide:

- Editable destinations after a code has been created
- Redirect or URL-shortening services
- Scan analytics
- User accounts or cloud storage
- Server-side QR generation
- Tracking or advertising

A generated QR code permanently contains the supplied payload. Changing its destination requires generating and distributing a new code.

## Recommended implementation

- **React and TypeScript** for the interface and application logic
- **Vite** for local development and production builds
- **`qrcode`** for QR encoding and SVG/canvas rendering
- **Vitest** for unit and integration tests
- **GitHub Actions and GitHub Pages** for deployment

No backend, database, or API is required. The production site is a set of static assets and can run entirely from GitHub Pages.

## Application structure

Keep payload creation separate from rendering and presentation:

```text
src/
  components/       Form controls, preview, and download actions
  lib/
    payloads.ts     Builders for URL, text, Wi-Fi, contact, and other payloads
    qr.ts           QR configuration, rendering, and export logic
    validation.ts   Content, contrast, and configuration checks
  App.tsx
  main.tsx
```

The renderer should accept a payload and a typed configuration object. This keeps all input types consistent and makes the QR logic easy to test independently of the interface.

## Reliability requirements

Generating a scannable code takes priority over decorative styling.

- Preserve a quiet zone at least four modules wide on every side.
- Default to error-correction level `M`.
- Allow `L`, `M`, `Q`, and `H`, with a short explanation of the density and recovery tradeoff.
- Maintain strong contrast between the foreground and background.
- Warn when a selected color combination may be difficult to scan.
- Allow the QR version to grow automatically as payload size increases.
- Do not crop, stretch, blur, or apply lossy resizing to generated codes.
- Export SVG as the preferred print format and PNG at its requested pixel dimensions.
- Test generated samples with an independent decoder.

If logo support is added later, it should use error correction `H`, restrict logo dimensions, preserve the position markers, and require additional scan testing.

## User experience

The primary screen should have two areas:

1. A form for content and appearance settings.
2. A persistent preview with download actions.

The interface should:

- Show useful defaults immediately.
- Explain errors next to the affected control.
- Disable downloads when the payload is empty or invalid.
- Give the downloaded file a descriptive, safe filename.
- Preserve settings locally only when the user expects it.
- Work without an account, onboarding flow, or network request after loading.

## Privacy and security

- Do not send payloads, generated images, or usage data to a server.
- Avoid third-party scripts and remotely loaded assets.
- Do not log QR payloads to the console or error-reporting services.
- Treat all entered content as untrusted text.
- Sanitize filenames and any content rendered outside form controls.
- Document that anyone who can scan a QR code can read its embedded content.

## Accessibility

- Associate every control with a visible label.
- Support keyboard-only operation and clear focus states.
- Announce validation errors and successful downloads appropriately.
- Do not rely on color alone to communicate warnings or state.
- Respect reduced-motion and system color-scheme preferences.
- Keep the layout usable at narrow mobile widths and high zoom levels.

## Testing

The automated test suite should cover:

- Payload builders and escaping rules
- Empty, malformed, Unicode, and long inputs
- QR option defaults and error-correction changes
- SVG and PNG export behavior
- Contrast and configuration warnings
- Round-trip decoding of representative generated codes
- Keyboard navigation and critical accessibility behavior
- The production build

Manual release checks should scan representative codes on multiple phone cameras and test both screen and printed output.

## Deployment

Build the site with Vite and deploy the generated `dist` directory through GitHub Actions to GitHub Pages. For the default project URL, configure Vite with:

```ts
export default defineConfig({
  base: "/qr-codes/",
});
```

Use `base: "/"` instead if the site is later served from a custom domain root.

## Delivery plan

1. Scaffold React, TypeScript, Vite, linting, and tests.
2. Implement URL and text inputs with a live QR preview.
3. Add safe color, size, margin, and error-correction controls.
4. Add SVG and PNG downloads.
5. Add validation, accessibility, and round-trip scan tests.
6. Configure the GitHub Pages deployment workflow.
7. Add structured static payload types only after the core generator is stable.

## References

- [QR Code error-correction guidance](https://www.qrcode.com/en/about/error_correction.html)
- [QR Code quiet-zone guidance](https://www.qrcode.com/en/howto/code.html)
- [QR Code versions and data capacity](https://www.qrcode.com/en/about/version.html)
- [`qrcode` browser and rendering documentation](https://github.com/soldair/node-qrcode)
- [Vite static deployment guide](https://vite.dev/guide/static-deploy)
