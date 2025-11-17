// ✅ Full implementation of HostList Page - index.jsx
'use client'

import { useEffect, useRef } from 'react'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import FilterListIcon from '@mui/icons-material/FilterList'

// Component Imports
import HostListTable from './HostListTable'
import UserListCards from '@/views/apps/user/list/UserListCards'
import DateRangePicker from '@/views/song/list/DateRangePicker'

// Redux Imports
import {
  fetchHosts,
  setHostPage,
  setHostDateRange,
  setHostType,
  initializeHostFiltersFromUrl,
  resetHostState
} from '@/redux-store/slices/hostList'

const HostList = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const hasInitialized = useRef(false)
  const lastFetchParams = useRef(null)
  const hasMadeInitialCall = useRef(false)

  const {
    hostList,
    hostStats,
    hostPage,
    hostPageSize,
    hostSearch,
    hostType,
    hostStartDate,
    hostEndDate,
    isInitialized,
    hostLoading
  } = useSelector(state => state.hostList)

  const urlPage = parseInt(searchParams.get('page')) || 1
  const urlPageSize = parseInt(searchParams.get('pageSize')) || 10
  const urlHostType = searchParams.get('type') || null

  // Initialize filters from URL on first load only
  useEffect(() => {
    if (hasInitialized.current) return

    // Always initialize, even if no URL parameters exist
    dispatch(
      initializeHostFiltersFromUrl({
        page: urlPage !== 1 ? urlPage : null,
        pageSize: urlPageSize !== 10 ? urlPageSize : null,
        type: urlHostType || null
      })
    )

    hasInitialized.current = true
  }, [dispatch, urlPage, urlPageSize, urlHostType])

  // Update URL when filters change (but not on initial load)
  useEffect(() => {
    if (!isInitialized) return

    const params = new URLSearchParams()

    if (hostType && hostType !== 'All') {
      params.set('type', hostType)
    }

    if (hostPage > 1) {
      params.set('page', hostPage.toString())
    }

    if (hostPageSize !== 10) {
      params.set('pageSize', hostPageSize.toString())
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname

    router.replace(newUrl)
  }, [hostType, hostPage, hostPageSize, pathname, router, isInitialized])

  // Single useEffect for API calls with proper dependency management
  useEffect(() => {
    if (!isInitialized) {
      return
    }

    const currentParams = {
      page: hostPage,
      pageSize: hostPageSize,
      type: hostType,
      searchQuery: hostSearch,
      startDate: hostStartDate,
      endDate: hostEndDate
    }

    const paramsString = JSON.stringify(currentParams)

    // If it's the very first call and we haven't made it yet
    if (!hasMadeInitialCall.current) {
      if (!hostLoading) {
        dispatch(fetchHosts(currentParams))
        lastFetchParams.current = paramsString
        hasMadeInitialCall.current = true
      } else {
      }

      return // Important to return after attempting the first call
    }

    // For subsequent calls:
    // Check if parameters have actually changed
    if (lastFetchParams.current === paramsString) {
      return
    }

    // And we are not currently loading
    if (!hostLoading) {
      dispatch(fetchHosts(currentParams))
      lastFetchParams.current = paramsString
    } else {
    }
  }, [dispatch, hostPage, hostPageSize, hostType, hostSearch, hostStartDate, hostEndDate, isInitialized, hostLoading]) // Added hostLoading here

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetHostState())

      // also reset local refs if needed for strict mode development or re-mount scenarios
      hasInitialized.current = false
      hasMadeInitialCall.current = false
      lastFetchParams.current = null
    }
  }, [dispatch])

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box display='flex' justifyContent='space-between' alignItems='center' mb={4}>
          <Typography variant='h5'>Host Management</Typography>
          <DateRangePicker
            buttonText={
              hostStartDate !== 'All' && hostEndDate !== 'All' ? `${hostStartDate} - ${hostEndDate}` : 'Filter by Date'
            }
            buttonVariant='outlined'
            buttonClassName='shadow-sm'
            buttonStartIcon={<FilterListIcon />}
            onApply={(start, end) => {
              dispatch(setHostDateRange({ startDate: start, endDate: end }))
              dispatch(setHostPage(1))
            }}
            showClearButton={hostStartDate !== 'All' && hostEndDate !== 'All'}
            onClear={() => {
              dispatch(setHostDateRange({ startDate: 'All', endDate: 'All' }))
              dispatch(setHostPage(1))
            }}
          />
        </Box>
        <UserListCards
          states={[]}
          total={hostStats?.totalActiveHosts || 0}
          userCount={{
            activeUsers: hostStats?.totalActiveHosts || 0,
            femaleUsers: hostStats?.totalFemaleHosts || 0,
            vipUsers: hostStats?.totalVIPHosts || 0,
            maleUsers: hostStats?.totalMaleHosts || 0
          }}
          personType='host'
        />
      </Grid>

      <Grid item xs={12}>
        <HostListTable tableData={hostList} />
      </Grid>
    </Grid>
  )
}

export default HostList
