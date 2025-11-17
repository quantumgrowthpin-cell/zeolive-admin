'use client'
import React from 'react'

import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'

const UserTabShimmer = () => {
  const theme = useTheme()
  const shimmerBg = theme.palette.mode === 'dark' ? '#424242' : '#e0e0e0'

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      {[...Array(5)].map((_, i) => (
        <Box
          key={i}
          height={48}
          borderRadius={2}
          sx={{
            backgroundColor: shimmerBg,
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 1 },
              '50%': { opacity: 0.4 },
              '100%': { opacity: 1 }
            }
          }}
        />
      ))}
    </Box>
  )
}

export default UserTabShimmer
