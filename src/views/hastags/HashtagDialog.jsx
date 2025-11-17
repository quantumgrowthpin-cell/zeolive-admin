'use client'

import React, { forwardRef, useEffect, useState } from 'react'

import { useDispatch } from 'react-redux'

import Slide from '@mui/material/Slide'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'

import DialogCloseButton from '@components/dialogs/DialogCloseButton'

import { createHashtag, updateHashtag } from '@/redux-store/slices/hashtags'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const HashtagDialog = ({ open, onClose, mode = 'create', hashtag = null }) => {
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    hashTag: ''
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && hashtag) {
      setFormData({
        hashTag: hashtag.hashTag || ''
      })
    } else {
      setFormData({
        hashTag: ''
      })
    }
  }, [mode, hashtag])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear field-specific error if valid
    setErrors(prev => {
      const updatedErrors = { ...prev }

      if (field === 'hashTag' && value.trim() !== '') {
        delete updatedErrors.hashTag
      }

      return updatedErrors
    })
  }

  const handleValidation = () => {
    const newErrors = {}

    if (!formData.hashTag || formData.hashTag.trim() === '') {
      newErrors.hashTag = 'Hashtag is required'
    } else if (!formData.hashTag.startsWith('#')) {
      newErrors.hashTag = 'Hashtag must start with #'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!handleValidation()) return

    try {
      setLoading(true)

      if (mode === 'edit') {
        await dispatch(
          updateHashtag({
            hashTagId: hashtag._id,
            hashTag: formData.hashTag
          })
        ).unwrap()
      } else {
        await dispatch(
          createHashtag({
            hashTag: formData.hashTag
          })
        ).unwrap()
      }

      setFormData({ hashTag: '' })
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ submit: 'An error occurred while submitting the form' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ hashTag: '' })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={Transition}
      aria-labelledby='hashtag-dialog-title'
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
      <DialogTitle id='hashtag-dialog-title'>
        <Typography variant='h5' component='span'>
          {mode === 'edit' ? 'Edit Hashtag' : 'Create Hashtag'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4 py-4'>
        <TextField
          label='Hashtag'
          fullWidth
          value={formData.hashTag}
          error={!!errors.hashTag}
          helperText={errors.hashTag || 'Must start with # (e.g. #coding)'}
          onChange={e => handleChange('hashTag', e.target.value)}
          placeholder='#example'
        />

        {errors.submit && (
          <Typography color='error' variant='body2'>
            {errors.submit}
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant='tonal' color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default HashtagDialog
