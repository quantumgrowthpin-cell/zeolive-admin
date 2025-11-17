import React from 'react'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import { Box, CardContent, IconButton, Typography } from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'

// Component Imports
import DateRangePicker from '@/views/song/list/DateRangePicker'

// Redux Imports
import { setDateRange, setPage } from '@/redux-store/slices/coinTrader'

const TableFilters = () => {
  const dispatch = useDispatch()
  const { startDate, endDate } = useSelector(state => state.coinTrader)

  // Handle date range apply
  const handleDateRangeApply = (start, end) => {
    // Fetch data with updated filters
    dispatch(setDateRange({ startDate: start, endDate: end }))
  }

  return (
    <Box className='flex flex-col md:flex-row justify-between items-start gap-4 mb-6'>
      <Box className=''>
        <Typography variant='h4'>Coin Traders</Typography>
        <Typography variant='body2' color='text.secondary'>
          Manage coin traders and their balances
        </Typography>
      </Box>
      <Box className='flex items-center gap-2'>
        <DateRangePicker
          buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter by Date'}
          buttonSize='small'
          buttonVariant='outlined'
          buttonStartIcon={<FilterListIcon />}
          initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
          initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
          onApply={handleDateRangeApply}
          setAction={setDateRange}
          showClearButton={startDate !== 'All' && endDate !== 'All'}
          onClear={() => {
            dispatch(setDateRange({ startDate: 'All', endDate: 'All' }))
            dispatch(setPage(1))
          }}
        />
      </Box>
    </Box>
  )
}

export default TableFilters
