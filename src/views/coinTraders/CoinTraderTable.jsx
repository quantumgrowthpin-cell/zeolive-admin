import React, { useState, useEffect, useMemo } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import {
  Card,
  CardHeader,
  Button,
  Typography,
  IconButton,
  useTheme,
  TablePagination,
  MenuItem,
  Switch,
  CircularProgress,
  Box,
  Checkbox
} from '@mui/material'
import { toast } from 'react-toastify'

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

// Component Imports
import TableFilters from './TableFilters'
import CoinTraderDialog from './CoinTraderDialog'
import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import TablePaginationComponent from '@components/TablePaginationComponent'

// Util Imports
import { getInitials } from '@/util/getInitials'
import { getFullImageUrl } from '@/util/commonfunctions'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Redux Imports
import {
  fetchCoinTraders,
  setPage,
  setPageSize,
  setSearchQuery,
  toggleTraderStatus
} from '@/redux-store/slices/coinTrader'
import HistoryDrawer from './HistoryDrawer'
import { formatDate } from '@/util/format'
import { canEditModule } from '@/util/permissions'

const fuzzyFilter = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value)

  // Store the itemRank info
  addMeta({
    itemRank
  })

  // Return if the item should be filtered in/out
  return itemRank.passed
}

const DebouncedInput = ({ value: initialValue, ...props }) => {
  const [value, setValue] = useState(initialValue)
  const dispatch = useDispatch()

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setPage(1))
      dispatch(setSearchQuery(value || ''))
    }, 500)

    return () => clearTimeout(timeout)
  }, [value, dispatch])

  return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const CoinTraderTable = () => {
  // Component State
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [coinAdjustDialogOpen, setCoinAdjustDialogOpen] = useState(false)
  const [selectedTrader, setSelectedTrader] = useState(null)
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false)
  const canEdit = canEditModule("Coin Trader");

  // Redux State
  const { initialLoad, traders, total, page, pageSize, startDate, endDate } = useSelector(state => state.coinTrader)
  const { settings } = useSelector(state => state.settings)
  const { profileData } = useSelector(state => state.adminSlice)



  // Hooks
  const dispatch = useDispatch()
  const theme = useTheme()

  // Fetch traders on initial load or when parameters change
  useEffect(() => {
    dispatch(
      fetchCoinTraders({
        page,
        pageSize,
        searchQuery: globalFilter,
        startDate: startDate,
        endDate: endDate
      })
    )
  }, [dispatch, page, pageSize, globalFilter, startDate, endDate])

  // Column Definitions
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () => 
      {const baseColumns = [
      columnHelper.accessor('userDetails.name', {
        header: <div>User</div>,
        cell: ({ row }) => {
          const user = row.original.userDetails

          return (
            <div className='flex items-center gap-4'>
              <CustomAvatar src={user.image ? getFullImageUrl(user.image) : null} size={34}>
                {!user.image && getInitials(user.name || 'N/A')}
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography color='text.primary' className='font-medium'>
                  {user.name || 'N/A'}
                </Typography>
                <Typography variant='body2'>{user.userName || '-'}</Typography>
              </div>
            </div>
          )
        }
      }),

      columnHelper.accessor('uniqueId', {
        header: <div className='text-center'>Unique ID</div>,
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.uniqueId}
          </Typography>
        )
      }),

      columnHelper.accessor('coin', {
        header: <div className='text-center'>Coin Balance ({settings?.currency?.symbol || '$'})</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' fontWeight='500' textAlign='center'>
            {row.original.coin.toLocaleString()}
          </Typography>
        )
      }),

      columnHelper.accessor('spendCoin', {
        header: <div className='text-center'>Spent Coins ({settings?.currency?.symbol || '$'})</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.spendCoin?.toLocaleString() || '0'}
          </Typography>
        )
      }),

      columnHelper.accessor('mobileNumber', {
        header: <div className='text-center'>Mobile</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.countryCode} {row.original.mobileNumber}
          </Typography>
        )
      }),

      columnHelper.accessor('createdAt', {
        header: <div className='text-center'>Created Date</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {formatDate(row.original.createdAt)}
          </Typography>
        )
      }),

      columnHelper.accessor('isActive', {
        id : 'isActive',
        header: <div className='text-center'>Status</div>,
        cell: ({ row }) => (
          <Switch
            checked={Boolean(row.original.isActive)}
            onChange={() => {


              handleToggleStatus(row.original._id, row.original.userId._id || row.original.userId)
            }}
            color='primary'
            className='mx-auto'
          />
        )
      }),

      columnHelper.accessor('actions', {
        header: <div className='text-center'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            {canEdit && <IconButton
              onClick={() => {


                setSelectedTrader(row.original)
                setEditDialogOpen(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>}

           {canEdit && <IconButton
              onClick={() => {


                setSelectedTrader(row.original)
                setCoinAdjustDialogOpen(true)
              }}
            >
              <i className='tabler-coins text-textSecondary' />
            </IconButton>}

            <IconButton
              onClick={() => {
                setSelectedTrader(row.original)
                setHistoryDrawerOpen(true)
              }}
            >
              <i className='tabler-history text-textSecondary' />
            </IconButton>
          </div>
        )
      })
    ]

  
return baseColumns.filter(col => col.id !== 'isActive' || canEdit);
  },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, dispatch]
  )

  const table = useReactTable({
    data: traders || [],
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize
      }
    },
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Sync table pagination with Redux state
  useEffect(() => {
    const tablePageIndex = table.getState().pagination.pageIndex
    const tablePageSize = table.getState().pagination.pageSize

    if (tablePageIndex + 1 !== page) {
      dispatch(setPage(tablePageIndex + 1))
    }

    if (tablePageSize !== pageSize) {
      dispatch(setPageSize(tablePageSize))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table.getState().pagination.pageIndex, table.getState().pagination.pageSize])

  // Handler for toggling trader active status
  const handleToggleStatus = (traderId, userId) => {
    dispatch(toggleTraderStatus({ coinTraderId: traderId, userId }))
  }

  return (
    <>
      <TableFilters />
      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              dispatch(setPageSize(newPageSize))
              dispatch(setPage(1))
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
              placeholder='Search Coin Traders'
              className='max-sm:is-full'
            />

            {canEdit && <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {


                setAddDialogOpen(true)
              }}
              className='max-sm:is-full'
            >
              Add Coin Trader
            </Button>}
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
                {traders && traders.length > 0 ? (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Add empty filler rows */}
                    {Array.from({ length: pageSize - traders.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        {table.getVisibleFlatColumns().map((_, colIdx) => (
                          <td key={colIdx} className='px-4 py-3'>
                            &nbsp;
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  Array.from({ length: pageSize }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      {idx === Math.floor(pageSize / 2) ? (
                        <td
                          colSpan={table.getVisibleFlatColumns().length}
                          className='text-center py-4 text-gray-500 font-medium whitespace-nowrap'
                        >
                          No data available
                        </td>
                      ) : (
                        table.getVisibleFlatColumns().map((_, colIdx) => (
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
              page={page}
              pageSize={pageSize}
              total={total || 0}
              onPageChange={page => dispatch(setPage(page))}
            />
          )}
          count={total || 0}
          rowsPerPage={pageSize}
          page={page - 1}
          onPageChange={(_, newPage) => {
            dispatch(setPage(newPage + 1))
          }}
          onRowsPerPageChange={e => dispatch(setPage(1))}
        />
      </Card>

      {/* Create Dialog */}
      <CoinTraderDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />

      {/* Edit Dialog */}
      <CoinTraderDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedTrader(null)
        }}
        editData={selectedTrader}
      />

      {/* Coin Adjustment Dialog */}
      <CoinTraderDialog
        open={coinAdjustDialogOpen}
        onClose={() => {
          setCoinAdjustDialogOpen(false)
          setSelectedTrader(null)
        }}
        editData={selectedTrader}
        coinAdjustmentMode={true}
      />

      <HistoryDrawer
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        traderId={selectedTrader?._id}
        trader={selectedTrader}
      />
    </>
  )
}

export default CoinTraderTable
