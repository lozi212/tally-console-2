import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'

import SettingsIcon from '@mui/icons-material/Settings'
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined'

import { useAuth } from '../auth/authContext'
import { useThemeMode } from '../theme-mode'

export default function SettingsPage() {
  const { user } = useAuth()
  const { mode, toggle } = useThemeMode()

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Manage your console preferences.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
          >
            <SettingsIcon color="primary" />

            <Box>
              <Typography variant="h6">
                Account
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Signed in as {user?.name || 'User'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6">
                Appearance
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Customize how the console looks.
              </Typography>
            </Box>

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggle}
                />
              }
              label={
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <DarkModeIcon fontSize="small" />

                  <Box>
                    <Typography variant="body2">
                      Dark mode
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                    >
                      Use a darker interface
                    </Typography>
                  </Box>
                </Stack>
              }
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

