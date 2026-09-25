import { Outlet, Link as RouterLink } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'
import { useAuth } from '../auth/authContext'
import { useThemeMode } from '../theme-mode'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { mode, toggle } = useThemeMode()

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/transactions"
            sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}
          >
            Tally
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.name}
          </Typography>
          <Tooltip title={mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}>
            <IconButton
              onClick={toggle}
              color="inherit"
              aria-label={mode === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
          <Button color="inherit" onClick={logout}>
            Log out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" component="main" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  )
}
