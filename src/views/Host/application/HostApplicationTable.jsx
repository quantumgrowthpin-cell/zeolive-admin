// Optimized HostApplicationTable.jsx (based on UserListTable setup)
'use client'

import React, { useEffect, useMemo } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { useReactTable, getCoreRowModel, getPaginationRowModel, flexRender } from '@tanstack/react-table'

// MUI
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import { Chip } from '@mui/material'

// Components
import CustomAvatar from '@/@core/components/mui/Avatar'
import CustomTextField from '@/@core/components/mui/TextField'
import TablePaginationComponent from '@/components/TablePaginationComponent'

// Utils
import { getInitials } from '@/util/getInitials'
import { getFullImageUrl } from '@/util/commonfunctions'

import tableStyles from '@core/styles/table.module.css'

// Redux
import {
  fetchHostApplications,
  setPage,
  setPageSize,
  setStatus,
  APPLICATION_STATUS
} from '@/redux-store/slices/hostApplication'

const HostApplicationTable = () => {
  const dispatch = useDispatch()

  const { applications, total, page, pageSize, loading, initialLoad, status } = useSelector(
    state => state.hostApplication
  )

  useEffect(() => {
    const fetchData = () => {
      dispatch(fetchHostApplications({ page, pageSize, status }))
    }

    const timeoutId = setTimeout(fetchData, 50)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [dispatch, page, pageSize, status])

  const columns = useMemo(() => {
    const baseColumns = [
      {
        header: 'User',
        accessorKey: 'userId.name',
        cell: ({ row }) => {
          const user = row.original.userId

          return (
            <div className='flex items-center gap-4'>
              <CustomAvatar src={user?.image ? getFullImageUrl(user.image) : ''} size={50}>
                {getInitials(user?.name || 'U')}
              </CustomAvatar>
              <div className='flex flex-col'>
                <div className='flex items-center gap-1'>
                  <Typography color='text.primary' className='font-medium'>
                    {user?.name || '-'}
                  </Typography>
                  <Chip label={row.original.userId?.country || '-'} size='small' />
                </div>
                <Typography variant='body2'>{user?.uniqueId || '-'}</Typography>
              </div>
            </div>
          )
        }
      },
      {
        header: 'Agency',
        accessorKey: 'agencyId.agencyName',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <CustomAvatar
              src={row.original.agencyId?.image ? getFullImageUrl(row.original.agencyId.image) : ''}
              size={50}
            >
              {getInitials(row.original.agencyId?.agencyName || 'U')}
            </CustomAvatar>
            <Box>
              <Typography>{row.original.agencyId?.agencyName || '-'}</Typography>
              <Typography variant='caption'>{row.original.agencyId?.agencyCode || ''}</Typography>
            </Box>
          </div>
        )
      },
      {
        header: 'Status',
        accessorKey: 'status',
        cell: ({ row }) => {
          const statusCode = Number(row.original.status)

          const statusMap = {
            [APPLICATION_STATUS.PENDING]: 'Pending',
            [APPLICATION_STATUS.APPROVED]: 'Approved',
            [APPLICATION_STATUS.REJECTED]: 'Rejected'
          }

          return (
            <Chip
              label={statusMap[statusCode] || 'Unknown'}
              size='small'
              color={
                statusMap[statusCode] === 'Approved'
                  ? 'success'
                  : statusMap[statusCode] === 'Rejected'
                    ? 'error'
                    : 'warning'
              }
              variant='tonal'
            />
          )
        }
      },
      {
        header: 'Application Date',
        accessorKey: 'appliedAt'
      }
    ]

    if (status === APPLICATION_STATUS.APPROVED || status === APPLICATION_STATUS.REJECTED) {
      baseColumns.push({
        header: 'Review Date',
        accessorKey: 'reviewedAt'
      })
    }

    if (status === APPLICATION_STATUS.REJECTED) {
      baseColumns.push({
        header: 'Rejected Reason',
        accessorKey: 'reason'
      })
    }

    return baseColumns
  }, [status])

  const table = useReactTable({
    data: applications || [],
    columns,
    manualPagination: true,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize
      }
    },
    onPaginationChange: updater => {
      if (typeof updater === 'function') {
        const { pageIndex, pageSize: newPageSize } = updater({
          pageIndex: page - 1,
          pageSize
        })

        const newPage = pageIndex + 1

        if (newPage !== page) dispatch(setPage(newPage))

        if (newPageSize !== pageSize) {
          dispatch(setPageSize(newPageSize))
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <Card>
      <Box className='flex justify-between items-center p-6 border-b gap-4'>
        <Typography variant='h5'>Host Applications</Typography>
        <CustomTextField
          select
          value={pageSize}
          onChange={e => {
            const newSize = Number(e.target.value)

            dispatch(setPageSize(newSize))
            dispatch(setPage(1))
          }}
          className='max-sm:is-full sm:is-[70px]'
        >
          <MenuItem value='10'>10</MenuItem>
          <MenuItem value='25'>25</MenuItem>
          <MenuItem value='50'>50</MenuItem>
        </CustomTextField>
      </Box>

      {initialLoad ? (
        <Box className='flex justify-center items-center py-10'>
          <CircularProgress />
        </Box>
      ) : (
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id} className='px-4 py-2 text-left'>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className='relative'>
              {applications.length > 0 ? (
                <>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className='px-4 py-3'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Render empty filler rows */}
                  {Array.from({ length: pageSize - applications.length }).map((_, idx) => (
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
                <>
                  {/* Show full empty rows / col span is not working */}
                  {Array.from({ length: pageSize }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      {idx === Math.floor(pageSize / 2) ? (
                        <td colSpan={columns.length} className='text-center py-4 text-gray-500 font-medium'>
                          No applications found
                        </td>
                      ) : (
                        columns.map((_, colIdx) => (
                          <td key={colIdx} className='px-4 py-3'>
                            &nbsp;
                          </td>
                        ))
                      )}
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
            total={total}
            onPageChange={newPage => dispatch(setPage(newPage))}
          />
        )}
        count={total}
        rowsPerPage={pageSize}
        page={page - 1}
        onPageChange={(_, newPage) => dispatch(setPage(newPage + 1))}
        onRowsPerPageChange={e => {
          dispatch(setPageSize(Number(e.target.value)))
          dispatch(setPage(1))
        }}
      />
    </Card>
  )
}

export default HostApplicationTable
