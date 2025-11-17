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
  Typography,
  CircularProgress,
  FormHelperText,
  IconButton,
  Chip,
  Box,
  InputAdornment
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createPayoutMethod, updatePayoutMethod } from '@/redux-store/slices/payoutMethods'
import { getFullImageUrl } from '@/util/commonfunctions'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const capitalizeWords = str => str.replace(/\b\w/g, char => char.toUpperCase())

const PayoutMethodDialog = ({ open, onClose, mode = 'create', payoutMethod = null }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector(state => state.payoutMethodsReducer)

  const [formData, setFormData] = useState({
    name: '',
    details: []
  })

  const [file, setFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [errors, setErrors] = useState({})
  const [newDetail, setNewDetail] = useState('')

  // Reset form data when dialog opens/closes or mode changes
  useEffect(() => {
    if (mode === 'edit' && payoutMethod) {
      setFormData({
        name: payoutMethod.name || '',
        details: payoutMethod.details || []
      })
      setExistingImageUrl(payoutMethod.image || '')
    } else {
      setFormData({
        name: '',
        details: []
      })
      setExistingImageUrl(null)
    }

    setFile(null)
    setErrors({})
    setNewDetail('')
  }, [mode, payoutMethod, open])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleFileChange = e => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) return

    setFile(selectedFile)
    setErrors(prev => ({ ...prev, file: null }))
  }

  const handleAddDetail = () => {
    if (!newDetail.trim()) return

    const formattedDetail = capitalizeWords(newDetail.trim())

    setFormData(prev => ({
      ...prev,
      details: [...prev.details, formattedDetail]
    }))

    setNewDetail('')
  }

  const handleRemoveDetail = index => {
    setFormData(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name) newErrors.name = 'Enter a payout method name'
    if (formData.details.length === 0) newErrors.details = 'Add at least one detail field'
    if (!file && mode === 'create') newErrors.file = 'Please upload an image'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const body = new FormData()

    body.append('name', formData.name)
    formData.details.forEach((detail, index) => {
      body.append(`details[${index}]`, detail)
    })

    if (file) {
      body.append('image', file)
    } else if (mode === 'create') {
      setErrors(prev => ({ ...prev, file: 'Please upload an image' }))

      return
    }

    try {
      if (mode === 'edit') {
        body.append('payoutMethodId', payoutMethod._id)
        await dispatch(updatePayoutMethod(body)).unwrap()
      } else {
        await dispatch(createPayoutMethod(body)).unwrap()
      }

      onClose()
    } catch (err) {
      console.error('Payout method save failed:', err)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      keepMounted
      TransitionComponent={Transition}
      fullWidth
      maxWidth='sm'
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
          {mode === 'edit' ? 'Edit Payout Method' : 'Add New Payout Method'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4 py-4'>
        <TextField
          label='Payout Method Name'
          type='text'
          fullWidth
          value={formData.name || ''}
          error={!!errors.name}
          helperText={errors.name}
          onChange={e => handleChange('name', e.target.value)}
        />

        <Box>
          <TextField
            label='Add Detail Field'
            placeholder='e.g. Email, Account Number, IBAN'
            fullWidth
            value={newDetail}
            onChange={e => setNewDetail(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton onClick={handleAddDetail} edge='end'>
                    <i className='tabler-plus' />
                  </IconButton>
                </InputAdornment>
              )
            }}
            onKeyPress={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddDetail()
              }
            }}
          />
          {errors.details && <FormHelperText error>{errors.details}</FormHelperText>}
        </Box>

        <Box className='flex flex-wrap gap-2 mt-2'>
          {formData.details.map((detail, index) => (
            <Chip
              key={index}
              label={detail}
              onDelete={() => handleRemoveDetail(index)}
              color='primary'
              variant='outlined'
            />
          ))}
          {formData.details.length === 0 && (
            <Typography variant='body2' color='text.secondary'>
              No detail fields added yet
            </Typography>
          )}
        </Box>

        <StyledFileInput
          accept='image/*'
          label='Upload Image'
          onChange={handleFileChange}
          required={mode === 'create'}
        />
        {(file || existingImageUrl) && (
          <div className='mt-2'>
            <img
              src={file ? URL.createObjectURL(file) : getFullImageUrl(existingImageUrl)}
              alt='preview'
              className='rounded border border-gray-300 max-w-[200px] max-h-[100px] object-contain'
              onError={e => {
                e.target.src = '/images/avatars/placeholder-image.webp'
              }}
            />
          </div>
        )}
        {errors.file && (
          <Typography color='error' variant='caption'>
            {errors.file}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant='tonal' color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PayoutMethodDialog
