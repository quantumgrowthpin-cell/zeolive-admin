import React, { useState, useEffect, forwardRef, useCallback } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { debounce } from 'lodash'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
  Autocomplete,
  Typography,
  Grid,
  InputAdornment,
  Slide,
  FormHelperText
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'

import { useForm, Controller } from 'react-hook-form'

import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import { createCoinTrader, updateCoinTrader, updateCoinForTrader, fetchUserList } from '@/redux-store/slices/coinTrader'
import CustomAvatar from '@core/components/mui/Avatar'
import { getInitials } from '@/util/getInitials'
import { getFullImageUrl } from '@/util/commonfunctions'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

const CoinTraderDialog = ({ open, onClose, editData, coinAdjustmentMode = false }) => {
  const dispatch = useDispatch()
  const { status, users, usersLoading } = useSelector(state => state.coinTrader)
  const [userSearchQuery, setUserSearchQuery] = useState('')

  const isEditMode = Boolean(editData)
  const isCoinAdjustmentMode = Boolean(coinAdjustmentMode && editData)

  const { settings } = useSelector(state => state.settings)

  // Form validation
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      uniqueId: '',
      coin: '',
      countryCode: '',
      mobileNumber: '',
      coinAmount: '',
      coinAction: 'add'
    }
  })

  const coinAction = watch('coinAction')

  // Create debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchUsers = useCallback(
    debounce(searchQuery => {
      dispatch(fetchUserList({ search: searchQuery }))
    }, 500),
    [dispatch]
  )

  // Load user list for selection
  useEffect(() => {
    if (open && !isEditMode) {
      // Call debouncedFetchUsers with the current userSearchQuery.
      // If userSearchQuery is empty, it will dispatch fetchUserList({ search: '' }).
      // If userSearchQuery has text, it dispatches fetchUserList({ search: userSearchQuery }).
      debouncedFetchUsers(userSearchQuery)
    }
  }, [open, isEditMode, userSearchQuery, debouncedFetchUsers])

  // Set form values when editing
  useEffect(() => {
    if (open && editData) {
      if (isCoinAdjustmentMode) {
        // Just set trader ID for coin adjustment
        setValue('coinAmount', '')
        setValue('coinAction', 'add')
      } else {
        // Set all fields for normal edit
        setValue('mobileNumber', editData.mobileNumber || '')
        setValue('countryCode', editData.countryCode || '')
      }
    } else if (!open) {
      // Reset form when dialog closes
      reset({
        uniqueId: '',
        coin: '',
        countryCode: '',
        mobileNumber: '',
        coinAmount: '',
        coinAction: 'add'
      })
    }
  }, [open, editData, isCoinAdjustmentMode, setValue, reset])

  // Handle form submission
  const onSubmit = async data => {
    try {
      if (isCoinAdjustmentMode) {
        // Update coins
        await dispatch(
          updateCoinForTrader({
            coinTraderId: editData._id,
            coin: data.coinAmount,
            type: data.coinAction
          })
        ).unwrap()
      } else if (isEditMode) {
        // Update existing trader
        await dispatch(
          updateCoinTrader({
            coinTraderId: editData._id,
            mobileNumber: data.mobileNumber,
            countryCode: data.countryCode
          })
        ).unwrap()
      } else {
        // Create new trader
        await dispatch(
          createCoinTrader({
            uniqueId: data.uniqueId,
            coin: data.coin,
            mobileNumber: data.mobileNumber,
            countryCode: data.countryCode
          })
        ).unwrap()
      }

      onClose()
    } catch (error) {
      onClose()
      console.error('Error:', error)
    }
  }

  // Render the appropriate title based on mode
  const getDialogTitle = () => {
    if (isCoinAdjustmentMode) {
      return `Adjust Coins for ${editData?.userDetails?.name || 'Trader'}`
    } else if (isEditMode) {
      return `Edit ${editData?.userDetails?.name || 'Trader'}`
    } else {
      return 'Create Coin Trader'
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      keepMounted
      TransitionComponent={Transition}
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
          {getDialogTitle()}
        </Typography>
        <DialogCloseButton onClick={onClose}>
          <CloseIcon />
        </DialogCloseButton>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {!isEditMode && (
              <>
                <Grid item xs={12}>
                  <Controller
                    name='uniqueId'
                    control={control}
                    rules={{ required: 'User is required' }}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        options={users || []}
                        loading={usersLoading}
                        onInputChange={(_, newValue) => setUserSearchQuery(newValue)}
                        inputValue={userSearchQuery}
                        getOptionLabel={option => {
                          if (typeof option === 'string') return option

                          return option.name || option.userName || option.uniqueId?.toString() || ''
                        }}
                        filterOptions={x => x} // Disable client-side filtering as we're using server-side search
                        renderOption={(props, option) => (
                          <li {...props} key={option._id}>
                            <Box display='flex' alignItems='center' gap={2}>
                              <CustomAvatar src={option.image ? getFullImageUrl(option.image) : null} size={32}>
                                {!option.image && getInitials(option.name)}
                              </CustomAvatar>
                              <Box>
                                <Typography variant='body1'>{option.name}</Typography>
                                <Typography variant='caption' color='text.secondary'>
                                  {option.userName} • ID: {option.uniqueId}
                                </Typography>
                              </Box>
                            </Box>
                          </li>
                        )}
                        isOptionEqualToValue={(option, value) => {
                          if (typeof option === 'string' && typeof value === 'string') {
                            return option === value
                          }

                          return option?._id === (typeof value === 'string' ? value : value?._id)
                        }}
                        onChange={(_, newValue) => {
                          field.onChange(newValue?.uniqueId || '')
                        }}
                        renderInput={params => (
                          <TextField
                            {...params}
                            label='Select User'
                            error={Boolean(errors.uniqueId)}
                            helperText={errors.uniqueId?.message}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {usersLoading ? <CircularProgress color='inherit' size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              )
                            }}
                          />
                        )}
                        value={
                          field.value
                            ? users.find(user => user.uniqueId?.toString() === field.value?.toString()) || field.value
                            : null
                        }
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name='coin'
                    control={control}
                    rules={{
                      required: 'Initial coin is required',
                      min: {
                        value: 1,
                        message: 'Coin must be at least 1'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='number'
                        label='Initial Coin'
                        fullWidth
                        error={Boolean(errors.coin)}
                        helperText={errors.coin?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>
                              <i className='tabler-coins' />
                            </InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Phone fields - show in create and edit mode, not in coin adjustment */}
            {!isCoinAdjustmentMode && (
              <>
                <Grid item xs={12} md={4}>
                  <Controller
                    name='countryCode'
                    control={control}
                    rules={{
                      required: 'Country code is required',
                      pattern: {
                        value: /^\+\d{1,4}$/,
                        message: 'Format: +XX (eg: +91)'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label='Country Code'
                        placeholder='+91'
                        fullWidth
                        error={Boolean(errors.countryCode)}
                        helperText={errors.countryCode?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <Controller
                    name='mobileNumber'
                    control={control}
                    rules={{
                      required: 'Mobile number is required',
                      pattern: {
                        value: /^\d{10}$/,
                        message: 'Mobile number must be exactly 10 digits'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='tel'
                        label='Mobile Number'
                        fullWidth
                        error={Boolean(errors.mobileNumber)}
                        helperText={errors.mobileNumber?.message}
                        inputProps={{
                          maxLength: 10,
                          inputMode: 'numeric',
                          pattern: '[0-9]*'
                        }}
                        onKeyPress={e => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault()
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            {/* Coin adjustment fields - only show in coin adjustment mode */}
            {isCoinAdjustmentMode && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant='body1' sx={{ fontWeight: 500 }}>
                      Current Coin Balance: <span style={{ color: 'primary.main' }}>{editData?.coin || 0}</span>
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name='coinAction'
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Button
                          variant={field.value === 'add' ? 'contained' : 'outlined'}
                          color='primary'
                          onClick={() => field.onChange('add')}
                          sx={{ mr: 2 }}
                        >
                          Add Coins
                        </Button>
                        <Button
                          variant={field.value === 'subtract' ? 'contained' : 'outlined'}
                          color='error'
                          onClick={() => field.onChange('subtract')}
                        >
                          Remove Coins
                        </Button>
                      </Box>
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name='coinAmount'
                    control={control}
                    rules={{
                      required: 'Coin amount is required',
                      min: {
                        value: 1,
                        message: 'Coin amount must be at least 1'
                      },
                      validate: value => {
                        if (coinAction === 'subtract' && parseInt(value) > (editData?.coin || 0)) {
                          return 'Not enough coins to deduct the requested coins'
                        }

                        return true
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type='number'
                        label={coinAction === 'add' ? 'Coins to Add' : 'Coins to Remove'}
                        fullWidth
                        error={Boolean(errors.coinAmount)}
                        helperText={errors.coinAmount?.message}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position='start'>{settings?.currency?.symbol || '$'}</InputAdornment>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant='outlined' onClick={onClose} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {isCoinAdjustmentMode ? 'Updating...' : isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : isCoinAdjustmentMode ? (
                  'Update Coins'
                ) : isEditMode ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CoinTraderDialog
