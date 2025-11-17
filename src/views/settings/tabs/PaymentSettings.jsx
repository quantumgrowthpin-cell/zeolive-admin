'use client'

import React, { useEffect, useState } from 'react'

import { useSelector, useDispatch } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { toast } from 'react-toastify'

// Redux Actions
import { updateSettings, toggleSetting } from '@/redux-store/slices/settings'


const PaymentSettings = () => {
  const dispatch = useDispatch()
  const { settings, loading } = useSelector(state => state.settings)
  const { profileData } = useSelector(state => state.adminSlice)
  const [googleprivateKeyJson, setGooglePrivateKeyJson] = useState('')
  const [jsonError, setJsonError] = useState('')



  // Using string values for inputs to allow empty fields
  const [formData, setFormData] = useState({
    _id: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    razorPayId: '',
    razorSecretKey: '',
    flutterWaveId: '',
    isStripeEnabled: false,
    isRazorpayEnabled: false,
    isFlutterwaveEnabled: false,
    isGooglePlayEnabled: false,
    googlePlayServiceAccountEmail: '',
    googlePlayPrivateKey: ''
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        _id: settings._id || '',
        stripePublishableKey: settings.stripePublishableKey || '',
        stripeSecretKey: settings.stripeSecretKey || '',
        razorPayId: settings.razorPayId || '',
        razorSecretKey: settings.razorSecretKey || '',
        flutterWaveId: settings.flutterWaveId || '',
        isStripeEnabled: settings.isStripeEnabled || false,
        isRazorpayEnabled: settings.isRazorpayEnabled || false,
        isFlutterwaveEnabled: settings.isFlutterwaveEnabled || false,
        isGooglePlayEnabled: settings.isGooglePlayEnabled || false,
        googlePlayServiceAccountEmail: settings.googlePlayServiceAccountEmail || '',
        googlePlayPrivateKey: settings.googlePlayPrivateKey || '',
      })
    }
  }, [settings])

  const handleToggle = type => {


    if (settings?._id) {
      dispatch(toggleSetting({ settingId: settings._id, type }))

      // Update local state too
      setFormData(prev => ({
        ...prev,
        [type]: !prev[type]
      }))
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleJsonChange = value => {
    setGooglePrivateKeyJson(value)

    try {
      if (value.trim()) {
        const parsedJson = JSON.parse(value)

        setFormData(prev => ({
          ...prev,
          googlePlayPrivateKey: parsedJson
        }))
        setJsonError('')
      } else {
        setFormData(prev => ({
          ...prev,
          googlePlayPrivateKey: {}
        }))
      }
    } catch (err) {
      setJsonError('Invalid JSON format')
    }
  }

  const handleSubmit = () => {


    if (settings?._id) {
      dispatch(updateSettings(formData))
    }
  }

  if (!settings) return null

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h5'>Payment Setting</Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={
            loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <i className='tabler-device-floppy' />
          }
        >
          Save Changes
        </Button>
      </Box>

      <Grid container spacing={6}>
        {/* Stripe Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 4 }}>
                <Typography variant='h6'>Stripe Setting</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isStripeEnabled}
                      onChange={() => handleToggle('isStripeEnabled')}
                      name='stripeEnabled'
                    />
                  }
                  label='Enable Stripe'
                />
              </Box>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Stripe Publishable Key'
                    value={formData.stripePublishableKey}
                    onChange={e => handleInputChange('stripePublishableKey', e.target.value)}
                    disabled={!formData.isStripeEnabled}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Stripe Secret Key'
                    value={formData.stripeSecretKey}
                    onChange={e => handleInputChange('stripeSecretKey', e.target.value)}
                    disabled={!formData.isStripeEnabled}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Razorpay Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 4 }}>
                <Typography variant='h6'>Razorpay Setting</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isRazorpayEnabled}
                      onChange={() => handleToggle('isRazorpayEnabled')}
                      name='razorpayEnabled'
                    />
                  }
                  label='Enable Razorpay'
                />
              </Box>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Razorpay ID'
                    value={formData.razorPayId}
                    onChange={e => handleInputChange('razorPayId', e.target.value)}
                    disabled={!formData.isRazorpayEnabled}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label='Razorpay Secret Key'
                    value={formData.razorSecretKey}
                    onChange={e => handleInputChange('razorSecretKey', e.target.value)}
                    disabled={!formData.isRazorpayEnabled}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Flutterwave Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 4 }}>
                <Typography variant='h6'>Flutterwave Setting</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isFlutterwaveEnabled}
                      onChange={() => handleToggle('isFlutterwaveEnabled')}
                      name='flutterwaveEnabled'
                    />
                  }
                  label='Enable Flutterwave'
                />
              </Box>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Flutterwave ID'
                    value={formData.flutterWaveId}
                    onChange={e => handleInputChange('flutterWaveId', e.target.value)}
                    disabled={!formData.isFlutterwaveEnabled}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Google Play Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 4 }}>
                <Typography variant='h6'>Google Play Setting</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isGooglePlayEnabled}
                      onChange={() => handleToggle('isGooglePlayEnabled')}
                      name='googlePlayEnabled'
                    />
                  }
                  label='Enable Google Play'
                />
              </Box>
              <Grid container spacing={4}>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label='Service Account Email'
                    value={formData.googlePlayServiceAccountEmail}
                    onChange={e => handleInputChange('googlePlayServiceAccountEmail', e.target.value)}
                    disabled={!formData.isGooglePlayEnabled}
                  />
                </Grid>
                <Grid item xs={12} md={12}>
                  <TextField
                    fullWidth
                    label='Google Play Private Key'
                    value={formData.googlePlayPrivateKey}
                    onChange={e => handleInputChange('googlePlayPrivateKey', e.target.value)}

                  // disabled={!formData.isGooglePlayEnabled}
                  />
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default PaymentSettings
