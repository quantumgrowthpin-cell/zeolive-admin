'use client'

import React, { useEffect, useRef } from 'react'

import { useRouter } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Badge,
  Stack,
  CircularProgress,
  Tooltip,
  IconButton
} from '@mui/material'
import { useTheme } from '@mui/system'
import { format } from 'date-fns'
import { useInView } from 'react-intersection-observer'

import VisitorShimmer from '../VisitorShimmer'
import { fetchVisitedProfiles } from '@/redux-store/slices/user'
import { getFullImageUrl, getUserViewUrl } from '@/util/commonfunctions'

const VisitedTab = ({ userId }) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const router = useRouter()
  const observerRef = useRef()

  const { modalData, modalLoading } = useSelector(state => state.userReducer)
  const visited = modalData.visited || []
  const { initialLoading, loading, reachedEnd, page } = modalLoading.visited || {}

  // Setup intersection observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0.1
  })

  useEffect(() => {
    if (initialLoading) {
      dispatch(fetchVisitedProfiles({ userId, start: 1, limit: 20 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, userId])

  // Load more data when the last element comes into view
  useEffect(() => {
    if (inView && !loading && !reachedEnd && !initialLoading) {
      dispatch(fetchVisitedProfiles({ userId, start: page, limit: 20 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, loading, reachedEnd, dispatch, userId, page, initialLoading])

  if (initialLoading) return <VisitorShimmer />

  if (!visited.length) {
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
          <i className='tabler-users text-3xl' style={{ color: theme.palette.success.main }} />
        </Box>
        <Typography variant='h6' gutterBottom>
          No Visited Profiles
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
          This user hasn&apos;t visited any profiles yet.
        </Typography>
      </Box>
    )
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
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Profile</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Unique ID</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Visited On</TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visited.map((profile, index) => (
              <TableRow
                key={profile._id}
                ref={index === visited.length - 1 ? ref : null}
                hover
                sx={{
                  '&:last-of-type td': { borderBottom: 0 },
                  transition: 'background-color .1s ease-in-out'
                }}
              >
                <TableCell>
                  <Box display='flex' alignItems='center' gap={1.5}>
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
                      <Avatar
                        src={profile.image ? getFullImageUrl(profile.image) : null}
                        alt={profile.name}
                        sx={{ width: 36, height: 36 }}
                      />
                    </Badge>
                    <Box>
                      <Stack direction='row' alignItems='center' spacing={1}>
                        <Typography variant='body2' fontWeight={500}>
                          {profile.name || 'Unknown'}
                        </Typography>
                        {profile.wealthLevelImage && (
                          <Avatar
                            src={getFullImageUrl(profile.wealthLevelImage)}
                            alt='wealth'
                            sx={{ width: 24, height: 24 }}
                          />
                        )}
                      </Stack>
                      <Typography variant='caption' color='text.secondary'>
                        {profile.userName || profile.email || 'No username'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' gap={0.5}>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <i className='tabler-id text-sm' style={{ color: theme.palette.text.secondary }} />
                      <Typography variant='body2'>{profile.uniqueId || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-calendar text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='body2'>{profile.age ? `${profile.age} years` : 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-clock text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='body2'>{format(new Date(profile.localVisitedAt), 'MMM dd, yyyy')}</Typography>
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Box display='flex' justifyContent='center' gap={1}>
                    <Tooltip title='View Profile'>
                      <IconButton
                        size='small'
                        color='primary'
                        sx={{ border: `1px solid ${theme.palette.divider}` }}
                        onClick={() => router.push(getUserViewUrl(profile._id))}
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
        id='visited-infinite-loader'
      >
        {loading && (
          <Box display='flex' alignItems='center' gap={1.5}>
            <CircularProgress size={16} thickness={4} />
            <Typography variant='caption' color='text.secondary'>
              Loading visited profiles
            </Typography>
          </Box>
        )}
        {!loading && visited.length > 0 && (
          <Typography variant='caption' color='text.secondary'>
            {visited.length === 1 ? '1 profile visited' : `${visited.length} profiles visited`}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default VisitedTab
