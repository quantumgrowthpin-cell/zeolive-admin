'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch } from 'react-redux'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Store Imports
import { createCategory, updateCategory } from '@/redux-store/slices/songs'

// Utils
import { getFullImageUrl } from '@/util/commonfunctions'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1
})

const CategoryDialog = ({ open, onClose, editData }) => {
  // States
  const [name, setName] = useState('')
  const [image, setImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redux
  const dispatch = useDispatch()

  // Effects
  useEffect(() => {
    if (editData) {
      setName(editData.name)
      setPreviewImage(getFullImageUrl(editData.image))
    } else {
      resetForm()
    }
  }, [editData])

  // Handlers
  const resetForm = () => {
    setName('')
    setImage(null)
    setPreviewImage(null)
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleImageChange = e => {
    const file = e.target.files[0]

    if (file) {
      setImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const formData = new FormData()

      formData.append('name', name)

      if (image) {
        formData.append('image', image)
      }

      if (editData) {
        formData.append('songCategoryId', editData._id)
        await dispatch(updateCategory(formData)).unwrap()
      } else {
        await dispatch(createCategory(formData)).unwrap()
      }

      handleClose()
    } catch (error) {
      console.error('Failed to save category:', error)
      setError(error.toString())
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{editData ? 'Edit Category' : 'Add New Category'}</DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-5 mt-4'>
          <div className='flex flex-col items-center gap-4'>
            <CustomAvatar
              src={previewImage}
              variant='rounded'
              size={100}
              alt={name}
              className='border-2 border-borderPrimary'
            />
            <Button component='label' variant='contained' className='relative'>
              Upload Image
              <VisuallyHiddenInput type='file' accept='image/*' onChange={handleImageChange} />
            </Button>
          </div>

          <CustomTextField
            fullWidth
            label='Category Name'
            value={name}
            onChange={e => setName(e.target.value)}
            error={Boolean(error)}
            helperText={error}
          />
        </div>
      </DialogContent>
      <DialogActions className='p-6 pt-0'>
        <Button variant='outlined' onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={!name || loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {editData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CategoryDialog
