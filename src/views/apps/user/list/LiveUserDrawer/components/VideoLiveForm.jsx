// React Imports
import { useState } from 'react'

// MUI Imports
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import { Controller } from 'react-hook-form'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import FileUploadBox from './FileUploadBox'
import VideoPreview from './VideoPreview'
import ImagePreview from './ImagePreview'

// Constants
const SOURCE_TYPES = {
  LINK: 1,
  FILE: 2
}

const VideoLiveForm = ({
  control,
  watch,
  errors,
  thumbnailType,
  setThumbnailType,
  streamSourceType,
  setStreamSourceType,
  thumbnailPreview,
  streamSourcePreview,
  handleFileChange,
  handleFileRemove
}) => {
  // Watch values for URL previews
  const thumbnailLink = watch('thumbnailLink')
  const streamSourceLink = watch('streamSourceLink')

  return (
    <>
      {/* Thumbnail Selection Type */}
      <CustomTextField
        select
        fullWidth
        label='Thumbnail Source'
        value={thumbnailType}
        onChange={e => setThumbnailType(e.target.value)}
      >
        <MenuItem value={SOURCE_TYPES.FILE}>File Upload</MenuItem>
        <MenuItem value={SOURCE_TYPES.LINK}>URL Link</MenuItem>
      </CustomTextField>

      {/* Thumbnail Field (File or Link) */}
      {thumbnailType === SOURCE_TYPES.FILE ? (
        <FileUploadBox
          title='Thumbnail Image'
          preview={thumbnailPreview}
          onUpload={e => handleFileChange(e, 'thumbnail')}
          onRemove={() => handleFileRemove('thumbnail')}
          id='thumbnail-upload'
        />
      ) : (
        <>
          <Controller
            name='thumbnailLink'
            control={control}
            rules={{ required: 'Thumbnail URL is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Thumbnail URL'
                placeholder='https://example.com/image.jpg'
                error={Boolean(errors.thumbnailLink)}
                helperText={errors.thumbnailLink?.message}
              />
            )}
          />
          <ImagePreview url={thumbnailLink || thumbnailPreview} />
        </>
      )}

      {/* Stream Source Selection Type */}
      <CustomTextField
        select
        fullWidth
        label='Stream Source'
        value={streamSourceType}
        onChange={e => setStreamSourceType(e.target.value)}
      >
        <MenuItem value={SOURCE_TYPES.FILE}>File Upload</MenuItem>
        <MenuItem value={SOURCE_TYPES.LINK}>URL Link</MenuItem>
      </CustomTextField>

      {/* Stream Source Field (File or Link) */}
      {streamSourceType === SOURCE_TYPES.FILE ? (
        <FileUploadBox
          title='Video File'
          preview={streamSourcePreview}
          onUpload={e => handleFileChange(e, 'streamSource')}
          onRemove={() => handleFileRemove('streamSource')}
          fileType='video/*'
          isVideo
          id='video-upload'
        />
      ) : (
        <>
          <Controller
            name='streamSourceLink'
            control={control}
            rules={{ required: 'Video URL is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Video URL'
                placeholder='https://example.com/video.mp4'
                error={Boolean(errors.streamSourceLink)}
                helperText={errors.streamSourceLink?.message}
              />
            )}
          />
          <VideoPreview url={streamSourceLink || streamSourcePreview} />
        </>
      )}
    </>
  )
}

export default VideoLiveForm
