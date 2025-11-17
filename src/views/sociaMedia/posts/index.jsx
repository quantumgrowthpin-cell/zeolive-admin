'use client'

import React, { useState, useEffect, useCallback, useRef, forwardRef, useMemo } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import { format, parse, isValid } from 'date-fns'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
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
import { TablePagination } from '@mui/material'

// Icons
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import FavoriteIcon from '@mui/icons-material/Favorite'
import CommentIcon from '@mui/icons-material/Comment'
import ShareIcon from '@mui/icons-material/Share'
import CollectionsIcon from '@mui/icons-material/Collections'
import RefreshIcon from '@mui/icons-material/Refresh'
import FakeIcon from '@mui/icons-material/SentimentVeryDissatisfied'
import RealIcon from '@mui/icons-material/Verified'

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
import PostDialog from '@/components/dialogs/post-dialog'
import DialogCloseButton from '@/components/dialogs/DialogCloseButton'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import ImageSliderDialog from '@/components/dialogs/image-slider-dialog'
import SocialDrawer from '@/components/drawers/social-drawer'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import DateRangePicker from '../../song/list/DateRangePicker'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Action Imports
import { fetchPosts, setPostType, setDateRange, resetPagination, deletePost, setPage } from '@/redux-store/slices/posts'

// Utils
import { getFullImageUrl } from '@/util/commonfunctions'
import { canEditModule } from '@/util/permissions'

const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction='up' ref={ref} {...props} />
})

// Column Helper
const columnHelper = createColumnHelper()

const Posts = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const canEdit = canEditModule("Social Media Posts");

  const { posts, loading, initialLoading, selectedPostType, hasMore, startDate, endDate, start, limit, total } =
    useSelector(state => state.posts)

  const [postDialogOpen, setPostDialogOpen] = useState(false)
  const [dateFilterDialogOpen, setDateFilterDialogOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [imageSliderOpen, setImageSliderOpen] = useState(false)
  const [selectedPostImages, setSelectedPostImages] = useState([])
  const [selectedPostData, setSelectedPostData] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState('likes')
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  // Add missing dateFilter state
  const [dateFilter, setDateFilter] = useState({
    startDate: null,
    endDate: null
  })

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  })

  const { profileData } = useSelector(state => state.adminSlice)



  // Track the previous URL parameters to avoid duplicate API calls
  const prevParamsRef = useRef({
    type: null,
    page: null,
    limit: null,
    startDate: null,
    endDate: null
  })

  // Define columns for the table
  const columns = useMemo(
    () => {
      
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
      columnHelper.accessor('caption', {
        header: 'Post',
        cell: ({ row }) => {
          const post = row.original

          const mainImage =
            post.mainPostImage || (post.postImage && post.postImage.length > 0 ? post.postImage[0].url : null)

          const hasMultipleImages = post.postImage && post.postImage.length > 1

          return (
            <Box className='flex items-center gap-4'>
              <Box sx={{ position: 'relative' }}>
                {mainImage && (
                  <CustomAvatar
                    src={getFullImageUrl(mainImage)}
                    size={60}
                    variant='rounded'
                    alt={post.caption || 'Post Image'}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleViewImages(post)}
                  />
                )}
                {hasMultipleImages && (
                  <IconButton
                    size='small'
                    sx={{
                      position: 'absolute',
                      right: -8,
                      bottom: -8,
                      backgroundColor: 'primary',
                      color: 'white'
                    }}
                    onClick={() => handleViewImages(post)}
                  >
                    <CollectionsIcon fontSize='small' />
                  </IconButton>
                )}
              </Box>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                    {post.caption || 'Untitled Post'}
                  </Typography>
                </Box>
                {post.hashTags && post.hashTags.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {post.hashTags.slice(0, 3).map(tag => (
                      <Chip
                        key={tag._id}
                        label={tag.hashTag}
                        size='small'
                        variant='outlined'
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                    {post.hashTags.length > 3 && (
                      <Chip label={`+${post.hashTags.length - 3}`} size='small' sx={{ mr: 0.5, mb: 0.5 }} />
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
          const post = row.original
          const mentionedUsers = post.mentionedUsers || []

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
          const post = row.original

          return (
            <Box className='flex items-center gap-1'>
              <Button
                size='small'
                startIcon={<FavoriteIcon fontSize='small' />}
                variant='text'
                color='error'
                onClick={() => handleOpenDrawer('likes', post._id)}
              >
                {post.totalLikes || 0}
              </Button>
              <Button
                size='small'
                startIcon={<CommentIcon fontSize='small' />}
                variant='text'
                onClick={() => handleOpenDrawer('comments', post._id)}
              >
                {post.totalComments || 0}
              </Button>
            </Box>
          )
        }
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        cell: ({ row }) => {
          const post = row.original

          return (
            <Box className='flex items-center'>
              <Box className='flex flex-col'>
                <Typography color='text.primary'>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : '-'}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleTimeString('en-US', {
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
        cell: ({ row }) => {
          const post = row.original

          return (
            <div className='flex items-center justify-center'>
              <Tooltip title='View Post'>
                <IconButton onClick={() => handleViewImages(post)}>
                  <RemoveRedEyeIcon fontSize='small' />
                </IconButton>
              </Tooltip>

              <>
                {canEdit && <Tooltip title='Edit Post'>
                  <IconButton
                    onClick={() => {


                      handleEditPost(post)
                    }}
                  >
                    <EditIcon fontSize='small' />
                  </IconButton>
                </Tooltip>}

                {canEdit &&
                <Tooltip title='Delete Post'>
                  <IconButton
                    color='error'
                    onClick={() => {


                      handleDeletePost(post)
                    }}
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Tooltip>}
              </>
            </div>
          )
        },
        enableSorting: false
      })
    ]

  
return baseColumns.filter(col => col.id !== 'select' || canEdit);
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedPostType]
  )

  // Table instance
  const table = useReactTable({
    data: posts || [],
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

  // Replace the two existing useEffects for URL param changes and fetching with a single unified one
  useEffect(() => {
    // Skip if we're not mounted yet
    if (!searchParams) return

    // Get all URL parameters
    const postTypeParam = searchParams.get('type')
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Ensure selectedPostType is in sync with URL
    const currentType = postTypeParam === 'fakePost' ? 'fakePost' : 'realPost'

    if (currentType !== selectedPostType) {
      dispatch(setPostType(currentType))
    }

    // Current parameters for the API call
    const apiParams = {
      type: currentType,
      start: pageParam ? parseInt(pageParam) : 1,
      limit: limitParam ? parseInt(limitParam) : 10,
      startDate: startDate,
      endDate: endDate
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
        startDate: startDate,
        endDate: endDate
      }

      // Make the API call
      dispatch(fetchPosts(apiParams))
    }
  }, [searchParams, selectedPostType, dispatch, startDate, endDate])

  // Keep UI state in sync with Redux state
  useEffect(() => {
    setDateFilter({
      startDate: startDate !== 'All' ? parse(startDate, 'yyyy-MM-dd', new Date()) : null,
      endDate: endDate !== 'All' ? parse(endDate, 'yyyy-MM-dd', new Date()) : null
    })
  }, [startDate, endDate])

  // Update handlePostTypeChange to only update the URL, not dispatch actions
  const handlePostTypeChange = (_, newType) => {
    if (newType !== null && newType !== selectedPostType) {
      // Reset date filter in UI state
      setDateFilter({
        startDate: 'All',
        endDate: 'All'
      })

      // Update URL with new post type and reset pagination
      const params = new URLSearchParams(searchParams.toString())

      params.set('type', newType)
      params.set('page', '1') // Reset to page 1 when changing type

      // Remove date filters from URL if they exist
      if (params.has('startDate')) params.delete('startDate')
      if (params.has('endDate')) params.delete('endDate')

      // Use router.push to update URL without full page reload
      router.push(`?${params.toString()}`, undefined, { shallow: true })

      // No need to dispatch setPostType - the useEffect will handle it
    }
  }

  // Fix the clear date filter function to update URL
  const clearDateFilter = () => {
    setDateFilter({
      startDate: 'All',
      endDate: 'All'
    })

    setDateFilterDialogOpen(false)
  }

  const handleCreatePost = () => {


    setEditData(null)
    setPostDialogOpen(true)
  }

  const handleEditPost = post => {


    // Normalize the post data structure to handle both API response formats
    const normalizedPost = {
      ...post,

      // If post has userId object, extract relevant fields
      name: post.userId?.name || post.name,
      userName: post.userId?.userName || post.userName,
      userImage: post.userId?.image || post.userImage,

      // Extract just the ID from userId if it's an object
      userId: post.userId?._id || post.userId
    }

    setEditData(normalizedPost)
    setPostDialogOpen(true)
  }

  const handleViewImages = post => {
    // Make sure we have the correct image data structure
    const postImages = post.postImage || []

    // Normalize the post data structure to handle both API response formats
    const normalizedPost = {
      ...post,

      // If post has userId object, extract relevant fields
      name: post.userId?.name || post.name,
      userName: post.userId?.userName || post.userName,
      userImage: post.userId?.image || post.userImage
    }

    // If no images found, still show the dialog but with the main post image
    if (postImages.length === 0 && post.mainPostImage) {
      // Create a compatible format for the slider
      const formattedImages = [{ url: post.mainPostImage }]

      setSelectedPostImages(formattedImages)
    } else {
      setSelectedPostImages(postImages)
    }

    setSelectedPostData(normalizedPost)
    setImageSliderOpen(true)
  }

  const handleCloseImageSlider = () => {
    setImageSliderOpen(false)
    setSelectedPostImages([])
    setSelectedPostData(null)
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

  const handleCloseDialog = () => {
    setPostDialogOpen(false)
    setEditData(null)
  }

  const handleDeletePost = post => {
    setPostToDelete(post)
    setDeleteError(null)
    setConfirmDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!postToDelete) return

    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const resultAction = await dispatch(deletePost(postToDelete._id))

      if (deletePost.rejected.match(resultAction)) {
        setDeleteError(resultAction.payload || 'Failed to delete post')
      } else {
        // Success - close dialog
        setConfirmDeleteDialogOpen(false)
        setPostToDelete(null)
      }
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete post')
    }

    setDeleteLoading(false)
  }

  const handleCancelDelete = () => {
    setConfirmDeleteDialogOpen(false)
    setPostToDelete(null)
    setDeleteError(null)
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

  // Fix the page size dropdown
  const handlePageSizeChange = e => {
    const newPageSize = Number(e.target.value)

    // Update table state
    table.setPageSize(newPageSize)
    table.setPageIndex(0)

    // Update URL with new limit
    const params = new URLSearchParams(searchParams.toString())

    params.set('limit', newPageSize.toString())
    params.set('page', '1') // Reset to page 1 when changing page size
    router.push(`?${params.toString()}`, undefined, { shallow: true })
  }

  return (
    <Box className='pbs-6 container'>
      <Box className='flex justify-between items-center flex-wrap gap-4 mbe-6'>
        <Typography variant='h4' className='font-bold'>
          {selectedPostType === 'realPost' ? 'Real Posts' : 'Fake Posts'}
        </Typography>
        <Box className='flex gap-2'>
          <DateRangePicker
            buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter by Date'}
            buttonVariant='outlined'
            buttonClassName='shadow-sm'
            buttonStartIcon={<FilterListIcon />}
            initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
            initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
            setAction={setDateRange}
            showClearButton={startDate !== 'All' || endDate !== 'All'}
            onClear={() => {
              dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
              dispatch(setPage(1))
            }}
            onApply={(newStart, newEnd) => {
              dispatch(setDateRange({ startDate: newStart, endDate: newEnd }))
              dispatch(setPage(1))
            }}
          />
          {selectedPostType === 'fakePost' && canEdit && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={handleCreatePost}
              className='shadow-sm hover:shadow-md transition-all'
            >
              Create Post
            </Button>
          )}
        </Box>
      </Box>

      <Box className='mbe-6'>
        <ToggleButtonGroup
          value={selectedPostType}
          exclusive
          onChange={handlePostTypeChange}
          aria-label='post type'
          size='medium'
          color='primary'
          className='shadow-sm'
        >
          <ToggleButton value='realPost' className='px-6'>
            Real Posts
          </ToggleButton>
          <ToggleButton value='fakePost' className='px-6'>
            Fake Posts
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={table.getState().pagination.pageSize}
            onChange={handlePageSizeChange}
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
              placeholder='Search Posts'
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

                    {/* Filler empty rows */}
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
                            <Typography variant='h6'>No Posts Found</Typography>
                            {isDateFiltered && (
                              <Button variant='outlined' color='primary' size='small' onClick={clearDateFilter}>
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
                // Update URL with new page
                const params = new URLSearchParams(searchParams.toString())

                params.set('page', newPage.toString())
                router.push(`?${params.toString()}`, undefined, { shallow: true })
              }}
            />
          )}
          count={total || 0}
          rowsPerPage={limit}
          page={start - 1}
          onPageChange={(_, newPage) => {
            // Update URL with new page
            const params = new URLSearchParams(searchParams.toString())

            params.set('page', (newPage + 1).toString())
            router.push(`?${params.toString()}`, undefined, { shallow: true })
          }}
          onRowsPerPageChange={handlePageSizeChange}
        />
      </Card>

      {/* Post dialog for create/edit */}
      <PostDialog open={postDialogOpen} onClose={handleCloseDialog} editData={editData} />

      {/* Image Slider Dialog */}
      <ImageSliderDialog
        open={imageSliderOpen}
        onClose={handleCloseImageSlider}
        images={selectedPostImages}
        postData={selectedPostData}
      />

      {/* Social Drawer for Comments and Likes */}
      <SocialDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        type='post'
        itemId={selectedItemId}
        drawerType={drawerType}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDeleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={confirmDelete}
        title='Delete Post'
        content='Are you sure you want to delete this post? This action cannot be undone.'
        loading={deleteLoading}
        error={deleteError}
        type='delete-post'
      />
    </Box>
  )
}

export default Posts
