import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL, key } from '@/util/config'

// Application status constants
export const APPLICATION_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3
}

// Helpers
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

// Fetch host applications based on status
export const fetchHostApplications = createAsyncThunk(
  'hostApplication/fetchApplications',
  async (params = {}, thunkAPI) => {
    try {
      const result = await axios.get(`${baseURL}/api/admin/hostApplication/getHostApplicationsList`, {
        headers: getAuthHeaders(),
        params: {
          start: params.page,
          limit: params.pageSize,
          status: params.status
        }
      })

      if (result?.data?.error) return thunkAPI.rejectWithValue(result.data.error)

      return result.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// Initial state
const initialState = {
  applications: [],
  total: 0,
  page: 1,
  pageSize: 10,
  status: APPLICATION_STATUS.PENDING,
  loading: false,
  initialLoad: true,
  error: null
}

const hostApplicationSlice = createSlice({
  name: 'hostApplication',
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
    setStatus: (state, action) => {
      if (state.status !== action.payload) {
        state.status = action.payload
        state.page = 1
        state.applications = []
      }
    },
    resetState: () => initialState
  },
  extraReducers: builder => {
    builder

      // Fetch applications
      .addCase(fetchHostApplications.pending, state => {
        state.loading = true
      })
      .addCase(fetchHostApplications.fulfilled, (state, action) => {
        if (action.payload.status) {
          state.loading = false
          state.initialLoad = false
          state.applications = action.payload.data || []
          state.total = parseInt(action.payload.total) || 0

          const totalPages = Math.max(1, Math.ceil(state.total / state.pageSize))

          if (state.page > totalPages && totalPages > 0) {
            state.page = totalPages
          }
        } else {
          state.loading = false
          state.initialLoad = false
          state.error = action.payload.message
          toast.error(action.payload.message || 'Failed to fetch applications')
        }
      })
      .addCase(fetchHostApplications.rejected, (state, action) => {
        state.loading = false
        state.initialLoad = false
        state.error = action.payload
        toast.error(action.payload || 'An error occurred while fetching applications')
      })
  }
})

export const { setPage, setPageSize, setStatus, resetState } = hostApplicationSlice.actions

export default hostApplicationSlice.reducer
