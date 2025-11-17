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

import { fetchUserFollowing } from '@/redux-store/slices/user'
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
        <i className='tabler-user-plus text-3xl' style={{ color: theme.palette.secondary.main }} />
      </Box>
      <Typography variant='h6' gutterBottom>
        Not Following Anyone
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
        This user isn&apos;t following anyone at the moment.
      </Typography>
    </Box>
  )
}

const FollowingTab = ({ userId }) => {
  const dispatch = useDispatch()
  const observerRef = useRef()
  const theme = useTheme()
  const initialFetchRef = useRef(false)
  const totalFollowingRef = useRef(0)
  const router = useRouter()
  const following = useSelector(state => state.userReducer.modalData.following)
  const loadingState = useSelector(state => state.userReducer.modalLoading.following)
  const { initialLoading, loading, page, reachedEnd } = loadingState

  useEffect(() => {
    if (!initialFetchRef.current && following.length === 0 && !loading) {
      initialFetchRef.current = true
      dispatch(fetchUserFollowing({ userId, start: 1, limit: 8 }))
    }
  }, [userId, dispatch, loading, following.length])

  // Store total following count when available
  useEffect(() => {
    if (following.length > 0 && !loading && !initialLoading) {
      const response = following[0]?._response

      if (response && response.total) {
        totalFollowingRef.current = response.total
      }
    }
  }, [following, loading, initialLoading])

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
            // Calculate the start parameter for pagination based on following already loaded
            const nextStart = following.length > 0 ? Math.floor(following.length / 8) + 1 : 1

            dispatch(
              fetchUserFollowing({
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
      const loaderElement = document.getElementById('following-infinite-loader')

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
  }, [loading, reachedEnd, page, userId, dispatch, following.length])

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
  const loadedFollowingCount = following.length
  const isAllFollowingLoaded = totalFollowingRef.current > 0 && loadedFollowingCount >= totalFollowingRef.current

  if (initialLoading) return <UserTabShimmer type='table' />

  // Show empty state when we have finished loading and have no data
  if (!initialLoading && !loading && following.length === 0) {
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
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Following</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Info</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Wealth Level</TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {following.map((user, idx) => (
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
                    {user.image ? (
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
                              backgroundColor: 'success.main',
                              boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                              display: 'block'
                            }}
                          />
                        }
                      >
                        <CustomAvatar src={getFullImageUrl(user.image)} size={36} />
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
                              backgroundColor: 'success.main',
                              boxShadow: theme => `0 0 0 2px ${theme.palette.background.paper}`,
                              display: 'block'
                            }}
                          />
                        }
                      >
                        {getAvatar(user.name)}
                      </Badge>
                    )}
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {user.name || 'Unknown User'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {user.userName || user.email || 'No username'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' gap={0.5}>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <i className='tabler-id text-sm' style={{ color: theme.palette.text.secondary }} />
                      <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>
                        {user.uniqueId || 'No unique ID'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-calendar text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='caption'>{user.age + ' years' || 'No age'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    {user.wealthLevelImage && (
                      <img src={getFullImageUrl(user.wealthLevelImage)} alt='Wealth Level' width={60} height={30} />
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
                          router.push(getUserViewUrl(user._id))
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
        id='following-infinite-loader'
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
              Loading following...
            </Typography>
          </Box>
        )}
        {isAllFollowingLoaded && following.length > 0 && (
          <Typography variant='body2' color='success.main'>
            {following.length === 1 ? 'Following 1 user' : `Following all ${following.length} users`}
          </Typography>
        )}
        {!loading && !isAllFollowingLoaded && following.length > 0 && (
          <Typography variant='body2' color='text.primary'>
            {`${following.length} ${totalFollowingRef.current > 0 ? `of ${totalFollowingRef.current}` : ''} following loaded`}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default FollowingTab
