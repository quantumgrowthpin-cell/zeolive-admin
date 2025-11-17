'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Box,
  Button,
  Chip,
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
import { Edit, Delete } from '@mui/icons-material'

import {
  fetchStoreItems,
  createStoreItem,
  updateStoreItem,
  toggleStoreItem,
  deleteStoreItem
} from '@/services/v2/storeItems'
import { uploadImage } from '@/services/v2/uploads'
import { v2ApiBaseURL } from '@/util/config'
import { getFullImageUrl } from '@/util/commonfunctions'

const itemTypes = ['FRAME', 'THEME', 'RIDE', 'VIP']
const assetTypes = [
  { value: 'IMAGE', label: 'Image' },
  { value: 'GIF', label: 'GIF' },
  { value: 'SVGA', label: 'SVGA' }
]

const defaultForm = {
  name: '',
  type: 'FRAME',
  assetType: 'IMAGE',
  assetUrl: '',
  priceCoins: '',
  isActive: true
}

const getAssetTypeFromItem = item =>
  (item?.metadata?.assetType || (item?.assetUrl?.toLowerCase?.().endsWith('.gif') ? 'GIF' : 'IMAGE')).toUpperCase()

const ItemDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(defaultForm)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || '',
        type: initialData.type || 'FRAME',
        assetType: getAssetTypeFromItem(initialData),
        assetUrl: initialData.assetUrl || '',
        priceCoins: initialData.priceCoins ?? '',
        isActive: initialData.isActive ?? true
      })
      setPreviewUrl(getFullImageUrl(initialData.assetUrl))
    } else {
      setForm(defaultForm)
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
      alert('Name is required')
      return
    }
    if (!form.priceCoins || Number(form.priceCoins) <= 0) {
      alert('Coins are required')
      return
    }
    if (!form.assetUrl && !file) {
      alert('Please upload an asset')
      return
    }

    setSubmitting(true)

    try {
      let assetPath = form.assetUrl
      if (file) {
        const uploaded = await uploadImage(file)
        assetPath = uploaded?.url || assetPath
      }
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        assetType: form.assetType,
        assetUrl: assetPath,
        priceCoins: Number(form.priceCoins) || 0,
        isActive: form.isActive
      })
      onClose()
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Unable to save store item')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{initialData ? 'Edit Store Item' : 'Create Store Item'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField label='Name' name='name' value={form.name} onChange={handleChange} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField select label='Item Type' name='type' value={form.type} onChange={handleChange} fullWidth>
            {itemTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label='Asset Type'
            name='assetType'
            value={form.assetType}
            onChange={handleChange}
            fullWidth
          >
            {assetTypes.map(option => (
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
            <input hidden type='file' accept='.jpg,.jpeg,.png,.webp,.gif,.svga' onChange={handleFileChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .webp{form.assetType !== 'IMAGE' ? ', .gif, .svga' : ''}
          </Typography>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='Store item preview'
              sx={{
                width: '100%',
                maxHeight: 220,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
          )}
        </Stack>
        <TextField
          label='Price (Coins)'
          name='priceCoins'
          type='number'
          value={form.priceCoins}
          onChange={handleChange}
        />
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
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const StoreItemsPage = () => {
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const loadItems = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchStoreItems({ type: typeFilter !== 'ALL' ? typeFilter : undefined })

      setItems(data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load store items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  const filteredItems = useMemo(() => {
    if (!search) return items
    const query = search.toLowerCase()

    return items.filter(item => {
      const assetType = getAssetTypeFromItem(item).toLowerCase()
      return (
        item.name?.toLowerCase().includes(query) ||
        item.type?.toLowerCase().includes(query) ||
        assetType.includes(query)
      )
    })
  }, [items, search])

  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.coins += Number(item.priceCoins || 0)
        acc.active += item.isActive ? 1 : 0

        return acc
      },
      { coins: 0, active: 0 }
    )
  }, [filteredItems])

  const handleCreate = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const handleEdit = item => {
    setEditingItem({
      ...item,
      assetType: getAssetTypeFromItem(item)
    })
    setDialogOpen(true)
  }

  const handleSave = async payload => {
    const request = {
      name: payload.name,
      type: payload.type,
      assetUrl: payload.assetUrl,
      priceCoins: payload.priceCoins,
      priceCash: 0,
      durationDays: 0,
      isActive: payload.isActive,
      metadata: { assetType: payload.assetType }
    }
    if (editingItem) {
      await updateStoreItem(editingItem._id, request)
    } else {
      await createStoreItem(request)
    }

    await loadItems()
  }

  const handleToggle = async itemId => {
    setActionLoading(itemId)

    try {
      await toggleStoreItem(itemId)
      await loadItems()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async itemId => {
    if (!window.confirm('Delete this store item?')) return
    setActionLoading(itemId)

    try {
      await deleteStoreItem(itemId)
      await loadItems()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Box className='flex justify-center items-center min-bs-[60dvh]'>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <Typography color='error'>{error}</Typography>
        <Button variant='contained' onClick={loadItems}>
          Retry
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems='center' spacing={2}>
        <div>
          <Typography variant='h5'>Store Items</Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage frames, themes, rides, and VIP bundles served by backend-v2.
          </Typography>
        </div>
        <Stack direction='row' spacing={2}>
          <TextField
            label='Search items'
            value={search}
            onChange={event => setSearch(event.target.value)}
            size='small'
          />
          <TextField
            select
            label='Type'
            value={typeFilter}
            onChange={event => setTypeFilter(event.target.value)}
            size='small'
          >
            <MenuItem value='ALL'>All</MenuItem>
            {itemTypes.map(type => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <Button variant='contained' onClick={handleCreate}>
            Create
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SummaryCard label='Items' value={filteredItems.length} />
        <SummaryCard label='Active' value={totals.active} />
        <SummaryCard label='Total Coin Price' value={totals.coins.toLocaleString()} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Asset Type</TableCell>
              <TableCell>Price (Coins)</TableCell>
              <TableCell>Preview</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map(item => {
              const assetType = getAssetTypeFromItem(item)
              const previewUrl = getFullImageUrl(item.assetUrl)
              return (
                <TableRow key={item._id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{item.name}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {item._id}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <Chip label={assetType} size='small' />
                  </TableCell>
                  <TableCell>{item.priceCoins?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    {previewUrl ? (
                      <Box
                        component='img'
                        src={previewUrl}
                        alt={item.name}
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 1,
                          objectFit: 'cover',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.isActive ? 'Active' : 'Disabled'}
                      color={item.isActive ? 'success' : 'default'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <Stack direction='row' spacing={1} justifyContent='flex-end'>
                      <Button size='small' onClick={() => handleToggle(item._id)} disabled={actionLoading === item._id}>
                        {item.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <IconButton size='small' onClick={() => handleEdit(item)}>
                        <Edit fontSize='inherit' />
                      </IconButton>
                      <IconButton
                        size='small'
                        color='error'
                        onClick={() => handleDelete(item._id)}
                        disabled={actionLoading === item._id}
                      >
                        <Delete fontSize='inherit' />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
        initialData={editingItem}
      />
    </Stack>
  )
}

const SummaryCard = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 180 }}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='h6'>{value ?? '--'}</Typography>
  </Box>
)

export default StoreItemsPage
