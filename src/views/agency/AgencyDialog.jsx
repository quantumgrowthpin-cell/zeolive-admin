import React, { forwardRef, useState, useEffect, useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import axios from 'axios'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Slide,
  TextField,
  Typography,
  Button,
  FormControl,
  MenuItem,
  Grid,
  CircularProgress,
  InputAdornment,
  Divider,
  Autocomplete,
  Tooltip
} from '@mui/material'

import CloseIcon from '@mui/icons-material/Close'
import PercentIcon from '@mui/icons-material/Percent'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import PhoneIcon from '@mui/icons-material/Phone'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import EmailIcon from '@mui/icons-material/Email'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { registerUserAsAgency, updateAgencyProfile, fetchUserList } from '@/redux-store/slices/agency'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/util/getInitials'
import { getFullImageUrl } from '@/util/commonfunctions'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const AgencyDialog = ({ open, onClose, editData }) => {
  const isEditMode = Boolean(editData)
  const dispatch = useDispatch()
  const { loading, users } = useSelector(state => state.agency || { loading: false, users: [] })

  // Country data state
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')

  // Image preview states
  const [imagePreview, setImagePreview] = useState('')
  const [flagPreview, setFlagPreview] = useState('')

  // Debounce function
  const debounce = (func, delay) => {
    let timeoutId

    return (...args) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  // Sanitize phone number to ensure it has a country code
  const sanitizePhoneNumber = phoneNumber => {
    if (!phoneNumber) return ''

    // If already has a plus sign, return as is
    if (phoneNumber.startsWith('+')) return phoneNumber

    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '')

    // Add the plus sign
    return `+${digitsOnly}`
  }

  // Form handling
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    defaultValues: {
      userId: '',
      agencyName: '',
      contactEmail: '',
      commissionRate: '',
      mobileNumber: '',
      description: '',
      country: '',
      countryFlagImage: null,
      image: null
    }
  })

  // Fetch users with debouncing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchUsers = useCallback(
    debounce(searchQuery => {
      dispatch(fetchUserList(searchQuery))
    }, 500), // 500ms delay
    [dispatch]
  )

  // Fetch users when dialog opens or search query changes
  useEffect(() => {
    if (open && !isEditMode) {
      debouncedFetchUsers(userSearchQuery)
    }
  }, [open, isEditMode, userSearchQuery, debouncedFetchUsers])

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

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      reset({
        userId: '',
        agencyName: '',
        contactEmail: '',
        commissionRate: '',
        mobileNumber: '',
        description: '',
        country: '',
        countryFlagImage: null,
        image: null
      })
      setImagePreview('')
      setFlagPreview('')
    } else if (isEditMode && editData) {
      // Populate form with edit data
      // Safe way to populate form with edit data
      Object.keys(editData).forEach(key => {
        // Check if key exists in our form
        if (
          key === 'userId' ||
          key === 'agencyName' ||
          key === 'contactEmail' ||
          key === 'commissionRate' ||
          key === 'description' ||
          key === 'country' ||
          key === 'countryFlagImage' ||
          key === 'image'
        ) {
          setValue(key, editData[key] || '')
        }
      })

      // Handle mobile number separately to ensure it has a country code
      if (editData.mobileNumber) {
        setValue('mobileNumber', sanitizePhoneNumber(editData.mobileNumber))
      }

      // Find country code from country name
      if (editData.country) {
        const countryObj = countries.find(c => c.name === editData.country)

        if (countryObj) {
          setValue('country', countryObj.code)
        }
      }

      // Set preview images if available
      if (editData.image) setImagePreview(getFullImageUrl(editData.image))
      if (editData.countryFlagImage) setFlagPreview(editData.countryFlagImage)
    }
  }, [open, reset, isEditMode, editData, setValue, countries])

  // Watch file fields for previews
  const imageFile = watch('image')
  const countryCode = watch('country')

  // Generate preview URLs when files change
  useEffect(() => {
    if (imageFile && imageFile instanceof File) {
      const fileUrl = URL.createObjectURL(imageFile)

      setImagePreview(fileUrl)

      return () => URL.revokeObjectURL(fileUrl)
    }
  }, [imageFile])

  // Update flag preview when country changes
  useEffect(() => {
    if (countryCode) {
      const selectedCountry = countries.find(c => c.code === countryCode)

      if (selectedCountry?.flagUrl) {
        setFlagPreview(selectedCountry.flagUrl)

        // Store flag URL for submission
        setValue('countryFlagImage', selectedCountry.flagUrl)
      }
    }
  }, [countryCode, countries, setValue])

  // File change handlers
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0] || null

    if (file) {
      setValue(fieldName, file)
    }
  }

  const handleClose = () => {
    onClose()
  }

  const onSubmit = async formData => {
    try {
      // Ensure mobile number has country code
      if (formData.mobileNumber && !formData.mobileNumber.startsWith('+')) {
        formData.mobileNumber = sanitizePhoneNumber(formData.mobileNumber)
      }

      // Validate phone number format
      if (formData.mobileNumber && !/^\+[1-9]\d{1,14}$/.test(formData.mobileNumber)) {
        return
      }

      // Find selected country data
      const selectedCountry = countries.find(c => c.code === formData.country)

      // Create FormData object
      const submitData = new FormData()

      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'country' && selectedCountry) {
          // Send country name instead of code
          submitData.append(key, selectedCountry.name)
        } else if (formData[key] !== null && formData[key] !== undefined && key !== 'countryFlagImage') {
          // Skip countryFlagImage as it's handled separately
          submitData.append(key, formData[key])
        }
      })

      // Append country flag image URL if available
      if (selectedCountry?.flagUrl) {
        submitData.append('countryFlagImage', selectedCountry.flagUrl)
      }

      if (isEditMode) {
        // Update existing agency
        await dispatch(
          updateAgencyProfile({
            agencyId: editData._id,
            formData: submitData
          })
        ).unwrap()
      } else {
        // Create new agency
        await dispatch(registerUserAsAgency(submitData)).unwrap()
      }

      // Close dialog on success
      handleClose()
    } catch (error) {
      console.error('Failed to save agency:', error)
    }
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
          {isEditMode ? `Edit ${editData.agencyName}'s Agency` : 'Create Agency'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <CloseIcon />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {!isEditMode && (
              <Grid item xs={12}>
                <Controller
                  name='userId'
                  control={control}
                  rules={{ required: 'User is required' }}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      options={users || []}
                      loading={loading}
                      onInputChange={(_, newValue) => setUserSearchQuery(newValue)}
                      getOptionLabel={option => {
                        // Handle different option types (string or object)
                        if (typeof option === 'string') return option

                        return option.name || option.userName || option.uniqueId?.toString() || ''
                      }}
                      filterOptions={x => x} // Disable client-side filtering as we're using server-side search
                      renderOption={(props, option) => (
                        <li {...props} key={option._id}>
                          <Box display='flex' alignItems='center' gap={2}>
                            <CustomAvatar src={option.image ? getFullImageUrl(option.image) : null} size={32}>
                              {!option.image && getInitials(option.name)}
                            </CustomAvatar>
                            <Box>
                              <Typography variant='body1'>{option.name}</Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {option.userName.startsWith('@') ? option.userName : `@${option.userName}`} • ID:{' '}
                                {option.uniqueId}
                              </Typography>
                            </Box>
                          </Box>
                        </li>
                      )}
                      isOptionEqualToValue={(option, value) => {
                        // Allow comparing objects or IDs
                        if (typeof option === 'string' && typeof value === 'string') {
                          return option === value
                        }

                        return option?._id === (typeof value === 'string' ? value : value?._id)
                      }}
                      onChange={(_, newValue) => {
                        field.onChange(newValue?._id || '')
                      }}
                      renderInput={params => (
                        <TextField
                          {...params}
                          label='Select User'
                          error={Boolean(errors.userId)}
                          helperText={errors.userId?.message}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loading ? <CircularProgress color='inherit' size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      value={
                        field.value
                          ? // When editing, convert ID string to object format for Autocomplete
                            users.find(user => user._id === field.value) || field.value
                          : null
                      }
                    />
                  )}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <Controller
                name='agencyName'
                control={control}
                rules={{ required: 'Agency name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Agency Name'
                    fullWidth
                    error={Boolean(errors.agencyName)}
                    helperText={errors.agencyName?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name='contactEmail'
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Please enter a valid email address'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Contact Email'
                    fullWidth
                    error={Boolean(errors.contactEmail)}
                    helperText={errors.contactEmail?.message}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <EmailIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name='mobileNumber'
                control={control}
                rules={{
                  required: 'Mobile number is required',
                  pattern: {
                    value: /^\+[1-9]\d{1,14}$/,
                    message: 'Please enter a valid number with country code (e.g. +123456789)'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Mobile Number (with country code)'
                    placeholder='+123456789'
                    fullWidth
                    error={Boolean(errors.mobileNumber)}
                    helperText={errors.mobileNumber?.message || 'Include country code (e.g. +1 for US)'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position='start'>
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position='end'>
                          <Tooltip title="Start with '+' followed by country code and number">
                            <InfoOutlinedIcon fontSize='small' color='action' />
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name='commissionRate'
                control={control}
                rules={{
                  required: 'Commission rate is required',
                  min: {
                    value: 0,
                    message: 'Commission rate must be at least 0%'
                  },
                  max: {
                    value: 100,
                    message: 'Commission rate cannot exceed 100%'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type='number'
                    label='Commission Rate'
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position='end'>
                          <PercentIcon />
                        </InputAdornment>
                      )
                    }}
                    error={Boolean(errors.commissionRate)}
                    helperText={errors.commissionRate?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name='country'
                control={control}
                rules={{ required: 'Country is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label='Country'
                    fullWidth
                    error={Boolean(errors.country)}
                    helperText={errors.country?.message}
                    disabled={loadingCountries}
                    InputProps={{
                      // startAdornment: flagPreview ? (
                      //   <InputAdornment position='start'>
                      //     <img src={flagPreview} alt='Flag' width={24} height={16} style={{ marginRight: 8 }} />
                      //   </InputAdornment>
                      // ) : null,
                      endAdornment: loadingCountries ? (
                        <InputAdornment position='end'>
                          <CircularProgress size={20} />
                        </InputAdornment>
                      ) : null
                    }}
                  >
                    {countries.map(country => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            src={country.flagUrl}
                            alt={country.name}
                            width={24}
                            height={16}
                            style={{ marginRight: 8 }}
                          />
                          {country.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name='description'
                control={control}
                rules={{
                  required: 'Description is required',
                  maxLength: {
                    value: 500,
                    message: 'Description cannot exceed 500 characters'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label='Description'
                    fullWidth
                    multiline
                    rows={4}
                    error={Boolean(errors.description)}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='body1' gutterBottom>
                Agency Logo
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 1,
                    border: '1px dashed',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt='Agency Logo'
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          '&:hover': {
                            opacity: 1
                          }
                        }}
                      >
                        <Typography variant='caption' color='white' align='center'>
                          Click to change
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <PhotoCameraIcon color='action' />
                  )}
                  <input
                    type='file'
                    accept='image/*'
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                    onChange={e => handleFileChange(e, 'image')}
                  />
                </Box>

                <Button
                  variant='outlined'
                  startIcon={<PhotoCameraIcon />}
                  component='label'
                  size='small'
                  sx={{ width: 'fit-content' }}
                >
                  {imagePreview ? 'Change Logo' : 'Upload Logo'}
                  <input type='file' hidden accept='image/*' onChange={e => handleFileChange(e, 'image')} />
                </Button>

                <Typography variant='body2' color='text.secondary'>
                  Recommended size: 250x250 pixels. Maximum file size: 2MB.
                  <br />
                  Formats: JPG, PNG, GIF
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant='outlined' onClick={handleClose}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={loading}>
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isEditMode ? (
                  'Update Agency'
                ) : (
                  'Create Agency'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AgencyDialog
