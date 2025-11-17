'use client'

import { useEffect, useState } from 'react'

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
  FormControlLabel,
  IconButton,
  MenuItem,
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
import { Add, Delete, Edit, Visibility, VisibilityOff } from '@mui/icons-material'

import { fetchReactions, createReaction, updateReaction, toggleReaction, deleteReaction } from '@/services/v2/reactions'
import { uploadImage } from '@/services/v2/uploads'
import { getFullImageUrl } from '@/util/commonfunctions'

const emptyForm = {
  title: '',
  assetUrl: '',
  isActive: true
}

const ReactionsPage = () => {
  const [reactions, setReactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialog, setDialog] = useState({ open: false, data: null })
  const [message, setMessage] = useState(null)

  const loadReactions = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await fetchReactions()

      setReactions(data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load reactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReactions()
  }, [])

  const handleToggle = async reaction => {
    await toggleReaction(reaction._id)
    loadReactions()
  }

  const handleDelete = async reaction => {
    if (!window.confirm(`Delete reaction "${reaction.title}"?`)) return
    await deleteReaction(reaction._id)
    setMessage('Reaction deleted')
    loadReactions()
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant='h5'>Quick Reactions</Typography>
        <Typography variant='body2' color='text.secondary'>
          Upload and manage the stickers/emotes available during chat and live sessions.
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
          <Stack
            direction='row'
            justifyContent='space-between'
            alignItems={{ xs: 'stretch', sm: 'center' }}
            sx={{ mb: 3 }}
          >
            <Typography variant='h6'>Library</Typography>
            <Button startIcon={<Add />} variant='contained' onClick={() => setDialog({ open: true, data: null })}>
              Add Reaction
            </Button>
          </Stack>

          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Reaction</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      Loading reactions...
                    </TableCell>
                  </TableRow>
                )}
                {!loading && !reactions.length && (
                  <TableRow>
                    <TableCell colSpan={4} align='center'>
                      No reactions yet.
                    </TableCell>
                  </TableRow>
                )}

                {reactions.map(reaction => (
                  <TableRow key={reaction._id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{reaction.title}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {reaction._id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {reaction.imageUrl ? (
                        <Box
                          component='img'
                          src={getFullImageUrl(reaction.imageUrl)}
                          alt={reaction.title}
                          sx={{
                            width: 48,
                            height: 48,
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
                        size='small'
                        label={reaction.isActive ? 'Active' : 'Hidden'}
                        color={reaction.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Stack direction='row' spacing={1} justifyContent='flex-end'>
                        <IconButton size='small' onClick={() => setDialog({ open: true, data: reaction })}>
                          <Edit fontSize='inherit' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleToggle(reaction)}
                          title={reaction.isActive ? 'Hide' : 'Show'}
                        >
                          {reaction.isActive ? <VisibilityOff fontSize='inherit' /> : <Visibility fontSize='inherit' />}
                        </IconButton>
                        <IconButton size='small' onClick={() => handleDelete(reaction)}>
                          <Delete fontSize='inherit' />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <ReactionDialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, data: null })}
        onSubmit={async values => {
          if (dialog.data) {
            await updateReaction(dialog.data._id, values)
            setMessage('Reaction updated')
          } else {
            await createReaction(values)
            setMessage('Reaction created')
          }

          setDialog({ open: false, data: null })
          loadReactions()
        }}
        initialData={dialog.data}
      />
    </Stack>
  )
}

const ReactionDialog = ({ open, onClose, onSubmit, initialData }) => {
  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        assetUrl: initialData.imageUrl || '',
        isActive: initialData.isActive ?? true
      })
      setPreviewUrl(getFullImageUrl(initialData.imageUrl))
    } else {
      setForm(emptyForm)
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
    if (!form.title.trim()) {
      alert('Title is required')
      return
    }
    if (!form.assetUrl && !file) {
      alert('Please upload an image')
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
        title: form.title.trim(),
        imageUrl: assetPath,
        isActive: form.isActive
      })
      onClose()
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Unable to save reaction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{initialData ? 'Edit Reaction' : 'New Reaction'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
        <TextField label='Title' name='title' value={form.title} onChange={handleChange} />
        <Stack spacing={1}>
          <Typography variant='body2'>Upload Image</Typography>
          <Button variant='outlined' component='label'>
            {file ? 'Change Image' : 'Choose Image'}
            <input hidden accept='.jpg,.jpeg,.png,.gif,.webp' type='file' onChange={handleFileChange} />
          </Button>
          <Typography variant='caption' color='text.secondary'>
            Accepted formats: .jpg, .jpeg, .png, .gif, .webp
          </Typography>
          {previewUrl && (
            <Box
              component='img'
              src={previewUrl}
              alt='Reaction preview'
              sx={{
                width: 96,
                height: 96,
                objectFit: 'cover',
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
          <MenuItem value='false'>Hidden</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={handleSubmit} disabled={submitting}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReactionsPage
