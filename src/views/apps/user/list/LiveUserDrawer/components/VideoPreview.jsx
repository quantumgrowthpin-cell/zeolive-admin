// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const VideoPreview = ({ url, isAudio = false }) => {
  const [previewError, setPreviewError] = useState(false)

  // Reset error state when URL changes
  useEffect(() => {
    if (url) {
      setPreviewError(false)
    }
  }, [url])

  if (!url) return null

  if (previewError) {
    return (
      <Box mt={2} display='flex' flexDirection='column' alignItems='center'>
        <Typography variant='caption' color='error'>
          Failed to load preview. Please check the URL and try again.
        </Typography>
      </Box>
    )
  }

  return (
    <Box mt={2} display='flex' flexDirection='column' alignItems='center'>
      <Typography variant='caption' mb={1}>
        Preview:
      </Typography>
      {/* {isAudio ? (
        <audio
          key={`audio-${url}-${Date.now()}`}
          controls
          style={{ width: '100%' }}
          playsInline
          onError={() => setPreviewError(true)}
        >
          <source src={url} />
          Your browser does not support the audio element.
        </audio>
      ) : ( */}
      <Box sx={{ width: '100%', maxHeight: '200px' }}>
        <video
          key={`video-${url}-${Date.now()}`}
          controls
          style={{ maxWidth: '100%', maxHeight: '200px' }}
          playsInline
          muted
          onError={() => setPreviewError(true)}
        >
          <source src={url} />
          Your browser does not support the video element.
        </video>
      </Box>
      {/* )} */}
    </Box>
  )
}

export default VideoPreview
