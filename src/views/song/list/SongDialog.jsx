'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'

// Store Imports
import { createSong, updateSong, fetchCategories } from '@/redux-store/slices/songs'

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

const SongDialog = ({ open, onClose, editData }) => {
  // States
  const [formData, setFormData] = useState({
    singerName: '',
    songTitle: '',
    songCategoryId: '',
    songTime: 0
  })

  const [songFile, setSongFile] = useState(null)
  const [songImage, setSongImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Redux
  const dispatch = useDispatch()
  const { categories } = useSelector(state => state.songs)

  // Effects
  useEffect(() => {
    // Fetch categories if not already loaded
    if (categories.length === 0) {
      dispatch(fetchCategories({ start: 1, limit: 100 }))
    }
  }, [dispatch, categories.length])

  useEffect(() => {
    if (editData) {
      setFormData({
        singerName: editData.singerName,
        songTitle: editData.songTitle,
        songCategoryId: editData.songCategoryId._id,
        songTime: editData.songTime
      })
      setPreviewImage(getFullImageUrl(editData.songImage))
    } else {
      resetForm()
    }
  }, [editData])

  // Handlers
  const resetForm = () => {
    setFormData({
      singerName: '',
      songTitle: '',
      songCategoryId: '',
      songTime: 0
    })
    setSongFile(null)
    setSongImage(null)
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
      setSongImage(file)
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSongFileChange = async e => {
    const file = e.target.files[0]

    if (file) {
      setSongFile(file)

      // Get song duration
      const audio = new Audio()

      audio.src = URL.createObjectURL(file)

      audio.onloadedmetadata = () => {
        setFormData(prev => ({
          ...prev,
          songTime: audio.duration
        }))
      }
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const submitFormData = new FormData()

      Object.entries(formData).forEach(([key, value]) => {
        submitFormData.append(key, value)
      })

      if (songImage) {
        submitFormData.append('songImage', songImage)
      }

      if (songFile) {
        submitFormData.append('songLink', songFile)
      }

      if (editData) {
        submitFormData.append('songId', editData._id)
        await dispatch(updateSong(submitFormData)).unwrap()
      } else {
        await dispatch(createSong(submitFormData)).unwrap()
      }

      handleClose()
    } catch (error) {
      console.error('Failed to save song:', error)
      setError(error.toString())
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = () => {
    return formData.singerName && formData.songTitle && formData.songCategoryId && (editData || (songFile && songImage))
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{editData ? 'Edit Song' : 'Add New Song'}</DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-5 mt-4'>
          <div className='flex flex-col items-center gap-4'>
            <CustomAvatar
              src={previewImage}
              variant='rounded'
              size={100}
              alt={formData.songTitle}
              className='border-2 border-borderPrimary'
            />
            <Button component='label' variant='contained' className='relative'>
              Upload Image
              <VisuallyHiddenInput type='file' accept='image/*' onChange={handleImageChange} />
            </Button>
          </div>

          <CustomTextField
            fullWidth
            label='Song Title'
            value={formData.songTitle}
            onChange={e => setFormData(prev => ({ ...prev, songTitle: e.target.value }))}
          />

          <CustomTextField
            fullWidth
            label='Singer Name'
            value={formData.singerName}
            onChange={e => setFormData(prev => ({ ...prev, singerName: e.target.value }))}
          />

          <CustomTextField
            select
            fullWidth
            label='Category'
            value={formData.songCategoryId}
            onChange={e => setFormData(prev => ({ ...prev, songCategoryId: e.target.value }))}
          >
            {categories.map(category => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </CustomTextField>

          <Button component='label' variant='outlined' fullWidth>
            {songFile ? songFile.name : 'Upload Song File'}
            <VisuallyHiddenInput type='file' accept='audio/*' onChange={handleSongFileChange} />
          </Button>

          {error && <div className='text-error text-sm mt-2'>{error}</div>}
        </div>
      </DialogContent>
      <DialogActions className='p-6 pt-0'>
        <Button variant='outlined' onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          startIcon={loading && <CircularProgress className='text-white' size={20} />}
        >
          {editData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SongDialog
