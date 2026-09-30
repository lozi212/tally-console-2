import {
  createTheme,
  type PaletteMode,
  type Theme,
} from '@mui/material/styles'

const light = {
  background: {
    default: '#F5F7FA',
    paper: '#FFFFFF',
  },

  primary: {
    main: '#2563EB',
    contrastText: '#FFFFFF',
  },

  text: {
    primary: '#172033',
    secondary: '#64748B',
  },

  divider: '#E2E8F0',

  action: {
    hover: '#F1F5F9',
    selected: '#E8F0FE',
  },
}

const dark = {
  background: {
    default: '#0F172A',
    paper: '#182235',
  },

  primary: {
    main: '#60A5FA',
    contrastText: '#0F172A',
  },

  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
  },

  divider: '#334155',

  action: {
    hover: '#243247',
    selected: '#1E3A5F',
  },
}

export function buildTheme(mode: PaletteMode): Theme {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'light' ? light : dark),
    },

    typography: {
      fontFamily:
        'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',

      h5: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },

      h6: {
        fontWeight: 700,
      },

      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },

    shape: {
      borderRadius: 10,
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow:
              mode === 'light'
                ? '0 1px 3px rgba(15, 23, 42, 0.08)'
                : '0 1px 3px rgba(0, 0, 0, 0.25)',
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === 'light' ? '#F8FAFC' : '#1E293B',
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            color:
              mode === 'light' ? '#475569' : '#CBD5E1',
          },

          root: {
            borderColor:
              mode === 'light' ? '#E2E8F0' : '#334155',
          },
        },
      },
    },
  })
}

