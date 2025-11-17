'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CircularProgress } from '@mui/material'

const V2AuthGuard = ({ children }) => {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('v2_access_token') : null

    if (!token) {
      router.replace('/login')
    } else {
      setChecking(false)
    }
  }, [router])

  if (checking) {
    return (
      <div className='flex justify-center items-center min-bs-[100dvh]'>
        <CircularProgress />
      </div>
    )
  }

  return children
}

export default V2AuthGuard
