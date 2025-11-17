'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { onAuthStateChanged } from 'firebase/auth'

import { CircularProgress } from '@mui/material'

import { auth } from '@/libs/firebase'

const ClientAuthGuard = ({ children }) => {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      const isAuthPath =
        window.location.pathname === '/login' ||
        window.location.pathname === '/panel-login' ||
        window.location.pathname === '/register' ||
        window.location.pathname === '/forgot-password' ||
        window.location.pathname.startsWith('/reset-password')

      if (user) {
        // User is authenticated
        if (isAuthPath) {
          // Redirect to dashboard if trying to access auth pages while logged in
          router.replace('/')
        } else {
          // Allow access to protected pages
          setAuthenticated(true)
        }
      } else {
        // User is not authenticated
        if (!isAuthPath) {
          // Redirect to login if trying to access protected pages
          router.replace('/login')
        } else {
          // Allow access to auth pages
          setAuthenticated(true)
        }
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <CircularProgress />
      </div>
    )
  }

  return authenticated ? children : null
}

export default ClientAuthGuard
