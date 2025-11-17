'use client'

import React, { forwardRef, useEffect, useRef, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Box,
  Autocomplete,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import Avatar from '@mui/material/Avatar'
import { createFilterOptions } from '@mui/material/Autocomplete'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import {
  fetchUserList,
  createVideo,
  updateVideo,
  setLoading,
  fetchAllUsersForMention
} from '@/redux-store/slices/videos'
import { fetchHashtags } from '@/redux-store/slices/hashtags'
import { getFullImageUrl } from '@/util/commonfunctions'

const filterOptions = createFilterOptions({
  stringify: option => `${option.name || ''} ${option.userName || ''} ${option.email || ''} ${option.uniqueId || ''}`
})

const mentionedUserFilterOptions = createFilterOptions({
  stringify: option => `${option.name || ''} ${option.userName || ''} ${option.email || ''} ${option.uniqueId || ''}`
})

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const VideoDialog = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const {
    users: selectUserOptions,
    loading: isSelectUserLoading,
    allUsersForMentionList,
    mentionUsersLoading,
    selectedVideoType
  } = useSelector(state => state.videos)

  const { hashtags } = useSelector(state => state.hashtagsReducer)

  const isEditMode = Boolean(editData)

  const [selectUserSearchInput, setSelectUserSearchInput] = useState('')
  const selectUserSearchTimerRef = useRef(null)
  const [selectedUserObject, setSelectedUserObject] = useState(null)

  const [mentionedUserInputValue, setMentionedUserInputValue] = useState('')
  const [selectedMentionedUsers, setSelectedMentionedUsers] = useState([])

  const [formData, setFormData] = useState({
    userId: null,
    mentionedUserIds: [],
    hashTagId: [],
    caption: '',
    videoTime: ''
  })

  const [uploaderDetails, setUploaderDetails] = useState(null)
  const [video, setVideo] = useState(null)
  const [videoThumbnail, setVideoThumbnail] = useState(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('')
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState('')
  const [errors, setErrors] = useState({})
  const [isAutoThumbnailGenerated, setIsAutoThumbnailGenerated] = useState(false)
  const videoRef = useRef(null)

  const handleSelectUserSearch = searchText => {
    if (selectUserSearchTimerRef.current) {
      clearTimeout(selectUserSearchTimerRef.current)
    }

    selectUserSearchTimerRef.current = setTimeout(() => {
      const userType = selectedVideoType === 'fakeVideo' ? 'fake' : 'real'
      const searchParam = searchText && searchText.length >= 1 ? searchText : 'All'

      dispatch(fetchUserList({ type: userType, search: searchParam }))
    }, 500)
  }

  const getFilteredMentionedUsers = () => {
    if (!mentionedUserInputValue) return allUsersForMentionList || []

    return (allUsersForMentionList || []).filter(
      user =>
        user.name.toLowerCase().includes(mentionedUserInputValue.toLowerCase()) ||
        (user.userName && user.userName.toLowerCase().includes(mentionedUserInputValue.toLowerCase()))
    )
  }

  useEffect(() => {
    if (open) {
      const userType = selectedVideoType === 'fakeVideo' ? 'fake' : 'real'

      if (userType === 'fake') {
        dispatch(fetchUserList({ type: userType, search: 'All' }))
      }

      dispatch(fetchAllUsersForMention({ type: userType }))
      dispatch(fetchHashtags())
    }

    return () => {
      if (selectUserSearchTimerRef.current) {
        clearTimeout(selectUserSearchTimerRef.current)
      }
    }
  }, [dispatch, open, selectedVideoType])

  useEffect(() => {
    if (isEditMode && editData && open) {
      let mentionedUserIdsFromEdit = []

      if (editData.mentionedUsers && Array.isArray(editData.mentionedUsers)) {
        mentionedUserIdsFromEdit = editData.mentionedUsers.map(user => (typeof user === 'object' ? user._id : user))
      } else if (editData.mentionedUserIds && Array.isArray(editData.mentionedUserIds)) {
        mentionedUserIdsFromEdit = editData.mentionedUserIds
      }

      let hashTagIdsFromEdit = []

      if (editData.hashTags && Array.isArray(editData.hashTags)) {
        hashTagIdsFromEdit = editData.hashTags.map(tag => (typeof tag === 'object' ? tag._id : tag))
      } else if (editData.hashTagId && Array.isArray(editData.hashTagId)) {
        hashTagIdsFromEdit = editData.hashTagId
      }

      const userIdFromEdit =
        editData.userId && typeof editData.userId === 'object' ? editData.userId._id : editData.userId

      setFormData(prev => ({
        ...prev,
        caption: editData.caption || '',
        userId: userIdFromEdit || null,
        hashTagId: hashTagIdsFromEdit,
        mentionedUserIds: mentionedUserIdsFromEdit,
        videoTime: editData.videoTime || ''
      }))

      if (userIdFromEdit) {
        const uploader = selectUserOptions?.find(u => u._id === userIdFromEdit) || {
          _id: userIdFromEdit,
          name: editData.name || (editData.userId && editData.userId.name) || 'User',
          image: editData.userImage || (editData.userId && editData.userId.image)
        }

        setSelectedUserObject(uploader)
        setSelectUserSearchInput(uploader.name)
        setUploaderDetails(uploader)
      } else {
        setSelectedUserObject(null)
        setSelectUserSearchInput('')
        setUploaderDetails(null)
      }

      if (editData.videoUrl) setVideoPreviewUrl(getFullImageUrl(editData.videoUrl))
      if (editData.videoImage) setThumbnailPreviewUrl(getFullImageUrl(editData.videoImage))
    } else if (!isEditMode && open) {
      resetForm()
      setUploaderDetails(null)
    }
  }, [isEditMode, editData, open, dispatch, selectedVideoType, selectUserOptions])

  useEffect(() => {
    if (formData.mentionedUserIds.length > 0 && allUsersForMentionList && allUsersForMentionList.length > 0) {
      const mentionedUserObjects = formData.mentionedUserIds
        .map(id => allUsersForMentionList.find(user => user._id === id))
        .filter(Boolean)

      if (JSON.stringify(mentionedUserObjects) !== JSON.stringify(selectedMentionedUsers)) {
        setSelectedMentionedUsers(mentionedUserObjects)
      }
    } else if (formData.mentionedUserIds.length === 0 && selectedMentionedUsers.length > 0) {
      setSelectedMentionedUsers([])
    }
  }, [formData.mentionedUserIds, allUsersForMentionList, selectedMentionedUsers])

  const handleClose = () => {
    if (!isEditMode) {
      resetForm()
    }

    onClose()
    setUploaderDetails(null)
  }

  useEffect(() => {
    if (!open) {
      resetForm()
      setUploaderDetails(null)
    }
  }, [open])

  const resetForm = () => {
    setFormData({
      userId: null,
      mentionedUserIds: [],
      hashTagId: [],
      caption: '',
      videoTime: ''
    })
    setVideo(null)
    setVideoThumbnail(null)
    setVideoPreviewUrl('')
    setThumbnailPreviewUrl('')
    setErrors({})
    setIsAutoThumbnailGenerated(false)

    setSelectUserSearchInput('')
    setSelectedUserObject(null)
    setMentionedUserInputValue('')
    setSelectedMentionedUsers([])
  }

  const generateThumbnail = videoFile => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const timeToCapture = Math.min(1, video.duration / 2)

      video.currentTime = timeToCapture
    }

    video.onseeked = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob => {
          if (blob) {
            const thumbnailFile = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' })

            setVideoThumbnail(thumbnailFile)
            setThumbnailPreviewUrl(URL.createObjectURL(thumbnailFile))
            setIsAutoThumbnailGenerated(true)
          } else {
            console.error('Failed to create thumbnail blob')
            setIsAutoThumbnailGenerated(false)
          }
        },
        'image/jpeg',
        0.95
      )
    }

    video.onerror = () => {
      console.error('Error loading video for thumbnail generation')
      setIsAutoThumbnailGenerated(false)
    }

    video.src = URL.createObjectURL(videoFile)
  }

  const handleVideoChange = e => {
    const file = e.target.files[0]

    if (file) {
      setVideo(file)
      setVideoPreviewUrl(URL.createObjectURL(file))
      generateThumbnail(file)

      const video = document.createElement('video')

      video.onloadedmetadata = () => {
        const durationInSeconds = Math.round(video.duration)

        setFormData(prev => ({
          ...prev,
          videoTime: durationInSeconds.toString()
        }))
      }

      video.src = URL.createObjectURL(file)
    }
  }

  const handleThumbnailChange = e => {
    const file = e.target.files[0]

    if (file) {
      setVideoThumbnail(file)
      setThumbnailPreviewUrl(URL.createObjectURL(file))
      setIsAutoThumbnailGenerated(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.userId) newErrors.userId = 'Please select a user'
    if (!formData.caption.trim()) newErrors.caption = 'Caption is required'
    if (!video && !videoPreviewUrl) newErrors.video = 'Please upload a video'
    if (!videoThumbnail && !thumbnailPreviewUrl) newErrors.thumbnail = 'Thumbnail is required'
    if (!formData.videoTime) newErrors.video = 'Video duration could not be determined'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const finalFormData = new FormData()

    finalFormData.append('userId', formData.userId)
    finalFormData.append('caption', formData.caption)
    finalFormData.append('videoTime', formData.videoTime)

    if (formData.hashTagId && formData.hashTagId.length > 0) {
      finalFormData.append('hashTagId', formData.hashTagId.join(','))
    }

    // if (formData.mentionedUserIds && formData.mentionedUserIds.length > 0) {
    //   formData.mentionedUserIds.forEach(id => {
    //     finalFormData.append('mentionedUserIds', id)
    //   })
    // }

    if (formData.mentionedUserIds && formData.mentionedUserIds.length > 0) {
      finalFormData.append('mentionedUserIds', formData.mentionedUserIds.join(','))
    }

    if (video) finalFormData.append('videoUrl', video)
    if (videoThumbnail) finalFormData.append('videoImage', videoThumbnail)

    try {
      dispatch(setLoading(true))

      if (isEditMode) {
        await dispatch(
          updateVideo({
            formData: finalFormData,
            userId: formData.userId,
            videoId: editData._id
          })
        ).unwrap()
      } else {
        await dispatch(
          createVideo({
            formData: finalFormData,
            userId: formData.userId
          })
        ).unwrap()
      }

      handleClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors(prev => ({ ...prev, submit: error.message || 'Failed to submit video' }))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={Transition}
      aria-labelledby='video-dialog'
      fullWidth
      maxWidth='md'
      PaperProps={{
        sx: {
          overflow: 'visible',
          maxWidth: '800px'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='div'>
          {isEditMode ? 'Edit Video' : 'Upload New Video'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4 py-4'>
        {isEditMode && uploaderDetails && (
          <Box display='flex' alignItems='center' p={2} sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Avatar
              src={getFullImageUrl(uploaderDetails.image)}
              alt={uploaderDetails.name}
              sx={{ width: 40, height: 40, mr: 2 }}
            />
            <Typography variant='body1' fontWeight='medium'>
              {uploaderDetails.name}
            </Typography>
          </Box>
        )}

        {!isEditMode && (
          <Grid item xs={12}>
            <Autocomplete
              options={selectUserOptions || []}
              getOptionLabel={option => option.name || ''}
              filterOptions={filterOptions}
              value={selectedUserObject}
              onChange={(event, newValue) => {
                setSelectedUserObject(newValue)
                setFormData(prev => ({ ...prev, userId: newValue ? newValue._id : null }))
                setSelectUserSearchInput(newValue ? newValue.name : '')

                if (!newValue) {
                  handleSelectUserSearch('')
                }
              }}
              inputValue={selectUserSearchInput}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  setSelectUserSearchInput(newInputValue)
                  handleSelectUserSearch(newInputValue)
                } else if (reason === 'clear') {
                  setSelectUserSearchInput('')
                  handleSelectUserSearch('')
                  setSelectedUserObject(null)
                  setFormData(prev => ({ ...prev, userId: null }))
                }
              }}
              loading={isSelectUserLoading}
              isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Select User'
                  variant='outlined'
                  error={!!errors.userId}
                  helperText={errors.userId}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: selectedUserObject ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                        <Avatar
                          src={getFullImageUrl(selectedUserObject.image)}
                          alt={selectedUserObject.name}
                          sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        {params.InputProps.startAdornment}
                      </Box>
                    ) : null,
                    endAdornment: (
                      <>
                        {isSelectUserLoading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component='li' {...props} key={option._id}>
                  <Avatar src={getFullImageUrl(option.image)} alt={option.name} sx={{ width: 30, height: 30, mr: 2 }} />
                  <div>
                    <Typography className='font-medium'>{option.name}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {option.userName.startsWith('@') ? option.userName : `@${option.userName}`} • ID:{' '}
                      {option.uniqueId}
                    </Typography>
                  </div>
                </Box>
              )}
            />
          </Grid>
        )}

        {/* Mentioned Users (Multiple Selection - Client Side Search) */}
        <Autocomplete
          multiple
          filterOptions={mentionedUserFilterOptions}
          options={getFilteredMentionedUsers()}
          getOptionLabel={option => option.name || ''}
          value={selectedMentionedUsers}
          onChange={(event, newValue) => {
            setSelectedMentionedUsers(newValue)
            setFormData(prev => ({ ...prev, mentionedUserIds: newValue.map(user => user._id) }))
          }}
          inputValue={mentionedUserInputValue}
          onInputChange={(_, newInputValue, reason) => {
            setMentionedUserInputValue(newInputValue)
          }}
          isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
          loading={mentionUsersLoading}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index })
              const { key, ...otherProps } = tagProps

              return (
                <Chip
                  key={option._id}
                  label={option.name}
                  avatar={<Avatar src={getFullImageUrl(option.image)} />}
                  {...otherProps}
                />
              )
            })
          }
          renderOption={(props, option) => (
            <li {...props} key={option._id}>
              <Box display='flex' alignItems='center'>
                <Avatar src={getFullImageUrl(option.image)} alt={option.name} sx={{ width: 24, height: 24, mr: 1 }} />
                <div>
                  <Typography className='font-medium'>{option.name}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {option.userName.startsWith('@') ? option.userName : `@${option.userName}`} • ID: {option.uniqueId}
                  </Typography>
                </div>
              </Box>
            </li>
          )}
          renderInput={params => (
            <TextField
              {...params}
              label='Mentioned Users'
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {mentionUsersLoading && <CircularProgress size={20} color='inherit' />}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
          freeSolo={false}
        />

        {/* Hashtags (Multiple Selection) */}
        <Autocomplete
          multiple
          options={hashtags}
          getOptionLabel={option => option.hashTag || ''}
          value={hashtags.filter(tag => formData.hashTagId.includes(tag._id)) || []}
          onChange={(_, newValue) => {
            const newHashTagIds = newValue.map(tag => tag._id)

            handleChange('hashTagId', newHashTagIds)
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const tagProps = getTagProps({ index })
              const { key, ...otherProps } = tagProps

              return <Chip key={option._id} label={option.hashTag} {...otherProps} />
            })
          }
          renderInput={params => <TextField {...params} label='Hashtags' fullWidth />}
          isOptionEqualToValue={(option, value) => option._id === value._id}
        />

        {/* Caption */}
        <TextField
          label='Caption'
          multiline
          rows={3}
          fullWidth
          value={formData.caption}
          onChange={e => handleChange('caption', e.target.value)}
          error={!!errors.caption}
          helperText={errors.caption}
        />

        {/* Media Upload Section */}
        <Box className='mb-4'>
          <Grid container spacing={2}>
            {/* Video Upload */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle1' className='mb-2'>
                Video Upload
              </Typography>
              <StyledFileInput accept='video/*' label='Upload Video' onChange={handleVideoChange} />
              {(video || videoPreviewUrl) && (
                <Box
                  className='mt-2 border rounded p-2'
                  sx={{
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <video
                    ref={videoRef}
                    src={videoPreviewUrl}
                    controls
                    style={{ maxWidth: '100%', maxHeight: '200px' }}
                  />
                </Box>
              )}
              {errors.video && (
                <Typography color='error' variant='caption'>
                  {errors.video}
                </Typography>
              )}
            </Grid>

            {/* Thumbnail Section */}
            <Grid item xs={12} md={6}>
              <Typography variant='subtitle1' className='mb-2'>
                Video Thumbnail
                {isAutoThumbnailGenerated && (
                  <Chip label='Auto-generated' color='success' size='small' sx={{ ml: 1 }} />
                )}
              </Typography>
              <StyledFileInput accept='image/*' label='Upload Manual Thumbnail' onChange={handleThumbnailChange} />
              {thumbnailPreviewUrl && (
                <Box
                  className='mt-2 border rounded p-2'
                  sx={{
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  <img
                    src={thumbnailPreviewUrl}
                    alt='Video Thumbnail'
                    style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  />
                </Box>
              )}
              {errors.thumbnail && (
                <Typography color='error' variant='caption'>
                  {errors.thumbnail}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>

        {errors.submit && (
          <Typography color='error' variant='body2'>
            {errors.submit}
          </Typography>
        )}
      </DialogContent>

      <DialogActions className='p-4'>
        <Button
          onClick={handleClose}
          variant='tonal'
          color='secondary'
          disabled={isSelectUserLoading || mentionUsersLoading}
        >
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={
            isSelectUserLoading ||
            mentionUsersLoading ||
            (!isEditMode && !formData.userId) ||
            (!video && !videoPreviewUrl)
          }
        >
          {isSelectUserLoading || mentionUsersLoading ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : isEditMode ? (
            'Update'
          ) : (
            'Upload'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default VideoDialog
