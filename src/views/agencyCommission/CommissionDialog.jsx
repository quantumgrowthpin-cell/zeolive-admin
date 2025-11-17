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
  Typography,
  CircularProgress,
  FormHelperText
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import { createAgencyCommission, updateAgencyCommission } from '@/redux-store/slices/agencyCommission'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CommissionDialog = ({ open, onClose, mode = 'create', commission = null }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector(state => state.agencyCommissionReducer)

  const [formData, setFormData] = useState({
    totalEarnings: '',
    commissionRate: ''
  })

  const [errors, setErrors] = useState({})
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && commission) {
      setFormData({
        totalEarnings: commission.totalEarnings !== undefined ? commission.totalEarnings : '',
        commissionRate: commission.commissionRate !== undefined ? commission.commissionRate : '',
        agencyCommissionId: commission._id
      })
    } else {
      setFormData({
        totalEarnings: '',
        commissionRate: ''
      })
    }

    setErrors({})
  }, [mode, commission, open])

  const handleChange = (field, value) => {
    // Ensure value is never undefined
    const safeValue = value === undefined ? '' : value

    setFormData(prev => ({ ...prev, [field]: safeValue }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.totalEarnings || Number(formData.totalEarnings) <= 0)
      newErrors.totalEarnings = 'Enter a valid total earnings amount'

    if (!formData.commissionRate || Number(formData.commissionRate) <= 0)
      newErrors.commissionRate = 'Enter a valid commission rate'

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      setLocalLoading(true)

      let result

      if (mode === 'edit') {
        result = await dispatch(updateAgencyCommission(formData)).unwrap()
      } else {
        result = await dispatch(createAgencyCommission(formData)).unwrap()
      }

      // Check if the API returned an error status
      if (!result.status) {
        setErrors(prev => ({ ...prev, general: result.message || 'Operation failed' }))

        return
      }

      // If successful, close the dialog
      handleClose()
    } catch (err) {
      console.error('Commission save failed:', err)
      setErrors(prev => ({ ...prev, general: err.toString() || 'Operation failed' }))
    } finally {
      setLocalLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      totalEarnings: '',
      commissionRate: ''
    })
    setErrors({})
    onClose()
  }

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
          {mode === 'edit' ? 'Edit Commission' : 'Add New Commission'}
        </Typography>
        <DialogCloseButton onClick={handleClose}>
          <i className='tabler-x' />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4 py-4'>
        <TextField
          label='Total Earnings'
          type='number'
          fullWidth
          value={formData.totalEarnings || ''}
          error={!!errors.totalEarnings}
          helperText={errors.totalEarnings}
          onChange={e => handleChange('totalEarnings', e.target.value)}
        />

        <TextField
          label='Commission Rate'
          type='number'
          fullWidth
          value={formData.commissionRate || ''}
          error={!!errors.commissionRate}
          helperText={errors.commissionRate}
          onChange={e => handleChange('commissionRate', e.target.value)}
        />

        {errors.general && (
          <Typography color='error' variant='caption'>
            {errors.general}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='tonal' color='secondary' disabled={localLoading || loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={localLoading || loading}>
          {localLoading || loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CommissionDialog
