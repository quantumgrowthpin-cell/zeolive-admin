'use client'

import { useState, useEffect, forwardRef } from 'react'

import Dialog from '@mui/material/Dialog'
import Slide from '@mui/material/Slide'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import { useDispatch } from 'react-redux'

import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { createWealthLevel, editWealthLevel } from '@/redux-store/slices/wealthLevels'
import { getFullImageUrl } from '@/util/commonfunctions'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CreateEditWealthLevelDialog = ({ open, onClose, mode = 'create', levelData = null }) => {
  const dispatch = useDispatch()

  const [formData, setFormData] = useState({
    level: '',
    levelName: '',
    coinThreshold: ''
  })

  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && levelData) {
      setFormData({
        level: levelData.level,
        levelName: levelData.levelName,
        coinThreshold: levelData.coinThreshold
      })
      setPreview(getFullImageUrl(levelData.levelImage))
    }
  }, [levelData, mode])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleFileChange = e => {
    const file = e.target.files[0]

    if (file) {
      setImageFile(file)
      setPreview(URL.createObjectURL(file))
      setErrors(prev => ({ ...prev, levelImage: null }))
    }
  }

  const validate = () => {
    const errs = {}

    if (!formData.level) errs.level = 'Level is required'
    if (!formData.levelName.trim()) errs.levelName = 'Level name is required'
    if (!formData.coinThreshold) errs.coinThreshold = 'Coin threshold is required'
    if (!imageFile && mode === 'create') errs.levelImage = 'Image is required'
    setErrors(errs)

    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const body = new FormData()

    body.append('level', formData.level)
    body.append('levelName', formData.levelName)
    body.append('coinThreshold', formData.coinThreshold)
    if (imageFile) body.append('levelImage', imageFile)

    try {
      setLoading(true)

      if (mode === 'edit') {
        await dispatch(editWealthLevel({ id: levelData._id, formData: body })).unwrap()
      } else {
        await dispatch(createWealthLevel(body)).unwrap()
      }

      handleClose()
    } catch (err) {
      console.error(`${mode} error:`, err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ level: '', levelName: '', coinThreshold: '' })
    setImageFile(null)
    setPreview(null)
    setErrors({})
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={Transition}
      aria-labelledby='create-theme-dialog'
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
          {mode === 'edit' ? 'Edit Wealth Level' : 'Create Wealth Level'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4 py-4'>
        <TextField
          label='Level Number'
          type='number'
          fullWidth
          value={formData.level}
          error={!!errors.level}
          helperText={errors.level}
          onChange={e => handleChange('level', e.target.value)}
        />
        <TextField
          label='Level Name'
          fullWidth
          value={formData.levelName}
          error={!!errors.levelName}
          helperText={errors.levelName}
          onChange={e => handleChange('levelName', e.target.value)}
        />
        <TextField
          label='Coin Threshold'
          type='number'
          fullWidth
          value={formData.coinThreshold}
          error={!!errors.coinThreshold}
          helperText={errors.coinThreshold}
          onChange={e => handleChange('coinThreshold', e.target.value)}
        />
        <div>
          <StyledFileInput accept='.jpg,.jpeg,.png,.webp' label='Upload Level Image' onChange={handleFileChange} />
          {preview && (
            <img
              src={preview}
              alt='preview'
              className='mt-2 border rounded max-w-[200px] max-h-[100px] object-contain'
            />
          )}
          {errors.levelImage && (
            <Typography color='error' variant='caption'>
              {errors.levelImage}
            </Typography>
          )}
        </div>
      </DialogContent>

      <DialogActions className='justify-end px-6 pb-4'>
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

export default CreateEditWealthLevelDialog
