import { createTheme } from '@mui/material'

export const theme = createTheme({
  palette: {
    // Light mode: beige surfaces with brown text and accents.
    mode: 'light',
    background: {
      default: '#6F4E37', // page background: beige
      paper: '#f2e9d7ff', // cards, the login box, the top bar: lighter beige
    },
    primary: {
      main: '#6F4E37', // buttons, focused inputs, links: coffee brown
      contrastText: '#FBF6EE', // text on brown buttons
    },
    text: {
      primary: '#3E2A1F', // headings and body text: dark brown
      secondary: '#7A6252', // hints and secondary text: soft brown
    },
    divider: '#DCCFBC', // borders and lines: tan
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  },
})
