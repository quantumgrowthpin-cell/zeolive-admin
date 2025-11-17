import apiClientV2 from './apiClient'

export const listReportReasons = async () => {
  const response = await apiClientV2.get('/admin/report-reasons')

  
return response.data?.data || []
}

export const createReportReason = async payload => {
  const response = await apiClientV2.post('/admin/report-reasons', payload)

  
return response.data?.data
}

export const updateReportReason = async (reasonId, payload) => {
  const response = await apiClientV2.patch(`/admin/report-reasons/${reasonId}`, payload)

  
return response.data?.data
}

export const deleteReportReason = async reasonId => {
  await apiClientV2.delete(`/admin/report-reasons/${reasonId}`)
  
return true
}
