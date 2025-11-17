'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { Box, Card, CircularProgress, IconButton, MenuItem, Switch, TablePagination, Typography } from '@mui/material'

import { useDispatch, useSelector } from 'react-redux'

import { flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import { fetchHostsByAgency, setHostPage, setHostPageSize, toggleHostBlockStatus } from '@/redux-store/slices/hostList'

import CustomAvatar from '@/@core/components/mui/Avatar'
import TablePaginationComponent from '@/components/TablePaginationComponent'
import CustomTextField from '@/@core/components/mui/TextField'
import { emojiToCountryFlag, getFullImageUrl } from '@/util/commonfunctions'
import { getInitials } from '@/util/getInitials'
import UserDetailDialog from '@/views/apps/user/list/UserDetailDialog/UserDetailDialog'

const Host = () => {
  const searchParams = useSearchParams()
  const agencyId = searchParams.get('agencyId')
  const agencyName = searchParams.get('agencyName')
  const dispatch = useDispatch()
  const router = useRouter()

  const { hostList, hostPage, hostPageSize, hostSearch, hostInitialLoad, hostLoading, hostStats } = useSelector(
    state => state.hostList
  )

  const [search, setSearch] = useState(hostSearch || '')
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [selectedHost, setSelectedHost] = useState(null)

  useEffect(() => {
    if (agencyId) {
      dispatch(fetchHostsByAgency({ agencyId, page: hostPage, pageSize: hostPageSize, searchQuery: hostSearch }))
    }
  }, [agencyId, hostPage, hostPageSize, hostSearch, dispatch])

  const columns = useMemo(
    () => [
      {
        header: 'User',
        accessorKey: 'name',
        cell: ({ row }) => (
          <div className='flex items-center gap-4'>
            <CustomAvatar src={getFullImageUrl(row.original.image)} size={34}>
              {getInitials(row.original.name)}
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name || '-'}
              </Typography>
              <Typography variant='body2'>{row.original.userName || '-'}</Typography>
            </div>
          </div>
        )
      },
      {
        header: 'Unique ID',
        accessorKey: 'uniqueId'
      },
      {
        header: 'Gender',
        accessorKey: 'gender'
      },
      {
        header: 'Age',
        accessorKey: 'age'
      },
      {
        header: 'Coin',
        accessorKey: 'coin'
      },
      {
        header: 'Earned Coin',
        accessorKey: 'earnedHostCoins'
      },
      {
        header: 'Country',
        accessorKey: 'country',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <span>{emojiToCountryFlag(row.original.countryFlagImage)}</span>
            <Typography>{row.original.country || '-'}</Typography>
          </div>
        )
      },
      {
        header: 'Followers',
        accessorKey: 'totalFollowers'
      },
      {
        header: 'Followings',
        accessorKey: 'totalFollowings'
      },
      {
        header: 'Friends',
        accessorKey: 'totalFriends'
      },
      {
        header: 'Posts',
        accessorKey: 'totalPosts'
      },
      {
        header: 'Videos',
        accessorKey: 'totalVideos'
      },
      {
        header: 'IsBlock',
        accessorKey: 'isBlock',
        cell: ({ row }) => (
          <Switch
            id={`block-switch-${row.original._id}`}
            checked={Boolean(row.original.isBlock)}
            onChange={() => {
              dispatch(toggleHostBlockStatus({ id: row.original._id }))
            }}
          />
        )
      },
      {
        header: 'Action',
        accessorKey: 'action',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <IconButton
              onClick={() => {
                setSelectedHost(row.original)
                setIsUserDialogOpen(true)
              }}
            >
              <i className='tabler-info-circle text-textSecondary' />
            </IconButton>

            <IconButton
              onClick={() => {
                router.push(`/apps/user/view?userId=${row.original._id}`)
              }}
            >
              <i className='tabler-eye text-textSecondary' />
            </IconButton>
          </div>
        )
      }
    ],
    [dispatch, router]
  )

  // 🧠 Table Instance
  const table = useReactTable({
    data: hostList || [],
    columns,
    manualPagination: true,
    pageCount: Math.ceil((hostStats?.total || 0) / hostPageSize),
    state: {
      pagination: {
        pageIndex: hostPage - 1,
        pageSize: hostPageSize
      }
    },
    onPaginationChange: up => {
      const newPage = up.pageIndex + 1
      const newSize = up.pageSize

      if (newPage !== hostPage) dispatch(setHostPage(newPage))
      if (newSize !== hostPageSize) dispatch(setHostPageSize(newSize))
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Typography variant='h5' className='mb-4'>
        {agencyName}&apos;s Hosts
      </Typography>
      <Card>
        <Box className='flex justify-between flex-col md:flex-row items-start md:items-center p-6 gap-4'>
          <div>
            <CustomTextField
              select
              value={hostPageSize}
              onChange={e => {
                dispatch(setHostPageSize(Number(e.target.value)))
                dispatch(setHostPage(1))
              }}
              className='max-sm:is-full sm:is-[70px]'
            >
              <MenuItem value='10'>10</MenuItem>
              <MenuItem value='25'>25</MenuItem>
              <MenuItem value='50'>50</MenuItem>
            </CustomTextField>
          </div>

          <CustomTextField
            placeholder='Search Host'
            value={search}
            onChange={e => setSearch(e.target.value)}
            size='small'
          />
        </Box>

        {hostInitialLoad ? (
          <Box className='flex items-center justify-center py-10 gap-2'>
            <CircularProgress size={20} />
            <Typography>Loading hosts...</Typography>
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
              {table.getRowModel().rows.length === 0 ? (
                <tbody>
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      {idx === Math.floor(10 / 2) ? (
                        <td colSpan={table.getVisibleFlatColumns().length} align='center'>
                          No data available
                        </td>
                      ) : (
                        <td colSpan={table.getVisibleFlatColumns().length}>&nbsp;</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className='px-4 py-3'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {table.getRowModel().rows.length < hostPageSize &&
                    Array.from({ length: 10 - table.getRowModel().rows.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        <td colSpan={table.getVisibleFlatColumns().length}>&nbsp;</td>
                      </tr>
                    ))}
                </tbody>
              )}
            </table>
          </div>
        )}

        <TablePagination
          component={() => (
            <TablePaginationComponent
              page={hostPage}
              pageSize={hostPageSize}
              total={hostStats?.total || 0}
              onPageChange={page => dispatch(setHostPage(page))}
            />
          )}
          count={hostStats?.total || 0}
          rowsPerPage={hostPageSize}
          page={hostPage - 1}
          onPageChange={(_, newPage) => dispatch(setHostPage(newPage + 1))}
          onRowsPerPageChange={e => dispatch(setHostPageSize(Number(e.target.value)))}
        />

        <UserDetailDialog
          open={isUserDialogOpen}
          onClose={() => {
            setIsUserDialogOpen(false)
            setSelectedHost(null)
          }}
          user={selectedHost}
        />
      </Card>
    </>
  )
}

export default Host
