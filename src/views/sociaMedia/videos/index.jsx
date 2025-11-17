'use client'

import React, { useState, useEffect, forwardRef, useMemo, useRef } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import { format, parse, isValid } from 'date-fns'

// MUI Imports
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Chip from '@mui/material/Chip'
import Slide from '@mui/material/Slide'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FavoriteIcon from '@mui/icons-material/Favorite'
import CommentIcon from '@mui/icons-material/Comment'
import { TablePagination } from '@mui/material'

import { toast } from 'react-toastify'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'

// Component Imports
import VideoDialog from '@/components/dialogs/video-dialog'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import TablePaginationComponent from '@components/TablePaginationComponent'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import SocialDrawer from '@/components/drawers/social-drawer'
import DateRangePicker from '@/views/song/list/DateRangePicker'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Action Imports
import { fetchVideos, setVideoType, setDateRange, deleteVideo, setPage, setLimit } from '@/redux-store/slices/videos'

// Utils
import { getFullImageUrl } from '@/util/commonfunctions'
import { canEditModule } from '@/util/permissions'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Column Helper
const columnHelper = createColumnHelper()

const Videos = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const canEdit = canEditModule("Social Media Videos");

  const { videos, loading, initialLoading, selectedVideoType, hasMore, startDate, endDate, start, limit, total } =
    useSelector(state => state.videos)

  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const [previewVideo, setPreviewVideo] = useState(null)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)

  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  })

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState('likes')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [refreshLoading, setRefreshLoading] = useState(false)

  const { profileData } = useSelector(state => state.adminSlice)



  // Define columns for the table
  const columns = useMemo(
    () => 
      { 
        const baseColumns = [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('user', {
        header: 'User',
        cell: ({ row }) => {
          const post = row.original

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CustomAvatar src={getFullImageUrl(post.userImage)} size={50} alt={post.name || 'User'} />
              <Box>
                <Typography color='text.primary'>{post.name}</Typography>
                <Typography variant='caption' color='text.secondary'>
                  {post.userName}
                </Typography>
              </Box>
            </Box>
          )
        }
      }),
      columnHelper.accessor('videoImage', {
        header: 'Video',
        cell: ({ row }) => {
          const video = row.original

          return (
            <Box className='flex items-center gap-4'>
              <Box
                sx={{
                  position: 'relative',
                  width: '80px',
                  height: '60px',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                <CustomAvatar
                  src={getFullImageUrl(video.videoImage)}
                  variant='rounded'
                  alt={video.caption || 'Video Thumbnail'}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <IconButton
                  size='small'
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                    }
                  }}
                  onClick={() => handlePreviewVideo(video)}
                >
                  <PlayArrowIcon fontSize='small' sx={{ color: 'white' }} />
                </IconButton>
              </Box>
              <Box>
                <Typography
                  color='text.primary'
                  className='font-medium'
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {video.caption || 'Untitled Video'}
                </Typography>
                {video.hashTags && video.hashTags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {video.hashTags.slice(0, 3).map(tag => (
                      <Chip
                        key={tag._id}
                        label={tag.hashTag}
                        size='small'
                        variant='outlined'
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {video.hashTags.length > 3 && (
                      <Chip label={`+${video.hashTags.length - 3}`} size='small' sx={{ mr: 0.5, mb: 0.5 }} />
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          )
        }
      }),
      columnHelper.accessor('mentionedUsers', {
        header: 'Mentioned Users',
        cell: ({ row }) => {
          const video = row.original
          const mentionedUsers = video.mentionedUsers || []

          if (!mentionedUsers.length)
            return (
              <Typography variant='body2' color='text.secondary'>
                None
              </Typography>
            )

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {mentionedUsers.map(user => (
                <Box key={user._id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar src={getFullImageUrl(user.image)} alt={user.name} sx={{ width: 40, height: 40 }} />
                  <Box display='flex' flexDirection='column'>
                    <Typography variant='caption' color='text.primary'>
                      {user.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {user.userName.startsWith('@') ? user.userName : `@${user.userName}`}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )
        }
      }),
      columnHelper.accessor('totalLikes', {
        header: 'Interactions',
        cell: ({ row }) => {
          const video = row.original

          return (
            <Box className='flex flex-col items-center gap-1'>
              <Box className='flex items-center gap-3'>
                <Button
                  size='small'
                  startIcon={<FavoriteIcon fontSize='small' />}
                  variant='text'
                  color='error'
                  onClick={() => handleOpenDrawer('likes', video._id)}
                >
                  {video.totalLikes || 0}
                </Button>
                <Button
                  size='small'
                  startIcon={<CommentIcon fontSize='small' />}
                  variant='text'
                  onClick={() => handleOpenDrawer('comments', video._id)}
                >
                  {video.totalComments || 0}
                </Button>
              </Box>
            </Box>
          )
        }
      }),
      columnHelper.accessor('videoTime', {
        header: 'Duration',
        cell: ({ row }) => {
          // Format duration in seconds to MM:SS
          const formatDuration = seconds => {
            if (!seconds) return '00:00'
            const minutes = Math.floor(seconds / 60)
            const remainingSeconds = seconds % 60

            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
          }

          return (
            <Typography color='text.primary' className='text-center'>
              {formatDuration(row.original.videoTime)}
            </Typography>
          )
        },
        enableSorting: true
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        cell: ({ row }) => {
          const video = row.original

          return (
            <Box className='flex items-center'>
              <Box className='flex flex-col'>
                <Typography color='text.primary'>
                  {video.createdAt
                    ? new Date(video.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : '-'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {video.createdAt
                    ? new Date(video.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : ''}
                </Typography>
              </Box>
            </Box>
          )
        },
        enableSorting: true
      }),
      columnHelper.accessor('action', {
        header: () => <div className='text-center'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            <Tooltip title='View Video'>
              <IconButton onClick={() => handlePreviewVideo(row.original)}>
                <RemoveRedEyeIcon fontSize='small' />
              </IconButton>
            </Tooltip>

            {canEdit &&<Tooltip title='Edit Video'>
              <IconButton
                onClick={() => {


                  handleEditVideo(row.original)
                }}
              >
                <EditIcon fontSize='small' />
              </IconButton>
            </Tooltip>}

           {canEdit && <Tooltip title='Delete Video'>
              <IconButton
                color='error'
                onClick={() => {


                  handleDeleteVideo(row.original)
                }}
              >
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>}
          </div>
        ),
        enableSorting: false
      })
    ]

  
return baseColumns.filter(col => col.id !== 'select' || canEdit);
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedVideoType]
  )

  // Table instance
  const table = useReactTable({
    data: videos || [],
    columns,
    state: {
      rowSelection,
      globalFilter,
      pagination
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Track the previous URL parameters to avoid duplicate API calls
  const prevParamsRef = useRef({
    type: null,
    page: null,
    limit: null,
    startDate: null,
    endDate: null
  })

  useEffect(() => {
    // Skip if we're not mounted yet
    if (!searchParams) return

    // Get all URL parameters
    const videoTypeParam = searchParams.get('type')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Ensure selectedVideoType is in sync with URL
    const currentType = videoTypeParam === 'fakeVideo' ? 'fakeVideo' : 'realVideo'

    if (currentType !== selectedVideoType) {
      dispatch(setVideoType(currentType))
    }

    // Current parameters for the API call
    const apiParams = {
      type: currentType,
      start: pageParam ? parseInt(pageParam) : 1,
      limit: limitParam ? parseInt(limitParam) : 10,
      startDate: startDateParam || 'All',
      endDate: endDateParam || 'All'
    }

    // Check if this would be a duplicate API call
    const paramsMatch =
      prevParamsRef.current.type === apiParams.type &&
      prevParamsRef.current.page === apiParams.start &&
      prevParamsRef.current.limit === apiParams.limit &&
      prevParamsRef.current.startDate === apiParams.startDate &&
      prevParamsRef.current.endDate === apiParams.endDate

    // Only fetch if params have changed
    if (!paramsMatch) {
      // Store current params to avoid duplicate calls
      prevParamsRef.current = {
        type: apiParams.type,
        page: apiParams.start,
        limit: apiParams.limit,
        startDate: apiParams.startDate,
        endDate: apiParams.endDate
      }

      // Make the API call
      dispatch(fetchVideos(apiParams))
    }
  }, [searchParams, selectedVideoType, dispatch])

  useEffect(() => {
    setDateFilter({
      startDate: startDate !== 'All' ? parse(startDate, 'yyyy-MM-dd', new Date()) : null,
      endDate: endDate !== 'All' ? parse(endDate, 'yyyy-MM-dd', new Date()) : null
    })
  }, [startDate, endDate])

  const handleVideoTypeChange = (_, newType) => {
    if (newType !== null && newType !== selectedVideoType) {
      // Reset date filter in UI state
      setDateFilter({
        startDate: null,
        endDate: null
      })

      // Update URL with new video type and reset pagination
      const params = new URLSearchParams(searchParams.toString())

      params.set('type', newType)
      params.set('page', '1') // Reset to page 1 when changing type

      // Remove date filters from URL if they exist
      if (params.has('startDate')) params.delete('startDate')
      if (params.has('endDate')) params.delete('endDate')

      // Use router.push to update URL without full page reload
      router.push(`?${params.toString()}`, undefined, { shallow: true })

      // No need to dispatch setVideoType - the useEffect will handle it
    }
  }

  const handleCreateVideo = () => {


    setEditData(null)
    setVideoDialogOpen(true)
  }

  const clearDateFilter = () => {
    // Reset the date filter UI state
    setDateFilter({
      startDate: null,
      endDate: null
    })

    // Update URL to remove date filters
    const params = new URLSearchParams(searchParams.toString())

    params.delete('startDate')
    params.delete('endDate')
    params.set('page', '1') // Reset to page 1 when clearing filters
    router.push(`?${params.toString()}`, undefined, { shallow: true })

    // Dispatch setDateRange which will handle the redux state reset
    dispatch(
      setDateRange({
        startDate: 'All',
        endDate: 'All'
      })
    )
  }

  const handleEditVideo = video => {


    setEditData(video)
    setVideoDialogOpen(true)
  }

  const handlePreviewVideo = video => {
    setPreviewVideo(video)
    setPreviewDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setVideoDialogOpen(false)
    setEditData(null)
  }

  const handleClosePreviewDialog = () => {
    setPreviewDialogOpen(false)
    setPreviewVideo(null)
  }

  const isDateFiltered = startDate !== 'All' || endDate !== 'All'

  // DebouncedInput Component for Search
  const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
      setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
      const timeout = setTimeout(() => {
        onChange(value)
      }, debounce)

      return () => clearTimeout(timeout)
    }, [value, debounce, onChange])

    return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
  }

  // Handle pagination changes
  const handlePageChange = newPage => {
    // Update URL when page changes
    const params = new URLSearchParams(searchParams.toString())

    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`, undefined, { shallow: true })

    // No need to dispatch setPage here, it will be handled by the searchParams effect
  }

  const handleOpenDrawer = (type, itemId) => {
    setDrawerType(type)
    setSelectedItemId(itemId)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedItemId(null)
  }

  const handleDeleteVideo = video => {


    setVideoToDelete(video)
    setDeleteError(null)
    setConfirmDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!videoToDelete) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const resultAction = await dispatch(deleteVideo(videoToDelete))

      if (deleteVideo.rejected.match(resultAction)) {
        setDeleteError(resultAction.payload || 'Failed to delete video')
      } else {
        // Success - close dialog
        setConfirmDeleteDialogOpen(false)
        setVideoToDelete(null)
      }
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete video')
    }

    setDeleteLoading(false)
  }

  const handleCancelDelete = () => {
    setConfirmDeleteDialogOpen(false)
    setVideoToDelete(null)
    setDeleteError(null)
  }

  return (
    <Box className='pbs-6 container'>
      <Box className='flex justify-between items-center flex-wrap gap-4 mbe-6'>
        <Typography variant='h4' className='font-bold'>
          {selectedVideoType === 'realVideo' ? 'Real Videos' : 'Fake Videos'}
        </Typography>
        <Box className='flex gap-2'>
          <DateRangePicker
            buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter by Date'}
            buttonVariant='outlined'
            buttonClassName='shadow-sm'
            buttonStartIcon={<FilterListIcon />}
            initialStartDate={dateFilter.startDate}
            initialEndDate={dateFilter.endDate}
            onApply={(startDate, endDate) => {
              // Update URL with date filters
              const params = new URLSearchParams(searchParams.toString())

              if (startDate !== 'All') {
                params.set('startDate', startDate)
              } else {
                params.delete('startDate')
              }

              if (endDate !== 'All') {
                params.set('endDate', endDate)
              } else {
                params.delete('endDate')
              }

              // Reset to page 1 when applying filters
              params.set('page', '1')
              router.push(`?${params.toString()}`, undefined, { shallow: true })

              // Dispatch setDateRange which will handle the redux state reset
              dispatch(
                setDateRange({
                  startDate: startDate,
                  endDate: endDate
                })
              )
            }}
            showClearButton={startDate !== 'All' && endDate !== 'All'}
            onClear={clearDateFilter}
          />

          {selectedVideoType === 'fakeVideo' && canEdit && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={handleCreateVideo}
              className='shadow-sm hover:shadow-md transition-all'
            >
              Upload Video
            </Button>
          )}
        </Box>
      </Box>

      <Box className='mbe-6'>
        <ToggleButtonGroup
          value={selectedVideoType}
          exclusive
          onChange={handleVideoTypeChange}
          aria-label='video type'
          size='medium'
          color='primary'
          className='shadow-sm'
        >
          <ToggleButton value='realVideo' className='px-6'>
            Real Videos
          </ToggleButton>
          <ToggleButton value='fakeVideo' className='px-6'>
            Fake Videos
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={limit}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              // Update URL with new limit
              const params = new URLSearchParams(searchParams.toString())

              params.set('limit', newPageSize.toString())
              params.set('page', '1') // Reset to page 1 when changing page size
              router.push(`?${params.toString()}`, undefined, { shallow: true })

              // Update table state
              table.setPageSize(newPageSize)
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search Videos'
              className='max-sm:is-full'
            />
          </div>
        </div>

        {initialLoading ? (
          <div className='flex items-center justify-center gap-2 grow is-full my-10'>
            <CircularProgress />
            <Typography>Loading...</Typography>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              className={classnames({
                                'flex items-center': header.column.getIsSorted(),
                                'cursor-pointer select-none': header.column.getCanSort()
                              })}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: <i className='tabler-chevron-up text-xl' />,
                                desc: <i className='tabler-chevron-down text-xl' />
                              }[header.column.getIsSorted()] ?? null}
                            </div>
                          </>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length > 0 ? (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Filler empty rows to maintain table height */}
                    {Array.from({ length: limit - table.getRowModel().rows.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        {columns.map((_, colIdx) => (
                          <td key={colIdx} className='px-4 py-3'>
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  Array.from({ length: limit }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      {idx === Math.floor(limit / 2) ? (
                        <td colSpan={columns.length} className='text-center py-6'>
                          <Box className='flex flex-col items-center justify-center'>
                            <Typography variant='h6'>No Videos Found</Typography>
                            {isDateFiltered && (
                              <Button
                                variant='outlined'
                                color='primary'
                                size='small'
                                onClick={clearDateFilter}
                                className='mt-2'
                              >
                                Clear Date Filter
                              </Button>
                            )}
                          </Box>
                        </td>
                      ) : (
                        columns.map((_, colIdx) => (
                          <td key={colIdx} className='px-4 py-3'>
                            &nbsp;
                          </td>
                        ))
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          component={() => (
            <TablePaginationComponent
              page={start}
              pageSize={limit}
              total={total || 0}
              onPageChange={newPage => {
                // Update URL with new page number
                const params = new URLSearchParams(searchParams.toString())

                params.set('page', newPage.toString())
                router.push(`?${params.toString()}`, undefined, { shallow: true })
              }}
            />
          )}
          count={total || 0}
          rowsPerPage={limit}
          page={start - 1}
          onPageChange={(_, newPage) => {}}
          onRowsPerPageChange={e => {
            const newPageSize = Number(e.target.value)

            // Update URL with new limit
            const params = new URLSearchParams(searchParams.toString())

            params.set('limit', newPageSize.toString())
            params.set('page', '1') // Reset to page 1 when changing page size
            router.push(`?${params.toString()}`, undefined, { shallow: true })
          }}
        />
      </Card>

      {/* Video dialog for create/edit */}
      <VideoDialog open={videoDialogOpen} onClose={handleCloseDialog} editData={editData} />

      {/* Video Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handleClosePreviewDialog}
        maxWidth='md'
        fullWidth
        TransitionComponent={Transition}
        PaperProps={{
          sx: {
            overflow: 'visible',
            width: '600px',
            maxWidth: '95vw'
          }
        }}
      >
        <DialogTitle>
          <Box className='flex gap-2'>
            <CustomAvatar src={getFullImageUrl(previewVideo?.userImage)} size={50} alt={previewVideo?.name || 'User'} />
            <Box>
              <Typography variant='body1'>{previewVideo?.name}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {previewVideo?.userName}
              </Typography>
            </Box>
          </Box>
          <DialogCloseButton onClick={handleClosePreviewDialog}>
            <CloseIcon />
          </DialogCloseButton>
        </DialogTitle>
        <DialogContent>
          {previewVideo && (
            <>
              <Box sx={{ height: '500px', mb: 2 }}>
                <video
                  controls
                  width='100%'
                  height='100%'
                  poster={getFullImageUrl(previewVideo.videoImage)}
                  src={getFullImageUrl(previewVideo.videoUrl)}
                >
                  Your browser does not support the video tag.
                </video>
              </Box>

              {previewVideo.caption && <Typography variant='body1'>{previewVideo.caption}</Typography>}

              {previewVideo.mentionedUsers && previewVideo.mentionedUsers.length > 0 && (
                <Box className='flex flex-wrap gap-1 mb-2'>
                  {previewVideo.mentionedUsers.map(user => (
                    <Box key={user._id} className='flex items-center gap-2 bg-gray-100 px-2 py-1 rounded'>
                      <Avatar src={getFullImageUrl(user.image)} alt={user.name} sx={{ width: 35, height: 35 }} />
                      <Box>
                        <Typography variant='body2' fontWeight='bold'>
                          {user.name}
                        </Typography>
                        <Typography variant='caption' color='textSecondary'>
                          {user.userName.startsWith('@') ? user.userName : `@${user.userName}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}

              {previewVideo.hashTags && previewVideo.hashTags.length > 0 && (
                <Box className='flex flex-wrap gap-1 mb-2'>
                  {previewVideo.hashTags.map(tag => (
                    <Chip key={tag._id} label={tag.hashTag} size='small' color='primary' variant='outlined' />
                  ))}
                </Box>
              )}

              <Box className='flex gap-2 mt-2'>
                <Chip
                  icon={<i className='tabler-thumb-up' />}
                  label={`${previewVideo.totalLikes || 0} likes`}
                  size='small'
                  variant='outlined'
                />
                <Chip
                  icon={<i className='tabler-message' />}
                  label={`${previewVideo.totalComments || 0} comments`}
                  size='small'
                  variant='outlined'
                />
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Social Drawer for Comments and Likes */}
      <SocialDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        type='video'
        itemId={selectedItemId}
        drawerType={drawerType}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={confirmDelete}
        title='Delete Video'
        content='Are you sure you want to delete this video? This action cannot be undone.'
        loading={deleteLoading}
        error={deleteError}
        type='delete-video'
      />
    </Box>
  )
}

export default Videos
