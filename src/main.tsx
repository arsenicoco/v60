import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import '@theatre/core'

// Theatre Studio (the visual keyframe editor) only in dev, opt-in with ?studio.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('studio')) {
  const mod = await import('@theatre/studio')
  // CJS package: Vite may wrap the default export one level deeper.
  const studio = 'initialize' in mod.default ? mod.default : (mod.default as unknown as { default: typeof mod.default }).default
  studio.initialize()
}

// Imported after Studio so the project registers with it.
const { default: App } = await import('./App.tsx')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange scriptProps={{ type: 'application/json' }}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
