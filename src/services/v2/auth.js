import apiClientV2, { persistTokens } from './apiClient'

import { getDeviceProfile } from '@/util/device'
import { clearV2AuthState, getStoredSessionId } from '@/util/v2-auth'

export const exchangeFirebaseToken = async ({ firebaseIdToken, profile = {}, device }) => {
  const devicePayload = device || getDeviceProfile()

  const response = await apiClientV2.post('/auth/exchange', {
    firebaseIdToken,
    profile,
    device: devicePayload
  })

  const payload = response.data?.data

  if (!payload) {
    throw new Error('Invalid authentication response')
  }

  persistTokens(payload.tokens)

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('v2_user', JSON.stringify(payload.user))
    sessionStorage.setItem('v2_roles', JSON.stringify(payload.user?.roles || []))
    sessionStorage.setItem('uid', payload.user?.id || '')
  }

  return payload
}

export const fetchAdminDashboard = async () => {
  const response = await apiClientV2.get('/admin/dashboard')

  return response.data?.data || {}
}

export const loginWithPassword = async ({ email, password, device }) => {
  const payload = {
    email,
    password,
    device: device || getDeviceProfile()
  }

  const response = await apiClientV2.post('/auth/login', payload)
  const data = response.data?.data

  if (!data) {
    throw new Error('Invalid authentication response')
  }

  persistTokens(data.tokens)

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('v2_user', JSON.stringify(data.user))
    sessionStorage.setItem('v2_roles', JSON.stringify(data.user?.roles || []))
    sessionStorage.setItem('uid', data.user?.id || '')
  }

  return data
}

export const registerAdmin = async ({ email, password, displayName, inviteCode }) => {
  const response = await apiClientV2.post('/auth/admin/register', {
    email,
    password,
    displayName,
    inviteCode
  })

  return response.data?.data
}

export const logoutCurrentSession = async () => {
  const sessionId = getStoredSessionId()

  if (sessionId) {
    try {
      await apiClientV2.post(`/auth/sessions/${sessionId}/revoke`)
    } catch (err) {
      // ignore errors during logout
      console.warn('Failed to revoke session', err?.response?.data || err.message)
    }
  }

  clearV2AuthState()
}

export const validateExistingSession = () => {
  if (typeof window === 'undefined') return null
  
return sessionStorage.getItem('v2_access_token')
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  const response = await apiClientV2.post('/auth/change-password', {
    currentPassword,
    newPassword
  })

  return response.data?.data
}
