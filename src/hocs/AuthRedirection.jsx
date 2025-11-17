'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Box, CircularProgress } from '@mui/material'

import { getLogin } from '@/@core/utils/clientHelpers'

const AuthRedirect = ({ children }) => {
  const router = useRouter()

  const [isLogin, setIsLogin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogin = async () => {
      try {
        const login = await getLogin()


        // console.log('isLogin', login.alreadyRegistered)
        setIsLogin(login.alreadyRegistered)

        // setIsLogin(true)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching login status:', error)
        setIsLogin(false)
        setLoading(false)
      } finally {
        setLoading(false)
      }
    }

    fetchLogin()
  }, [])

  useEffect(() => {
    if (isLogin === true) {
      router.replace('/login')
    } else if (isLogin === false) {
      router.replace('/register')
    }
  }, [isLogin, router])

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='100vh'>
        <CircularProgress />
      </Box>
    )
  }

  return <>{children}</>
}

export default AuthRedirect
