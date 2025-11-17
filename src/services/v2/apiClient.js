import axios from 'axios'

import { v2ApiBaseURL } from '@/util/config'
import { clearV2AuthState } from '@/util/v2-auth'

const apiBase = (v2ApiBaseURL || 'http://localhost:5000/v1').replace(/\/$/, '')

const apiClientV2 = axios.create({
  baseURL: apiBase,
  timeout: 20000
})

const getAccessToken = () => {
  if (typeof window === 'undefined') return null

  return sessionStorage.getItem('v2_access_token')
}

const setAccessToken = token => {
  if (typeof window === 'undefined' || !token) return
  sessionStorage.setItem('v2_access_token', token)
}

const setRefreshToken = token => {
  if (typeof window === 'undefined' || !token) return
  sessionStorage.setItem('v2_refresh_token', token)
}

const getRefreshToken = () => {
  if (typeof window === 'undefined') return null

  return sessionStorage.getItem('v2_refresh_token')
}

export const persistTokens = tokens => {
  if (!tokens) return
  setAccessToken(tokens.accessToken)
  setRefreshToken(tokens.refreshToken)

  if (typeof window !== 'undefined') {
    sessionStorage.setItem('v2_session_id', tokens.sessionId || '')
  }
}

const refreshTokens = async () => {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  const response = await axios.post(
    `${apiBase}/auth/refresh`,
    { refreshToken },
    {
      timeout: 15000
    }
  )

  const tokens = response.data?.data

  if (!tokens) {
    throw new Error('Unable to refresh tokens')
  }

  persistTokens(tokens)

  return tokens.accessToken
}

let refreshPromise = null

apiClientV2.interceptors.request.use(
  config => {
    const token = getAccessToken()

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json'

    return config
  },
  error => Promise.reject(error)
)

apiClientV2.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status
    const originalRequest = error.config

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens()
        }

        const newAccessToken = await refreshPromise

        refreshPromise = null

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

        return apiClientV2(originalRequest)
      } catch (refreshError) {
        refreshPromise = null
        clearV2AuthState()

        if (typeof window !== 'undefined') {
          window.location.replace('/login')
        }

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClientV2
