import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL, key } from '@/util/config'

const BASE_URL = baseURL

// Helper to get auth headers
const getAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token')
    const uid = sessionStorage.getItem('uid')

    return {
      'Content-Type': 'application/json',
      key: key,
      Authorization: `Bearer ${token}`,
      'x-auth-adm': uid
    }
  }

  return {}
}

// Constants for payout requests
export const WITHDRAWAL_STATUS = {
  DEFAULT: 0,
  PENDING: 1,
  ACCEPTED: 2,
  DECLINED: 3
}

export const WITHDRAWAL_PERSON = {
  AGENCY: 1,
  HOST: 2,
  USER: 3
}

// Fetch payout requests
export const fetchPayoutRequests = createAsyncThunk(
  'payoutRequests/fetchPayoutRequests',
  async ({ person, status, page = 1, limit = 10 }, thunkAPI) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/admin/payoutRequest/getPayoutRequests?status=${status}&person=${person}&start=${page}&limit=${limit}`,
        {
          headers: getAuthHeaders()
        }
      )

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

// Update payout request status (approve/reject)
export const updatePayoutRequestStatus = createAsyncThunk(
  'payoutRequests/updatePayoutRequestStatus',
  async ({ requestId, type, reason }, thunkAPI) => {
    try {
      // Build the API URL
      let url = `${BASE_URL}/api/admin/payoutRequest/updateWithdrawalStatus?requestId=${requestId}&type=${type}`

      // Add reason parameter if needed
      if (type === 'reject' && reason) {
        url += `&reason=${encodeURIComponent(reason)}`
      }

      const response = await axios.patch(
        url,
        {},
        {
          headers: getAuthHeaders()
        }
      )

      // Show success message
      toast.success(response.data.message || `Request ${type === 'approve' ? 'approved' : 'rejected'} successfully`)

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

// Accept payout request
export const acceptPayoutRequest = createAsyncThunk(
  'payoutRequests/acceptPayoutRequest',
  async (requestId, thunkAPI) => {
    try {
      // Build the API URL
      const url = `${BASE_URL}/api/admin/payoutRequest/updateWithdrawalStatus?requestId=${requestId}&type=approve`

      const response = await axios.patch(
        url,
        {},
        {
          headers: getAuthHeaders()
        }
      )

      // Show success message
      toast.success(response.data.message || 'Request approved successfully')

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

// Reject payout request
export const rejectPayoutRequest = createAsyncThunk(
  'payoutRequests/rejectPayoutRequest',
  async ({ requestId, reason }, thunkAPI) => {
    try {
      // Build the API URL
      let url = `${BASE_URL}/api/admin/payoutRequest/updateWithdrawalStatus?requestId=${requestId}&type=reject`

      // Add reason parameter - default to "Rejected by admin" if not provided
      const rejectionReason = reason || 'Rejected by admin'

      url += `&reason=${encodeURIComponent(rejectionReason)}`

      const response = await axios.patch(
        url,
        {},
        {
          headers: getAuthHeaders()
        }
      )

      // Show success message
      toast.success(response.data.message || 'Request rejected successfully')

      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

// Initial state
const initialState = {
  requests: [],
  total: 0,
  loading: false,
  error: null,
  page: 1,
  pageSize: 10
}

// Create slice
const payoutRequestsSlice = createSlice({
  name: 'payoutRequests',
  initialState,
  reducers: {
    setPage: (state, action) => {
      console.log('setPage: ', action.payload)
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      console.log('setPageSize: ', action.payload)
      state.pageSize = action.payload
    }
  },
  extraReducers: builder => {
    builder

      // Fetch payout requests
      .addCase(fetchPayoutRequests.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPayoutRequests.fulfilled, (state, action) => {
        state.loading = false
        state.requests = action.payload.data || []
        state.total = action.payload.total || 0
      })
      .addCase(fetchPayoutRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update payout request status
      .addCase(updatePayoutRequestStatus.pending, state => {
        state.error = null
      })
      .addCase(updatePayoutRequestStatus.fulfilled, (state, action) => {
        // After successful update, remove the request from the list if it was in pending status
        // Update will trigger a refetch of the data via the useEffect in the component
      })
      .addCase(updatePayoutRequestStatus.rejected, (state, action) => {
        state.error = action.payload
      })

      // Accept payout request
      .addCase(acceptPayoutRequest.pending, state => {
        state.error = null
      })
      .addCase(acceptPayoutRequest.fulfilled, (state, action) => {
        // Success handled by re-fetching the data via the useEffect in the component
        const requestId = action.meta.arg // Get the ID of the accepted request

        // Remove the request from the current state if it exists
        state.requests = state.requests.filter(request => request._id !== requestId)
        if (state.total > 0) state.total -= 1
      })
      .addCase(acceptPayoutRequest.rejected, (state, action) => {
        state.error = action.payload
      })

      // Reject payout request
      .addCase(rejectPayoutRequest.pending, state => {
        state.error = null
      })
      .addCase(rejectPayoutRequest.fulfilled, (state, action) => {
        // Success handled by re-fetching the data via the useEffect in the component
        const requestId = action.meta.arg.requestId // Get the ID of the rejected request

        // Remove the request from the current state if it exists
        state.requests = state.requests.filter(request => request._id !== requestId)
        if (state.total > 0) state.total -= 1
      })
      .addCase(rejectPayoutRequest.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

// Export actions
export const { setPage, setPageSize } = payoutRequestsSlice.actions

// Export reducer
export default payoutRequestsSlice.reducer
