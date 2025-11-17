'use client'
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'

import { Button } from '@mui/material'

// Components Imports
import { emojiToCountryFlag, getFullImageUrl } from '@/util/commonfunctions'

const RecentUsers = ({ recentUsers }) => {
  const [showAll, setShowAll] = useState(false)

  const displayedContributors = showAll ? recentUsers : recentUsers.slice(0, 5)

  if (!recentUsers || recentUsers.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader
        title='Recent Users'
        titleTypographyProps={{ sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }}
      />
      <CardContent>
        {displayedContributors.map((user, index) => (
          <Box key={user._id} className='flex items-center mb-6 last:mb-0'>
            <Avatar src={getFullImageUrl(user.image)} alt={user.name} className='me-3' />
            <Box className='flex flex-col flex-grow'>
              <Box className='flex items-center justify-between mb-0.5'>
                <Typography className='font-medium'>{user.name}</Typography>
                <Typography variant='caption' className='text-textSecondary'>
                  {new Date(user.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Box className='flex items-center justify-between'>
                <Typography variant='caption' className='text-textSecondary'>
                  {user.userName}
                </Typography>
                <Box className='flex items-center gap-2'>
                  {emojiToCountryFlag(user.countryFlagImage)}

                  <Chip
                    size='small'
                    label={user.isOnline ? 'Online' : 'Offline'}
                    color={user.isOnline ? 'success' : 'default'}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
        {/* show more button */}
        {recentUsers.length > 5 && !showAll && (
          <Box mt={4} className='text-center'>
            <Button variant='outlined' size='small' onClick={() => setShowAll(true)}>
              Show More
            </Button>
          </Box>
        )}
        {showAll && (
          <Box mt={4} className='text-center'>
            <Button variant='outlined' size='small' onClick={() => setShowAll(false)}>
              Show Less
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentUsers
