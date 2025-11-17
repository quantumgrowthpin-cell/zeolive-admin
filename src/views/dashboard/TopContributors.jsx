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
import Button from '@mui/material/Button'

import { getFullImageUrl } from '@/util/commonfunctions'

const TopContributors = ({ topContributors }) => {
  const [showAll, setShowAll] = useState(false)

  // Only show first 5 users initially
  const displayedContributors = showAll ? topContributors : topContributors.slice(0, 5)

  if (!topContributors || topContributors.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader
        title='Top Contributors'
        titleTypographyProps={{ sx: { lineHeight: '2rem !important', letterSpacing: '0.15px !important' } }}
      />
      <CardContent>
        {/* <Box
          sx={{
            maxHeight: showAll ? 300 : 'auto', // Only limit height when showAll is true
            overflowY: showAll ? 'auto' : 'visible',
            pr: showAll ? 2 : 0 // add padding if scroll is there
          }}
        > */}
        {displayedContributors.map((user, index) => (
          <Box key={index} className='flex items-center mb-6 last:mb-0'>
            <Avatar src={getFullImageUrl(user.image)} alt={user.name} className='me-3' />
            <Box className='flex flex-col flex-grow'>
              <Box className='flex items-center justify-between mb-0.5'>
                <Typography className='font-medium'>{user.name}</Typography>
                <Typography variant='h6' color='primary'>
                  {user.totalCoinsSpent.toLocaleString()} coins
                </Typography>
              </Box>
              <Box className='flex items-center justify-between'>
                <Typography variant='caption' className='text-textSecondary'>
                  {user.userName}
                </Typography>
                <Box className='flex items-center gap-2'>
                  <Typography variant='caption'>{user.countryFlagImage}</Typography>
                  {user.isVIP && <Chip size='small' label='VIP' color='warning' />}
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
        {/* </Box> */}

        {/* Show More Button */}
        {topContributors.length > 5 && !showAll && (
          <Box mt={4} className='text-center'>
            <Button variant='outlined' size='small' onClick={() => setShowAll(true)}>
              Show More
            </Button>
          </Box>
        )}

        {/* show less button */}
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

export default TopContributors
