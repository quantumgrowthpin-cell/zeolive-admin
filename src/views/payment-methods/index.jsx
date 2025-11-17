/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import { Chip, CircularProgress, MenuItem } from '@mui/material'

// Table imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import classnames from 'classnames'
import { toast } from 'react-toastify'

import CustomTextField from '@core/components/mui/TextField'

// Component imports
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import PayoutMethodDialog from './components/PayoutMethodDialog'

// Redux actions
import { fetchPayoutMethods, deletePayoutMethod, togglePayoutMethodStatus } from '@/redux-store/slices/payoutMethods'

// Util imports
import { getFullImageUrl } from '@/util/commonfunctions'

// Style Imports
import tableStyles from '@core/styles/table.module.css'
import { canEditModule } from '@/util/permissions'

const columnHelper = createColumnHelper()

const PaymentMethods = () => {
  const dispatch = useDispatch()
  const { payoutMethods, loading, initialLoading } = useSelector(state => state.payoutMethodsReducer)
  const { profileData } = useSelector(state => state.adminSlice)
const canEdit = canEditModule("Payout Methods");


  // State for dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [methodToDelete, setMethodToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [globalFilter, setGlobalFilter] = useState('')

  // Fetch payment methods on component mount
  useEffect(() => {
    dispatch(fetchPayoutMethods())
  }, [dispatch])

  const handleToggleStatus = id => {


    dispatch(togglePayoutMethodStatus(id))
  }

  // Define columns for the table
  const columns = React.useMemo(
    () => {
      const baseColumns = [
      columnHelper.accessor('image', {
        header: () => <div className='text-center'>Image</div>,
        cell: ({ row }) => (
          <div className='flex justify-center'>
            <img
              src={getFullImageUrl(row.original.image)}
              alt={row.original.name}
              className='h-16 w-24 object-contain'
              onError={e => {
                e.target.src = '/images/avatars/placeholder-image.webp'
              }}
            />
          </div>
        )
      }),
      columnHelper.accessor('name', {
        header: () => <div>Name</div>,
        cell: ({ row }) => (
          <Typography variant='body1' className='font-medium'>
            {row.original.name}
          </Typography>
        )
      }),
      columnHelper.accessor('details', {
        header: () => <div>Required Details</div>,
        cell: ({ row }) => (
          <div className='flex flex-wrap gap-1'>
            {row.original.details && row.original.details.length > 0 ? (
              row.original.details.map((detail, index) => (
                <Chip key={index} label={detail} color='primary' variant='outlined' />
              ))
            ) : (
              <Typography variant='body2' className='text-textSecondary'>
                No details specified
              </Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('status', {
        id : 'status',
        header: () => <div className='text-center'>Status</div>,
        cell: ({ row }) => (
          <div className='flex justify-center'>
            <Switch checked={row.original.isActive} onChange={() => handleToggleStatus(row.original._id)} />
          </div>
        )
      }),
      columnHelper.accessor('actions', {
        id : 'actions',
        header: () => <div className='text-center'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex justify-center'>
            <IconButton size='small' onClick={() => handleEditClick(row.original)}>
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton size='small' onClick={() => handleDeleteClick(row.original)}>
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        )
      })
    ]

    
return baseColumns.filter(col => (col.id !== 'actions' && col.id !== 'status') || canEdit);
  },
    [handleToggleStatus]
  )

  // Handle edit button click
  const handleEditClick = method => {


    setSelectedMethod(method)
    setEditDialogOpen(true)
  }

  // Handle delete button click
  const handleDeleteClick = method => {


    setMethodToDelete(method)
    setDeleteConfirmOpen(true)
    setDeleteError(null)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {


    if (!methodToDelete?._id) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)
      await dispatch(deletePayoutMethod(methodToDelete._id)).unwrap()
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Failed to delete payout method:', error)
      setDeleteError(error.toString())
    } finally {
      setDeleteLoading(false)
    }
  }

  // Set up the table
  const table = useReactTable({
    data: payoutMethods || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter
  })

  // Handle search input changes
  const handleSearchChange = e => {
    setGlobalFilter(e.target.value)
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Payout Methods'
          action={
            canEdit ?
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {


                setAddDialogOpen(true)
              }}
            >
              Add New Method
            </Button> : null
          }
        />

        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
            <CustomTextField
              value={globalFilter ?? ''}
              onChange={handleSearchChange}
              placeholder='Search Payout Method'
              className='max-sm:is-full'
            />
          </div>
        </div>

        {initialLoading ? (
          <div className='flex items-center justify-center gap-2 grow is-full my-10'>
            <CircularProgress />
            <Typography>Loading...</Typography>
          </div>
        ) : payoutMethods.length === 0 ? (
          <div className='flex items-center justify-center p-6'>
            <Typography>No payout methods found</Typography>
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
                {table.getRowModel().rows.length === 0
                  ? Array.from({ length: 10 }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        {idx === Math.floor(10 / 2) ? (
                          <td colSpan={columns.length} align='center'>
                            No payout methods found
                          </td>
                        ) : (
                          <td colSpan={columns.length}>&nbsp;</td>
                        )}
                      </tr>
                    ))
                  : table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                {table.getRowModel().rows.length < 10 &&
                  Array.from({ length: 10 - table.getRowModel().rows.length }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td colSpan={columns.length}>&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Dialog */}
      <PayoutMethodDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} mode='create' />

      {/* Edit Dialog */}
      <PayoutMethodDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedMethod(null)
        }}
        mode='edit'
        payoutMethod={selectedMethod}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        type='delete-customer'
        title='Delete Payout Method'
        text={`Are you sure you want to delete "${methodToDelete?.name}" payout method?`}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        error={deleteError}
      />
    </>
  )
}

export default PaymentMethods
