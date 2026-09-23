import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',

    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },

    primary: {
      main: '#000000',
      contrastText: '#FFFFFF',
    },

    text: {
      primary: '#000000',
      secondary: '#555555',
    },

    divider: '#E0E0E0',
  },

  typography: {
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
})