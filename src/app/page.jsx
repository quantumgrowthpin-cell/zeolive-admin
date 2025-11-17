'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

const IndexPage = () => {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('v2_access_token') : null

    router.replace(token ? '/dashboard' : '/login')
  }, [router])

  return null
}

export default IndexPage
