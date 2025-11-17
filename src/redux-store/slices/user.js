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

// --------------------------------------------------
// ✅ EXISTING USER LIST THUNKS
// --------------------------------------------------

export const fetchUsers = createAsyncThunk('admin/fetchAllUsers', async (params = {}, thunkAPI) => {
  try {
    if (params.type === 3) {
      const result = await axios.get(`${baseURL}/api/admin/fakeLiveStreamer/getFakeLiveStreamers`, {
        headers: getAuthHeaders(),
        params: {
          start: params.page,
          limit: params.pageSize,
          search: params.searchQuery,
          streamType: params.streamType,
          startDate: params.startDate || 'All',
          endDate: params.endDate || 'All'
        }
      })

      if (result?.error) return thunkAPI.rejectWithValue(result.error)

      return result.data
    } else {
      // Map status filter to specific API parameters
      const apiParams = {
        startDate: params.startDate || 'All',
        endDate: params.endDate || 'All',
        type: params.type,
        start: params.page,
        limit: params.pageSize,
        search: params.searchQuery,
        role: params.role !== 'All' ? params.role : undefined
      }

      // Add only the active status filter, if any
      if (params.isBlock === true) apiParams.isBlock = true
      else if (params.isBlock === false) apiParams.isBlock = false
      else if (params.isOnline === true) apiParams.isOnline = true
      else if (params.isOnline === false) apiParams.isOnline = false
      else if (params.isVIP === true) apiParams.isVIP = true

      const result = await axios.get(`${baseURL}/api/admin/user/retrieveUsers`, {
        headers: getAuthHeaders(),
        params: apiParams
      })

      if (result?.error) return thunkAPI.rejectWithValue(result.error)

      return result.data
    }
  } catch (err) {
    return thunkAPI.rejectWithValue(err.message)
  }
})

export const toggleUserBlockStatus = createAsyncThunk('users/toggleUserBlockStatus', async (userId, thunkAPI) => {
  try {
    const response = await axios.patch(
      `${baseURL}/api/admin/user/toggleUserBlockStatus`,
      {},
      {
        headers: getAuthHeaders(),
        params: {
          userId: userId.id
        }
      }
    )

    if (!response.data.status) throw new Error(response.data.message)

    return response.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// --------------------------------------------------
// ✅ NEW MODAL TAB THUNKS
// --------------------------------------------------

export const fetchUserFollowers = createAsyncThunk(
  'user/fetchUserFollowers',
  async ({ userId, start = 1, limit = 20 }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/followerFollowing/fetchUserFollowers`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchUserFollowing = createAsyncThunk(
  'user/fetchUserFollowing',
  async ({ userId, start = 1, limit = 20 }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/followerFollowing/fetchUserFollowing`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchUserFriends = createAsyncThunk(
  'user/fetchUserFriends',
  async ({ userId, start = 1, limit = 20 }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/followerFollowing/fetchUserFriends`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchBlockedUserList = createAsyncThunk(
  'user/fetchBlockedUserList',
  async ({ userId, start = 1, limit = 20, startDate = 'All', endDate = 'All' }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/block/fetchBlockedUserList`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit, startDate, endDate }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchUserPosts = createAsyncThunk(
  'user/fetchUserPosts',
  async ({ userId, start = 1, limit = 8, startDate = 'All', endDate = 'All' }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/post/listUserPosts`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit, startDate, endDate }
      })

      return res.data
    } catch (err) {
      console.error('Error fetching user posts:', err)

      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchUserVideos = createAsyncThunk('user/fetchUserVideos', async ({ userId }, thunkAPI) => {
  try {
    const res = await axios.get(`${baseURL}/api/admin/video/getUserMediaLibrary`, {
      headers: getAuthHeaders(),
      params: { userId }
    })

    return res.data
  } catch (err) {
    console.error('Error fetching user videos:', err)

    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

export const registerFakeUser = createAsyncThunk('users/registerFakeUser', async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${baseURL}/api/admin/user/registerFakeUser`, userData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
    })

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to register fake user')
    }

    toast.success(response.data.message || 'Fake user registered successfully')

    return response.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

export const modifyUserProfile = createAsyncThunk('users/modifyUserProfile', async (userData, thunkAPI) => {
  try {
    const response = await axios.patch(`${baseURL}/api/admin/user/modifyUserProfile`, userData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
    })

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update user')
    }

    toast.success(response.data.message || 'User updated successfully')

    return response.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

export const deleteUser = createAsyncThunk('users/deleteUser', async (userId, thunkAPI) => {
  try {
    const response = await axios.delete(`${baseURL}/api/admin/user/deleteUser`, {
      headers: getAuthHeaders(),
      params: { userId }
    })

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete user')
    }

    toast.success(response.data.message || 'User deleted successfully')

    return { userId, ...response.data }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

export const fetchUserDetails = createAsyncThunk('user/retrieveUserProfile', async (userId, thunkAPI) => {
  try {
    const response = await axios.get(`${baseURL}/api/admin/user/retrieveUserProfile`, {
      headers: getAuthHeaders(),
      params: { userId }
    })

    return response.data
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
  }
})

// --------------------------------------------------
// ✅ HISTORY TAB THUNKS
// --------------------------------------------------

export const fetchCoinHistory = createAsyncThunk(
  'user/fetchCoinHistory',
  async ({ userId, start = 1, limit = 20, startDate = 'All', endDate = 'All' }, thunkAPI) => {
    try {
      // If we have date filters, always start from page 1 to avoid pagination issues
      const effectiveStart = startDate !== 'All' || endDate !== 'All' ? 1 : start

      const res = await axios.get(`${baseURL}/api/admin/history/fetchCoinHistory`, {
        headers: getAuthHeaders(),
        params: { userId, start: effectiveStart, limit, startDate, endDate }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchFilteredCoinHistory = createAsyncThunk(
  'user/fetchFilteredCoinHistory',
  async ({ userId, start = 1, limit = 20, startDate = 'All', endDate = 'All', type }, thunkAPI) => {
    try {
      // If we have date filters, always start from page 1 to avoid pagination issues
      const effectiveStart = startDate !== 'All' || endDate !== 'All' ? 1 : start

      const res = await axios.get(`${baseURL}/api/admin/history/fetchTypeFilteredCoinHistory`, {
        headers: getAuthHeaders(),
        params: { userId, start: effectiveStart, limit, startDate, endDate, type }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchLiveStreamHistory = createAsyncThunk(
  'user/fetchLiveStreamHistory',
  async ({ userId, start = 1, limit = 10, startDate = 'All', endDate = 'All' }, thunkAPI) => {
    try {
      // If we have date filters, always start from page 1 to avoid pagination issues
      const effectiveStart = startDate !== 'All' || endDate !== 'All' ? 1 : start

      const res = await axios.get(`${baseURL}/api/admin/liveStreamerHistory/getLiveSessionHistory`, {
        headers: getAuthHeaders(),
        params: { userId, start: effectiveStart, limit, startDate, endDate }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// --------------------------------------------------
// ✅ LIVE USER MANAGEMENT THUNKS
// --------------------------------------------------

// Create a new live streaming user
export const createLiveUser = createAsyncThunk('liveUsers/createLiveUser', async (userData, thunkAPI) => {
  try {
    const response = await axios.post(`${baseURL}/api/admin/fakeLiveStreamer/registerFakeUserWithStream`, userData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
    })

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to create live user')
    }

    toast.success(response.data.message || 'Live user created successfully')

    return response.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

// Update an existing live streaming user
export const updateLiveUser = createAsyncThunk('liveUsers/updateLiveUser', async (userData, thunkAPI) => {
  try {
    const response = await axios.patch(`${baseURL}/api/admin/fakeLiveStreamer/updateFakeUserStream`, userData, {
      headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
    })

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to update live user')
    }

    toast.success(response.data.message || 'Live user updated successfully')

    return response.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

// Delete a live streaming user
export const deleteLiveUser = createAsyncThunk('liveUsers/deleteLiveUser', async (streamerId, thunkAPI) => {
  try {
    const response = await axios.delete(`${baseURL}/api/admin/fakeLiveStreamer/deleteFakeLiveStreamer`, {
      headers: getAuthHeaders(),
      params: { streamerId }
    })

    if (!response.data.status) {
      throw new Error(response.data.message || 'Failed to delete live user')
    }

    toast.success(response.data.message || 'Live user deleted successfully')

    return { streamerId, ...response.data }
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message

    toast.error(errorMessage)

    return thunkAPI.rejectWithValue(errorMessage)
  }
})

// Toggle streaming status for a live user
export const toggleStreamingStatus = createAsyncThunk(
  'liveUsers/toggleStreamingStatus',
  async (streamerId, thunkAPI) => {
    try {
      const response = await axios.patch(
        `${baseURL}/api/admin/fakeLiveStreamer/toggleStreamerStreamingStatus`,
        {},
        {
          headers: getAuthHeaders(),
          params: { streamerId }
        }
      )

      if (!response.data.status) {
        throw new Error(response.data.message || 'Failed to toggle streaming status')
      }

      toast.success(response.data.message || 'Streaming status updated successfully')

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message

      toast.error(errorMessage)

      return thunkAPI.rejectWithValue(errorMessage)
    }
  }
)

// Profile Visitors Thunks
export const fetchProfileVisitors = createAsyncThunk(
  'user/fetchProfileVisitors',
  async ({ userId, start = 1, limit = 20 }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/profileVisitor/fetchProfileVisitors`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

export const fetchVisitedProfiles = createAsyncThunk(
  'user/fetchVisitedProfiles',
  async ({ userId, start = 1, limit = 20 }, thunkAPI) => {
    try {
      const res = await axios.get(`${baseURL}/api/admin/profileVisitor/fetchVisitedProfiles`, {
        headers: getAuthHeaders(),
        params: { userId, start, limit }
      })

      return res.data
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || err.message)
    }
  }
)

// --------------------------------------------------
// ✅ SLICE SETUP
// --------------------------------------------------

const userSlice = createSlice({
  name: 'users',
  initialState: {
    initialLoad: true,
    startDate: 'All',
    endDate: 'All',
    data: {},
    user: [],
    userCount: [],
    total: 0,
    searchQuery: '',
    type: 1,
    page: 1,
    pageSize: 10,
    status: 'idle',
    error: null,
    userDetails: null,
    initialLoading: true,
    streamType: null, // For filtering live users by type
    filters: {
      status: 'All',
      role: 'All'
    },

    // Modal Loading State
    modalLoading: {
      followers: { initialLoading: true, loading: false, reachedEnd: false, page: 1 },
      following: { initialLoading: true, loading: false, reachedEnd: false, page: 1 },
      friends: { initialLoading: true, loading: false, reachedEnd: false, page: 1 },
      posts: { initialLoading: true, loading: false, reachedEnd: false, page: 1 },
      videos: { initialLoading: true, loading: false, error: null },
      visitors: { initialLoading: true, loading: false, reachedEnd: false, page: 1 },
      visited: { initialLoading: true, loading: false, reachedEnd: false, page: 1 },
      blocked: { initialLoading: true, loading: false, reachedEnd: false, page: 1 }
    },

    modalData: {
      followers: [],
      following: [],
      friends: [],
      posts: [],
      videos: [],
      visitors: [],
      visited: [],
      blocked: []
    },

    // History Tab State
    history: {
      data: [],
      filteredData: [],
      liveStreamHistory: [],
      total: 0,
      totalIncome: 0,
      totalOutgoing: 0,
      typeWiseStats: [],
      loading: false,
      initialLoading: true,
      page: 1,
      limit: 10,
      hasMore: true,
      error: null
    }
  },

  reducers: {
    setDateRange: (state, action) => {
      // Ensure we have a valid payload
      if (!action.payload) {
        console.error('setDateRange received an invalid payload:', action.payload)

        return
      }

      // Extract startDate and endDate, defaulting to 'All' if not provided
      const startDate = action.payload.startDate || 'All'
      const endDate = action.payload.endDate || 'All'

      // Update the date range
      state.startDate = startDate
      state.endDate = endDate

      // Reset history pagination when date range changes
      if (state.history) {
        state.history.page = 1
        state.history.data = []
        state.history.filteredData = []
        state.history.liveStreamHistory = []
        state.history.hasMore = true
        state.history.initialLoading = true
      }
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
    },
    setPage: (state, action) => {
      state.page = action.payload
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload
    },
    setType: (state, action) => {
      state.type = action.payload
    },
    setStreamType: (state, action) => {
      state.streamType = action.payload
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetModalTab: (state, action) => {
      const tab = action.payload

      state.modalData[tab] = []
      state.modalLoading[tab] = {
        initialLoading: true,
        loading: false,
        reachedEnd: false,
        page: 1
      }
    },
    resetUserState: state => {
      // Store current type before reset
      const currentType = state.type
      const currentStreamType = state.streamType
      const currentFilters = { ...state.filters }

      // Reset user data to prevent data mixing between different user types
      state.user = []
      state.userCount = []
      state.total = 0
      state.data = {}

      // Clear search params
      state.searchQuery = ''
      state.page = 1

      // Restore the user type - this prevents type from being lost during reset
      state.type = currentType
      state.streamType = currentStreamType
      state.filters = currentFilters
      state.startDate = 'All'
      state.endDate = 'All'

      // Set initialLoad to true to ensure loading state shows
      state.initialLoad = true
      state.status = 'idle'
    },
    resetHistoryState: state => {
      state.history = {
        data: [],
        filteredData: [],
        liveStreamHistory: [],
        total: 0,
        totalIncome: 0,
        totalOutgoing: 0,
        typeWiseStats: [],
        loading: false,
        initialLoading: true,
        page: 1,
        limit: 10,
        hasMore: true,
        error: null,
        activeType: state.history?.activeType // Preserve active type if it exists
      }
    },
    setHistoryActiveType: (state, action) => {
      state.history.activeType = action.payload
      state.history.page = 1
      state.history.filteredData = []
      state.history.hasMore = true
    },
    ensurePageIsSet: (state, action) => {
      // Explicitly set the page value for history
      if (state.history && action.payload?.value) {
        state.history.page = action.payload.value
      }
    }
  },

  extraReducers: builder => {
    // -------------------- MAIN USER TABLE --------------------
    builder
      .addCase(fetchUsers.pending, state => {
        // If we're already in a loading state, don't change initialLoad
        // This prevents flickering when navigating between pages
        state.status = 'loading'

        // Only set initialLoad to true on the very first load
        // If we already have user data, don't reset the initialLoad flag
        if (state.initialLoad === undefined && (!state.user || state.user.length === 0)) {
          state.initialLoad = true
        }
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        // Always set these regardless of response status
        state.status = action.payload.status ? 'succeeded' : 'failed'
        state.initialLoad = false

        if (action.payload.status) {
          // Handle different response formats for different user types
          if (state.type === 3) {
            // Live users response format
            state.user = action.payload.data || []
            state.total = action.payload.total || 0

            // Set statistics directly from API response
            state.data = {
              totalLiveUsers: action.payload.totalFakeLiveStreamer || 0,
              totalVideoLive: action.payload.totalVideoLive || 0,
              totalAudioLive: action.payload.totalAudioLive || 0,
              totalPkBattle: action.payload.totalPkBattle || 0
            }
          } else {
            // Regular users response format
            state.user = action.payload.data
            state.userCount = action.payload.maleFemale
            state.total = action.payload.total
            state.data = {
              activeUsers: action.payload.totalActiveUsers,
              maleUsers: action.payload.totalMaleUsers,
              femaleUsers: action.payload.totalFemaleUsers,
              vipUsers: action.payload.totalVIPUsers
            }
          }
        } else {
          toast.error(action.payload.message)
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.initialLoad = false
        toast.error(action.payload.message)
      })

      .addCase(toggleUserBlockStatus.fulfilled, (state, action) => {
        if (action.payload.status) {
          toast.success(action.payload.message)
          state.user = state.user.map(user =>
            user._id === action.payload.data._id ? { ...user, isBlock: action.payload.data.isBlock } : user
          )
          state.status = 'succeeded'
        }
      })
      .addCase(toggleUserBlockStatus.rejected, (state, action) => {
        state.status = 'failed'
      })

    // -------------------- MODAL HANDLERS --------------------
    const handleModalTabState = (builder, type, apiThunk, key) => {
      builder
        .addCase(apiThunk.pending, state => {
          const tab = state.modalLoading[type]

          tab.loading = true
          if (tab.page === 1) tab.initialLoading = true
        })
        .addCase(apiThunk.fulfilled, (state, action) => {
          const tab = state.modalLoading[type]
          const payload = action.payload || {}

          tab.initialLoading = false
          tab.loading = false

          if (payload.status) {
            const newData = payload[key] || []
            const requestedLimit = action.meta?.arg?.limit || 20
            const totalItems = payload.total || 0

            const currentTotal = state.modalData[type].length + newData.length
            const isEnd = currentTotal >= totalItems || newData.length === 0 || newData.length < requestedLimit

            tab.page += 1
            tab.reachedEnd = isEnd

            const enhancedData = newData.map(item => ({
              ...item,
              _response: {
                total: totalItems
              }
            }))

            state.modalData[type] = [...state.modalData[type], ...enhancedData]
          } else {
            tab.reachedEnd = true
            toast.error(payload.message || 'Something went wrong')
          }
        })
        .addCase(apiThunk.rejected, (state, action) => {
          const tab = state.modalLoading[type]

          tab.initialLoading = false
          tab.loading = false
          tab.reachedEnd = true
          toast.error(action.payload || 'Request failed')
        })
    }

    handleModalTabState(builder, 'followers', fetchUserFollowers, 'followers')
    handleModalTabState(builder, 'following', fetchUserFollowing, 'following')
    handleModalTabState(builder, 'friends', fetchUserFriends, 'friends')
    handleModalTabState(builder, 'posts', fetchUserPosts, 'data')
    handleModalTabState(builder, 'blocked', fetchBlockedUserList, 'blockedUsers')

    builder
      .addCase(fetchUserVideos.pending, state => {
        state.modalLoading.videos.initialLoading = true
        state.modalLoading.videos.loading = true
        state.modalLoading.videos.error = null
      })
      .addCase(fetchUserVideos.fulfilled, (state, action) => {
        state.modalLoading.videos.initialLoading = false
        state.modalLoading.videos.loading = false

        if (action.payload?.status) {
          state.modalData.videos = action.payload.data || []
        } else {
          state.modalLoading.videos.error = action.payload?.message || 'Failed to fetch videos'
        }
      })
      .addCase(fetchUserVideos.rejected, (state, action) => {
        state.modalLoading.videos.initialLoading = false
        state.modalLoading.videos.loading = false
        state.modalLoading.videos.error = action.payload || 'Failed to fetch videos'
      })

    // -------------------- FAKE USER REGISTRATION --------------------
    builder

      // .addCase(registerFakeUser.pending, state => {
      //   state.status = 'loading'
      // })
      .addCase(registerFakeUser.fulfilled, (state, action) => {
        state.status = 'succeeded'

        if (state.type === 2 && action.payload?.status && action.payload?.data) {
          const newUser = action.payload.data

          state.user = [newUser, ...state.user]

          if (state.total) state.total += 1

          if (state.data) {
            if (state.data.activeUsers) state.data.activeUsers += 1

            if (newUser.gender === 'Male' && state.data.maleUsers) {
              state.data.maleUsers += 1
            } else if (newUser.gender === 'Female' && state.data.femaleUsers) {
              state.data.femaleUsers += 1
            }
          }
        }
      })

    // .addCase(registerFakeUser.rejected, (state, action) => {
    //   state.status = 'failed'
    //   state.error = action.payload
    // })

    // -------------------- USER PROFILE MODIFICATION --------------------
    builder

      // .addCase(modifyUserProfile.pending, state => {
      //   state.status = 'loading'
      // })
      .addCase(modifyUserProfile.fulfilled, (state, action) => {
        // state.status = 'succeeded'

        if (action.payload?.status && action.payload?.data) {
          const updatedUser = action.payload.data

          // Update the user in the users array
          state.user = state.user.map(user => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user))
        }
      })
      .addCase(modifyUserProfile.rejected, (state, action) => {
        // state.status = 'failed'
        // state.error = action.payload
      })

      // -------------------- USER DELETION --------------------
      .addCase(deleteUser.fulfilled, (state, action) => {
        if (action.payload?.status) {
          // Remove the deleted user from the state
          state.user = state.user.filter(user => user._id !== action.payload.userId)

          // Update the total count
          if (state.total) state.total -= 1

          // Update user counts in the data object (if applicable)
          const deletedUser = state.user.find(user => user._id === action.payload.userId)

          if (state.data && deletedUser) {
            // Decrement active users count
            if (state.data.activeUsers) state.data.activeUsers -= 1

            // Update gender counts
            if (deletedUser.gender === 'Male' && state.data.maleUsers) {
              state.data.maleUsers -= 1
            } else if (deletedUser.gender === 'Female' && state.data.femaleUsers) {
              state.data.femaleUsers -= 1
            }
          }
        }
      })

    // -------------------- USER VIEW --------------------
    builder
      .addCase(fetchUserDetails.pending, state => {
        state.status = 'loading'
        state.initialLoading = true
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.userDetails = action.payload.user
        state.initialLoading = false
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.status = 'failed'
        state.initialLoading = false
      })

    // History Tab Reducers
    builder
      .addCase(fetchCoinHistory.pending, state => {
        state.history.loading = true
      })
      .addCase(fetchCoinHistory.fulfilled, (state, action) => {
        const { data, total, totalIncome, totalOutgoing, typeWiseStats } = action.payload
        const requestedPage = action.meta.arg.start || 1
        const isDateFiltered = action.meta.arg.startDate !== 'All' || action.meta.arg.endDate !== 'All'

        // Prevent duplicate entries by tracking IDs
        const existingIds = new Set(state.history.data.map(item => item._id))
        const uniqueNewData = data.filter(item => !existingIds.has(item._id))

        // If it's the first page, replace data; otherwise append unique items
        if (requestedPage === 1) {
          state.history.data = data

          // For page 1, set the next page to 2
          state.history.page = 2
        } else {
          state.history.data = [...state.history.data, ...uniqueNewData]

          // Only increment the page if we received new data
          if (uniqueNewData.length > 0) {
            state.history.page = requestedPage + 1
          }
        }

        // Update state with new data
        state.history.total = total
        state.history.totalIncome = totalIncome
        state.history.totalOutgoing = totalOutgoing
        state.history.typeWiseStats = typeWiseStats || []
        state.history.loading = false
        state.history.initialLoading = false

        // Improved hasMore logic - check current data count against total
        const requestedLimit = action.meta.arg.limit || 20
        const currentDataCount = state.history.data.length
        const noNewData = uniqueNewData.length === 0 && requestedPage > 1
        const isLessThanExpected = data.length < requestedLimit
        const reachedTotal = currentDataCount >= total

        // Set hasMore to false if we've reached the total count or received less data than requested
        state.history.hasMore = !noNewData && !isLessThanExpected && !reachedTotal
      })
      .addCase(fetchCoinHistory.rejected, (state, action) => {
        state.history.loading = false
        state.history.initialLoading = false
        state.history.error = action.payload
      })

      .addCase(fetchFilteredCoinHistory.pending, state => {
        state.history.loading = true
      })
      .addCase(fetchFilteredCoinHistory.fulfilled, (state, action) => {
        const { data, total, totalIncome, totalOutgoing, typeWiseStats } = action.payload
        const requestedType = action.meta.arg.type
        const requestedPage = action.meta.arg.start || 1
        const isDateFiltered = action.meta.arg.startDate !== 'All' || action.meta.arg.endDate !== 'All'

        // Ensure we only keep the transactions matching the requested type
        const filteredData = Array.isArray(data) ? data.filter(item => parseInt(item.type) === requestedType) : []

        // Prevent duplicate entries by tracking IDs
        const existingIds = new Set(state.history.filteredData.map(item => item._id))
        const uniqueNewData = filteredData.filter(item => !existingIds.has(item._id))

        // If it's the first page, replace data; otherwise append unique items
        if (requestedPage === 1) {
          state.history.filteredData = filteredData

          // For page 1, set the next page to 2
          state.history.page = 2
        } else {
          state.history.filteredData = [...state.history.filteredData, ...uniqueNewData]

          // Only increment the page if we received new data
          if (uniqueNewData.length > 0) {
            state.history.page = requestedPage + 1
          }
        }

        // Update state with new data
        state.history.total = total
        state.history.totalIncome = totalIncome || state.history.totalIncome
        state.history.totalOutgoing = totalOutgoing || state.history.totalOutgoing
        state.history.typeWiseStats = typeWiseStats || state.history.typeWiseStats
        state.history.loading = false
        state.history.initialLoading = false

        // Improved hasMore logic - check current data count against total
        const requestedLimit = action.meta.arg.limit || 20
        const currentDataCount = state.history.filteredData.length
        const noNewData = uniqueNewData.length === 0 && requestedPage > 1
        const isLessThanExpected = filteredData.length < requestedLimit
        const reachedTotal = currentDataCount >= total

        // Set hasMore to false if we've reached the total count or received less data than requested
        state.history.hasMore = !noNewData && !isLessThanExpected && !reachedTotal
      })
      .addCase(fetchFilteredCoinHistory.rejected, (state, action) => {
        state.history.loading = false
        state.history.initialLoading = false
        state.history.error = action.payload
      })

      .addCase(fetchLiveStreamHistory.pending, state => {
        state.history.loading = true
      })
      .addCase(fetchLiveStreamHistory.fulfilled, (state, action) => {
        const { data, total } = action.payload
        const requestedPage = action.meta.arg.start || 1
        const isDateFiltered = action.meta.arg.startDate !== 'All' || action.meta.arg.endDate !== 'All'

        // Prevent duplicate entries by tracking IDs
        const existingIds = new Set(state.history.liveStreamHistory.map(item => item._id))
        const uniqueNewData = data.filter(item => !existingIds.has(item._id))

        // If it's the first page, replace data; otherwise append unique items
        if (requestedPage === 1) {
          state.history.liveStreamHistory = data

          // For page 1, set the next page to 2
          state.history.page = 2
        } else {
          state.history.liveStreamHistory = [...state.history.liveStreamHistory, ...uniqueNewData]

          // Only increment the page if we received new data
          if (uniqueNewData.length > 0) {
            state.history.page = requestedPage + 1
          }
        }

        // Update state with new data
        state.history.total = total
        state.history.loading = false
        state.history.initialLoading = false

        // Improved hasMore logic - check current data count against total
        const requestedLimit = action.meta.arg.limit || 10
        const currentDataCount = state.history.liveStreamHistory.length
        const noNewData = uniqueNewData.length === 0 && requestedPage > 1
        const isLessThanExpected = data.length < requestedLimit
        const reachedTotal = currentDataCount >= total

        // Set hasMore to false if we've reached the total count or received less data than requested
        state.history.hasMore = !noNewData && !isLessThanExpected && !reachedTotal
      })
      .addCase(fetchLiveStreamHistory.rejected, (state, action) => {
        state.history.loading = false
        state.history.initialLoading = false
        state.history.error = action.payload
      })

    // -------------------- LIVE USER MANAGEMENT --------------------
    builder
      .addCase(createLiveUser.fulfilled, (state, action) => {
        if (action.payload?.status && action.payload?.data) {
          // Add new live user to the state if we're in live users mode
          if (state.type === 3) {
            // Only append if streamType matches first user's streamType
            if (state.user && state.user.length > 0) {
              if (state.user[0].streamType === action.payload.data.streamType) {
                state.user = [action.payload.data, ...state.user]
                if (state.total) state.total += 1
              }
            } else {
              // If no users exist yet, add the first one
              state.user = [action.payload.data]
              if (state.total) state.total += 1
            }
          }
        }
      })

      .addCase(updateLiveUser.fulfilled, (state, action) => {
        if (action.payload?.status && action.payload?.data) {
          // Update the live user in the state
          const updatedUser = action.payload.data

          state.user = state.user.map(user => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user))
        }
      })

      .addCase(deleteLiveUser.fulfilled, (state, action) => {
        if (action.payload?.status) {
          // Remove the deleted live user from the state
          state.user = state.user.filter(user => user._id !== action.payload.streamerId)
          if (state.total) state.total -= 1
        }
      })

      .addCase(toggleStreamingStatus.fulfilled, (state, action) => {
        if (action.payload?.status && action.payload?.data) {
          // Update the isStreaming status in the state
          const updatedUser = action.payload.data

          state.user = state.user.map(user =>
            user._id === updatedUser._id ? { ...user, isStreaming: updatedUser.isStreaming } : user
          )
        }
      })

    // Profile Visitors Reducers
    builder
      .addCase(fetchProfileVisitors.pending, state => {
        const tab = state.modalLoading.visitors

        tab.loading = true

        if (tab.page === 1) {
          tab.initialLoading = true

          // Reset data when loading first page
          state.modalData.visitors = []
        }
      })
      .addCase(fetchProfileVisitors.fulfilled, (state, action) => {
        const tab = state.modalLoading.visitors
        const payload = action.payload || {}

        tab.initialLoading = false
        tab.loading = false

        if (payload.status) {
          const newData = payload.visitors || []
          const requestedLimit = action.meta?.arg?.limit || 20
          const totalItems = payload.total || 0

          // Create a Set of existing IDs for O(1) lookup
          const existingIds = new Set(state.modalData.visitors.map(item => item._id))

          // Filter out duplicates
          const uniqueNewData = newData.filter(item => !existingIds.has(item._id))

          const currentTotal = state.modalData.visitors.length + uniqueNewData.length
          const isEnd = currentTotal >= totalItems || newData.length === 0 || newData.length < requestedLimit

          tab.page += 1
          tab.reachedEnd = isEnd

          const enhancedData = uniqueNewData.map(item => ({
            ...item,
            _response: {
              total: totalItems
            }
          }))

          state.modalData.visitors = [...state.modalData.visitors, ...enhancedData]
        } else {
          tab.reachedEnd = true
          toast.error(payload.message || 'Something went wrong')
        }
      })

    // Visited Profiles Reducers
    builder
      .addCase(fetchVisitedProfiles.pending, state => {
        const tab = state.modalLoading.visited

        tab.loading = true

        if (tab.page === 1) {
          tab.initialLoading = true

          // Reset data when loading first page
          state.modalData.visited = []
        }
      })
      .addCase(fetchVisitedProfiles.fulfilled, (state, action) => {
        const tab = state.modalLoading.visited
        const payload = action.payload || {}

        tab.initialLoading = false
        tab.loading = false

        if (payload.status) {
          const newData = payload.visitedProfiles || []
          const requestedLimit = action.meta?.arg?.limit || 20
          const totalItems = payload.total || 0

          // Create a Set of existing IDs for O(1) lookup
          const existingIds = new Set(state.modalData.visited.map(item => item._id))

          // Filter out duplicates
          const uniqueNewData = newData.filter(item => !existingIds.has(item._id))

          const currentTotal = state.modalData.visited.length + uniqueNewData.length
          const isEnd = currentTotal >= totalItems || newData.length === 0 || newData.length < requestedLimit

          tab.page += 1
          tab.reachedEnd = isEnd

          const enhancedData = uniqueNewData.map(item => ({
            ...item,
            _response: {
              total: totalItems
            }
          }))

          state.modalData.visited = [...state.modalData.visited, ...enhancedData]
        } else {
          tab.reachedEnd = true
          toast.error(payload.message || 'Something went wrong')
        }
      })
  }
})

export const {
  setSearchQuery,
  setPage,
  setPageSize,
  setType,
  setStreamType,
  setFilters,
  resetModalTab,
  resetUserState,
  resetHistoryState,
  setHistoryActiveType,
  setDateRange,
  ensurePageIsSet
} = userSlice.actions

export default userSlice.reducer
