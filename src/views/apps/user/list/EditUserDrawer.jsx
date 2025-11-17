// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import { modifyUserProfile } from '@/redux-store/slices/user'
import { getFullImageUrl } from '@/util/commonfunctions'

const EditUserDrawer = props => {
  // Props
  const { open, handleClose, userData } = props

  // Redux
  const dispatch = useDispatch()
  const { status } = useSelector(state => state.userReducer)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = useTheme()

  // Country data state
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [countryMappingReady, setCountryMappingReady] = useState(false)
  const [originalCountry, setOriginalCountry] = useState('')

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true)

      try {
        const response = await axios.get('/countries.json')

        if (response.data && Array.isArray(response.data)) {
          // Transform the API response to our format
          const countryData = response.data
            .filter(country => country.name && country.cca2 && country.flags) // Ensure required fields exist
            .map(country => ({
              name: country.name.common,
              code: country.cca2,
              flagUrl: country.flags.png || country.flags.svg
            }))
            .sort((a, b) => a.name.localeCompare(b.name)) // Sort alphabetically

          setCountries(countryData)
          setCountryMappingReady(true)
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error)
      } finally {
        setLoadingCountries(false)
      }
    }

    fetchCountries()
  }, [])

  // Hooks
  const {
    control,
    reset: resetForm,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: '',
      userName: '',
      age: '',
      country: '',
      userImage: null
    }
  })

  // Set the form values when userData changes
  useEffect(() => {
    if (userData && open && countryMappingReady) {
      // Find country code from name - use a more flexible approach
      let countryCode = ''

      // Try direct match first
      const exactMatch = countries.find(c => c.name.toLowerCase() === (userData.country || '').toLowerCase())

      if (exactMatch) {
        countryCode = exactMatch.code
      } else {
        // Try partial match if exact match fails
        const partialMatch = countries.find(
          c =>
            (userData.country || '').toLowerCase().includes(c.name.toLowerCase()) ||
            c.name.toLowerCase().includes((userData.country || '').toLowerCase())
        )

        if (partialMatch) {
          countryCode = partialMatch.code
        }
      }

      resetForm({
        name: userData.name || '',
        userName: userData.userName || '',
        age: userData.age || '',
        country: countryCode,
        userImage: null
      })

      // Set image preview if user has an image
      if (userData.image) {
        setUserImagePreview(getFullImageUrl(userData.image))
      } else {
        setUserImagePreview('')
      }

      // Store the original country value for reference
      setOriginalCountry(userData.country || '')
    }
  }, [userData, open, countries, resetForm, countryMappingReady])

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      resetForm({
        name: '',
        userName: '',
        age: '',
        country: '',
        userImage: null
      })
      setUserImagePreview('')
      setIsSubmitting(false)
    }
  }, [open, resetForm])

  // Watch file fields for previews
  const userImageFile = watch('userImage')

  // Image preview states
  const [userImagePreview, setUserImagePreview] = useState('')

  // Generate preview URLs when files change
  useEffect(() => {
    if (userImageFile && userImageFile instanceof File) {
      const fileUrl = URL.createObjectURL(userImageFile)

      setUserImagePreview(fileUrl)

      return () => URL.revokeObjectURL(fileUrl)
    }
  }, [userImageFile])

  // File change handlers
  const handleFileChange = (e, fieldName) => {
    e.stopPropagation() // Prevent event bubbling
    const file = e.target.files?.[0] || null

    if (file) {
      // Create a File object that can be properly processed by FormData
      const newFile = new File([file], file.name, {
        type: file.type,
        lastModified: file.lastModified
      })

      setValue(fieldName, newFile)
    }
  }

  // Handle image removal
  const handleRemoveImage = () => {
    setUserImagePreview('')
    setValue('userImage', null)
  }

  const onSubmit = async formData => {
    if (!userData?._id) {
      alert('User ID is required')

      return
    }

    try {
      setIsSubmitting(true)

      // Create FormData object
      const submitData = new FormData()

      // Append userId (required for editing)
      submitData.append('userId', userData._id)

      // Append form fields
      submitData.append('name', formData.name)
      submitData.append('userName', formData.userName)
      submitData.append('age', formData.age)

      // Country logic
      if (formData.country) {
        // If country is selected, use it
        const selectedCountry = countries.find(c => c.code === formData.country)

        if (selectedCountry) {
          submitData.append('country', selectedCountry.name)

          // Add country flag image URL
          if (selectedCountry.flagUrl) {
            submitData.append('countryFlagImage', selectedCountry.flagUrl)
          }
        }
      } else {
        // If no country was selected, keep original if it exists
        if (originalCountry) {
          submitData.append('country', originalCountry)

          // Keep original flag if it exists
          if (userData.countryFlagImage) {
            submitData.append('countryFlagImage', userData.countryFlagImage)
          }
        }
      }

      // Append user profile image if uploaded
      if (formData.userImage instanceof File) {
        submitData.append('image', formData.userImage)
      } else if (!userImagePreview && userData.image) {
        // If image preview was cleared, indicate we want to remove the image
        submitData.append('removeImage', 'true')
      }

      // Dispatch action to modify user profile
      await dispatch(modifyUserProfile(submitData)).unwrap()

      // Close drawer and reset form on success
      handleClose()
      resetForm()
    } catch (error) {
      console.error('Failed to update user:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between plb-5 pli-6'>
        <Typography variant='h5'>Edit User</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 p-6'>
          <Controller
            name='name'
            control={control}
            rules={{ required: 'Full name is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Full Name'
                placeholder='John Doe'
                error={Boolean(errors.name)}
                helperText={errors.name?.message}
              />
            )}
          />

          <Controller
            name='userName'
            control={control}
            rules={{ required: 'Username is required' }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                label='Username'
                placeholder='johndoe'
                error={Boolean(errors.userName)}
                helperText={errors.userName?.message}
              />
            )}
          />

          <Controller
            name='age'
            control={control}
            rules={{
              required: 'Age is required',
              min: {
                value: 18,
                message: 'Age must be at least 18'
              },
              max: {
                value: 100,
                message: 'Age must be less than 100'
              }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='number'
                label='Age'
                placeholder='25'
                error={Boolean(errors.age)}
                helperText={errors.age?.message}
              />
            )}
          />

          <Box>
            <Typography variant='body1' gutterBottom>
              User Profile Image
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: theme => `1px dashed ${theme.palette.divider}`,
                borderRadius: 1,
                p: 3,
                mb: 2
              }}
            >
              {userImagePreview ? (
                <div className='relative w-full text-center'>
                  <img
                    src={userImagePreview}
                    alt='User preview'
                    style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '1rem' }}
                  />
                  <div className='flex gap-2 justify-center'>
                    <Button variant='contained' color='primary' size='small' component='label'>
                      Change Image
                      <input type='file' hidden accept='image/*' onChange={e => handleFileChange(e, 'userImage')} />
                    </Button>
                    <Button variant='contained' color='error' size='small' onClick={handleRemoveImage}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <i className='tabler-upload text-3xl mb-2' />
                  <Typography>Upload profile image</Typography>
                  <Typography variant='caption' color='textSecondary' sx={{ mb: 2 }}>
                    JPG, PNG or GIF, max 5MB
                  </Typography>
                  <Button variant='contained' component='label'>
                    Select Image
                    <input type='file' hidden accept='image/*' onChange={e => handleFileChange(e, 'userImage')} />
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          <Controller
            name='country'
            control={control}
            rules={{ required: false }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                id='select-country'
                label='Country'
                {...field}
                error={Boolean(errors.country)}
                helperText={errors.country?.message || 'Select only if you want to change the country'}
                disabled={loadingCountries}
                InputProps={{
                  endAdornment: loadingCountries ? <CircularProgress size={20} /> : null
                }}
              >
                {countries.map(country => (
                  <MenuItem key={country.code} value={country.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {country.flagUrl && (
                        <img
                          src={country.flagUrl}
                          alt={`${country.name} flag`}
                          style={{ width: '1.5rem', height: 'auto', marginRight: '0.75rem' }}
                        />
                      )}
                      <Typography>{country.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </CustomTextField>
            )}
          />

          <div className='flex items-center gap-4 mt-2'>
            <Button
              variant='contained'
              type='submit'
              disabled={isSubmitting || loadingCountries}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Updating...' : 'Update User'}
            </Button>
            <Button variant='tonal' color='secondary' onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default EditUserDrawer
