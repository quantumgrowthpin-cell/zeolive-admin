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
  MenuItem,
  Typography,
  CircularProgress,
  FormHelperText,
  InputLabel,
  FormControl,
  Select
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import StyledFileInput from '@/@layouts/styles/inputs/StyledFileInput'
import SVGAPlayer from '@/components/SVGAPlayer'
import { createGift, updateGift, fetchGiftsCategories } from '@/redux-store/slices/gifts'
import { getFullImageUrl } from '@/util/commonfunctions'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const giftTypes = [
  { label: 'Image', value: 1 },
  { label: 'GIF', value: 2 },
  { label: 'SVGA', value: 3 }
]

const GiftDialog = ({
  open,
  onClose,
  mode = 'create',
  gift = null,
  giftCategoryId = null,
  allowCategorySelection = false,
  categories = []
}) => {
  const dispatch = useDispatch()
  const allCategories = useSelector(state => state.giftReducer.categories || [])
  const { loading: storeLoading } = useSelector(state => state.giftReducer)

  const [formData, setFormData] = useState({
    coin: '',
    type: 1,
    categoryId: giftCategoryId || '',
    title: ''
  })

  const [file, setFile] = useState(null)
  const [existingImageUrl, setExistingImageUrl] = useState(null)
  const [svgaThumbnail, setSvgaThumbnail] = useState(null)
  const [manualSvgaImage, setManualSvgaImage] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Fetch categories if they're not available
  useEffect(() => {
    if (allowCategorySelection && allCategories.length === 0) {
      dispatch(fetchGiftsCategories())
    }
  }, [allowCategorySelection, allCategories.length, dispatch])

  useEffect(() => {
    if (mode === 'edit' && gift) {
      setFormData({
        coin: gift.coin !== undefined ? gift.coin : '',
        type: gift.type !== undefined ? gift.type : 1,
        categoryId: gift.giftCategoryId || giftCategoryId || '',
        title: gift.title || ''
      })
      setExistingImageUrl(gift.image || '')
    } else {
      setFormData({
        coin: '',
        type: 1,
        categoryId: giftCategoryId || '',
        title: ''
      })
      setExistingImageUrl(null)
    }

    setFile(null)
    setSvgaThumbnail(null)
    setManualSvgaImage(null)
    setErrors({})
  }, [mode, gift, open, giftCategoryId])

  const handleChange = (field, value) => {
    // Ensure value is never undefined
    const safeValue = value === undefined ? '' : value

    setFormData(prev => ({ ...prev, [field]: safeValue }))
    setErrors(prev => ({ ...prev, [field]: null }))

    if (field === 'type') {
      setFile(null)
      setSvgaThumbnail(null)
      setManualSvgaImage(null)
      setExistingImageUrl(null)
    }
  }

  const handleFileChange = async e => {
    const selectedFile = e.target.files[0]

    if (!selectedFile) {
      return
    }

    setFile(selectedFile)
    setSvgaThumbnail(null)
    setManualSvgaImage(null)
    setErrors(prev => ({ ...prev, file: null })) // Clear file error when file is selected

    if (selectedFile && selectedFile.name.endsWith('.svga')) {
      try {
        const SVGALib = await import('svgaplayerweb')
        const fileURL = URL.createObjectURL(selectedFile)
        const canvas = document.createElement('canvas')

        canvas.width = 400
        canvas.height = 200
        document.body.appendChild(canvas)
        const parser = new SVGALib.Parser()
        const player = new SVGALib.Player(canvas)

        canvas.style.position = 'absolute'
        canvas.style.left = '-1000px'

        const videoItem = await new Promise((resolve, reject) => {
          parser.load(
            fileURL,
            videoItem => (videoItem ? resolve(videoItem) : reject(new Error('SVGA parsing failed'))),
            err => reject(err || new Error('SVGA parser error'))
          )
        })

        await player.setVideoItem(videoItem)

        let frameCount = 0

        const renderFrame = () => {
          player.stepToFrame(frameCount)
          frameCount++

          if (frameCount < 3) {
            setTimeout(renderFrame, 100)
          } else {
            canvas.toBlob(
              blob => {
                if (blob) {
                  const thumbnail = new File([blob], 'thumbnail.png', { type: 'image/png' })

                  setSvgaThumbnail(thumbnail)
                }

                document.body.removeChild(canvas)
              },
              'image/png',
              0.95
            )
          }
        }

        renderFrame()
      } catch (err) {
        console.error('SVGA preview error:', err)
      }
    }
  }

  const handleSvgaImageChange = e => {
    const selectedFile = e.target.files[0]

    if (selectedFile) {
      setManualSvgaImage(selectedFile)
      setErrors(prev => ({ ...prev, svgaImage: null }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.title) newErrors.title = 'Enter a name'

    if (!formData.coin || Number(formData.coin) <= 0) newErrors.coin = 'Enter a valid coin amount'

    if (!file && mode === 'create') newErrors.file = 'Please upload a file'

    // Add specific validation for category
    const categoryId = allowCategorySelection ? formData.categoryId : giftCategoryId

    if (!categoryId) newErrors.categoryId = 'Please select a category'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const body = new FormData()

    body.append('title', formData.title || '')
    body.append('coin', formData.coin || '')
    body.append('type', formData.type || 1)

    // Use either the predefined categoryId or the one from form
    const categoryId = allowCategorySelection ? formData.categoryId : giftCategoryId

    if (!categoryId) {
      setErrors(prev => ({ ...prev, categoryId: 'Category is required' }))

      return
    }

    body.append('giftCategoryId', categoryId)

    if (file) {
      body.append('image', file)

      if (formData.type === 3) {
        // Use manual SVGA image if available, otherwise use auto-generated thumbnail

        const svgaImageToUse = manualSvgaImage || svgaThumbnail

        if (svgaImageToUse) {
          body.append('svgaImage', svgaImageToUse)
        }
      }
    } else if (mode === 'create') {
      setErrors(prev => ({ ...prev, file: 'Please upload a file' }))

      return
    }

    try {
      setLoading(true)

      if (mode === 'edit') {
        body.append('giftId', gift._id)

        await dispatch(updateGift(body)).unwrap()
      } else {
        await dispatch(createGift(body)).unwrap()
      }

      onClose()
    } catch (err) {
      console.error('Gift save failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      coin: '',
      type: 1,
      categoryId: giftCategoryId || '',
      title: ''
    })
    setFile(null)
    setSvgaThumbnail(null)
    setManualSvgaImage(null)
    setExistingImageUrl(null)
    setErrors({})
    onClose()
  }

  // Determine which categories to use (directly provided or from redux)
  const categoriesForSelect = allowCategorySelection ? (categories.length > 0 ? categories : allCategories) : []

  const fileAccept = formData.type === 1 ? '.jpg,.jpeg,.png,.webp' : formData.type === 2 ? '.gif' : '.svga'

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
          overflow: 'visible',
          width: '600px',
          maxWidth: '95vw'
        }
      }}
    >
      <DialogTitle>
        <Typography variant='h5' component='span'>
          {mode === 'edit' ? 'Edit Gift' : 'Add New Gift'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4 py-4'>
        {/* Category dropdown - only show when allowCategorySelection is true */}
        {allowCategorySelection && (
          <FormControl fullWidth error={!!errors.categoryId}>
            <InputLabel id='category-select-label'>Category</InputLabel>
            <Select
              labelId='category-select-label'
              value={formData.categoryId || ''}
              label='Category'
              onChange={e => handleChange('categoryId', e.target.value)}
            >
              <MenuItem value='' disabled>
                Select a category
              </MenuItem>
              {categoriesForSelect.map(category => (
                <MenuItem key={category._id} value={category._id}>
                  {category.categoryName || category.name}
                </MenuItem>
              ))}
            </Select>
            {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
          </FormControl>
        )}

        <TextField
          label='Gift Name'
          type='text'
          fullWidth
          value={formData.title || ''}
          error={!!errors.title}
          helperText={errors.title}
          onChange={e => handleChange('title', e.target.value)}
        />

        <TextField
          label='Coins'
          type='number'
          fullWidth
          value={formData.coin || ''}
          error={!!errors.coin}
          helperText={errors.coin}
          onChange={e => handleChange('coin', e.target.value)}
        />
        <TextField
          label='Gift Type'
          select
          fullWidth
          value={formData.type || 1}
          onChange={e => handleChange('type', parseInt(e.target.value))}
        >
          {giftTypes.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <StyledFileInput
          accept={fileAccept}
          label={formData.type === 3 ? 'Upload SVGA File' : 'Upload Image/GIF'}
          onChange={handleFileChange}
          required={mode === 'create'}
        />

        {/* Manual SVGA Image Selection - only show when type is SVGA */}
        {formData.type === 3 && (
          <StyledFileInput
            accept='.jpg,.jpeg,.png,.webp'
            label='Upload SVGA Image (Optional)'
            onChange={handleSvgaImageChange}
            required={false}
          />
        )}

        {(file || existingImageUrl) && (
          <div className='mt-2 flex gap-4 items-start'>
            {formData.type === 3 ? (
              <>
                <div className='rounded border border-gray-300 p-2 bg-gray-50'>
                  <SVGAPlayer
                    url={file ? URL.createObjectURL(file) : getFullImageUrl(existingImageUrl)}
                    width={200}
                    height={100}
                  />
                </div>
                {(manualSvgaImage || svgaThumbnail) && (
                  <div className='flex flex-col gap-2'>
                    <img
                      src={manualSvgaImage ? URL.createObjectURL(manualSvgaImage) : URL.createObjectURL(svgaThumbnail)}
                      alt={manualSvgaImage ? 'Manual SVGA Image' : 'Auto-generated SVGA Thumbnail'}
                      className='rounded border border-gray-300 max-w-[200px] max-h-[100px] object-contain'
                    />
                    <Typography variant='caption' color='textSecondary'>
                      {manualSvgaImage ? 'Manual SVGA Image' : 'Auto-generated Thumbnail'}
                    </Typography>
                  </div>
                )}
              </>
            ) : (
              <img
                src={file ? URL.createObjectURL(file) : getFullImageUrl(existingImageUrl)}
                alt='preview'
                className='rounded border border-gray-300 max-w-[200px] max-h-[100px] object-contain'
              />
            )}
          </div>
        )}
        {errors.file && (
          <Typography color='error' variant='caption'>
            {errors.file}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='tonal' color='secondary' disabled={loading || storeLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading || storeLoading}>
          {loading || storeLoading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GiftDialog
