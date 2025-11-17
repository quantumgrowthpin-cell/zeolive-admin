// React Imports
import { useState, useEffect, useCallback } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { createLiveUser, updateLiveUser } from '@/redux-store/slices/user'

// Local Component Imports
import VideoLiveForm from './components/VideoLiveForm'
import AudioLiveForm from './components/AudioLiveForm'
import PKBattleForm from './components/PKBattleForm'
import { STREAM_TYPES, STREAM_TYPE_LABELS, SOURCE_TYPES } from './components/constants'
import { baseURL, key } from '@/util/config'
import { getFullImageUrl } from '@/util/commonfunctions'

// Helper function to process URLs
const processURL = url => {
  if (!url) return ''

  // If URL includes http, use as is, otherwise process with getFullImageUrl
  return url.includes('http') ? url : getFullImageUrl(url)
}

// Helper function to convert URL to File
const urlToFile = async (url, filename) => {
  if (!url) return null

  try {
    const fullUrl = processURL(url)
    const response = await fetch(fullUrl)
    const blob = await response.blob()

    return new File([blob], filename || 'image.jpg', { type: blob.type })
  } catch (error) {
    console.error('Error converting URL to File:', error)

    return null
  }
}

const LiveUserDrawer = props => {
  // Props
  const { open, handleClose, editMode = false, initialData = null } = props

  // Get current streamType from Redux
  const { streamType } = useSelector(state => state.userReducer)

  // Local state
  // Initialize activeTab with the current streamType from Redux
  const [activeTab, setActiveTab] = useState(streamType ? +streamType : STREAM_TYPES.VIDEO_LIVE)
  const [thumbnailType, setThumbnailType] = useState(SOURCE_TYPES.FILE)
  const [streamSourceType, setStreamSourceType] = useState(SOURCE_TYPES.FILE)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [key, setKey] = useState(Date.now())

  // Previews
  const [thumbnailPreview, setThumbnailPreview] = useState('')
  const [secondThumbnailPreview, setSecondThumbnailPreview] = useState('')
  const [streamSourcePreview, setStreamSourcePreview] = useState('')
  const [secondStreamSourcePreview, setSecondStreamSourcePreview] = useState('')

  // Redux
  const dispatch = useDispatch()

  // Set initial values based on edit mode
  useEffect(() => {
    if (open) {
      if (editMode && initialData) {
        // In edit mode, set tab to match the data's streamType
        setActiveTab(initialData.streamType || STREAM_TYPES.VIDEO_LIVE)

        // Set file/link type values
        setThumbnailType(initialData.thumbnailType || SOURCE_TYPES.FILE)
        setStreamSourceType(initialData.streamSourceType || SOURCE_TYPES.FILE)

        // Load previews if available
        if (initialData.thumbnail) {
          setThumbnailPreview(processURL(initialData.thumbnail))
        }

        if (initialData.pkThumbnails && Array.isArray(initialData.pkThumbnails)) {
          // Set first thumbnail preview
          if (initialData.pkThumbnails[0]) {
            setThumbnailPreview(processURL(initialData.pkThumbnails[0]))
          }

          // Set second thumbnail preview
          if (initialData.pkThumbnails[1]) {
            setSecondThumbnailPreview(processURL(initialData.pkThumbnails[1]))
          }
        }

        if (initialData.streamSource) {
          setStreamSourcePreview(processURL(initialData.streamSource))
        }

        if (initialData.pkStreamSources && Array.isArray(initialData.pkStreamSources)) {
          // Set first stream source preview
          if (initialData.pkStreamSources[0]) {
            setStreamSourcePreview(processURL(initialData.pkStreamSources[0]))
          }

          // Set second stream source preview
          if (initialData.pkStreamSources[1]) {
            setSecondStreamSourcePreview(processURL(initialData.pkStreamSources[1]))
          }
        }

        // Reset form with initial values
        resetForm(getInitialValues(initialData))
      } else {
        // For create mode, initialize with the current streamType from Redux
        const currentStreamType = streamType ? +streamType : STREAM_TYPES.VIDEO_LIVE

        setActiveTab(currentStreamType)
        resetForm(getInitialValues())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editMode, initialData, streamType])

  // Fetch users for dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      if (!open) return

      try {
        setLoadingUsers(true)

        // Use the correct API endpoint for fetching user list
        const response = await axios.get(`${baseURL}/api/admin/user/fetchUserList?type=fake`, {
          headers: getAuthHeaders()
        })

        if (response.data && response.data.status && Array.isArray(response.data.data)) {
          setUsers(response.data.data)
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [open])

  // Get auth headers (make sure this matches your app's auth method)
  const getAuthHeaders = () => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('admin_token')
      const uid = sessionStorage.getItem('uid')

      return {
        'Content-Type': 'application/json',
        key: key,
        Authorization: `Bearer ${token}`,
        'x-auth-adm': uid
      }
    }

    return {}
  }

  // Helper to get initial form values
  const getInitialValues = (data = null) => {
    const defaults = {
      userId: '',

      // Video Live / Audio Live fields
      thumbnail: null,
      thumbnailLink: '',
      streamSource: null,
      streamSourceLink: '',

      // Audio Live specific fields
      roomName: '',
      roomWelcome: '',

      // PK Battle fields
      pkThumbnails: [null, null],
      thumbnailLink1: '',
      thumbnailLink2: '',
      pkStreamSources: [null, null],
      streamSourceLink1: '',
      streamSourceLink2: ''
    }

    if (!data) return defaults

    // Map API data to form values
    return {
      // Handle both nested userId object and direct userId value
      userId: data.userId?._id || data.userId || data._id || '',
      thumbnail: null, // We don't send the existing file back
      thumbnailLink: data.thumbnailType === SOURCE_TYPES.LINK ? data.thumbnail || '' : '',
      streamSource: null,
      streamSourceLink: data.streamSourceType === SOURCE_TYPES.LINK ? data.streamSource || '' : '',
      roomName: data.roomName || '',
      roomWelcome: data.roomWelcome || '',
      pkThumbnails: [null, null],
      thumbnailLink1:
        data.thumbnailType === SOURCE_TYPES.LINK && data.pkThumbnails?.length > 0 ? data.pkThumbnails[0] || '' : '',
      thumbnailLink2:
        data.thumbnailType === SOURCE_TYPES.LINK && data.pkThumbnails?.length > 1 ? data.pkThumbnails[1] || '' : '',
      pkStreamSources: [null, null],
      streamSourceLink1:
        data.streamSourceType === SOURCE_TYPES.LINK && data.pkStreamSources?.length > 0
          ? data.pkStreamSources[0] || ''
          : '',
      streamSourceLink2:
        data.streamSourceType === SOURCE_TYPES.LINK && data.pkStreamSources?.length > 1
          ? data.pkStreamSources[1] || ''
          : ''
    }
  }

  // Form hook
  const {
    control,
    handleSubmit,
    reset: resetForm,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: getInitialValues()
  })

  // Watch form values for previews
  const watchThumbnail = watch('thumbnail')
  const watchStreamSource = watch('streamSource')
  const watchPkThumbnails = watch('pkThumbnails')
  const watchPkStreamSources = watch('pkStreamSources')

  // Handle tab change - this function won't be called since tabs are disabled,
  // but keeping it for future reference
  const handleTabChange = (event, newValue) => {
    // Tabs are disabled, so this function won't be called
    setActiveTab(newValue)
  }

  // Handle file change
  const handleFileChange = (e, fieldName, index = null) => {
    const file = e.target.files?.[0] || null

    if (!file) return

    if (index !== null) {
      // For array fields (PK Battle)
      const currentValue = watch(fieldName) || [null, null]
      const newValue = [...currentValue]

      newValue[index] = file
      setValue(fieldName, newValue)
    } else {
      // For single file fields
      setValue(fieldName, file)
    }
  }

  // Handle file removal
  const handleFileRemove = (fieldName, index = null) => {
    if (index !== null) {
      // For array fields (PK Battle)
      const currentValue = watch(fieldName) || [null, null]
      const newValue = [...currentValue]

      newValue[index] = null
      setValue(fieldName, newValue)

      // Clear preview
      if (fieldName === 'pkThumbnails') {
        if (index === 0) {
          setThumbnailPreview('')

          // Also reset URL field if in link mode
          if (thumbnailType === SOURCE_TYPES.LINK) {
            setValue('thumbnailLink1', '')
          }
        } else if (index === 1) {
          setSecondThumbnailPreview('')

          // Also reset URL field if in link mode
          if (thumbnailType === SOURCE_TYPES.LINK) {
            setValue('thumbnailLink2', '')
          }
        }
      } else if (fieldName === 'pkStreamSources') {
        if (index === 0) {
          setStreamSourcePreview('')

          // Also reset URL field if in link mode
          if (streamSourceType === SOURCE_TYPES.LINK) {
            setValue('streamSourceLink1', '')
          }
        } else if (index === 1) {
          setSecondStreamSourcePreview('')

          // Also reset URL field if in link mode
          if (streamSourceType === SOURCE_TYPES.LINK) {
            setValue('streamSourceLink2', '')
          }
        }
      }
    } else {
      // For single file fields
      setValue(fieldName, null)

      // Clear preview
      if (fieldName === 'thumbnail') {
        setThumbnailPreview('')

        // Also reset URL field if in link mode
        if (thumbnailType === SOURCE_TYPES.LINK) {
          setValue('thumbnailLink', '')
        }
      } else if (fieldName === 'streamSource') {
        setStreamSourcePreview('')

        // Also reset URL field if in link mode
        if (streamSourceType === SOURCE_TYPES.LINK) {
          setValue('streamSourceLink', '')
        }
      }
    }

    // Force a re-render to update all components
    setKey(Date.now())
  }

  // Generate previews when files change
  useEffect(() => {
    const urlsToRevoke = []

    // Single thumbnail preview
    if (watchThumbnail instanceof File) {
      const url = URL.createObjectURL(watchThumbnail)

      setThumbnailPreview(url)
      urlsToRevoke.push(url)
    }

    // Single stream source preview
    if (watchStreamSource instanceof File) {
      const url = URL.createObjectURL(watchStreamSource)

      setStreamSourcePreview(url)
      urlsToRevoke.push(url)
    }

    // PK thumbnails previews
    if (watchPkThumbnails && Array.isArray(watchPkThumbnails)) {
      if (watchPkThumbnails[0] instanceof File) {
        const url = URL.createObjectURL(watchPkThumbnails[0])

        setThumbnailPreview(url)
        urlsToRevoke.push(url)
      }

      if (watchPkThumbnails[1] instanceof File) {
        const url = URL.createObjectURL(watchPkThumbnails[1])

        setSecondThumbnailPreview(url)
        urlsToRevoke.push(url)
      }
    }

    // PK stream sources previews
    if (watchPkStreamSources && Array.isArray(watchPkStreamSources)) {
      if (watchPkStreamSources[0] instanceof File) {
        const url = URL.createObjectURL(watchPkStreamSources[0])

        setStreamSourcePreview(url)
        urlsToRevoke.push(url)
      }

      if (watchPkStreamSources[1] instanceof File) {
        const url = URL.createObjectURL(watchPkStreamSources[1])

        setSecondStreamSourcePreview(url)
        urlsToRevoke.push(url)
      }
    }

    // Return a single cleanup function that revokes all created URLs
    return () => {
      urlsToRevoke.forEach(url => URL.revokeObjectURL(url))
    }
  }, [watchThumbnail, watchStreamSource, watchPkThumbnails, watchPkStreamSources])

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      resetForm(getInitialValues())
      setThumbnailPreview('')
      setSecondThumbnailPreview('')
      setStreamSourcePreview('')
      setSecondStreamSourcePreview('')

      // When drawer closes, don't reset activeTab immediately
      // It will be set properly when the drawer opens again
      setThumbnailType(SOURCE_TYPES.FILE)
      setStreamSourceType(SOURCE_TYPES.FILE)
      setIsSubmitting(false)
    } else if (open) {
      // When drawer opens, set the tab based on:
      // 1. In edit mode: use the initialData's streamType
      // 2. In create mode: use the current streamType from Redux
      const tabToSet =
        editMode && initialData ? initialData.streamType : streamType ? +streamType : STREAM_TYPES.VIDEO_LIVE

      setActiveTab(tabToSet)
    }
  }, [open, resetForm, editMode, initialData, streamType])

  // Handle form submission
  const onSubmit = async data => {
    try {
      setIsSubmitting(true)

      // Create FormData object
      const formData = new FormData()

      // Add common fields - extract _id from userId object if needed
      formData.append('userId', data.userId)
      formData.append('streamType', activeTab)
      formData.append('thumbnailType', thumbnailType)
      formData.append('streamSourceType', streamSourceType)

      // Add stream-type specific fields
      if (activeTab === STREAM_TYPES.VIDEO_LIVE || activeTab === STREAM_TYPES.AUDIO_LIVE) {
        // Add thumbnail
        if (thumbnailType === SOURCE_TYPES.LINK) {
          formData.append('thumbnail', data.thumbnailLink || '')
        } else if (data.thumbnail) {
          formData.append('thumbnail', data.thumbnail)
        }

        // Add stream source
        if (streamSourceType === SOURCE_TYPES.LINK) {
          formData.append('streamSource', data.streamSourceLink || '')
        } else if (data.streamSource) {
          formData.append('streamSource', data.streamSource)
        }

        // Add audio-specific fields
        if (activeTab === STREAM_TYPES.AUDIO_LIVE) {
          formData.append('roomName', data.roomName || '')
          formData.append('roomWelcome', data.roomWelcome || '')
        }
      } else if (activeTab === STREAM_TYPES.PK_BATTLE) {
        // For PK Battle - handle both new and existing files properly
        if (thumbnailType === SOURCE_TYPES.LINK) {
          // We're in LINK mode, so send all thumbnails as links
          // For position 0, use new link if provided, otherwise use existing link
          const link1 = data.thumbnailLink1 || initialData?.pkThumbnails?.[0] || ''

          if (link1) formData.append('pkThumbnails', link1)

          // For position 1, use new link if provided, otherwise use existing link
          const link2 = data.thumbnailLink2 || initialData?.pkThumbnails?.[1] || ''

          if (link2) formData.append('pkThumbnails', link2)
        } else {
          // We're in FILE mode, so we should handle files consistently

          // Array to store file promises
          const filePromises = []

          // For position 0
          if (data.pkThumbnails?.[0] instanceof File) {
            // If new file is uploaded, use it
            filePromises.push(Promise.resolve(data.pkThumbnails[0]))
          } else if (editMode && initialData?.pkThumbnails?.[0]) {
            // Convert existing URL to file
            filePromises.push(urlToFile(initialData.pkThumbnails[0], 'thumbnail1.jpg'))
          } else {
            filePromises.push(Promise.resolve(null))
          }

          // For position 1
          if (data.pkThumbnails?.[1] instanceof File) {
            // If new file is uploaded, use it
            filePromises.push(Promise.resolve(data.pkThumbnails[1]))
          } else if (editMode && initialData?.pkThumbnails?.[1]) {
            // Convert existing URL to file
            filePromises.push(urlToFile(initialData.pkThumbnails[1], 'thumbnail2.jpg'))
          } else {
            filePromises.push(Promise.resolve(null))
          }

          // Wait for all file conversions
          const thumbnailFiles = await Promise.all(filePromises)

          // Append each file to FormData if it exists
          thumbnailFiles.forEach(file => {
            if (file) {
              formData.append('pkThumbnails', file)
            }
          })
        }

        // Stream sources - using the same approach for consistency
        if (streamSourceType === SOURCE_TYPES.LINK) {
          // We're in LINK mode, so send all stream sources as links
          // For position 0, use new link if provided, otherwise use existing link
          const link1 = data.streamSourceLink1 || initialData?.pkStreamSources?.[0] || ''

          if (link1) formData.append('pkStreamSources', link1)

          // For position 1, use new link if provided, otherwise use existing link
          const link2 = data.streamSourceLink2 || initialData?.pkStreamSources?.[1] || ''

          if (link2) formData.append('pkStreamSources', link2)
        } else {
          // We're in FILE mode, so handle files consistently

          // Array to store file promises
          const filePromises = []

          // For position 0
          if (data.pkStreamSources?.[0] instanceof File) {
            // If new file is uploaded, use it
            filePromises.push(Promise.resolve(data.pkStreamSources[0]))
          } else if (editMode && initialData?.pkStreamSources?.[0]) {
            // Convert existing URL to file
            filePromises.push(urlToFile(initialData.pkStreamSources[0], 'streamsource1.mp4'))
          } else {
            filePromises.push(Promise.resolve(null))
          }

          // For position 1
          if (data.pkStreamSources?.[1] instanceof File) {
            // If new file is uploaded, use it
            filePromises.push(Promise.resolve(data.pkStreamSources[1]))
          } else if (editMode && initialData?.pkStreamSources?.[1]) {
            // Convert existing URL to file
            filePromises.push(urlToFile(initialData.pkStreamSources[1], 'streamsource2.mp4'))
          } else {
            filePromises.push(Promise.resolve(null))
          }

          // Wait for all file conversions
          const streamSourceFiles = await Promise.all(filePromises)

          // Append each file to FormData if it exists
          streamSourceFiles.forEach(file => {
            if (file) {
              formData.append('pkStreamSources', file)
            }
          })
        }
      }

      // Add ID for edit mode
      if (editMode && initialData?._id) {
        formData.append('streamerId', initialData._id)
      }

      // Dispatch the appropriate action
      if (editMode) {
        await dispatch(updateLiveUser(formData)).unwrap()
      } else {
        await dispatch(createLiveUser(formData)).unwrap()
      }

      // Close drawer on success
      handleClose()
    } catch (error) {
      console.error('Failed to save live user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render different forms based on active tab
  const renderFormContent = () => {
    return (
      <div className='flex flex-col gap-5'>
        {/* User selection - common for all types */}
        <Controller
          name='userId'
          control={control}
          rules={{ required: 'User is required' }}
          render={({ field }) => (
            <CustomTextField
              {...field}
              select
              fullWidth
              label='Select User'
              error={Boolean(errors.userId)}
              helperText={errors.userId?.message}
              disabled={loadingUsers || editMode}
            >
              {loadingUsers ? (
                <MenuItem disabled>Loading users...</MenuItem>
              ) : (
                users.map(user => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))
              )}
            </CustomTextField>
          )}
        />

        {/* Type-specific forms */}
        {activeTab === STREAM_TYPES.VIDEO_LIVE && (
          <VideoLiveForm
            control={control}
            watch={watch}
            errors={errors}
            thumbnailType={thumbnailType}
            setThumbnailType={setThumbnailType}
            streamSourceType={streamSourceType}
            setStreamSourceType={setStreamSourceType}
            thumbnailPreview={thumbnailPreview}
            streamSourcePreview={streamSourcePreview}
            handleFileChange={handleFileChange}
            handleFileRemove={handleFileRemove}
          />
        )}
        {activeTab === STREAM_TYPES.AUDIO_LIVE && (
          <AudioLiveForm
            control={control}
            watch={watch}
            errors={errors}
            thumbnailType={thumbnailType}
            setThumbnailType={setThumbnailType}
            streamSourceType={streamSourceType}
            setStreamSourceType={setStreamSourceType}
            thumbnailPreview={thumbnailPreview}
            streamSourcePreview={streamSourcePreview}
            handleFileChange={handleFileChange}
            handleFileRemove={handleFileRemove}
          />
        )}
        {activeTab === STREAM_TYPES.PK_BATTLE && (
          <PKBattleForm
            control={control}
            watch={watch}
            errors={errors}
            thumbnailType={thumbnailType}
            setThumbnailType={setThumbnailType}
            streamSourceType={streamSourceType}
            setStreamSourceType={setStreamSourceType}
            thumbnailPreview={thumbnailPreview}
            secondThumbnailPreview={secondThumbnailPreview}
            streamSourcePreview={streamSourcePreview}
            secondStreamSourcePreview={secondStreamSourcePreview}
            handleFileChange={handleFileChange}
            handleFileRemove={handleFileRemove}
          />
        )}
      </div>
    )
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 600 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>{editMode ? 'Edit' : 'Create'} Live User</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>

      <Divider />

      {/* Stream Type Tabs - disabled */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant='fullWidth'
        aria-label='Stream type tabs'
        sx={{ mb: 2 }}
      >
        <Tab
          label='Video Live'
          value={STREAM_TYPES.VIDEO_LIVE}
          disabled={true}
          sx={{
            opacity: activeTab === STREAM_TYPES.VIDEO_LIVE ? 1 : 0.5,
            fontWeight: activeTab === STREAM_TYPES.VIDEO_LIVE ? 'bold' : 'normal',
            color: activeTab === STREAM_TYPES.VIDEO_LIVE ? 'primary.main' : 'text.disabled',
            borderBottom: activeTab === STREAM_TYPES.VIDEO_LIVE ? '2px solid' : 'none',
            borderColor: 'primary.main'
          }}
        />
        <Tab
          label='Audio Live'
          value={STREAM_TYPES.AUDIO_LIVE}
          disabled={true}
          sx={{
            opacity: activeTab === STREAM_TYPES.AUDIO_LIVE ? 1 : 0.5,
            fontWeight: activeTab === STREAM_TYPES.AUDIO_LIVE ? 'bold' : 'normal',
            color: activeTab === STREAM_TYPES.AUDIO_LIVE ? 'primary.main' : 'text.disabled',
            borderBottom: activeTab === STREAM_TYPES.AUDIO_LIVE ? '2px solid' : 'none',
            borderColor: 'primary.main'
          }}
        />
        <Tab
          label='PK Battle'
          value={STREAM_TYPES.PK_BATTLE}
          disabled={true}
          sx={{
            opacity: activeTab === STREAM_TYPES.PK_BATTLE ? 1 : 0.5,
            fontWeight: activeTab === STREAM_TYPES.PK_BATTLE ? 'bold' : 'normal',
            color: activeTab === STREAM_TYPES.PK_BATTLE ? 'primary.main' : 'text.disabled',
            borderBottom: activeTab === STREAM_TYPES.PK_BATTLE ? '2px solid' : 'none',
            borderColor: 'primary.main'
          }}
        />
      </Tabs>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 p-6'>
        {renderFormContent()}

        {/* Submit Button */}
        <Box mt={3}>
          <Button fullWidth variant='contained' color='primary' type='submit' disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : editMode ? 'Update Live User' : 'Create Live User'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default LiveUserDrawer
