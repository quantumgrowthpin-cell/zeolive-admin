'use client'

import React, { useState, useMemo, useEffect } from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import { Card, Typography, IconButton, Chip, Button, CircularProgress, TablePagination, MenuItem } from '@mui/material'
import { styled } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import { toast } from 'react-toastify'

// Component Imports
import TablePaginationComponent from '@/components/TablePaginationComponent'
import CustomTextField from '@/@core/components/mui/TextField'
import CustomAvatar from '@/@core/components/mui/Avatar'

// Style Imports
import tableStyles from '@/@core/styles/table.module.css'
import { fetchPayoutRequests, setPage, setPageSize } from '@/redux-store/slices/payoutRequests'
import { getFullImageUrl } from '@/util/commonfunctions'
import { getInitials } from '@/util/getInitials'
import { canEditModule } from '@/util/permissions'

// Column Definitions
const columnHelper = createColumnHelper()

const PayoutRequestsTable = ({ personType, statusType, showActions, onAccept, onReject }) => {
  const dispatch = useDispatch()
  const canEdit = canEditModule('Payout Request')

  // console.log('canEdit: ', canEdit)
  const { requests, loading, page, pageSize, total } = useSelector(state => state.payoutRequests)
  const { profileData } = useSelector(state => state.adminSlice)

  // Get appropriate person label
  const getPersonLabel = useMemo(() => {
    switch (personType) {
      case 1:
        return 'Agency'
      case 2:
        return 'Host'
      case 3:
        return 'User'
      default:
        return 'Unknown'
    }
  }, [personType])

  // Format date
  const formatDate = dateString => {
    if (!dateString) return '-'

    return new Date(dateString).toLocaleString()
  }

  // Get user avatar
  const getAvatar = params => {
    const { avatar, fullName } = params

    if (avatar) {
      return <CustomAvatar src={getFullImageUrl(avatar)} size={34} />
    } else {
      return <CustomAvatar size={34}>{getInitials(fullName)}</CustomAvatar>
    }
  }

  // Define columns
  const columns = useMemo(
    () => [
      columnHelper.accessor('uniqueId', {
        header: 'Request ID',
        cell: ({ row }) => (
          <Typography className='font-medium' color='text.primary'>
            {row.original.uniqueId || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('requestEntity', {
        header: () => <div>{getPersonLabel}</div>,
        cell: ({ row }) => {
          // Determine which entity to show based on person type
          let entityData = null
          let entityImage = null
          let entityName = '-'

          if (personType === 1 && row.original.agencyId) {
            entityData = row.original.agencyId
            entityImage = entityData.image
            entityName = entityData.agencyName || 'Agency'
          } else if (personType === 2 && row.original.userId) {
            entityData = row.original.userId
            entityImage = entityData.image
            entityName = entityData.name || 'Host'
          } else if (personType === 3 && row.original.userId) {
            entityData = row.original.userId
            entityImage = entityData.image
            entityName = entityData.name || 'User'
          }

          return (
            <div className='flex items-center gap-4'>
              {entityImage && getAvatar({ avatar: entityImage, fullName: entityName })}
              <Typography className='font-medium' color='text.primary'>
                {entityName}
              </Typography>
            </div>
          )
        }
      }),
      columnHelper.accessor('coin', {
        header: 'Coins',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.coin || '0'}</Typography>
      }),
      columnHelper.accessor('amount', {
        header: 'Amount ($)',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.amount || '0'}</Typography>
      }),
      columnHelper.accessor('paymentGateway', {
        header: 'Payment Method',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.paymentGateway || '-'}</Typography>
      }),
      columnHelper.accessor('paymentDetails', {
        header: 'Payment Details',
        cell: ({ row }) => {
          const details = row.original.paymentDetails || {}

          return (
            <div className='flex flex-col'>
              {Object.entries(details).map(([key, value]) => (
                <Typography key={key} color='text.primary'>
                  {`${value}`}
                </Typography>
              ))}
            </div>
          )
        }
      }),

      columnHelper.accessor('requestDate', {
        header: 'Request Date',
        cell: ({ row }) => <Typography color='text.primary'>{formatDate(row.original.requestDate)}</Typography>
      }),
      ...(statusType !== 1
        ? [
            columnHelper.accessor('acceptOrDeclineDate', {
              header: statusType === 2 ? 'Accepted Date' : 'Rejected Date',
              cell: ({ row }) => (
                <Typography color='text.primary'>{formatDate(row.original.acceptOrDeclineDate)}</Typography>
              )
            }),
            ...(statusType === 3
              ? [
                  columnHelper.accessor('reason', {
                    header: 'Rejection Reason',
                    cell: ({ row }) => <Typography color='text.primary'>{row.original.reason || '-'}</Typography>
                  })
                ]
              : [])
          ]
        : []),
      ...(showActions
        ? [
            columnHelper.accessor('actions', {
              id: 'actions',
              header: () => <div className='text-center'>Actions</div>,
              cell: ({ row }) => (
                <div className='flex items-center justify-center gap-2'>
                  <Button
                    variant='contained'
                    color='success'
                    size='small'
                    onClick={() => {
                      onAccept && onAccept(row.original._id)
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={() => {
                      onReject && onReject(row.original._id)
                    }}
                  >
                    Reject
                  </Button>
                </div>
              ),
              enableSorting: false
            })
          ]
        : [])
    ],

    // return baseColumns.filter(col => col.id !== 'actions' || canEdit);
    [personType, statusType, showActions, getPersonLabel, onAccept, onReject]
  )

  // Initialize table
  const table = useReactTable({
    data: requests || [],
    columns,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize
      }
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              dispatch(setPageSize(newPageSize)) // parent useEffect will sync URL + refetch
              dispatch(setPage(1)) // reset to first page after size change
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
        </div>

        {loading ? (
          <div className='flex items-center justify-center p-10'>
            <CircularProgress />
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
                            No payout requests found
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
                  table.getRowModel().rows.length > 0 &&
                  Array.from({ length: 10 - table.getRowModel().rows.length }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td colSpan={columns.length}>&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <TablePagination
          component={() => (
            <TablePaginationComponent
              table={table}
              total={total || 0}
              page={page}
              pageSize={pageSize}

              // If your custom TablePaginationComponent sends 0-based pageIndex:
              onPageChange={newPageZeroBased => dispatch(setPage(newPageZeroBased))}
            />
          )}
          count={total || 0}
          rowsPerPage={pageSize}
          page={page - 1}

          // MUI passes 0-based newPage
          onPageChange={(_, newPageZeroBased) => dispatch(setPage(newPageZeroBased))}
        />
      </Card>
    </>
  )
}

export default PayoutRequestsTable
