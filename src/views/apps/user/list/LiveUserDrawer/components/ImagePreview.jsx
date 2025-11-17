// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const ImagePreview = ({ url }) => {
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
          Failed to load image preview. Please check the URL and try again.
        </Typography>
      </Box>
    )
  }

  return (
    <Box mt={2} display='flex' flexDirection='column' alignItems='center'>
      <Typography variant='caption' mb={1}>
        Preview:
      </Typography>
      <img
        key={`img-${url}`}
        src={url}
        alt='Thumbnail preview'
        style={{ maxWidth: '100%', maxHeight: '200px' }}
        onError={() => setPreviewError(true)}
      />
    </Box>
  )
}

export default ImagePreview
