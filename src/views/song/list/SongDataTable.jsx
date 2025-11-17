'use client'

import React, { useMemo } from 'react'

import { useSelector } from 'react-redux'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper
} from '@tanstack/react-table'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import Skeleton from '@mui/material/Skeleton'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import { toast } from 'react-toastify'

import tableStyles from '@core/styles/table.module.css'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import { getFullImageUrl } from '@/util/commonfunctions'
import { canEditModule } from '@/util/permissions'

const StyledAudio = styled('audio')(() => ({
  width: '100%',
  outline: 'none'
}))

const SongDataTable = ({
  data = [],
  loading = false,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete
}) => {
  const columnHelper = createColumnHelper()

  const { profileData } = useSelector(state => state.adminSlice)
const canEdit = canEditModule("Songs");


  const columns = useMemo(
    () => 
      {
       const baseColumns = [
      columnHelper.accessor('songImage', {
        header: 'Cover',
        cell: ({ row }) => (
          <Box display='flex' alignItems='center' gap={2}>
            <Avatar
              src={getFullImageUrl(row.original.songImage)}
              alt={row.original.songTitle}
              variant='rounded'
              sx={{ width: 48, height: 48 }}
            />
          </Box>
        )
      }),
      columnHelper.accessor('songTitle', {
        header: () => <div className='text-center'>Title</div>,
        cell: info => (
          <Box textAlign='center' width='100%'>
            {info.getValue()}
          </Box>
        )
      }),
      columnHelper.accessor('singerName', {
        header: () => <Box textAlign='center'>Singer</Box>,
        cell: info => <Box textAlign='center'>{info.getValue()}</Box>
      }),
      columnHelper.display({
        id: 'category',
        header: () => <Box>Category</Box>,
        cell: ({ row }) => {
          const category = row.original.songCategoryId

          return (
            <Box display='flex' alignItems='center' gap={2}>
              <Avatar
                src={getFullImageUrl(category?.image)}
                alt={category?.name}
                variant='rounded'
                sx={{ width: 32, height: 32 }}
              />
              <Typography variant='body2'>{category?.name || '—'}</Typography>
            </Box>
          )
        }
      }),
      columnHelper.accessor('songTime', {
        header: 'Duration',
        cell: info => {
          const seconds = Math.floor(info.getValue())
          const minutes = Math.floor(seconds / 60)
          const rem = seconds % 60

          return `${minutes}:${rem.toString().padStart(2, '0')}`
        }
      }),
      columnHelper.accessor('songLink', {
        header: 'Preview',
        cell: ({ row }) =>
          row.original.songLink ? (
            <StyledAudio controls src={getFullImageUrl(row.original.songLink)} sx={{ width: 200 }} />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No Audio
            </Typography>
          )
      }),
      columnHelper.accessor('createdAt', {
        header: 'Created',
        cell: info =>
          new Date(info.getValue()).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Box display='flex' justifyContent='center' gap={1}>
            <IconButton
              onClick={() => {


                onEdit(row.original)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {


                onDelete(row.original)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </Box>
        )
      })
    ]

  
return baseColumns.filter(col => col.id !== 'actions' || canEdit);
  },
    [onDelete, onEdit, columnHelper]
  )

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pageSize),
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize
      }
    },
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const visibleColumns = table.getAllColumns().filter(col => col.getIsVisible())

  return (
    <Card>
      <div className='overflow-x-auto'>
        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, index) => (
                <tr key={`loading-${index}`}>
                  {visibleColumns.map((_, i) => (
                    <td key={i}>
                      <Skeleton variant='text' width='100%' height={30} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  {idx === Math.floor(pageSize / 2) ? (
                    <td colSpan={visibleColumns.length} className='text-center py-6 text-gray-500 font-medium'>
                      No data available
                    </td>
                  ) : (
                    visibleColumns.map((_, colIdx) => (
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
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}

                {/* Fill remaining rows to maintain table height */}
                {Array.from({ length: pageSize - data.length }).map((_, idx) => (
                  <tr key={`filler-${idx}`}>
                    {visibleColumns.map((_, colIdx) => (
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

      <TablePagination
        component={() => (
          <TablePaginationComponent page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
        )}
        count={total}
        page={page - 1}
        onPageChange={(_, newPage) => onPageChange(newPage + 1)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={e => {
          onPageSizeChange(Number(e.target.value))
          onPageChange(1)
        }}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Card>
  )
}

export default SongDataTable
