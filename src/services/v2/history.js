import apiClientV2 from './apiClient'

export const listLikeHistory = async params => {
  const response = await apiClientV2.get('/admin/history/likes', { params })

  
return response.data || { data: [], meta: {} }
}

export const listLiveHistory = async params => {
  const response = await apiClientV2.get('/admin/history/live-sessions', { params })

  
return response.data || { data: [], meta: {} }
}
