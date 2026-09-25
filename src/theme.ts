import { createTheme, type PaletteMode, type Theme } from '@mui/material/styles'

const light = {
  background: { default: '#FFFFFF', paper: '#FFFFFF' },
  primary: { main: '#000000', contrastText: '#FFFFFF' },
  text: { primary: '#000000', secondary: '#555555' },
  divider: '#E0E0E0',
}

// The same flat, neutral look inverted: near-black surfaces rather than pure
// black, so elevation and borders stay visible.
const dark = {
  background: { default: '#121212', paper: '#1A1A1A' },
  primary: { main: '#FFFFFF', contrastText: '#000000' },
  text: { primary: '#FFFFFF', secondary: '#AAAAAA' },
  divider: '#333333',
}

export function buildTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: { mode, ...(mode === 'light' ? light : dark) },
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    },
  })
}
