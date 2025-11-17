'use client'

import { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { Add, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material'

import { listBanners, createBanner, updateBanner, toggleBanner, deleteBanner } from '@/services/v2/banners'
import { uploadImage } from '@/services/v2/uploads'
import { getFullImageUrl } from '@/util/commonfunctions'

const bannerTypes = [
  { value: 1, label: 'Live Stream Banner', description: 'For promoting streamers/events on live tab.' },
  { value: 2, label: 'Profile Banner', description: 'For showcasing in user profiles.' },
  { value: 3, label: 'Home Carousel', description: 'Top-of-feed promo on the home tab.' },
  { value: 4, label: 'Game Spotlight', description: 'Highlights events in the games hub.' }
]

const BannersPage = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogState, setDialogState] = useState({ open: false, banner: null })
  const [submitting, setSubmitting] = useState(false)
  const [filters, setFilters] = useState({ bannerType: 'ALL' })

  const loadBanners = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {}
      if (filters.bannerType !== 'ALL') {
        params.bannerType = filters.bannerType
      }
      const data = await listBanners(params)

      setBanners(data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBanners()
  }, [filters])

  const handleDelete = async bannerId => {
    if (!window.confirm('Delete this banner?')) return
    setSubmitting(true)

    try {
      await deleteBanner(bannerId)
      await loadBanners()
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async bannerId => {
    setSubmitting(true)

    try {
      await toggleBanner(bannerId)
      await loadBanners()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-bs-[60dvh]'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
        alignItems={{ md: 'center' }}
      >
        <div>
          <Typography variant='h5'>Banners</Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage the promotional assets shown on the home screen and events.
          </Typography>
        </div>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            select
            size='small'
            label='Placement'
            value={filters.bannerType}
            onChange={event => setFilters(prev => ({ ...prev, bannerType: event.target.value }))}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value='ALL'>All placements</MenuItem>
            {bannerTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                {type.label}
              </MenuItem>
            ))}
          </TextField>
          <Button startIcon={<Add />} variant='contained' onClick={() => setDialogState({ open: true, banner: null })}>
            New Banner
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Card>
          <CardContent>
            <Typography color='error'>{error}</Typography>
          </CardContent>
        </Card>
      )}

      <TableContainer component={Card}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Preview</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Redirect</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.map(banner => (
              <TableRow key={banner._id} hover>
                <TableCell width={140}>
                  {banner.imageUrl ? (
                    <Box
                      component='img'
                      src={getFullImageUrl(banner.imageUrl)}
                      alt={banner.title || 'Banner asset'}
                      sx={{
                        width: '100%',
                        height: 72,
                        objectFit: 'cover',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider'
                      }}
                    />
                  ) : (
                    <Typography variant='caption' color='text.secondary'>
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell width={220}>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{banner.title || 'Untitled'}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {getFullImageUrl(banner.imageUrl)}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>
                  {bannerTypes.find(type => type.value === banner.bannerType)?.label || banner.bannerType}
                </TableCell>
                <TableCell>
                  <Typography variant='caption' sx={{ wordBreak: 'break-all' }}>
                    {banner.redirectUrl || '—'}
                  </Typography>
                </TableCell>
                <TableCell>{banner.isActive ? 'ACTIVE' : 'INACTIVE'}</TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <IconButton size='small' onClick={() => setDialogState({ open: true, banner })}>
                      <Edit fontSize='inherit' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleToggle(banner._id)} disabled={submitting}>
                      {banner.isActive ? <VisibilityOff fontSize='inherit' /> : <Visibility fontSize='inherit' />}
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(banner._id)}
                      disabled={submitting}
                    >
                      <Delete fontSize='inherit' />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!banners.length && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant='body2'>No banners configured yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <BannerDialog
        open={dialogState.open}
        banner={dialogState.banner}
        onClose={() => setDialogState({ open: false, banner: null })}
        onSubmit={async payload => {
          setSubmitting(true)

          try {
            if (dialogState.banner?._id) {
              await updateBanner(dialogState.banner._id, payload)
            } else {
              await createBanner(payload)
            }

            setDialogState({ open: false, banner: null })
            await loadBanners()
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </Stack>
  )
}

const BannerDialog = ({ open, banner, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    title: '',
    bannerType: 1,
    redirectUrl: '',
    isActive: true
  })
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (banner) {
      setForm({
        title: banner.title || '',
        bannerType: banner.bannerType || 1,
        redirectUrl: banner.redirectUrl || '',
        isActive: banner.isActive ?? true
      })
      setPreviewUrl(getFullImageUrl(banner.imageUrl))
      setFile(null)
    } else {
      setForm({ title: '', bannerType: 1, redirectUrl: '', isActive: true })
      setPreviewUrl('')
      setFile(null)
    }
  }, [banner])

  const handleChange = field => event => {
    const value = field === 'isActive' ? event.target.value === 'true' : event.target.value
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setFile(null)
      setPreviewUrl(banner ? getFullImageUrl(banner.imageUrl) : '')
    }
  }

  const handleSubmit = async () => {
    if (!file && !banner) {
      alert('Please upload an image')
      return
    }

    const payload = new FormData()
    payload.append('title', form.title)
    payload.append('bannerType', form.bannerType)
    payload.append('redirectUrl', form.redirectUrl)
    payload.append('isActive', form.isActive)
    if (file) {
      payload.append('image', file)
    }

    await onSubmit(payload)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{banner ? 'Edit Banner' : 'Create Banner'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label='Title' value={form.title} onChange={handleChange('title')} />
          <Button variant='outlined' component='label'>
            {file ? 'Change Image' : 'Upload Image'}
            <input hidden type='file' accept='image/*' onChange={handleFileChange} />
          </Button>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='Banner preview'
              sx={{
                width: '100%',
                height: 180,
                objectFit: 'cover',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider'
              }}
            />
          )}
          <TextField label='Redirect URL' value={form.redirectUrl} onChange={handleChange('redirectUrl')} />
          <TextField
            label='Placement'
            select
            value={form.bannerType}
            onChange={handleChange('bannerType')}
            helperText={bannerTypes.find(type => type.value === form.bannerType)?.description}
          >
            {bannerTypes.map(type => (
              <MenuItem key={type.value} value={type.value}>
                <Box>
                  <Typography fontWeight={600} variant='body2'>
                    {type.label}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {type.description}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField label='Status' select value={String(form.isActive)} onChange={handleChange('isActive')}>
            <MenuItem value='true'>Active</MenuItem>
            <MenuItem value='false'>Inactive</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSubmit}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BannersPage
