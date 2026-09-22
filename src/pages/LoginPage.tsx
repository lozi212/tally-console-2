import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useAuth } from '../auth/authContext'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  // On success there is nothing to do here: AuthProvider now has a user,
  // so the router swaps in the authenticated app and redirects.
  const mutation = useMutation({
    mutationFn: ({ username, password }: LoginValues) => login(username, password),
  })

  const { ref: usernameRef, ...usernameField } = register('username')
  const { ref: passwordRef, ...passwordField } = register('password')

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2 }}>
      <Paper variant="outlined" sx={{ p: 4, width: '100%', maxWidth: 400 }}>
        <Stack
          component="form"
          spacing={2}
          noValidate
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
        >
          <Box>
            <Typography variant="h5" component="h1">
              Sign in to Tally
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Merchant transactions console
            </Typography>
          </Box>

          {mutation.isError && <Alert severity="error">{mutation.error.message}</Alert>}

          <TextField
            label="Username"
            autoComplete="username"
            autoFocus
            required
            inputRef={usernameRef}
            {...usernameField}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            inputRef={passwordRef}
            {...passwordField}
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button type="submit" variant="contained" size="large" loading={mutation.isPending}>
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
