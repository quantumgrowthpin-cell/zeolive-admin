'use client'

// React Imports
import { useEffect, useState, useMemo, useRef } from 'react'

// Next Imports
import Link from 'next/link'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import { styled, useTheme } from '@mui/material/styles'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import { CardHeader, Chip, CircularProgress } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
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

import { useDispatch, useSelector } from 'react-redux'

import { toast } from 'react-toastify'

// Component Imports
import TableFilters from './TableFilters'
import AddUserDrawer from './AddUserDrawer'
import EditUserDrawer from './EditUserDrawer'
import LiveUserDrawer from './LiveUserDrawer'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import DateRangePicker from '@/views/song/list/DateRangePicker'

// Util Imports
import { getInitials } from '@/util/getInitials'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import {
  toggleUserBlockStatus,
  setSearchQuery,
  deleteUser,
  deleteLiveUser,
  toggleStreamingStatus,
  setPage,
  setPageSize,
  setDateRange,
  fetchUsers
} from '@/redux-store/slices/user'
import { emojiToCountryFlag, getFormattedDate, getFullImageUrl, getRoleDetails } from '@/util/commonfunctions'
import UserDetailDialog from './UserDetailDialog/UserDetailDialog'

import defaultFlag from '../../../../../public/images/flags/default.png'
import DummyUserInfoDialog from './UserDetailDialog/DummyUserInfoDialog'
import { canEditModule } from '@/util/permissions'

// Styled Components
const Icon = styled('i')({})

const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({
    itemRank
  })

  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, updateUrlPagination, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const [debouncedValue, setDebouncedValue] = useState(initialValue)
  const hasUserInteracted = useRef(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useDispatch()

  // Handle debounced value changes
  useEffect(() => {
    if (!hasUserInteracted.current) return

    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, 500) // 500ms debounce delay for typing

    return () => clearTimeout(handler)
  }, [value])

  // Handle URL and Redux updates once debounced value settles
  useEffect(() => {
    if (!hasUserInteracted.current) return

    // Update Redux state with empty string if value is empty
    dispatch(setSearchQuery(debouncedValue || ''))

    // Batch all URL changes together
    const params = new URLSearchParams(searchParams.toString())

    // Update search parameter - explicitly handle empty string case
    if (debouncedValue && debouncedValue.trim() !== '') {
      params.set('search', debouncedValue)
    } else {
      // Always remove search param when value is empty or just whitespace
      params.delete('search')
    }

    // Reset to page 1
    params.set('page', '1')

    // Single URL update
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [debouncedValue, dispatch, router, searchParams, pathname])

  // Initialize from URL on mount
  useEffect(() => {
    const searchFromUrl = searchParams.get('search')

    if (searchFromUrl && !value && !hasUserInteracted.current) {
      setValue(searchFromUrl)
      setDebouncedValue(searchFromUrl)
      dispatch(setSearchQuery(searchFromUrl))
    }
  }, [searchParams, value, dispatch])

  return (
    <CustomTextField
      {...props}
      value={value}
      onChange={e => {
        hasUserInteracted.current = true
        setValue(e.target.value)
      }}
    />
  )
}

// Column Definitions
const columnHelper = createColumnHelper()

const UserListTable = ({ breakpoint = 'lg' }) => {
  // separate States
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [editUserOpen, setEditUserOpen] = useState(false)
  const [liveUserOpen, setLiveUserOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [isLiveUserEdit, setIsLiveUserEdit] = useState(false)

  // Dummy User Info Dialog
  const [isDummyUserInfoDialogOpen, setIsDummyUserInfoDialogOpen] = useState(false)

  // Redux state
  const { status, user, pageSize, page, type, initialLoad, total } = useSelector(state => state.userReducer)
  const { profileData } = useSelector(state => state.adminSlice)

  const { startDate, endDate } = useSelector(state => state.userReducer)
  const canEdit = canEditModule("Users");

  // Hooks
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const theme = useTheme()
  const dispatch = useDispatch()

  useEffect(() => {
    const pageFromUrlString = searchParams.get('page')
    const sizeFromUrlString = searchParams.get('pageSize')
    const startDateFromUrl = searchParams.get('startDate') // Will be null if not present
    const endDateFromUrl = searchParams.get('endDate') // Will be null if not present

    const actionsToDispatch = []

    // Sync Page
    if (pageFromUrlString) {
      const pageFromUrl = parseInt(pageFromUrlString)

      if (!isNaN(pageFromUrl) && pageFromUrl !== page) {
        actionsToDispatch.push(setPage(pageFromUrl))
      }
    }

    // Sync PageSize
    if (sizeFromUrlString) {
      const sizeFromUrl = parseInt(sizeFromUrlString)

      if (!isNaN(sizeFromUrl) && sizeFromUrl !== pageSize) {
        actionsToDispatch.push(setPageSize(sizeFromUrl))
      }
    }

    // Sync Date Range
    // If URL params for dates are absent, they should resolve to 'All' to match clearing behavior.
    const targetStartDate = startDateFromUrl || 'All'
    const targetEndDate = endDateFromUrl || 'All'

    if (targetStartDate !== startDate || targetEndDate !== endDate) {
      actionsToDispatch.push(setDateRange({ startDate: targetStartDate, endDate: targetEndDate }))
    }

    if (actionsToDispatch.length > 0) {
      actionsToDispatch.forEach(action => dispatch(action))
    }
  }, [searchParams, dispatch, page, pageSize, startDate, endDate, type])

  const urlPage = parseInt(searchParams.get('page')) || 1
  const urlPageSize = parseInt(searchParams.get('pageSize')) || 10

  const updateUrlPagination = (page, pageSize) => {
    // Skip update if values haven't changed
    const currentPage = parseInt(searchParams.get('page') || '1')
    const currentPageSize = parseInt(searchParams.get('pageSize') || '10')

    if (page === currentPage && pageSize === currentPageSize) {
      return // No change, no need to update
    }

    // Update both Redux state and URL params in a single batch
    dispatch(setPage(page))
    dispatch(setPageSize(pageSize))

    const params = new URLSearchParams(searchParams.toString())

    params.set('page', page.toString())
    params.set('pageSize', pageSize.toString())

    // Single URL update
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const lastValidDataRef = useRef({})

  const isDataValid = useMemo(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (!user || user.length === 0) return true

    if (currentUrlType === 3) {
      return user.some(
        item => item.hasOwnProperty('streamType') || (item.hasOwnProperty('userId') && typeof item.userId === 'object')
      )
    }

    return !user.some(
      item => item.hasOwnProperty('streamType') || (item.hasOwnProperty('userId') && typeof item.userId === 'object')
    )
  }, [user, searchParams])

  useEffect(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (user && user.length > 0 && isDataValid) {
      lastValidDataRef.current[currentUrlType] = [...user]
    }
  }, [user, isDataValid, searchParams])

  const shouldShowLoading = useMemo(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (lastValidDataRef.current[currentUrlType]?.length > 0) {
      return false
    }

    if (user && user.length > 0 && isDataValid) {
      return false
    }

    if (status === 'loading' || initialLoad) {
      return true
    }

    if (!isDataValid) {
      return true
    }

    return false
  }, [user, status, initialLoad, isDataValid, searchParams])

  const showNoDataMessage = useMemo(() => {
    return !shouldShowLoading && isDataValid && (!user || user.length === 0) && status === 'succeeded'
  }, [shouldShowLoading, isDataValid, user, status])

  // Vars
  let breakpointValue

  switch (breakpoint) {
    case 'xxl':
      breakpointValue = '1920px'
      break
    case 'xl':
      breakpointValue = `${theme.breakpoints.values.xl}px`
      break
    case 'lg':
      breakpointValue = `${theme.breakpoints.values.lg}px`
      break
    case 'md':
      breakpointValue = `${theme.breakpoints.values.md}px`
      break
    case 'sm':
      breakpointValue = `${theme.breakpoints.values.sm}px`
      break
    case 'xs':
      breakpointValue = `${theme.breakpoints.values.xs}px`
      break
    default:
      breakpointValue = breakpoint
  }

  const columns = useMemo(() => {
    // Get current type from URL to ensure we're in sync with the URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    const baseColumns = [
      columnHelper.accessor('fullName', {
        header: () => <div>User</div>,
        cell: ({ row }) => {
          const name = currentUrlType === 3 && row.original.userId ? row.original.userId.name : row.original.name
          const image = currentUrlType === 3 && row.original.userId ? row.original.userId.image : row.original.image

          return (
            <div className='flex items-center gap-4'>
              {getAvatar({ avatar: getFullImageUrl(image), fullName: name })}
              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium'>
                  {name || '-'}
                </Typography>
                {row.original.userName && (
                  <Typography variant='body2'>
                    {row.original.userName?.startsWith('@') ? row.original.userName : `@${row.original.userName}`}
                  </Typography>
                )}
              </div>
            </div>
          )
        }
      }),
      ...(currentUrlType === 1
        ? [
            columnHelper.accessor('role', {
              header: () => <div>Role</div>,
              cell: ({ row }) => {
                const roles = row.original?.role || []

                return (
                  <div className='flex flex-wrap items-center gap-2'>
                    {roles &&
                      roles.length > 0 &&
                      roles?.map((roleId, index) => {
                        const { label, icon, color } = getRoleDetails(parseInt(roleId))

                        return (
                          <div key={index} className='flex items-center gap-1'>
                            <i className={`${icon} text-${color}`} />
                            <Chip label={label} color={color} size='small' variant='tonal' />
                          </div>
                        )
                      })}
                  </div>
                )
              }
            }),

            columnHelper.accessor('userType', {
              header: () => <div>User Type</div>,
              cell: ({ row }) => (
                <div className='flex items-center gap-3'>
                  <Chip
                    variant='tonal'
                    label={row.original.isVIP ? 'VIP' : 'Normal'}
                    size='small'
                    color={row.original.isVIP ? 'success' : 'secondary'}
                    className='capitalize'
                  />
                </div>
              )
            }),
            columnHelper.accessor('Coin', {
              header: 'Coin',
              cell: ({ row }) => <Typography color='text.primary'>{row.original.coin || '0'}</Typography>
            }),
            columnHelper.accessor('isOnline', {
              header: () => <div className='text-center'>Status</div>,
              cell: ({ row }) => (
                <Chip
                  label={row.original.isOnline ? 'Online' : 'Offline'}
                  color={row.original.isOnline ? 'success' : 'error'}
                  size='small'
                  variant='tonal'
                />
              )
            })
          ]
        : []),

      ...(currentUrlType !== 3
        ? [
            columnHelper.accessor('uniqueId', {
              header: 'UniqueId',
              cell: ({ row }) => (
                <div className='flex items-center gap-2'>
                  <Typography className='capitalize' color='text.primary'>
                    {row.original.uniqueId}
                  </Typography>
                </div>
              )
            }),
            columnHelper.accessor('gender', {
              header: 'Gender',
              cell: ({ row }) => (
                <Typography className='capitalize' color='text.primary'>
                  {row.original.gender || '-'}
                </Typography>
              )
            }),
            columnHelper.accessor('age', {
              header: 'Age',
              cell: ({ row }) => <Typography color='text.primary'>{row.original.age || '-'}</Typography>
            })
          ]
        : [])
    ]

    let conditionalColumns = []

    if (currentUrlType === 3) {
      conditionalColumns = [
        columnHelper.accessor('streamType', {
          header: () => <div className='text-center'>Stream Type</div>,
          cell: ({ row }) => {
            const getStreamTypeLabel = streamType => {
              switch (streamType) {
                case 1:
                  return 'Video Live'
                case 2:
                  return 'Audio Live'
                case 3:
                  return 'PK Battle'
                default:
                  return 'Unknown'
              }
            }

            return (
              <Typography className='capitalize' color='text.primary' textAlign='center'>
                {getStreamTypeLabel(row.original.streamType)}
              </Typography>
            )
          }
        }),

        columnHelper.accessor('thumbnail', {
          header: () => <div className='text-center'>Thumbnail</div>,
          cell: ({ row }) => {
            const streamType = row.original.streamType

            if (streamType === 3 && row.original.pkThumbnails && row.original.pkThumbnails.length > 0) {
              return (
                <div className='flex gap-2 justify-center'>
                  {row.original.pkThumbnails.map((thumbnail, index) => (
                    <img
                      key={index}
                      src={thumbnail.includes('http') ? thumbnail : getFullImageUrl(thumbnail)}
                      alt={`PK Thumbnail ${index + 1}`}
                      style={{ maxWidth: '80px', maxHeight: '60px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              )
            } else if ((streamType === 1 || streamType === 2) && row.original.thumbnail) {
              return (
                <div className='flex justify-center'>
                  <img
                    src={
                      row.original.thumbnail.includes('http')
                        ? row.original.thumbnail
                        : getFullImageUrl(row.original.thumbnail)
                    }
                    alt='Stream Thumbnail'
                    style={{ maxWidth: '100px', maxHeight: '70px', objectFit: 'cover' }}
                  />
                </div>
              )
            } else {
              return (
                <Typography color='text.secondary' textAlign='center'>
                  No thumbnail
                </Typography>
              )
            }
          }
        }),

        columnHelper.accessor('streamSource', {
          header: () => <div className='text-center'>Stream Source</div>,
          cell: ({ row }) => {
            const streamType = row.original.streamType

            if (streamType === 3 && row.original.pkStreamSources && row.original.pkStreamSources.length > 0) {
              return (
                <div className='flex items-center justify-center gap-2'>
                  {row.original.pkStreamSources.map((source, index) => (
                    <video
                      key={index}
                      src={source.includes('http') ? source : getFullImageUrl(source)}
                      controls
                      width='100px'
                      height='100px'
                    />
                  ))}
                </div>
              )
            } else if ((streamType === 1 || streamType === 2) && row.original.streamSource) {
              return (
                <div className='flex justify-center'>
                  <video
                    src={
                      row.original.streamSource.includes('http')
                        ? row.original.streamSource
                        : getFullImageUrl(row.original.streamSource)
                    }
                    controls
                    width='100px'
                    height='100px'
                  />
                </div>
              )
            } else {
              return (
                <Typography color='text.secondary' textAlign='center'>
                  No stream source
                </Typography>
              )
            }
          }
        }),

        ...(user && user.some(item => item.streamType === 2)
          ? [
              columnHelper.accessor('roomInfo', {
                header: () => <div className='text-center'>Room Info</div>,
                cell: ({ row }) => {
                  const streamType = row.original.streamType

                  if (streamType === 2) {
                    return (
                      <div className='flex flex-col items-center gap-1'>
                        <div>
                          <Typography variant='label' className='font-medium'>
                            Name:
                          </Typography>
                          <Typography variant='label'>{row.original.roomName || '-'}</Typography>
                        </div>
                        <div className='flex gap-1'>
                          <Typography variant='label' className='font-medium'>
                            Welcome:
                          </Typography>
                          {row.original.roomWelcome ? (
                            <div>
                              <Typography
                                variant='label'
                                className='cursor-pointer hover:underline'
                                onClick={e => {
                                  if (e.currentTarget.innerHTML === row.original.roomWelcome) {
                                    e.currentTarget.innerHTML = `${row.original.roomWelcome.substring(0, 20)}...`
                                  } else {
                                    e.currentTarget.innerHTML = row.original.roomWelcome
                                  }
                                }}
                              >
                                {row.original.roomWelcome.length > 20
                                  ? `${row.original.roomWelcome.substring(0, 20)}...`
                                  : row.original.roomWelcome}
                              </Typography>
                            </div>
                          ) : (
                            <Typography variant='label'>-</Typography>
                          )}
                        </div>
                      </div>
                    )
                  } else {
                    return (
                      <Typography color='text.secondary' textAlign='center'>
                        N/A
                      </Typography>
                    )
                  }
                }
              })
            ]
          : []),
        columnHelper.accessor('isStreaming', {
          header: () => <div className='text-center'>Streaming</div>,
          cell: ({ row }) => (
            <div className='flex justify-center'>
              <Switch
                checked={Boolean(row.original.isStreaming)}
                onChange={() => {


                  dispatch(toggleStreamingStatus(row.original._id))
                }}
              />
            </div>
          )
        })
      ]
    } else {
      conditionalColumns = [
        columnHelper.accessor('country', {
          header: () => <div>Country</div>,
          cell: ({ row }) => (
            <div className='flex items-center gap-2'>
              {emojiToCountryFlag(row.original.countryFlagImage)}
              <Typography className='capitalize' color='text.primary'>
                {row.original.country || '-'}
              </Typography>
            </div>
          )
        }),

        columnHelper.accessor('Followers', {
          header: () => <div className='text-center'>Followers</div>,
          cell: ({ row }) => (
            <Typography className='capitalize' color='text.primary' textAlign='center'>
              {row.original.totalFollowers || '0'}
            </Typography>
          )
        }),
        columnHelper.accessor('Following', {
          header: () => <div className='text-center'>Following</div>,
          cell: ({ row }) => (
            <Typography className='capitalize' color='text.primary' textAlign='center'>
              {row.original.totalFollowings || '0'}
            </Typography>
          )
        }),
        columnHelper.accessor('Friends', {
          header: () => <div className='text-center'>Friends</div>,
          cell: ({ row }) => (
            <Typography className='capitalize' color='text.primary' textAlign='center'>
              {row.original.totalFriends || '0'}
            </Typography>
          )
        }),
        columnHelper.accessor('Posts', {
          header: () => <div className='text-center'>Posts</div>,
          cell: ({ row }) => (
            <Typography className='capitalize' color='text.primary' textAlign='center'>
              {row.original.totalPosts || '0'}
            </Typography>
          )
        }),
        columnHelper.accessor('Videos', {
          header: () => <div className='text-center'>Videos</div>,
          cell: ({ row }) => (
            <Typography className='capitalize' color='text.primary' textAlign='center'>
              {row.original.totalVideos || '0'}
            </Typography>
          )
        }),
        columnHelper.accessor('isBlock', {
          id: 'isBlock',
          header: () => <div className='text-center'>IsBlock</div>,
          cell: ({ row }) => (
            <Switch
              id={`block-switch-${row.original._id}`}
              checked={Boolean(row.original.isBlock)}
              onChange={() => {
                dispatch(toggleUserBlockStatus({ id: row.original._id }))
              }}
            />
          )
        })
      ]
    }

    const dateColumn = [
      columnHelper.accessor('createdAt', {
        header: () => <div className='text-center'>Created At</div>,
        cell: ({ row }) => (
          <Typography color='text.primary'>{getFormattedDate(row.original.createdAt) || '-'}</Typography>
        )
      })
    ]

    const actionColumn = [
      columnHelper.accessor('action', {
        id : 'actions',
        header: () => <div className='text-center'>Action</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            {currentUrlType !== 3 && (
              <IconButton
                onClick={() => {
                  const userId =
                    currentUrlType === 3 && row.original.userId ? row.original.userId._id : row.original._id

                  setSelectedUserId(userId)
                  setIsUserDialogOpen(true)
                }}
              >
                <i className='tabler-info-circle text-textSecondary' />
              </IconButton>
            )}

            {currentUrlType !== 3 && currentUrlType !== 2 && (
              <IconButton>
                <Link
                  href={`/apps/user/view?userId=${
                    currentUrlType === 3 && row.original.userId ? row.original.userId._id : row.original._id
                  }`}
                  className='flex'
                >
                  <i className='tabler-eye text-textSecondary' />
                </Link>
              </IconButton>
            )}

            {currentUrlType === 2 &&  (
              <IconButton
                onClick={() => {


                  setSelectedUserId(row.original)
                  setIsDummyUserInfoDialogOpen(true)
                }}
              >
                <i className='tabler-eye text-textSecondary' />
              </IconButton>
            )}

            {currentUrlType === 2 && canEdit && (
              <IconButton
                onClick={() => {


                  setUserToEdit(row.original)
                  setEditUserOpen(true)
                }}
              >
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            )}

            {currentUrlType === 3 && (
              <IconButton
                onClick={() => {


                  setUserToEdit(row.original)
                  setIsLiveUserEdit(true)
                  setLiveUserOpen(true)
                }}
              >
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            )}

            {(currentUrlType === 2 || currentUrlType === 3) && canEdit && (
              <IconButton
                onClick={() => {


                  const name =
                    currentUrlType === 3 && row.original.userId
                      ? row.original.userId.name
                      : row.original.name || row.original.userName

                  setUserToDelete({
                    id: row.original._id,
                    name: name,
                    isLiveUser: currentUrlType === 3
                  })
                  setDeleteConfirmOpen(true)
                  setDeleteError(null)
                }}
              >
                <i className='tabler-trash text-textSecondary' />
              </IconButton>
            )}
          </div>
        ),
        enableSorting: false
      })
    ]

    return [...baseColumns, ...conditionalColumns, ...dateColumn, ...actionColumn].filter(col => {
  // Remove isBlock column if no edit rights
  if (!canEdit && col.id === 'isBlock') return false;
  
return true;
});
  }, [dispatch, user, searchParams])

  const processedTableData = useMemo(() => {
    // Get current type from URL
    const currentUrlType = parseInt(searchParams.get('type') || '1')

    if (user && user.length > 0 && isDataValid) {
      return user
    }

    if (lastValidDataRef.current[currentUrlType]?.length > 0) {
      return lastValidDataRef.current[currentUrlType]
    }

    return []
  }, [user, isDataValid, searchParams])

  const table = useReactTable({
    data: processedTableData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: urlPage - 1,
        pageSize: urlPageSize
      }
    },
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: updateUrlPagination,
    onPageSizeChange: updateUrlPagination,
    onSortingChange: updateUrlPagination,
    onSearchChange: updateUrlPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete?.id) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      if (userToDelete.isLiveUser) {
        await dispatch(deleteLiveUser(userToDelete.id)).unwrap()
      } else {
        await dispatch(deleteUser(userToDelete.id)).unwrap()
      }

      setDeleteConfirmOpen(false)
    } catch (error) {
      setDeleteError(error.toString())
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader title='Filters' className='pbe-4' />
        <TableFilters />
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 gap-4'>
          <CustomTextField
            select
            value={urlPageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              updateUrlPagination(1, newPageSize)
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
              placeholder='Search User'
              className='max-sm:is-full'
              updateUrlPagination={updateUrlPagination}
            />
            <DateRangePicker
              buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter by Date'}
              buttonStartIcon={<FilterListIcon />}
              buttonClassName='ms-2'
              setAction={setDateRange}
              initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
              initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
              showClearButton={startDate !== 'All' && endDate !== 'All'}
              onClear={() => {
                dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                dispatch(setPage(1))

                // Update URL
                const params = new URLSearchParams(searchParams.toString())

                params.delete('startDate')
                params.delete('endDate')
                params.set('page', '1')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
              onApply={(newStartDate, newEndDate) => {
                dispatch(setDateRange({ startDate: newStartDate, endDate: newEndDate }))
                dispatch(setPage(1))

                // Update URL

                const params = new URLSearchParams(searchParams.toString())

                if (newStartDate !== 'All') params.set('startDate', newStartDate)
                else params.delete('startDate')

                if (newEndDate !== 'All') params.set('endDate', newEndDate)
                else params.delete('endDate')

                params.set('page', '1')
                router.replace(`${pathname}?${params.toString()}`, { scroll: false })
              }}
            />
            {(() => {
              const currentUrlType = parseInt(searchParams.get('type') || '1')

              return (
                currentUrlType !== 1 && canEdit && (
                  <Button
                    variant='contained'
                    startIcon={<i className='tabler-plus' />}
                    onClick={() => {


                      if (currentUrlType === 3) {
                        setIsLiveUserEdit(false)
                        setLiveUserOpen(true)
                      } else {
                        setAddUserOpen(!addUserOpen)
                      }
                    }}
                    className='max-sm:is-full'
                  >
                    {currentUrlType === 1 ? 'Add New User' : currentUrlType === 2 ? 'Add Fake User' : 'Add Live User'}
                  </Button>
                )
              )
            })()}
          </div>
        </div>
        {shouldShowLoading ? (
          <>
            <div className='flex items-center justify-center gap-2 grow is-full my-10'>
              <CircularProgress />
              <Typography>Loading...</Typography>
            </div>
          </>
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
                {processedTableData.length > 0 ? (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Add empty rows if data is less than pageSize */}
                    {Array.from({
                      length: urlPageSize - table.getRowModel().rows.length
                    }).map((_, index) => (
                      <tr key={`empty-${index}`}>
                        {table.getVisibleFlatColumns().map(column => (
                          <td key={column.id}>&nbsp;</td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  <>
                    {/* Show empty rows */}
                    {Array.from({ length: urlPageSize }).map((_, index) => (
                      <tr key={`empty-${index}`}>
                        {table.getVisibleFlatColumns().map(column => (
                          <td key={column.id}>&nbsp;</td>
                        ))}
                      </tr>
                    ))}

                    {/* Show centered no-data message */}
                    <tr className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full'>
                      <td
                        colSpan={table.getVisibleFlatColumns().length}
                        className='text-center text-gray-500 font-medium'
                      >
                        No data available
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          component={() => (
            <TablePaginationComponent
              page={urlPage}
              pageSize={urlPageSize}
              total={total || 0}
              onPageChange={newPage => {
                updateUrlPagination(newPage, urlPageSize)
              }}
            />
          )}
          count={total || 0}
          rowsPerPage={urlPageSize}
          page={urlPage - 1}
          onPageChange={(_, newPage) => {
            updateUrlPagination(newPage + 1, urlPageSize)
          }}
          onRowsPerPageChange={e => {
            const newSize = parseInt(e.target.value)

            updateUrlPagination(1, newSize)
          }}
        />
      </Card>
      <AddUserDrawer open={addUserOpen} handleClose={() => setAddUserOpen(!addUserOpen)} />
      <EditUserDrawer open={editUserOpen} handleClose={() => setEditUserOpen(false)} userData={userToEdit} />
      <LiveUserDrawer
        open={liveUserOpen}
        handleClose={() => {
          setLiveUserOpen(false)
          setUserToEdit(null)
        }}
        editMode={isLiveUserEdit}
        initialData={userToEdit}
      />
      <ConfirmationDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        type='delete-customer'
        onConfirm={handleDeleteUser}
        loading={deleteLoading}
        error={deleteError}
      />
      <UserDetailDialog
        open={isUserDialogOpen}
        onClose={() => {
          setIsUserDialogOpen(false)
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
      />
      <DummyUserInfoDialog
        open={isDummyUserInfoDialogOpen}
        onClose={() => {
          setIsDummyUserInfoDialogOpen(false)
        }}
        currentUser={selectedUserId}
        setSelectedUserId={setSelectedUserId}
      />
    </>
  )
}

export default UserListTable
