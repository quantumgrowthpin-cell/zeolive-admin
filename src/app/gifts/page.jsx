'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { Add, Delete, Edit } from '@mui/icons-material'

import {
  fetchGiftCategories,
  createGiftCategory,
  updateGiftCategory,
  deleteGiftCategory
} from '@/services/v2/giftCategories'
import { fetchGifts, createGift, updateGift, deleteGift } from '@/services/v2/gifts'
import { uploadImage } from '@/services/v2/uploads'
import { v2ApiBaseURL } from '@/util/config'
import { getFullImageUrl } from '@/util/commonfunctions'

const statusFilters = ['ALL', 'ACTIVE', 'INACTIVE']

const defaultGift = {
  name: '',
  categoryId: '',
  coinCost: '',
  giftType: 'IMAGE',
  assetUrl: '',
  isActive: true
}

const defaultCategory = { name: '' }
const giftTypes = [
  { value: 'IMAGE', label: 'Image' },
  { value: 'GIF', label: 'GIF' },
  { value: 'SVGA', label: 'SVGA' }
]

const formatTimestamp = value =>
  value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const getGiftType = gift =>
  (gift?.metadata?.giftType || (gift?.animationUrl ? 'GIF' : 'IMAGE')).toString().toUpperCase()
const getGiftAssetPath = gift => gift?.animationUrl || gift?.imageUrl || ''

const GiftsPage = () => {
  const [categories, setCategories] = useState([])
  const [gifts, setGifts] = useState([])
  const [filters, setFilters] = useState({ search: '', categoryId: 'ALL', status: 'ALL' })
  const [loading, setLoading] = useState(true)
  const [categoryDialog, setCategoryDialog] = useState({ open: false, data: null })
  const [giftDialog, setGiftDialog] = useState({ open: false, data: null })
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const loadCategories = async () => {
    const list = await fetchGiftCategories()

    setCategories(list)
  }

  const loadGifts = async () => {
    setLoading(true)
    setError(null)

    try {
      const list = await fetchGifts({
        search: filters.search || undefined,
        categoryId: filters.categoryId !== 'ALL' ? filters.categoryId : undefined,
        status: filters.status !== 'ALL' ? filters.status : undefined
      })

      setGifts(list)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load gifts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadGifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleDeleteGift = async gift => {
    if (!window.confirm(`Delete gift "${gift.name}"?`)) return
    await deleteGift(gift._id)
    setMessage('Gift removed')
    loadGifts()
  }

  const handleDeleteCategory = async category => {
    if (!window.confirm(`Delete category "${category.name}"?`)) return
    await deleteGiftCategory(category._id)
    setMessage('Category removed')
    loadCategories()
    loadGifts()
  }

  const filteredCategories = useMemo(() => {
    return [...categories].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [categories])

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant='h5'>Gifts & Effects</Typography>
        <Typography variant='body2' color='text.secondary'>
          Curate the gifts, animated effects, and categories available to users inside live rooms.
        </Typography>
      </Box>

      {message && (
        <Alert severity='success' onClose={() => setMessage(null)}>
          {message}
        </Alert>
      )}
      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction='row' justifyContent='space-between' alignItems='center' sx={{ mb: 2 }}>
            <div>
              <Typography variant='h6'>Categories</Typography>
              <Typography variant='body2' color='text.secondary'>
                Organize gifts into collections for easier discovery.
              </Typography>
            </div>
            <Button startIcon={<Add />} onClick={() => setCategoryDialog({ open: true, data: null })}>
              New Category
            </Button>
          </Stack>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCategories.map(category => (
                  <TableRow key={category._id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{formatTimestamp(category.createdAt)}</TableCell>
                    <TableCell>{formatTimestamp(category.updatedAt)}</TableCell>
                    <TableCell align='right'>
                      <IconButton size='small' onClick={() => setCategoryDialog({ open: true, data: category })}>
                        <Edit fontSize='inherit' />
                      </IconButton>
                      <IconButton size='small' onClick={() => handleDeleteCategory(category)}>
                        <Delete fontSize='inherit' />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredCategories.length && (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      No categories defined.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={2} sx={{ mb: 3 }}>
            <Stack spacing={1}>
              <Typography variant='h6'>Gifts</Typography>
              <Typography variant='body2' color='text.secondary'>
                Upload art, control pricing, and toggle availability per gift.
              </Typography>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                size='small'
                label='Search'
                value={filters.search}
                onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
              />
              <TextField
                size='small'
                select
                label='Category'
                value={filters.categoryId}
                onChange={event => setFilters(prev => ({ ...prev, categoryId: event.target.value }))}
              >
                <MenuItem value='ALL'>All</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size='small'
                select
                label='Status'
                value={filters.status}
                onChange={event => setFilters(prev => ({ ...prev, status: event.target.value }))}
              >
                {statusFilters.map(option => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <Button startIcon={<Add />} onClick={() => setGiftDialog({ open: true, data: null })}>
                New Gift
              </Button>
            </Stack>
          </Stack>

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Gift</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Coins</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gifts.map(gift => {
                  const giftType = getGiftType(gift)
                  const assetPath = getGiftAssetPath(gift)
                  return (
                    <TableRow key={gift._id} hover>
                      <TableCell>
                        <Typography fontWeight={600}>{gift.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          ID: {gift._id}
                        </Typography>
                      </TableCell>
                      <TableCell>{gift.categoryId?.name || 'Uncategorized'}</TableCell>
                      <TableCell>
                        <Chip size='small' label={giftType} />
                      </TableCell>
                      <TableCell>{gift.coinCost?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        {assetPath ? (
                          <Box
                            component='img'
                            src={getFullImageUrl(assetPath)}
                            alt={gift.name}
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: 1,
                              objectFit: 'cover',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          />
                        ) : (
                          <Typography variant='caption' color='text.secondary'>
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size='small'
                          label={gift.isActive ? 'Active' : 'Hidden'}
                          color={gift.isActive ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' onClick={() => setGiftDialog({ open: true, data: gift })}>
                          <Edit fontSize='inherit' />
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDeleteGift(gift)}>
                          <Delete fontSize='inherit' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!gifts.length && (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
                      {loading ? 'Loading gifts...' : 'No gifts found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <GiftDialog
        open={giftDialog.open}
        onClose={() => setGiftDialog({ open: false, data: null })}
        onSubmit={async payload => {
          if (giftDialog.data) {
            await updateGift(giftDialog.data._id, payload)
            setMessage('Gift updated')
          } else {
            await createGift(payload)
            setMessage('Gift created')
          }

          setGiftDialog({ open: false, data: null })
          loadGifts()
        }}
        initialData={giftDialog.data}
        categories={categories}
      />

      <CategoryDialog
        open={categoryDialog.open}
        onClose={() => setCategoryDialog({ open: false, data: null })}
        onSubmit={async values => {
          if (categoryDialog.data) {
            await updateGiftCategory(categoryDialog.data._id, values)
            setMessage('Category updated')
          } else {
            await createGiftCategory(values)
            setMessage('Category created')
          }

          setCategoryDialog({ open: false, data: null })
          loadCategories()
          loadGifts()
        }}
        initialData={categoryDialog.data}
      />
    </Stack>
  )
}

const CategoryDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(initialData?.name || '')
  }, [initialData])

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Category name is required')
      return
    }
    setSaving(true)
    try {
      await onSubmit({ name: name.trim() })
      onClose()
    } catch (error) {
      alert(error?.response?.data?.message || error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
      <DialogTitle>{initialData ? 'Edit Category' : 'New Category'}</DialogTitle>
      <DialogContent sx={{ mt: 1 }}>
        <TextField label='Category Name' fullWidth value={name} onChange={event => setName(event.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSubmit} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const GiftDialog = ({ open, onClose, onSubmit, initialData, categories }) => {
  const [form, setForm] = useState(defaultGift)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      const type = getGiftType(initialData)
      const assetPath = getGiftAssetPath(initialData)
      setForm({
        name: initialData.name || '',
        categoryId: initialData.categoryId?._id || '',
        coinCost: initialData.coinCost ?? '',
        giftType: type,
        assetUrl: assetPath,
        isActive: initialData.isActive ?? true
      })
      setPreviewUrl(getFullImageUrl(assetPath))
    } else {
      setForm(defaultGift)
      setPreviewUrl('')
    }
    setFile(null)
  }, [initialData])

  const handleChange = event => {
    const { name, value } = event.target
    if (name === 'isActive') {
      setForm(prev => ({ ...prev, isActive: value === 'true' }))
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setFile(null)
      setPreviewUrl(getFullImageUrl(form.assetUrl))
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert('Gift name is required')
      return
    }
    if (!form.categoryId) {
      alert('Please select a category')
      return
    }
    if (!form.coinCost) {
      alert('Coin value is required')
      return
    }
    if (!form.assetUrl && !file) {
      alert('Upload an asset for this gift')
      return
    }

    setSaving(true)
    try {
      let assetPath = form.assetUrl
      if (file) {
        const uploaded = await uploadImage(file)
        assetPath = uploaded?.url || assetPath
      }
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId,
        coinCost: Number(form.coinCost) || 0,
        cashCost: 0,
        rarity: 'COMMON',
        isLucky: false,
        isActive: form.isActive,
        metadata: { giftType: form.giftType },
        imageUrl: form.giftType === 'IMAGE' ? assetPath : '',
        animationUrl: form.giftType !== 'IMAGE' ? assetPath : ''
      }
      await onSubmit(payload)
      onClose()
    } catch (error) {
      alert(error?.response?.data?.message || error.message || 'Unable to save gift')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{initialData ? 'Edit Gift' : 'New Gift'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField label='Gift Name' name='name' value={form.name} onChange={handleChange} />
        <TextField select label='Category' name='categoryId' value={form.categoryId} onChange={handleChange}>
          <MenuItem value=''>Select category</MenuItem>
          {categories.map(category => (
            <MenuItem key={category._id} value={category._id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label='Coins'
            name='coinCost'
            type='number'
            value={form.coinCost}
            onChange={handleChange}
            fullWidth
          />
          <TextField select label='Gift Type' name='giftType' value={form.giftType} onChange={handleChange} fullWidth>
            {giftTypes.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack spacing={1}>
          <Typography variant='body2'>Upload Asset</Typography>
          <Button variant='outlined' component='label'>
            {file ? 'Change File' : 'Choose File'}
            <input hidden accept='.jpg,.jpeg,.png,.webp,.gif,.svga' type='file' onChange={handleFileChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .webp{form.giftType !== 'IMAGE' ? ', .gif, .svga' : ''}
          </Typography>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='Gift preview'
              sx={{
                width: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
          )}
        </Stack>
        <TextField
          select
          label='Status'
          name='isActive'
          value={form.isActive ? 'true' : 'false'}
          onChange={handleChange}
        >
          <MenuItem value='true'>Active</MenuItem>
          <MenuItem value='false'>Inactive</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSubmit} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GiftsPage
