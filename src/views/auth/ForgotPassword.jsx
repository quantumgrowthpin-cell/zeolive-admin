'use client'

// Next Imports
import { useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

// React Imports

// MUI Imports
import useMediaQuery from '@mui/material/useMediaQuery'
import { styled, useTheme } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

// Form & Validation Imports
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

// Third-party Imports
import axios from 'axios'
import classnames from 'classnames'
import { toast } from 'react-toastify'
import { sendPasswordResetEmail } from 'firebase/auth'

import { auth } from '@/libs/firebase'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomTextField from '@core/components/mui/TextField'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { baseURL, key } from '@/util/config'

// Styled Custom Components
const LoginIllustration = styled('div')(({ theme }) => ({
  zIndex: 2,
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}))

const PhotoContainer = styled('div')({
  width: '100%',
  position: 'relative',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
})

// Schema for form validation
const schema = yup.object().shape({
  email: yup.string().email('Please enter a valid email').required('Email is required')
})

const ForgotPassword = ({ mode }) => {
  // States
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-mask-dark.png'
  const lightImg = '/images/pages/auth-mask-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-forgot-password-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-forgot-password-light.png'

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const theme = useTheme()
  const hidden = useMediaQuery(theme.breakpoints.down('md'))
  const authBackground = useImageVariant(mode, lightImg, darkImg)
  const characterIllustration = useImageVariant(mode, lightIllustration, darkIllustration)

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({ resolver: yupResolver(schema) })

  const onSubmit = async data => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Firebase password reset
      await sendPasswordResetEmail(auth, data.email)

      // Backend API integration
      await axios.get(`${baseURL}/api/admin/admin/requestPasswordReset`, {
        params: { email: data.email },
        headers: {
          key: key,
          Authorization: `Bearer ${sessionStorage.getItem('admin_token') || ''}`,
          'x-auth-adm': sessionStorage.getItem('uid') || ''
        }
      })

      setSuccess(true)
      toast.success('Password reset email sent successfully!')
    } catch (err) {
      console.error('Password reset error:', err)
      setError('Failed to send password reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <LoginIllustration>
          <PhotoContainer>
            <img
              src='/images/illustrations/auth/forgot-bg.png'
              alt='login collage'
              style={{ width: '100%', height: '100dvh', objectFit: 'cover' }}
              width={100}
              height={100}
            />
          </PhotoContainer>
        </LoginIllustration>
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[50dvw]'>
        <div className='flex flex-col gap-3 justify-center aspect-[9/16] w-full max-w-sm mx-auto'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>Forgot Password 🔒</Typography>
            <Typography>Enter your email and we&#39;ll send you instructions to reset your password</Typography>
          </div>

          {/* Show success/error messages */}
          {error && <Alert severity='error'>{error}</Alert>}
          {success && (
            <Alert severity='success'>Password reset email sent successfully! Please check your email inbox.</Alert>
          )}

          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <CustomTextField
              autoFocus
              fullWidth
              label='Email'
              placeholder='Enter your email'
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <Button fullWidth variant='contained' type='submit' disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <Typography className='flex justify-center items-center' color='primary.main'>
              <Link href={'/login'} className='flex items-center gap-1.5'>
                <i className='tabler-chevron-left' />
                <span>Back to login</span>
              </Link>
            </Typography>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
