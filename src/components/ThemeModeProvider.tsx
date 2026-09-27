import { useCallback, useMemo, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'
import { useLocalStorageState } from '../hooks/useLocalStorageState'
import { buildTheme } from '../theme'
import { THEME_STORAGE_KEY, ThemeModeContext, type ThemeModeValue } from '../theme-mode'

/**
 * Light/dark for the whole app, remembered between visits with the same
 * storage hook the session uses, so the choice also follows other tabs.
 */
export default function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useLocalStorageState<PaletteMode>(THEME_STORAGE_KEY, 'light')

  const toggle = useCallback(
    () => setMode((current) => (current === 'light' ? 'dark' : 'light')),
    [setMode],
  )

  // Rebuilding a theme is not cheap, and it would re-render every styled node.
  const theme = useMemo(() => buildTheme(mode), [mode])
  const value = useMemo<ThemeModeValue>(() => ({ mode, toggle }), [mode, toggle])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
