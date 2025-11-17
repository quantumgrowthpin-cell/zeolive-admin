'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
import { Add, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material'

import {
  fetchGameConfigs,
  createGameConfig,
  updateGameConfig,
  toggleGameConfig,
  deleteGameConfig
} from '@/services/v2/games'
import { uploadImage } from '@/services/v2/uploads'
import { v2ApiBaseURL } from '@/util/config'
import { getFullImageUrl } from '@/util/commonfunctions'

const statusOptions = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' }
]

const providerOptions = [{ value: 'IN_HOUSE', label: 'In-house' }]

const defaultForm = {
  key: '',
  displayName: '',
  provider: 'IN_HOUSE',
  launchUrl: '',
  iconUrl: '',
  minCoins: '',
  maxCoins: '',
  sortOrder: 0,
  isActive: true,
  metadataJson: ''
}

const GamesPage = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ status: 'ALL', search: '' })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGame, setEditingGame] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const loadGames = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = {}
      if (filters.status !== 'ALL') {
        params.isActive = filters.status === 'ACTIVE'
      }
      if (filters.search.trim()) {
        params.search = filters.search.trim()
      }

      const data = await fetchGameConfigs(params)
      setGames(data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to load games')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.search])

  const summary = useMemo(() => {
    const total = games.length
    const active = games.filter(game => game.isActive).length
    const disabled = total - active
    return { total, active, disabled }
  }, [games])

  const handleCreate = () => {
    setEditingGame(null)
    setDialogOpen(true)
  }

  const handleEdit = game => {
    setEditingGame(game)
    setDialogOpen(true)
  }

  const handleSave = async payload => {
    try {
      if (editingGame) {
        await updateGameConfig(editingGame._id, payload)
      } else {
        await createGameConfig(payload)
      }
      setDialogOpen(false)
      setEditingGame(null)
      await loadGames()
    } catch (err) {
      throw err
    }
  }

  const handleToggle = async game => {
    setActionLoading(game._id)
    try {
      await toggleGameConfig(game._id, !game.isActive)
      await loadGames()
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async gameId => {
    if (!window.confirm('Delete this game configuration?')) return
    setActionLoading(gameId)
    try {
      await deleteGameConfig(gameId)
      await loadGames()
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

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        spacing={2}
        alignItems={{ md: 'center' }}
      >
        <div>
          <Typography variant='h5'>Games</Typography>
          <Typography variant='body2' color='text.secondary'>
            Configure in-house games (casino, ferry wheel, teen patti) and control their availability within the app.
          </Typography>
        </div>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            select
            size='small'
            label='Status'
            value={filters.status}
            onChange={event => setFilters(prev => ({ ...prev, status: event.target.value }))}
            sx={{ minWidth: 160 }}
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size='small'
            label='Search'
            placeholder='Search by name or key'
            value={filters.search}
            onChange={event => setFilters(prev => ({ ...prev, search: event.target.value }))}
            sx={{ minWidth: 220 }}
          />
          <Button startIcon={<Add />} variant='contained' onClick={handleCreate}>
            New Game
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity='error'>
          {error}
          <Button color='inherit' size='small' sx={{ ml: 2 }} onClick={loadGames}>
            Retry
          </Button>
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SummaryCard label='Total Games' value={summary.total} />
        <SummaryCard label='Active' value={summary.active} />
        <SummaryCard label='Disabled' value={summary.disabled} />
      </Stack>

      <TableContainer component={Card}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Coin Range</TableCell>
              <TableCell>Launch URL</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games.map(game => (
              <TableRow key={game._id} hover>
                <TableCell width={80}>
                  {game.iconUrl ? (
                    <Box
                      component='img'
                      src={getFullImageUrl(game.iconUrl)}
                      alt={game.displayName}
                      sx={{
                        width: 56,
                        height: 56,
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
                <TableCell width={220}>
                  <Stack spacing={0.25}>
                    <Typography fontWeight={600}>{game.displayName}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      key: {game.key}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      sort:{game.sortOrder ?? 0}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell>{game.provider || 'IN_HOUSE'}</TableCell>
                <TableCell>
                  {formatCoins(game.minCoins)} – {formatCoins(game.maxCoins)}
                </TableCell>
                <TableCell>
                  <Typography variant='caption' sx={{ wordBreak: 'break-all' }}>
                    {game.launchUrl}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={game.isActive ? 'Active' : 'Disabled'}
                    color={game.isActive ? 'success' : 'default'}
                    size='small'
                  />
                </TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <IconButton size='small' onClick={() => handleEdit(game)}>
                      <Edit fontSize='inherit' />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleToggle(game)} disabled={actionLoading === game._id}>
                      {game.isActive ? <VisibilityOff fontSize='inherit' /> : <Visibility fontSize='inherit' />}
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(game._id)}
                      disabled={actionLoading === game._id}
                    >
                      <Delete fontSize='inherit' />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {games.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography align='center' color='text.secondary'>
                    No games found for the selected filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <GameDialog
        open={dialogOpen}
        initialData={editingGame}
        onClose={() => {
          setDialogOpen(false)
          setEditingGame(null)
        }}
        onSubmit={handleSave}
      />
    </Stack>
  )
}

const GameDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (initialData) {
      setForm({
        key: initialData.key || '',
        displayName: initialData.displayName || '',
        provider: initialData.provider || 'IN_HOUSE',
        launchUrl: initialData.launchUrl || '',
        iconUrl: initialData.iconUrl || '',
        minCoins: initialData.minCoins ?? '',
        maxCoins: initialData.maxCoins ?? '',
        sortOrder: initialData.sortOrder ?? 0,
        isActive: initialData.isActive ?? true,
        metadataJson: initialData.metadata ? JSON.stringify(initialData.metadata, null, 2) : ''
      })
    } else {
      setForm(defaultForm)
    }
    setError(null)
    setSubmitting(false)
  }, [initialData, open])

  const handleChange = event => {
    const { name, value } = event.target
    if (name === 'isActive') {
      setForm(prev => ({ ...prev, isActive: value === 'true' }))
      return
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleUpload = async event => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const uploaded = await uploadImage(file)
      setForm(prev => ({ ...prev, iconUrl: uploaded?.url || uploaded?.path || prev.iconUrl }))
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to upload icon')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!form.displayName.trim()) {
      setError('Display name is required')
      return
    }
    if (!form.key.trim()) {
      setError('Game key is required')
      return
    }
    if (!form.launchUrl.trim()) {
      setError('Launch URL is required')
      return
    }

    let metadata = {}
    if (form.metadataJson && form.metadataJson.trim()) {
      try {
        metadata = JSON.parse(form.metadataJson)
      } catch (err) {
        setError('Metadata must be valid JSON')
        return
      }
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        key: form.key.trim(),
        displayName: form.displayName.trim(),
        provider: form.provider,
        launchUrl: form.launchUrl.trim(),
        iconUrl: form.iconUrl,
        minCoins: Number(form.minCoins) || 0,
        maxCoins: Number(form.maxCoins) || 0,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
        metadata
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Unable to save game')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{initialData ? 'Edit Game' : 'Create Game'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label='Display Name'
            name='displayName'
            value={form.displayName}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label='Key'
            name='key'
            value={form.key}
            onChange={handleChange}
            fullWidth
            InputProps={{ readOnly: Boolean(initialData) }}
          />
        </Stack>
        <TextField select label='Provider' name='provider' value={form.provider} onChange={handleChange}>
          {providerOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField label='Launch URL' name='launchUrl' value={form.launchUrl} onChange={handleChange} />
        <Stack spacing={1}>
          <Typography variant='body2'>Icon</Typography>
          <Stack direction='row' spacing={2} alignItems='center'>
            <Button variant='outlined' component='label' disabled={uploading}>
              {form.iconUrl ? 'Replace Icon' : 'Upload Icon'}
              <input hidden type='file' accept='.jpg,.jpeg,.png,.webp,.gif' onChange={handleUpload} />
            </Button>
            {form.iconUrl && (
              <Box
                component='img'
                src={getFullImageUrl(form.iconUrl)}
                alt='Game icon preview'
                sx={{
                  width: 56,
                  height: 56,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              />
            )}
          </Stack>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .webp, .gif
          </Typography>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label='Min Coins'
            name='minCoins'
            type='number'
            value={form.minCoins}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label='Max Coins'
            name='maxCoins'
            type='number'
            value={form.maxCoins}
            onChange={handleChange}
            fullWidth
          />
        </Stack>
        <TextField label='Sort Order' name='sortOrder' type='number' value={form.sortOrder} onChange={handleChange} />
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
        <TextField
          label='Metadata (JSON)'
          name='metadataJson'
          value={form.metadataJson}
          onChange={handleChange}
          multiline
          minRows={3}
          placeholder='e.g. { "entryType": "CASINO" }'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          {initialData ? 'Save Changes' : 'Create Game'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const SummaryCard = ({ label, value }) => (
  <Card sx={{ minWidth: 180 }}>
    <CardContent>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='h6'>{value ?? 0}</Typography>
    </CardContent>
  </Card>
)

const formatCoins = value => {
  if (!value) return '0'
  return Number(value).toLocaleString()
}

export default GamesPage
