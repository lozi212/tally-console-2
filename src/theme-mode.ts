import { createContext, useContext } from 'react'
import type { PaletteMode } from '@mui/material/styles'

export const THEME_STORAGE_KEY = 'tally.theme'

export interface ThemeModeValue {
  mode: PaletteMode
  toggle: () => void
}

export const ThemeModeContext = createContext<ThemeModeValue | null>(null)

export function useThemeMode(): ThemeModeValue {
  const value = useContext(ThemeModeContext)
  if (!value) throw new Error('useThemeMode must be used inside <ThemeModeProvider>')
  return value
}
