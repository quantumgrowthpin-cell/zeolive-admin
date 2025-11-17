import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

import { toast } from 'react-toastify'

import { baseURL, key } from '@/util/config'

const BASE_URL = baseURL

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
}

// ✅ Fetch all coin plans
export const fetchCoinPlans = createAsyncThunk('coinPlans/fetchAll', async (_, thunkAPI) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/coinPlan/getCoinPlans`, {
      headers: getAuthHeaders()
    })

    return response.data.data || []
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// ➕ Create a coin plan
export const createCoinPlan = createAsyncThunk('coinPlans/create', async (payload, thunkAPI) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/coinPlan/storeCoinPlan`, payload, {
      headers: getAuthHeaders()
    })

    return response.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// ✏️ Edit a coin plan
export const editCoinPlan = createAsyncThunk('api/admin/coinPlan/updateCoinPlan', async ({ id, payload }, thunkAPI) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/admin/coinPlan/updateCoinPlan`,
      { coinPlanId: id, ...payload },
      { headers: getAuthHeaders() }
    )

    return response.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// 🔁 Unified toggle thunk
export const toggleCoinPlanField = createAsyncThunk('coinPlans/toggleField', async ({ id, field }, thunkAPI) => {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/admin/coinPlan/switchCoinPlanStatus?coinPlanId=${id}&field=${field}`,
      {},
      { headers: getAuthHeaders() }
    )

    return response.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// ❌ Delete a coin plan
export const deleteCoinPlan = createAsyncThunk('coinPlans/delete', async (id, thunkAPI) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/admin/coinPlan/deleteCoinPlan?coinPlanId=${id}`, {
      headers: getAuthHeaders()
    })

    return { id }
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// ✅ Slice
const coinPlanSlice = createSlice({
  name: 'coinPlans',
  initialState: {
    plans: [],
    initialLoading: true,
    loading: false,
    error: null,
    page: 1,
    pageSize: 10
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
    builder
      .addCase(fetchCoinPlans.pending, state => {
        state.initialLoading = true
      })
      .addCase(fetchCoinPlans.fulfilled, (state, action) => {
        state.initialLoading = false
        state.plans = action.payload
      })
      .addCase(fetchCoinPlans.rejected, (state, action) => {
        state.initialLoading = false
        state.error = action.payload
      })

      .addCase(createCoinPlan.fulfilled, (state, action) => {
        if (action.payload.status) {
          toast.success(action.payload.message)
          state.plans.push(action.payload.data)
        } else {
          toast.error(action.payload.message)
        }
      })

      .addCase(createCoinPlan.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

      .addCase(editCoinPlan.fulfilled, (state, action) => {
        if (action.payload.status) {
          toast.success(action.payload.message)

          state.plans = state.plans.map(plan =>
            plan._id === action.payload.data._id
              ? {
                  ...plan,
                  coin: action.payload.data.coin,
                  amount: action.payload.data.amount,
                  productKey: action.payload.data.productKey
                }
              : plan
          )
        } else {
          toast.error(action.payload.message)
        }
      })

      .addCase(editCoinPlan.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload.message)
      })

      .addCase(toggleCoinPlanField.fulfilled, (state, action) => {
        const updated = action.payload.data
        const index = state.plans.findIndex(plan => plan._id === updated._id)

        if (index !== -1) {
          // Only update the field that changed
          if ('isActive' in updated) {
            state.plans[index].isActive = updated.isActive
          }

          if ('isPopular' in updated) {
            state.plans[index].isPopular = updated.isPopular
          }
        }

        toast.success(`${action.meta.arg.field} status updated!`)
      })

      .addCase(deleteCoinPlan.fulfilled, (state, action) => {
        state.plans = state.plans.filter(plan => plan._id !== action.payload.id)
      })
  }
})

export const { setPage, setPageSize } = coinPlanSlice.actions

export default coinPlanSlice.reducer
