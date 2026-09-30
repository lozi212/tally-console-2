import { useState } from 'react'
import {
  Outlet,
  Link as RouterLink,
  useLocation,
} from 'react-router-dom'

import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'

import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import PeopleIcon from '@mui/icons-material/People'
import PaymentsIcon from '@mui/icons-material/Payments'
import SettingsIcon from '@mui/icons-material/Settings'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeIcon from '@mui/icons-material/LightModeOutlined'

import { useAuth } from '../auth/authContext'
import { useThemeMode } from '../theme-mode'

const DRAWER_WIDTH = 240
const COLLAPSED_DRAWER_WIDTH = 72

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { mode, toggle } = useThemeMode()

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  const handleMobileDrawerToggle = () => {
    setMobileOpen((previous) => !previous)
  }

  const handleDesktopDrawerToggle = () => {
    setDesktopOpen((previous) => !previous)
  }

  const drawerWidth = desktopOpen
    ? DRAWER_WIDTH
    : COLLAPSED_DRAWER_WIDTH

  const menuItemSx = {
    minHeight: 48,
    justifyContent: desktopOpen ? 'initial' : 'center',
    borderRadius: 2,
    mb: 0.5,
    px: 1.5,
  }

  const menuIconSx = {
    minWidth: 0,
    mr: desktopOpen ? 2 : 0,
    justifyContent: 'center',
  }

  const selectedItemSx = {
    '&.Mui-selected': {
      bgcolor: 'action.selected',
      color: 'primary.main',
    },
    '&.Mui-selected .MuiListItemIcon-root': {
      color: 'primary.main',
    },
  }

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: desktopOpen
            ? 'space-between'
            : 'center',
          px: 2,
        }}
      >
        {desktopOpen && (
          <Typography
            variant="h6"
            fontWeight={700}
            color="primary.main"
          >
            Tally
          </Typography>
        )}

        {!isMobile && (
          <IconButton
            onClick={handleDesktopDrawerToggle}
            aria-label={
              desktopOpen
                ? 'Collapse navigation menu'
                : 'Expand navigation menu'
            }
          >
            {desktopOpen ? (
              <ChevronLeftIcon />
            ) : (
              <MenuIcon />
            )}
          </IconButton>
        )}
      </Toolbar>

      <Divider />

      {desktopOpen && (
        <Box sx={{ px: 2, py: 2 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={700}
          >
            MAIN MENU
          </Typography>
        </Box>
      )}

      <List sx={{ px: 1 }}>
        {/* Transactions */}
        <ListItemButton
          component={RouterLink}
          to="/transactions"
          selected={location.pathname.startsWith(
            '/transactions',
          )}
          onClick={() => setMobileOpen(false)}
          sx={{
            ...menuItemSx,
            ...selectedItemSx,
          }}
        >
          <ListItemIcon sx={menuIconSx}>
            <ReceiptLongIcon />
          </ListItemIcon>

          {desktopOpen && (
            <ListItemText primary="Transactions" />
          )}
        </ListItemButton>

        {/* Customers */}
        <ListItemButton
          component={RouterLink}
          to="/customers"
          selected={location.pathname.startsWith(
            '/customers',
          )}
          onClick={() => setMobileOpen(false)}
          sx={{
            ...menuItemSx,
            ...selectedItemSx,
          }}
        >
          <ListItemIcon sx={menuIconSx}>
            <PeopleIcon />
          </ListItemIcon>

          {desktopOpen && (
            <ListItemText primary="Customers" />
          )}
        </ListItemButton>

        {/* Payments */}
        <ListItemButton
          component={RouterLink}
          to="/payments"
          selected={location.pathname.startsWith(
            '/payments',
          )}
          onClick={() => setMobileOpen(false)}
          sx={{
            ...menuItemSx,
            ...selectedItemSx,
          }}
        >
          <ListItemIcon sx={menuIconSx}>
            <PaymentsIcon />
          </ListItemIcon>

          {desktopOpen && (
            <ListItemText primary="Payments" />
          )}
        </ListItemButton>
      </List>

      <Box sx={{ mt: 1 }}>
        {desktopOpen && (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={700}
            >
              SYSTEM
            </Typography>
          </Box>
        )}

        <List sx={{ px: 1 }}>
          {/* Settings */}
          <ListItemButton
            component={RouterLink}
            to="/settings"
            selected={location.pathname.startsWith(
              '/settings',
            )}
            onClick={() => setMobileOpen(false)}
            sx={{
              ...menuItemSx,
              ...selectedItemSx,
            }}
          >
            <ListItemIcon sx={menuIconSx}>
              <SettingsIcon />
            </ListItemIcon>

            {desktopOpen && (
              <ListItemText primary="Settings" />
            )}
          </ListItemButton>
        </List>
      </Box>

      <Box sx={{ flexGrow: 1 }} />

      {desktopOpen && (
        <Box
          sx={{
            px: 2,
            py: 2,
            color: 'text.secondary',
          }}
        >
          <Typography variant="caption">
            Merchant Console
          </Typography>
        </Box>
      )}
    </Box>
  )

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleMobileDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: isMobile ? 0 : drawerWidth,
          flexShrink: 0,

          '& .MuiDrawer-paper': {
            width: isMobile
              ? DRAWER_WIDTH
              : drawerWidth,

            boxSizing: 'border-box',

            bgcolor: 'background.paper',

            borderRight: 1,
            borderColor: 'divider',

            overflowX: 'hidden',

            transition: theme.transitions.create(
              'width',
              {
                easing:
                  theme.transitions.easing.sharp,
                duration:
                  theme.transitions.duration
                    .enteringScreen,
              },
            ),
          },
        }}
      >
        {drawerContent}
      </Drawer>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton
                onClick={handleMobileDrawerToggle}
                edge="start"
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ flexGrow: 1 }} />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: {
                  xs: 'none',
                  sm: 'block',
                },
              }}
            >
              {user?.name}
            </Typography>

            <Tooltip
              title={
                mode === 'light'
                  ? 'Switch to dark theme'
                  : 'Switch to light theme'
              }
            >
              <IconButton
                onClick={toggle}
                color="inherit"
                aria-label={
                  mode === 'light'
                    ? 'Switch to dark theme'
                    : 'Switch to light theme'
                }
              >
                {mode === 'light' ? (
                  <DarkModeIcon />
                ) : (
                  <LightModeIcon />
                )}
              </IconButton>
            </Tooltip>

            <Button
              color="inherit"
              onClick={logout}
              size="small"
            >
              Log out
            </Button>
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            py: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Container maxWidth="xl">
            <Outlet />
          </Container>
        </Box>
      </Box>
    </Box>
  )
}

