import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL, key } from '@/util/config'

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

// Fetch all coin traders
export const fetchSubAdmins = createAsyncThunk('subAdmin/fetchSubAdmins', async (params = {}, thunkAPI) => {
  try {
    const result = await axios.get(`${baseURL}/api/admin/subAdmin/getSubAdmins`, {
      headers: getAuthHeaders(),
      params: {
        start: params.page,
        limit: params.pageSize,
      }
    })

    if (result?.error) return thunkAPI.rejectWithValue(result.error)

    return result.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// Create a new sub admin
export const createSubAdmin = createAsyncThunk('subAdmin/createSubAdmin', async (formData, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${baseURL}/api/admin/subAdmin/createSubAdmin`, formData, {
      headers: getAuthHeaders(),
    })

    toast.success(response.data.message || 'Sub admin created successfully')
    
return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return rejectWithValue(errorMsg)
  }
})

// Update coin sub admin
export const updateSubAdmin = createAsyncThunk('subAdmin/updateSubAdmin', async ({ id, uid, name, email, password, permissions }, thunkAPI) => {
  try {
    const result = await axios.patch(
      `${baseURL}/api/admin/subAdmin/updateSubAdmin`,
      {
        uid,
        name,
        email,
        password,
        permissions
      },
      {
        headers: getAuthHeaders(),
        params: {
          id
        }
      }
    )

    if (!result.data.status) {
      throw new Error(result.data.message || 'Failed to update sub admin')
    }

    toast.success(result.data.message || 'Sub admin updated successfully')

    return result.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

// Delete Sub Admin
export const deleteSubAdmin = createAsyncThunk(
  'subAdmin/deleteSubAdmin',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${baseURL}/api/admin/subAdmin/deleteSubAdmin?id=${id}`,
        {
          headers: getAuthHeaders()
        }
      )

      toast.success(response.data.message || 'Sub admin deleted successfully')

      return { id: id, ...response.data }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return rejectWithValue(errorMsg)
    }
  }
)

const subAdminSlice = createSlice({
  name: 'subAdmin',
  initialState: {
    initialLoad: true,
    subAdmins: [],
    total: 0,
    page: 1,
    pageSize: 10,
    error: null,
  },
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    }
  },
  extraReducers: builder => {
    // Fetch all coin traders
    builder
      .addCase(fetchSubAdmins.pending, state => {
        state.status = 'loading'
        state.initialLoad = true
      })
      .addCase(fetchSubAdmins.fulfilled, (state, action) => {
        if (action.payload.status) {
          state.status = 'succeeded'
          state.initialLoad = false
          state.subAdmins = action.payload.data || []
          state.total = action.payload.total || 0
        } else {
          state.status = 'failed'
          state.initialLoad = false
          state.error = action.payload.message
          toast.error(action.payload.message)
        }
      })
      .addCase(fetchSubAdmins.rejected, (state, action) => {
        state.status = 'failed'
        state.initialLoad = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // Create coin trader
    builder
      .addCase(createSubAdmin.pending, state => {
        state.status = 'loading'
      })
      .addCase(createSubAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded'

        // Format the response data to match the GET API structure
        if (action.payload.status && action.payload.data) {
          const { data } = action.payload

          // Create a properly formatted trader object from the response
          const newSubAdmin = {
            _id: data._id || '',
            uid: data.uid || '',
            name: data.name || '',
            email: data.email || '',
            password: data.password || '',
            permissions: data.permissions || [],
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          };

          // Add to the beginning of the list
          state.subAdmins = [newSubAdmin, ...state.subAdmins]
          state.total += 1
        }
      })
      .addCase(createSubAdmin.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

    // Update coin trader
    builder
      .addCase(updateSubAdmin.pending, state => {
        state.status = 'loading'
      })
      .addCase(updateSubAdmin.fulfilled, (state, action) => {
        state.status = 'succeeded'

        if (action.payload.status && action.payload.data) {
          const updatedData = action.payload.data

          state.subAdmins = state.subAdmins.map(subAdmin =>
            subAdmin._id === updatedData._id ? updatedData : subAdmin
          )
        }
      })
      .addCase(updateSubAdmin.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(deleteSubAdmin.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteSubAdmin.fulfilled, (state, action) => {
        state.loading = false

        if (action.payload.status) {
          state.subAdmins = state.subAdmins.filter(subAdmin => subAdmin._id !== action.payload.id)
        } else {
          state.error = action.payload.message
        }
      })
      .addCase(deleteSubAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setSearchQuery, setPage, setPageSize, setDateRange, resetHistoryPagination } = subAdminSlice.actions

export default subAdminSlice.reducer
