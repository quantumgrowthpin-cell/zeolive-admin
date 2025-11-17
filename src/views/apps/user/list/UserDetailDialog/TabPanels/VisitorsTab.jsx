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
  CircularProgress,
  Button,
  Badge,
  Tooltip,
  IconButton
} from '@mui/material'

import { useTheme } from '@mui/system'
import { format } from 'date-fns'
import { useInView } from 'react-intersection-observer'

import { fetchProfileVisitors } from '@/redux-store/slices/user'
import VisitorShimmer from '../VisitorShimmer'
import { getFullImageUrl, getUserViewUrl } from '@/util/commonfunctions'

const VisitorsTab = ({ userId }) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const router = useRouter()
  const observerRef = useRef()

  const { modalData, modalLoading } = useSelector(state => state.userReducer)
  const visitors = modalData.visitors || []
  const { initialLoading, loading, reachedEnd, page } = modalLoading.visitors || {}

  // Setup intersection observer for infinite scroll
  const { ref, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    if (initialLoading) {
      dispatch(fetchProfileVisitors({ userId, start: 1, limit: 20 }))
    }
  }, [dispatch, userId, initialLoading])

  useEffect(() => {
    if (inView && !loading && !reachedEnd && !initialLoading) {
      dispatch(fetchProfileVisitors({ userId, start: page, limit: 20 }))
    }
  }, [inView, loading, reachedEnd, dispatch, userId, page, initialLoading])

  if (initialLoading) return <VisitorShimmer />

  if (!visitors.length) {
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
          No Visitors Yet
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 300, mb: 2 }}>
          This user doesn&apos;t have any visitors at the moment.
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
              <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Visitor</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Unique ID</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Age</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>wealth Level</TableCell>
              <TableCell sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>Visited On</TableCell>
              <TableCell align='right' sx={{ fontWeight: 600, py: 1.5, textAlign: 'center' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visitors.map((visitor, index) => (
              <TableRow
                key={visitor._id}
                ref={index === visitors.length - 1 ? ref : null}
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
                        src={visitor.image ? getFullImageUrl(visitor.image) : null}
                        alt={visitor.name}
                        sx={{ width: 36, height: 36 }}
                      />
                    </Badge>
                    <Box>
                      <Typography variant='body2' fontWeight={500}>
                        {visitor.name || 'Unknown'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {visitor.userName || visitor.email || 'No username'}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' flexDirection='column' alignItems='center' justifyContent='center' gap={0.5}>
                    <Box display='flex' alignItems='center' gap={0.5}>
                      <i className='tabler-id text-sm' style={{ color: theme.palette.text.secondary }} />
                      <Typography variant='body2'>{visitor.uniqueId || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-calendar text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='body2'>{visitor.age ? `${visitor.age} years` : 'N/A'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    {visitor.wealthLevelImage && (
                      <img src={getFullImageUrl(visitor.wealthLevelImage)} alt='Wealth Level' width={60} height={30} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display='flex' alignItems='center' justifyContent='center' gap={0.5}>
                    <i className='tabler-clock text-sm' style={{ color: theme.palette.text.secondary }} />
                    <Typography variant='body2'>{format(new Date(visitor.localVisitedAt), 'MMM dd, yyyy')}</Typography>
                  </Box>
                </TableCell>
                <TableCell align='right'>
                  <Box display='flex' justifyContent='center' gap={1}>
                    <Tooltip title='View Profile'>
                      <IconButton
                        size='small'
                        color='primary'
                        sx={{ border: `1px solid ${theme.palette.divider}` }}
                        onClick={() => router.push(`/visitor/${visitor._id}`)}
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
        id='visitors-infinite-loader'
      >
        {loading && (
          <Box display='flex' alignItems='center' gap={1.5}>
            <CircularProgress size={16} thickness={4} />
            <Typography variant='caption' color='text.secondary'>
              Loading visitors
            </Typography>
          </Box>
        )}
        {!loading && visitors.length > 0 && (
          <Typography variant='caption' color='text.secondary'>
            {visitors.length === 1 ? '1 visitor loaded' : `${visitors.length} visitors loaded`}
          </Typography>
        )}
      </Box>
    </Paper>
  )
}

export default VisitorsTab
