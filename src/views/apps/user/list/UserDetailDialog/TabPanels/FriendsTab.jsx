'use client'

import React, { useEffect, useRef } from 'react'

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

import { fetchUserFriends } from '@/redux-store/slices/user'
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
          // backgroundColor: theme.palette.success.light,
          borderRadius: '50%',
          p: 2,
          mb: 2
        }}
      >
        <i className='tabler-friends text-3xl' style={{ color: theme.palette.success.main }} />
      </Box>
      <Typography variant='h6' gutterBottom>
        No Friends Yet
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
        This user doesn&apos;t have any friends added at the moment.
      </Typography>
    </Box>
  )
}

const FriendsTab = ({ userId }) => {
  const dispatch = useDispatch()
  const observerRef = useRef()
  const theme = useTheme()
  const initialFetchRef = useRef(false)
  const router = useRouter()

  const friends = useSelector(state => state.userReducer.modalData.friends)
  const loadingState = useSelector(state => state.userReducer.modalLoading.friends)
  const { initialLoading, loading, page, reachedEnd } = loadingState

  useEffect(() => {
    if (!initialFetchRef.current && page === 1 && friends.length === 0 && !loading) {
      initialFetchRef.current = true
      dispatch(fetchUserFriends({ userId, start: 1, limit: 20 }))
    }
  }, [userId, dispatch, page, loading, friends.length])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && !reachedEnd) {
          dispatch(fetchUserFriends({ userId, start: page, limit: 20 }))
        }
      },
      { threshold: 1 }
    )

    const current = observerRef.current

    if (current) observer.observe(current)

    return () => {
      if (current) observer.unobserve(current)
    }
  }, [loading, reachedEnd, page, userId, dispatch])

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

  if (initialLoading) return <UserTabShimmer type='table' />

  // Show empty state when we have finished loading and have no data
  if (!initialLoading && !loading && friends.length === 0) {
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
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Friend</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Info</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Wealth Level</TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {friends.map((user, idx) => (
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
                      <Typography variant='body2'>{user.uniqueId || 'No unique ID'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-calendar text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='body2'>{user.age + ' years' || 'No age'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <img src={getFullImageUrl(user.wealthLevelImage)} alt='Wealth Level' width={60} height={30} />
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
        display='flex'
        justifyContent='center'
        alignItems='center'
        py={2}
        ref={observerRef}
        bgcolor={theme.palette.background.paper}
        borderTop={1}
        borderColor='divider'
        id='friends-infinite-loader'
      >
        {loading && (
          <Box display='flex' alignItems='center' gap={1.5}>
            <CircularProgress size={16} thickness={4} />
            <Typography variant='caption' color='text.secondary'>
              Loading friends
            </Typography>
          </Box>
        )}
        {!loading && friends.length > 0 && (
          <Typography variant='caption' color='text.secondary'>
            {friends.length === 1 ? '1 friend loaded' : `${friends.length} friends loaded`}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default FriendsTab
