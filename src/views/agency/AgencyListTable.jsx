'use client'

import React, { useEffect, useState, useMemo } from 'react'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import { CircularProgress, Box, Button } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'

// Third-party Imports
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel
} from '@tanstack/react-table'

import { toast } from 'react-toastify'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import AgencyPaginationComponent from './AgencyPaginationComponent'
import DateRangePicker from '@/views/song/list/DateRangePicker'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Actions
import {
  fetchAgencyRecord,
  modifyAgencyStatus,
  setDateRange,
  setPage,
  setPageSize,
  setSearchQuery,
  setStatus
} from '@/redux-store/slices/agency'

// Utils
import { getFullImageUrl, SmallBadge } from '@/util/commonfunctions'
import { getInitials } from '@/util/getInitials'

// Component Imports
import AgencyDialog from './AgencyDialog'
import AgencyHistoryDrawer from './AgencyHistoryDrawer'
import { formatDate } from '@/util/format'
import { canEditModule } from '@/util/permissions'

// Fuzzy filter for search functionality
const fuzzyFilter = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Debounced input component for search
const DebouncedInput = ({ value: initialValue, onChange, ...props }) => {
  const [value, setValue] = useState(initialValue)

  // Update local state when initialValue changes
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onChange) {
        onChange(value)
      }
    }, 500)

    return () => clearTimeout(timeout)
  }, [value, onChange])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

// Column helper
const columnHelper = createColumnHelper()

const AgencyListTable = () => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilterValue, setGlobalFilterValue] = useState('')
  const [open, setOpen] = useState(false)
  const [agencyToEdit, setAgencyToEdit] = useState(null)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const [selectedAgency, setSelectedAgency] = useState(null)
  const canEdit = canEditModule('Agency')

  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const dispatch = useDispatch()

  // Redux state
  const {
    agencyRecords,
    total,
    initialLoad,
    page,
    pageSize,
    status,
    searchQuery,
    startDate: reduxStartDate,
    endDate: reduxEndDate
  } = useSelector(state => state.agency)

  const { profileData } = useSelector(state => state.adminSlice)

  // Memoize the values we actually care about from the URL
  const urlState = useMemo(() => {
    const p = parseInt(searchParams.get('page') || '1', 10)
    const s = parseInt(searchParams.get('pageSize') || '10', 10)
    const st = searchParams.get('status') || 'all'
    const q = searchParams.get('search') || ''

    return {
      page: p,
      pageSize: s,
      status: st,
      search: q,
      key: `${p}|${s}|${st}|${q}` // stable primitive for dependencies
    }
  }, [searchParams])

  const replaceIfChanged = nextParams => {
    const next = nextParams.toString()
    const curr = searchParams.toString()

    if (next !== curr) {
      router.replace(`${pathname}?${next}`, { scroll: false })
    }
  }

  // URL synchronization - fixed to prevent infinite loops
  // useEffect(() => {
  //   const pageFromUrlString = searchParams.get('page')
  //   const sizeFromUrlString = searchParams.get('pageSize')
  //   const statusFromUrl = searchParams.get('status') || 'all'
  //   const searchFromUrl = searchParams.get('search') || ''

  //   const actionsToDispatch = []

  //   // Sync Page
  //   if (pageFromUrlString) {
  //     const pageFromUrl = parseInt(pageFromUrlString)
  //     if (!isNaN(pageFromUrl) && pageFromUrl !== page) {
  //       actionsToDispatch.push(setPage(pageFromUrl))
  //     }
  //   }

  //   // Sync PageSize
  //   if (sizeFromUrlString) {
  //     const sizeFromUrl = parseInt(sizeFromUrlString)
  //     if (!isNaN(sizeFromUrl) && sizeFromUrl !== pageSize) {
  //       actionsToDispatch.push(setPageSize(sizeFromUrl))
  //     }
  //   }

  //   // Sync Status
  //   if (statusFromUrl !== status) {
  //     actionsToDispatch.push(setStatus(statusFromUrl))
  //   }

  //   // Sync Search Query
  //   if (searchFromUrl !== searchQuery) {
  //     actionsToDispatch.push(setSearchQuery(searchFromUrl))
  //     setGlobalFilterValue(searchFromUrl)
  //   }

  //   // Dispatch all actions at once
  //   if (actionsToDispatch.length > 0) {
  //     actionsToDispatch.forEach(action => dispatch(action))
  //   }
  // }, [searchParams])

  // Single useEffect for API calls - only when URL changes

  // Fetch exactly when any *value* changes (not the object identity)
  useEffect(() => {
    dispatch(
      fetchAgencyRecord({
        page: urlState.page,
        limit: urlState.pageSize,
        searchQuery: urlState.search,
        status: urlState.status,
        startDate: reduxStartDate,
        endDate: reduxEndDate
      })
    )
  }, [urlState.key, reduxStartDate, reduxEndDate, dispatch])

  // URL page and pageSize for immediate use
  const urlPage = urlState.page
  const urlPageSize = urlState.pageSize

  // Update URL function - similar to UserListTable
  const updateUrlPagination = (newPage, newPageSize) => {
    // Skip update if values haven't changed
    const currentPage = parseInt(searchParams.get('page') || '1')
    const currentPageSize = parseInt(searchParams.get('pageSize') || '10')

    if (newPage === currentPage && newPageSize === currentPageSize) {
      return // No change, no need to update
    }

    // Update both Redux state and URL params in a single batch
    dispatch(setPage(newPage))
    dispatch(setPageSize(newPageSize))

    const params = new URLSearchParams(searchParams.toString())

    params.set('page', newPage.toString())
    params.set('pageSize', newPageSize.toString())

    // Single URL update
    replaceIfChanged(params)
  }

  // Column definitions
  const columns = useMemo(() => {
    const baseColums = [
      columnHelper.accessor('agencyName', {
        header: () => <div className='text-center'>Agency</div>,
        cell: ({ row }) => {
          const { agencyName, image, agencyCode } = row.original

          return (
            <div className='flex items-center gap-4'>
              {getAvatar({ avatar: getFullImageUrl(image), fullName: agencyName })}
              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium'>
                  {agencyName || '-'}
                </Typography>
                <Typography variant='body2'>{agencyCode}</Typography>
              </div>
            </div>
          )
        }
      }),
      columnHelper.accessor('user', {
        header: () => <div className='text-center'>User</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            {getAvatar({ avatar: getFullImageUrl(row.original.userImage), fullName: row.original.userName })}
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name || '-'}
              </Typography>
              <Typography variant='body2'>{row.original.userName}</Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('country', {
        header: () => <div className='text-center'>Country</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2 justify-center'>
            {row.original.countryFlagImage && (
              <img src={row.original.countryFlagImage} alt={row.original.country} width={20} height={15} />
            )}
            <Typography className='capitalize' color='text.primary'>
              {row.original.country || '-'}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('contactEmail', {
        header: () => <div className='text-center'>Contact Email</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.contactEmail || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('mobileNumber', {
        header: () => <div className='text-center'>Mobile</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.mobileNumber || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('commissionRate', {
        header: () => <div className='text-center'>Commission</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.commissionRate}%
          </Typography>
        )
      }),
      columnHelper.accessor('hostsCount', {
        header: () => <div className='text-center'>Hosts</div>,
        cell: ({ row }) => {
          const count = row.original.hostsCount || 0
          const agencyId = row.original._id
          const agencyName = row.original.name

          return (
            <div className='text-center'>
              <SmallBadge badgeContent={count} color='secondary'>
                <IconButton
                  onClick={() => router.push(`/agency/host?agencyId=${agencyId}&agencyName=${agencyName}`)}
                  color='secondary'
                >
                  <i className='tabler-users' />
                </IconButton>
              </SmallBadge>
            </div>
          )
        }
      }),
      columnHelper.accessor('hostCoins', {
        header: () => <div className='text-center'>Host Earnings</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.hostCoins || '0'}
          </Typography>
        )
      }),
      columnHelper.accessor('totalEarnings', {
        header: () => <div className='text-center'>Earnings</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.totalEarnings || '0'}
          </Typography>
        )
      }),
      columnHelper.accessor('createdAt', {
        header: () => <div className='flex items-center justify-center gap-2'>Created At</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {formatDate(row.original.createdAt)}
          </Typography>
        )
      }),
      columnHelper.accessor('isActive', {
        id: 'isActive',
        header: () => <div className='text-center'>Status</div>,
        cell: ({ row }) => (
          <Switch
            checked={Boolean(row.original.isActive)}
            onChange={() => {
              dispatch(modifyAgencyStatus(row.original._id))
            }}
          />
        )
      }),
      columnHelper.accessor('action', {
        header: () => <div className='text-center'>Action</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            {canEdit && (
              <IconButton
                onClick={() => {
                  setAgencyToEdit(row.original)
                  setOpen(true)
                }}
                title='Edit Agency'
              >
                <i className='tabler-edit text-textSecondary' />
              </IconButton>
            )}
            <IconButton
              onClick={() => {
                setSelectedAgency(row.original)
                setHistoryDrawerOpen(true)
              }}
              title='View History'
            >
              <i className='tabler-history text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ]

    
return baseColums.filter(col => col.id !== 'isActive' || canEdit)
  }, [dispatch, router, canEdit])

  // Initialize table similar to UserListTable
  const table = useReactTable({
    data: agencyRecords || [],
    columns,
    state: {
      rowSelection,
      pagination: {
        pageIndex: urlPage - 1,
        pageSize: urlPageSize
      }
    },
    manualPagination: true,
    manualFiltering: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    pageCount: Math.ceil((total || 0) / urlPageSize)
  })

  // Handle page size change
  const handlePageSizeChange = e => {
    const newSize = parseInt(e.target.value, 10)

    updateUrlPagination(1, newSize)
  }

  // Handle search changes
  const handleSearchChange = value => {
    setGlobalFilterValue(value)

    const params = new URLSearchParams(searchParams.toString())
    const prevSearch = params.get('search') || ''

    if (value && value.trim().length) {
      params.set('search', value)
    } else {
      params.delete('search')
    }

    console.log('prevSearch', prevSearch)

    // Only reset to page 1 if the search term actually changed
    const shouldResetPage = prevSearch !== value
    const nextPage = shouldResetPage ? 1 : parseInt(params.get('page') || '1')

    params.set('page', nextPage.toString())

    replaceIfChanged(params)
  }

  // Handle status filter changes
  const handleStatusChange = e => {
    const newStatus = e.target.value

    dispatch(setStatus(newStatus))
    dispatch(setPage(1))
    updateUrlPagination(1, urlPageSize)

    // Update URL
    const params = new URLSearchParams(searchParams.toString())

    if (newStatus !== 'all') {
      params.set('status', newStatus)
    } else {
      params.delete('status')
    }

    params.set('page', '1')
    replaceIfChanged(params)
  }

  // Helper function for avatar
  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={avatar} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  const handleCreateAgency = () => {
    setAgencyToEdit(null)
    setOpen(true)
  }

  return (
    <>
      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <div className='flex items-center gap-2'>
            <CustomTextField
              select
              value={urlPageSize}
              onChange={handlePageSizeChange}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>

            <CustomTextField select value={status} onChange={handleStatusChange} className='ms-2 min-w-[120px]'>
              <MenuItem value='all'>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </CustomTextField>

            <DateRangePicker
              buttonText={
                reduxStartDate !== 'All' && reduxEndDate !== 'All'
                  ? `${reduxStartDate} - ${reduxEndDate}`
                  : 'Filter by Date'
              }
              buttonStartIcon={<FilterListIcon />}
              buttonClassName='ms-2'
              setAction={setDateRange}
              initialStartDate={reduxStartDate !== 'All' ? new Date(reduxStartDate) : null}
              initialEndDate={reduxEndDate !== 'All' ? new Date(reduxEndDate) : null}
              showClearButton={reduxStartDate !== 'All' && reduxEndDate !== 'All'}
              onClear={() => {
                dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
                updateUrlPagination(1, urlPageSize)
              }}
            />
          </div>

          <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
            <DebouncedInput
              value={globalFilterValue}
              onChange={handleSearchChange}
              placeholder='Search Agency'
              className='max-sm:is-full'
            />
            {canEdit && (
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={handleCreateAgency}
                className='max-sm:is-full'
              >
                Create Agency
              </Button>
            )}
          </div>
        </div>

        {initialLoad ? (
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
                          <div
                            className={classnames({
                              'flex items-center justify-center': header.column.getIsSorted(),
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
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {agencyRecords && agencyRecords.length > 0 ? (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Fill remaining rows to match pageSize */}
                    {Array.from({ length: Math.max(0, urlPageSize - (agencyRecords?.length || 0)) }).map((_, idx) => (
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
                  Array.from({ length: urlPageSize }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      {idx === Math.floor(pageSize / 2) ? (
                        <td
                          colSpan={columns.length}
                          className='text-center py-4 text-gray-500 font-medium whitespace-nowrap'
                        >
                          No agencies found
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

        <AgencyPaginationComponent
          page={urlPage}
          pageSize={urlPageSize}
          total={total || 0}
          onPageChange={newPage => updateUrlPagination(newPage, urlPageSize)}
        />
      </Card>

      <AgencyDialog
        open={open}
        onClose={() => {
          setOpen(false)
          setAgencyToEdit(null)
        }}
        editData={agencyToEdit}
      />

      <AgencyHistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        agencyId={selectedAgency?._id}
        agency={selectedAgency}
      />
    </>
  )
}

export default AgencyListTable
