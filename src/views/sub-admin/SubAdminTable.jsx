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
  deleteSubAdmin,
  fetchSubAdmins,
  setPage,
  setPageSize,
} from '@/redux-store/slices/subAdmin'
import { formatDate } from '@/util/format'
import SubAdminDialog from './SubAdminDialog'

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

const SubAdminTable = () => {
  // Component State
  const [globalFilter, setGlobalFilter] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedSubAdmin, setSelectedSubAdmin] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Redux State
  const { initialLoad, subAdmins, total, page, pageSize,error } = useSelector(state => state.subAdmin)
  const { settings } = useSelector(state => state.settings)

  // Hooks
  const dispatch = useDispatch()

  // Fetch traders on initial load or when parameters change
  useEffect(() => {
    dispatch(
      fetchSubAdmins({
        page,
        pageSize,
      })
    )
  }, [dispatch, page, pageSize])

  const handleOpenDeleteDialog = subAdmin => {
    setSelectedSubAdmin(subAdmin)
    setConfirmOpen(true)
  }

  // Column Definitions
  const columnHelper = createColumnHelper()

  const columns = useMemo(
    () =>
      [
      columnHelper.accessor('name', {
        header: <div className='text-center'>Name</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium text-center'>
          {row.original.name}
        </Typography>
        )
      }),

      columnHelper.accessor('email', {
        header: <div className='text-center'>Email</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' textAlign='center'>
            {row.original.email}
          </Typography>
        )
      }),

       columnHelper.accessor('password', {
        header: <div className='text-center'>Password</div>,
        cell: ({ row }) => (
          <Typography color='text.primary' fontWeight='500' textAlign='center'>
            {row.original.password}
          </Typography>
        )
      }),

      columnHelper.display({
      id: 'actions',
      header: <div className='text-center'>Actions</div>,
      cell: ({ row }) => (
        <div className='flex items-center justify-center'>
          <IconButton
            onClick={() => {
              setSelectedSubAdmin(row.original)
              setEditDialogOpen(true)
            }}
            title='Edit'
          >
            <i className='tabler-edit text-textSecondary' />
          </IconButton>
          <IconButton
            color='error'
            onClick={() => {
              handleOpenDeleteDialog(row?.original)
            }}
            title='Delete'
          >
            <i className='tabler-trash text-textSecondary' />
          </IconButton>
        </div>
      )
    })
    ],
    [settings, dispatch]
  )

  const table = useReactTable({
    data: subAdmins || [],
    columns,
    state: {
      rowSelection,
      globalFilter,
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize
      }
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,

    // getFacetedRowModel: getFacetedRowModel(),
    // getFacetedUniqueValues: getFacetedUniqueValues(),
    // getFacetedMinMaxValues: getFacetedMinMaxValues()
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

             <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {
                setAddDialogOpen(true)
              }}
              className='max-sm:is-full'
            >
              Add Sub Admin
            </Button>
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
                {subAdmins && subAdmins.length > 0 ? (
                  <>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}

                    {/* Add empty filler rows */}
                    {Array.from({ length: pageSize - subAdmins.length }).map((_, idx) => (
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
      <SubAdminDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} />

      {/* Edit Dialog */}
      <SubAdminDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedSubAdmin(null)
        }}
        editData={selectedSubAdmin}
      />

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-subadmin'
        onConfirm={() => dispatch(deleteSubAdmin(selectedSubAdmin._id))}

        // loading={loading}
        error={error}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}

export default SubAdminTable
