export const getBrowserDeviceId = () => {
  if (typeof window === 'undefined') return 'server-device'

  const storageKey = 'v2_device_id'
  let deviceId = localStorage.getItem(storageKey)

  if (!deviceId) {
    const uuid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    deviceId = uuid
    localStorage.setItem(storageKey, deviceId)
  }

  
return deviceId
}

export const getDeviceProfile = () => {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'server-device',
      platform: 'server',
      model: 'node',
      appVersion: 'admin-v2'
    }
  }

  return {
    deviceId: getBrowserDeviceId(),
    platform: navigator.platform || 'web',
    model: navigator.userAgent || 'browser',
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || 'admin-v2'
  }
}
