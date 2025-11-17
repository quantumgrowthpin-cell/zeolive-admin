import React, { useEffect, useState } from 'react'

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  TextField,
  Typography
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { toast } from 'react-toastify'

import { updateSettings } from '@/redux-store/slices/settings'

const WithdrawalSettings = () => {
  const dispatch = useDispatch()
  const { settings, loading, error } = useSelector(state => state.settings)
  const { profileData } = useSelector(state => state.adminSlice)



  const [jsonError, setJsonError] = useState(null)

  // Using string values for inputs to allow empty fields
  const [formData, setFormData] = useState({
    _id: '',
    minCoinsToCashOut: '',
    minCoinsForPayout: '',
    agencyMinPayout: ''
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        _id: settings._id || '',
        minCoinsToCashOut: settings.minCoinsToCashOut?.toString() || '',
        minCoinsForPayout: settings.minCoinsForPayout?.toString() || '',
        agencyMinPayout: settings.agencyMinPayout?.toString() || ''
      })
    }
  }, [settings])

  const handleFieldChange = (field, value) => {
    // Allow empty string or valid numbers
    if (value === '' || !isNaN(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const validateForm = () => {
    // Convert empty strings to 0 for validation
    const minCoinsToCashOut = formData.minCoinsToCashOut === '' ? 0 : Number(formData.minCoinsToCashOut)
    const minCoinsForPayout = formData.minCoinsForPayout === '' ? 0 : Number(formData.minCoinsForPayout)

    if (minCoinsToCashOut < 0 || minCoinsForPayout < 0) {
      setJsonError('Minimum coins cannot be negative')

      return false
    }

    setJsonError(null)

    return true
  }

  const handleSubmit = async () => {


    if (!validateForm()) return

    // Convert string values to numbers for submission
    const dataToSubmit = {
      ...formData,
      minCoinsToCashOut: formData.minCoinsToCashOut === '' ? 0 : Number(formData.minCoinsToCashOut),
      minCoinsForPayout: formData.minCoinsForPayout === '' ? 0 : Number(formData.minCoinsForPayout)
    }

    dispatch(updateSettings(dataToSubmit))
  }

  return (
    <Box>
      <Box className='flex justify-between gap-4 items-start md:items-center md:flex-row flex-col'>
        <Typography variant='h5'>Withdrawal Setting</Typography>
        <Box className='flex justify-end'>
          <Button
            variant='contained'
            color='primary'
            onClick={handleSubmit}
            disabled={loading || !!jsonError}
            startIcon={
              loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <i className='tabler-device-floppy' />
            }
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {/* <Card sx={{ mb: 4 }}> */}
      <CardContent>
        <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          <i className='tabler-settings mr-2' />
          Minimum Coin Setting
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={5.9}>
            <TextField
              fullWidth
              type='text'
              label={`${settings?.currency?.name || 'Currency'}`}
              value={1}
              disabled={true}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <Typography variant='caption' color='text.secondary'>
                      {settings?.currency?.name || 'Currency'}
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={0.2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            =
          </Grid>
          <Grid item xs={12} md={5.9}>
            <TextField
              fullWidth
              type='text'
              label='Coins'
              value={formData.minCoinsToCashOut}
              onChange={e => handleFieldChange('minCoinsToCashOut', e.target.value)}
              InputProps={{
                inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                endAdornment: (
                  <InputAdornment position='end'>
                    <Typography variant='caption' color='text.secondary'>
                      coins
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type='text'
              label='Minimum Coins Payout For User'
              value={formData.minCoinsForPayout}
              onChange={e => handleFieldChange('minCoinsForPayout', e.target.value)}
              InputProps={{
                inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                endAdornment: (
                  <InputAdornment position='end'>
                    <Typography variant='caption' color='text.secondary'>
                      coins
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type='text'
              label='Minimum Coins Payout For Agency'
              value={formData.agencyMinPayout}
              onChange={e => handleFieldChange('agencyMinPayout', e.target.value)}
              InputProps={{
                inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                endAdornment: (
                  <InputAdornment position='end'>
                    <Typography variant='caption' color='text.secondary'>
                      coins
                    </Typography>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
      {/* </Card> */}
    </Box>
  )
}

export default WithdrawalSettings
