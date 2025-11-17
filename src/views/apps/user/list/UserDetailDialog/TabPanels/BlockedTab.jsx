'use client'

import React, { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import {
  CircularProgress,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Badge,
  useTheme,
  Button
} from '@mui/material'

import { fetchBlockedUserList } from '@/redux-store/slices/user'
import UserTabShimmer from '../UserTabShimmer'
import { getInitials } from '@/util/getInitials'
import CustomAvatar from '@core/components/mui/Avatar'
import { getFullImageUrl, getUserViewUrl } from '@/util/commonfunctions'

// Empty state component
const EmptyState = () => {
  const theme = useTheme()

  return (
    <Box
      display='flex'
      flexDirection='column'
      alignItems='center'
      justifyContent='center'
      py={8}
      px={2}
      textAlign='center'
    >
      <Box
        sx={{
          borderRadius: '50%',
          p: 2,
          mb: 2
        }}
      >
        <i className='tabler-ban text-3xl' style={{ color: theme.palette.error.main }} />
      </Box>
      <Typography variant='h6' gutterBottom>
        No Blocked Users
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
        This user hasn&apos;t blocked anyone at the moment.
      </Typography>
    </Box>
  )
}

const BlockedTab = ({ userId }) => {
  const dispatch = useDispatch()
  const observerRef = useRef()
  const theme = useTheme()
  const initialFetchRef = useRef(false)
  const totalBlockedRef = useRef(0)
  const router = useRouter()
  const blocked = useSelector(state => state.userReducer.modalData.blocked)
  const loadingState = useSelector(state => state.userReducer.modalLoading.blocked)
  const { initialLoading, loading, page, reachedEnd } = loadingState

  // Fetch on first mount only
  useEffect(() => {
    if (!initialFetchRef.current && blocked.length === 0 && !loading) {
      initialFetchRef.current = true
      dispatch(fetchBlockedUserList({ userId, start: 1, limit: 8 }))
    }
  }, [userId, dispatch, loading, blocked.length])

  // Store total blocked count when available
  useEffect(() => {
    if (blocked.length > 0 && !loading && !initialLoading) {
      const response = blocked[0]?._response

      if (response && response.total) {
        totalBlockedRef.current = response.total
      }
    }
  }, [blocked, loading, initialLoading])

  // Infinite scroll
  useEffect(() => {
    // Function to set up the intersection observer
    const setupObserver = () => {
      // Clear any existing observer
      if (observerRef.current) {
        const currentObserver = observerRef.current

        if (currentObserver && 'disconnect' in currentObserver) {
          currentObserver.disconnect()
        }
      }

      // Create a new observer
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && !loading && !reachedEnd) {
            // Calculate the start parameter for pagination based on blocked users already loaded
            const nextStart = blocked.length > 0 ? Math.floor(blocked.length / 8) + 1 : 1

            dispatch(
              fetchBlockedUserList({
                userId,
                start: nextStart,
                limit: 8
              })
            )
          }
        },
        { threshold: 0.5, rootMargin: '100px' }
      )

      // Get the current loader element
      const loaderElement = document.getElementById('blocked-infinite-loader')

      // Observe the loader element if it exists
      if (loaderElement) {
        observer.observe(loaderElement)
        observerRef.current = observer
      }

      return observer
    }

    // Set up the observer
    const observer = setupObserver()

    // Cleanup function
    return () => {
      if (observer) {
        observer.disconnect()
      }
    }
  }, [loading, reachedEnd, page, userId, dispatch, blocked.length])

  const getAvatar = name => {
    return (
      <CustomAvatar size={36} skin='light' color={getAvatarColor(name)}>
        {getInitials(name || 'User')}
      </CustomAvatar>
    )
  }

  const getAvatarColor = name => {
    const colors = ['primary', 'secondary', 'success', 'error', 'warning', 'info']
    const charCode = name ? name.charCodeAt(0) : 0

    return colors[charCode % colors.length]
  }

  // Debug log total vs loaded
  const loadedBlockedCount = blocked.length
  const isAllBlockedLoaded = totalBlockedRef.current > 0 && loadedBlockedCount >= totalBlockedRef.current

  if (initialLoading) return <UserTabShimmer type='table' />

  // Show empty state when we have finished loading and have no data
  if (!initialLoading && !loading && blocked.length === 0) {
    return <EmptyState />
  }

  return (
    <Paper
      elevation={0}
      variant='outlined'
      sx={{
        borderRadius: 1,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <TableContainer sx={{ flexGrow: 1 }}>
        <Table stickyHeader size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Blocked User</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Info</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Wealth Level</TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocked.map((blockedUser, idx) => (
              <TableRow
                key={idx}
                hover
                sx={{
                  '&:last-of-type td': { borderBottom: 0 },
                  transition: 'background-color .1s ease-in-out'
                }}
              >
                <TableCell>
                  <Box display='flex' alignItems='center' gap={1.5}>
                    {blockedUser.image ? (
                      <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            component='span'
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'error.main',
                              boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                              display: 'block'
                            }}
                          />
                        }
                      >
                        <CustomAvatar src={getFullImageUrl(blockedUser.image)} size={36} />
                      </Badge>
                    ) : (
                      <Badge
                        overlap='circular'
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          <Box
                            component='span'
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: 'error.main',
                              boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                              display: 'block'
                            }}
                          />
                        }
                      >
                        {getAvatar(blockedUser.name)}
                      </Badge>
                    )}
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {blockedUser.name || 'Unknown User'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {blockedUser.userName || blockedUser.email || 'No username'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' gap={0.5}>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <i className='tabler-id text-sm' style={{ color: theme.palette.text.secondary }} />
                      <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
                        {blockedUser.uniqueId || 'No unique ID'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-calendar text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='caption'>{blockedUser.age + ' years' || 'No age'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    {blockedUser.wealthLevelImage && (
                      <img
                        src={getFullImageUrl(blockedUser.wealthLevelImage)}
                        alt='Wealth Level'
                        width={60}
                        height={30}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Box display='flex' justifyContent='center' gap={1}>
                    <Tooltip title='View Profile'>
                      <IconButton
                        size='small'
                        color='primary'
                        sx={{ border: `1px solid ${theme.palette.divider}` }}
                        onClick={() => {
                          router.push(getUserViewUrl(blockedUser._id))
                        }}
                      >
                        <i className='tabler-eye text-lg' />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        id='blocked-infinite-loader'
        display='flex'
        justifyContent='center'
        alignItems='center'
        py={2}
        bgcolor={theme.palette.mode === 'light' ? 'rgba(0, 0, 0, 0.02)' : 'rgba(255, 255, 255, 0.03)'}
        borderTop={1}
        borderColor='divider'
      >
        {loading && (
          <Box display='flex' alignItems='center' gap={1.5}>
            <CircularProgress size={16} thickness={4} color='primary' />
            <Typography variant='body2' color='text.primary'>
              Loading blocked users...
            </Typography>
          </Box>
        )}
        {isAllBlockedLoaded && blocked.length > 0 && (
          <Typography variant='body2' color='success.main'>
            {blocked.length === 1 ? '1 blocked user loaded' : `All ${blocked.length} blocked users loaded`}
          </Typography>
        )}
        {!loading && !isAllBlockedLoaded && blocked.length > 0 && (
          <Typography variant='body2' color='text.primary'>
            {`${blocked.length} ${totalBlockedRef.current > 0 ? `of ${totalBlockedRef.current}` : ''} blocked users loaded`}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default BlockedTab
