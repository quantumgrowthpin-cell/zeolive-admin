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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Switch
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'

import {
  listPayoutMethods,
  createPayoutMethod,
  updatePayoutMethod,
  deletePayoutMethod
} from '@/services/v2/payoutMethods'
import { uploadImage } from '@/services/v2/uploads'
import { getFullImageUrl } from '@/util/commonfunctions'

const PayoutMethodsPage = () => {
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dialogState, setDialogState] = useState({ open: false, method: null })
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await listPayoutMethods()

      setMethods(data)
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load payout methods')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleDelete = async id => {
    if (!window.confirm('Delete this method?')) return
    setSubmitting(true)

    try {
      await deletePayoutMethod(id)
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async method => {
    setSubmitting(true)

    try {
      await updatePayoutMethod(method._id, { isActive: !method.isActive })
      await loadData()
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
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={2}>
        <div>
          <Typography variant='h5'>Payout Methods</Typography>
          <Typography variant='body2' color='text.secondary'>
            Define the payout channels available to hosts and agencies.
          </Typography>
        </div>
        <Button startIcon={<Add />} variant='contained' onClick={() => setDialogState({ open: true, method: null })}>
          Add Method
        </Button>
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
              <TableCell>Name</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align='right'>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {methods.map(method => (
              <TableRow key={method._id} hover>
                <TableCell>{method.name}</TableCell>
                <TableCell>{(method.fields || []).map(field => field.label).join(', ') || '—'}</TableCell>
                <TableCell>
                  {method.iconUrl ? (
                    <Box
                      component='img'
                      src={getFullImageUrl(method.iconUrl)}
                      alt={method.name}
                      sx={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 1,
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
                  <Switch checked={method.isActive} onChange={() => toggleActive(method)} disabled={submitting} />
                </TableCell>
                <TableCell align='right'>
                  <Stack direction='row' spacing={1} justifyContent='flex-end'>
                    <IconButton size='small' onClick={() => setDialogState({ open: true, method })}>
                      <Edit fontSize='inherit' />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(method._id)}
                      disabled={submitting}
                    >
                      <Delete fontSize='inherit' />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {!methods.length && (
              <TableRow>
                <TableCell colSpan={4}>No payout methods configured.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <MethodDialog
        open={dialogState.open}
        method={dialogState.method}
        onClose={() => setDialogState({ open: false, method: null })}
        onSubmit={async payload => {
          setSubmitting(true)

          try {
            if (dialogState.method) {
              await updatePayoutMethod(dialogState.method._id, payload)
            } else {
              await createPayoutMethod(payload)
            }

            setDialogState({ open: false, method: null })
            await loadData()
          } finally {
            setSubmitting(false)
          }
        }}
      />
    </Stack>
  )
}

const defaultMethodForm = { name: '', iconUrl: '', fields: [{ label: '', key: 'field_0' }] }

const MethodDialog = ({ open, onClose, method, onSubmit }) => {
  const [form, setForm] = useState(defaultMethodForm)
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (method) {
      setForm({
        name: method.name || '',
        iconUrl: method.iconUrl || '',
        fields: method.fields?.length ? method.fields : [{ label: '', key: 'field_0' }]
      })
      setPreviewUrl(getFullImageUrl(method.iconUrl))
    } else {
      setForm(defaultMethodForm)
      setPreviewUrl('')
    }
    setFile(null)
  }, [method])

  const handleChange = field => event => setForm(prev => ({ ...prev, [field]: event.target.value }))

  const handleFieldChange = (index, key, value) => {
    setForm(prev => {
      const fields = [...prev.fields]

      fields[index] = { ...fields[index], [key]: value }

      return { ...prev, fields }
    })
  }

  const addField = () =>
    setForm(prev => ({
      ...prev,
      fields: [...prev.fields, { label: '', key: `field_${Date.now()}` }]
    }))
  const removeField = index => setForm(prev => ({ ...prev, fields: prev.fields.filter((_, idx) => idx !== index) }))

  const handleFileChange = event => {
    const selected = event.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    } else {
      setFile(null)
      setPreviewUrl(getFullImageUrl(form.iconUrl))
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      alert('Method name is required')

      return
    }

    let iconUrl = form.iconUrl
    if (file) {
      const uploaded = await uploadImage(file)
      iconUrl = uploaded?.url || iconUrl
    }

    onSubmit({
      name: form.name.trim(),
      iconUrl,
      fields: (form.fields || []).map((field, index) => ({
        label: field.label || `Field ${index + 1}`,
        key: field.key || `field_${index}`
      }))
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{method ? 'Edit Payout Method' : 'Add Payout Method'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label='Name' value={form.name} onChange={handleChange('name')} />
          <Stack spacing={1}>
            <Typography variant='subtitle2'>Icon</Typography>
            <Button variant='outlined' component='label'>
              {file ? 'Change Icon' : 'Upload Icon'}
              <input hidden accept='.jpg,.jpeg,.png,.gif,.webp' type='file' onChange={handleFileChange} />
            </Button>
            <Typography variant='caption' color='text.secondary'>
              Accepted formats: .jpg, .jpeg, .png, .gif, .webp
            </Typography>
            {previewUrl && (
              <Box
                component='img'
                src={previewUrl}
                alt='Payout method icon'
                sx={{
                  width: 80,
                  height: 80,
                  objectFit: 'cover',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              />
            )}
          </Stack>
          <Stack spacing={1}>
            <Typography variant='subtitle2'>Fields</Typography>
            {form.fields.map((field, index) => (
              <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <TextField
                  label='Label'
                  value={field.label}
                  onChange={event => handleFieldChange(index, 'label', event.target.value)}
                  fullWidth
                />
                <Button color='error' onClick={() => removeField(index)}>
                  Remove
                </Button>
              </Stack>
            ))}
            <Button onClick={addField}>Add Field</Button>
          </Stack>
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

export default PayoutMethodsPage
