'use client'

import { useEffect } from 'react'

import { useSelector, useDispatch } from 'react-redux'
import { Typography, Box, Button, Skeleton, Card, Grid as MuiGrid, Divider, useTheme } from '@mui/material'
import Grid from '@mui/material/Grid2'

import { fetchUserVideos } from '@/redux-store/slices/user'
import VideoCard from './VideoCard'

// Loading Skeleton Component
const VideoSkeleton = () => (
  <Card sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
    {/* Thumbnail Skeleton */}
    <Box sx={{ position: 'relative' }}>
      <Skeleton variant='rectangular' sx={{ width: '100%', paddingTop: '56.25%' }} />
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.75rem'
        }}
      >
        <Skeleton variant='text' width={40} />
      </Box>
    </Box>

    {/* Content Skeleton */}
    <Box sx={{ p: 2 }}>
      <Skeleton variant='text' sx={{ mb: 1, width: '80%' }} />
      <Skeleton variant='text' sx={{ mb: 2, width: '60%' }} />

      <MuiGrid container spacing={1} sx={{ mb: 1 }}>
        <MuiGrid item xs={3}>
          <Skeleton variant='rectangular' height={24} sx={{ borderRadius: 1 }} />
        </MuiGrid>
        <MuiGrid item xs={3}>
          <Skeleton variant='rectangular' height={24} sx={{ borderRadius: 1 }} />
        </MuiGrid>
        <MuiGrid item xs={3}>
          <Skeleton variant='rectangular' height={24} sx={{ borderRadius: 1 }} />
        </MuiGrid>
      </MuiGrid>

      <Skeleton variant='text' width='100%' height={40} />
    </Box>
  </Card>
)

// Main VideosTab Component
const VideosTab = ({ userId }) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const { modalData, modalLoading } = useSelector(state => state.userReducer)
  const videos = modalData.videos || []
  const { initialLoading, error } = modalLoading.videos || {}

  useEffect(() => {
    if (initialLoading) {
      dispatch(fetchUserVideos({ userId }))
    }
  }, [dispatch, userId, initialLoading])

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color='error' variant='h6' gutterBottom>
          Error Loading Videos
        </Typography>
        <Typography color='text.secondary'>{error}</Typography>
        <Button variant='contained' sx={{ mt: 2 }} onClick={() => dispatch(fetchUserVideos({ userId }))}>
          Retry
        </Button>
      </Box>
    )
  }

  if (!videos.length && !initialLoading) {
    return (
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        justifyContent='center'
        py={8}
        px={2}
        textAlign='center'
      >
        <Box
          sx={{
            borderRadius: '50%',
            p: 2,
            mb: 2
          }}
        >
          <i className='tabler-video text-3xl' style={{ color: theme.palette.warning.main }} />
        </Box>
        <Typography variant='h6' gutterBottom>
          No Videos Yet
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
          This user hasn&apos;t shared any videos yet.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      {initialLoading ? (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {Array.from(new Array(3)).map((_, index) => (
            <VideoSkeleton key={index} />
          ))}
        </div>
      ) : (
        <Box>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {videos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        </Box>
      )}
    </Box>
  )
}

export default VideosTab
