// React Imports
import { useState, useEffect, useRef } from 'react'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

// Redux Imports
import { useDispatch, useSelector } from 'react-redux'

import { setStreamType, setFilters, setType } from '@/redux-store/slices/user'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const TableFilters = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current type and filters from Redux store
  const { type, streamType, filters } = useSelector(state => state.userReducer)

  // Local state for filters
  const [localFilters, setLocalFilters] = useState({
    status: 'All',
    role: 'All'
  })

  // Ref to track if component is mounted
  const isMounted = useRef(false)

  // Initialize local filters from redux state
  useEffect(() => {
    if (filters) {
      setLocalFilters({
        status: filters.status || 'All',
        role: filters.role || 'All'
      })
    }
  }, [filters])

  // Set default stream type when switching to live users tab
  useEffect(() => {
    if (isMounted.current && type === 3 && !streamType) {
      dispatch(setStreamType('1'))
      updateUrlParams('streamType', '1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, streamType, dispatch])

  // Mark component as mounted after first render
  useEffect(() => {
    isMounted.current = true

    return () => {
      isMounted.current = false
    }
  }, [])

  // Helper function to update URL with preserving existing params
  // This now accepts multiple params to update at once and only updates if values changed
  const updateUrlParams = updates => {
    const params = new URLSearchParams(searchParams.toString())

    // Check if any values have actually changed
    let hasChanged = false

    Object.entries(updates).forEach(([key, value]) => {
      const currentValue = params.get(key)

      // Compare current value with new value
      if (value === null || value === undefined || value === 'All') {
        // Should delete this param
        if (currentValue !== null) {
          hasChanged = true
        }
      } else if (currentValue !== value.toString()) {
        // Value has changed
        hasChanged = true
      }
    })

    // If nothing changed, don't update URL
    if (!hasChanged) {
      return
    }

    // Always reset page to 1 when changing filters
    params.set('page', '1')

    // Apply all updates at once
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === 'All') {
        params.delete(key)
      } else {
        // Ensure value is stored as a string to avoid type conversion issues
        params.set(key, value.toString())
      }
    })

    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleTypeChange = event => {
    const newType = parseInt(event.target.value)

    // First verify the type is valid
    if (isNaN(newType) || newType < 1 || newType > 3) {
      console.error('Invalid user type:', newType)

      return
    }

    // Skip if type hasn't changed
    if (newType === type) {
      return
    }

    // Prepare all URL parameter updates as a batch
    const updates = {
      type: newType.toString(),

      // These should all be removed for all type changes
      status: null,
      role: null,
      isBlock: null,
      isOnline: null,
      isVIP: null
    }

    // Add streamType for live users
    if (newType === 3) {
      updates.streamType = '1'
    } else {
      updates.streamType = null
    }

    // Apply all URL updates in a single operation
    updateUrlParams(updates)

    // Update Redux state
    dispatch(setType(newType))

    if (newType !== 3) {
      dispatch(setStreamType(null))
    } else {
      dispatch(setStreamType('1'))
    }

    // Reset filters when type changes
    const newFilters = {
      status: 'All',
      role: 'All'
    }

    setLocalFilters(newFilters)
    dispatch(setFilters(newFilters))
  }

  const handleStreamTypeChange = event => {
    const newStreamType = event.target.value

    // Validate the streamType
    if (!['1', '2', '3'].includes(newStreamType)) {
      console.error('Invalid stream type:', newStreamType)

      return
    }

    // Skip if value hasn't changed
    if (newStreamType === streamType) {
      return
    }

    // Update Redux state first
    dispatch(setStreamType(newStreamType))

    // Then update URL with single parameter change
    updateUrlParams({ streamType: newStreamType })
  }

  const handleFilterChange = (filterName, value) => {
    // Skip update if value hasn't changed
    if (localFilters[filterName] === value) {
      return
    }

    const newFilters = {
      ...localFilters,
      [filterName]: value
    }

    setLocalFilters(newFilters)
    dispatch(setFilters(newFilters))

    // Prepare updates object for URL parameters
    const updates = {}

    // Update URL parameters based on the filter changed
    if (filterName === 'status') {
      // Clear all status filters first
      updates.isBlock = null
      updates.isOnline = null
      updates.isVIP = null

      // Set the appropriate filter
      if (value === 'Blocked') {
        updates.isBlock = 'true'
      } else if (value === 'Unblocked') {
        updates.isBlock = 'false'
      } else if (value === 'Online') {
        updates.isOnline = 'true'
      } else if (value === 'Offline') {
        updates.isOnline = 'false'
      } else if (value === 'VIP') {
        updates.isVIP = 'true'
      }
    } else if (filterName === 'role') {
      updates.role = value === 'All' ? null : value
    }

    // Apply all URL updates in a single operation
    updateUrlParams(updates)
  }

  return (
    <CardContent sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
      {/* align all filters in one line with full width */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <CustomTextField
            select
            fullWidth
            id='select-user-type'
            value={type}
            onChange={handleTypeChange}
            slotProps={{
              select: { displayEmpty: true }
            }}
          >
            <MenuItem value={1}>Real Users</MenuItem>
            <MenuItem value={2}>Fake Users</MenuItem>
            <MenuItem value={3}>Live Users</MenuItem>
          </CustomTextField>
        </Grid>

        {/* Show stream type filter only for live users */}
        {type === 3 && (
          <Grid size={{ xs: 12, sm: 4 }}>
            <CustomTextField
              select
              fullWidth
              id='select-stream-type'
              value={streamType || '1'}
              onChange={handleStreamTypeChange}
              slotProps={{
                select: { displayEmpty: true }
              }}
            >
              <MenuItem value='1'>Video Live</MenuItem>
              <MenuItem value='2'>Audio Live</MenuItem>
              <MenuItem value='3'>PK Battle</MenuItem>
            </CustomTextField>
          </Grid>
        )}

        {/* Additional filters for real/fake users */}
        {type === 1 && (
          <>
            <Grid size={{ xs: 12, sm: 4 }}>
              <CustomTextField
                select
                fullWidth
                id='select-status'
                value={localFilters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
                slotProps={{
                  select: { displayEmpty: true }
                }}
              >
                <MenuItem value='All'>Status</MenuItem>
                <MenuItem value='Blocked'>Blocked</MenuItem>
                <MenuItem value='Unblocked'>Unblocked</MenuItem>
                <MenuItem value='Online'>Online</MenuItem>
                <MenuItem value='Offline'>Offline</MenuItem>
                {localFilters.role === '1' && <MenuItem value='VIP'>VIP</MenuItem>}
              </CustomTextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <CustomTextField
                select
                fullWidth
                id='select-role'
                value={localFilters.role}
                onChange={e => handleFilterChange('role', e.target.value)}
                slotProps={{
                  select: { displayEmpty: true }
                }}
              >
                <MenuItem value='All'>Role</MenuItem>
                <MenuItem value='1'>User</MenuItem>
                <MenuItem value='2'>Host</MenuItem>
                <MenuItem value='3'>Agency</MenuItem>
                <MenuItem value='4'>CoinTrader</MenuItem>
              </CustomTextField>
            </Grid>
          </>
        )}
      </Grid>
    </CardContent>
  )
}

export default TableFilters
