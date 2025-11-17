// React Imports
import { useState } from 'react'

// MUI Imports
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'

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

const PKBattleForm = ({
  control,
  watch,
  errors,
  thumbnailType,
  setThumbnailType,
  streamSourceType,
  setStreamSourceType,
  thumbnailPreview,
  secondThumbnailPreview,
  streamSourcePreview,
  secondStreamSourcePreview,
  handleFileChange,
  handleFileRemove
}) => {
  // Watch values for URL previews
  const thumbnailLink1 = watch('thumbnailLink1')
  const thumbnailLink2 = watch('thumbnailLink2')
  const streamSourceLink1 = watch('streamSourceLink1')
  const streamSourceLink2 = watch('streamSourceLink2')

  return (
    <>
      {/* Thumbnail Selection Type */}
      <CustomTextField
        select
        fullWidth
        label='Thumbnails Source'
        value={thumbnailType}
        onChange={e => setThumbnailType(e.target.value)}
      >
        <MenuItem value={SOURCE_TYPES.FILE}>File Upload</MenuItem>
        <MenuItem value={SOURCE_TYPES.LINK}>URL Link</MenuItem>
      </CustomTextField>

      {/* Thumbnails Fields (File or Link) */}
      {thumbnailType === SOURCE_TYPES.FILE ? (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <FileUploadBox
              title='First Thumbnail Image'
              preview={thumbnailPreview}
              onUpload={e => handleFileChange(e, 'pkThumbnails', 0)}
              onRemove={() => handleFileRemove('pkThumbnails', 0)}
              id='pk-thumbnail-1-upload'
            />
          </Grid>

          <Grid xs={12} md={6}>
            <FileUploadBox
              title='Second Thumbnail Image'
              preview={secondThumbnailPreview}
              onUpload={e => handleFileChange(e, 'pkThumbnails', 1)}
              onRemove={() => handleFileRemove('pkThumbnails', 1)}
              id='pk-thumbnail-2-upload'
            />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Controller
              name='thumbnailLink1'
              control={control}
              rules={{ required: 'First thumbnail URL is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='First Thumbnail URL'
                  placeholder='https://example.com/image1.jpg'
                  error={Boolean(errors.thumbnailLink1)}
                  helperText={errors.thumbnailLink1?.message}
                />
              )}
            />
            <ImagePreview url={thumbnailLink1 || thumbnailPreview} />
          </Grid>

          <Grid xs={12} md={6}>
            <Controller
              name='thumbnailLink2'
              control={control}
              rules={{ required: 'Second thumbnail URL is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Second Thumbnail URL'
                  placeholder='https://example.com/image2.jpg'
                  error={Boolean(errors.thumbnailLink2)}
                  helperText={errors.thumbnailLink2?.message}
                />
              )}
            />
            <ImagePreview url={thumbnailLink2 || secondThumbnailPreview} />
          </Grid>
        </Grid>
      )}

      {/* Stream Source Selection Type */}
      <CustomTextField
        select
        fullWidth
        label='Stream Sources'
        value={streamSourceType}
        onChange={e => setStreamSourceType(e.target.value)}
      >
        <MenuItem value={SOURCE_TYPES.FILE}>File Upload</MenuItem>
        <MenuItem value={SOURCE_TYPES.LINK}>URL Link</MenuItem>
      </CustomTextField>

      {/* Stream Sources Fields (File or Link) */}
      {streamSourceType === SOURCE_TYPES.FILE ? (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <FileUploadBox
              title='First Video File'
              preview={streamSourcePreview}
              onUpload={e => handleFileChange(e, 'pkStreamSources', 0)}
              onRemove={() => handleFileRemove('pkStreamSources', 0)}
              fileType='video/*'
              isVideo
              id='pk-video-1-upload'
            />
          </Grid>

          <Grid xs={12} md={6}>
            <FileUploadBox
              title='Second Video File'
              preview={secondStreamSourcePreview}
              onUpload={e => handleFileChange(e, 'pkStreamSources', 1)}
              onRemove={() => handleFileRemove('pkStreamSources', 1)}
              fileType='video/*'
              isVideo
              id='pk-video-2-upload'
            />
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Controller
              name='streamSourceLink1'
              control={control}
              rules={{ required: 'First video URL is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='First Video URL'
                  placeholder='https://example.com/video1.mp4'
                  error={Boolean(errors.streamSourceLink1)}
                  helperText={errors.streamSourceLink1?.message}
                />
              )}
            />
            <VideoPreview url={streamSourceLink1 || streamSourcePreview} />
          </Grid>

          <Grid xs={12} md={6}>
            <Controller
              name='streamSourceLink2'
              control={control}
              rules={{ required: 'Second video URL is required' }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Second Video URL'
                  placeholder='https://example.com/video2.mp4'
                  error={Boolean(errors.streamSourceLink2)}
                  helperText={errors.streamSourceLink2?.message}
                />
              )}
            />
            <VideoPreview url={streamSourceLink2 || secondStreamSourcePreview} />
          </Grid>
        </Grid>
      )}
    </>
  )
}

export default PKBattleForm
