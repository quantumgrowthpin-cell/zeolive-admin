import { useState, useEffect, useCallback, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  Avatar,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Card
} from '@mui/material'

import { fetchAgencyCommissionHistory, resetHistoryPagination } from '../../redux-store/slices/agency'
import { getFullImageUrl } from '@/util/commonfunctions'
import DateRangePicker from '@/views/song/list/DateRangePicker'

// History item skeleton for loading state
const HistoryItemSkeleton = () => (
  <Box sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Box sx={{ width: '40%', height: 24, bgcolor: 'action.hover', borderRadius: 1 }} />
      <Box sx={{ width: '20%', height: 24, bgcolor: 'action.hover', borderRadius: 1 }} />
    </Box>
    <Box sx={{ width: '60%', height: 20, bgcolor: 'action.hover', borderRadius: 1, mb: 1 }} />
    <Box sx={{ width: '30%', height: 20, bgcolor: 'action.hover', borderRadius: 1 }} />
  </Box>
)

const AgencyHistoryDrawer = ({ open, onClose, agencyId, agency }) => {
  const dispatch = useDispatch()
  const observer = useRef()
  const [localStartDate, setLocalStartDate] = useState('All')
  const [localEndDate, setLocalEndDate] = useState('All')

  // Get history state from Redux
  const { history, historyTotal, historyLoading, historyInitialLoading, historyHasMore, totalCommission, settings } =
    useSelector(state => ({
      ...state.agency,
      settings: state.settings.settings
    }))

  // Reset pagination when drawer opens or agencyId changes
  useEffect(() => {
    if (open && agencyId) {
      dispatch(resetHistoryPagination())
      dispatch(
        fetchAgencyCommissionHistory({
          agencyId,
          startDate: localStartDate,
          endDate: localEndDate
        })
      )
    }
  }, [dispatch, open, agencyId, localStartDate, localEndDate])

  // Load more history items
  const loadMoreHistory = useCallback(() => {
    if (!historyLoading && historyHasMore && agencyId) {
      dispatch(
        fetchAgencyCommissionHistory({
          agencyId,
          start: history.length > 0 ? Math.ceil(history.length / 20) + 1 : 1,
          limit: 20,
          startDate: localStartDate,
          endDate: localEndDate
        })
      )
    }
  }, [dispatch, historyLoading, historyHasMore, agencyId, history.length, localStartDate, localEndDate])

  // Last element ref for infinite scrolling
  const lastHistoryElementRef = useCallback(
    node => {
      if (historyLoading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && historyHasMore) {
            setTimeout(() => {
              loadMoreHistory()
            }, 100)
          }
        },
        {
          rootMargin: '100px',
          threshold: 0.1
        }
      )
      if (node) observer.current.observe(node)
    },
    [historyLoading, historyHasMore, loadMoreHistory]
  )

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  // Handle date range change
  const handleDateRangeChange = (startDate, endDate) => {
    setLocalStartDate(startDate)
    setLocalEndDate(endDate)
  }

  // reset date on close
  useEffect(() => {
    if (!open) {
      setLocalStartDate('All')
      setLocalEndDate('All')
    }
  }, [open])

  return (
    <Drawer
      anchor='right'
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: '400px',
          zIndex: 1300
        }
      }}
    >
      <Box
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant='h5' fontWeight='600'>
            Commission History
          </Typography>
          <IconButton onClick={onClose} edge='end'>
            <i className='tabler-x' />
          </IconButton>
        </Box>

        {/* Agency Details */}
        <Card
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            boxShadow: 'none',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            {/* Left Side - Agency Details */}
            {agency && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={getFullImageUrl(agency.image) || ''}
                  alt={agency.agencyName}
                  sx={{ width: 50, height: 50 }}
                />

                <Box>
                  <Typography variant='subtitle1' fontWeight='600'>
                    {agency.agencyName || '-'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {agency.agencyCode || '-'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Right Side - Total Commission */}
            <Stack direction='row' alignItems='center' spacing={1}>
              <Avatar
                sx={{
                  bgcolor: theme => theme.palette.primary.main,
                  color: theme => theme.palette.common.white,
                  width: 50,
                  height: 50
                }}
              >
                <i className='tabler-coins' />
              </Avatar>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant='body2' color='text.secondary'>
                  Total
                </Typography>
                <Typography variant='subtitle1' fontWeight='600'>
                  {totalCommission?.toLocaleString() || '0'} {settings?.currency?.symbol || '$'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

        {/* Date Range Filter */}
        <Box sx={{ mb: 2 }}>
          <DateRangePicker
            buttonText={
              localStartDate !== 'All' && localEndDate !== 'All'
                ? `${localStartDate} - ${localEndDate}`
                : 'Filter by Date'
            }
            buttonSize='small'
            buttonVariant='outlined'
            buttonStartIcon={<i className='tabler-calendar' />}
            buttonClassName='w-full'
            initialStartDate={localStartDate !== 'All' ? new Date(localStartDate) : null}
            initialEndDate={localEndDate !== 'All' ? new Date(localEndDate) : null}
            onApply={handleDateRangeChange}
            showClearButton={localStartDate !== 'All' && localEndDate !== 'All'}
            onClear={() => {
              setLocalStartDate('All')
              setLocalEndDate('All')
            }}
          />
        </Box>

        {/* Transaction count */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant='body2' color='text.secondary'>
            {historyTotal} Transaction{historyTotal !== 1 ? 's' : ''}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* History List */}
        {historyInitialLoading ? (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <HistoryItemSkeleton key={index} />
            ))}
          </Box>
        ) : history.length === 0 ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 3,
              textAlign: 'center'
            }}
          >
            <i className='tabler-history text-6xl mb-4 opacity-50' />
            <Typography variant='h6'>No Commission History</Typography>
            <Typography variant='body2' color='text.secondary'>
              This agency doesn&apos;t have any commission transactions yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List disablePadding>
              {history.map((item, index) => {
                const isLastItem = index === history.length - 1
                const date = new Date(item.createdAt).toLocaleDateString()
                const isCall = item.baseType === 5
                const isGift = item.baseType === 6

                return (
                  <ListItem
                    key={item._id}
                    disablePadding
                    ref={isLastItem ? lastHistoryElementRef : null}
                    sx={{
                      display: 'block',
                      mb: 2,
                      p: 0
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant='subtitle1' fontWeight='500'>
                            Commission
                          </Typography>
                          {isCall && <Chip size='small' label='Call' color='error' variant='tonal' />}
                          {isGift && <Chip size='small' label='Gift' color='warning' variant='tonal' />}
                        </Box>
                        <Chip size='small' label={item.uniqueId} color='info' variant='outlined' />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant='h6' fontWeight='600' color='success.main'>
                          +{item.coin.toLocaleString()} {settings?.currency?.symbol || '$'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='body2' color='text.secondary'>
                          Base: {item.baseCoins.toLocaleString()} {settings?.currency?.symbol || '$'}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          Rate: {item.commissionRate}%
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant='body2' color='text.secondary'>
                          From: {item.senderName}
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          To: {item.receiverName}
                        </Typography>
                      </Box>

                      <Typography variant='body2' color='text.secondary'>
                        {date}
                      </Typography>
                    </Paper>
                  </ListItem>
                )
              })}
            </List>

            {/* Loading indicator */}
            {historyLoading && !historyInitialLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* End of list indicator */}
            {!historyHasMore && history.length > 0 && (
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant='body2' color='text.secondary'>
                  No more transactions
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  )
}

export default AgencyHistoryDrawer
