'use client'

import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Paper from '@mui/material/Paper'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'

import CustomAvatar from '@core/components/mui/Avatar'
import { TRANSACTION_TYPES, TYPE_LABELS } from '../constants'
import { getFullImageUrl } from '@/util/commonfunctions'
import SVGAPlayer from '@/components/SVGAPlayer'

const TransactionItem = ({ transaction, transactionType }) => {
  // Use transactionType parameter (from tab context) to determine what to display
  // IMPORTANT: If we're in a specific transaction tab, we need to show those details
  // regardless of the actual transaction type in the API response
  const displayType = transactionType !== null ? transactionType : parseInt(transaction.type)

  // The original transaction type is used for icons/colors when not in a specific tab
  const actualType = parseInt(transaction.type)

  // Important: If we're in a specific tab but the transaction is of a different type,
  // we should not display this transaction at all - this should be filtered by the parent component
  // This is just an extra safety check
  if (transactionType !== null && actualType !== transactionType) {
    return null
  }

  const getTransactionIcon = type => {
    switch (type) {
      case TRANSACTION_TYPES.COIN_HISTORY:
        return 'tabler-coins'
      case TRANSACTION_TYPES.PURCHASE_THEME:
        return 'tabler-palette'
      case TRANSACTION_TYPES.PURCHASE_AVTARFRAME:
        return 'tabler-frame'
      case TRANSACTION_TYPES.PURCHASE_RIDE:
        return 'tabler-car'
      case TRANSACTION_TYPES.PRIVATE_CALL:
        return 'tabler-phone'
      case TRANSACTION_TYPES.LIVE_GIFT:
        return 'tabler-gift'
      case TRANSACTION_TYPES.COIN_PLAN_PURCHASE:
        return 'tabler-coin'
      case TRANSACTION_TYPES.REFERRAL_REWARD:
        return 'tabler-users'
      case TRANSACTION_TYPES.LOGIN_BONUS:
        return 'tabler-login'
      case TRANSACTION_TYPES.TEENPATTI_GAME:
        return 'tabler-cards'
      case TRANSACTION_TYPES.FERRYWHEEL_GAME:
        return 'tabler-wheel'
      case TRANSACTION_TYPES.CASINO_GAME:
        return 'tabler-dice'
      case TRANSACTION_TYPES.LUCKY_GIFT:
        return 'tabler-gift'
      case TRANSACTION_TYPES.COIN_PURCHASE_FROM_COINTRADER:
        return 'tabler-coin'
      case TRANSACTION_TYPES.WITHDRAWAL_BY_USER:
        return 'tabler-coin'
      default:
        return 'tabler-coin'
    }
  }

  const getTransactionColor = type => {
    switch (type) {
      case TRANSACTION_TYPES.COIN_HISTORY:
        return 'primary'
      case TRANSACTION_TYPES.PURCHASE_THEME:
        return 'warning'
      case TRANSACTION_TYPES.PURCHASE_AVTARFRAME:
        return 'info'
      case TRANSACTION_TYPES.PURCHASE_RIDE:
        return 'secondary'
      case TRANSACTION_TYPES.PRIVATE_CALL:
        return 'error'
      case TRANSACTION_TYPES.LIVE_GIFT:
        return 'success'
      case TRANSACTION_TYPES.COIN_PLAN_PURCHASE:
        return 'primary'
      case TRANSACTION_TYPES.REFERRAL_REWARD:
        return 'success'
      case TRANSACTION_TYPES.LOGIN_BONUS:
        return 'info'
      case TRANSACTION_TYPES.TEENPATTI_GAME:
        return 'warning'
      case TRANSACTION_TYPES.FERRYWHEEL_GAME:
        return 'info'
      case TRANSACTION_TYPES.CASINO_GAME:
        return 'success'
      case TRANSACTION_TYPES.LUCKY_GIFT:
        return 'warning'
      case TRANSACTION_TYPES.COIN_PURCHASE_FROM_COINTRADER:
        return 'info'
      case TRANSACTION_TYPES.WITHDRAWAL_BY_USER:
        return 'error'
      default:
        return 'primary'
    }
  }

  const formatDate = dateString => {
    if (!dateString) return 'N/A'

    const date = new Date(dateString)

    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  // Format duration to make it more readable
  const formatDuration = duration => {
    if (!duration || duration === '00:00:00') return 'Not available'

    return duration
  }

  // Get validity display text combining validity and type
  const getValidityText = (validity, validityType) => {
    if (!validity || validity === 0) return 'Not specified'

    let typeText = ''

    switch (validityType) {
      case 1:
        typeText = `${validity} Day(s)`
        break
      case 2:
        typeText = `${validity} Month(s)`
        break
      case 3:
        typeText = `${validity} Year(s)`
        break
      default:
        typeText = `${validity} Day(s)` // Default to days if type not specified
    }

    return typeText
  }

  // Decide what details to show based on the current tab context (displayType)
  const renderTransactionDetails = () => {
    // Always use the display type (from tab context) to determine what details to show
    switch (displayType) {
      case TRANSACTION_TYPES.PURCHASE_THEME:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='warning' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-palette'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Theme
                  </Typography>
                  <Typography variant='body2'>{transaction.themeName || 'Unknown Theme'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='warning' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-calendar'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Validity
                  </Typography>
                  <Typography variant='body2'>
                    {getValidityText(transaction.themeValidity, transaction.themeValidityType)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.PURCHASE_AVTARFRAME:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='info' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-frame'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Frame
                  </Typography>
                  <Typography variant='body2'>{transaction.avtarFrameName || 'Unknown Frame'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='info' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-calendar'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Validity
                  </Typography>
                  <Typography variant='body2'>
                    {getValidityText(transaction.avtarFrameValidity, transaction.avtarFrameValidityType)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.PURCHASE_RIDE:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='secondary' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-car'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Ride
                  </Typography>
                  <Typography variant='body2'>{transaction.rideName || 'Unknown Ride'}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='secondary' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-calendar'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Validity
                  </Typography>
                  <Typography variant='body2'>
                    {getValidityText(transaction.rideValidity, transaction.rideValidityType)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.PRIVATE_CALL:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            {/* align left on mobile and center on laptop */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', lg: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='error' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-clock'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Duration
                  </Typography>
                  <Typography variant='body2'>{formatDuration(transaction.duration)}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='error' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-users'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Call Type
                  </Typography>
                  <Typography variant='body2'>
                    {transaction.isRandom ? 'Random Call' : transaction.isPrivate ? 'Private Call' : 'Regular Call'}
                  </Typography>
                </Box>
              </Box>
            </Stack>
            {transaction.callStartTime && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <CustomAvatar skin='light' color='error' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-calendar-time'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Time
                  </Typography>
                  <Typography variant='body2'>
                    {formatDate(transaction.callStartTime)} - {formatDate(transaction.callEndTime)}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Display both sender and receiver information for private calls */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='flex-start' mt={2}>
              {transaction.senderName && (
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CustomAvatar skin='light' color='error' size='sm' sx={{ mr: 1.5 }}>
                    <i className='tabler-arrow-up'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Sender
                    </Typography>
                    <Typography variant='body2'>{transaction.senderName}</Typography>
                  </Box>
                </Box>
              )}

              {transaction.receiverName && (
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CustomAvatar skin='light' color='error' size='sm' sx={{ mr: 1.5 }}>
                    <i className='tabler-arrow-down'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Receiver
                    </Typography>
                    <Typography variant='body2'>{transaction.receiverName}</Typography>
                  </Box>
                </Box>
              )}
            </Stack>
            <Divider sx={{ my: 4 }} />
            <>
              {transaction.senderCoin !== undefined && (
                <Chip
                  size='small'
                  variant='tonal'
                  color='primary'
                  label={`Sender: ${transaction.senderCoin} Coins`}
                  sx={{ mb: 0.5, ml: 0.5 }}
                />
              )}
              {transaction.receiverCoin !== undefined && (
                <Chip
                  size='small'
                  variant='tonal'
                  color='success'
                  label={`Receiver: ${transaction.receiverCoin} Coins`}
                  sx={{ mb: 0.5, ml: 0.5 }}
                />
              )}
              {transaction.adminCoin !== undefined && (
                <Chip
                  size='small'
                  variant='tonal'
                  color='warning'
                  label={`Admin: ${transaction.adminCoin} Coins`}
                  sx={{ mb: 0.5, ml: 0.5 }}
                />
              )}
            </>
          </Box>
        )

      case TRANSACTION_TYPES.COIN_PLAN_PURCHASE:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='primary' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-coin'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Amount
                  </Typography>
                  <Typography variant='body2'>${transaction.amount || 0}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='primary' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-credit-card'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Payment via
                  </Typography>
                  <Typography variant='body2'>{transaction.paymentGateway || 'Unknown'}</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.LIVE_GIFT:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems='flex-start'>
              {transaction.senderName && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CustomAvatar skin='light' color='success' size='sm' sx={{ mr: 1.5 }}>
                      <i className='tabler-arrow-up'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Sender
                      </Typography>
                      <Typography variant='body2'>{transaction.senderName}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {transaction.receiverName && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CustomAvatar skin='light' color='success' size='sm' sx={{ mr: 1.5 }}>
                      <i className='tabler-arrow-down'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Receiver
                      </Typography>
                      <Typography variant='body2'>{transaction.receiverName}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={2.4}>
                {transaction.giftImage && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {transaction.giftImage &&
                      (transaction.giftImage.toLowerCase().endsWith('.svga') ? (
                        <SVGAPlayer url={getFullImageUrl(transaction.giftImage)} width={40} height={40} />
                      ) : (
                        <CustomAvatar
                          src={getFullImageUrl(transaction.giftImage)}
                          skin='light'
                          size='sm'
                          sx={{ mr: 1.5 }}
                        >
                          {transaction.title}
                        </CustomAvatar>
                      ))}
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        {transaction.giftTitle}
                      </Typography>
                      <Typography variant='body2'>Coins: {transaction.giftCoin}</Typography>
                    </Box>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar
                    skin='light'
                    color={transaction.liveType === 1 ? 'success' : transaction.liveType === 2 ? 'info' : 'warning'}
                    size='sm'
                    sx={{ mr: 1.5 }}
                  >
                    <i className='tabler-gift'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      {transaction.liveType === 1
                        ? 'Video Live'
                        : transaction.liveType === 2
                          ? 'Audio Live'
                          : 'PK Live'}
                    </Typography>
                    <Typography variant='body2'>Count: {transaction.giftReceivedCount ?? 'N/A'}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 4 }} />
            <>
              {transaction.senderCoin !== undefined && (
                <Chip
                  size='small'
                  variant='tonal'
                  color='primary'
                  label={`Sender: ${transaction.senderCoin} Coins`}
                  sx={{ mb: 0.5, ml: 0.5 }}
                />
              )}
              {transaction.receiverCoin !== undefined && (
                <Chip
                  size='small'
                  variant='tonal'
                  color='success'
                  label={`Receiver: ${transaction.receiverCoin} Coins`}
                  sx={{ mb: 0.5, ml: 0.5 }}
                />
              )}
              {transaction.adminCoin !== undefined && (
                <Chip
                  size='small'
                  variant='tonal'
                  color='warning'
                  label={`Admin: ${transaction.adminCoin} Coins`}
                  sx={{ mb: 0.5, ml: 0.5 }}
                />
              )}
            </>
          </Box>
        )

      case TRANSACTION_TYPES.REFERRAL_REWARD:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='success' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-arrow-down'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Receiver
                  </Typography>
                  <Typography variant='body2'>{transaction.receiverName}</Typography>
                </Box>
              </Box>
              {transaction.referredUser && (
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CustomAvatar skin='light' color='success' size='sm' sx={{ mr: 1.5 }}>
                    <i className='tabler-arrow-up'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Referred User
                    </Typography>
                    <Typography variant='body2'>{transaction.referredUser}</Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.LOGIN_BONUS:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='info' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-login'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Bonus Type
                  </Typography>
                  <Typography variant='body2'>Login Bonus</Typography>
                </Box>
              </Box>
              {transaction.loginStreak && (
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CustomAvatar skin='light' color='info' size='sm' sx={{ mr: 1.5 }}>
                    <i className='tabler-calendar-check'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Login Streak
                    </Typography>
                    <Typography variant='body2'>{transaction.loginStreak} days</Typography>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.TEENPATTI_GAME:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='warning' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-cards'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Game
                  </Typography>
                  <Typography variant='body2'>Teen Patti</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='warning' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-trophy'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Result
                  </Typography>
                  <Typography variant='body2'>{transaction.isWin ? 'Won' : 'Lost'}</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.FERRYWHEEL_GAME:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='info' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-wheel'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Game
                  </Typography>
                  <Typography variant='body2'>Ferry Wheel</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='info' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-trophy'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Result
                  </Typography>
                  <Typography variant='body2'>{transaction.isWin ? 'Won' : 'Lost'}</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.CASINO_GAME:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='center'>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='success' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-dice'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Game
                  </Typography>
                  <Typography variant='body2'>Casino Game</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <CustomAvatar skin='light' color='success' size='sm' sx={{ mr: 1.5 }}>
                  <i className='tabler-trophy'></i>
                </CustomAvatar>
                <Box>
                  <Typography variant='caption' color='text.secondary'>
                    Result
                  </Typography>
                  <Typography variant='body2'>{transaction.isWin ? 'Won' : 'Lost'}</Typography>
                </Box>
              </Box>
            </Stack>
          </Box>
        )

      case TRANSACTION_TYPES.LUCKY_GIFT:
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems='flex-start'>
              {transaction.senderName && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CustomAvatar skin='light' color='warning' size='sm' sx={{ mr: 1.5 }}>
                      <i className='tabler-arrow-up'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Sender
                      </Typography>
                      <Typography variant='body2'>{transaction.senderName}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {transaction.receiverName && (
                <Grid item xs={12} sm={6} md={2.4}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CustomAvatar skin='light' color='warning' size='sm' sx={{ mr: 1.5 }}>
                      <i className='tabler-arrow-down'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Receiver
                      </Typography>
                      <Typography variant='body2'>{transaction.receiverName}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={2.4}>
                {transaction.giftImage && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {transaction.giftImage &&
                      (transaction.giftImage.toLowerCase().endsWith('.svga') ? (
                        <SVGAPlayer url={getFullImageUrl(transaction.giftImage)} width={40} height={40} />
                      ) : (
                        <CustomAvatar
                          src={getFullImageUrl(transaction.giftImage)}
                          skin='light'
                          size='sm'
                          sx={{ mr: 1.5 }}
                        >
                          {transaction.title}
                        </CustomAvatar>
                      ))}
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        {transaction.giftTitle}
                      </Typography>
                      <Typography variant='body2'>Coins: {transaction.giftCoin}</Typography>
                    </Box>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CustomAvatar
                    skin='light'
                    color={transaction.liveType === 1 ? 'success' : transaction.liveType === 2 ? 'info' : 'warning'}
                    size='sm'
                    sx={{ mr: 1.5 }}
                  >
                    <i className='tabler-gift'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      {transaction.liveType === 1
                        ? 'Video Live'
                        : transaction.liveType === 2
                          ? 'Audio Live'
                          : 'PK Live'}
                    </Typography>
                    <Typography variant='body2'>Count: {transaction.giftReceivedCount ?? 'N/A'}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )

      case TRANSACTION_TYPES.WITHDRAWAL_BY_USER:
        // colors according to transaction.payoutStatus 1 pending 2 success 3 failed
        return (
          <Box className='transaction-details mt-3'>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2} alignItems='flex-start'>
              <Grid item xs={12} sm={6} md={2.4}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <CustomAvatar
                    skin='light'
                    color={
                      transaction.payoutStatus === 1 ? 'warning' : transaction.payoutStatus === 2 ? 'success' : 'error'
                    }
                    size='sm'
                    sx={{ mr: 1.5 }}
                  >
                    <i className='tabler-credit-card'></i>
                  </CustomAvatar>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>
                      Withdrawal
                    </Typography>
                    <Typography variant='body2'>
                      {transaction.payoutStatus === 1
                        ? 'Pending'
                        : transaction.payoutStatus === 2
                          ? 'Success'
                          : 'Failed'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                {/* payment gateway */}
                {transaction.paymentGateway && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <CustomAvatar
                      skin='light'
                      color={
                        transaction.payoutStatus === 1
                          ? 'warning'
                          : transaction.payoutStatus === 2
                            ? 'success'
                            : 'error'
                      }
                      size='sm'
                      sx={{ mr: 1.5 }}
                    >
                      <i className='tabler-coin'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary' noWrap>
                        Payment Gateway
                      </Typography>
                      <Typography variant='body2'>{transaction.paymentGateway}</Typography>
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>
        )

      default:
        // For coin history or other transaction types with minimal info
        if (transaction.senderName || transaction.receiverName) {
          return (
            <Box className='transaction-details mt-3'>
              <Divider sx={{ mb: 2 }} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems='flex-start'>
                {transaction.senderName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <CustomAvatar skin='light' color='primary' size='sm' sx={{ mr: 1.5 }}>
                      <i className='tabler-arrow-up'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Sender
                      </Typography>
                      <Typography variant='body2'>{transaction.senderName}</Typography>
                    </Box>
                  </Box>
                )}

                {transaction.receiverName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <CustomAvatar skin='light' color='primary' size='sm' sx={{ mr: 1.5 }}>
                      <i className='tabler-arrow-down'></i>
                    </CustomAvatar>
                    <Box>
                      <Typography variant='caption' color='text.secondary'>
                        Receiver
                      </Typography>
                      <Typography variant='body2'>{transaction.receiverName}</Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Box>
          )
        }

        return null
    }
  }

  // Get the display label based on the context
  const getTransactionLabel = () => {
    // For items in specific tabs, use that tab's type label
    if (transactionType) {
      return TYPE_LABELS[transactionType]
    }

    // Otherwise, use the actual transaction type
    return TYPE_LABELS[actualType] || 'Transaction'
  }

  // This allows showing that the actual type might be different from the tab context
  const shouldShowActualTypeChip = transactionType && actualType !== transactionType

  return (
    <Paper elevation={0} className='p-4 border rounded-md mb-3'>
      {/* Header with avatar and transaction info */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }} className='md:flex-row flex-col'>
        {/* Transaction type icon based on the tab we're in */}
        {/* width full on mobile fit on laptop */}
        <Box className='flex items-center justify-between w-full md:w-auto'>
          {/* special case for withdrawal */}
          {transaction.type === TRANSACTION_TYPES.WITHDRAWAL_BY_USER && (
            <CustomAvatar
              skin='light'
              color={transaction.payoutStatus === 1 ? 'warning' : transaction.payoutStatus === 2 ? 'success' : 'error'}
              variant='rounded'
            >
              <i className='tabler-coins' />
            </CustomAvatar>
          )}
          {transaction.type !== TRANSACTION_TYPES.WITHDRAWAL_BY_USER && (
            <CustomAvatar skin='light' color={getTransactionColor(transactionType || actualType)} variant='rounded'>
              <i className={getTransactionIcon(transactionType || actualType)} />
            </CustomAvatar>
          )}
          {/* show on mobile */}
          <Box sx={{ textAlign: 'right', display: { xs: 'block', md: 'none' } }}>
            <Typography
              variant='body2'
              sx={{ fontWeight: 600 }}
              color={transaction.isIncome ? 'success.main' : 'error.main'}
            >
              {transaction.type === TRANSACTION_TYPES.WITHDRAWAL_BY_USER
                ? transaction.payoutStatus === 1
                  ? ''
                  : transaction.payoutStatus === 2
                    ? '-'
                    : ''
                : transaction.isIncome
                  ? '+'
                  : '-'}
              {transaction.coin} Coins
            </Typography>
          </Box>
        </Box>

        {/* Transaction details */}
        <Box sx={{ flexGrow: 1 }}>
          {/* Top row with transaction type and amount */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant='subtitle2'>{getTransactionLabel()}</Typography>
              <Box display='flex' alignItems='center'>
                <Typography variant='caption' color='text.secondary'>
                  ID: {transaction.uniqueId} | {formatDate(transaction.createdAt)}
                </Typography>

                {/* Show actual type if different */}
                {shouldShowActualTypeChip && (
                  <Chip
                    size='small'
                    color={getTransactionColor(actualType)}
                    label={TYPE_LABELS[actualType]}
                    variant='tonal'
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Box>
            </Box>
            {/* hide on mobile */}
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              {transaction.type === TRANSACTION_TYPES.PRIVATE_CALL ||
              transaction.type === TRANSACTION_TYPES.LIVE_GIFT ? (
                <>
                  {transaction.isIncome && transaction.receiverCoin !== undefined ? (
                    <Typography variant='body2' sx={{ fontWeight: 600 }} color='success.main'>
                      +{transaction.receiverCoin} Coins
                    </Typography>
                  ) : !transaction.isIncome && transaction.senderCoin !== undefined ? (
                    <Typography variant='body2' sx={{ fontWeight: 600 }} color='error.main'>
                      -{transaction.senderCoin} Coins
                    </Typography>
                  ) : (
                    <Typography
                      variant='body2'
                      sx={{ fontWeight: 600 }}
                      color={
                        transaction.type === TRANSACTION_TYPES.WITHDRAWAL_BY_USER
                          ? transaction.payoutStatus === 1
                            ? 'warning.main'
                            : transaction.payoutStatus === 2
                              ? 'success.main'
                              : 'error.main'
                          : transaction.isIncome
                            ? 'success.main'
                            : 'error.main'
                      }
                    >
                      {transaction.type === TRANSACTION_TYPES.WITHDRAWAL_BY_USER
                        ? transaction.payoutStatus === 1
                          ? ''
                          : transaction.payoutStatus === 2
                            ? '-'
                            : ''
                        : transaction.isIncome
                          ? '+'
                          : '-'}
                      {transaction.coin} Coins
                    </Typography>
                  )}
                </>
              ) : (
                <Typography
                  variant='body2'
                  sx={{ fontWeight: 600 }}
                  color={
                    transaction.type === TRANSACTION_TYPES.WITHDRAWAL_BY_USER
                      ? transaction.payoutStatus === 1
                        ? 'warning.main'
                        : transaction.payoutStatus === 2
                          ? 'success.main'
                          : 'error.main'
                      : transaction.isIncome
                        ? 'success.main'
                        : 'error.main'
                  }
                >
                  {transaction.type === TRANSACTION_TYPES.WITHDRAWAL_BY_USER
                    ? transaction.payoutStatus === 1
                      ? ''
                      : transaction.payoutStatus === 2
                        ? '-'
                        : ''
                    : transaction.isIncome
                      ? '+'
                      : '-'}
                  {transaction.coin} Coins
                </Typography>
              )}

              {transaction.amount > 0 && (
                <Typography variant='caption' color='text.secondary'>
                  ${transaction.amount}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Transaction specific details based on the current tab context */}
          {renderTransactionDetails()}
        </Box>
      </Box>
    </Paper>
  )
}

export { TransactionItem }
