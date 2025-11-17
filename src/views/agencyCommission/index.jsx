'use client'

import React, { useEffect, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import { Card, Button, Typography, IconButton, CircularProgress, Box } from '@mui/material'

// Table Imports
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel
} from '@tanstack/react-table'

// Store Imports
import { fetchAgencyCommissions, deleteAgencyCommission } from '@/redux-store/slices/agencyCommission'

// Components
import CommissionDialog from './CommissionDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper()

const AgencyCommission = () => {
  const dispatch = useDispatch()
  const { commissions, loading } = useSelector(state => state.agencyCommissionReducer)

  // Component State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create')
  const [selectedCommission, setSelectedCommission] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [commissionToDelete, setCommissionToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [processedCommissions, setProcessedCommissions] = useState([])

  // Fetch commissions on component mount
  useEffect(() => {
    dispatch(fetchAgencyCommissions())
  }, [dispatch])

  // Process commissions to add earning ranges
  useEffect(() => {
    if (!commissions || commissions.length === 0) {
      setProcessedCommissions([])

      return
    }

    // Sort commissions by totalEarnings in ascending order
    const sortedCommissions = [...commissions].sort((a, b) => (a.totalEarnings || 0) - (b.totalEarnings || 0))

    // Add earning ranges
    const processed = sortedCommissions.map((commission, index) => {
      const currentValue = commission.totalEarnings || 0

      return {
        ...commission,
        earningRangeStart: currentValue,
        earningRangeEnd:
          index < sortedCommissions.length - 1 ? (sortedCommissions[index + 1].totalEarnings || 0) - 1 : null // null indicates this is the highest tier
      }
    })

    setProcessedCommissions(processed)
  }, [commissions])

  // Handle commission deletion
  const handleDeleteCommission = async () => {
    if (!commissionToDelete?._id) return

    try {
      setDeleteLoading(true)
      setDeleteError(null)

      const result = await dispatch(deleteAgencyCommission(commissionToDelete._id)).unwrap()

      // Check if the API returned an error status
      if (!result.status) {
        setDeleteError(result.message || 'Failed to delete commission')

        return
      }

      // Success case is handled by the ConfirmationDialog component
    } catch (error) {
      console.error('Failed to delete commission:', error)
      setDeleteError(error.toString() || 'Failed to delete commission')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle close confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteConfirmOpen(false)
    setCommissionToDelete(null)
    setDeleteError(null)
  }

  // Open edit dialog
  const handleEditCommission = commission => {
    // Find the original commission object without our added range properties
    const originalCommission = commissions.find(c => c._id === commission._id)

    setSelectedCommission(originalCommission)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  // Define table columns
  const columns = [
    columnHelper.accessor(row => row.earningRangeStart, {
      id: 'earningRange',
      header: 'Minimum Host Earnings',
      cell: ({ row }) => {
        const start = row.original.earningRangeStart
        const end = row.original.earningRangeEnd

        return (
          <Typography color='text.primary'>
            {end === null ? `${start.toLocaleString()}+` : `${start.toLocaleString()} - ${end.toLocaleString()}`}
          </Typography>
        )
      },
      sortingFn: (rowA, rowB) => rowA.original.earningRangeStart - rowB.original.earningRangeStart
    }),
    columnHelper.accessor('commissionRate', {
      header: 'Commission Rate (%)',
      cell: ({ row }) => <Typography color='text.primary'>{row.original.commissionRate || '0'}</Typography>
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created At',
      cell: ({ row }) => (
        <Typography color='text.primary'>{new Date(row.original.createdAt).toLocaleString()}</Typography>
      )
    }),
    columnHelper.accessor('action', {
      header: () => <div className='text-center'>Actions</div>,
      cell: ({ row }) => (
        <div className='flex items-center justify-center'>
          <IconButton onClick={() => handleEditCommission(row.original)}>
            <i className='tabler-edit text-textSecondary' />
          </IconButton>
          <IconButton
            onClick={() => {
              setCommissionToDelete(row.original)
              setDeleteConfirmOpen(true)
              setDeleteError(null)
            }}
          >
            <i className='tabler-trash text-textSecondary' />
          </IconButton>
        </div>
      ),
      enableSorting: false
    })
  ]

  // Initialize the table
  const table = useReactTable({
    data: processedCommissions || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'earningRange', desc: false }]
    }
  })

  return (
    <>
      <Card>
        <Box>
          <div className='flex justify-between items-center p-6'>
            <Typography variant='h5'>Agency Commissions</Typography>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {
                setDialogMode('create')
                setSelectedCommission(null)
                setDialogOpen(true)
              }}
            >
              Add Commission
            </Button>
          </div>
        </Box>
        {loading && commissions.length === 0 ? (
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
                      <th key={header.id} className='text-center align-middle'>
                        {header.isPlaceholder ? null : (
                          <div
                            className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
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
              {processedCommissions.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={columns.length} className='text-center py-6'>
                      No commissions found
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className='text-center align-middle'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <CommissionDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          mode={dialogMode}
          commission={selectedCommission}
        />

        {/* Delete Confirmation */}
        <ConfirmationDialog
          open={deleteConfirmOpen}
          setOpen={handleCloseDeleteDialog}
          title='Delete Commission'
          text={`Are you sure you want to delete this commission?`}
          onConfirm={handleDeleteCommission}
          loading={deleteLoading}
          error={deleteError}
          onClose={handleCloseDeleteDialog}
        />
      </Card>
    </>
  )
}

export default AgencyCommission
