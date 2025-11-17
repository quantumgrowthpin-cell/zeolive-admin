'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { useDispatch, useSelector } from 'react-redux'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import FilterListIcon from '@mui/icons-material/FilterList'

// Next Imports

// Component Imports
import TabPanel from './components/TabPanel'
import CoinHistoryTab from './components/CoinHistoryTab'
import TransactionsTab from './components/TransactionsTab'
import EmptyState from './components/EmptyState'
import LiveStreamTab from './components/LiveStreamTab'
import DateRangePicker from '@/views/song/list/DateRangePicker'
import { TRANSACTION_TYPES } from './constants'

// Redux actions
import {
  fetchCoinHistory,
  fetchFilteredCoinHistory,
  fetchLiveStreamHistory,
  resetHistoryState,
  setDateRange
} from '@/redux-store/slices/user'

// Transaction Type Labels
const TYPE_LABELS = {
  [TRANSACTION_TYPES.ALL]: 'All',
  [TRANSACTION_TYPES.COIN_HISTORY]: 'Coin History',
  [TRANSACTION_TYPES.PURCHASE_THEME]: 'Theme Purchase',
  [TRANSACTION_TYPES.PURCHASE_AVTARFRAME]: 'Avatar Frame',
  [TRANSACTION_TYPES.PURCHASE_RIDE]: 'Ride Purchase',
  [TRANSACTION_TYPES.PRIVATE_CALL]: 'Private Call',
  [TRANSACTION_TYPES.LIVE_GIFT]: 'Live Gift',
  [TRANSACTION_TYPES.COIN_PLAN_PURCHASE]: 'Coin Plan Purchase',
  [TRANSACTION_TYPES.TEENPATTI_GAME]: 'Teen Patti Game',
  [TRANSACTION_TYPES.FERRYWHEEL_GAME]: 'Ferry Wheel Game',
  [TRANSACTION_TYPES.CASINO_GAME]: 'Casino Game'
}

// Main history component
const HistoryTab = ({ userDetails }) => {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()
  const history = useSelector(state => state.userReducer.history)
  const { startDate, endDate } = useSelector(state => state.userReducer)
  const { initialLoading: historyInitialLoading, page: historyPage } = useSelector(state => state.userReducer.history)
  const isInitialMount = useRef(true)
  const dataLoadedRef = useRef(false)
  const apiCallInProgressRef = useRef(false)

  // Get tab parameters from URL or use defaults
  const historyTabParam = parseInt(searchParams.get('historyTab') || '0')
  const transactionTypeParam = parseInt(searchParams.get('transactionType') || TRANSACTION_TYPES.PURCHASE_THEME)

  const [mainTab, setMainTab] = useState(historyTabParam)
  const [transactionTab, setTransactionTab] = useState(transactionTypeParam)

  // Helper to update URL params
  const updateUrlParams = useCallback(
    (key, value) => {
      const params = new URLSearchParams(searchParams.toString())

      params.set(key, value)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Helper to remove URL params
  const removeUrlParam = useCallback(
    paramName => {
      const params = new URLSearchParams(searchParams.toString())

      params.delete(paramName)
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Sync URL with state when tabs change externally (from URL changes)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false

      return
    }

    if (historyTabParam !== mainTab) {
      setMainTab(historyTabParam)
    }

    if (mainTab === 1 && transactionTypeParam !== transactionTab) {
      setTransactionTab(transactionTypeParam)
    }
  }, [historyTabParam, transactionTypeParam, mainTab, transactionTab])

  // Centralized data fetching logic
  const fetchData = useCallback(
    (currentMTab, currentTTab, currentStartDate, currentEndDate, page = 1) => {
      if (!userDetails?._id || apiCallInProgressRef.current) {
        return Promise.resolve()
      }

      apiCallInProgressRef.current = true

      if (page === 1) {
        dispatch(resetHistoryState())
        dataLoadedRef.current = false
      }

      const params = {
        userId: userDetails._id,
        start: page,
        limit: history.limit,
        startDate: currentStartDate || 'All',
        endDate: currentEndDate || 'All'
      }

      let fetchPromise

      if (currentMTab === 0) {
        fetchPromise = dispatch(fetchCoinHistory(params))
      } else if (currentMTab === 1) {
        fetchPromise = dispatch(fetchFilteredCoinHistory({ ...params, type: currentTTab }))
      } else if (currentMTab === 2) {
        fetchPromise = dispatch(fetchLiveStreamHistory(params))
      } else {
        fetchPromise = Promise.resolve() // Should not happen
      }

      return fetchPromise
        .then(action => {
          if (action && action.payload && action.payload.status) {
            dataLoadedRef.current = true

            if (page === 1) {
              dispatch({ type: 'users/ensurePageIsSet', payload: { value: 2 } })
            } else if (action.payload.data && action.payload.data.length > 0) {
              dispatch({ type: 'users/ensurePageIsSet', payload: { value: page + 1 } })
            }
          } else {
            if (page === 1) dataLoadedRef.current = false
          }
        })
        .catch(() => {
          if (page === 1) dataLoadedRef.current = false
        })
        .finally(() => {
          apiCallInProgressRef.current = false

          if (isInitialMount.current && page === 1) {
            isInitialMount.current = false
          }
        })
    },
    [dispatch, userDetails, history.limit]
  )

  // Effect for initial data load and when userDetails changes
  useEffect(() => {
    if (userDetails?._id) {
      fetchData(mainTab, transactionTab, startDate, endDate, 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails?._id, fetchData])

  // Handle date range changes
  const handleDateRangeChange = useCallback(
    dateRange => {
      const DUMMY_ACTION = { type: 'USER_HISTORY/DATE_HANDLER_INVOKED' }
      const currentStartDateState = startDate || 'All'
      const currentEndDateState = endDate || 'All'
      const newStartDate = dateRange.startDate || 'All'
      const newEndDate = dateRange.endDate || 'All'

      if (currentStartDateState === newStartDate && currentEndDateState === newEndDate) {
        return DUMMY_ACTION
      }

      if (apiCallInProgressRef.current) return DUMMY_ACTION

      dispatch(setDateRange(dateRange))

      fetchData(mainTab, transactionTab, newStartDate, newEndDate, 1)

      return DUMMY_ACTION
    },
    [dispatch, fetchData, mainTab, transactionTab, startDate, endDate]
  )

  // Load more transactions for pagination/infinite scroll
  const loadTransactions = useCallback(() => {
    if (!userDetails?._id || !dataLoadedRef.current || apiCallInProgressRef.current || !history.hasMore) {
      return
    }

    let currentDataLength = 0

    if (mainTab === 0) currentDataLength = history.data?.length || 0
    else if (mainTab === 1) currentDataLength = history.filteredData?.length || 0
    else if (mainTab === 2) currentDataLength = history.liveStreamHistory?.length || 0

    if (currentDataLength >= history.total && history.total > 0) {
      return
    }

    const pageToFetch = historyPage || Math.floor(currentDataLength / history.limit) + 1

    fetchData(mainTab, transactionTab, startDate, endDate, pageToFetch)
  }, [
    userDetails,
    dataLoadedRef,
    apiCallInProgressRef,
    history,
    mainTab,
    transactionTab,
    startDate,
    endDate,
    fetchData,
    historyPage
  ])

  // Handle main tab change
  const handleMainTabChange = (event, newValue) => {
    if (mainTab === newValue || apiCallInProgressRef.current) return

    tabChangeHandledRef.current = true
    setMainTab(newValue)

    const params = new URLSearchParams(searchParams.toString())

    params.set('historyTab', newValue)

    if (newValue !== 1) {
      params.delete('transactionType')
    } else {
      params.set('transactionType', transactionTab)
    }

    router.replace(`?${params.toString()}`, { scroll: false })

    fetchData(newValue, transactionTab, startDate, endDate, 1)
  }

  const tabChangeHandledRef = useRef(false)

  // Handle transaction tab change (sub-tab under "Transactions")
  const handleTransactionTabChange = newTransactionValue => {
    if (transactionTab === newTransactionValue || apiCallInProgressRef.current) return

    tabChangeHandledRef.current = true
    setTransactionTab(newTransactionValue)

    const params = new URLSearchParams(searchParams.toString())

    params.set('historyTab', 1)
    params.set('transactionType', newTransactionValue)
    router.replace(`?${params.toString()}`, { scroll: false })

    fetchData(1, newTransactionValue, startDate, endDate, 1)
  }

  // Effect to track date and tab changes
  const prevTabRef = useRef(mainTab)
  const prevTransactionTabRef = useRef(transactionTab)
  const prevDateRangeRef = useRef({ startDate, endDate })

  useEffect(() => {
    if (isInitialMount.current) {
      return
    }

    if (tabChangeHandledRef.current) {
      prevTabRef.current = mainTab
      prevTransactionTabRef.current = transactionTab
      prevDateRangeRef.current = { startDate, endDate }
      tabChangeHandledRef.current = false

      return
    }

    prevTabRef.current = mainTab
    prevTransactionTabRef.current = transactionTab
    prevDateRangeRef.current = { startDate, endDate }
  }, [mainTab, transactionTab, startDate, endDate])

  if (userDetails?.isFake) {
    return null
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Box className='mb-2'>
              <Box className='flex justify-between mb-4'>
                <Typography variant='h5'>User History</Typography>

                {/* Date Range Picker */}
                <DateRangePicker
                  buttonText={startDate !== 'All' && endDate !== 'All' ? `${startDate} - ${endDate}` : 'Filter By Date'}
                  buttonStartIcon={<FilterListIcon />}
                  setAction={handleDateRangeChange}
                  showClearButton={startDate !== 'All' && endDate !== 'All'}
                  onClear={() => {
                    handleDateRangeChange({ startDate: 'All', endDate: 'All' })
                  }}
                  initialStartDate={startDate !== 'All' ? new Date(startDate) : null}
                  initialEndDate={endDate !== 'All' ? new Date(endDate) : null}
                />
              </Box>
              <Divider />
            </Box>

            {/* Main tabs: Coin History, Transactions, and Live Stream */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={mainTab} onChange={handleMainTabChange} aria-label='history main tabs'>
                <Tab label='Coin History' />
                <Tab label='Transactions' />
                <Tab label='Live Stream' />
              </Tabs>
            </Box>

            {/* Coin History Tab Content */}
            <TabPanel value={mainTab} index={0}>
              <CoinHistoryTab
                history={history}
                loadTransactions={loadTransactions}
                hasInitiallyLoaded={!historyInitialLoading}
              />
            </TabPanel>

            {/* Transactions Tab Content */}
            <TabPanel value={mainTab} index={1}>
              <TransactionsTab
                history={history}
                transactionTab={transactionTab}
                setTransactionTab={handleTransactionTabChange}
                loadTransactions={loadTransactions}
                hasInitiallyLoaded={!historyInitialLoading}
              />
            </TabPanel>

            {/* Live Stream Tab Content */}
            <TabPanel value={mainTab} index={2}>
              <LiveStreamTab
                history={history}
                loadTransactions={loadTransactions}
                hasInitiallyLoaded={!historyInitialLoading}
              />
            </TabPanel>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default HistoryTab
