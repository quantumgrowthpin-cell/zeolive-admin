'use client'

import { useState } from 'react'

import {
  Box,
  Typography,
  IconButton,
  Chip,
  Stack,
  Dialog,
  DialogContent,
  DialogTitle,
  useTheme,
  Fade,
  Paper
} from '@mui/material'
import FavoriteIcon from '@mui/icons-material/Favorite'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import ShareIcon from '@mui/icons-material/Share'
import CloseIcon from '@mui/icons-material/Close'

import { getFullImageUrl } from '@/util/commonfunctions'

// Format video duration from seconds to MM:SS
const formatDuration = seconds => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`
}

// Video Card Component
const VideoCard = ({ video }) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const theme = useTheme()

  const handleOpenDialog = () => setDialogOpen(true)
  const handleCloseDialog = () => setDialogOpen(false)

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 1,
          overflow: 'hidden',
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper'
        }}
      >
        {/* Video Thumbnail */}
        <Box
          sx={{
            position: 'relative',
            cursor: 'pointer'
          }}
          onClick={handleOpenDialog}
        >
          <Box
            component='img'
            src={getFullImageUrl(video.videoImage)}
            alt={video.caption || 'Video thumbnail'}
            sx={{
              width: '100%',
              display: 'block',
              objectFit: 'cover',
              aspectRatio: '16/9'
            }}
          />

          {/* Duration Badge */}
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
              fontSize: '0.75rem',
              fontWeight: 'medium'
            }}
          >
            {formatDuration(video.videoTime)}
          </Box>
        </Box>

        {/* Caption and Engagement */}
        <Box sx={{ p: 2 }}>
          {/* Caption with emoji support */}
          <Typography
            variant='body2'
            sx={{
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.4
            }}
          >
            {video.caption || 'No caption'}
          </Typography>

          {/* Hashtags */}
          {video.hashTag && video.hashTag.length > 0 && (
            <Box sx={{ mb: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {video.hashTag.map((tag, index) => (
                <Typography key={index} variant='caption' color='primary' sx={{ fontWeight: 500 }}>
                  {tag}
                </Typography>
              ))}
            </Box>
          )}

          {/* Engagement Stats */}
          <Stack direction='row' spacing={2} alignItems='center' sx={{ mt: 1 }}>
            <Stack direction='row' spacing={0.5} alignItems='center'>
              <FavoriteBorderIcon fontSize='small' color='action' />
              <Typography variant='caption' color='text.secondary'>
                {video.totalLikes || 0}
              </Typography>
            </Stack>

            <Stack direction='row' spacing={0.5} alignItems='center'>
              <ChatBubbleOutlineIcon fontSize='small' color='action' />
              <Typography variant='caption' color='text.secondary'>
                {video.totalComments || 0}
              </Typography>
            </Stack>

            <Stack direction='row' spacing={0.5} alignItems='center'>
              <ShareIcon fontSize='small' color='action' />
              <Typography variant='caption' color='text.secondary'>
                {video.shareCount || 0}
              </Typography>
            </Stack>

            <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
              {video.time}
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {/* Video Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
      >
        <DialogTitle sx={{ px: 2, py: 1.5 }}>
          <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <Typography variant='subtitle1' component='div'>
              Video
            </Typography>
            <IconButton edge='end' onClick={handleCloseDialog} aria-label='close' size='small'>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {/* Video Player */}
          <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black' }}>
            <Box
              component='video'
              src={getFullImageUrl(video.videoUrl)}
              controls
              autoPlay
              sx={{
                width: '100%',
                display: 'block',
                maxHeight: '70vh'
              }}
            />
          </Box>

          {/* Video Info */}
          <Box sx={{ p: 2 }}>
            <Typography variant='body1' sx={{ mb: 1 }}>
              {video.caption}
            </Typography>

            {video.hashTag && video.hashTag.length > 0 && (
              <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {video.hashTag.map((tag, index) => (
                  <Chip key={index} label={tag} size='small' color='primary' variant='outlined' />
                ))}
              </Box>
            )}

            <Stack direction='row' spacing={3} sx={{ mt: 2 }}>
              <Stack direction='row' spacing={1} alignItems='center'>
                <FavoriteIcon color='error' />
                <Typography variant='body2'>{video.totalLikes || 0}</Typography>
              </Stack>

              <Stack direction='row' spacing={1} alignItems='center'>
                <ChatBubbleOutlineIcon />
                <Typography variant='body2'>{video.totalComments || 0}</Typography>
              </Stack>

              <Typography variant='body2' color='text.secondary' sx={{ ml: 'auto' }}>
                {video.time}
              </Typography>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default VideoCard
