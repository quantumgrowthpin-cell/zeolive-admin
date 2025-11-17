'use client'

import { useState, useEffect, forwardRef, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import Grid from '@mui/material/Grid'
import Slide from '@mui/material/Slide'
import Avatar from '@mui/material/Avatar'
import ListItemText from '@mui/material/ListItemText'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItem from '@mui/material/ListItem'
import Divider from '@mui/material/Divider'

// Icons
import CloseIcon from '@mui/icons-material/Close'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import DeleteIcon from '@mui/icons-material/Delete'

// Component Imports
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

// Actions
import { fetchUserList, createFakePost, updatePost, fetchAllUsersForMention } from '@/redux-store/slices/posts'
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

const PostDialog = ({ open, onClose, editData }) => {
  const dispatch = useDispatch()

  const {
    users: selectUserOptions,
    loading: isSelectUserLoading,
    allUsersForMentionList,
    mentionUsersLoading,
    selectedPostType
  } = useSelector(state => state.posts)

  const { hashtags } = useSelector(state => state.hashtagsReducer)

  const isEditMode = Boolean(editData)

  // State for "Select User" Autocomplete (server-side search)
  const [selectUserSearchInput, setSelectUserSearchInput] = useState('')
  const selectUserSearchTimerRef = useRef(null)
  const [selectedUserObject, setSelectedUserObject] = useState(null)

  // States for "Mentioned Users" Autocomplete (client-side search)
  const [mentionedUserInputValue, setMentionedUserInputValue] = useState('')
  const [selectedMentionedUsers, setSelectedMentionedUsers] = useState([])

  const [formData, setFormData] = useState({
    caption: '',
    userId: '',
    hashTags: [],
    images: [],
    mentionedUserIds: []
  })

  const [uploaderDetails, setUploaderDetails] = useState(null)
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)

  const resetForm = () => {
    if (imagePreviewUrls.length > 0) {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))
    }

    setFormData({
      caption: '',
      userId: '',
      hashTags: [],
      images: [],
      mentionedUserIds: []
    })
    setSelectedMentionedUsers([])
    setImageFiles([])
    setImagePreviewUrls([])
    setUploadProgress(0)
    setSelectUserSearchInput('')
    setSelectedUserObject(null)
    setMentionedUserInputValue('')
  }

  const handleClose = () => {
    if (!isEditMode) {
      resetForm()
    }

    onClose()
  }

  // Server-side search for "Select User" Autocomplete
  const handleSelectUserSearch = searchText => {
    if (selectUserSearchTimerRef.current) {
      clearTimeout(selectUserSearchTimerRef.current)
    }

    selectUserSearchTimerRef.current = setTimeout(() => {
      const userType = selectedPostType === 'fakePost' ? 'fake' : 'real'
      const searchParam = searchText && searchText.length >= 1 ? searchText : 'All'

      dispatch(fetchUserList({ type: userType, search: searchParam }))
    }, 500)
  }

  // Client-side filtering for "Mentioned Users" Autocomplete
  const getFilteredMentionedUsers = () => {
    if (!mentionedUserInputValue) return allUsersForMentionList || []

    return (allUsersForMentionList || []).filter(
      user =>
        user.name.toLowerCase().includes(mentionedUserInputValue.toLowerCase()) ||
        (user.userName && user.userName.toLowerCase().includes(mentionedUserInputValue.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(mentionedUserInputValue.toLowerCase())) ||
        (user.uniqueId && user.uniqueId.toLowerCase().includes(mentionedUserInputValue.toLowerCase()))
    )
  }

  // Initial data load
  useEffect(() => {
    if (open) {
      const userType = selectedPostType === 'fakePost' ? 'fake' : 'real'

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
  }, [dispatch, open, selectedPostType])

  // Effect to set up form data when in edit mode
  useEffect(() => {
    if (isEditMode && editData && open) {
      let mentionedUserIdsFromEdit = []

      if (editData.mentionedUsers && Array.isArray(editData.mentionedUsers)) {
        mentionedUserIdsFromEdit = editData.mentionedUsers.map(user => (typeof user === 'object' ? user._id : user))
      } else if (editData.mentionedUserIds && Array.isArray(editData.mentionedUserIds)) {
        mentionedUserIdsFromEdit = editData.mentionedUserIds
      }

      setFormData(prev => ({
        ...prev,
        caption: editData.caption || '',
        userId: editData.userId || '',
        hashTags: editData.hashTags || [],
        mentionedUserIds: mentionedUserIdsFromEdit
      }))

      if (editData.userId) {
        const uploader = {
          _id: editData.userId,
          name: editData.name || 'User',
          image: editData.userImage
        }

        setSelectedUserObject(uploader)
        setSelectUserSearchInput(editData.name || 'User')
        setUploaderDetails(uploader)
      }

      if (editData.postImage && editData.postImage.length > 0) {
        const previews = editData.postImage.map(img => getFullImageUrl(img.url))

        setImagePreviewUrls(previews)
      } else {
        setImagePreviewUrls([])
      }
    } else if (!isEditMode && open) {
      resetForm()
      setUploaderDetails(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, editData, open, dispatch, selectedPostType])

  // Effect to set selectedMentionedUsers from formData.mentionedUserIds (e.g., in edit mode)
  useEffect(() => {
    if (
      formData.mentionedUserIds.length > 0 &&
      selectedMentionedUsers.length === 0 &&
      allUsersForMentionList &&
      allUsersForMentionList.length > 0
    ) {
      const mentionedUserObjects = formData.mentionedUserIds
        .map(id => (allUsersForMentionList || []).find(user => user._id === id))
        .filter(Boolean)

      setSelectedMentionedUsers(mentionedUserObjects)
    }
  }, [formData.mentionedUserIds, selectedMentionedUsers.length, allUsersForMentionList])

  const handleGenericInputChange = e => {
    const { name, value } = e.target

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleHashtagChange = (_, newValue) => {
    setFormData(prev => ({ ...prev, hashTags: newValue }))
  }

  const handleImageChange = e => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      const newImagePreviewUrls = filesArray.map(file => URL.createObjectURL(file))

      setImageFiles(prev => [...prev, ...filesArray])
      setImagePreviewUrls(prev => [...prev, ...newImagePreviewUrls])
    }
  }

  const removeImage = index => {
    const newImageFiles = [...imageFiles]
    const newImagePreviewUrls = [...imagePreviewUrls]

    URL.revokeObjectURL(newImagePreviewUrls[index])
    newImageFiles.splice(index, 1)
    newImagePreviewUrls.splice(index, 1)
    setImageFiles(newImageFiles)
    setImagePreviewUrls(newImagePreviewUrls)
  }

  const handleSubmit = async () => {
    const formDataToSend = new FormData()

    if (formData.mentionedUserIds && formData.mentionedUserIds.length > 0) {
      formDataToSend.append('mentionedUserIds', formData.mentionedUserIds.join(','))
    }

    formDataToSend.append('caption', formData.caption)

    if (formData.hashTags && formData.hashTags.length > 0) {
      const hashTagIds = formData.hashTags.map(tag => tag._id).join(',')

      formDataToSend.append('hashTagId', hashTagIds)
    }

    imageFiles.forEach(file => {
      formDataToSend.append('postImage', file)
    })

    const getUserId = userId => {
      if (userId && typeof userId === 'object' && userId._id) {
        return userId._id
      }

      return userId
    }

    if (isEditMode) {
      await dispatch(
        updatePost({
          userId: getUserId(formData.userId || editData.userId),
          postId: editData._id,
          formData: formDataToSend
        })
      )
    } else {
      await dispatch(
        createFakePost({
          userId: getUserId(formData.userId),
          formData: formDataToSend
        })
      )
    }

    handleClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md'
      fullWidth
      keepMounted
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {isEditMode ? 'Edit Post' : 'Create Post'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <CloseIcon />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4 py-4'>
        <Grid container spacing={3}>
          {isEditMode && uploaderDetails && (
            <Grid item xs={12}>
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
            </Grid>
          )}

          {!isEditMode && (
            <Grid item xs={12}>
              <Autocomplete
                filterOptions={filterOptions}
                options={selectUserOptions || []}
                getOptionLabel={option => option.name || ''}
                value={selectedUserObject}
                onChange={(event, newValue) => {
                  setSelectedUserObject(newValue)
                  setFormData(prev => ({ ...prev, userId: newValue ? newValue._id : '' }))
                  setSelectUserSearchInput(newValue ? newValue.name : '')
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
                    setFormData(prev => ({ ...prev, userId: '' }))
                  }
                }}
                loading={isSelectUserLoading}
                isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Select User'
                    variant='outlined'
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
                    <Avatar
                      src={getFullImageUrl(option.image)}
                      alt={option.name}
                      sx={{ width: 30, height: 30, mr: 2 }}
                    />
                    <div>
                      <Typography className='font-medium'>{option.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {option.userName.startsWith('@') ? option.userName : `@${option.userName}`} • ID:{' '}
                        {option.uniqueId}
                      </Typography>
                    </div>
                  </Box>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index })

                    return <Chip key={tagProps.key} label={option.name} {...tagProps} />
                  })
                }
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Autocomplete
              multiple
              filterOptions={mentionedUserFilterOptions}
              options={getFilteredMentionedUsers()}
              getOptionLabel={opt => opt.name || ''}
              value={selectedMentionedUsers}
              onChange={(event, newValue) => {
                setSelectedMentionedUsers(newValue)
                setFormData(prev => ({ ...prev, mentionedUserIds: newValue.map(user => user._id) }))
              }}
              inputValue={mentionedUserInputValue}
              onInputChange={(event, newInputValue) => {
                setMentionedUserInputValue(newInputValue)
              }}
              loading={mentionUsersLoading}
              isOptionEqualToValue={(option, value) => option && value && option._id === value._id}
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
                    <Avatar
                      src={getFullImageUrl(option.image)}
                      alt={option.name}
                      sx={{ width: 24, height: 24, mr: 1 }}
                    />
                    <div>
                      <Typography>{option.name}</Typography>
                      {option.userName && (
                        <Typography variant='caption' color='text.secondary'>
                          {option.userName.startsWith('@') ? option.userName : `@${option.userName}`}
                        </Typography>
                      )}
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
                        {mentionUsersLoading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
              freeSolo={false}
            />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={hashtags || []}
              value={formData.hashTags}
              getOptionLabel={option => option.hashTag || ''}
              onChange={handleHashtagChange}
              isOptionEqualToValue={(option, value) => option._id === value._id}
              renderInput={params => (
                <TextField {...params} label='Hashtags' placeholder='Select hashtags' variant='outlined' />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index })

                  return (
                    <Chip
                      key={option._id || key}
                      {...chipProps}
                      label={option.hashTag}
                      color='primary'
                      variant='outlined'
                      size='small'
                    />
                  )
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label='Caption'
              name='caption'
              value={formData.caption}
              onChange={handleGenericInputChange}
              multiline
              rows={3}
              variant='outlined'
            />
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Typography variant='subtitle1' gutterBottom>
                Post Images
              </Typography>
              <Button variant='outlined' component='label' startIcon={<AddPhotoAlternateIcon />} className='mb-3'>
                Add Images
                <input type='file' hidden accept='image/*' multiple onChange={handleImageChange} />
              </Button>

              <Box className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3'>
                {imagePreviewUrls.map((url, index) => (
                  <Box key={index} className='relative'>
                    <img src={url} alt={`Preview ${index}`} className='w-full h-32 object-cover rounded' />
                    <IconButton
                      size='small'
                      className='absolute top-1 right-1'
                      color='error'
                      onClick={() => removeImage(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          variant='tonal'
          color='secondary'
          disabled={isSelectUserLoading || mentionUsersLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          color='primary'
          disabled={
            isSelectUserLoading ||
            mentionUsersLoading ||
            (!isEditMode && !formData.userId) ||
            imagePreviewUrls.length === 0
          }
        >
          {isSelectUserLoading || mentionUsersLoading ? (
            <CircularProgress size={24} color='inherit' />
          ) : isEditMode ? (
            'Update Post'
          ) : (
            'Create Post'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PostDialog
