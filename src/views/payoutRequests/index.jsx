'use client'

import React, { useState, useEffect, useRef } from 'react'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

import { Box, Tab, Typography, Card, MenuItem, Grid2 } from '@mui/material'
import { TabContext, TabPanel } from '@mui/lab'
import { useDispatch, useSelector } from 'react-redux'

import CustomTabList from '@/@core/components/mui/TabList'
import PayoutRequestsTable from './PayoutRequestsTable'
import CustomTextField from '@/@core/components/mui/TextField'
import ConfirmationDialog from '@/components/dialogs/confirmation-dialog'
import RejectReasonDialog from './RejectReasonDialog'
import { fetchPayoutRequests, acceptPayoutRequest, rejectPayoutRequest, setPage, setPageSize } from '@/redux-store/slices/payoutRequests'
import { canEditModule } from '@/util/permissions'

// Constants for person types
const WITHDRAWAL_PERSON = {
  AGENCY: 1,
  HOST: 2,
  USER: 3
}

// Constants for status types
const STATUS_TYPES = {
  PENDING: 1,
  ACCEPTED: 2,
  REJECTED: 3
}

const PayoutRequests = () => {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const canEdit = canEditModule('Payout Request')

  // Get initial values from query params or default
  const initialTab = searchParams.get('tab') || 'agency'
  const initialStatus = searchParams.get('status') ? Number(searchParams.get('status')) : STATUS_TYPES.PENDING

  const [personTab, setPersonTab] = useState(initialTab)
  const [statusFilter, setStatusFilter] = useState(initialStatus)
  const { requests, loading: apiLoading, page, pageSize } = useSelector(state => state.payoutRequests)

  // Track previous request parameters to prevent duplicate calls
  const prevRequestRef = useRef({
    person: null,
    status: null
  })

  // Track if initial API call has been made
  const initialApiCallMade = useRef(false)

  // Reject reason dialog state
  const [rejectDialog, setRejectDialog] = useState({
    open: false,
    requestId: null,
    loading: false
  })

  // Confirmation dialog states
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: '', // 'accept' or 'reject'
    title: '',
    requestId: null,
    reason: '',
    loading: false,
    error: null
  })

  // Map tab values to API person params
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const personMapping = {
    agency: WITHDRAWAL_PERSON.AGENCY,
    host: WITHDRAWAL_PERSON.HOST,
    user: WITHDRAWAL_PERSON.USER
  }

  // Update query params when tab or status changes
  const updateQueryParams = (tab, status, pageArg = page, limitArg = pageSize) => {
    const params = new URLSearchParams(searchParams)

    if (tab !== undefined) params.set('tab', tab)
    if (status !== undefined) params.set('status', status.toString())
    if (pageArg !== undefined) params.set('page', String(pageArg))
    if (limitArg !== undefined) params.set('limit', String(limitArg))

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Handle person tab change
  const handlePersonChange = (event, newValue) => {
    setPersonTab(newValue)

    // Don't reset status filter when changing tabs, let it persist
    updateQueryParams(newValue, statusFilter)
  }

  // Handle status filter change
  const handleStatusChange = event => {
    const newStatus = Number(event.target.value)

    setStatusFilter(newStatus)
    updateQueryParams(personTab, newStatus)
  }

  // Open confirmation dialog for accept action
  const handleAcceptAction = requestId => {
    setConfirmDialog({
      open: true,
      type: 'accept',
      title: 'Are you sure you want to approve this payout request?',
      requestId,
      reason: '',
      loading: false,
      error: null
    })
  }

  // Open reject reason dialog for reject action
  const handleRejectAction = requestId => {
    setRejectDialog({
      open: true,
      requestId,
      loading: false
    })
  }

  // Handle reject reason submission
  const handleRejectReasonSubmit = reason => {
    // Close reject reason dialog
    setRejectDialog(prev => ({ ...prev, open: false }))

    // Open confirmation dialog with the reason
    setConfirmDialog({
      open: true,
      type: 'reject',
      title: 'Are you sure you want to reject this payout request?',
      requestId: rejectDialog.requestId,
      reason,
      loading: false,
      error: null
    })
  }

  // Handle reject reason dialog close
  const handleRejectDialogClose = () => {
    setRejectDialog(prev => ({ ...prev, open: false }))
  }

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialog(prev => ({ ...prev, open: false }))
  }

  // Handle confirmation dialog confirm action
  const handleConfirmAction = async () => {
    const { type, requestId, reason } = confirmDialog

    // Set loading state
    setConfirmDialog(prev => ({ ...prev, loading: true }))

    try {
      if (type === 'accept') {
        // Call accept API
        const result = await dispatch(acceptPayoutRequest(requestId)).unwrap()
      } else if (type === 'reject') {
        // Call reject API with the reason provided by the user
        const result = await dispatch(
          rejectPayoutRequest({
            requestId,
            reason
          })
        ).unwrap()
      }

      // Success: No need to make additional API calls as the reducer will update the state
      // No error, let the dialog transition to success state automatically
      setConfirmDialog(prev => ({ ...prev, loading: false, error: null }))
    } catch (error) {
      console.error('API error:', error)

      // Set error message to display in dialog
      setConfirmDialog(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'An error occurred during the operation.'
      }))
    }
  }

  // Replace both existing useEffects with a single, better controlled one
  const bootstrappedFromUrlRef = useRef(false)

// 1) One-time: seed Redux from URL if present
useEffect(() => {
  if (bootstrappedFromUrlRef.current) return
  if (!searchParams) return

  const urlPage  = Number(searchParams.get('page'))
  const urlLimit = Number(searchParams.get('limit'))

  let changed = false

  if (!Number.isNaN(urlPage) && urlPage > 0 && page !== urlPage) {
    dispatch(setPage(urlPage))
    changed = true
  }

  if (!Number.isNaN(urlLimit) && urlLimit > 0 && pageSize !== urlLimit) {
    dispatch(setPageSize(urlLimit))
    changed = true
  }

  // Mark bootstrapped no matter what; if we changed Redux,
  // let the next render run the fetch with the correct values.
  bootstrappedFromUrlRef.current = true
}, [searchParams, dispatch, page, pageSize])

// 2) The main effect: fetch + push URL from Redux (like you have now)
//    but guard it until we’ve bootstrapped.
useEffect(() => {
  if (!bootstrappedFromUrlRef.current) return
  if (!searchParams) return

  // read tab/status from URL (or your local state), but
  // ALWAYS use Redux for page & limit
  const tab    = searchParams.get('tab') || 'agency'

  const status = searchParams.get('status')
    ? Number(searchParams.get('status'))
    : STATUS_TYPES.PENDING

  const person = personMapping[tab]

  // fetch using Redux page/pageSize
  const params = { person, status, page, limit: pageSize }

  const sameAsPrevious =
    prevRequestRef.current.person === person &&
    prevRequestRef.current.status === status &&
    prevRequestRef.current.page   === page &&
    prevRequestRef.current.limit  === pageSize

  if (!initialApiCallMade.current || !sameAsPrevious) {
    initialApiCallMade.current = true
    prevRequestRef.current = params
    dispatch(fetchPayoutRequests(params))
  }

  // push URL to mirror Redux page/limit (and tab/status)
  const nextParams = new URLSearchParams(searchParams)
  let shouldUpdateUrl = false

  if (nextParams.get('tab') !== tab) { nextParams.set('tab', tab); shouldUpdateUrl = true }
  if (nextParams.get('status') !== String(status)) { nextParams.set('status', String(status)); shouldUpdateUrl = true }
  if (nextParams.get('page') !== String(page)) { nextParams.set('page', String(page)); shouldUpdateUrl = true }
  if (nextParams.get('limit') !== String(pageSize)) { nextParams.set('limit', String(pageSize)); shouldUpdateUrl = true }

  if (shouldUpdateUrl) {
    router.push(`${pathname}?${nextParams.toString()}`, { scroll: false })
  }
}, [searchParams, pathname, router, dispatch, page, pageSize, personMapping /* + any tab/status state you use */])


  return (
    <Box>
      {/* Page Title */}
      <Box mb={5} display='flex' justifyContent='space-between' alignItems='center'>
        <Typography variant='h5'>Payout Requests</Typography>
      </Box>

      {/* Person Tab Selector */}
      <TabContext value={personTab}>
        <Grid2 container spacing={3} mb={5}>
          <Grid2 size={6}>
            <CustomTabList onChange={handlePersonChange} variant='scrollable' pill='true'>
              <Tab
                label='Agency'
                value='agency'
                icon={<i className='tabler-users-group' />}
                iconPosition='start'
                sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
              />
              <Tab
                label='Host'
                value='host'
                icon={<i className='tabler-users-plus' />}
                iconPosition='start'
                sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
              />
              <Tab
                label='User'
                value='user'
                icon={<i className='tabler-user' />}
                iconPosition='start'
                sx={{ '& .MuiTab-iconWrapper': { mr: 1 } }}
              />
            </CustomTabList>
          </Grid2>

          {/* Status Filter Dropdown - updated to show the current status name */}
          <Grid2 size={6} display='flex' justifyContent='flex-end'>
            <CustomTextField
              select
              fullWidth
              id='select-status'
              value={statusFilter}
              onChange={handleStatusChange}
              size='small'
              sx={{ maxWidth: 200 }}
            >
              <MenuItem value={STATUS_TYPES.PENDING}>Pending</MenuItem>
              <MenuItem value={STATUS_TYPES.ACCEPTED}>Accepted</MenuItem>
              <MenuItem value={STATUS_TYPES.REJECTED}>Rejected</MenuItem>
            </CustomTextField>
          </Grid2>
        </Grid2>

        {/* Tab Content with Tables */}
        <TabPanel value='agency' sx={{ p: 0 }}>
          <PayoutRequestsTable
            personType={WITHDRAWAL_PERSON.AGENCY}
            statusType={statusFilter}
            showActions={statusFilter === STATUS_TYPES.PENDING}
            onAccept={id => handleAcceptAction(id)}
            onReject={id => handleRejectAction(id)}
          />
        </TabPanel>

        <TabPanel value='host' sx={{ p: 0 }}>
          <PayoutRequestsTable
            personType={WITHDRAWAL_PERSON.HOST}
            statusType={statusFilter}
            showActions={statusFilter === STATUS_TYPES.PENDING}
            onAccept={id => handleAcceptAction(id)}
            onReject={id => handleRejectAction(id)}
          />
        </TabPanel>

        <TabPanel value='user' sx={{ p: 0 }}>
          <PayoutRequestsTable
            personType={WITHDRAWAL_PERSON.USER}
            statusType={statusFilter}
            showActions={statusFilter === STATUS_TYPES.PENDING}
            onAccept={id => handleAcceptAction(id)}
            onReject={id => handleRejectAction(id)}
          />
        </TabPanel>
      </TabContext>

      {/* Reject Reason Dialog */}
      <RejectReasonDialog
        open={rejectDialog.open}
        onClose={handleRejectDialogClose}
        onSubmit={handleRejectReasonSubmit}
        loading={rejectDialog.loading}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onClose={handleConfirmDialogClose}
        type={confirmDialog.type === 'accept' ? 'approve-payout' : 'reject-payout'}
        title={confirmDialog.title}
        content={`This action will ${confirmDialog.type === 'accept' ? 'approve' : 'reject'} the payout request.`}
        onConfirm={handleConfirmAction}
        loading={confirmDialog.loading}
        error={confirmDialog.error}
        confirmButtonText={confirmDialog.type === 'accept' ? 'Yes, Approve' : 'Yes, Reject'}
      />
    </Box>
  )
}

export default PayoutRequests
