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

import { fetchCoinTraderHistory, resetHistoryPagination } from '../../redux-store/slices/coinTrader'
import { getFullImageUrl } from '@/util/commonfunctions'

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

const HistoryDrawer = ({ open, onClose, traderId, trader }) => {
  const dispatch = useDispatch()
  const observer = useRef()

  // Get history state from Redux
  const { history, historyTotal, historyLoading, historyInitialLoading, historyHasMore, totalCoin, settings } =
    useSelector(state => ({
      ...state.coinTrader,
      settings: state.settings.settings
    }))

  // Reset pagination when drawer opens or traderId changes
  useEffect(() => {
    if (open && traderId) {
      dispatch(resetHistoryPagination())
      dispatch(fetchCoinTraderHistory({ traderId }))
    }
  }, [dispatch, open, traderId])

  // Load more history items
  const loadMoreHistory = useCallback(() => {
    if (!historyLoading && historyHasMore && traderId) {
      dispatch(
        fetchCoinTraderHistory({
          traderId,
          start: history.length > 0 ? Math.ceil(history.length / 10) + 1 : 1,
          limit: 10
        })
      )
    }
  }, [dispatch, historyLoading, historyHasMore, traderId, history.length])

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
            Transaction History
          </Typography>
          <IconButton onClick={onClose} edge='end'>
            <i className='tabler-x' />
          </IconButton>
        </Box>

        {/* Trader Details */}
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
            {/* Left Side - Trader Details */}
            {trader?.userDetails && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={getFullImageUrl(trader.userDetails.image) || ''}
                  alt={trader.userDetails.name || trader.userDetails.userName}
                  sx={{ width: 50, height: 50 }}
                >
                  {!trader.userDetails.image && trader.userDetails.name ? trader.userDetails.name.charAt(0) : ''}
                </Avatar>

                <Box>
                  <Typography variant='subtitle1' fontWeight='600'>
                    {trader.userDetails.name || '-'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {trader.userDetails.userName || '-'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Right Side - Total Coin */}
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
                  {totalCoin?.toLocaleString() || '0'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>

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
            <Typography variant='h6'>No Transaction History</Typography>
            <Typography variant='body2' color='text.secondary'>
              This coin trader doesn&apos;t have any transactions yet.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List disablePadding>
              {history.map((item, index) => {
                const isLastItem = index === history.length - 1

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
                        <Typography variant='subtitle1' fontWeight='500'>
                          {item.userId
                            ? `${item.isIncome ? 'Received from' : 'Sent to'} ${item.userId.name || item.userId.userName}`
                            : item.isIncome
                              ? 'Added by Admin'
                              : 'Deducted by Admin'}
                        </Typography>
                        <Chip
                          size='small'
                          label={item.isIncome ? 'Income' : 'Deducted'}
                          color={item.isIncome ? 'success' : 'error'}
                          variant='outlined'
                        />
                      </Box>

                      {item.userId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant='body2' color='text.secondary'>
                            {item.userId.userName || ''}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                        <Typography variant='h6' fontWeight='600' color={item.isIncome ? 'success.main' : 'error.main'}>
                          {item.isIncome ? '+' : '-'}
                          {item.coin.toLocaleString()}
                        </Typography>
                        <i className={`tabler-coins text-xl ${item.isIncome ? 'text-success' : 'text-error'}`} />
                      </Box>

                      <Typography variant='body2' color='text.secondary'>
                        {item.date}
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

export default HistoryDrawer
