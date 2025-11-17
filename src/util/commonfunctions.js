import { Badge, styled } from '@mui/material'

import { backendBaseURL } from './config'

export const getFullImageUrl = imgPath => {
  if (!imgPath) return ''

  // If already a full URL, return as is
  if (imgPath.includes('http://') || imgPath.includes('https://')) {
    return imgPath
  }

  // Clean up the path - remove leading slashes, storage/, uploads/ prefixes
  let cleanPath = imgPath.replace(/^[\\\/]+/, '') // Remove leading slashes
  cleanPath = cleanPath.replace(/^storage[\\\/]/, '') // Remove storage/ prefix
  cleanPath = cleanPath.replace(/^uploads[\\\/]/, '') // Remove uploads/ prefix

  // Construct full URL with backend base URL
  return `${backendBaseURL}/uploads/${cleanPath}`
}

export const getUserViewUrl = userId => {
  return `/apps/user/view?userId=${userId}`
}

export const SmallBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    fontSize: '10px',
    height: '16px',
    minWidth: '16px',
    padding: '0 4px',
    top: '5px',
    right: '5px'
  }
}))

export const getRoleDetails = role => {
  switch (role) {
    case 1:
      return { label: 'User', icon: 'tabler-user', color: 'primary' }
    case 2:
      return { label: 'Host', icon: 'tabler-users-plus', color: 'success' }
    case 3:
      return { label: 'Agency', icon: 'tabler-users-group', color: 'warning' }
    case 4:
      return { label: 'CoinTrader', icon: 'tabler-coins', color: 'info' }
    default:
      return { label: 'Unknown', icon: 'tabler-alert-circle', color: 'error' }
  }
}

export const getFormattedDate = date => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  })
}

export const getFormattedDateWithoutTime = date => {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const emojiToCountryFlag = emoji => {
  if (!emoji) return ''

  if (emoji.includes('https')) {
    return <img src={emoji} alt={`${emoji} flag`} width={20} height={14} style={{ borderRadius: '2px' }} />
  }

  const codePoints = [...emoji] // properly spreads Unicode flags like 🇮🇳 into ["🇮", "🇳"]

  if (codePoints.length !== 2) return ''

  const countryCode = String.fromCharCode(
    codePoints[0].codePointAt(0) - 127397,
    codePoints[1].codePointAt(0) - 127397
  ).toLowerCase()

  return (
    <img
      src={`https://flagcdn.com/w40/${countryCode}.png`}
      alt={`${countryCode} flag`}
      width={20}
      height={14}
      style={{ borderRadius: '2px' }}
    />
  )
}
