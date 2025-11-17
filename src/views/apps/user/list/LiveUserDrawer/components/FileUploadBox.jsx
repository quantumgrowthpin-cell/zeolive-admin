// React Imports
import { useState, useEffect, useRef } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

const FileUploadBox = ({ title, preview, onUpload, fileType = 'image/*', isVideo = false, id, onRemove }) => {
  const [previewError, setPreviewError] = useState(false)
  const [key, setKey] = useState(Date.now()) // Add key for forcing re-render
  const inputRef = useRef(null)
  const theme = useTheme()

  // Reset error state and update key when preview changes
  useEffect(() => {
    if (preview) {
      setPreviewError(false)
      setKey(Date.now()) // Force re-render of preview when it changes
    }
  }, [preview])

  // Handle file removal
  const handleRemove = e => {
    e.stopPropagation() // Prevent triggering the parent box click

    // Reset the file input so the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = ''
    }

    if (onRemove) {
      onRemove()
    }
  }

  return (
    <Box>
      <Typography variant='body1' gutterBottom>
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: `1px dashed ${theme.palette.divider}`,
          borderRadius: 1,
          p: 3,
          mb: 2,
          cursor: 'pointer',
          minHeight: '150px',
          justifyContent: 'center',
          position: 'relative' // Added for absolute positioning of remove button
        }}
        onClick={() => document.getElementById(id).click()}
      >
        {preview && !previewError ? (
          <>
            {/* Add remove button */}
            {onRemove && (
              <Tooltip title='Remove'>
                <IconButton
                  size='small'
                  onClick={handleRemove}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.5)'
                    }
                  }}
                >
                  <i className='tabler-x' />
                </IconButton>
              </Tooltip>
            )}
            {isVideo ? (
              <Box sx={{ width: '100%', maxHeight: '150px', mb: 1 }}>
                <video
                  key={`video-preview-${id}-${key}`}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '150px' }}
                  playsInline
                  muted
                  onError={() => setPreviewError(true)}
                >
                  <source src={preview} />
                  Your browser does not support the video tag.
                </video>
              </Box>
            ) : (
              <img
                key={`img-${id}-${key}`}
                src={preview}
                alt={title}
                style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '1rem' }}
                onError={() => setPreviewError(true)}
              />
            )}
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <i className='tabler-upload text-3xl mb-2' />
            <Typography>Click to upload {isVideo ? 'video' : 'image'}</Typography>

            <Typography variant='caption' color='textSecondary'>
              {isVideo ? 'MP4, WebM, or AVI' : 'JPG, PNG or GIF'}, max 5MB
            </Typography>
            {previewError && (
              <Typography variant='caption' color='error' sx={{ mt: 1 }}>
                Failed to load preview. Please try again.
              </Typography>
            )}
          </Box>
        )}
        <input id={id} type='file' accept={fileType} onChange={onUpload} style={{ display: 'none' }} ref={inputRef} />
      </Box>
    </Box>
  )
}

export default FileUploadBox
