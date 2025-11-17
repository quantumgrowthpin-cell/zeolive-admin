// ✅ HostListTable.jsx (same layout as UserListTable)
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '@mui/material/styles'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import TablePagination from '@mui/material/TablePagination'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { IconButton, Switch } from '@mui/material'

import { toast } from 'react-toastify'
import { getCoreRowModel, useReactTable, flexRender, getPaginationRowModel } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import CustomTextField from '@core/components/mui/TextField'
import CustomAvatar from '@core/components/mui/Avatar'
import TablePaginationComponent from '@/components/TablePaginationComponent'

import { getInitials } from '@/util/getInitials'
import { getFullImageUrl } from '@/util/commonfunctions'

import {
  setHostPage,
  setHostPageSize,
  setHostSearch,
  setHostType,
  toggleHostBlockStatus
} from '@/redux-store/slices/hostList'
import Link from '@/components/Link'
import UserDetailDialog from '@/views/apps/user/list/UserDetailDialog/UserDetailDialog'
import { formatDate } from '@/util/format'
import { canEditModule } from '@/util/permissions'

const HostListTable = ({ tableData, isAgency = false }) => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canEdit = canEditModule("Host");

  const { hostPage, hostPageSize, hostInitialLoad, hostStats, hostSearch, hostType } = useSelector(
    state => state.hostList
  )

  const { profileData } = useSelector(state => state.adminSlice)



  const [search, setSearch] = useState(hostSearch || '')
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState(null)

  // 🔍 Debounced Search Effect with optimization
  useEffect(() => {
    // Don't trigger search if the value hasn't actually changed
    if (search === hostSearch) return

    const timer = setTimeout(() => {
      dispatch(setHostSearch(search))
      dispatch(setHostPage(1))
    }, 600) // Increased debounce time to reduce API calls

    return () => clearTimeout(timer)
  }, [search, hostSearch, dispatch])

  // Simplified handlers - only update Redux state, parent handles URL
  const handleHostTypeChange = newType => {
    dispatch(setHostType(newType))
    dispatch(setHostPage(1))
  }

  const handlePageSizeChange = newPageSize => {
    dispatch(setHostPageSize(Number(newPageSize)))
    dispatch(setHostPage(1))
  }

  // 📋 Define Table Columns
  const columns = useMemo(
    () => 
      {
        const baseColumns = [
      {
        header: <div>Agency</div>,
        accessorKey: 'agency',
        cell: ({ row }) => (
          <Box className='flex items-center gap-2'>
            {row.original.agencyImage && (
              <CustomAvatar src={getFullImageUrl(row.original.agencyImage)} size={34}>
                {getInitials(row.original.agencyName)}
              </CustomAvatar>
            )}
            <div className='flex flex-col'>
              <Typography>{row.original.agencyName || '-'}</Typography>
              <Typography variant='body2'>{row.original.agencyCode || '-'}</Typography>
              <Typography>commission rate: {row.original.commissionRate}%</Typography>
            </div>
          </Box>
        )
      },
      {
        header: <div>Host</div>,
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
        header: <div className='text-center'>Unique ID</div>,
        accessorKey: 'uniqueId',
        cell: ({ row }) => (
          <div className='flex items-center gap-2 justify-center'>
            <Typography>{row.original.uniqueId || '-'}</Typography>
          </div>
        )
      },
      {
        header: <div className='text-center'>Gender</div>,
        accessorKey: 'gender',
        cell: ({ row }) => (
          <div className='flex items-center gap-2 justify-center'>
            <Typography>{row.original.gender || '-'}</Typography>
          </div>
        )
      },
      {
        header: <div className='text-center'>Age</div>,
        accessorKey: 'age',
        cell: ({ row }) => (
          <div className='flex items-center gap-2 justify-center'>
            <Typography>{row.original.age || '0'}</Typography>
          </div>
        )
      },
      {
        header: <div className='text-center'>Coin</div>,
        accessorKey: 'coin',
        cell: ({ row }) => (
          <div className='flex items-center gap-2 justify-center'>
            <Typography>{row.original.coin || '0'}</Typography>
          </div>
        )
      },

      // {
      //   header: 'Earned Coin',
      //   accessorKey: 'earnedHostCoins'
      // },
      {
        header: <div className='text-center'>Country</div>,
        accessorKey: 'country',
        cell: ({ row }) => (
          <div className='flex items-center gap-2 justify-center'>
            <span>{row.original.countryFlagImage || '🌍'}</span>
            <Typography>{row.original.country || '-'}</Typography>
          </div>
        )
      },
      {
        header: <div className='text-center'>Followers</div>,
        accessorKey: 'totalFollowers',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.totalFollowers || '0'}
          </Typography>
        )
      },
      {
        header: <div className='text-center'>Followings</div>,
        accessorKey: 'totalFollowings',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.totalFollowings || '0'}
          </Typography>
        )
      },
      {
        header: <div className='text-center'>Friends</div>,
        accessorKey: 'totalFriends',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.totalFriends || '0'}
          </Typography>
        )
      },
      {
        header: <div className='text-center'>Posts</div>,
        accessorKey: 'totalPosts',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.totalPosts || '0'}
          </Typography>
        )
      },
      {
        header: <div className='text-center'>Videos</div>,
        accessorKey: 'totalVideos',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.totalVideos || '0'}
          </Typography>
        )
      },
      {
        id: 'isBlock',
        header: <div className='text-center'>isBlock</div>,
        accessorKey: 'isBlock',
        cell: ({ row }) => (
          <Switch
            className='mx-auto'
            id={`block-switch-${row.original._id}`}
            checked={Boolean(row.original.isBlock)}
            onChange={() => {


              dispatch(toggleHostBlockStatus({ id: row.original._id }))
            }}
          />
        )
      },
      {
        header: <div className='text-center'>Created At</div>,
        accessorKey: 'createdAt',
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary' textAlign='center'>
            {row.original.createdAt ? formatDate(row.original.createdAt) : '-'}
          </Typography>
        )
      },
      {
        header: <div className='text-center'>Action</div>,
        accessorKey: 'action',
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            <IconButton
              onClick={() => {
                setSelectedUserId(row.original._id)
                setIsUserDialogOpen(true)
              }}
            >
              <i className='tabler-info-circle text-textSecondary' />
            </IconButton>
            <IconButton>
              <Link href={`/apps/user/view?userId=${row.original._id}`} className='flex'>
                <i className='tabler-eye text-textSecondary' />
              </Link>
            </IconButton>
          </div>
        )
      }
    ]

    
return baseColumns.filter(col => col.id !== 'isBlock' || canEdit)
  },
    [dispatch]
  )

  // 🧠 Table Instance
  const table = useReactTable({
    data: tableData || [],
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
    <Card>
      <Box className='flex justify-between flex-col md:flex-row items-start md:items-center p-6 border-bs gap-4'>
        <div className='flex flex-row justify-between gap-4'>
          <CustomTextField
            select
            value={hostPageSize}
            onChange={e => handlePageSizeChange(e.target.value)}
            className='is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>

          {!isAgency && (
            <CustomTextField
              select
              value={hostType}
              onChange={e => handleHostTypeChange(e.target.value)}
              className='ms-2 min-w-[120px]'
            >
              <MenuItem value='All'>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </CustomTextField>
          )}
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
          <CircularProgress />
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
            <tbody>
              {tableData.length === 0 ? (
                <>
                  {Array.from({ length: hostPageSize }).map((_, index) => (
                    <tr key={`empty-${index}`} className='h-[57px]'>
                      {columns.map((_, colIndex) => (
                        <td key={`empty-cell-${index}-${colIndex}`} className='px-4 py-3 text-center'>
                          {index === Math.floor(hostPageSize / 2) && colIndex === 0 ? (
                            <span className='col-span-full'>No hosts found</span>
                          ) : (
                            '\u00A0'
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ) : (
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
                  {Array.from({ length: Math.max(0, hostPageSize - tableData.length) }).map((_, index) => (
                    <tr key={`empty-${index}`} className='h-[57px]'>
                      {columns.map((_, colIndex) => (
                        <td key={`empty-cell-${index}-${colIndex}`} className='px-4 py-3'>
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
          setSelectedUserId(null)
        }}
        userId={selectedUserId}
        user={tableData.find(host => host._id === selectedUserId) || null}
      />
    </Card>
  )
}

export default HostListTable
