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
  Typography
} from '@mui/material'

import { useDispatch } from 'react-redux'

import { createGiftCategory, updateGiftCategory } from '@/redux-store/slices/gifts'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const GiftCategoryDialog = ({ open, onClose, editData = null }) => {
  const dispatch = useDispatch()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setName(editData?.name || editData?.categoryName || '')
    setError('')
  }, [editData, open])

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required')

      return
    }

    setLoading(true)

    try {
      if (editData) {
        await dispatch(updateGiftCategory({ categoryId: editData._id, name })).unwrap()
      } else {
        await dispatch(createGiftCategory(name)).unwrap()
      }

      onClose()
    } catch (err) {
      // error already handled by toast in thunk
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
      maxWidth='xs'
      PaperProps={{
        sx: {
          overflow: 'visible',
          width: '400px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {editData ? 'Edit Category' : 'Create New Category'}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label='Category Name'
          fullWidth
          value={name}
          onChange={e => {
            setName(e.target.value)
            if (error) setError('')
          }}
          error={!!error}
          helperText={error}
        />
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

export default GiftCategoryDialog
