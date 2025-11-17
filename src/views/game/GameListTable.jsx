'use client'

import { useEffect, useState, useMemo } from 'react'

import Link from 'next/link'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import { CircularProgress } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getSortedRowModel
} from '@tanstack/react-table'
import { toast } from 'react-toastify'

// Component Imports
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import CustomTextField from '@core/components/mui/TextField'
import GameDialog from './GameDialog'

// Style Imports and Redux actions
import tableStyles from '@core/styles/table.module.css'
import { fetchSettings, removeGame, toggleGameStatus } from '@/redux-store/slices/settings'
import { getFullImageUrl } from '@/util/commonfunctions'
import { canEditModule } from '@/util/permissions'

// Column Definitions
const columnHelper = createColumnHelper()

const GameListTable = () => {
  const { profileData } = useSelector(state => state.adminSlice)
  const canEdit = canEditModule("Game List");

 // States
  const [gameDialogOpen, setGameDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedGame, setSelectedGame] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [gameToDelete, setGameToDelete] = useState(null)
  const [globalFilter, setGlobalFilter] = useState('')

  // Redux states
  const dispatch = useDispatch()
  const { settings, loading, error } = useSelector(state => state.settings)

  const gameList = useMemo(() => settings?.game || [], [settings])
  const settingId = useMemo(() => settings?._id || '', [settings])

  const columns = useMemo(
    () => {
      const baseColumns = [
      columnHelper.accessor('image', {
        header: () => <div>Image</div>,
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <img
              src={getFullImageUrl(row.original.image)}
              alt={row.original.name}
              className='w-12 h-12 object-cover rounded'
              onError={e => {
                e.target.src = '/images/avatars/placeholder-image.webp'
              }}
            />
          </div>
        )
      }),
      columnHelper.accessor('name', {
        header: () => <div>Game Name</div>,
        cell: ({ row }) => <Typography color='text.primary'>{row.original.name}</Typography>
      }),
      columnHelper.accessor('link', {
        header: () => <div>Game Link</div>,
        cell: ({ row }) => (
          <Link
            href={row.original.link}
            target='_blank'
            rel='noopener noreferrer'
            className='max-w-[250px] truncate hover:underline'
          >
            <Typography color='text.primary' className='max-w-[250px] truncate' title={row.original.link}>
              {row.original.link}
            </Typography>
          </Link>
        )
      }),
      columnHelper.accessor('minWinPercent', {
        header: () => <div>Min Win %</div>,
        cell: ({ row }) => <Typography color='text.primary'>{row.original.minWinPercent}%</Typography>
      }),
      columnHelper.accessor('maxWinPercent', {
        header: () => <div>Max Win %</div>,
        cell: ({ row }) => <Typography color='text.primary'>{row.original.maxWinPercent}%</Typography>
      }),
      columnHelper.accessor('isActive', {
        id : 'isActive',
        header: () => <div className='text-center'>Status</div>,
        cell: ({ row }) => (
          <div className='flex justify-center'>
            <Switch
              checked={Boolean(row.original.isActive)}
              onChange={() => {


                dispatch(toggleGameStatus({ settingId, gameId: row.original._id }))
              }}
            />
          </div>
        )
      }),
      columnHelper.accessor('action', {
        id : 'actions',
        header: () => <div className='text-center'>Action</div>,
        cell: ({ row }) => (
          <div className='flex items-center justify-center'>
            <IconButton
              onClick={() => {


                setSelectedGame(row.original)
                setEditMode(true)
                setGameDialogOpen(true)
              }}
            >
              <i className='tabler-edit text-textSecondary' />
            </IconButton>
            <IconButton
              onClick={() => {


                setGameToDelete({
                  id: row.original._id,
                  name: row.original.name
                })
                setDeleteConfirmOpen(true)
              }}
            >
              <i className='tabler-trash text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ]

  
return baseColumns.filter(col => (col.id !== 'isActive' && col.id !== 'actions') || canEdit);
  },
    [dispatch, settingId]
  )

  // For table initialization
  const table = useReactTable({
    data: gameList,
    columns,
    state: {
      globalFilter
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues()
  })

  // Handle game deletion
  const handleDeleteGame = async () => {
    if (!gameToDelete?.id) return

    try {
      await dispatch(removeGame({ settingId, gameId: gameToDelete.id })).unwrap()
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Failed to delete game:', error)
    }
  }

  // Handle cancel for confirmation dialog
  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setGameToDelete(null)
  }

  // Handle dialog close
  const handleGameDialogClose = () => {
    setGameDialogOpen(false)
    setEditMode(false)
    setSelectedGame(null)
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Games Management'
          action={
            canEdit ? <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {


                setEditMode(false)
                setSelectedGame(null)
                setGameDialogOpen(true)
              }}
            >
              Add Game
            </Button> : null
          }
        />
        <div className='flex justify-between items-center px-6 py-3 border-bs'>
          <div className='flex items-center gap-4'>
            <CustomTextField
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(String(e.target.value))}
              placeholder='Search Games'
              size='small'
            />
          </div>
        </div>
        {loading && !gameList.length ? (
          <div className='flex items-center justify-center py-10'>
            <CircularProgress />
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-10 text-error'>
            <Typography color='error'>Error loading games: {error}</Typography>
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
                {gameList.length === 0
                  ? Array.from({ length: 10 }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        {idx === Math.floor(10 / 2) ? (
                          <td colSpan={columns.length} align='center'>
                            No games found. Click &quot;Add Game&quot; to create your first game.
                          </td>
                        ) : (
                          <td colSpan={columns.length}>&nbsp;</td>
                        )}
                      </tr>
                    ))
                  : table.getRowModel().rows.map(row => {
                      return (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      )
                    })}
                {gameList.length < 10 &&
                  gameList.length > 0 &&
                  Array.from({ length: 10 - gameList.length }).map((_, idx) => (
                    <tr key={`empty-${idx}`}>
                      <td colSpan={columns.length}>&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <GameDialog
        open={gameDialogOpen}
        onClose={handleGameDialogClose}
        mode={editMode ? 'edit' : 'create'}
        game={selectedGame}
        settingId={settingId}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        setOpen={setDeleteConfirmOpen}
        type='delete-game'
        title={`Are you sure you want to delete ${gameToDelete?.name}?`}
        content="You won't be able to revert this action!"
        onConfirm={handleDeleteGame}
        onClose={handleCancelDelete}
      />
    </>
  )
}

export default GameListTable
