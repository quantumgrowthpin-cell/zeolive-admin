'use client'

import React, { useEffect, useState } from 'react'

import { useTheme } from '@mui/material'

const LevelSkeleton = () => {
  const theme = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // Only render shimmer after client is mounted
  }, [])

  if (!mounted) return null

  const bgCard = theme.palette.background.paper
  const pulseBase = theme.palette.mode === 'dark' ? '#2a2c3b' : '#e2e8f0'
  const pulseLight = theme.palette.mode === 'dark' ? '#343848' : '#f1f5f9'

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          style={{
            backgroundColor: bgCard,
            borderRadius: '0.5rem',
            boxShadow: theme.shadows[1],
            overflow: 'hidden'
          }}
        >
          <div className='p-4'>
            <div className='flex justify-between items-center mb-4'>
              <div className='rounded h-7 w-24 animate-pulse' style={{ backgroundColor: pulseBase }}></div>
              <div className='rounded h-6 w-16 animate-pulse' style={{ backgroundColor: pulseBase }}></div>
            </div>
            <div className='rounded h-5 w-40 mb-4 animate-pulse' style={{ backgroundColor: pulseBase }}></div>
            <div
              className='rounded h-32 w-full mb-4 animate-pulse flex items-center justify-center'
              style={{ backgroundColor: pulseLight }}
            >
            </div>
            <div className='space-y-3'>
              {[1, 2, 3, 4, 5].map(j => (
                <div key={j} className='rounded h-6 w-full animate-pulse' style={{ backgroundColor: pulseLight }}></div>
              ))}
            </div>
            <div
              className='mt-4 h-10 rounded w-full flex items-center justify-between'

            >
            <div className='flex items-center gap-4'>
              <div className='h-10 w-10 rounded-full animate-pulse' style={{ backgroundColor: pulseBase }}></div>
              <div className='h-10 w-10 rounded-full animate-pulse' style={{ backgroundColor: pulseBase }}></div>
            </div>
            <div className='rounded animate-pulse w-40 h-full' style={{ backgroundColor: theme.palette.primary.main, opacity: 0.15 }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LevelSkeleton
