import apiClientV2 from './apiClient'

export const listBlocklist = async params => {
  const response = await apiClientV2.get('/admin/blocklist', { params })

  
return response.data || { data: [], meta: {} }
}

export const unblockEntry = async blockId => {
  await apiClientV2.delete(`/admin/blocklist/${blockId}`)
  
return true
}
