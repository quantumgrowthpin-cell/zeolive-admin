'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Component Imports
import UserListTable from './UserListTable'
import UserListCards from './UserListCards'

// Component Imports
import {
  fetchUsers,
  setType,
  setStreamType,
  setFilters,
  setSearchQuery,
  setDateRange,
  setPageSize,
  setPage
} from '@/redux-store/slices/user'

const UserList = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fetchInProgress = useRef(false)
  const lastFetchParams = useRef(null)
  const isInitialLoad = useRef(true)

  // Get values from URL
  const urlPage = parseInt(searchParams.get('page') || '1')
  const urlPageSize = parseInt(searchParams.get('pageSize') || '10')
  const urlType = parseInt(searchParams.get('type') || '1')
  const urlStreamType = searchParams.get('streamType')
  const urlStatus = searchParams.get('status')
  const urlRole = searchParams.get('role')
  const urlIsBlock = searchParams.get('isBlock')
  const urlIsOnline = searchParams.get('isOnline')
  const urlIsVIP = searchParams.get('isVIP')
  const urlSearch = searchParams.get('search') || ''
  const urlStartDate = searchParams.get('startDate') || 'All'
  const urlEndDate = searchParams.get('endDate') || 'All'

  const { user, userCount, total, searchQuery, type, data, streamType, page, pageSize, startDate, endDate, filters } =
    useSelector(state => state.userReducer)

  const getUsers = useCallback(
    params => {
      dispatch(fetchUsers(params)).finally(() => {
        fetchInProgress.current = false
      })
    },
    [dispatch]
  )

  // Initialize state from URL on first load
  useEffect(
    () => {
      if (isInitialLoad.current) {
        // Set type from URL
        if (urlType) {
          dispatch(setType(urlType))
        }

        // Set stream type from URL if type is 3 (Live Users)
        if (urlType === 3 && urlStreamType) {
          dispatch(setStreamType(urlStreamType))
        }

        // Set search query
        dispatch(setSearchQuery(urlSearch))

        // Set filters from URL
        const initialFilters = { status: 'All', role: 'All' }

        // Handle status filter
        if (urlIsBlock === 'true') {
          initialFilters.status = 'Blocked'
        } else if (urlIsBlock === 'false') {
          initialFilters.status = 'Unblocked'
        } else if (urlIsOnline === 'true') {
          initialFilters.status = 'Online'
        } else if (urlIsOnline === 'false') {
          initialFilters.status = 'Offline'
        } else if (urlIsVIP === 'true') {
          initialFilters.status = 'VIP'
        } else if (urlStatus) {
          initialFilters.status = urlStatus
        }

        dispatch(setDateRange({ startDate: urlStartDate, endDate: urlEndDate }))

        dispatch(setPage(urlPage))
        dispatch(setPageSize(urlPageSize))

        // Handle role filter
        if (urlRole && urlRole !== 'All') {
          initialFilters.role = urlRole
        }

        dispatch(setFilters(initialFilters))

        // Prepare params for the initial fetch
        const initialParamsForFetch = {
          page: urlPage,
          pageSize: urlPageSize,
          type: urlType,
          searchQuery: urlSearch,
          streamType: urlType === 3 ? urlStreamType || streamType || '1' : null,
          startDate: urlStartDate,
          endDate: urlEndDate,
          isBlock: urlIsBlock === 'true' ? true : urlIsBlock === 'false' ? false : undefined,
          isOnline: urlIsOnline === 'true' ? true : urlIsOnline === 'false' ? false : undefined,
          isVIP: urlIsVIP === 'true' ? true : undefined,
          role: urlRole !== 'All' ? urlRole : undefined
        }

        // Set refs to prevent double fetch
        lastFetchParams.current = initialParamsForFetch
        fetchInProgress.current = true
        isInitialLoad.current = false // Now safe to set this

        // Trigger initial fetch
        getUsers(initialParamsForFetch)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      dispatch,
      urlType,
      urlStreamType,
      urlStatus,
      urlRole,
      urlIsBlock,
      urlIsOnline,
      urlIsVIP,
      searchParams,
      urlPage,
      urlPageSize,
      urlSearch,
      urlStartDate,
      urlEndDate,
      streamType
    ]
  )

  // Single unified effect for all fetching based on URL changes
  useEffect(() => {
    if (isInitialLoad.current) return // Skip during initial load as we handle it separately

    // Skip if already fetching
    if (fetchInProgress.current) return

    // Create a debounced fetch function
    const debouncedFetch = setTimeout(() => {
      // Get the latest URL parameters
      const currentUrlType = parseInt(searchParams.get('type') || '1')
      const currentUrlPage = parseInt(searchParams.get('page') || '1')
      const currentUrlPageSize = parseInt(searchParams.get('pageSize') || '10')
      const currentUrlSearch = searchParams.get('search') || ''
      const currentUrlStreamType = searchParams.get('streamType')
      const currentUrlStartDate = searchParams.get('startDate') || 'All'
      const currentUrlEndDate = searchParams.get('endDate') || 'All'
      const currentUrlIsBlock = searchParams.get('isBlock')
      const currentUrlIsOnline = searchParams.get('isOnline')
      const currentUrlIsVIP = searchParams.get('isVIP')
      const currentUrlRole = searchParams.get('role')

      // Don't proceed if we don't have a valid type
      if (!currentUrlType) return

      const currentParams = {
        page: currentUrlPage,
        pageSize: currentUrlPageSize,
        type: currentUrlType,
        searchQuery: currentUrlSearch,
        streamType: currentUrlType === 3 ? currentUrlStreamType || streamType || '1' : null,
        startDate: currentUrlStartDate,
        endDate: currentUrlEndDate,

        // Handle status filters - ensure only one is active
        isBlock: currentUrlIsBlock === 'true' ? true : currentUrlIsBlock === 'false' ? false : undefined,
        isOnline: currentUrlIsOnline === 'true' ? true : currentUrlIsOnline === 'false' ? false : undefined,
        isVIP: currentUrlIsVIP === 'true' ? true : undefined,

        // Handle role filter
        role: currentUrlRole && currentUrlRole !== 'All' ? currentUrlRole : undefined
      }

      // Only fetch if parameters have changed
      const paramsString = JSON.stringify(currentParams)
      const lastParamsString = JSON.stringify(lastFetchParams.current)

      if (paramsString !== lastParamsString) {
        lastFetchParams.current = currentParams
        fetchInProgress.current = true

        getUsers(currentParams)
      }
    }, 300) // 300ms debounce to collect multiple URL changes

    // Cleanup timeout on dependency changes
    return () => clearTimeout(debouncedFetch)
  }, [searchParams, getUsers, streamType])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Box display='flex' alignItems='center' gap={2} mb={2}>
          <Typography variant='h5'>User Management</Typography>
        </Box>
        <UserListCards states={userCount} total={total} userCount={data} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <UserListTable />
      </Grid>
    </Grid>
  )
}

export default UserList
