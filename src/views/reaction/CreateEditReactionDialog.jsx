'use client'

import { forwardRef, useEffect, useState } from 'react'

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Button,
  TextField,
  Typography,
  CircularProgress
} from '@mui/material'
import { useDispatch } from 'react-redux'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { createReaction, updateReaction } from '@/redux-store/slices/reactions'
import { getFullImageUrl } from '@/util/commonfunctions'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CreateEditReactionDialog = ({ open, onClose, mode = 'create', reaction = null }) => {
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    title: ''
  })

  const [file, setFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && reaction) {
      setFormData({
        title: reaction.title || ''
      })
      setFile(null)
      const fullImageUrl = getFullImageUrl(reaction.image)

      setExistingImageUrl(fullImageUrl)
    }
  }, [mode, reaction])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleFileChange = e => {
    const selectedFile = e.target.files[0]

    setFile(selectedFile)
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!file && mode === 'create') newErrors.file = 'Please upload an image'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const body = new FormData()

    body.append('title', formData.title)

    if (file) {
      body.append('image', file)
    }

    try {
      setLoading(true)

      if (mode === 'edit') {
        body.append('reactionId', reaction._id)
        await dispatch(updateReaction(body)).unwrap()
      } else {
        await dispatch(createReaction(body)).unwrap()
      }

      handleClose()
    } catch (error) {
      console.error(error)
      setErrors({ submit: 'Something went wrong while saving the reaction.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ title: '' })
    setFile(null)
    setExistingImageUrl(null)
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={Transition}
      aria-labelledby='create-reaction-dialog'
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
        <Typography variant='h5' component='div'>
          {mode === 'edit' ? 'Edit Reaction' : 'Create Reaction'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4 py-4'>
        <TextField
          label='Title'
          fullWidth
          value={formData.title}
          error={!!errors.title}
          helperText={errors.title}
          onChange={e => handleChange('title', e.target.value)}
        />

        <div>
          <StyledFileInput
            accept='.jpg,.jpeg,.png,.gif,.webp'
            label='Upload Reaction Image'
            onChange={handleFileChange}
          />
          {(file || existingImageUrl) && (
            <div className='mt-2 flex gap-4 items-start'>
              <img
                src={file ? URL.createObjectURL(file) : existingImageUrl}
                alt='preview'
                className='rounded border border-gray-300 max-w-[200px] max-h-[100px] object-contain'
              />
            </div>
          )}
          {errors.file && (
            <Typography color='error' variant='caption'>
              {errors.file}
            </Typography>
          )}
        </div>
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

export default CreateEditReactionDialog
