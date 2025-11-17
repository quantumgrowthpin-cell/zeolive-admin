import apiClientV2 from './apiClient'

export const listAgencyCommissions = async () => {
  const response = await apiClientV2.get('/admin/agency-commissions')

  
return response.data?.data || []
}

export const createAgencyCommission = async payload => {
  const response = await apiClientV2.post('/admin/agency-commissions', payload)

  
return response.data?.data
}

export const updateAgencyCommission = async (id, payload) => {
  const response = await apiClientV2.patch(`/admin/agency-commissions/${id}`, payload)

  
return response.data?.data
}

export const deleteAgencyCommission = async id => {
  await apiClientV2.delete(`/admin/agency-commissions/${id}`)
  
return true
}
