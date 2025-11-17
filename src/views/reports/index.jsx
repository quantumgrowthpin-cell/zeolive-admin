'use client'
import React, { useEffect, useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import { format } from 'date-fns'
import {
  Card,
  CardContent,
  Tab,
  Box,
  Typography,
  Avatar,
  IconButton,
  Grid,
  Chip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Paper,
  Divider,
  AvatarGroup,
  Stack,
  TablePagination,
  MenuItem,
  CircularProgress
} from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import {
  Check as CheckIcon,
  Delete as DeleteIcon,
  VideoFile,
  Article,
  Person,
  Warning as WarningIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { toast } from 'react-toastify'

import CustomTabList from '@/@core/components/mui/TabList'
import CustomTextField from '@/@core/components/mui/TextField'
import { fetchReports, solveReport, deleteReport } from '@/redux-store/slices/reports'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { getFullImageUrl } from '@/util/commonfunctions'
import DateRangePicker from '../song/list/DateRangePicker'
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { canEditModule } from '@/util/permissions'

const Reports = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { videoReports, postReports, userReports, initialLoad } = useSelector(state => state.reports)
  const { profileData } = useSelector(state => state.adminSlice)
const canEdit = canEditModule("Reports");


  // 1️⃣ derive initial from URL or defaults
  const initialType = useMemo(() => searchParams.get('type') ?? '3', [searchParams])

  const initialStatus = useMemo(() => searchParams.get('status') ?? '1', [searchParams])

  const [reportType, setReportType] = useState(initialType)
  const [status, setStatus] = useState(initialStatus)
  const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null, id: null })
  const [solveDialog, setSolveDialog] = useState({ open: false, id: null })
  const [startDate, setStartDate] = useState('All')
  const [endDate, setEndDate] = useState('All')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Fetch reports only after initial render with URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    let needsReplace = false

    if (!searchParams.get('type')) {
      params.set('type', initialType)
      needsReplace = true
    }

    if (!searchParams.get('status')) {
      params.set('status', initialStatus)
      needsReplace = true
    }

    if (needsReplace) {
      // replace so browser history isn’t polluted
      router.replace(`${window.location.pathname}?${params.toString()}`)
    }
  }, [initialType, initialStatus, router, searchParams])

  useEffect(() => {
    if (reportType && status) {
      dispatch(
        fetchReports({
          type: parseInt(reportType),
          status: parseInt(status),
          startDate,
          endDate
        })
      )
    }
  }, [dispatch, reportType, status, startDate, endDate])

  const handleReportTypeChange = (event, newValue) => {
    setReportType(newValue)
    setStatus('1')
    setPage(1) // Reset to first page when changing report type
    // Update URL params
    updateUrlParams('type', newValue)
    updateUrlParams('status', '1')
  }

  const handleStatusChange = (event, newValue) => {
    setStatus(newValue)
    setPage(1) // Reset to first page when changing status
    // Update URL params
    updateUrlParams('status', newValue)
  }

  // Function to update URL params
  const updateUrlParams = (key, value) => {
    const params = new URLSearchParams(window.location.search)

    params.set(key, value)
    const newUrl = `${window.location.pathname}?${params.toString()}`

    window.history.pushState({ path: newUrl }, '', newUrl)
  }

  const getCurrentReports = () => {
    const reportsMap = {
      1: videoReports,
      2: postReports,
      3: userReports
    }

    return reportsMap[reportType]?.[status === '1' ? 'pending' : 'solved'] || []
  }

  const handleSolveReport = id => {


    setSolveDialog({ open: true, id })
  }

  const handleDeleteReport = id => {


    setConfirmDialog({ open: true, type: 'delete', id })
  }

  const handleConfirmSolve = async () => {
    if (solveDialog.id) {
      await dispatch(solveReport(solveDialog.id))

      // Re-fetch reports after solving (only the current active tab)
      dispatch(fetchReports({ type: parseInt(reportType), status: parseInt(status), startDate, endDate }))
      setSolveDialog({ open: false, id: null })
    }
  }

  const handleConfirmDelete = async () => {
    if (confirmDialog.id) {
      await dispatch(deleteReport(confirmDialog.id))

      // Re-fetch reports after deletion (only the current active tab)
      dispatch(fetchReports({ type: parseInt(reportType), status: parseInt(status), startDate, endDate }))
      setConfirmDialog({ open: false, type: null, id: null })
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage + 1)
  }

  const handleChangeRowsPerPage = event => {
    setPageSize(parseInt(event.target.value, 10))
    setPage(1)
  }

  const paginatedReports = getCurrentReports().slice((page - 1) * pageSize, page * pageSize)
  const totalReports = getCurrentReports().length

  const ReportTypeIcon = ({ type }) => {
    switch (type) {
      case 3: // User
        return <Person fontSize='small' />
      case 1: // Video
        return <VideoFile fontSize='small' />
      case 2: // Post
        return <Article fontSize='small' />
      default:
        return null
    }
  }

  // Function to render media content based on report type
  const renderMediaContent = (report, type) => {
    switch (type) {
      case 1: // Video
        return report.videoImage ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component='img'
              src={getFullImageUrl(report.videoImage)}
              alt='Video thumbnail'
              sx={{
                width: 60,
                height: 40,
                objectFit: 'cover',
                borderRadius: 1
              }}
            />
            <Typography variant='body2' color='text.secondary'>
              Video ID: {report.uniqueVideoId}
            </Typography>
          </Box>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No thumbnail
          </Typography>
        )
      case 2: // Post
        return report.postImage ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              component='img'
              src={getFullImageUrl(report.postImage)}
              alt='Post'
              sx={{
                width: 60,
                height: 60,
                objectFit: 'cover',
                borderRadius: 1
              }}
            />
            <Typography variant='body2' color='text.secondary'>
              Post ID: {report.uniquePostId}
            </Typography>
          </Box>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No image
          </Typography>
        )
      case 3: // User
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={getFullImageUrl(report.toUserImage)} alt={report.toUserName} sx={{ width: 50, height: 50 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant='body2' color='text.secondary'>
                Name: {report.toUserName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Username: {report.toUserUserName}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                User ID: {report.toUserUniqueId}
              </Typography>
            </Box>
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Box className='md:relative'>
      <Box mb={5} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h5' sx={{ mb: { xs: 2, sm: 0 } }}>
          Report Management
        </Typography>
        <DateRangePicker
          buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter by Date'}
          buttonStartIcon={<FilterListIcon />}
          initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
          initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
          onApply={(start, end) => {
            setStartDate(start)
            setEndDate(end)
          }}
          showClearButton={startDate !== 'All' && endDate !== 'All'}
          onClear={() => {
            setStartDate('All')
            setEndDate('All')
          }}
        />
      </Box>

      <TabContext value={reportType}>
        <Box className='md:absolute md:left-0'>
          <CustomTabList onChange={handleReportTypeChange} variant='scrollable' pill='true'>
            <Tab
              icon={<Person />}
              value='3'
              label='User Reports'
              iconPosition='start'
              sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            />
            <Tab
              icon={<VideoFile />}
              value='1'
              label='Video Reports'
              iconPosition='start'
              sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            />
            <Tab
              icon={<Article />}
              value='2'
              label='Post Reports'
              iconPosition='start'
              sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
            />
          </CustomTabList>
        </Box>

        <TabContext value={status}>
          <Box className='md:absolute md:right-0'>
            <CustomTabList onChange={handleStatusChange} variant='scrollable' pill='true'>
              <Tab value='1' label='Pending' />
              <Tab value='2' label='Solved' />
            </CustomTabList>
          </Box>
          <TabPanel value={status}>
            <Card className='md:mt-20'>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 3 }}>
                <CustomTextField select value={pageSize} onChange={handleChangeRowsPerPage} sx={{ width: 70 }}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </CustomTextField>
              </Box>

              {initialLoad ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                  <CircularProgress sx={{ color: 'primary.main' }} />
                </Box>
              ) : paginatedReports.length > 0 ? (
                <Box sx={{ overflowX: 'auto' }}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>Reporter</th>
                        <th>Report Reason</th>
                        {reportType === '3' && <th>Reported User</th>}
                        {reportType === '1' && <th>Reported Video</th>}
                        {reportType === '2' && <th>Reported Post</th>}
                        <th>Date</th>
                        {canEdit &&<th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedReports.map(report => (
                        <tr key={report._id}>
                          <td>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar
                                src={getFullImageUrl(report.image)}
                                alt={report.name}
                                sx={{ width: 50, height: 50 }}
                              />
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant='body2'>Name: {report.name}</Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  Username: {report.userName}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  User ID: {report.uniqueId}
                                </Typography>
                              </Box>
                            </Box>
                          </td>
                          <td>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              <WarningIcon color='error' fontSize='small' />
                              <Typography variant='body2' color='error.main'>
                                {report.reportReason}
                              </Typography>
                            </Box>
                          </td>
                          <td>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {renderMediaContent(report, parseInt(reportType))}
                            </Box>
                          </td>
                          <td>
                            <Typography variant='body2' color='text.secondary'>
                              {format(new Date(report.createdAt), 'MMM d, yyyy')}
                            </Typography>
                          </td>
                          {canEdit && <td>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {status === '1' && (
                                <Button
                                  size='small'
                                  variant='contained'
                                  color='success'
                                  startIcon={<CheckIcon />}
                                  onClick={() => handleSolveReport(report._id)}
                                >
                                  Solve
                                </Button>
                              )}
                              <Button
                                size='small'
                                variant='outlined'
                                color='error'
                                startIcon={<DeleteIcon />}
                                onClick={() => handleDeleteReport(report._id)}
                              >
                                Delete
                              </Button>
                            </Box>
                          </td>}
                          {paginatedReports.length < pageSize && (
                            <tr>
                              <td colSpan={8}>&nbsp;</td>
                            </tr>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
                  <table className={tableStyles.table}>
                    <thead>
                      <tr>
                        <th>Reporter</th>
                        <th>Report Reason</th>
                        {reportType === '3' && <th>Reported User</th>}
                        {reportType === '1' && <th>Reported Video</th>}
                        {reportType === '2' && <th>Reported Post</th>}
                        <th>Date</th>
                        {canEdit && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: pageSize }).map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                          {idx === Math.floor(pageSize / 2) ? (
                            <td colSpan={8} align='center'>
                              No {status === '1' ? 'Pending' : 'Solved'} Reports
                            </td>
                          ) : (
                            <td colSpan={8}>&nbsp;</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              )}

              <TablePaginationComponent
                page={page}
                pageSize={pageSize}
                total={totalReports}
                onPageChange={newPage => setPage(newPage)}
                customText={`Showing ${totalReports === 0 ? 0 : (page - 1) * pageSize + 1} to ${Math.min(page * pageSize, totalReports)} of ${totalReports} entries`}
              />
            </Card>
          </TabPanel>
        </TabContext>
      </TabContext>

      {/* Solve Confirmation Dialog */}
      <Dialog
        open={solveDialog.open}
        onClose={() => setSolveDialog({ open: false, id: null })}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>Mark as Solved</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to mark this report as solved?</Typography>
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
        title='Delete Report'
        content='Are you sure you want to delete this report? This action cannot be undone.'
        confirmButtonText='Delete'
        confirmButtonColor='error'
      />
    </Box>
  )
}

export default Reports
