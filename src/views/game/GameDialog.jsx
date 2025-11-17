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
  Grid
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import { addGame, updateGame } from '@/redux-store/slices/settings'
import { getFullImageUrl } from '@/util/commonfunctions'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const GameDialog = ({ open, onClose, mode = 'create', game = null, settingId = null }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector(state => state.settings)

  const [formData, setFormData] = useState({
    name: '',
    link: '',
    minWinPercent: '',
    maxWinPercent: ''
  })

  const [file, setFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (mode === 'edit' && game) {
      setFormData({
        name: game.name || '',
        link: game.link || '',
        minWinPercent: game.minWinPercent || '',
        maxWinPercent: game.maxWinPercent || ''
      })
      setExistingImageUrl(game.image || '')
    } else {
      setFormData({
        name: '',
        link: '',
        minWinPercent: '',
        maxWinPercent: ''
      })
      setExistingImageUrl(null)
    }

    setFile(null)
    setErrors({})
  }, [mode, game, open])

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

  const validate = () => {
    const newErrors = {}

    if (!formData.name) newErrors.name = 'Enter game name'

    if (!formData.link) {
      newErrors.link = 'Enter game link'
    } else {
      const urlPattern = /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/

      if (!urlPattern.test(formData.link)) {
        newErrors.link = 'Enter a valid URL (e.g., https://example.com)'
      }
    }

    if (!formData.minWinPercent || formData.minWinPercent < 0 || formData.minWinPercent > 100) {
      newErrors.minWinPercent = 'Enter a valid percentage (0-100)'
    }

    if (!formData.maxWinPercent || formData.maxWinPercent < 0 || formData.maxWinPercent > 100) {
      newErrors.maxWinPercent = 'Enter a valid percentage (0-100)'
    }

    if (Number(formData.minWinPercent) > Number(formData.maxWinPercent)) {
      newErrors.minWinPercent = 'Min percentage cannot be greater than max'
    }

    if (!file && mode === 'create') newErrors.file = 'Please upload a game image'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const body = new FormData()

    body.append('name', formData.name)
    body.append('link', formData.link)
    body.append('minWinPercent', formData.minWinPercent)
    body.append('maxWinPercent', formData.maxWinPercent)
    body.append('settingId', settingId)

    if (file) {
      body.append('image', file)
    }

    try {
      if (mode === 'edit') {
        body.append('gameId', game._id)
        await dispatch(updateGame(body)).unwrap()
      } else {
        await dispatch(addGame(body)).unwrap()
      }

      onClose()
    } catch (err) {
      console.error('Game save failed:', err)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      link: '',
      minWinPercent: '',
      maxWinPercent: ''
    })
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
      fullWidth
      maxWidth='sm'
      PaperProps={{
        sx: {
          overflow: 'visible'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {mode === 'edit' ? 'Edit Game' : 'Add New Game'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4 py-4'>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label='Game Name'
              type='text'
              fullWidth
              value={formData.name}
              error={!!errors.name}
              helperText={errors.name}
              onChange={e => handleChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label='Game Link'
              type='text'
              fullWidth
              value={formData.link}
              error={!!errors.link}
              helperText={errors.link}
              onChange={e => handleChange('link', e.target.value)}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Min Win Percent'
              type='number'
              fullWidth
              value={formData.minWinPercent}
              error={!!errors.minWinPercent}
              helperText={errors.minWinPercent}
              onChange={e => handleChange('minWinPercent', e.target.value)}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Max Win Percent'
              type='number'
              fullWidth
              value={formData.maxWinPercent}
              error={!!errors.maxWinPercent}
              helperText={errors.maxWinPercent}
              onChange={e => handleChange('maxWinPercent', e.target.value)}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
          <Grid item xs={12}>
            <StyledFileInput
              accept='.jpg,.jpeg,.png,.webp'
              label='Upload Game Image'
              onChange={handleFileChange}
              required={mode === 'create'}
            />
            {errors.file && <FormHelperText error>{errors.file}</FormHelperText>}
          </Grid>
        </Grid>

        {(file || existingImageUrl) && (
          <div className='mt-2'>
            <img
              src={file ? URL.createObjectURL(file) : getFullImageUrl(existingImageUrl)}
              alt='Game preview'
              className='rounded border border-gray-300 max-w-[200px] max-h-[100px] object-contain'
            />
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='tonal' color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GameDialog
