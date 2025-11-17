'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Avatar,
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
import { Delete, Edit, LibraryMusic } from '@mui/icons-material'

import {
  fetchSongCategories,
  createSongCategory,
  updateSongCategory,
  deleteSongCategory,
  fetchSongs,
  createSong,
  updateSong,
  deleteSongs
} from '@/services/v2/songs'
import { uploadImage, uploadAudio } from '@/services/v2/uploads'
import { getFullImageUrl } from '@/util/commonfunctions'

const SongCategoryDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState(initialData?.name || '')
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(initialData?.name || '')
    setPreviewUrl(initialData?.imageUrl ? getFullImageUrl(initialData.imageUrl) : '')
    setFile(null)
  }, [initialData])

  const handleFileChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setFile(null)
      setPreviewUrl(initialData?.imageUrl ? getFullImageUrl(initialData.imageUrl) : '')
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Category name is required')
      return
    }
    if (!initialData?.imageUrl && !file) {
      alert('Please upload an image')
      return
    }
    setSaving(true)

    try {
      let imageUrl = initialData?.imageUrl || ''
      if (file) {
        const uploaded = await uploadImage(file)
        imageUrl = uploaded?.url || imageUrl
      }
      await onSubmit({ name: name.trim(), imageUrl })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{initialData ? 'Edit Category' : 'Create Category'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField label='Name' value={name} onChange={event => setName(event.target.value)} />
        <Stack spacing={1}>
          <Typography variant='body2'>Category Artwork</Typography>
          <Button variant='outlined' component='label'>
            {file ? 'Change Image' : 'Upload Image'}
            <input hidden accept='.jpg,.jpeg,.png,.webp' type='file' onChange={handleFileChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .webp
          </Typography>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='Category preview'
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const SongDialog = ({ open, onClose, onSubmit, initialData, categories }) => {
  const [form, setForm] = useState({
    songCategoryId: '',
    songTitle: '',
    singerName: '',
    durationSeconds: 0,
    artworkUrl: '',
    audioUrl: '',
    status: 'APPROVED'
  })
  const [artworkFile, setArtworkFile] = useState(null)
  const [audioFile, setAudioFile] = useState(null)
  const [artworkPreview, setArtworkPreview] = useState('')
  const [audioName, setAudioName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        songCategoryId: initialData.songCategoryId?._id || initialData.songCategoryId || '',
        songTitle: initialData.songTitle || '',
        singerName: initialData.singerName || '',
        durationSeconds: initialData.durationSeconds || 0,
        artworkUrl: initialData.artworkUrl || '',
        audioUrl: initialData.audioUrl || '',
        status: initialData.status || 'APPROVED'
      })
      setArtworkPreview(getFullImageUrl(initialData.artworkUrl))
      setAudioName(initialData.audioUrl ? initialData.audioUrl.split('/').pop() : '')
    } else {
      setForm({
        songCategoryId: '',
        songTitle: '',
        singerName: '',
        durationSeconds: 0,
        artworkUrl: '',
        audioUrl: '',
        status: 'APPROVED'
      })
      setArtworkPreview('')
      setAudioName('')
    }
    setArtworkFile(null)
    setAudioFile(null)
  }, [initialData])

  const handleChange = event => {
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleArtworkChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setArtworkFile(selected)
      setArtworkPreview(URL.createObjectURL(selected))
    } else {
      setArtworkFile(null)
      setArtworkPreview(getFullImageUrl(form.artworkUrl))
    }
  }

  const handleAudioChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setAudioFile(selected)
      setAudioName(selected.name)
    } else {
      setAudioFile(null)
      setAudioName(form.audioUrl ? form.audioUrl.split('/').pop() : '')
    }
  }

  const handleSubmit = async () => {
    if (!form.songCategoryId) {
      alert('Select a category')
      return
    }
    if (!form.songTitle.trim()) {
      alert('Song title is required')
      return
    }
    if (!form.artworkUrl && !artworkFile) {
      alert('Upload artwork')
      return
    }
    if (!form.audioUrl && !audioFile) {
      alert('Upload audio')
      return
    }
    setSaving(true)

    try {
      let artworkUrl = form.artworkUrl
      if (artworkFile) {
        const uploaded = await uploadImage(artworkFile)
        artworkUrl = uploaded?.url || artworkUrl
      }
      let audioUrl = form.audioUrl
      if (audioFile) {
        const uploaded = await uploadAudio(audioFile)
        audioUrl = uploaded?.url || audioUrl
      }
      await onSubmit({
        ...form,
        songTitle: form.songTitle.trim(),
        singerName: form.singerName.trim(),
        durationSeconds: Number(form.durationSeconds) || 0,
        artworkUrl,
        audioUrl
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{initialData ? 'Edit Song' : 'Add Song'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField select label='Category' name='songCategoryId' value={form.songCategoryId} onChange={handleChange}>
          {categories.map(category => (
            <MenuItem key={category._id} value={category._id}>
              {category.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField label='Title' name='songTitle' value={form.songTitle} onChange={handleChange} />
        <TextField label='Singer Name' name='singerName' value={form.singerName} onChange={handleChange} />
        <TextField
          label='Duration (seconds)'
          name='durationSeconds'
          type='number'
          value={form.durationSeconds}
          onChange={handleChange}
        />
        <Stack spacing={1}>
          <Typography variant='body2'>Artwork</Typography>
          <Button variant='outlined' component='label'>
            {artworkFile ? 'Change Artwork' : 'Upload Artwork'}
            <input hidden accept='.jpg,.jpeg,.png,.webp' type='file' onChange={handleArtworkChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .webp
          </Typography>
          {artworkPreview && (
            <Box
              component='img'
              src={artworkPreview}
              alt='Artwork preview'
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
        <Stack spacing={1}>
          <Typography variant='body2'>Audio File</Typography>
          <Button variant='outlined' component='label'>
            {audioFile ? 'Change Audio' : 'Upload Audio'}
            <input hidden accept='.mp3,.wav,.m4a,.aac,.ogg' type='file' onChange={handleAudioChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .mp3, .wav, .m4a, .aac, .ogg
          </Typography>
          {audioName && (
            <Typography variant='caption' color='text.secondary'>
              Current: {audioName}
            </Typography>
          )}
        </Stack>
        <TextField select label='Status' name='status' value={form.status} onChange={handleChange}>
          {['APPROVED', 'PENDING', 'REJECTED'].map(status => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const SongsPage = () => {
  const [categories, setCategories] = useState([])
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryDialog, setCategoryDialog] = useState({ open: false, category: null })
  const [songDialog, setSongDialog] = useState({ open: false, song: null })
  const [filters, setFilters] = useState({ categoryId: 'ALL', status: 'APPROVED' })

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [categoryData, songData] = await Promise.all([
        fetchSongCategories(),
        fetchSongs({
          categoryId: filters.categoryId !== 'ALL' ? filters.categoryId : undefined,
          status: filters.status !== 'ALL' ? filters.status : undefined
        })
      ])

      setCategories(categoryData)
      setSongs(songData)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load songs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const totals = useMemo(() => {
    return songs.reduce(
      (acc, song) => {
        acc.count += 1
        acc.duration += Number(song.durationSeconds || 0)

        return acc
      },
      { count: 0, duration: 0 }
    )
  }, [songs])

  const filteredSongs = useMemo(() => songs, [songs])

  const handleCategorySave = async payload => {
    if (categoryDialog.category) {
      await updateSongCategory(categoryDialog.category._id, payload)
    } else {
      await createSongCategory(payload)
    }

    await loadData()
  }

  const handleSongSave = async payload => {
    if (songDialog.song) {
      await updateSong(songDialog.song._id, payload)
    } else {
      await createSong(payload)
    }

    await loadData()
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
        <Button variant='contained' onClick={loadData}>
          Retry
        </Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent='space-between' alignItems='center'>
        <div>
          <Typography variant='h5'>Song Library</Typography>
          <Typography variant='body2' color='text.secondary'>
            Manage background music collections for live rooms.
          </Typography>
        </div>
        <Stack direction='row' spacing={2}>
          <TextField
            select
            size='small'
            label='Category'
            value={filters.categoryId}
            onChange={event => setFilters(prev => ({ ...prev, categoryId: event.target.value }))}
          >
            <MenuItem value='ALL'>All Categories</MenuItem>
            {categories.map(category => (
              <MenuItem key={category._id} value={category._id}>
                {category.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size='small'
            label='Status'
            value={filters.status}
            onChange={event => setFilters(prev => ({ ...prev, status: event.target.value }))}
          >
            {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <Button variant='outlined' onClick={() => setCategoryDialog({ open: true, category: null })}>
            Category +
          </Button>
          <Button
            variant='contained'
            startIcon={<LibraryMusic />}
            onClick={() => setSongDialog({ open: true, song: null })}
          >
            Add Song
          </Button>
        </Stack>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <SummaryCard label='Songs' value={totals.count} />
        <SummaryCard
          label='Total Duration'
          value={`${Math.floor(totals.duration / 60)} min ${totals.duration % 60} sec`}
        />
        <SummaryCard label='Categories' value={categories.length} />
      </Stack>

      <TableContainer component={Box} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Song</TableCell>
              <TableCell>Singer</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSongs.map(song => (
              <TableRow key={song._id} hover>
                <TableCell>
                  <Stack direction='row' spacing={2} alignItems='center'>
                    <Avatar src={getFullImageUrl(song.artworkUrl)} variant='rounded'>
                      {song.songTitle?.[0] || '♪'}
                    </Avatar>
                    <div>
                      <Typography fontWeight={600}>{song.songTitle}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {song.audioUrl ? getFullImageUrl(song.audioUrl) : '—'}
                      </Typography>
                    </div>
                  </Stack>
                </TableCell>
                <TableCell>{song.singerName || '—'}</TableCell>
                <TableCell>{song.songCategoryId?.name || '—'}</TableCell>
                <TableCell>{formatSeconds(song.durationSeconds)}</TableCell>
                <TableCell>
                  <Chip label={song.status} color={chipColorForStatus(song.status)} size='small' />
                </TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <IconButton size='small' onClick={() => setSongDialog({ open: true, song })}>
                      <Edit fontSize='inherit' />
                    </IconButton>
                    <IconButton size='small' color='error' onClick={() => deleteSongs(song._id).then(loadData)}>
                      <Delete fontSize='inherit' />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <SongCategoryDialog
        open={categoryDialog.open}
        onClose={() => setCategoryDialog({ open: false, category: null })}
        onSubmit={handleCategorySave}
        initialData={categoryDialog.category}
      />

      <SongDialog
        open={songDialog.open}
        onClose={() => setSongDialog({ open: false, song: null })}
        onSubmit={handleSongSave}
        initialData={songDialog.song}
        categories={categories}
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

const formatSeconds = seconds => {
  if (!seconds) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  return `${mins}m ${secs}s`
}

const chipColorForStatus = status => {
  switch (status) {
    case 'APPROVED':
      return 'success'
    case 'PENDING':
      return 'warning'
    case 'REJECTED':
      return 'error'
    default:
      return 'default'
  }
}

export default SongsPage
