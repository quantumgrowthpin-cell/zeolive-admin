export const clearV2AuthState = () => {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem('v2_access_token')
  sessionStorage.removeItem('v2_refresh_token')
  sessionStorage.removeItem('v2_session_id')
  sessionStorage.removeItem('v2_user')
  sessionStorage.removeItem('v2_roles')
  sessionStorage.removeItem('uid')
}

export const getStoredSessionId = () => {
  if (typeof window === 'undefined') return null
  
return sessionStorage.getItem('v2_session_id')
}
