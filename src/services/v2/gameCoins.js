import apiClientV2 from './apiClient'

export const fetchGameCoinLedger = async () => {
  const response = await apiClientV2.get('/admin/game-coins')

  
return response.data?.data
}

export const adjustGameCoins = async delta => {
  const response = await apiClientV2.post('/admin/game-coins/adjust', { delta })

  
return response.data?.data
}
