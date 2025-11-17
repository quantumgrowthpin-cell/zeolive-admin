import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { toast } from 'react-toastify'

import { baseURL, key } from '@/util/config'

const BASE_URL = baseURL

// Banner type constants
export const BANNER_TYPE = {
  GIFT: 1,
  SPLASH: 2,
  HOME: 3,
  GAME: 4
}

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

// Helper to get auth headers for form data
const getFormDataAuthHeaders = () => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('admin_token')
    const uid = sessionStorage.getItem('uid')

    return {
      key: key,
      Authorization: `Bearer ${token}`,
      'x-auth-adm': uid
    }
  }

  return {}
}

// Fetch banners by type
export const fetchBannerList = createAsyncThunk('banner/fetchBannerList', async (bannerType, thunkAPI) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/banner/fetchBannerList?bannerType=${bannerType}`, {
      headers: getAuthHeaders()
    })

    return {
      banners: response.data.data || [],
      bannerType
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Create new banner
export const createNewBanner = createAsyncThunk('banner/createNewBanner', async (formData, thunkAPI) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/admin/banner/createNewBanner`, formData, {
      headers: {
        ...getFormDataAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success(response.data.message || 'Banner created successfully')

    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Update banner
export const modifyBannerDetails = createAsyncThunk('banner/modifyBannerDetails', async (formData, thunkAPI) => {
  try {
    const response = await axios.patch(`${BASE_URL}/api/admin/banner/modifyBannerDetails`, formData, {
      headers: {
        ...getFormDataAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success(response.data.message || 'Banner updated successfully')

    return response.data.data
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

// Toggle banner active status
export const toggleBannerActiveState = createAsyncThunk(
  'banner/toggleBannerActiveState',
  async (bannerId, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${BASE_URL}/api/admin/banner/toggleBannerActiveState?bannerId=${bannerId}`,
        {},
        {
          headers: getAuthHeaders()
        }
      )

      if (response.data.status) {
        toast.success(response.data.message || 'Banner status updated successfully')

        return { bannerId, success: true }
      } else {
        throw new Error(response.data.message || 'Failed to toggle banner status')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message

      toast.error(errorMsg)

      return thunkAPI.rejectWithValue(errorMsg)
    }
  }
)

// Delete banner
export const removeBanner = createAsyncThunk('banner/removeBanner', async (bannerId, thunkAPI) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/admin/banner/removeBanner?bannerId=${bannerId}`, {
      headers: getAuthHeaders()
    })

    toast.success(response.data.message || 'Banner deleted successfully')

    return { bannerId }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message

    toast.error(errorMsg)

    return thunkAPI.rejectWithValue(errorMsg)
  }
})

const initialState = {
  banners: [],
  loading: false,
  initialLoading: true,
  error: null,
  currentBannerType: BANNER_TYPE.GIFT
}

const bannerSlice = createSlice({
  name: 'banner',
  initialState,
  reducers: {
    setCurrentBannerType: (state, action) => {
      state.currentBannerType = action.payload
    },
    clearBanners: state => {
      state.banners = []
    }
  },
  extraReducers: builder => {
    builder

      // Fetch banners
      .addCase(fetchBannerList.pending, state => {
        state.initialLoading = true
        state.loading = true
        state.error = null
      })
      .addCase(fetchBannerList.fulfilled, (state, action) => {
        state.initialLoading = false
        state.loading = false
        state.banners = action.payload.banners
        state.currentBannerType = action.payload.bannerType
        state.error = null
      })
      .addCase(fetchBannerList.rejected, (state, action) => {
        state.initialLoading = false
        state.loading = false
        state.error = action.payload
      })

      // Create banner
      .addCase(createNewBanner.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createNewBanner.fulfilled, (state, action) => {
        state.loading = false
        state.banners.push(action.payload)
        state.error = null
      })
      .addCase(createNewBanner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update banner
      .addCase(modifyBannerDetails.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(modifyBannerDetails.fulfilled, (state, action) => {
        state.loading = false
        const index = state.banners.findIndex(banner => banner._id === action.payload._id)

        if (index !== -1) {
          state.banners[index] = action.payload
        }

        state.error = null
      })
      .addCase(modifyBannerDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Toggle active status
      .addCase(toggleBannerActiveState.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleBannerActiveState.fulfilled, (state, action) => {
        state.loading = false
        const banner = state.banners.find(banner => banner._id === action.payload.bannerId)

        if (banner) {
          banner.isActive = !banner.isActive
        }

        state.error = null
      })
      .addCase(toggleBannerActiveState.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Delete banner
      .addCase(removeBanner.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(removeBanner.fulfilled, (state, action) => {
        state.loading = false
        state.banners = state.banners.filter(banner => banner._id !== action.payload.bannerId)
        state.error = null
      })
      .addCase(removeBanner.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { setCurrentBannerType, clearBanners } = bannerSlice.actions

export default bannerSlice.reducer
