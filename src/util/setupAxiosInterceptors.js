import axios from 'axios'

import { refreshFirebaseToken, isRememberMeEnabled } from './firebase-auth'
import { handleLogout } from './auth-interceptor'
import { configureAxiosAuth } from './auth-headers'

configureAxiosAuth(axios)

axios.interceptors.request.use(
  config => {
    if (config.data instanceof FormData || (typeof window !== 'undefined' && config.data instanceof window.FormData)) {
      delete config.headers['Content-Type']
    }

    return config
  },
  error => Promise.reject(error)
)

axios.interceptors.response.use(
  response => response,
  async error => {
    const status = error.response?.status
    const data = error.response?.data || {}

    console.log('API Error:', {
      status,
      message: data.message,
      error: data.error,
      url: error.config?.url
    })

    if (status === 401) {
      const isExpired =
        data.error?.includes?.('expired') ||
        data.message?.includes?.('expired') ||
        data.msg?.includes?.('expired') ||
        (typeof data.message === 'string' &&
          (data.message.includes('Invalid or expired token') || data.message.includes('Authorization failed')))

      if (isExpired) {
        console.log('Token expired, checking remember me status...')

        if (isRememberMeEnabled()) {
          try {
            console.log('Remember Me is enabled, refreshing token...')

            const newToken = await refreshFirebaseToken()

            error.config.headers['Authorization'] = `Bearer ${newToken}`

            return axios(error.config)
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError)

            await handleLogout()

            return Promise.reject(error)
          }
        } else {
          console.log('Remember Me is NOT enabled, logging out...')

          await handleLogout()

          return Promise.reject(error)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default function setupAxiosInterceptors() {}
