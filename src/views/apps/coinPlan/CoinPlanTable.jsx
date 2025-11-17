'use client'

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react'

import { useDispatch, useSelector } from 'react-redux'

import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import { Box } from '@mui/material'

import { createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import { toast } from 'react-toastify'

import {
  fetchCoinPlans,
  toggleCoinPlanField,
  deleteCoinPlan,
  setPage,
  setPageSize
} from '@/redux-store/slices/coinPlans'

import tableStyles from '@core/styles/table.module.css'
import CustomTextField from '@/@core/components/mui/TextField'

import CoinPlanDialog from './CoinPlanDialog'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import { canEditModule } from '@/util/permissions'

const columnHelper = createColumnHelper()

const CoinPlanTable = () => {
  const dispatch = useDispatch()
  const { plans, loading, page, pageSize, initialLoading } = useSelector(state => state.coinPlansReducer)

  const { profileData } = useSelector(state => state.adminSlice)



  const { settings } = useSelector(state => state.settings)

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [mode, setMode] = useState('create') // 'create' or 'edit'
  const [confirmOpen, setConfirmOpen] = useState(false)
  const canEdit = canEditModule("Coin Plans");

  // ✅ Use ref to track if data has been fetched
  const hasFetchedRef = useRef(false)

  const [formData, setFormData] = useState({
    coin: '',
    amount: '',
    productKey: ''
  })

  // ✅ Optimized fetch logic - only fetch if we haven't fetched before AND plans array is empty
  useEffect(() => {
    if (!hasFetchedRef.current && plans.length === 0 && !loading && !initialLoading) {
      hasFetchedRef.current = true
      dispatch(fetchCoinPlans())
    }
  }, [dispatch, plans.length, loading, initialLoading])

  // ✅ Memoized paginated data with proper dependencies
  const paginatedData = useMemo(() => {
    if (!Array.isArray(plans) || plans.length === 0) return []

    const start = (page - 1) * pageSize
    const end = start + pageSize

    return plans.slice(start, end)
  }, [plans, page, pageSize])

  // ✅ Memoized total pages calculation
  const totalPages = useMemo(() => {
    return Math.ceil(plans.length / pageSize)
  }, [plans.length, pageSize])

  // ✅ Memoized handlers to prevent unnecessary re-renders
  const handlePageChange = useCallback(
    (_, value) => {
      dispatch(setPage(value))
    },
    [dispatch]
  )

  const handlePageSizeChange = useCallback(
    e => {
      const newPageSize = Number(e.target.value)

      dispatch(setPageSize(newPageSize))
      dispatch(setPage(1)) // reset to first page on change
    },
    [dispatch]
  )

  const handleOpenDeleteDialog = useCallback(plan => {
    setSelectedPlan(plan)
    setConfirmOpen(true)
  }, [])

  const handleToggleField = useCallback(
    (id, field) => {


      dispatch(toggleCoinPlanField({ id, field }))
    },
    [dispatch]
  )

  const handleEditPlan = useCallback(
    plan => {


      setSelectedPlan(plan)
      setMode('edit')
      setOpenDialog(true)
    },
    []
  )

  const handleDeletePlan = useCallback(
    plan => {


      handleOpenDeleteDialog(plan)
    },
    [handleOpenDeleteDialog]
  )

  const handleCreatePlan = useCallback(() => {


    setSelectedPlan(null)
    setMode('create')
    setOpenDialog(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false)
    setSelectedPlan(null)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (selectedPlan?._id) {
      dispatch(deleteCoinPlan(selectedPlan._id))
    }
  }, [dispatch, selectedPlan])

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmOpen(false)
    setSelectedPlan(null)
  }, [])

  // ✅ Memoized columns to prevent recreation on every render
  const columns = useMemo(
    () => {
      const baseColumns = [
      columnHelper.accessor(row => row.coin, {
        id: 'coin',
        header: 'Coins',
        cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
      }),
      columnHelper.accessor(row => row.amount, {
        id: 'amount',
        header: `Amount (${settings?.currency?.symbol || '$'})`,
        cell: ({ getValue }) => (
          <Typography>
            {settings?.currency?.symbol || '$'} {getValue() || '-'}
          </Typography>
        )
      }),
      columnHelper.accessor(row => row.productKey, {
        id: 'productKey',
        header: 'Product Key',
        cell: ({ getValue }) => <Typography>{getValue() || '-'}</Typography>
      }),
      columnHelper.accessor(row => row.isPopular, {
        id: 'isPopular',
        header: 'Popular',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isPopular || false}
            onChange={() => handleToggleField(row.original._id, 'isPopular')}
          />
        )
      }),
      columnHelper.accessor(row => row.isActive, {
        id: 'isActive',
        header: 'Active',
        cell: ({ row }) => (
          <Switch
            checked={row.original.isActive || false}
            onChange={() => handleToggleField(row.original._id, 'isActive')}
          />
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex gap-2'>
            <IconButton onClick={() => handleEditPlan(row.original)}>
              <i className='tabler-edit text-primary' />
            </IconButton>
            <IconButton onClick={() => handleDeletePlan(row.original)}>
              <i className='tabler-trash text-error' />
            </IconButton>
          </div>
        )
      })
    ]


return baseColumns.filter(col => (col.id !== 'isPopular' && col.id !== 'isActive' && col.id !== 'actions') || canEdit);
  },
    [settings?.currency?.symbol, handleToggleField, handleEditPlan, handleDeletePlan]
  )

  // ✅ Memoized table instance
  const table = useReactTable({
    data: paginatedData,
    columns,
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <>
      <Box className='flex justify-between items-center mb-4'>
        <Typography variant='h5'>Coin Plans</Typography>
      </Box>
      <Card className='p-4'>
        <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 gap-4'>
          <CustomTextField
            select
            value={pageSize}
            onChange={handlePageSizeChange}
            className='max-sm:is-full sm:is-[70px]'
          >
            <MenuItem value='10'>10</MenuItem>
            <MenuItem value='25'>25</MenuItem>
            <MenuItem value='50'>50</MenuItem>
          </CustomTextField>
          {canEdit && <Button className='sm:w-auto w-full' variant='contained' onClick={handleCreatePlan}>
            + Create Coin Plan
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
                  {paginatedData.length === 0
                    ? Array.from({ length: 10 }).map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                          {idx === Math.floor(10 / 2) ? (
                            <td colSpan={columns.length} align='center'>
                              No Coin Plans Found
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
                  {paginatedData.length < 10 &&
                    paginatedData.length > 0 &&
                    Array.from({ length: 10 - paginatedData.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className='border-b'>
                        <td colSpan={columns.length}>&nbsp;</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className='flex justify-between items-center mt-6'>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} />
            </div>
          </>
        )}
      </Card>
      <CoinPlanDialog open={openDialog} onClose={handleCloseDialog} mode={mode} plan={selectedPlan} />
      <ConfirmationDialog
        open={confirmOpen}
        setOpen={setConfirmOpen}
        type='delete-customer'
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirmDialog}
      />
    </>
  )
}

export default CoinPlanTable
