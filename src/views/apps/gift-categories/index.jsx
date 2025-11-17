'use client'

import React, { useEffect, useState, useMemo } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
import MenuItem from '@mui/material/MenuItem'
import { CircularProgress } from '@mui/material'
import classnames from 'classnames'
import { toast } from 'react-toastify'

// Third-party Imports
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

// Redux
import {
  deleteGiftCategory,
  fetchGiftsCategories,
  setCategoryPage,
  setCategoryPageSize
} from '@/redux-store/slices/gifts'

// Component Imports
import GiftCategoryDialog from '@/views/apps/gift-categories/GiftCategoryDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import CustomTextField from '@core/components/mui/TextField'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import { canEditModule } from '@/util/permissions'

// Column Helper
const columnHelper = createColumnHelper()

const GiftCategories = () => {
  // States
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null })
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const canEdit = canEditModule("Gift Categories");

  // Redux
  const dispatch = useDispatch()
  const { categories, initialLoading, page, pageSize, total } = useSelector(state => state.giftReducer) || []

  const { profileData } = useSelector(state => state.adminSlice)



  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: pageSize
  })

  // Update local pagination state when Redux state changes
  useEffect(() => {
    setPagination({
      pageIndex: page - 1,
      pageSize: pageSize
    })
  }, [page, pageSize])

  useEffect(() => {
    dispatch(fetchGiftsCategories())
  }, [dispatch, page, pageSize])

  const handleAdd = () => {
    setSelectedCategory(null)
    setOpenDialog(true)
  }

  const handleEdit = category => {
    setSelectedCategory(category)
    setOpenDialog(true)
  }

  const handleDialogSuccess = () => {
    // Refresh data
    dispatch(fetchGiftsCategories())
  }

  const handleDelete = categoryId => {
    setConfirmDelete({ open: true, id: categoryId })
  }

  const confirmDeleteAction = () => {
    if (confirmDelete.id) {
      dispatch(deleteGiftCategory(confirmDelete.id))
    }

    setConfirmDelete({ open: false, id: null })
  }

  // Column Definitions
  const columns = useMemo(
    () => 
      {
       const baseColumns = [
      columnHelper.accessor('name', {
        header: 'Category Name',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium capitalize'>
            {row.original.name}
          </Typography>
        ),
        enableSorting: true
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created Date',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {new Date(row.original.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        ),
        enableSorting: true
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {row.original.updatedAt
              ? new Date(row.original.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : '-'}
          </Typography>
        ),
        enableSorting: true
      }),
      columnHelper.accessor('action', {
        id : 'actions',
        header: () => <div className='text-center'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            <Tooltip title='Edit'>
              <IconButton
                onClick={() => {


                  handleEdit(row.original)
                }}
                size='small'
              >
                <i className='tabler-edit text-[18px]' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton
                onClick={() => {


                  handleDelete(row.original._id)
                }}
                color='error'
                size='small'
              >
                <i className='tabler-trash text-[18px]' />
              </IconButton>
            </Tooltip>
          </div>
        ),
        enableSorting: false
      })
    ]

    
return baseColumns.filter(col => col.id !== 'actions' || canEdit);
  },
    []
  )

  // Table Instance
  const table = useReactTable({
    data: categories || [],
    columns,
    state: {
      rowSelection,
      globalFilter,
      pagination
    },
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: newPagination => {
      // Update local state
      setPagination(newPagination)

      // Only dispatch to Redux if the page or pageSize actually changed
      if (newPagination.pageIndex + 1 !== page) {
        dispatch(setCategoryPage(newPagination.pageIndex + 1))
      }

      if (newPagination.pageSize !== pageSize) {
        dispatch(setCategoryPageSize(newPagination.pageSize))
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

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

  return (
    <>
      <Box className='p-4'>
        <Box className='flex justify-between items-center mb-6'>
          <Box>
            <Typography variant='h4' fontWeight={700}>
              Gift Categories
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Manage your gift categories
            </Typography>
          </Box>
          {canEdit && <Button
            variant='contained'
            startIcon={<i className='tabler-plus' />}
            onClick={() => {

              handleAdd()
            }}
          >
            Add Category
          </Button>}
        </Box>

        <Card>
          <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
            <CustomTextField
              select
              value={pageSize}
              onChange={e => {
                const newPageSize = Number(e.target.value)

                dispatch(setCategoryPageSize(newPageSize))
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
                placeholder='Search Categories'
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
                  {table.getRowModel().rows.length === 0 ? (
                    Array.from({ length: pageSize }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        {idx === Math.floor(pageSize / 2) ? (
                          <td colSpan={columns.length} className='text-center py-6 text-gray-500 font-medium'>
                            No categories found
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
                  ) : (
                    <>
                      {table.getRowModel().rows.map(row => (
                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      ))}

                      {/* Fill remaining space with empty rows */}
                      {table.getRowModel().rows.length < pageSize &&
                        Array.from({ length: pageSize - table.getRowModel().rows.length }).map((_, idx) => (
                          <tr key={`filler-${idx}`}>
                            {columns.map((_, colIdx) => (
                              <td key={colIdx} className='px-4 py-3'>
                                &nbsp;
                              </td>
                            ))}
                          </tr>
                        ))}
                    </>
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
                onPageChange={newPage => {
                  dispatch(setCategoryPage(newPage))
                }}
              />
            )}
            count={total || 0}
            rowsPerPage={pageSize}
            page={page - 1}
            onPageChange={(_, newPage) => {
              dispatch(setCategoryPage(newPage + 1))
            }}
            onRowsPerPageChange={e => {
              const newPageSize = Number(e.target.value)

              dispatch(setCategoryPageSize(newPageSize))
            }}
          />
        </Card>
      </Box>
      <GiftCategoryDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        editData={selectedCategory}
        onSuccess={handleDialogSuccess}
      />
      <ConfirmationDialog
        open={confirmDelete.open}
        setOpen={val => setConfirmDelete({ open: val, id: null })}
        type='delete-category'
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
        onClose={() => setConfirmDelete({ open: false, id: null })}
      />
    </>
  )
}

export default GiftCategories
