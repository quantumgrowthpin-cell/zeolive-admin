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
  CircularProgress
} from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import { createReferralSystem, updateReferralSystem } from '@/redux-store/slices/referralSystem'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const ReferralDialog = ({ open, onClose, mode = 'create', referral = null }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector(state => state.referralSystem)

  const [formData, setFormData] = useState({
    targetReferrals: '',
    rewardCoins: ''
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (mode === 'edit' && referral) {
      setFormData({
        targetReferrals: referral.targetReferrals || '',
        rewardCoins: referral.rewardCoins || ''
      })
    } else {
      setFormData({
        targetReferrals: '',
        rewardCoins: ''
      })
    }

    setErrors({})
  }, [mode, referral, open])

  const handleChange = (field, value) => {
    const safeValue = value === undefined ? '' : value

    setFormData(prev => ({ ...prev, [field]: safeValue }))
    setErrors(prev => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.targetReferrals || Number(formData.targetReferrals) <= 0) {
      newErrors.targetReferrals = 'Enter a valid target number of referrals'
    }

    if (!formData.rewardCoins || Number(formData.rewardCoins) <= 0) {
      newErrors.rewardCoins = 'Enter a valid reward coins amount'
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      if (mode === 'edit') {
        await dispatch(
          updateReferralSystem({
            targetReferrals: formData.targetReferrals,
            rewardCoins: formData.rewardCoins,
            referralId: referral._id
          })
        ).unwrap()
      } else {
        await dispatch(
          createReferralSystem({
            targetReferrals: formData.targetReferrals,
            rewardCoins: formData.rewardCoins
          })
        ).unwrap()
      }

      onClose()
    } catch (err) {
      console.error('Referral system save failed:', err)
    }
  }

  const handleClose = () => {
    setFormData({
      targetReferrals: '',
      rewardCoins: ''
    })
    setErrors({})
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} keepMounted TransitionComponent={Transition} fullWidth maxWidth='sm'>
      <DialogTitle>{mode === 'edit' ? 'Edit Referral System' : 'Add New Referral System'}</DialogTitle>
      <DialogContent className='flex flex-col gap-4 py-4'>
        <TextField
          label='Target Referrals'
          type='number'
          fullWidth
          value={formData.targetReferrals}
          error={!!errors.targetReferrals}
          helperText={errors.targetReferrals}
          onChange={e => handleChange('targetReferrals', e.target.value)}
        />
        <TextField
          label='Reward Coins'
          type='number'
          fullWidth
          value={formData.rewardCoins}
          error={!!errors.rewardCoins}
          helperText={errors.rewardCoins}
          onChange={e => handleChange('rewardCoins', e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant='tonal' color='secondary' disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant='contained' disabled={loading}>
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReferralDialog
