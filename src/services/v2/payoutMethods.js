import apiClientV2 from './apiClient'

export const listPayoutMethods = async () => {
  const response = await apiClientV2.get('/admin/payout-methods')

  
return response.data?.data || []
}

export const createPayoutMethod = async payload => {
  const response = await apiClientV2.post('/admin/payout-methods', payload)

  
return response.data?.data
}

export const updatePayoutMethod = async (id, payload) => {
  const response = await apiClientV2.patch(`/admin/payout-methods/${id}`, payload)

  
return response.data?.data
}

export const deletePayoutMethod = async id => {
  await apiClientV2.delete(`/admin/payout-methods/${id}`)
  
return true
}
