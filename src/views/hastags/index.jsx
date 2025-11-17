'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { useDispatch, useSelector } from 'react-redux'
import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Pagination from '@mui/material/Pagination'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import { toast } from 'react-toastify'

import { fetchHashtags, deleteHashtag, setPage, setPageSize } from '@/redux-store/slices/hashtags'
import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@/@core/components/mui/TextField'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import HashtagDialog from './HashtagDialog'
import { canEditModule } from '@/util/permissions'

const columnHelper = createColumnHelper()

const formatDate = dateString => {
  if (!dateString) return '-'
  const date = new Date(dateString)

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const Hashtags = () => {
  const dispatch = useDispatch()

  const { hashtags, initialLoading, loading, error, page, pageSize, total } = useSelector(
    state => state.hashtagsReducer
  )

  const { profileData } = useSelector(state => state.adminSlice)

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedHashtag, setSelectedHashtag] = useState(null)
  const [mode, setMode] = useState('create')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const canEdit = canEditModule("Hashtags");

  useEffect(() => {
    dispatch(fetchHashtags())
  }, [dispatch])

  // Client-side paginated data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return hashtags.slice(start, end)
  }, [hashtags, page, pageSize])

  const handleOpenDeleteDialog = hashtag => {
    setSelectedHashtag(hashtag)
    setConfirmOpen(true)
  }

  const columns = useMemo(
    () => 
      { 
        
      const baseColumns =  [
      columnHelper.accessor(row => row.hashTag, {
        id: 'hashTag',
        header: () => <div className='text-center'>Hashtag</div>,
        cell: ({ getValue }) => (
          <div className='flex justify-center'>
            <Chip label={getValue() || '-'} color='primary' variant='tonal' size='small' />
          </div>
        )
      }),
      columnHelper.accessor(row => row.usageCount, {
        id: 'usageCount',
        header: () => <div className='text-center'>Usage Count</div>,
        cell: ({ getValue }) => (
          <span className='text-center'>
            <Typography>{getValue() || 0}</Typography>
          </span>
        )
      }),
      columnHelper.accessor(row => row.createdAt, {
        id: 'createdAt',
        header: () => <div className='text-center'>Created At</div>,
        cell: ({ getValue }) => (
          <span className='text-center'>
            <Typography>{formatDate(getValue())}</Typography>
          </span>
        )
      }),
      columnHelper.accessor(row => row.updatedAt, {
        id: 'updatedAt',
        header: () => <div className='text-center'>Updated At</div>,
        cell: ({ getValue }) => (
          <span className='text-center'>
            <Typography>{formatDate(getValue())}</Typography>
          </span>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className='text-center'>Actions</div>,
        cell: ({ row }) => (
          <div className='flex gap-2 justify-center'>
            <IconButton
              onClick={() => {


                setSelectedHashtag(row.original)
                setMode('edit')
                setOpenDialog(true)
              }}
            >
              <i className='tabler-edit text-primary' />
            </IconButton>
            <IconButton
              onClick={() => {


                handleOpenDeleteDialog(row.original)
              }}
            >
              <i className='tabler-trash text-error' />
            </IconButton>
          </div>
        )
      })
    ]

  
return baseColumns.filter(col => col.id !== 'actions' || canEdit);
  },
    []
  )

  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <Box>
      <Box p={3}>
        <Typography variant='h4' gutterBottom>
          Hashtags
        </Typography>
      </Box>

      <Card className='p-4'>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 gap-4'>
          <CustomTextField
            select
            value={pageSize}
            onChange={e => {
              const newPageSize = Number(e.target.value)

              dispatch(setPageSize(newPageSize))
            }}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          {canEdit && <Button
            className='sm:w-auto w-full'
            variant='contained'
            onClick={() => {


              setMode('create')
              setSelectedHashtag(null)
              setOpenDialog(true)
            }}
          >
            + Create Hashtag
          </Button>}
        </div>

        {initialLoading ? (
          <div className='flex justify-center items-center gap-2 my-10'>
            <CircularProgress />
            <Typography>Loading...</Typography>
          </div>
        ) : (
          <>
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
                  {paginatedData.length === 0 &&
                    Array.from({ length: 10 }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        <td colSpan={columns.length}>&nbsp;</td>
                        {idx === Math.floor(10 / 2) ? (
                          <td colSpan={columns.length} align='center'>
                            No Hashtags Found
                          </td>
                        ) : (
                          <td colSpan={columns.length}>&nbsp;</td>
                        )}
                      </tr>
                    ))}
                  {paginatedData.length > 0 &&
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  {paginatedData.length > 0 &&
                    paginatedData.length < pageSize &&
                    Array.from({ length: pageSize - paginatedData.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className='border-b'>
                        <td colSpan={columns.length}>&nbsp;</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className='flex flex-col md:flex-row justify-between sm:items-center gap-4 sm:mt-6 p-4'>
              <Typography color='text.disabled '>
                {`Showing ${total === 0 ? 0 : (page - 1) * pageSize + 1} to
                  ${Math.min(page * pageSize, total)} of ${total} entries`}
              </Typography>
              <Pagination
                count={Math.ceil(total / pageSize)}
                page={page}
                onChange={(_, value) => dispatch(setPage(value))}
                color='primary'
                shape='rounded'
                variant='tonal'
                showFirstButton
                showLastButton
              />
            </div>
          </>
        )}
      </Card>

      {/* Dialogs */}
      <HashtagDialog open={openDialog} onClose={() => setOpenDialog(false)} mode={mode} hashtag={selectedHashtag} />

      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-hashtag'
        onConfirm={() => dispatch(deleteHashtag(selectedHashtag._id))}
        loading={loading}
        error={error}
        onClose={() => setConfirmOpen(false)}
      />
    </Box>
  )
}

export default Hashtags
