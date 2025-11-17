'use client'

// React imports
import { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import { getFullImageUrl } from '@/util/commonfunctions'

/**
 * ! If you need data using an API call, uncomment the below API code, update the `process.env.API_URL` variable in the
 * ! `.env` file found at root of your project and also update the API endpoints like `/apps/invoice` in below example.
 * ! Also, remove the above server action import and the action itself from the `src/app/server/actions.ts` file to clean up unused code
 * ! because we've used the server action for getting our static data.
 */

const OverViewTab = ({ userDetails }) => {
  const dispatch = useDispatch()
  const { levels } = useSelector(state => state.wealthLevelReducer || { levels: [] })
  const [wealthLevel, setWealthLevel] = useState(null)

  // useEffect(() => {
  //   dispatch(getAllLevels())
  // }, [dispatch])

  useEffect(() => {
    if (levels?.length > 0 && userDetails?.wealthLevel) {
      const userWealthLevel = levels.find(level => level._id === userDetails.wealthLevel)

      setWealthLevel(userWealthLevel)
    }
  }, [levels, userDetails])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Account Information
            </Typography>
            <Divider className='mlb-4' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <div className='flex flex-col gap-4'>
                  <div>
                    <Typography color='text.secondary' className='text-sm'>
                      Account Created
                    </Typography>
                    <Typography>{new Date(userDetails?.createdAt).toLocaleString() || 'N/A'}</Typography>
                  </div>
                  {!userDetails?.isFake && (
                    <>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Last Login
                        </Typography>
                        <Typography>{userDetails?.lastlogin || 'N/A'}</Typography>
                      </div>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Identity / Device
                        </Typography>
                        <Typography className='text-wrap break-words'>{userDetails?.identity || 'N/A'}</Typography>
                      </div>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          IP Address
                        </Typography>
                        <Typography>{userDetails?.ipAddress || 'N/A'}</Typography>
                      </div>
                    </>
                  )}
                </div>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <div className='flex flex-col gap-4'>
                  {!userDetails?.isFake && (
                    <div>
                      <Typography color='text.secondary' className='text-sm'>
                        Mobile Number
                      </Typography>
                      <Typography>{userDetails?.mobileNumber || 'N/A'}</Typography>
                    </div>
                  )}
                  <div>
                    <Typography color='text.secondary' className='text-sm'>
                      Country
                    </Typography>
                    <div className='flex items-center gap-2'>
                      {userDetails?.countryFlagImage &&
                        (userDetails.countryFlagImage.includes('.') ? (
                          <CustomAvatar
                            src={userDetails.countryFlagImage}
                            alt='Country Flag'
                            variant='rounded'
                            size={24}
                          />
                        ) : (
                          <Typography component='span'>{userDetails.countryFlagImage}</Typography>
                        ))}
                      <Typography>{userDetails?.country || 'N/A'}</Typography>
                    </div>
                  </div>
                  {!userDetails?.isFake && (
                    <div>
                      <Typography color='text.secondary' className='text-sm'>
                        Provider
                      </Typography>
                      <Typography>{userDetails?.provider || 'N/A'}</Typography>
                    </div>
                  )}
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {!userDetails?.isFake && (
        <>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant='h5' className='mbe-4'>
                  Wealth & Coins Information
                </Typography>
                <Divider className='mlb-4' />

                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <div className='flex items-center gap-3'>
                        <CustomAvatar variant='rounded' color='primary' skin='light'>
                          <i className='tabler-coin' />
                        </CustomAvatar>
                        <div>
                          <Typography color='text.secondary' className='text-sm'>
                            Current Coins
                          </Typography>
                          <Typography variant='h6'>{userDetails?.coin || '0'}</Typography>
                        </div>
                      </div>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Top Up Coins
                        </Typography>
                        <Typography>{userDetails?.topUpCoins || '0'}</Typography>
                      </div>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Spent Coins
                        </Typography>
                        <Typography>{userDetails?.spentCoins || '0'}</Typography>
                      </div>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Received Coins
                        </Typography>
                        <Typography>{userDetails?.receivedCoins || '0'}</Typography>
                      </div>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Received Gifts
                        </Typography>
                        <Typography>{userDetails?.receivedGifts || '0'}</Typography>
                      </div>
                      <div>
                        <Typography color='text.secondary' className='text-sm'>
                          Withdrawn Coins
                        </Typography>
                        <Typography>{userDetails?.withdrawnCoins || '0'}</Typography>
                      </div>
                    </div>
                  </Grid>
                </Grid>

                <Divider className='mlb-6 mts-6' />

                <div className='flex flex-col gap-4'>
                  <Typography variant='h6'>Wealth Level</Typography>
                  {wealthLevel ? (
                    <div className='flex flex-col gap-3'>
                      <div className='flex flex-wrap items-center gap-4'>
                        {wealthLevel.levelImage && (
                          <img
                            src={getFullImageUrl(wealthLevel.levelImage)}
                            alt='Wealth Level'
                            className='rounded-md object-contain'
                            style={{ height: '60px', width: 'auto', maxWidth: '120px' }}
                          />
                        )}
                        <div>
                          <Typography variant='body1' className='font-medium'>
                            {wealthLevel.levelName}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Level {wealthLevel.level} • {wealthLevel.coinThreshold} Coins Threshold
                          </Typography>
                        </div>
                      </div>

                      <div className='flex flex-col gap-2 mt-2'>
                        <Typography variant='subtitle2'>Level Permissions:</Typography>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                          {wealthLevel.permissions &&
                            Object.entries(wealthLevel.permissions).map(([key, value]) => (
                              <div key={key} className='flex items-center gap-2'>
                                <i
                                  className={`tabler-${value ? 'circle-check' : 'circle-x'} text-${value ? 'success' : 'error'}`}
                                />
                                <Typography variant='body2'>
                                  {key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase())
                                    .replace('Live Streaming', 'Live Streaming')
                                    .replace('Free Call', 'Free Call')
                                    .replace('Redeem Cashout', 'Redeem Cashout')
                                    .replace('Upload Social Post', 'Upload Social Post')
                                    .replace('Upload Video', 'Upload Video')}
                                </Typography>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Typography>No wealth level assigned</Typography>
                  )}
                </div>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant='h5' className='mbe-4'>
                  Account Status
                </Typography>
                <Divider className='mlb-4' />

                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <div className='flex items-center gap-2'>
                        <Typography color='text.secondary' className='text-sm'>
                          VIP Status:
                        </Typography>
                        <Chip
                          label={userDetails?.isVIP ? 'VIP' : 'Not VIP'}
                          color={userDetails?.isVIP ? 'success' : 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </div>
                      <div className='flex items-center gap-2'>
                        <Typography color='text.secondary' className='text-sm'>
                          Block Status:
                        </Typography>
                        <Chip
                          label={userDetails?.isBlock ? 'Blocked' : 'Not Blocked'}
                          color={userDetails?.isBlock ? 'error' : 'success'}
                          size='small'
                          variant='tonal'
                        />
                      </div>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <div className='flex flex-col gap-4'>
                      <div className='flex items-center gap-2'>
                        <Typography color='text.secondary' className='text-sm'>
                          Verification Status:
                        </Typography>
                        <Chip
                          label={userDetails?.isVerified ? 'Verified' : 'Not Verified'}
                          color={userDetails?.isVerified ? 'success' : 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </div>
                      <div className='flex items-center gap-2'>
                        <Typography color='text.secondary' className='text-sm'>
                          Online Status:
                        </Typography>
                        <Chip
                          label={userDetails?.isOnline ? 'Online' : 'Offline'}
                          color={userDetails?.isOnline ? 'success' : 'default'}
                          size='small'
                          variant='tonal'
                        />
                      </div>
                    </div>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default OverViewTab
