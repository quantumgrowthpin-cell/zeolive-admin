'use client'

import { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography
} from '@mui/material'
import { styled, useTheme } from '@mui/material/styles'

import CustomTextField from '@core/components/mui/TextField'

import { getDeviceProfile } from '@/util/device'
import { loginWithPassword } from '@/services/v2/auth'

const schema = yup.object().shape({
  email: yup.string().email('Invalid email format').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required')
})

const AuthCard = styled(Paper)(({ theme }) => ({
  width: '100%',
  maxWidth: 420,
  padding: theme.spacing(5),
  borderRadius: theme.spacing(3),
  boxShadow: '0 40px 80px rgba(15, 23, 42, 0.15)'
}))

const LoginPage = () => {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useTheme()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { email: '', password: '' }
  })

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('v2_access_token') : null

    if (token) {
      const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'

      router.replace(redirectURL)
    } else {
      setCheckingAuth(false)
    }
  }, [router, searchParams])

  const handleClickShowPassword = () => setIsPasswordShown(prev => !prev)

  const onSubmit = async values => {
    setError(null)
    setLoading(true)

    try {
      await loginWithPassword({
        email: values.email,
        password: values.password,
        device: getDeviceProfile()
      })

      const redirectURL = searchParams.get('redirectTo') ?? '/dashboard'

      router.replace(redirectURL)
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Unable to login. Please try again.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <CircularProgress />
      </div>
    )
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.background.default} 100%)`
      }}
    >
      <AuthCard>
        <Stack spacing={2} alignItems='center' sx={{ mb: 2 }}>
          <img src='/images/logo/main-logo.png' alt='ChimaX' height={64} />
          <Typography variant='h4' fontWeight={700}>
            Welcome back
          </Typography>
          <Typography variant='body2' color='text.secondary' textAlign='center'>
            Sign in with your admin credentials to access the control panel.
          </Typography>
        </Stack>

        {error && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
          <CustomTextField
            fullWidth
            label='Work Email'
            placeholder='you@example.com'
            {...register('email')}
            error={!!errors.email}
            helperText={errors.email?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-mail' />
                  </InputAdornment>
                )
              }
            }}
          />

          <CustomTextField
            fullWidth
            label='Password'
            placeholder='Enter your password'
            type={isPasswordShown ? 'text' : 'password'}
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton edge='end' onClick={handleClickShowPassword}>
                      <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <Button type='submit' variant='contained' size='large' disabled={loading} sx={{ mt: 1 }}>
            {loading ? <CircularProgress size={20} /> : 'Login'}
          </Button>
          <Button variant='text' size='small' onClick={() => router.replace('/register')}>
            Need an account? Register with your invite key
          </Button>
        </form>
      </AuthCard>
    </Box>
  )
}

export default LoginPage
