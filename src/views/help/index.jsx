'use client'
import React, { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  useTheme,
  useMediaQuery,
  Card,
  Divider
} from '@mui/material'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import Tab from '@mui/material/Tab'
import { format } from 'date-fns'
import {
  Check as CheckIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Image as ImageIcon
} from '@mui/icons-material'
import { toast } from 'react-toastify'

import TablePaginationComponent from '@/components/TablePaginationComponent'

import { fetchHelpRequests, solveHelpRequest, deleteHelpRequest } from '@/redux-store/slices/help'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { getFullImageUrl } from '@/util/commonfunctions'
import { canEditModule } from '@/util/permissions'

const HelpRequestTable = ({ requests, onSolve, onDelete, loading }) => {
  const [imagePreview, setImagePreview] = useState({ open: false, src: '' })
  const theme = useTheme()
  const { profileData } = useSelector(state => state.adminSlice)

const canEdit = canEditModule("Help");


  const openImagePreview = src => {
    setImagePreview({ open: true, src: getFullImageUrl(src) })
  }

  const closeImagePreview = () => {
    setImagePreview({ open: false, src: '' })
  }

  if (loading) {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Help Request</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Image</TableCell>
              <TableCell align='right' sx={{ fontWeight: 600 }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3].map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton variant='circular' width={40} height={40} />
                </TableCell>
                <TableCell>
                  <Skeleton variant='text' width={150} />
                </TableCell>
                <TableCell>
                  <Skeleton variant='text' width={200} />
                </TableCell>
                <TableCell>
                  <Skeleton variant='text' width={100} />
                </TableCell>
                <TableCell>
                  <Skeleton variant='text' width={80} />
                </TableCell>
                <TableCell>
                  <Skeleton variant='rectangular' width={50} height={50} />
                </TableCell>
                <TableCell align='right'>
                  <Skeleton variant='circular' width={30} height={30} sx={{ ml: 'auto' }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  if (requests.length === 0) {
    return (
      <Card sx={{ textAlign: 'center', py: 8, borderRadius: 2 }}>
        <Typography variant='h6' color='text.secondary' gutterBottom>
          No help requests available
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          There are no help requests to display at this time.
        </Typography>
      </Card>
    )
  }

  // Always render the table for all screen sizes
  return (
    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: theme => theme.palette.action.hover }}>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>User</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Help Request</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Contact</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Image</TableCell>
            {canEdit && <TableCell align='right' sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              Actions
            </TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map(request => (
            <TableRow key={request._id} hover>
              <TableCell>
                <Avatar src={getFullImageUrl(request.userId.image)} alt={request.userId.name} />
              </TableCell>
              <TableCell>
                <Typography variant='subtitle2'>{request.userId.name}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {request.userId.userName.startsWith('@') ? request.userId.userName : `@${request.userId.userName}`}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='body2' sx={{ maxWidth: 300, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {request.help}
                </Typography>
              </TableCell>
              <TableCell>
                {request.contact ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {request.contact.includes('@') ? (
                      <EmailIcon fontSize='small' color='primary' />
                    ) : (
                      <PhoneIcon fontSize='small' color='primary' />
                    )}
                    <Typography variant='body2'>{request.contact}</Typography>
                  </Box>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                <Typography variant='body2'>{request.date}</Typography>
              </TableCell>
              <TableCell>
                {request.image ? (
                  <IconButton size='small' onClick={() => openImagePreview(request.image)}>
                    <ImageIcon color='primary' />
                  </IconButton>
                ) : (
                  <Typography variant='body2'>-</Typography>
                )}
              </TableCell>
              {canEdit && <TableCell align='right'>
                <Box display='flex' justifyContent='flex-end' gap={1}>
                  {onSolve && (
                    <IconButton
                      color='success'
                      onClick={() => {


                        onSolve(request._id)
                      }}
                      title='Mark as Solved'
                      size='small'
                    >
                      <CheckIcon />
                    </IconButton>
                  )}
                  <IconButton
                    color='error'
                    onClick={() => {


                      onDelete(request._id)
                    }}
                    title='Delete'
                    size='small'
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreview.open}
        onClose={closeImagePreview}
        maxWidth='md'
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Image Attachment
        </DialogTitle>
        <DialogContent>
          {imagePreview.src && (
            <img
              src={imagePreview.src}
              alt='Help request attachment'
              style={{ maxWidth: '100%', display: 'block', margin: '0 auto' }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeImagePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </TableContainer>
  )
}

const Help = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const dispatch = useDispatch()
  const { pendingRequests, solvedRequests, loading, pendingTotal, solvedTotal } = useSelector(state => state.help)
  const [activeTab, setActiveTab] = useState(tabParam === '2' ? '2' : '1')
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, id: null })
  const [solveDialog, setSolveDialog] = useState({ open: false, id: null })

  // Pagination state
  const [pendingPage, setPendingPage] = useState(1)
  const [solvedPage, setSolvedPage] = useState(1)
  const [limit] = useState(10)

  // Handle URL updates when tab changes
  useEffect(() => {
    //dfdfd

    const params = new URLSearchParams(searchParams.toString())

    params.set('tab', activeTab)

    router.push(`?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchParams])

  // Listen for URL parameter changes from back/forward navigation
  useEffect(() => {
    if (tabParam && (tabParam === '1' || tabParam === '2')) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch data only on mount, tab change, or relevant page change
  useEffect(() => {
    if (activeTab === '1') {
      dispatch(fetchHelpRequests({ status: 1, start: pendingPage, limit }))
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } else if (activeTab === '2') {
      dispatch(fetchHelpRequests({ status: 2, start: solvedPage, limit }))

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }

    // Only run when tab or relevant page changes
  }, [activeTab, pendingPage, solvedPage, dispatch, limit])

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  const handleSolveRequest = id => {
    setSolveDialog({ open: true, id })
  }

  const handleDeleteRequest = id => {
    setConfirmDialog({ open: true, type: 'delete', id })
  }

  const handleConfirmSolve = async () => {
    if (solveDialog.id) {
      await dispatch(solveHelpRequest(solveDialog.id))

      // Refetch only the current tab's data ONCE

      if (activeTab === '1') {
        dispatch(fetchHelpRequests({ status: 1, start: pendingPage, limit }))
      } else {
        dispatch(fetchHelpRequests({ status: 2, start: solvedPage, limit }))
      }

      setSolveDialog({ open: false, id: null })
    }
  }

  const handleConfirmDelete = async () => {
    if (confirmDialog.id) {
      await dispatch(deleteHelpRequest(confirmDialog.id))

      // Refetch only the current tab's data ONCE
      if (activeTab === '1') {
        dispatch(fetchHelpRequests({ status: 1, start: pendingPage, limit }))
      } else {
        dispatch(fetchHelpRequests({ status: 2, start: solvedPage, limit }))
      }

      setConfirmDialog({ open: false, type: null, id: null })
    }
  }

  return (
    <Box p={3}>
      <Typography variant='h5' gutterBottom sx={{ mb: 3 }}>
        Help Requests
      </Typography>

      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <TabList onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
            <Tab
              label={
                <Box display='flex' alignItems='center' gap={1}>
                  <span>Pending</span>
                </Box>
              }
              value='1'
            />
            <Tab
              label={
                <Box display='flex' alignItems='center' gap={1}>
                  <span>Solved</span>
                </Box>
              }
              value='2'
            />
          </TabList>
        </Box>

        <TabPanel value='1' sx={{ p: 0 }}>
          <HelpRequestTable
            requests={pendingRequests}
            onSolve={handleSolveRequest}
            onDelete={handleDeleteRequest}
            loading={loading}
          />
          <TablePaginationComponent
            page={pendingPage}
            pageSize={limit}
            total={pendingTotal}
            onPageChange={setPendingPage}
          />
        </TabPanel>

        <TabPanel value='2' sx={{ p: 0 }}>
          <HelpRequestTable requests={solvedRequests} onDelete={handleDeleteRequest} loading={loading} />
          <TablePaginationComponent
            page={solvedPage}
            pageSize={limit}
            total={solvedTotal}
            onPageChange={setSolvedPage}
          />
        </TabPanel>
      </TabContext>

      {/* Solve Confirmation Dialog */}
      <Dialog
        open={solveDialog.open}
        onClose={() => setSolveDialog({ open: false, id: null })}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Mark as Solved</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to mark this help request as solved?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: theme => theme.spacing(2, 3) }}>
          <Button onClick={() => setSolveDialog({ open: false, id: null })}>Cancel</Button>
          <Button onClick={handleConfirmSolve} color='success' variant='contained'>
            Mark as Solved
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null, id: null })}
        onConfirm={handleConfirmDelete}
        title='Delete Help Request'
        content='Are you sure you want to delete this help request? This action cannot be undone.'
        confirmButtonText='Delete'
        confirmButtonColor='error'
      />
    </Box>
  )
}

export default Help
