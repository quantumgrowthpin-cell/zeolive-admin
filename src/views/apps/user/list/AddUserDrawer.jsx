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
import { registerFakeUser } from '@/redux-store/slices/user'

// Countries data is now fetched from API instead of static imports
const AddUserDrawer = props => {
  // Props
  const { open, handleClose } = props

  // Redux
  const dispatch = useDispatch()
  const { type, status } = useSelector(state => state.userReducer)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = useTheme()

  // Country data state
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(false)

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
      userName: '@',
      email: '',
      age: '',
      country: '',
      gender: '',
      userImage: null
    }
  })

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      resetForm({
        name: '',
        userName: '',
        email: '',
        age: '',
        country: '',
        gender: '',
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
    const file = e.target.files?.[0] || null

    if (file) {
      setValue(fieldName, file)
    }
  }

  const onSubmit = async formData => {
    try {
      setIsSubmitting(true)

      // Find selected country data
      const selectedCountry = countries.find(c => c.code === formData.country)

      // Create FormData object
      const submitData = new FormData()

      // Append only the required fields
      submitData.append('name', formData.name)
      submitData.append('userName', formData.userName)
      submitData.append('email', formData.email)
      submitData.append('age', formData.age)
      submitData.append('country', selectedCountry?.name || '')
      submitData.append('gender', formData.gender)

      // Add country flag image URL if available
      if (selectedCountry?.flagUrl) {
        submitData.append('countryFlagImage', selectedCountry.flagUrl)
      }

      // Append user profile image if uploaded
      if (formData.userImage) {
        submitData.append('image', formData.userImage)
      }

      // Dispatch action to register fake user
      await dispatch(registerFakeUser(submitData)).unwrap()

      // Close drawer and reset form on success
      handleClose()
      resetForm()
    } catch (error) {
      console.error('Failed to register fake user:', error)
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
        <Typography variant='h5'>Add Fake User</Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='tabler-x text-2xl text-textPrimary' />
        </IconButton>
      </div>
      <Divider />
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 p-6'>
          {type !== 2 && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.lighter', borderRadius: 1 }}>
              <Typography color='error.main' variant='body2'>
                Please switch to Fake Users tab before adding a fake user.
              </Typography>
            </Box>
          )}

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
            name='email'
            control={control}
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            }}
            render={({ field }) => (
              <CustomTextField
                {...field}
                fullWidth
                type='email'
                label='Email'
                placeholder='johndoe@example.com'
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
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

          <Controller
            name='gender'
            control={control}
            rules={{ required: 'Gender is required' }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                id='select-gender'
                label='Gender'
                {...field}
                error={Boolean(errors.gender)}
                helperText={errors.gender?.message}
              >
                <MenuItem value='Male'>Male</MenuItem>
                <MenuItem value='Female'>Female</MenuItem>
                <MenuItem value='Other'>Other</MenuItem>
              </CustomTextField>
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
                mb: 2,
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('user-image-upload').click()}
            >
              {userImagePreview ? (
                <img
                  src={userImagePreview}
                  alt='User preview'
                  style={{ maxWidth: '100%', maxHeight: '150px', marginBottom: '1rem' }}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}
                >
                  <i className='tabler-upload text-3xl mb-2' />
                  <Typography>Click to upload profile image</Typography>
                  <Typography variant='caption' color='textSecondary'>
                    JPG, PNG or GIF, max 5MB
                  </Typography>
                </Box>
              )}
              <input
                id='user-image-upload'
                type='file'
                accept='image/*'
                onChange={e => handleFileChange(e, 'userImage')}
                style={{ display: 'none' }}
              />
            </Box>
          </Box>

          <Controller
            name='country'
            control={control}
            rules={{ required: 'Country is required' }}
            render={({ field }) => (
              <CustomTextField
                select
                fullWidth
                id='select-country'
                label='Country'
                {...field}
                error={Boolean(errors.country)}
                helperText={errors.country?.message}
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
              disabled={isSubmitting || type !== 2 || loadingCountries}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Creating...' : 'Submit'}
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

export default AddUserDrawer
