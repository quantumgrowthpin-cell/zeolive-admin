'use client'
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import { useTheme } from '@mui/material/styles'
import { Button } from '@mui/material'

// Import utils
import { getFullImageUrl } from '@/util/commonfunctions'

const TopLikers = ({ topLikers }) => {
  const [showAll, setShowAll] = useState(false)
  const theme = useTheme()

  const displayedLikers = showAll ? topLikers : topLikers.slice(0, 5)

  if (!topLikers || topLikers.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader title='Top Likers' titleTypographyProps={{ sx: { fontWeight: 600, fontSize: '1.25rem' } }} />
      <CardContent sx={{ pt: 0 }}>
        <List disablePadding>
          {displayedLikers &&
            displayedLikers.map((liker, index) => (
              <ListItem
                key={liker._id}
                sx={{
                  pb: index === displayedLikers.length - 1 ? 0 : 2,
                  pt: index === 0 ? 0 : 2,
                  borderBottom: index === displayedLikers.length - 1 ? 'none' : `1px solid ${theme.palette.divider}`
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    src={getFullImageUrl(liker.user?.image)}
                    alt={liker.user?.name}
                    sx={{ width: 42, height: 42 }}
                  />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display='flex' alignItems='center' justifyContent='space-between'>
                      <Typography variant='body1' fontWeight={600}>
                        {liker.user?.name}
                      </Typography>
                      <Chip label={`${liker.totalLikes} likes`} size='small' color='primary' variant='tonal' />
                    </Box>
                  }
                  secondary={
                    <Typography variant='body2' color='text.secondary'>
                      {liker.user?.userName}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          {topLikers.length > 5 && !showAll && (
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
        </List>
      </CardContent>
    </Card>
  )
}

export default TopLikers
