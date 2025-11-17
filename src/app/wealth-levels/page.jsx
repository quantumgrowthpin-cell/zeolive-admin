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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'

import {
  listWealthLevels,
  createWealthLevel,
  updateWealthLevel,
  updateWealthLevelPermissions,
  deleteWealthLevel
} from '@/services/v2/wealthLevels'
import { uploadImage } from '@/services/v2/uploads'
import { getFullImageUrl } from '@/util/commonfunctions'

const defaultForm = {
  level: '',
  levelName: '',
  coinThreshold: '',
  levelImage: ''
}

const defaultPermissions = {
  liveStreaming: true,
  freeCall: false,
  redeemCashout: false,
  uploadSocialPost: true,
  uploadVideo: true
}

const LevelDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(initialData || defaultForm)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        level: initialData.level ?? '',
        levelName: initialData.levelName || '',
        coinThreshold: initialData.coinThreshold ?? '',
        levelImage: initialData.levelImage || ''
      })
      setPreviewUrl(getFullImageUrl(initialData.levelImage))
    } else {
      setForm(defaultForm)
      setPreviewUrl('')
    }
    setFile(null)
  }, [initialData])

  const handleChange = event => {
    const { name, value } = event.target

    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setFile(null)
      setPreviewUrl(getFullImageUrl(form.levelImage))
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    try {
      let levelImage = form.levelImage
      if (file) {
        const uploaded = await uploadImage(file)
        levelImage = uploaded?.url || levelImage
      }
      await onSubmit({
        ...form,
        level: Number(form.level) || 0,
        coinThreshold: Number(form.coinThreshold) || 0,
        levelImage
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{initialData ? 'Edit Wealth Level' : 'Create Wealth Level'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label='Level #' name='level' value={form.level} onChange={handleChange} fullWidth />
          <TextField label='Title' name='levelName' value={form.levelName} onChange={handleChange} fullWidth />
        </Stack>
        <TextField
          label='Coin Threshold'
          name='coinThreshold'
          type='number'
          value={form.coinThreshold}
          onChange={handleChange}
        />
        <Stack spacing={1}>
          <Typography variant='body2'>Upload Image</Typography>
          <Button variant='outlined' component='label'>
            {file ? 'Change Image' : 'Choose Image'}
            <input hidden accept='.jpg,.jpeg,.png,.webp' type='file' onChange={handleFileChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .webp
          </Typography>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='Level preview'
              sx={{
                width: '100%',
                maxHeight: 180,
                objectFit: 'contain',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            />
          )}
        </Stack>
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

const PermissionDialog = ({ open, onClose, permissions, onSubmit }) => {
  const [localPerms, setLocalPerms] = useState({ ...defaultPermissions, ...(permissions || {}) })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLocalPerms({ ...defaultPermissions, ...(permissions || {}) })
  }, [permissions])

  const handleToggle = key => {
    setLocalPerms(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      await onSubmit(localPerms)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Permissions</DialogTitle>
      <DialogContent>
        <List dense sx={{ minWidth: 320 }}>
          {Object.keys(localPerms).map(key => (
            <ListItem key={key}>
              <ListItemIcon>
                <Switch checked={!!localPerms[key]} onChange={() => handleToggle(key)} />
              </ListItemIcon>
              <ListItemText primary={key.replace(/([A-Z])/g, ' $1')} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const WealthLevelsPage = () => {
  const [levels, setLevels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [permissionDialog, setPermissionDialog] = useState({ open: false, level: null })
  const [editingLevel, setEditingLevel] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  const loadLevels = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await listWealthLevels()

      setLevels(data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load wealth levels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLevels()
  }, [])

  const handleCreate = () => {
    setEditingLevel(null)
    setDialogOpen(true)
  }

  const handleEdit = level => {
    setEditingLevel(level)
    setDialogOpen(true)
  }

  const handleSave = async payload => {
    if (editingLevel) {
      await updateWealthLevel(editingLevel._id, payload)
    } else {
      await createWealthLevel(payload)
    }

    await loadLevels()
  }

  const handleDelete = async levelId => {
    if (!window.confirm('Delete this wealth level?')) return
    setActionLoading(levelId)

    try {
      await deleteWealthLevel(levelId)
      await loadLevels()
    } finally {
      setActionLoading(null)
    }
  }

  const handlePermissions = level => {
    setPermissionDialog({ open: true, level })
  }

  const savePermissions = async perms => {
    if (!permissionDialog.level) return
    await updateWealthLevelPermissions(permissionDialog.level._id, perms)
    await loadLevels()
  }

  const stats = useMemo(() => {
    if (!levels.length) return { active: 0, total: 0, threshold: 0 }

    const totals = levels.reduce(
      (acc, level) => {
        acc.total += 1
        if (level.isActive) acc.active += 1
        acc.threshold += Number(level.coinThreshold || 0)

        return acc
      },
      { total: 0, active: 0, threshold: 0 }
    )

    return totals
  }, [levels])

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
        <Button variant='contained' onClick={loadLevels}>
          Retry
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent='space-between' alignItems='center' spacing={2}>
        <div>
          <Typography variant='h5'>Wealth Levels</Typography>
          <Typography variant='body2' color='text.secondary'>
            Configure level thresholds and permissions. Served from backend-v2.
          </Typography>
        </div>
        <Button variant='contained' onClick={handleCreate}>
          Create Wealth Level
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SummaryCard label='Total Levels' value={stats.total} />
        <SummaryCard label='Active Levels' value={stats.active} />
        <SummaryCard label='Total Threshold' value={stats.threshold} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Level</TableCell>
              <TableCell>Name</TableCell>
              <TableCell align='right'>Threshold</TableCell>
              <TableCell>Badge</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {levels.map(level => (
              <TableRow key={level._id} hover>
                <TableCell>
                  <Typography fontWeight={600}>#{level.level}</Typography>
                </TableCell>
                <TableCell>{level.levelName || '—'}</TableCell>
                <TableCell align='right'>{level.coinThreshold?.toLocaleString?.() || level.coinThreshold}</TableCell>
                <TableCell>
                  {level.levelImage ? (
                    <img
                      src={getFullImageUrl(level.levelImage)}
                      alt={level.levelName}
                      width={32}
                      height={32}
                      style={{ borderRadius: 6 }}
                    />
                  ) : (
                    <Typography variant='caption' color='text.secondary'>
                      —
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={level.isActive ? 'Active' : 'Disabled'}
                    color={level.isActive ? 'success' : 'default'}
                    size='small'
                  />
                </TableCell>
                <TableCell>
                  <Button size='small' variant='outlined' onClick={() => handlePermissions(level)}>
                    Manage Permissions
                  </Button>
                </TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <IconButton size='small' onClick={() => handleEdit(level)}>
                      <Edit fontSize='inherit' />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(level._id)}
                      disabled={actionLoading === level._id}
                    >
                      <Delete fontSize='inherit' />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <LevelDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSave}
        initialData={editingLevel}
      />

      <PermissionDialog
        open={permissionDialog.open}
        onClose={() => setPermissionDialog({ open: false, level: null })}
        permissions={permissionDialog.level?.permissions}
        onSubmit={savePermissions}
      />
    </Stack>
  )
}

const SummaryCard = ({ label, value }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', minWidth: 180 }}>
    <Typography variant='body2' color='text.secondary'>
      {label}
    </Typography>
    <Typography variant='h6'>{value?.toLocaleString?.() ?? value ?? '--'}</Typography>
  </Box>
)

export default WealthLevelsPage
