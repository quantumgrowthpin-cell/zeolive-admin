import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'

import { toast } from 'react-toastify'

// 🔐 Firebase (modular)
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'

import { baseURL, key } from '@/util/config'

import { auth } from '@/libs/firebase'

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

const normalizeLicenseKey = (...candidates) => {
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return ''
}

const postAdminRegistration = async ({ email, password, uid, licenseKey, purchaseCode, privateKey, token }) => {
  const normalizedLicenseKey = normalizeLicenseKey(licenseKey, purchaseCode)

  if (!email || !password || !normalizedLicenseKey || !uid) {
    throw new Error('Email, password, license key, and uid are required')
  }

  const payload = {
    email,
    password,
    uid,
    licenseKey: normalizedLicenseKey,
    purchaseCode: normalizedLicenseKey,
    privateKey
  }

  const headers = {
    'Content-Type': 'application/json',
    key: key,
    Authorization: token ? `Bearer ${token}` : '',
    'x-auth-adm': uid,
    'x-admin-password': password
  }

  const response = await axios.post(`${baseURL}/api/admin/admin/registerAdmin`, payload, {
    headers,
    timeout: 15000
  })

  return response.data
}

export const loginAdmin = createAsyncThunk(
  'api/admin/admin/adminLogin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${baseURL}/api/admin/admin/adminLogin`,
        { email, password },
        {
          headers: getAuthHeaders()
        }
      )

      return response.data
    } catch (err) {
      // Improved error handling
      const errorMessage = err.response?.data?.message || err.message || 'Login failed'

      return rejectWithValue(errorMessage)
    }
  }
)

/**
 * registerUser — Transaction-like registration
 * 1) Create Firebase user
 * 2) Call backend registration
 * 3) On ANY backend failure (non-2xx / timeout / network), delete the just-created Firebase user
 *    so the same email can retry immediately.
 */
// In /Admin Panel/admin/src/redux-store/slices/admin.js
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ email, password, purchaseCode, privateKey }, { rejectWithValue }) => {
    let createdThisAttempt = false

    try {
      // Validate required fields
      if (!email || !password || !purchaseCode) {
        throw new Error('Email, password, and purchase code are required')
      }

      console.log('Starting registration with:', {
        email,
        hasPassword: !!password,
        purchaseCode,
        hasPrivateKey: !!privateKey
      })

      const licenseKey = normalizeLicenseKey(purchaseCode)

      if (!licenseKey) {
        throw new Error('Purchase code is required')
      }

      // Create Firebase user
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      createdThisAttempt = true

      const idToken = await user.getIdToken()
      const uid = user.uid

      const response = await postAdminRegistration({
        email,
        password,
        uid,
        licenseKey,
        purchaseCode,
        privateKey,
        token: idToken
      })

      if (!response.status) {
        throw new Error(response.message || 'Registration failed')
      }

      console.log('Registration successful:', response)
      
return response
    } catch (err) {
      console.error('Registration failed:', err)

      // If Firebase user was created but backend failed, cleanup
      if (createdThisAttempt) {
        try {
          const current = auth.currentUser

          if (current) await deleteUser(current)
        } catch (cleanupError) {
          console.error('Failed to cleanup Firebase user:', cleanupError)
        }
      }

      return rejectWithValue(err.message || 'Registration failed')
    }
  }
)

export const signInAdmin = createAsyncThunk(
  '/api/admin/admin/registerAdmin',
  async ({ email, password, uid, licenseKey, privateKey, purchaseCode }, { rejectWithValue }) => {
    try {
      const normalizedLicenseKey = normalizeLicenseKey(licenseKey, purchaseCode)

      if (!normalizedLicenseKey) {
        throw new Error('License key is required')
      }

      const activeUser = auth.currentUser

      if (!activeUser) {
        throw new Error('Please sign in with Firebase before registering admin.')
      }

      const token = await activeUser.getIdToken()
      const resolvedUid = uid || activeUser.uid

      console.log('Registration request data:', {
        email,
        uid: resolvedUid,
        licenseKey: normalizedLicenseKey,
        hasPassword: !!password,
        hasPrivateKey: !!privateKey
      })

      const response = await postAdminRegistration({
        email,
        password,
        uid: resolvedUid,
        licenseKey: normalizedLicenseKey,
        purchaseCode,
        privateKey,
        token
      })

      if (!response.status) {
        throw new Error(response.message || 'Registration failed')
      }

      return response
    } catch (err) {
      // Improved error handling
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed'

      console.error('Registration error:', {
        message: errorMessage,
        response: err.response?.data,
        status: err.response?.status
      })
      
return rejectWithValue(errorMessage)
    }
  }
)

export const loginSubAdmin = createAsyncThunk(
  'api/admin/subAdmin/subAdminLogin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${baseURL}/api/admin/subAdmin/subAdminLogin`,
        { email, password },
        {
          headers: getAuthHeaders()
        }
      )

      return response.data
    } catch (err) {
      // Improved error handling
      const errorMessage = err.response?.data?.message || err.message || 'Login failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const getDashboardData = createAsyncThunk(
  'api/admin/dashboard/dashboardMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${baseURL}/api/admin/dashboard/dashboardMetrics`, {
        headers: getAuthHeaders()
      })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dashboard data'

      return rejectWithValue(errorMessage)
    }
  }
)

export const requestPasswordReset = createAsyncThunk(
  'api/admin/admin/requestPasswordReset',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${baseURL}/api/admin/admin/requestPasswordReset`, {
        params: { email },
        headers: getAuthHeaders()
      })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset request failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const resetPassword = createAsyncThunk(
  'api/admin/admin/resetPassword',
  async ({ newPassword, confirmPassword, token, uid }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${baseURL}/api/admin/admin/resetPassword`,
        { newPassword, confirmPassword },
        {
          headers: {
            'Content-Type': 'application/json',
            key: key,
            Authorization: `Bearer ${token}`,
            'x-auth-adm': uid
          }
        }
      )

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password reset failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const getAdminProfile = createAsyncThunk('api/admin/admin/getAdminProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await axios.get(`${baseURL}/api/admin/admin/getAdminProfile`, {
      headers: getAuthHeaders()
    })

    return response.data
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile'

    return rejectWithValue(errorMessage)
  }
})

export const updateAdminProfile = createAsyncThunk(
  'api/admin/admin/updateAdminProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${baseURL}/api/admin/admin/updateAdminProfile`, formData, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' }
      })

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Profile update failed'

      return rejectWithValue(errorMessage)
    }
  }
)

export const changePassword = createAsyncThunk(
  'api/admin/admin/changePassword',
  async ({ oldPass, newPass, confirmPass }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${baseURL}/api/admin/admin/changePassword`,
        { oldPass, newPass, confirmPass },
        {
          headers: getAuthHeaders()
        }
      )

      return response.data
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Password change failed'

      return rejectWithValue(errorMessage)
    }
  }
)

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    loading: false,
    user: null,
    error: null,
    resetStatus: null,
    profileData: null,
    passwordChangeStatus: null,
    profileUpdateStatus: null,
    loginStatus: 'idle' // Added to track login status
  },
  reducers: {
    clearResetStatus: state => {
      state.resetStatus = null
    },

    clearPasswordChangeStatus: state => {
      state.passwordChangeStatus = null
    },

    clearError: state => {
      state.error = null
    },

    logoutAdmin: state => {
      // Clear auth data from sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('uid')
        sessionStorage.removeItem('admin_token')
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('manual_login_in_progress')
      }

      // Reset the state to initial values
      state.user = null
      state.error = null
      state.loading = false
      state.resetStatus = null
      state.profileData = null
      state.passwordChangeStatus = null
      state.profileUpdateStatus = null
      state.loginStatus = 'idle'
    },

    logoutSubAdmin: state => {
      // Clear auth data from sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('suid')
        sessionStorage.removeItem('subadmin_token')
        sessionStorage.removeItem('subadmin')
        sessionStorage.removeItem('isSubAdmin')
        sessionStorage.removeItem('manual_login_in_progress')
      }

      // Reset the state to initial values
      state.subAdmin = null
      state.isSubAdmin = false
      state.error = null
      state.loading = false
      state.loginStatus = 'idle'
    },

    clearProfileUpdateStatus: state => {
      state.profileUpdateStatus = null
    }
  },
  extraReducers: builder => {
    builder

      // Login Admin
      .addCase(loginAdmin.pending, state => {
        state.loading = true
        state.error = null
        state.loginStatus = 'pending'
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.loginStatus = 'success'

        // Store user data in sessionStorage
        if (typeof window !== 'undefined' && action.payload && action.payload.admin) {
          const user = {
            name: action.payload.admin.name,
            email: action.payload.admin.email,
            image: action.payload.admin.image
          }

          sessionStorage.setItem('user', JSON.stringify(user))
        }
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.loginStatus = 'failed'
      })

      .addCase(signInAdmin.pending, state => {
        state.loading = true
        state.error = null
        state.loginStatus = 'pending'
      })
      .addCase(signInAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload

        if (action.payload.status) {
          state.loginStatus = 'success'
          console.log(action.payload)
          toast.success(action.payload.message)
        } else {
          state.loginStatus = 'failed'
          console.log(action.payload)
          toast.error(action.payload.message)
        }

        // // Store user data in localStorage
        // if (typeof window !== 'undefined' && action.payload && action.payload.admin) {
        //   const user = {
        //     name: action.payload.admin.name,
        //     email: action.payload.admin.email,
        //     image: action.payload.admin.image
        //   }

        //   localStorage.setItem('user', JSON.stringify(user))
        // }
      })
      .addCase(signInAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.loginStatus = 'failed'
        console.log(action.payload)
        toast.error(action.payload)
      })

      .addCase(loginSubAdmin.pending, state => {
        state.loading = true
        state.error = null
        state.loginStatus = 'pending'
      })
      .addCase(loginSubAdmin.fulfilled, (state, action) => {
        state.loading = false
        state.subAdmin = action.payload.data
        state.isSubAdmin = true
        state.loginStatus = 'success'

        // Store subAdmin data in sessionStorage
        if (typeof window !== 'undefined' && action.payload && action.payload.data) {
          const subAdmin = {
            name: action.payload.data.name,
            email: action.payload.data.email,
            permissions: action.payload.data.permissions || []
          }

          sessionStorage.setItem('subadmin', JSON.stringify(subAdmin))
          sessionStorage.setItem('isSubAdmin', 'true'); // ✅ Store as string
        }
      })
      .addCase(loginSubAdmin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.loginStatus = 'failed'
      })

      // Dashboard Data
      .addCase(getDashboardData.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(getDashboardData.fulfilled, (state, action) => {
        state.loading = false
        state.dashboardData = action.payload
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Request Password Reset
      .addCase(requestPasswordReset.pending, state => {
        state.loading = true
        state.error = null
        state.resetStatus = 'pending'
      })
      .addCase(requestPasswordReset.fulfilled, state => {
        state.loading = false
        state.resetStatus = 'email_sent'
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.resetStatus = 'failed'
      })

      // Reset Password
      .addCase(resetPassword.pending, state => {
        state.loading = true
        state.error = null
        state.resetStatus = 'pending'
      })
      .addCase(resetPassword.fulfilled, state => {
        state.loading = false
        state.resetStatus = 'success'
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.resetStatus = 'failed'
      })

      // Get Admin Profile
      .addCase(getAdminProfile.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(getAdminProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profileData = action.payload.data
      })
      .addCase(getAdminProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update Admin Profile
      .addCase(updateAdminProfile.pending, state => {
        state.loading = true
        state.error = null
        state.profileUpdateStatus = 'pending'
      })
      .addCase(updateAdminProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profileData = action.payload.data || state.profileData
        state.profileUpdateStatus = 'success'
      })
      .addCase(updateAdminProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.profileUpdateStatus = 'failed'
      })

      // Change Password
      .addCase(changePassword.pending, state => {
        state.loading = true
        state.error = null
        state.passwordChangeStatus = 'pending'
      })
      .addCase(changePassword.fulfilled, state => {
        state.loading = false
        state.passwordChangeStatus = 'success'
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.passwordChangeStatus = 'failed'
      })
  }
})

export const { clearResetStatus, logoutAdmin, clearPasswordChangeStatus, clearProfileUpdateStatus, clearError, logoutSubAdmin } =
  adminSlice.actions

export default adminSlice.reducer
