'use client'

import React, { forwardRef, useEffect, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  TextField,
  CircularProgress,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material'

import { useDispatch } from 'react-redux'

import { createNewBanner, modifyBannerDetails, BANNER_TYPE } from '@/redux-store/slices/banner'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { baseURL } from '@/util/config'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const BannerDialog = ({ open, onClose, editData = null, onSuccess, bannerType = BANNER_TYPE.GIFT }) => {
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    bannerType: bannerType,
    redirectUrl: '',
    imageFile: null
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imagePreview, setImagePreview] = useState(null)

  const bannerTypeOptions = [
    { value: BANNER_TYPE.GIFT, label: 'Gift' },
    { value: BANNER_TYPE.SPLASH, label: 'Splash' },
    { value: BANNER_TYPE.HOME, label: 'Home' },
    { value: BANNER_TYPE.GAME, label: 'Game' }
  ]

  useEffect(() => {
    if (editData) {
      setFormData({
        bannerType: editData.bannerType || bannerType,
        redirectUrl: editData.redirectUrl || '',
        imageFile: null
      })
      setImagePreview(editData.imageUrl ? `${baseURL}/${editData.imageUrl}` : null)
    } else {
      setFormData({
        bannerType: bannerType,
        redirectUrl: '',
        imageFile: null
      })
      setImagePreview(null)
    }

    setErrors({})
  }, [editData, open, bannerType])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleFileChange = event => {
    const file = event.target.files[0]

    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({
          ...prev,
          imageFile: file
        }))
        setImagePreview(URL.createObjectURL(file))

        if (errors.imageFile) {
          setErrors(prev => ({
            ...prev,
            imageFile: ''
          }))
        }
      } else {
        setErrors(prev => ({
          ...prev,
          imageFile: 'Please select a valid image file'
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!editData && !formData.imageFile) {
      newErrors.imageFile = 'Image is required'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const submitData = new FormData()

      submitData.append('bannerType', formData.bannerType)
      formData.redirectUrl && submitData.append('redirectUrl', formData.redirectUrl)

      if (formData.imageFile) {
        submitData.append('imageUrl', formData.imageFile)
      }

      if (editData) {
        submitData.append('bannerId', editData._id)
        await dispatch(modifyBannerDetails(submitData)).unwrap()
      } else {
        await dispatch(createNewBanner(submitData)).unwrap()
      }

      // onSuccess && onSuccess()
      onClose()
    } catch (err) {
      // Error already handled by toast in thunk
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      keepMounted
      onClose={onClose}
      TransitionComponent={Transition}
      closeAfterTransition={false}
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '500px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit Banner' : 'Create New Banner'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* <FormControl fullWidth error={!!errors.bannerType}>
            <InputLabel>Banner Type</InputLabel>
            <Select
              value={formData.bannerType}
              onChange={e => handleInputChange('bannerType', e.target.value)}
              label='Banner Type'
              disabled={true}
            >
              {bannerTypeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
            {errors.bannerType && <FormHelperText>{errors.bannerType}</FormHelperText>}
          </FormControl> */}
          {/* Redirect URL (optional) */}
          <TextField
            fullWidth
            label='Redirect URL'
            value={formData.redirectUrl}
            onChange={e => handleInputChange('redirectUrl', e.target.value)}
            placeholder='https://example.com'
          />
          {/* Image */}
          <Box>
            <StyledFileInput
              accept='image/*'
              label={editData ? 'Change Image' : 'Upload Image'}
              onChange={handleFileChange}
              required={editData ? false : true}
            />
            {errors.imageFile && (
              <Typography color='error' className='text-red-500' variant='body2' sx={{ mb: 1 }}>
                {errors.imageFile}
              </Typography>
            )}
            {imagePreview && (
              <Box sx={{ textAlign: 'center' }}>
                <img
                  src={imagePreview}
                  alt='Banner preview'
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px'
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='tonal' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : editData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BannerDialog
