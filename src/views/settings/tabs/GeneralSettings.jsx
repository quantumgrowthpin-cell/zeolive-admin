'use client'

import { useState, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import { toast } from 'react-toastify'

// Redux Actions
import { updateSettings, toggleSetting } from '@/redux-store/slices/settings'

const GeneralSettings = () => {
  const dispatch = useDispatch()
  const { settings, loading, error } = useSelector(state => state.settings)

  const { profileData } = useSelector(state => state.adminSlice)



  const [formData, setFormData] = useState({
    _id: '',
    privateKey: {},
    privateCallRate: '',
    loginBonus: '',
    durationOfShorts: '',
    minCoinsToCashOut: '',
    minCoinsForPayout: '',
    pkEndTime: '',
    adminRate: '',
    privacyPolicyLink: '',
    termsOfUsePolicyLink: '',
    shortsEffectEnabled: false,
    androidEffectLicenseKey: '',
    iosEffectLicenseKey: '',
    watermarkEnabled: false,
    watermarkIcon: '',
    agoraAppId: '',
    agoraAppCertificate: '',
    isDummyData: false,
    luckyGiftAdminTaxPercent: '',
    luckyGiftReceiverSharePercent: '',
    coinBroadcastThreshold: '',
    coinGameThreshold: ''
  })

  const [privateKeyJson, setPrivateKeyJson] = useState('')
  const [jsonError, setJsonError] = useState('')
  const [watermarkPreview, setWatermarkPreview] = useState('')

  // Update form data when settings are fetched
  useEffect(() => {
    if (settings) {
      setFormData({
        ...settings,
        _id: settings._id || '',
        privateCallRate: settings.privateCallRate?.toString() || '',
        loginBonus: settings.loginBonus?.toString() || '',
        durationOfShorts: settings.durationOfShorts?.toString() || '',
        pkEndTime: settings.pkEndTime?.toString() || '',
        adminRate: settings.adminRate?.toString() || '',
        minCoinsToCashOut: settings.minCoinsToCashOut?.toString() || '',
        minCoinsForPayout: settings.minCoinsForPayout?.toString() || '',
        privacyPolicyLink: settings.privacyPolicyLink || '',
        termsOfUsePolicyLink: settings.termsOfUsePolicyLink || '',
        shortsEffectEnabled: settings.shortsEffectEnabled || false,
        androidEffectLicenseKey: settings.androidEffectLicenseKey || '',
        iosEffectLicenseKey: settings.iosEffectLicenseKey || '',
        watermarkEnabled: settings.watermarkEnabled || false,
        watermarkIcon: settings.watermarkIcon || '',
        agoraAppId: settings.agoraAppId || '',
        agoraAppCertificate: settings.agoraAppCertificate || '',
        isDummyData: settings.isDummyData || false,
        luckyGiftAdminTaxPercent: settings.luckyGiftAdminTaxPercent?.toString() || '',
        luckyGiftReceiverSharePercent: settings.luckyGiftReceiverSharePercent?.toString() || '',
        coinBroadcastThreshold: settings.coinBroadcastThreshold?.toString() || '',
        coinGameThreshold: settings.coinGameThreshold?.toString() || ''
      })

      // Set watermark preview if watermarkIcon exists
      if (settings.watermarkIcon) {
        setWatermarkPreview(settings.watermarkIcon)
      }

      if (settings.privateKey) {
        try {
          setPrivateKeyJson(JSON.stringify(settings.privateKey, null, 2))
        } catch (err) {
          setPrivateKeyJson(JSON.stringify({}))
        }
      }
    }
  }, [settings])

  const handleFieldChange = (field, value) => {
    // Handle numeric fields differently
    if (
      [
        'privateCallRate',
        'loginBonus',
        'durationOfShorts',
        'pkEndTime',
        'adminRate',
        'minCoinsToCashOut',
        'minCoinsForPayout',
        'luckyGiftAdminTaxPercent',
        'luckyGiftReceiverSharePercent',
        'coinBroadcastThreshold',
        'coinGameThreshold'
      ].includes(field)
    ) {
      // Allow empty string or valid numbers
      if (value === '' || !isNaN(value)) {
        setFormData(prev => ({
          ...prev,
          [field]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleJsonChange = value => {
    setPrivateKeyJson(value)

    try {
      if (value.trim()) {
        const parsedJson = JSON.parse(value)

        setFormData(prev => ({
          ...prev,
          privateKey: parsedJson
        }))
        setJsonError('')
      } else {
        setFormData(prev => ({
          ...prev,
          privateKey: {}
        }))
      }
    } catch (err) {
      setJsonError('Invalid JSON format')
    }
  }

  const handleImageUpload = event => {
    const file = event.target.files[0]

    if (file) {
      // Check if file is an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()

        reader.onload = e => {
          const imageData = e.target.result

          setWatermarkPreview(imageData)
          setFormData(prev => ({
            ...prev,
            watermarkIcon: imageData
          }))
        }

        reader.readAsDataURL(file)
      } else {
        toast.error('Please select a valid image file')
      }
    }
  }

  const removeWatermarkImage = () => {
    setWatermarkPreview('')
    setFormData(prev => ({
      ...prev,
      watermarkIcon: ''
    }))
  }

  const handleToggle = type => {


    if (settings?._id) {
      dispatch(toggleSetting({ settingId: settings._id, type }))
    }
  }

  const handleSubmit = async () => {


    if (jsonError) return

    if (settings?._id) {
      // Prepare data for submission by converting string values to numbers
      const dataToSubmit = {
        ...formData,
        privateCallRate: formData.privateCallRate === '' ? 0 : Number(formData.privateCallRate),
        loginBonus: formData.loginBonus === '' ? 0 : Number(formData.loginBonus),
        durationOfShorts: formData.durationOfShorts === '' ? 0 : Number(formData.durationOfShorts),
        pkEndTime: formData.pkEndTime === '' ? 0 : Number(formData.pkEndTime),
        adminRate: formData.adminRate === '' ? 0 : Number(formData.adminRate),
        minCoinsToCashOut: formData.minCoinsToCashOut === '' ? 0 : Number(formData.minCoinsToCashOut),
        minCoinsForPayout: formData.minCoinsForPayout === '' ? 0 : Number(formData.minCoinsForPayout),
        luckyGiftAdminTaxPercent:
          formData.luckyGiftAdminTaxPercent === '' ? 0 : Number(formData.luckyGiftAdminTaxPercent),
        luckyGiftReceiverSharePercent:
          formData.luckyGiftReceiverSharePercent === '' ? 0 : Number(formData.luckyGiftReceiverSharePercent),
        coinBroadcastThreshold: formData.coinBroadcastThreshold === '' ? 0 : Number(formData.coinBroadcastThreshold),
        coinGameThreshold: formData.coinGameThreshold === '' ? 0 : Number(formData.coinGameThreshold)
      }

      dispatch(updateSettings(dataToSubmit))
    }
  }

  if (!settings && loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant='h5'>General Setting</Typography>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={loading || !!jsonError}
          startIcon={loading ? <CircularProgress color='white' size={20} /> : <i className='tabler-device-floppy' />}
        >
          Save Changes
        </Button>
      </Box>

      {/* App Settings */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-settings mr-2' />
            App Setting
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='text'
                label='Private Call Rate'
                value={formData.privateCallRate}
                onChange={e => handleFieldChange('privateCallRate', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        coins/minute
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
                label='Login Bonus'
                value={formData.loginBonus}
                onChange={e => handleFieldChange('loginBonus', e.target.value)}
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
                label='Duration of Shorts'
                value={formData.durationOfShorts}
                onChange={e => handleFieldChange('durationOfShorts', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        seconds
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
                label='PK End Time'
                value={formData.pkEndTime}
                onChange={e => handleFieldChange('pkEndTime', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        seconds
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
                label='Admin Rate'
                value={formData.adminRate}
                onChange={e => handleFieldChange('adminRate', e.target.value)}
                InputProps={{
                  inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Typography variant='caption' color='text.secondary'>
                        %
                      </Typography>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Agora settings keys */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <i className='tabler-settings mr-2' />
                Agora Setting
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Agora App ID'
                    value={formData.agoraAppId}
                    onChange={e => handleFieldChange('agoraAppId', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Agora App Certificate'
                    value={formData.agoraAppCertificate}
                    onChange={e => handleFieldChange('agoraAppCertificate', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <i className='tabler-picture-in-picture mr-2' />
                Banner Announcement Setting
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Minimum Gift announcement coin'
                    value={formData.coinBroadcastThreshold}
                    onChange={e => handleFieldChange('coinBroadcastThreshold', e.target.value)}
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
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Minimum game announcement coin'
                    value={formData.coinGameThreshold}
                    onChange={e => handleFieldChange('coinGameThreshold', e.target.value)}
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
          </Card>
        </Grid>
      </Grid>
      {/* Fake Data Setting */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-robot mr-2' />
            Fake Data Setting
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={<Switch checked={formData.isDummyData} onChange={() => handleToggle('isDummyData')} />}
                label='Enable Fake Data'
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Policy Links */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-link mr-2' />
            Policy Links
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Privacy Policy Link'
                value={formData.privacyPolicyLink}
                onChange={e => handleFieldChange('privacyPolicyLink', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Terms of Use Policy Link'
                value={formData.termsOfUsePolicyLink}
                onChange={e => handleFieldChange('termsOfUsePolicyLink', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Shorts Effect Setting */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-sparkles mr-2' />
            Shorts Effect Setting
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch checked={formData.shortsEffectEnabled} onChange={() => handleToggle('shortsEffectEnabled')} />
              }
              label='Enable Shorts Effects'
            />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Android Effect License Key'
                value={formData.androidEffectLicenseKey}
                onChange={e => handleFieldChange('androidEffectLicenseKey', e.target.value)}
                disabled={!formData.shortsEffectEnabled}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='iOS Effect License Key'
                value={formData.iosEffectLicenseKey}
                onChange={e => handleFieldChange('iosEffectLicenseKey', e.target.value)}
                disabled={!formData.shortsEffectEnabled}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Watermark Setting */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <i className='tabler-copyright mr-2' />
                Watermark Setting
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch checked={formData.watermarkEnabled} onChange={() => handleToggle('watermarkEnabled')} />
                  }
                  label='Enable Watermark'
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant='subtitle2' sx={{ mb: 2 }}>
                      Watermark Image
                    </Typography>
                    <input
                      accept='image/*'
                      style={{ display: 'none' }}
                      id='watermark-upload'
                      type='file'
                      onChange={handleImageUpload}
                      disabled={!formData.watermarkEnabled}
                    />
                    <label htmlFor='watermark-upload'>
                      <Button
                        variant='outlined'
                        component='span'
                        disabled={!formData.watermarkEnabled}
                        startIcon={<i className='tabler-upload' />}
                        fullWidth
                        sx={{ mb: 2 }}
                      >
                        Upload Watermark Image
                      </Button>
                    </label>
                    {watermarkPreview && (
                      <Box sx={{ p: 2, position: 'relative' }}>
                        <Typography variant='subtitle2' sx={{ mb: 1 }}>
                          Preview:
                        </Typography>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <img
                            src={watermarkPreview}
                            alt='Watermark Preview'
                            style={{
                              maxWidth: '200px',
                              maxHeight: '200px',
                              width: 'auto',
                              height: 'auto',
                              objectFit: 'contain',
                              border: '1px solid #ddd',
                              borderRadius: '4px'
                            }}
                          />
                          <IconButton
                            size='small'
                            onClick={removeWatermarkImage}
                            sx={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              bgcolor: 'error.main',
                              color: 'white'
                            }}
                          >
                            <i className='tabler-x' style={{ fontSize: '16px' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* New Setting Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
                <i className='tabler-settings mr-2' />
                Lucky Gift Setting
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Lucky Gift Admin Tax Percent'
                    value={formData.luckyGiftAdminTaxPercent}
                    onChange={e => handleFieldChange('luckyGiftAdminTaxPercent', e.target.value)}
                    InputProps={{
                      inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                      endAdornment: (
                        <InputAdornment position='end'>
                          <Typography variant='caption' color='text.secondary'>
                            %
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label='Lucky Gift Receiver Share Percent'
                    value={formData.luckyGiftReceiverSharePercent}
                    onChange={e => handleFieldChange('luckyGiftReceiverSharePercent', e.target.value)}
                    InputProps={{
                      inputProps: { inputMode: 'numeric', pattern: '[0-9]*' },
                      endAdornment: (
                        <InputAdornment position='end'>
                          <Typography variant='caption' color='text.secondary'>
                            %
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      {/* Firebase Configuration */}
      <Card>
        <CardContent>
          <Typography variant='subtitle1' sx={{ mb: 2, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <i className='tabler-brand-firebase mr-2' />
            Firebase Notification Setting
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Typography variant='subtitle2' sx={{ mb: 2 }}>
            Private Key JSON
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={10}
            value={privateKeyJson}
            onChange={e => handleJsonChange(e.target.value)}
            placeholder='Paste your Firebase private key JSON here'
            error={!!jsonError}
            helperText={jsonError}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
          />

          {!jsonError && privateKeyJson && (
            <Alert severity='success' sx={{ mt: 2 }}>
              Firebase configuration is valid
            </Alert>
          )}

          <Alert severity='info' sx={{ mt: 3 }}>
            <Typography variant='body2'>
              Paste your Firebase service account JSON credentials from Firebase console. This is used for server-side
              Firebase operations.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  )
}

export default GeneralSettings
